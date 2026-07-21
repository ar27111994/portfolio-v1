// Wrap all UI initialisation in astro:page-load so it re-runs after
// every ClientRouter (View Transitions) navigation, not just the first load.
//
// Tiered execution — avoids blocking the main thread (input delay fix):
//   Tier 1 — synchronous:          scrollspy IntersectionObserver setup only

// Prevent browser auto-scroll on refresh
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
//   Tier 2 — setTimeout(0):        API fetches (feed, GitHub, Upwork badge)
//   Tier 3 — requestIdleCallback:  img onerror wiring (40+ elements, idle only)
function initPage() {
  // ── Re-apply theme after view-transition navigations ──────────────────
  (function reapplyTheme() {
    var t = localStorage.getItem("portfolio-theme") || "auto";
    var d = t === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches : t === "dark";
    document.documentElement.classList.remove("dark", "light");
    document.documentElement.classList.add(d ? "dark" : "light");
    var s = document.querySelector(".theme-icon-sun");
    var m = document.querySelector(".theme-icon-moon");
    if (s && m) { s.style.display = t === "auto" || !d ? "block" : "none"; m.style.display = t === "auto" || d ? "block" : "none"; }
  })();

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
    renderInitialFeed(
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

  let allFeedItems = [];
  let feedVisible = 0;
  const FEED_BATCH = 6;

  function createFeedItem(item) {
    const a = document.createElement("a");
    a.className = `feed-item feed-source-${item.source.toLowerCase().replace(/[^a-z0-9]/g, "-")}`;
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
    meta.textContent = item.date ? `${item.source} · ${item.date}` : item.source;
    body.appendChild(meta);
    a.appendChild(body);
    return a;
  }

  function showMoreFeed(list) {
    const batch = allFeedItems.slice(feedVisible, feedVisible + FEED_BATCH);
    batch.forEach((item) => list.appendChild(createFeedItem(item)));
    feedVisible += batch.length;
    // Hide sentinel if no more items
    const sentinel = document.getElementById("feed-sentinel");
    if (sentinel) sentinel.style.display = feedVisible >= allFeedItems.length ? "none" : "";
  }

  function renderInitialFeed(ctx, items, message) {
    if (!ctx.widget || !ctx.status || !ctx.list) return;
    ctx.list.innerHTML = "";
    allFeedItems = items;
    feedVisible = 0;
    showMoreFeed(ctx.list);
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

  let feedPage = 1;
  let feedHasMore = false;

  async function loadFeed(widget, status, list) {
    try {
      const res = await fetch(`/api/feed?page=${feedPage}&per_page=10`);
      if (!res.ok) throw new Error("API unavailable");
      const data = await res.json();
      feedHasMore = data.has_more;
      if (feedPage === 1) {
        renderInitialFeed({ widget, status, list }, data.items, `Live feed · ${data.total} items from 8 sources`);
      } else {
        data.items.forEach((item) => list.appendChild(createFeedItem(item)));
        feedVisible += data.items.length;
      }
      const sentinel = document.getElementById("feed-sentinel");
      if (sentinel) sentinel.style.display = feedHasMore ? "" : "none";
    } catch {
      if (feedPage === 1) status.textContent = "Live feed unavailable — APIs may be rate-limited or blocked.";
    }
  }

  function loadMoreFeed(list) {
    if (!feedHasMore) return;
    feedPage++;
    const widget = document.querySelector("[data-feed-widget]");
    const status = document.querySelector("[data-feed-status]");
    if (widget && status) loadFeed(widget, status, list);
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
        autoHeight: true,
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

    // Feed sources carousel — pill cards, auto-width slides
    const feedSourcesEl = document.getElementById("feed-sources-swiper");
    if (feedSourcesEl) {
      new Swiper("#feed-sources-swiper", {
        slidesPerView: "auto",
        spaceBetween: 8,
        autoplay: { delay: 4000, pauseOnMouseEnter: true, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        a11y: { prevSlideMessage: "Previous feed sources", nextSlideMessage: "Next feed sources" }
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

      // Always update prev/next — even when "All items" or single page
      const prevBtn = document.getElementById("upwork-prev");
      const nextBtn = document.getElementById("upwork-next");
      if (prevBtn) prevBtn.disabled = perPage === 0 || currentPage <= 1;
      if (nextBtn) nextBtn.disabled = perPage === 0 || currentPage >= maxPage;

      if (perPage === 0 || maxPage <= 1) {
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

  // ── Upwork pagination — run immediately ──────────────────────────────
  initUpworkPagination();

  if ("requestIdleCallback" in window) {
  requestIdleCallback(() => { initSwipers(); }, { timeout: 3000 });
  } else {
  setTimeout(() => { initSwipers(); }, 0);
  }

  // ── TIER 4: Infinite scroll sentinel for feed ──────────────────────────
  if ("requestIdleCallback" in window) {
  requestIdleCallback(function setupFeedSentinel() {
    const sentinel = document.getElementById("feed-sentinel");
    const list = document.querySelector("[data-feed-list]");
    if (!sentinel || !list) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) loadMoreFeed(list);
      });
    }, { rootMargin: "0px 0px 200px 0px" });
    observer.observe(sentinel);
  }, { timeout: 4000 });
  }
  } // end initPage

  // ── Theme toggle ─────────────────────────────────────────────────
  (function initTheme() {
    const STORAGE_KEY = "portfolio-theme";
    const themes = ["light", "dark", "auto"];
    let current = localStorage.getItem(STORAGE_KEY) || "auto";

    function applyTheme(theme) {
      const resolved = theme === "auto"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
      document.documentElement.classList.remove("dark", "light");
      document.documentElement.classList.add(resolved);
      const sun = document.querySelector(".theme-icon-sun");
      const moon = document.querySelector(".theme-icon-moon");
      if (sun && moon) {
        sun.style.display = theme === "auto" || resolved === "light" ? "block" : "none";
        moon.style.display = theme === "auto" || resolved === "dark" ? "block" : "none";
      }
      current = theme;
    }

    // Apply theme immediately (don't wait for button to exist)
    applyTheme(current);

    // Listen for system theme changes
    window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
      if (current === "auto") applyTheme("auto");
    });

    // Wire up the toggle button — use event delegation on document in case
    // button doesn't exist yet (Astro view transitions)
    document.addEventListener("click", (e) => {
      const btn = e.target.closest(".theme-toggle");
      if (!btn) return;
      const idx = themes.indexOf(current);
      current = themes[(idx + 1) % themes.length];
      localStorage.setItem(STORAGE_KEY, current);
      applyTheme(current);
    });
  })();
  // ── End theme toggle ─────────────────────────────────────────────

// Run on first load and after every ClientRouter navigation.
document.addEventListener("astro:page-load", initPage);

// Apply theme BEFORE view-transition swap — prevents flash
document.addEventListener("astro:before-swap", () => {
  var t = localStorage.getItem("portfolio-theme") || "auto";
  var d = t === "auto" ? window.matchMedia("(prefers-color-scheme: dark)").matches : t === "dark";
  document.documentElement.classList.remove("dark", "light");
  document.documentElement.classList.add(d ? "dark" : "light");
});

// ── Hamburger menu toggle ─────────────────────────────────────────
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".hamburger");
  const rail = document.querySelector(".anchor-rail");
  if (btn) {
    const expanded = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!expanded));
    if (rail) rail.classList.toggle("is-open", !expanded);
    return;
  }
  // Close if clicking outside
  if (rail && rail.classList.contains("is-open") && !e.target.closest(".anchor-rail")) {
    rail.classList.remove("is-open");
    const ham = document.querySelector(".hamburger");
    if (ham) ham.setAttribute("aria-expanded", "false");
  }
});

