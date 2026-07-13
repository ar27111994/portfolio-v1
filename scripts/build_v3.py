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
    return f'<img src="{uri}" width="{size}" height="{size}" style="width:{size}pt;height:{size}pt;vertical-align:-1.5pt;flex-shrink:0" alt="">'

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
@page { size: A4; margin: 28pt 32pt 28pt 32pt; }
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
  font-size: 8.8pt;
  line-height: 1.48;
  color: #1a1f2e;
  background: #fff;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Header ─── */
.hdr {
  display: flex; align-items: flex-start; gap: 14pt;
  padding-bottom: 14pt; margin-bottom: 4pt;
}
.hdr-photo {
  width: 66pt; height: 66pt; border-radius: 50%;
  object-fit: cover; object-position: 50% 30%;
  border: 1.8pt solid #dde3ed; flex-shrink: 0;
  filter: grayscale(100%);
}
.hdr-info { flex: 1; min-width: 0; }
.hdr-name {
  font-size: 22pt; font-weight: 800; letter-spacing: -0.03em;
  color: #071a33; margin: 0 0 3pt;
}
.hdr-role {
  font-size: 9.2pt; font-weight: 600; color: #2c5f8a;
  margin: 0 0 5pt; line-height: 1.35;
}
.hdr-loc { font-size: 8pt; color: #64748b; margin: 0 0 6pt; }
.hdr-loc img { vertical-align: -1pt; margin-right: 2pt; }

.contact-row {
  display: flex; flex-wrap: wrap; gap: 2pt 8pt;
  font-size: 7.8pt; color: #475569; margin-bottom: 6pt;
}
.contact-row a { color: #2563eb; text-decoration: none; }
.contact-row img { vertical-align: -1.5pt; margin-right: 1.5pt; }
.contact-row .sep { color: #cbd5e1; }

/* ── Badges (colored) ─── */
.badge-row { display: flex; flex-wrap: wrap; gap: 4pt; }
.badge {
  display: inline-flex; align-items: center; gap: 3pt;
  padding: 2.2pt 6pt; border-radius: 999px;
  font-size: 7pt; font-weight: 700;
  border: 1pt solid #e2e8f0; background: #f8fafc; color: #475569;
}
.badge img { width: 7pt; height: 7pt; flex-shrink: 0; }
.badge.ms   { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.badge.anth { border-color: #fed7aa; background: #fff7ed; color: #c2410c; }
.badge.oss  { border-color: #d1d5db; background: #f3f4f6; color: #374151; }

/* ── Section headers (blue accent, semantic icons via content) ─── */
h2 {
  font-size: 8pt; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.1em;
  color: #1d4ed8;
  margin: 16pt 0 6pt; padding-bottom: 2.5pt;
  border-bottom: 1pt solid #dbeafe;
}
.entry li::marker { color: #1d4ed8; }

/* ── Entries ─── */
.entry { margin-bottom: 6pt; }
.entry-title {
  font-size: 9.2pt; font-weight: 700; color: #0f172a; margin: 0 0 1.5pt;
}
.entry-meta {
  display: flex; justify-content: space-between;
  font-size: 7.8pt; color: #64748b; margin-bottom: 3pt;
}
.entry-meta .org { font-weight: 650; color: #334155; }
.entry-meta .date {
  font-size: 7.2pt; font-weight: 600; color: #1d4ed8;
  background: #eff6ff; padding: 1pt 5pt; border-radius: 999px;
  white-space: nowrap;
}
.entry p { font-size: 8.2pt; color: #374151; line-height: 1.5; margin-bottom: 3pt; }
.entry li { font-size: 8pt; color: #374151; line-height: 1.45; margin-bottom: 2pt; }
.entry ul { margin: 3pt 0 0 14pt; padding: 0; }
.entry li::marker { color: #1d4ed8; }
.entry img { width: 8pt; height: 8pt; vertical-align: -1pt; }
/* ── Writing ─── */
.writing-item { margin-bottom: 2pt; }
.writing-item a { font-size: 8.2pt; color: #2563eb; text-decoration: none; font-weight: 600; }
.writing-item .src { font-size: 7.2pt; color: #94a3b8; }

/* ── Skills ─── */
.skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16pt; }
.skill-block { margin-bottom: 5pt; }
.skill-block h3 { font-size: 8.2pt; font-weight: 700; color: #0f172a; margin-bottom: 2pt; }
.skill-block h3::before { content: '•'; margin-right: 3pt; }
.skill-block.frontend h3::before { color: #1d4ed8; }
.skill-block.backend h3::before { color: #059669; }
.skill-block.data h3::before { color: #d97706; }
.skill-block.infra h3::before { color: #7c3aed; }
.skill-block p { font-size: 7.8pt; color: #374151; line-height: 1.5; }

/* ── Common ─── */
a { color: #2563eb; text-decoration: none; }
.lbl { font-weight: 700; color: #0f172a; }
.muted { color: #64748b; }
.small { font-size: 7.8pt; color: #475569; line-height: 1.5; }
.tag { font-size: 6.5pt; color: #64748b; margin-top: 2pt; }
"""

# ── Helper ────────────────────────────────────────────────────────────────────
def esc(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

# ── Header ────────────────────────────────────────────────────────────────────
def header(photo: bool = False) -> str:
    ph = f'<img class="hdr-photo" src="{PHOTO_SRC}" alt="Ahmed Rehan">' if photo and PHOTO_SRC else ""
    return f"""<header class="hdr">
  {ph}
  <div class="hdr-info">
    <h1 class="hdr-name">Ahmed Rehan</h1>
    <p class="hdr-role">Full-Stack Engineer &bull; Devtools, Agent Systems, Automation, Webhooks &amp; Performance-Conscious Products</p>
    <p class="hdr-loc">{icon('globe', 9)} {esc(LOCATION)}</p>
    <div class="contact-row">
      {icon('gmail', 8)} <a href="mailto:{EMAIL}">{EMAIL}</a>
      <span class="sep">|</span> {icon('whatsapp', 8)} {PHONE}
      <span class="sep">|</span> {icon('globe', 8)} <a href="{SITE_URL}">ar27111994.dev</a>
      <span class="sep">|</span> {icon('github', 8)} <a href="{GITHUB_URL}">github.com/ar27111994</a>
    </div>
    <div class="contact-row">
      {icon('linkedin', 8)} <a href="{LINKEDIN_URL}">linkedin.com/in/ar27111994</a>
      <span class="sep">|</span> {icon('upwork', 8)} <a href="{UPWORK_URL}">Upwork</a>
      <span class="sep">|</span> {icon('x', 8)} <a href="{X_URL}">x.com/ar27111994</a>
      <span class="sep">|</span> {icon('devdotto', 8)} <a href="{DEVTO_URL}">dev.to/ar27111994</a>
    </div>
    <div class="badge-row">
      <span class="badge ms">{icon('microsoft', 7)} Microsoft Partner</span>
      <span class="badge anth">{icon('anthropic', 7)} Anthropic Partner</span>
      <span class="badge oss">{icon('github', 7)} Open-source maintainer</span>
      <span class="badge">Devtools builder</span>
      <span class="badge">Webhook / API tooling</span>
      <span class="badge">AI-agent workflows</span>
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
<p class="entry-meta"><span class="org">Eagle 6 — cybersecurity product securing large enterprises by detecting unknown vulnerabilities</span><span class="date"><span>Feb 2018 &ndash; Mar 2022</span></span></p>
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
</div>"""
    # Upwork
    body += """<div class="entry">
<p class="entry-title">Full-Stack Freelance Contractor</p>
<p class="entry-meta"><span class="org">Upwork / Independent Client Work</span><span class="date"><span>May 2017 &ndash; Feb 2018</span></span></p>
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
</div>"""
    # Goggle Hunt
    body += """<div class="entry">
<p class="entry-title">Founder / Owner — Goggle Hunt</p>
<p class="entry-meta"><span class="org">Shopify dropshipping — fashion &amp; sports goggles, US &amp; EU markets</span><span class="date"><span>May 2017 &ndash; Sep 2017</span></span></p>
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
<p class="entry-meta"><span class="org">GMINNS</span><span class="date"><span>Jul 2015 &ndash; Apr 2016</span></span></p>
<p>PHP web applications, database-driven features, custom CMS components.</p>
</div>"""
    # COMITS
    body += """<div class="entry">
<p class="entry-title">Web Developer</p>
<p class="entry-meta"><span class="org">COMITS</span><span class="date"><span>Jul 2014 &ndash; Mar 2015</span></span></p>
<p>Client web projects in PHP / JavaScript; frontend, backend, deployment.</p>
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
<p class="entry-meta"><span class="org">Arid Agriculture University, Rawalpindi</span><span class="date"><span>Oct 2014 &ndash; Aug 2016</span></span></p>
<p class="small">Digital Design &middot; Web &amp; Desktop Development &middot; Operating Systems &middot; System Programming &middot; Networking &middot; Software Engineering &middot; Database Systems &middot; Artificial Intelligence &middot; Data Structures</p>
</div>
<div class="entry">
<p class="entry-title">B.Sc. — Computer, Statistics and Mathematics</p>
<p class="entry-meta"><span class="org">University of the Punjab</span><span class="date"><span>Sep 2012 &ndash; Jul 2014</span></span></p>
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

    return f"<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Ahmed Rehan — Resume</title><style>{CSS}</style></head><body>{body}</body></html>"

# ── PDF Generation ────────────────────────────────────────────────────────────

def build():
    RESUME_DIR.mkdir(parents=True, exist_ok=True)

    html = build_full_html()
    path = RESUME_DIR / "resume_full.pdf"
    tmp = RESUME_DIR / "resume_full_tmp.pdf"

    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        page.pdf(path=str(tmp), format="A4", print_background=True)
        browser.close()

    # Replace final file
    import shutil
    shutil.move(str(tmp), str(path))

    # Add metadata
    reader = PdfReader(str(path))
    writer = PdfWriter()
    for pg in reader.pages:
        writer.add_page(pg)
    writer.add_metadata({
        "/Title": "Ahmed Rehan — Full Resume",
        "/Author": "Ahmed Rehan",
        "/Subject": "Comprehensive resume with project depth, experience, education, and public proof.",
        "/Keywords": "Ahmed Rehan, full stack engineer, devtools, automation, webhook, AI agent, resume",
    })
    with open(str(path), "wb") as f:
        writer.write(f)

    import os
    print(f"  resume_full.pdf: {os.path.getsize(path)} bytes")
    print("\nDone.")

if __name__ == "__main__":
    build()
