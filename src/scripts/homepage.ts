type ScrollspyTarget = {
  link: HTMLAnchorElement;
  el: HTMLElement;
};

type FeedItem = {
  title: string;
  url: string;
  source: string;
};

type FeedWidgetContext = {
  widget: HTMLElement | null;
  status: HTMLElement | null;
  list: HTMLElement | null;
};

type UpworkImageElement = HTMLImageElement & {
  dataset: DOMStringMap & {
    fallbackWired?: string;
    upworkImageFallbacks?: string;
    upworkImageIndex?: string;
  };
};

type DevtoArticle = {
  title: string;
  url: string;
  published_at: string;
};

// Wrap all UI initialisation in astro:page-load so it re-runs after
// every ClientRouter navigation, not just the first load.
//
// Tiered execution — avoids blocking the main thread (input delay fix):
//   Tier 1 — synchronous:          scrollspy IntersectionObserver setup only
//   Tier 2 — setTimeout(0):        API fetches (feed, GitHub, Upwork badge)
//   Tier 3 — requestIdleCallback:  img onerror wiring (40+ elements, idle only)
function initPage() {
  (function setupScrollspy() {
    const spyLinks = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(".anchor-rail a[data-spy]"),
    );
    if (!spyLinks.length) return;

    const targets: ScrollspyTarget[] = [];
    spyLinks.forEach((link) => {
      const id = link.dataset.spy;
      if (!id) return;
      const el = document.getElementById(id);
      if (el) targets.push({ link, el });
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const match = targets.find((target) => target.el === entry.target);
          if (!match || !entry.isIntersecting) return;
          spyLinks.forEach((item) => item.classList.remove("is-active"));
          match.link.classList.add("is-active");
        });
      },
      { rootMargin: "-15% 0px -75% 0px", threshold: 0 },
    );

    targets.forEach(({ el }) => observer.observe(el));
  })();

  setTimeout(function deferredFetches() {
    const widget = document.querySelector<HTMLElement>("[data-feed-widget]");
    const status = document.querySelector<HTMLElement>("[data-feed-status]");
    const list = document.querySelector<HTMLElement>("[data-feed-list]");

    const fallbackItems: FeedItem[] = Array.from(
      document.querySelectorAll<HTMLAnchorElement>(
        ".fallback-feed .support-card",
      ),
    )
      .slice(0, 4)
      .map((card) => ({
        title: card.querySelector(".support-name")?.textContent?.trim() ?? "",
        url: card.href,
        source:
          card.querySelector(".support-note")?.textContent?.trim() || "Curated",
      }))
      .filter((item) => Boolean(item.title) && Boolean(item.url));

    renderFeed(
      { widget, status, list },
      fallbackItems,
      "Curated fallback feed shown while live sources load.",
    );

    void loadFeed(widget, status, list, fallbackItems);
    void loadUpworkPortfolio();
  }, 0);

  const wireImageFallbacks = function () {
    document
      .querySelectorAll<HTMLImageElement>("img[data-upwork-image-fallbacks]")
      .forEach((rawImg) => {
        const img = rawImg as UpworkImageElement;
        if (img.dataset.fallbackWired) return;
        img.dataset.fallbackWired = "1";
        img.addEventListener(
          "error",
          function onUpworkImgError(this: UpworkImageElement) {
            const fallbacks = JSON.parse(
              this.dataset.upworkImageFallbacks || "[]",
            ) as string[];
            const idx = Number(this.dataset.upworkImageIndex || 0) + 1;
            if (idx < fallbacks.length) {
              this.dataset.upworkImageIndex = String(idx);
              this.src = fallbacks[idx];
            } else {
              this.removeEventListener("error", onUpworkImgError);
              this.remove();
            }
          },
        );
      });
  };

  if ("requestIdleCallback" in window) {
    requestIdleCallback(wireImageFallbacks, { timeout: 2000 });
  } else {
    setTimeout(wireImageFallbacks, 200);
  }
}

function renderFeed(
  ctx: FeedWidgetContext,
  items: FeedItem[],
  message: string,
) {
  if (!ctx.widget || !ctx.status || !ctx.list) return;
  ctx.list.innerHTML = "";
  items.slice(0, 8).forEach((item) => {
    const anchor = document.createElement("a");
    anchor.className = "feed-item";
    anchor.href = item.url;
    anchor.target = "_blank";
    anchor.rel = "noreferrer";

    const title = document.createElement("span");
    title.textContent = item.title;
    const source = document.createElement("small");
    source.textContent = item.source;

    anchor.append(title, source);
    ctx.list?.appendChild(anchor);
  });
  ctx.status.textContent = message;
}

async function loadFeed(
  widget: HTMLElement | null,
  status: HTMLElement | null,
  list: HTMLElement | null,
  fallbackItems: FeedItem[],
) {
  const ctx: FeedWidgetContext = { widget, status, list };
  const items: FeedItem[] = [];

  try {
    const devto = await fetch(
      "https://dev.to/api/articles?username=ar27111994&per_page=6",
    );
    if (devto.ok) {
      const articles = (await devto.json()) as DevtoArticle[];
      articles.forEach((article) => {
        items.push({
          title: article.title,
          url: article.url,
          source: `Dev.to · ${new Date(article.published_at).toLocaleDateString(undefined, { month: "short", year: "numeric" })}`,
        });
      });
    }
  } catch {
    // Public feed is progressive enhancement; curated fallback stays visible.
  }

  if (items.length) {
    renderFeed(
      ctx,
      items,
      "Latest writing pulled from public feeds where available.",
    );
  } else {
    renderFeed(
      ctx,
      fallbackItems,
      "Live writing feed unavailable in this browser/session; showing curated fallback items.",
    );
  }
}

async function loadUpworkPortfolio() {
  try {
    const response = await fetch("/api/upwork-portfolio");
    if (!response.ok) return;
    const data = (await response.json()) as {
      total?: number;
      items?: unknown[];
    };
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
  } catch {
    // API unreachable — static build count badge remains visible.
  }
}

document.addEventListener("astro:page-load", initPage);