// ── Image Gallery Lightbox ─────────────────────────────────────────
(function initLightbox() {
  const lb = document.getElementById("img-lightbox");
  const img = document.getElementById("img-lightbox-img");
  const close = document.getElementById("img-lightbox-close");
  const prev = document.getElementById("img-lightbox-prev");
  const next = document.getElementById("img-lightbox-next");
  const counter = document.getElementById("img-lightbox-counter");
  if (!lb || !img) return;

  let images = [];
  let current = 0;
  let zoomed = false;
  let scale = 1;
  let panX = 0, panY = 0, startX = 0, startY = 0, dragging = false;

  function open(index, srcs) {
    images = srcs;
    current = index;
    zoomed = false;
    scale = 1;
    panX = panY = 0;
    img.style.transform = "";
    img.src = images[current];
    img.alt = "Screenshot " + (current + 1);
    lb.classList.add("is-open");
    lb.classList.remove("is-zoomed");
    lb.setAttribute("aria-hidden", "false");
    updateCounter();
    document.body.style.overflow = "hidden";
  }

  function closeLightbox() {
    lb.classList.remove("is-open", "is-zoomed");
    lb.setAttribute("aria-hidden", "true");
    img.src = "";
    document.body.style.overflow = "";
    zoomed = false;
    scale = 1;
  }

  function goTo(idx) {
    if (idx < 0 || idx >= images.length) return;
    current = idx;
    zoomed = false;
    scale = 1;
    panX = panY = 0;
    img.style.transform = "";
    lb.classList.remove("is-zoomed");
    img.src = images[current];
    img.alt = "Screenshot " + (current + 1);
    updateCounter();
  }

  function updateCounter() {
    if (images.length > 1) {
      counter.textContent = (current + 1) + " / " + images.length;
    } else {
      counter.textContent = "";
    }
  }

  function toggleZoom() {
    if (zoomed) {
      zoomed = false;
      scale = 1;
      panX = panY = 0;
      img.style.transform = "";
      lb.classList.remove("is-zoomed");
    } else {
      zoomed = true;
      scale = 2;
      img.style.transform = "scale(" + scale + ")";
      lb.classList.add("is-zoomed");
    }
  }

  // Click on any screenshot in the upwork modal
  document.addEventListener("click", function(e) {
    const tile = e.target.closest(".upwork-media-tile");
    if (!tile) return;
    const tileImg = tile.querySelector("img");
    if (!tileImg) return;

    // Collect all sibling screenshots in this modal
    const grid = tile.closest(".upwork-media-grid");
    if (!grid) return;
    const allImages = Array.from(grid.querySelectorAll("img")).map(function(i) {
      return i.currentSrc || i.src;
    }).filter(function(s) { return s && !s.includes("data:"); });

    if (allImages.length === 0) return;
    const idx = allImages.indexOf(tileImg.currentSrc || tileImg.src);
    e.preventDefault();
    e.stopPropagation();
    open(Math.max(0, idx), allImages);
  });

  // Close button
  close.addEventListener("click", closeLightbox);

  // Navigation
  prev.addEventListener("click", function() { goTo(current - 1); });
  next.addEventListener("click", function() { goTo(current + 1); });

  // Click on lightbox background (not on image) to close or zoom
  lb.addEventListener("click", function(e) {
    if (e.target === lb) {
      if (zoomed) {
        toggleZoom();
      } else {
        closeLightbox();
      }
    } else if (e.target === img) {
      toggleZoom();
    }
  });

  // Keyboard
  document.addEventListener("keydown", function(e) {
    if (!lb.classList.contains("is-open")) return;
    if (e.key === "Escape") { closeLightbox(); return; }
    if (e.key === "ArrowLeft") { goTo(current - 1); return; }
    if (e.key === "ArrowRight") { goTo(current + 1); return; }
  });

  // Zoomed panning
  img.addEventListener("mousedown", function(e) {
    if (!zoomed) return;
    dragging = true;
    startX = e.clientX - panX;
    startY = e.clientY - panY;
    img.style.cursor = "grabbing";
  });
  window.addEventListener("mousemove", function(e) {
    if (!dragging) return;
    panX = e.clientX - startX;
    panY = e.clientY - startY;
    img.style.transform = "scale(" + scale + ") translate(" + (panX / scale) + "px, " + (panY / scale) + "px)";
  });
  window.addEventListener("mouseup", function() {
    dragging = false;
    img.style.cursor = zoomed ? "grab" : "";
  });
})();
