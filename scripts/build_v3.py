"""
Canonical resume generator for portfolio-v1.
Uses project brand SVGs, consistent professional typography, and proper page layout.
"""
from __future__ import annotations

import base64
from pathlib import Path
from dataclasses import dataclass

from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

# ── Paths ─────────────────────────────────────────────────────────────────────
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RESUME_DIR = PROJECT_ROOT / "public" / "resume"
PHOTO_PATH = PROJECT_ROOT / "public" / "brand" / "ahmed-photo-hero.webp"
if not PHOTO_PATH.exists():
    PHOTO_PATH = PROJECT_ROOT / "public" / "pic.jpg"

# ── Inter font (Latin subset, 400/600/700/800) ────────────────────────────────
_FONT_DIR = PROJECT_ROOT / "node_modules" / "@fontsource" / "inter" / "files"
_FONT_FACES = ""
for _w, _wn in [(400, "Regular"), (600, "SemiBold"), (700, "Bold"), (800, "ExtraBold")]:
    _fp = _FONT_DIR / f"inter-latin-{_w}-normal.woff2"
    if _fp.exists():
        _data = base64.b64encode(_fp.read_bytes()).decode()
        _FONT_FACES += f"""@font-face {{
  font-family: 'Inter'; font-style: normal; font-weight: {_w}; font-display: swap;
  src: url('data:font/woff2;base64,{_data}') format('woff2');
}}
"""

# Load brand icons from generated data file
_brand_file = PROJECT_ROOT / "scripts" / "_brand_icons.py"
if _brand_file.exists():
    exec(_brand_file.read_text())
else:
    BRAND_ICONS = {}

def icon(name: str, size: int = 10) -> str:
    """Return an <img> tag for a brand icon at the given pt size."""
    uri = BRAND_ICONS.get(name, "")
    if not uri:
        return ""
    return f'<img src="{uri}" width="{size}" height="{size}" alt="">'

# ── Constants ─────────────────────────────────────────────────────────────────
EMAIL = "admin@ar27111994.dev"
PHONE = "+92-331-588-7235"
LOCATION = "Rawalpindi, Pakistan"
SITE_URL = "https://www.ar27111994.dev"
GITHUB_URL = "https://github.com/ar27111994"
LINKEDIN_URL = "https://linkedin.com/in/ar27111994"
UPWORK_URL = "https://www.upwork.com/freelancers/~0188baee67e8f543e7"
DEVTO_URL = "https://dev.to/ar27111994"
X_URL = "https://x.com/ar27111994"

# ── Photo ─────────────────────────────────────────────────────────────────────
PHOTO_SRC = ""
if PHOTO_PATH.exists():
    ext = PHOTO_PATH.suffix.lower()
    mime = "image/webp" if ext == ".webp" else "image/jpeg" if ext in (".jpg", ".jpeg") else "image/png"
    PHOTO_SRC = f"data:{mime};base64,{base64.b64encode(PHOTO_PATH.read_bytes()).decode()}"

