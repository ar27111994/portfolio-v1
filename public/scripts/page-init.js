// Wrap all UI initialisation in astro:page-load so it re-runs after
// every ClientRouter (View Transitions) navigation, not just the first load.
//
// Tiered execution — avoids blocking the main thread (input delay fix):
//   Tier 1 — synchronous:          scrollspy IntersectionObserver setup only
//   Tier 2 — setTimeout(0):        API fetches (feed, GitHub, Upwork badge)
//   Tier 3 — requestIdleCallback:  img onerror wiring (40+ elements, idle only)
function initPage() {
  // ── TIER 1: scrollspy — synchronous, must be ready on first paint ──────────
  (function setupScrollspy() {
    const spyLinks = document.querySelectorAll(".anchor-rail a[data-spy]");
    if (!spyLinks.length) return;
    const targets = [];
    spyLinks.forEach((link) => {
      const id = link.dataset.spy;
      const el = document.getElementById(id);
      if (el) targets.push({ link, el });
    });
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = targets.find((t) => t.el === entry.target);
          if (!match) return;
          if (entry.isIntersecting) {
            spyLinks.forEach((l) => l.classList.remove("is-active"));
            match.link.classList.add("is-active");
          }
        });
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
    );
    targets.forEach(({ el }) => observer.observe(el));
  })();

  // ── TIER 1b: scroll-reveal animations ────────────────────────────────────────
  (function setupScrollReveal() {
    const revealEls = document.querySelectorAll(".reveal");
    if (!revealEls.length) return;
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -40px 0px", threshold: 0.1 },
    );
    revealEls.forEach((el) => revealObserver.observe(el));
  })();

  // ── TIER 1c: nav scroll state — compact top-bar on scroll ──────────────────
  (function setupNavScrollState() {
    const topBar = document.querySelector(".top-bar");
    if (!topBar) return;
    let ticking = false;
    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          topBar.classList.toggle("is-scrolled", window.scrollY > 60);
          ticking = false;
        });
        ticking = true;
      }
    };
    document.addEventListener("scroll", onScroll, { passive: true });
  })();

  // ── TIER 2: defer API fetches — yield to browser first ───────────────────
  setTimeout(function deferredFetches() {
    // Defer DOM queries too — avoids forced layout on main thread before first paint
    const widget = document.querySelector("[data-feed-widget]");
    const status = document.querySelector("[data-feed-status]");
    const list = document.querySelector("[data-feed-list]");

    const fallbackItems = [
      ...document.querySelectorAll(".fallback-feed .support-card"),
    ]
      .slice(0, 4)
      .map((card) => ({
        title: card.querySelector(".support-name")?.textContent?.trim(),
        url: card.href,
        source:
          card.querySelector(".support-note")?.textContent?.trim() || "Curated",
      }));

    // Show fallback immediately, then replace with live data when ready
    renderFeed(
      { widget, status, list },
      [{ title: "Fetching live content from dev.to, GitHub, HN…", url: "#", source: "Loading", icon: "", tag: "Live" }],
      "Fetching live feed data…",
    );

    loadGitHubProofStats();
    loadFeed(widget, status, list);
    loadUpworkPortfolio();
  }, 0);

  // ── TIER 3: idle — wire onerror on all 40+ Upwork imgs ───────────────────
  const wireImageFallbacks = function () {
    document
      .querySelectorAll("img[data-upwork-image-fallbacks]")
      .forEach((img) => {
        if (img.dataset.fallbackWired) return; // idempotent on re-navigation
        img.dataset.fallbackWired = "1";
        img.addEventListener("error", function onUpworkImgError() {
          const fallbacks = JSON.parse(
            this.dataset.upworkImageFallbacks || "[]",
          );
          const idx = Number(this.dataset.upworkImageIndex || 0) + 1;
          if (idx < fallbacks.length) {
            this.dataset.upworkImageIndex = String(idx);
            this.src = fallbacks[idx];
          } else {
            this.removeEventListener("error", onUpworkImgError);
            this.remove();
          }
        });
      });
  };
  if ("requestIdleCallback" in window) {
    requestIdleCallback(wireImageFallbacks, { timeout: 2000 });
  } else {
    setTimeout(wireImageFallbacks, 200);
  }

  // ── feed / GitHub / Upwork functions follow ───────────────────────────────
  // widget/status/list/fallbackItems are now passed in from the deferred setTimeout
  // to avoid forced layout queries on the main thread at page load.

  function renderFeed(ctx, items, message) {
    if (!ctx.widget || !ctx.status || !ctx.list) return;
    ctx.list.innerHTML = "";
    items.slice(0, 12).forEach((item) => {
      const a = document.createElement("a");
      a.className = "feed-item";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      // Icon
      if (item.icon) {
        const iconWrap = document.createElement("span");
        iconWrap.className = "feed-item-icon";
        const img = document.createElement("img");
        img.src = item.icon;
        img.alt = "";
        img.width = 16;
        img.height = 16;
        img.loading = "lazy";
        iconWrap.appendChild(img);
        a.appendChild(iconWrap);
      }
      // Body
      const body = document.createElement("span");
      body.className = "feed-item-body";
      if (item.tag) {
        const tag = document.createElement("span");
        tag.className = "feed-item-tag";
        tag.textContent = item.tag;
        body.appendChild(tag);
      }
      const title = document.createElement("strong");
      title.textContent = item.title;
      body.appendChild(title);
      const meta = document.createElement("small");
      meta.textContent = `${item.source} · ${item.date}`;
      body.appendChild(meta);
      a.appendChild(body);
      ctx.list.appendChild(a);
    });
    ctx.status.textContent = message;
  }

  function compactNumber(value) {
    return Intl.NumberFormat(undefined, {
      notation: value >= 1000 ? "compact" : "standard",
      maximumFractionDigits: 1,
    }).format(value);
  }

  let _githubFetchAttempted = false;

  async function loadGitHubProofStats() {
    if (_githubFetchAttempted) return;
    _githubFetchAttempted = true;

    const repoMetrics = document.querySelectorAll(
      '[data-proof-value="githubRepos"]',
    );
    const starMetrics = document.querySelectorAll(
      '[data-proof-value="githubStars"]',
    );
    const proofStatuses = document.querySelectorAll("[data-proof-status]");
    if (!repoMetrics.length && !starMetrics.length) return;

    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const [profileResponse, reposResponse] = await Promise.all([
        fetch("https://api.github.com/users/ar27111994", {
          signal: controller.signal,
        }),
        fetch(
          "https://api.github.com/users/ar27111994/repos?per_page=100&sort=updated",
          { signal: controller.signal },
        ),
      ]);

      clearTimeout(timeout);

      if (!profileResponse.ok || !reposResponse.ok) return;
      const profile = await profileResponse.json();
      const repos = await reposResponse.json();
      if (!Array.isArray(repos)) return;
      const publicRepoCount = Number(profile.public_repos) || repos.length;
      const totalStars = repos.reduce(
        (sum, repo) => sum + (Number(repo.stargazers_count) || 0),
        0,
      );
      repoMetrics.forEach((metric) => {
        metric.textContent = compactNumber(publicRepoCount);
      });
      starMetrics.forEach((metric) => {
        metric.textContent = compactNumber(totalStars);
      });
      proofStatuses.forEach((statusNode) => {
        statusNode.textContent = `Live GitHub proof synced: ${publicRepoCount} public repos · ${totalStars} total stars.`;
      });
    } catch {
      // GitHub API unavailable — static fallback values remain visible.
      // No console error: this is expected behind shared IPs / rate limits.
    }
  }

  async function loadFeed(widget, status, list) {
    const ctx = { widget, status, list };
    const items = [];

    // dev.to articles
    try {
      const devto = await fetch("https://dev.to/api/articles?username=ar27111994&per_page=6");
      if (devto.ok) {
        const articles = await devto.json();
        articles.forEach((article) =>
          items.push({
            title: article.title,
            url: article.url,
            source: "Dev.to",
            date: new Date(article.published_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
            icon: "/brand-icons/devdotto.svg",
            tag: article.tag_list?.[0] || "Article",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    // GitHub updated repos
    try {
      const repos = await fetch("https://api.github.com/users/ar27111994/repos?sort=updated&per_page=4");
      if (repos.ok) {
        const data = await repos.json();
        data.forEach((repo) =>
          items.push({
            title: repo.name,
            url: repo.html_url,
            source: "GitHub",
            date: new Date(repo.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            icon: "/brand-icons/github.svg",
            tag: repo.language || "Repo",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    // HN posts via Algolia
    try {
      const hn = await fetch("https://hn.algolia.com/api/v1/search?tags=author_ar27111994&hitsPerPage=3");
      if (hn.ok) {
        const data = await hn.json();
        (data.hits || []).forEach((hit) =>
          items.push({
            title: hit.title || hit.story_title,
            url: hit.url || `https://news.ycombinator.com/item?id=${hit.objectID}`,
            source: "Hacker News",
            date: new Date(hit.created_at).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
            icon: "/brand-icons/ycombinator.svg",
            tag: "HN",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    // GitHub gists
    try {
      const gists = await fetch("https://api.github.com/users/ar27111994/gists?per_page=3");
      if (gists.ok) {
        const data = await gists.json();
        data.forEach((gist) =>
          items.push({
            title: Object.keys(gist.files || {})[0] || "Gist",
            url: gist.html_url,
            source: "GitHub",
            date: new Date(gist.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" }),
            icon: "/brand-icons/github.svg",
            tag: "Gist",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    // Hashnode articles
    try {
      const hashnode = await fetch("https://gql.hashnode.com/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: `{ user(username: "ar27111994") { publication { posts(first: 3) { edges { node { title slug dateAdded } } } } } }` }),
      });
      if (hashnode.ok) {
        const data = await hashnode.json();
        const posts = data?.data?.user?.publication?.posts?.edges || [];
        posts.forEach(({ node }) =>
          items.push({
            title: node.title,
            url: `https://hashnode.com/post/${node.slug}`,
            source: "Hashnode",
            date: new Date(node.dateAdded).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
            icon: "/brand-icons/hashnode.svg",
            tag: "Blog",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    // CoderLegion posts (via server-side proxy)
    try {
      const cl = await fetch("/api/coderlegion-feed");
      if (cl.ok) {
        const data = await cl.json();
        (data.posts || []).forEach((post) =>
          items.push({
            title: post.title,
            url: post.url,
            source: "CoderLegion",
            date: new Date(post.date).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
            icon: "/brand-icons/coderlegion.svg",
            tag: post.tag || "Post",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    // X/Twitter tweets (via server-side proxy)
    try {
      const twitter = await fetch("/api/twitter-feed");
      if (twitter.ok) {
        const data = await twitter.json();
        (data.tweets || []).forEach((tweet) =>
          items.push({
            title: tweet.title,
            url: tweet.url,
            source: "X/Twitter",
            date: new Date(tweet.date).toLocaleDateString(undefined, { month: "short", year: "numeric" }),
            icon: "/brand-icons/x.svg",
            tag: tweet.tag || "Tweet",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    // LinkedIn posts (via server-side proxy)
    try {
      const linkedin = await fetch("/api/linkedin-feed");
      if (linkedin.ok) {
        const data = await linkedin.json();
        (data.posts || []).forEach((post) =>
          items.push({
            title: post.title,
            url: post.url,
            source: "LinkedIn",
            date: post.date ? new Date(post.date).toLocaleDateString(undefined, { month: "short", year: "numeric" }) : "",
            icon: "/brand-icons/linkedin.svg",
            tag: post.tag || "LinkedIn",
          }),
        );
      }
    } catch { /* API unavailable — skip */ }

    if (items.length) {
      renderFeed(ctx, items, `Live feed · ${items.length} items from dev.to, GitHub, HN, Hashnode, X, LinkedIn, CoderLegion`);
    } else {
      status.textContent = "Live feed unavailable — APIs may be rate-limited or blocked.";
    }
  }
  async function loadUpworkPortfolio() {
    // Refresh the count badge from the live API — cards are already rendered
    // at build time via the prebuild script, so this is a lightweight update only.
    // The API returns data.total = max(liveApiCount, staticJsonCount) so it
    // is always the full real count even though the live API is capped at 20.
    try {
      const res = await fetch("/api/upwork-portfolio");
      if (!res.ok) return;
      const data = await res.json();
      // Prefer data.total (max of API + static JSON count) over items.length
      const count =
        typeof data.total === "number" && data.total > 0
          ? data.total
          : Array.isArray(data.items)
            ? data.items.length
            : null;
      if (!count) return;
      const badge = document.getElementById("upwork-count-badge");
      if (!badge) return;
      const staticCount = parseInt(badge.textContent ?? "0", 10);
      if (count > staticCount) {
        badge.textContent = `${count} projects`;
      }
      // If count <= staticCount, keep the static value — it's already correct.
    } catch {
      // API unreachable — static build count badge remains visible.
    }
  }

  // ── TIER 3: Swiper carousels (idle) ──────────────────────────────────────
  const initSwipers = function () {
    if (!window.Swiper) return;

    // Testimonials carousel — 2 slides visible on desktop, 1 on mobile
    const testimonialEl = document.getElementById("testimonials-swiper");
    if (testimonialEl) {
      new Swiper("#testimonials-swiper", {
        slidesPerView: 1,
        spaceBetween: 16,
        autoHeight: true,
        autoplay: { delay: 5000, pauseOnMouseEnter: true, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        breakpoints: {
          680: { slidesPerView: 2, spaceBetween: 20 }
        },
        a11y: { prevSlideMessage: "Previous testimonial", nextSlideMessage: "Next testimonial" }
      });
    }

    // Case studies carousel — 1 slide visible
    const caseStudiesEl = document.getElementById("case-studies-swiper");
    if (caseStudiesEl) {
      new Swiper("#case-studies-swiper", {
        slidesPerView: 1,
        spaceBetween: 16,
        autoplay: { delay: 6000, pauseOnMouseEnter: true, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        navigation: { nextEl: ".swiper-button-next", prevEl: ".swiper-button-prev" },
        a11y: { prevSlideMessage: "Previous case study", nextSlideMessage: "Next case study" }
      });
    }

    // Profile links carousel — pill cards, auto-width slides
    const profileLinksEl = document.getElementById("profile-links-swiper");
    if (profileLinksEl) {
      new Swiper("#profile-links-swiper", {
        slidesPerView: "auto",
        spaceBetween: 8,
        autoplay: { delay: 3500, pauseOnMouseEnter: true, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        a11y: { prevSlideMessage: "Previous profile links", nextSlideMessage: "Next profile links" }
      });
    }
  };

  // ── TIER 3: Upwork pagination (idle) ─────────────────────────────────────
  const initUpworkPagination = function () {
    const grid = document.getElementById("upwork-grid");
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(".upwork-portfolio-card"));
    if (!cards.length) return;

    let perPage = 8;
    let currentPage = 1;
    let activeFilters = new Set();
    let sortOrder = "newest";
    let searchQuery = "";

    // Store original order for resetting sort
    cards.forEach((card, i) => { card.dataset.originalIndex = i; });

    // ── Tag extraction from card data ──────────────────────────────────
    function getCardTags(card) {
      const tags = [];
      const tagEls = card.querySelectorAll(".upwork-portfolio-tags li");
      tagEls.forEach(el => {
        const t = el.textContent.trim();
        if (t) tags.push(t);
      });
      return tags;
    }

    // Build filter chips from all unique tags
    function buildFilterTags() {
      const container = document.getElementById("upwork-filter-tags");
      if (!container) return;
      const allTags = new Set();
      cards.forEach(card => getCardTags(card).forEach(t => allTags.add(t)));
      const sorted = Array.from(allTags).sort();
      container.innerHTML = "";
      sorted.forEach(tag => {
        const chip = document.createElement("span");
        chip.className = "filter-tag" + (activeFilters.has(tag) ? " is-active" : "");
        chip.textContent = tag;
        chip.addEventListener("click", () => {
          if (activeFilters.has(tag)) activeFilters.delete(tag);
          else activeFilters.add(tag);
          buildFilterTags();
          applyAll();
        });
        container.appendChild(chip);
      });
      if (activeFilters.size > 0) {
        const clear = document.createElement("span");
        clear.className = "filter-clear";
        clear.textContent = "Clear filters";
        clear.addEventListener("click", () => {
          activeFilters.clear();
          buildFilterTags();
          applyAll();
        });
        container.appendChild(clear);
      }
    }

    // ── Sorting ────────────────────────────────────────────────────────
    function getSortedCards() {
      let list = [...cards];
      if (sortOrder === "newest") {
        list.sort((a, b) => (a.dataset.originalIndex|0) - (b.dataset.originalIndex|0));
      } else if (sortOrder === "oldest") {
        list.sort((a, b) => (b.dataset.originalIndex|0) - (a.dataset.originalIndex|0));
      } else if (sortOrder === "az") {
        list.sort((a, b) => {
          const ta = (a.querySelector("h3")?.textContent || "").trim().toLowerCase();
          const tb = (b.querySelector("h3")?.textContent || "").trim().toLowerCase();
          return ta.localeCompare(tb);
        });
      } else if (sortOrder === "za") {
        list.sort((a, b) => {
          const ta = (a.querySelector("h3")?.textContent || "").trim().toLowerCase();
          const tb = (b.querySelector("h3")?.textContent || "").trim().toLowerCase();
          return tb.localeCompare(ta);
        });
      }
      return list;
    }

    // ── Search ─────────────────────────────────────────────────────────
    function matchesSearch(card) {
      if (!searchQuery) return true;
      const q = searchQuery.toLowerCase();
      const title = (card.querySelector("h3")?.textContent || "").toLowerCase();
      const desc = (card.querySelector("p")?.textContent || "").toLowerCase();
      return title.includes(q) || desc.includes(q);
    }

    // ── Filtering ──────────────────────────────────────────────────────
    function matchesFilter(card) {
      if (activeFilters.size === 0) return true;
      const cardTags = getCardTags(card);
      return Array.from(activeFilters).some(ft => cardTags.includes(ft));
    }

    // ── Apply all (filter → search → sort → paginate) ──────────────────
    function applyAll() {
      let list = getSortedCards();
      list = list.filter(c => matchesSearch(c) && matchesFilter(c));

      const total = list.length;
      const maxPage = perPage === 0 ? 1 : Math.max(1, Math.ceil(total / perPage));
      currentPage = Math.min(currentPage, maxPage);

      // Hide all first
      cards.forEach(c => c.setAttribute("data-page-hidden", ""));

      if (perPage === 0) {
        // "All items"
        list.forEach(c => c.removeAttribute("data-page-hidden"));
      } else {
        const start = (currentPage - 1) * perPage;
        const end = start + perPage;
        list.forEach((c, i) => {
          if (i >= start && i < end) c.removeAttribute("data-page-hidden");
        });
      }

      updateSummary(total);
      updatePageNumbers(maxPage);
    }

    // ── Summary ────────────────────────────────────────────────────────
    function updateSummary(total) {
      const el = document.getElementById("upwork-summary");
      if (!el) return;
      if (searchQuery || activeFilters.size > 0) {
        el.textContent = `${total} item${total !== 1 ? "s" : ""} match${total !== 1 ? "" : "es"}${searchQuery ? " for \"" + searchQuery + "\"" : ""}${activeFilters.size > 0 ? " · filtered by " + activeFilters.size + " tag" + (activeFilters.size > 1 ? "s" : "") : ""}`;
      } else {
        const showing = perPage === 0 ? total : Math.min(perPage, total);
        el.textContent = `Showing ${showing} of ${total} items`;
      }
    }

    // ── Page number buttons ────────────────────────────────────────────
    function updatePageNumbers(maxPage) {
      const container = document.getElementById("upwork-page-numbers");
      if (!container) return;
      container.innerHTML = "";

      if (perPage === 0 || maxPage <= 1) {
        // Hide page numbers if "All" or only 1 page
        return;
      }

      const buildBtn = (num, label) => {
        const btn = document.createElement("button");
        btn.className = "page-num" + (num === currentPage ? " is-active" : "");
        btn.textContent = label || String(num);
        if (num !== null) btn.addEventListener("click", () => { currentPage = num; applyAll(); });
        return btn;
      };

      // Smart window: show 1, …, current-1, current, current+1, …, max
      const pages = [];
      pages.push(1);
      if (currentPage > 3) pages.push("…");
      for (let i = Math.max(2, currentPage - 1); i <= Math.min(maxPage - 1, currentPage + 1); i++) {
        if (!pages.includes(i)) pages.push(i);
      }
      if (currentPage < maxPage - 2) pages.push("…");
      if (maxPage > 1) pages.push(maxPage);

      pages.forEach(p => {
        if (p === "…") {
          const span = document.createElement("span");
          span.className = "page-ellipsis";
          span.textContent = "…";
          container.appendChild(span);
        } else {
          container.appendChild(buildBtn(p));
        }
      });

      // Prev/next
      const prevBtn = document.getElementById("upwork-prev");
      const nextBtn = document.getElementById("upwork-next");
      if (prevBtn) prevBtn.disabled = currentPage <= 1;
      if (nextBtn) nextBtn.disabled = currentPage >= maxPage;
    }

    // ── Wire up controls ──────────────────────────────────────────────
    const searchInput = document.getElementById("upwork-search");
    const searchClear = document.getElementById("upwork-search-clear");
    if (searchInput) {
      searchInput.addEventListener("input", () => {
        searchQuery = searchInput.value.trim();
        if (searchClear) searchClear.hidden = !searchQuery;
        currentPage = 1;
        applyAll();
      });
    }
    if (searchClear) {
      searchClear.addEventListener("click", () => {
        searchInput.value = "";
        searchQuery = "";
        searchClear.hidden = true;
        currentPage = 1;
        applyAll();
      });
    }

    const sortSelect = document.getElementById("upwork-sort");
    if (sortSelect) {
      sortSelect.addEventListener("change", () => {
        sortOrder = sortSelect.value;
        currentPage = 1;
        applyAll();
      });
    }

    const perPageSelect = document.getElementById("upwork-per-page");
    if (perPageSelect) {
      perPageSelect.addEventListener("change", () => {
        const val = perPageSelect.value;
        perPage = val === "all" ? 0 : parseInt(val, 10);
        currentPage = 1;
        applyAll();
      });
    }

    const prevBtn = document.getElementById("upwork-prev");
    const nextBtn = document.getElementById("upwork-next");
    if (prevBtn) prevBtn.addEventListener("click", () => { currentPage--; applyAll(); });
    if (nextBtn) nextBtn.addEventListener("click", () => { currentPage++; applyAll(); });

    // ── Initial render ─────────────────────────────────────────────────
    buildFilterTags();
    applyAll();
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(() => { initSwipers(); initUpworkPagination(); }, { timeout: 3000 });
  } else {
    setTimeout(() => { initSwipers(); initUpworkPagination(); }, 200);
  }
} // end initPage

// Run on first load and after every ClientRouter navigation.
document.addEventListener("astro:page-load", initPage);
