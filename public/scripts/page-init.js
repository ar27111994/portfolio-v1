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
      fallbackItems,
      "Curated fallback feed shown while live sources load.",
    );

    loadGitHubProofStats();
    loadFeed(widget, status, list, fallbackItems);
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
    items.slice(0, 8).forEach((item) => {
      const a = document.createElement("a");
      a.className = "feed-item";
      a.href = item.url;
      a.target = "_blank";
      a.rel = "noreferrer";
      const title = document.createElement("span");
      title.textContent = item.title;
      const source = document.createElement("small");
      source.textContent = item.source;
      a.append(title, source);
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

  async function loadFeed(widget, status, list, fallbackItems) {
    const ctx = { widget, status, list };
    const items = [];
    try {
      const devto = await fetch(
        "https://dev.to/api/articles?username=ar27111994&per_page=6",
      );
      if (devto.ok) {
        const articles = await devto.json();
        articles.forEach((article) =>
          items.push({
            title: article.title,
            url: article.url,
            source: `Dev.to · ${new Date(article.published_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`,
          }),
        );
      }
    } catch {
      // Public feed is progressive enhancement; curated fallback stays visible.
    }

    try {
      const repos = await fetch(
        "https://api.github.com/users/ar27111994/repos?sort=updated&per_page=4",
      );
      if (repos.ok) {
        const data = await repos.json();
        data.forEach((repo) =>
          items.push({
            title: repo.name,
            url: repo.html_url,
            source: `GitHub · updated ${new Date(repo.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
          }),
        );
      }
    } catch {
      // GitHub feed is optional and must not block the static portfolio.
    }

    if (items.length) {
      renderFeed(
        ctx,
        items,
        "Live feed loaded from public APIs where available.",
      );
    } else {
      renderFeed(
        ctx,
        fallbackItems,
        "Live fetch unavailable in this browser/session; showing curated fallback items.",
      );
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
} // end initPage

// Run on first load and after every ClientRouter navigation.
document.addEventListener("astro:page-load", initPage);