# ── CSS ───────────────────────────────────────────────────────────────────────
CSS = r"""
/* ── Design tokens (3pt base grid) ─────────────────────────────────────────── */
/* Colors: ink (#0f172a), muted (#475569), soft (#64748b), faint (#94a3b8),
           accent (#1d4ed8), accent-light (#eff6ff), border (#e2e8f0),
           surface (#f8fafc) */
/* Spacing: 3pt unit → 3,6,9,12,15,18,24,30 */
/* Type:   h1 22pt/800, h2 7.8pt/800 caps, entry-title 9pt/700,
           body 8pt/400, meta 7.5pt/400 */

@page { size: A4; margin: 30pt 34pt 30pt 34pt; }
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Inter', 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
  font-size: 8.5pt; line-height: 1.5; color: #1e293b; background: #fff;
  -webkit-print-color-adjust: exact; print-color-adjust: exact;
}

/* ── Header ─── */
.hdr { display: flex; align-items: flex-start; gap: 15pt; padding: 0 0 15pt; margin-bottom: 6pt; border-bottom: 2pt solid #e2e8f0; }
.hdr-photo { width: 66pt; height: 66pt; border-radius: 50%; object-fit: cover; object-position: 50% 30%; border: 2pt solid #e2e8f0; flex-shrink: 0; filter: grayscale(100%); }
.hdr-info { flex: 1; min-width: 0; }
.hdr-name   { font-size: 22pt; font-weight: 800; letter-spacing: -0.04em; color: #0f172a; margin: 0 0 3pt; }
.hdr-role   { font-size: 9pt; font-weight: 600; color: #475569; margin: 0 0 6pt; line-height: 1.4; }
.hdr-loc    { font-size: 8pt; color: #64748b; margin: 0 0 6pt; }
.hdr-loc img { vertical-align: -1pt; margin-right: 1pt; }

.contact-row { display: flex; flex-wrap: wrap; gap: 2pt 3pt; align-items: baseline; font-size: 7.8pt; color: #475569; margin-bottom: 6pt; }
.contact-row a { color: #1d4ed8; text-decoration: none; font-weight: 500; }
.contact-row img { width: 7pt; height: 7pt; vertical-align: text-bottom; }
.contact-row .sep { color: #cbd5e1; margin: 0 2pt; }

/* ── Badges ─── */
.badge-row { display: flex; flex-wrap: wrap; gap: 5pt; }
.badge { display: inline-flex; align-items: center; gap: 2pt; padding: 2pt 6pt; border-radius: 999px; font-size: 7pt; font-weight: 700; border: 1pt solid #e2e8f0; background: #f8fafc; color: #475569; }
.badge img { width: 7pt; height: 7pt; flex-shrink: 0; }
.badge.ms   { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.badge.anth { border-color: #fed7aa; background: #fff7ed; color: #c2410c; }
.badge.oss  { border-color: #d1d5db; background: #f3f4f6; color: #374151; }

/* ── Section headers ─── */
h2 { font-size: 7.8pt; font-weight: 800; text-transform: uppercase; letter-spacing: 0.12em; color: #1e40af; margin: 15pt 0 6pt; padding: 0 0 3pt; border-bottom: 1.5pt solid #dbeafe; }

/* ── Entries ─── */
.entry { margin-bottom: 6pt; padding-left: 9pt; border-left: 2pt solid #e2e8f0; }
.entry-title { font-size: 9pt; font-weight: 700; color: #0f172a; margin: 0 0 2pt; }
.entry-meta { display: flex; justify-content: space-between; align-items: center; font-size: 7.5pt; color: #64748b; margin-bottom: 3pt; }
.entry-meta .org { font-weight: 650; color: #334155; }
.entry-meta .date { font-size: 6.8pt; font-weight: 600; color: #1d4ed8; background: #eff6ff; padding: 1pt 5pt; border-radius: 999px; white-space: nowrap; }
.entry p  { font-size: 7.9pt; color: #374151; line-height: 1.55; margin-bottom: 3pt; }
.entry li { font-size: 7.7pt; color: #374151; line-height: 1.5; margin-bottom: 2pt; list-style-type: none; position: relative; padding-left: 9pt; }
.entry li::before { content: '—'; color: #1d4ed8; position: absolute; left: 0; font-weight: 700; }
.entry ul { margin: 3pt 0 0 0; padding: 0; }
.entry img { width: 8pt; height: 8pt; vertical-align: -1pt; }

/* ── Writing ─── */
.writing-item { margin-bottom: 1.5pt; padding-left: 9pt; border-left: 1.5pt solid #e2e8f0; }
.writing-item a { font-size: 7.9pt; color: #1d4ed8; text-decoration: none; font-weight: 600; }
.writing-item .src { font-size: 6.8pt; color: #94a3b8; margin-left: 3pt; }

/* ── Skills ─── */
.skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 6pt 15pt; }
.skill-block { margin-bottom: 3pt; padding: 5pt 7pt; background: #f8fafc; border-radius: 6pt; border-left: 3pt solid #e2e8f0; }
.skill-block h3 { font-size: 7.8pt; font-weight: 700; color: #0f172a; margin-bottom: 2pt; }
.skill-block.frontend { border-left-color: #3b82f6; }
.skill-block.backend  { border-left-color: #10b981; }
.skill-block.data     { border-left-color: #f59e0b; }
.skill-block.infra    { border-left-color: #8b5cf6; }
.skill-block p { font-size: 7.3pt; color: #475569; line-height: 1.55; }

/* ── Common ─── */
a { color: #1d4ed8; text-decoration: none; }
.lbl { font-weight: 700; color: #0f172a; }
.muted { color: #64748b; }
.small { font-size: 7.5pt; color: #475569; line-height: 1.55; }
.tag { font-size: 6.5pt; color: #64748b; margin-top: 3pt; font-style: italic; }
"""

# ── Helper ────────────────────────────────────────────────────────────────────
def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ── Header ────────────────────────────────────────────────────────────────────
def header(photo: bool = False, role: str = "", badges_html: str = "", contact_count: int = 8) -> str:
    ph = f'<img class="hdr-photo" src="{PHOTO_SRC}" alt="Ahmed Rehan">' if photo and PHOTO_SRC else ""
    r = role or "Full-Stack Engineer &bull; Devtools, Agent Systems, Automation, Webhooks &amp; Performance-Conscious Products"

    contacts_row1 = f"""{icon('gmail', 8)}<a href="mailto:{EMAIL}">{EMAIL}</a>
     <span class="sep">|</span>{icon('whatsapp', 8)}{PHONE}
     <span class="sep">|</span>{icon('globe', 8)}<a href="{SITE_URL}">ar27111994.dev</a>
     <span class="sep">|</span>{icon('github', 8)}<a href="{GITHUB_URL}">github.com/ar27111994</a>"""

    contacts_row2 = ""
    if contact_count >= 6:
        contacts_row2 = f"""
    <div class="contact-row">
      {icon('linkedin', 8)}<a href="{LINKEDIN_URL}">linkedin.com/in/ar27111994</a>
     <span class="sep">|</span>{icon('upwork', 8)}<a href="{UPWORK_URL}">Upwork</a>"""
    if contact_count >= 7:
        contacts_row2 += f"""
     <span class="sep">|</span>{icon('x', 8)}<a href="{X_URL}">x.com/ar27111994</a>"""
    if contact_count >= 8:
        contacts_row2 += f"""
     <span class="sep">|</span>{icon('devdotto', 8)}<a href="{DEVTO_URL}">dev.to/ar27111994</a>"""
    if contact_count >= 6:
        contacts_row2 += "\n    </div>"

    badges = badges_html or f"""<span class="badge ms">{icon('microsoft', 7)}Microsoft Partner</span>
      <span class="badge anth">{icon('anthropic', 7)}Anthropic Partner</span>
      <span class="badge oss">{icon('github', 7)}Open-source maintainer</span>
      <span class="badge">Devtools builder</span>
      <span class="badge">Webhook / API tooling</span>
      <span class="badge">AI-agent workflows</span>"""

    return f"""<header class="hdr">
  {ph}
  <div class="hdr-info">
    <h1 class="hdr-name">Ahmed Rehan</h1>
    <p class="hdr-role">{r}</p>
    <p class="hdr-loc">{icon('globe', 9)}{esc(LOCATION)}</p>
    <div class="contact-row">{contacts_row1}
    </div>{contacts_row2}
    <div class="badge-row">
      {badges}
    </div>
  </div>
</header>"""

def section(title: str, emoji: str = "") -> str:
    prefix = f"{emoji} " if emoji else ""
    return f"<h2>{prefix}{esc(title)}</h2>"

# ── Certifications data ──────────────────────────────────────────────────────
ANTHROPIC_CERTS = [
    ("Building with the Claude API", "https://verify.skilljar.com/c/kqdnoajm977y"),
    ("Claude Code in Action", "https://verify.skilljar.com/c/gv2gvaw48jus"),
    ("Introduction to Agent Skills", "https://verify.skilljar.com/c/8wqzsm9q9o9w"),
    ("Introduction to Model Context Protocol", "https://verify.skilljar.com/c/nhscqtess3nq"),
]

COURSERA_CERTS = [
    ("ML Strategy & Error Analysis",
     "https://www.coursera.org/account/accomplishments/verify/HQ3883739EQ7",
     "12/05/2019",
     "Diagnose errors in ML systems; prioritize improvement directions; mismatched train/test sets; human-level performance comparisons; end-to-end and transfer learning; multi-task learning."),
    ("Deep Learning Best Practices & Optimization",
     "https://www.coursera.org/account/accomplishments/verify/U4QYCQLM9WUH",
     "07/04/2019",
     "L2/dropout regularization; batch normalization; gradient checking; optimization algorithms (mini-batch GD, Momentum, RMSprop, Adam); train/dev/test setup; bias/variance analysis."),
    ("Deep Learning Foundations + TensorFlow",
     "https://www.coursera.org/account/accomplishments/verify/TDDMYNV57A99",
     "20/08/2018",
     "Fully connected deep neural networks; vectorized implementation; key architecture parameters; TensorFlow implementation; major technology trends driving Deep Learning."),
    ("Big Data Fundamentals & Hadoop",
     "https://www.coursera.org/account/accomplishments/verify/HHVS4SJNXDR8",
     "29/10/2018",
     "Big Data landscape (volume, velocity, variety, veracity, valence, value); 5-step analysis process; Hadoop architecture (YARN, HDFS, MapReduce); scalable big data analysis."),
]

# ── Build full resume ─────────────────────────────────────────────────────────
def build_full_html() -> str:
    body = header(photo=True)

    # Summary
    body += section("Summary", "⭐")
    body += """<div class="entry">
<p>Product-minded full-stack engineer and solo builder focused on developer tools, workflow automation, agent systems, webhook/API infrastructure, and performance-conscious software. Strong background in frontend architecture, interactive product engineering, and full-stack delivery across web, mobile, API-driven, and enterprise workflow systems.</p>
<p><span class="lbl">Partner / certification track:</span> Microsoft Partner and Anthropic Partner through admin@ar27111994.dev; four Anthropic certifications completed Jun 2026.</p>
</div>"""

    # Products
    body += section("Selected Products & Open-Source Work", "🛠")
    # Webhook Debugger
    body += """<div class="entry">
<p class="entry-title">Webhook Debugger and Logger</p>
<p>Enterprise-grade webhook testing suite: capture, inspect, replay, forward, validate (JSON Schema), mock, and stream events in real time. SSE live streaming. SSRF-conscious forwarding. HMAC-SHA256 signature verification, structured incident log.</p>
"""
    body += f'<p class="small">{icon("github", 7)} <a href="https://github.com/ar27111994/webhook-debugger-logger">github.com/ar27111994/webhook-debugger-logger</a></p></div>'
    # agent-harness
    body += """<div class="entry">
<p class="entry-title">agent-harness</p>
<p>Node.js / TypeScript CLI for discovering, staging, activating, and wiring reusable AI-agent assets across VS Code/Copilot, OpenCode, Cursor, Zed, Claude Code, and Pi.</p>
"""
    body += f'<p class="small">{icon("github", 7)} <a href="https://github.com/ar27111994/agent-harness">github.com/ar27111994/agent-harness</a></p></div>'
    # penpot-mcp
    body += """<div class="entry">
<p class="entry-title">penpot-mcp</p>
<p>An agent skill for creating, auditing, and maintaining Penpot design systems, prototypes, and design tokens via MCP.</p>
"""
    body += f'<p class="small">{icon("github", 7)} <a href="https://github.com/ar27111994/penpot-mcp">github.com/ar27111994/penpot-mcp</a></p></div>'
    # Legacy OSS
    body += """<div class="entry">
<p class="entry-title">Legacy OSS / Freemium</p>
<ul>
<li><span class="lbl">Shopping Cart Library</span> — PHP class for add/update/delete/destroy cart operations with session persistence. Used by hundreds on phpclasses.org.</li>
<li><span class="lbl">Mosaico + CodeIgniter</span> — Open-source WYSIWYG email template editor integrated with custom PHP/CodeIgniter backend and database.</li>
<li><span class="lbl">OpenCart 3.x extensions</span> — 3-Level Menu extension and Obligr SMS Order Alert with customized admin email (Indian merchants).</li>
<li><span class="lbl">CRUD Scaffolding Templates</span> — AJAX search/sort/page with Excel/CSV export; generic repository pattern on Entity Framework 6.</li>
<li><span class="lbl">OpenBiz</span> — Open-source supply chain management system built on ASP.NET MVC, Entity Framework, Razor, C#, jQuery, Bootstrap.</li>
<li><span class="lbl">National Criminals Database</span> — WCF + ASP.NET MVC demonstrating N-Layered Architecture with web client contracts and unit tests.</li>
<li><span class="lbl">Bookstore</span> — Full-featured SEO-friendly bookstore with admin panel, vanilla PHP with PSD-to-HTML design implementation.</li>
</ul>
</div>"""

    # Writing
    body += section("Writing / Public Technical Content", "📄")
    writings = [
        ("Agent assets need a lifecycle, not a dumping ground", "https://dev.to/ar27111994/agent-assets-need-a-lifecycle-not-a-dumping-ground-1i3h", "Dev.to"),
        ("I built a more restrained alternative to giant AI skill bundles", "https://dev.to/ar27111994/i-built-a-more-restrained-alternative-to-giant-ai-skill-bundles-1kf5", "Dev.to"),
        ("Antigravity CLI with WSL2 — setup and full story", "https://dev.to/ar27111994/antigravity-cli-with-wsl2-setup-and-full-story", "Dev.to"),
        ("Show HN: Webhook Debugger with replay and SSRF checks", "https://news.ycombinator.com/item?id=46632472", "Hacker News"),
    ]
    for title, url, src in writings:
        body += f'<p class="writing-item"><a href="{url}">{esc(title)}</a> <span class="src">{src}</span></p>'

    # Experience
    body += section("Experience", "💼")
    # Eagle 6
    body += """<div class="entry">
<p class="entry-title">Frontend Engineer</p>
<p class="entry-meta"><span class="org">Eagle 6 — cybersecurity product securing large enterprises by detecting unknown vulnerabilities</span><span class="date">Feb 2018 &ndash; Mar 2022</span></p>
<ul>
<li>Implemented frontend for Cloud Storage and Organization Chart Modeling modules of the flagship enterprise product alongside integration and customization of rich text document editing tools via Angular-ized plugins.</li>
<li>Built file and folder management with role-based permissions assignment, preview and edit capabilities based on file type and user permission level.</li>
<li>Created complex plugin-based online editors for short and full-featured documents with Microsoft Office file support, concurrent editing, permission-based content controls, and PDF export.</li>
<li>Implemented chunked file/folder upload using TUS protocol for scalability and large-file support.</li>
<li>Rebuilt the Organization Chart Modeling tool on GOJS with Akita (Redux/Flux) state management for scalability and robust maintenance.</li>
<li>Built and maintained graph and map interfaces for Network Monitoring tools using D3, Highcharts, Leaflet, and OSM Tiles server.</li>
<li>Standardized UI output with a responsive, accessible Google Material Design system across all modules.</li>
<li>Interviewed and facilitated hiring of multiple frontend developers; drove code quality through restructuring, code review, and mentoring.</li>
<li>Assessed UX/UI designs for technical feasibility and provided implementation estimates in an Agile-driven environment.</li>
</ul>
<p class="tag">Angular 7+ &middot; TypeScript &middot; Angular Material &middot; RxJS &middot; Akita &middot; GoJS &middot; D3 &middot; Highcharts &middot; Leaflet &middot; OSM &middot; Jest &middot; SCSS &middot; BEM &middot; TUS</p>
<p class="small"><span class="lbl">Metrics:</span> 4-year tenure on a single flagship product · 4 major modules delivered · Helped hire &amp; mentor frontend team · Standardized org-wide UI system adopted across all modules</p>
</div>"""
    # Upwork
    body += """<div class="entry">
<p class="entry-title">Full-Stack Freelance Contractor</p>
<p class="entry-meta"><span class="org">Upwork / Independent Client Work</span><span class="date">May 2017 &ndash; Feb 2018</span></p>
<ul>
<li>Implemented, maintained, managed, and delivered solo projects as a freelance contractor in a timely manner.</li>
<li>Spun out free and open-source projects based on solo freelancing work (with client consent).</li>
<li>Contributed bugfixes to multiple open-source libraries to solve issues in client projects.</li>
<li>Converted mockups into HTML, JavaScript, AJAX, and JSON.</li>
<li>Used programming capabilities in Angular, Ionic, TypeScript, PHP, WordPress, OpenCart, C#, SQL, jQuery, JavaScript and other libraries as needed.</li>
<li>Created a Microsoft Remote Desktop Services project with Citrix App Layering on Azure Integration — learning the entire stack from scratch.</li>
<li>Fixed, maintained, and extended existing projects developed and deployed by other developers.</li>
<li>Created and extended fully featured mobile apps with backend REST APIs and databases using Ionic 3, Angular 5+, PHP, MySQL alongside mobile-specific features like camera and payment gateway integration via Apache Cordova.</li>
<li>Deployed and managed web and mobile backends using UNIX and Apache web servers.</li>
</ul>
<p class="tag">Angular &middot; Ionic &middot; TypeScript &middot; PHP &middot; MySQL &middot; CodeIgniter &middot; WordPress &middot; OpenCart &middot; C# &middot; Azure &middot; Cordova &middot; Xamarin &middot; Apache &middot; Nginx</p>
<p class="small"><span class="lbl">Metrics:</span> 40+ completed jobs · 5.0★ Upwork rating · 115-hour Azure/Citrix POC · $850 OpenCart mobile app · $165 Ionic app · $577 Citrix/Azure engagement</p>
</div>"""
    # Goggle Hunt
    body += """<div class="entry">
<p class="entry-title">Founder / Owner — Goggle Hunt</p>
<p class="entry-meta"><span class="org">Shopify dropshipping — fashion &amp; sports goggles, US &amp; EU markets</span><span class="date">May 2017 &ndash; Sep 2017</span></p>
<ul>
<li>Identified a primary keyword with 600K monthly Google searches and low competition in the US market.</li>
<li>Created, maintained, marketed, and did product sourcing for the Shopify store; ran day-to-day operations for 4 months while freelancing full-time.</li>
<li>Conducted Instagram influencer interviews and giveaway competitions for marketing and brand reach.</li>
<li>Created and ran four social media accounts, each reaching a few hundred followers.</li>
<li>Collected ~150 email subscribers, majority via a Gleam competition campaign.</li>
<li>Created a Facebook Merchant Account with all shop products integrated for frictionless purchasing.</li>
<li>Sold the full business on Flippa to focus exclusively on a software engineering career.</li>
</ul>
</div>"""
    # GMINNS
    body += """<div class="entry">
<p class="entry-title">PHP Developer</p>
<p class="entry-meta"><span class="org">GMINNS — Genius Marketing INNovationS</span><span class="date">Jul 2015 &ndash; Apr 2016</span></p>
<p>Worked on customization of a School Management System based on customer requirements, alongside initial development of a Saudi football federation club management portal. Built and maintained PHP web applications with database-driven features and custom CMS components.</p>
</div>"""
    # COMITS
    body += """<div class="entry">
<p class="entry-title">Web Developer</p>
<p class="entry-meta"><span class="org">COMITS</span><span class="date">Jul 2014 &ndash; Mar 2015</span></p>
<p>Built WordPress sites for a local newspaper and a local printing shop with custom themes and image sliders. Built an e-commerce website for the company in OpenCart. Delivered client web projects in PHP / JavaScript covering frontend, backend, and deployment.</p>
</div>"""

    # Skills
    body += section("Technical Skills", "⚙")
    body += """<div class="skills-grid">
<div class="skill-block frontend"><h3>Frontend</h3><p>TypeScript &middot; Angular &middot; React &middot; Next.js &middot; RxJS &middot; Angular Material &middot; Akita &middot; Jest &middot; SCSS &middot; BEM &middot; D3 &middot; Highcharts &middot; GoJS &middot; Leaflet &middot; OSM</p></div>
<div class="skill-block backend"><h3>Backend / Systems</h3><p>Node.js &middot; Express &middot; ASP.NET Core &middot; PHP &middot; CodeIgniter &middot; WordPress &middot; OpenCart &middot; API integrations &middot; automation workflows</p></div>
<div class="skill-block data"><h3>Data / Delivery</h3><p>MySQL &middot; SQL Server &middot; Docker &middot; Azure &middot; Linux &middot; Apify &middot; Vercel &middot; Git &middot; GitHub &middot; Jira &middot; VS Code &middot; WebStorm &middot; Visual Studio</p></div>
<div class="skill-block infra"><h3>Infrastructure</h3><p>Apache &middot; Nginx &middot; IIS &middot; XAMPP &middot; Cordova &middot; Xamarin &middot; Citrix App Layering</p></div>
</div>"""

    # Education
    body += section("Education", "🎓")
    body += """<div class="entry">
<p class="entry-title">M.C.S. — Master of Computer Science</p>
<p class="entry-meta"><span class="org">Arid Agriculture University, Rawalpindi</span><span class="date">Oct 2014 &ndash; Aug 2016</span></p>
<p class="small">Digital Design &middot; Web &amp; Desktop Development &middot; Operating Systems &middot; System Programming &middot; Networking &middot; Software Engineering &middot; Database Systems &middot; Artificial Intelligence &middot; Data Structures</p>
</div>
<div class="entry">
<p class="entry-title">B.Sc. — Computer, Statistics and Mathematics</p>
<p class="entry-meta"><span class="org">University of the Punjab</span><span class="date">Sep 2012 &ndash; Jul 2014</span></p>
<p class="small">Computer Science &middot; Software Engineering &middot; Databases &middot; Operating Systems &middot; Statistics &amp; Probability &middot; Calculus &middot; Mathematical Methods</p>
</div>"""

    # Coursera
    body += section("Certifications / Coursework", "📜")
    for name, url, date, syllabus in COURSERA_CERTS:
        body += f"""<div class="entry">
<p class="entry-title">Coursera — {esc(name)}</p>
<p class="entry-meta"><span class="org">Completed {date}</span><span></span></p>
<p class="small">{esc(syllabus)}</p>
<p class="small"><a href="{url}">{url.replace('https://', '')}</a></p>
</div>"""

    # Anthropic
    body += '<p style="margin-top:14pt">' + icon('anthropic', 10) + ' <span class="lbl">Anthropic Certifications</span> <span class="muted">— completed Jun 2026</span></p>'
    body += "<ul>"
    for name, url in ANTHROPIC_CERTS:
        body += f'<li><span class="lbl">{esc(name)}</span> — <a href="{url}">{url.replace("https://", "")}</a></li>'
    body += "</ul>"

    # Microsoft RDS
    body += '<p style="margin-top:10pt">' + icon('microsoft', 10) + ' <span class="lbl">Microsoft Virtual Academy</span></p>'
    body += '<p style="margin-left:12pt"><span class="lbl">Microsoft Remote Desktop Services Deep Dive</span> <span class="muted">— Pending verification</span> <a href="https://microsoft.com/en-us/learning/">(microsoft.com/en-us/learning/)</a></p>'

    # Partner track
    body += '<p style="margin-top:12pt">⭐ <span class="lbl">PARTNER / ACTIVE CREDENTIAL TRACK</span></p>'
    body += f'<p style="margin-left:12pt">' + icon('microsoft', 9) + f' <span class="lbl">Microsoft Partner:</span> partner identity via {EMAIL}.</p>'
    body += f'<p style="margin-left:12pt">' + icon('anthropic', 9) + f' <span class="lbl">Anthropic Partner:</span> partner identity via {EMAIL}.</p>'

    return f"<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Ahmed Rehan — Resume</title><style>{_FONT_FACES}{CSS}</style></head><body>{body}</body></html>"

# ── PDF Generation ────────────────────────────────────────────────────────────

def build_ats_html() -> str:
    """ATS-safe: US-Letter, photo-free, single-column, condensed."""
    body = header(photo=False)

    body += section("Summary", "⭐")
    body += """<div class="entry">
<p>Product-minded full-stack engineer and solo builder focused on developer tools, workflow automation, agent systems, webhook/API infrastructure, and performance-conscious software.</p>
<p><span class="lbl">Partner / certification track:</span> Microsoft Partner and Anthropic Partner via admin@ar27111994.dev; four Anthropic certifications completed Jun 2026.</p>
</div>"""

    body += section("Selected Products", "🛠")
    body += f"""<div class="entry">
<p class="entry-title">Webhook Debugger and Logger</p>
<p>Enterprise webhook testing suite: capture, replay, forward, validate (JSON Schema), mock, SSE streaming. Show HN launch. 25★.</p>
<p class="small">{icon('github', 7)} <a href="https://github.com/ar27111994/webhook-debugger-logger">github.com/ar27111994/webhook-debugger-logger</a></p>
</div>
<div class="entry">
<p class="entry-title">agent-harness</p>
<p>TypeScript CLI for discovering, staging, and wiring reusable AI-agent assets across 6 coding hosts. 3★.</p>
<p class="small">{icon('github', 7)} <a href="https://github.com/ar27111994/agent-harness">github.com/ar27111994/agent-harness</a></p>
</div>
<div class="entry">
<p class="entry-title">penpot-mcp</p>
<p>Agent skill for creating, auditing, and maintaining Penpot design systems and design-to-code workflows via MCP. 9★.</p>
<p class="small">{icon('github', 7)} <a href="https://github.com/ar27111994/penpot-mcp">github.com/ar27111994/penpot-mcp</a></p>
</div>"""

    body += section("Experience", "💼")
    body += """<div class="entry">
<p class="entry-title">Frontend Engineer</p>
<p class="entry-meta"><span class="org">Eagle 6 — cybersecurity</span><span class="date">Feb 2018 &ndash; Mar 2022</span></p>
<ul>
<li>Built Cloud Storage and Org Chart Modeling modules for flagship enterprise product using Angular, Akita, GoJS.</li>
<li>Implemented file management with role-based permissions, chunked TUS uploads, plugin-based document editing with concurrent editing and PDF export.</li>
<li>Built network monitoring dashboards (D3, Highcharts, Leaflet, OSM); standardized org-wide UI to accessible Material Design.</li>
<li>Interviewed and helped hire frontend developers; drove code quality through reviews and state management restructuring.</li>
</ul>
<p class="tag">Angular 7+ · TypeScript · RxJS · Akita · GoJS · D3 · Highcharts · Leaflet · TUS · Jest · SCSS</p>
</div>
<div class="entry">
<p class="entry-title">Full-Stack Freelance Contractor</p>
<p class="entry-meta"><span class="org">Upwork / Independent</span><span class="date">May 2017 &ndash; Feb 2018</span></p>
<ul>
<li>Delivered solo projects across web and mobile: 115-hour Azure/Citrix POC, $850 OpenCart app, 61-hour Grocery CRUD build.</li>
<li>Built mobile apps with Ionic 3, Angular 5+, PHP, MySQL, Cordova; deployed backends on UNIX, Apache, Nginx.</li>
<li>Created Microsoft Remote Desktop Services + Citrix App Layering on Azure — learned entire stack from scratch.</li>
</ul>
<p class="tag">Angular · Ionic · TypeScript · PHP · MySQL · Azure · Cordova · Apache · Nginx</p>
</div>
<div class="entry">
<p class="entry-title">Founder / Owner — Goggle Hunt</p>
<p class="entry-meta"><span class="org">Shopify dropshipping</span><span class="date">May 2017 &ndash; Sep 2017</span></p>
<p>Identified 600K/mo keyword; built Shopify store with influencer marketing, Gleam competitions, 150 email subscribers; sold on Flippa.</p>
</div>"""

    body += section("Technical Skills", "⚙")
    body += """<div class="skills-grid">
<div class="skill-block frontend"><h3>Frontend</h3><p>TypeScript · Angular · React · Next.js · RxJS · Angular Material · Akita · Jest · SCSS · D3 · Highcharts · GoJS · Leaflet</p></div>
<div class="skill-block backend"><h3>Backend / Systems</h3><p>Node.js · Express · ASP.NET Core · PHP · CodeIgniter · WordPress · OpenCart · API integrations · automation</p></div>
<div class="skill-block data"><h3>Data / Delivery</h3><p>MySQL · SQL Server · Docker · Azure · Linux · Git · GitHub · Jira · VS Code</p></div>
<div class="skill-block infra"><h3>Infrastructure</h3><p>Apache · Nginx · IIS · Cordova · Xamarin · Citrix App Layering</p></div>
</div>"""

    body += section("Education", "🎓")
    body += """<div class="entry">
<p class="entry-title">M.C.S. — Master of Computer Science</p>
<p class="entry-meta"><span class="org">Arid Agriculture University, Rawalpindi</span><span class="date">2014 &ndash; 2016</span></p>
</div>
<div class="entry">
<p class="entry-title">B.Sc. — Computer, Statistics and Mathematics</p>
<p class="entry-meta"><span class="org">University of the Punjab</span><span class="date">2012 &ndash; 2014</span></p>
</div>"""

    body += section("Certifications", "📜")
    for name, url, date, *_ in COURSERA_CERTS[:2]:
        body += f"""<div class="entry">
<p class="entry-title">Coursera — {esc(name)}</p>
<p class="entry-meta"><span class="org">{date}</span><span></span></p>
</div>"""

    body += '<p style="margin-top:9pt">' + icon('anthropic', 9) + ' <span class="lbl">Anthropic Partner</span> — 4 certifications completed Jun 2026:</p>'
    body += "<ul>"
    for name, *_ in ANTHROPIC_CERTS:
        body += f'<li><span class="lbl">{esc(name)}</span></li>'
    body += "</ul>"
    body += '<p style="margin-top:6pt">' + icon('microsoft', 9) + ' <span class="lbl">Microsoft Partner</span> — via admin@ar27111994.dev</p>'

    return f"<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Ahmed Rehan — ATS Resume</title><style>{_FONT_FACES}{CSS}</style></head><body>{body}</body></html>"


def build_client_html() -> str:
    """Client/freelance: photo, client-focused summary, Upwork-first, testimonials."""
    body = header(photo=True, role="Full-Stack Engineer for Devtools, Webhooks, Automation & AI-Assisted Product Workflows",
                  badges_html=f'<span class="badge ms">{icon("microsoft", 7)}Microsoft Partner</span>'
                              f'<span class="badge anth">{icon("anthropic", 7)}Anthropic Partner</span>'
                              f'<span class="badge">Devtools</span>'
                              f'<span class="badge">Webhooks</span>'
                              f'<span class="badge">AI workflows</span>'
                              f'<span class="badge oss">{icon("github", 7)}Open source</span>',
                  contact_count=5)

    body += section("Summary", "⭐")
    body += """<div class="entry">
<p>Full-stack engineer and solo builder focused on developer tools, webhook/API systems, workflow automation, and AI-assisted product workflows. I help clients turn messy integration and tooling problems into shipped products with real implementation depth, reliable delivery, and clean handoff quality.</p>
<p><span class="lbl">Best-fit work:</span> Developer tools, internal dashboards, webhook/API integrations, debugging systems, automation-heavy products, and engineering utilities.</p>
</div>"""

    body += section("Client Delivery Proof", "💼")
    body += """<div class="entry">
<p class="entry-title">Full-Stack Freelance Contractor</p>
<p class="entry-meta"><span class="org">Upwork / Independent Client Work</span><span class="date">May 2017 &ndash; Feb 2018</span></p>
<ul>
<li>Implemented, maintained, and delivered solo projects as a freelance contractor — 40+ jobs, 5.0★ rating.</li>
<li>Created a Microsoft Remote Desktop Services project with Citrix App Layering on Azure — learned the entire stack from scratch across a 115-hour engagement.</li>
<li>Built and extended mobile apps with Ionic 3, Angular 5+, PHP, MySQL, and Apache Cordova; deployed backends on UNIX, Apache, Nginx.</li>
<li>Spun out free and open-source projects from freelancing work (with client consent); contributed bugfixes to open-source libraries.</li>
<li>Fixed, maintained, and extended existing projects developed and deployed by other developers.</li>
</ul>
<p class="tag">Angular · Ionic · TypeScript · PHP · MySQL · Azure · Cordova · Apache · Nginx</p>
</div>"""

    body += section("Selected Products", "🛠")
    body += f"""<div class="entry">
<p class="entry-title">Webhook Debugger and Logger</p>
<p>Open-source webhook testing suite: capture, replay, forward, validate, mock, SSE streaming. Show HN front page. 25★.</p>
<p class="small">{icon('github', 7)} <a href="https://github.com/ar27111994/webhook-debugger-logger">github.com/ar27111994/webhook-debugger-logger</a></p>
</div>
<div class="entry">
<p class="entry-title">agent-harness</p>
<p>TypeScript CLI for discovering, staging, and wiring reusable AI-agent assets across 6 coding hosts. 3★.</p>
<p class="small">{icon('github', 7)} <a href="https://github.com/ar27111994/agent-harness">github.com/ar27111994/agent-harness</a></p>
</div>"""

    body += section("Enterprise Background", "⭐")
    body += """<div class="entry">
<p class="entry-title">Frontend Engineer</p>
<p class="entry-meta"><span class="org">Eagle 6 — cybersecurity</span><span class="date">Feb 2018 &ndash; Mar 2022</span></p>
<ul>
<li>Built enterprise product modules: cloud storage with role-based permissions, org chart modeling (GoJS + Akita), plugin-based document editing, chunked TUS uploads.</li>
<li>Built network monitoring dashboards: D3, Highcharts, Leaflet, OSM; standardized org-wide UI to accessible Material Design.</li>
<li>Interviewed and helped hire frontend developers; drove code quality and mentored the team.</li>
</ul>
<p class="tag">Angular · TypeScript · RxJS · Akita · GoJS · D3 · Highcharts · Leaflet · Jest · SCSS</p>
</div>
<div class="entry">
<p class="entry-title">Founder / Owner — Goggle Hunt</p>
<p class="entry-meta"><span class="org">Shopify dropshipping — 600K/mo keyword, Flippa exit</span><span class="date">May 2017 &ndash; Sep 2017</span></p>
<p>Built, marketed, and sold a Shopify store; Instagram influencer outreach, Gleam competitions, ~150 email subscribers.</p>
</div>"""

    body += section("What Clients Say", "💬")
    body += """<div class="entry">
<p>"Ahmed is a trusted member of our team. He has always produced top quality work. We will always return to him first when we get more work." <span class="muted">— Upwork Client, Citrix App Layering + Azure POC (115h)</span></p>
</div>
<div class="entry">
<p>"Ahmed's work on our project was outstanding. His communication was top-notch, he met all deadlines, and his skills were exceptionally strong." <span class="muted">— Upwork Client, Grocery CRUD (61h)</span></p>
</div>
<div class="entry">
<p>"Ahmed exemplifies everything a company would need in a Frontend Developer: Collaborative, Critical Thinker, Hard Worker, and Extremely Knowledgeable." <span class="muted">— Reilly Gray, Scrum Master II, Eagle 6</span></p>
</div>"""

    body += section("Partner Track", "⭐")
    body += '<p style="margin-top:3pt">' + icon('anthropic', 9) + ' <span class="lbl">Anthropic Partner</span> — 4 certifications (Jun 2026) via admin@ar27111994.dev</p>'
    body += '<p style="margin-top:6pt">' + icon('microsoft', 9) + ' <span class="lbl">Microsoft Partner</span> — via admin@ar27111994.dev</p>'

    return f"<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Ahmed Rehan — Client & Freelance Resume</title><style>{_FONT_FACES}{CSS}</style></head><body>{body}</body></html>"


def build() -> None:
    RESUME_DIR.mkdir(parents=True, exist_ok=True)

    variants = [
        ("resume_full.pdf", build_full_html(), "A4",
         "Ahmed Rehan — Full Resume",
         "Comprehensive resume with project depth, experience, education, and public proof."),
        ("resume.pdf", build_ats_html(), "Letter",
         "Ahmed Rehan — ATS Resume",
         "ATS-safe default resume for general applications."),
        ("resume_client_freelance.pdf", build_client_html(), "A4",
         "Ahmed Rehan — Client & Freelance Resume",
         "Client-facing resume focused on delivery, automation, and product workflow work."),
        ("resume_one_page.pdf", build_full_html(), "A4",
         "Ahmed Rehan — One-Page Resume",
         "Condensed one-page resume for quick scanning.", "1"),
    ]

    for filename, html, page_format, title, subject, *rest in variants:
        page_ranges = rest[0] if rest else None
        path = RESUME_DIR / filename
        tmp = RESUME_DIR / (filename + ".tmp")

        with sync_playwright() as p:
            browser = p.chromium.launch()
            page = browser.new_page()
            page.set_content(html, wait_until="networkidle")
            page.pdf(path=str(tmp), format=page_format, print_background=True,
                     page_ranges=page_ranges)
            browser.close()

        import shutil
        shutil.move(str(tmp), str(path))

        reader = PdfReader(str(path))
        writer = PdfWriter()
        for pg in reader.pages:
            writer.add_page(pg)
        writer.add_metadata({
            "/Title": title, "/Author": "Ahmed Rehan",
            "/Subject": subject,
            "/Keywords": "Ahmed Rehan, full stack engineer, devtools, automation, webhook, AI agent, resume",
        })
        with open(str(path), "wb") as f:
            writer.write(f)

        import os
        print(f"  {filename}: {os.path.getsize(path)} bytes")

if __name__ == "__main__":
    build()
