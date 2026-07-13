"""
Canonical resume generator — matches live-deployed design (June 2026).
Design: Segoe UI, teal/blue-green accents, circular photo, pill badges,
        inline SVG icons, clean whitespace-based layout.
"""
from __future__ import annotations

import base64, hashlib
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable

import pdfplumber
from playwright.sync_api import sync_playwright
from pypdf import PdfReader, PdfWriter

import os as _os
PROJECT_ROOT = Path(__file__).resolve().parent.parent
RESUME_DIR = PROJECT_ROOT / "public" / "resume"
PHOTO_PATH = PROJECT_ROOT / "public" / "pic.jpg"

SITE_URL = "https://www.ar27111994.dev"
GITHUB_URL = "https://github.com/ar27111994"
LINKEDIN_URL = "https://linkedin.com/in/ar27111994"
UPWORK_URL = "https://www.upwork.com/freelancers/~0188baee67e8f543e7"
DEVTO_URL = "https://dev.to/ar27111994"
X_URL = "https://x.com/ar27111994"
DISCORD_URL = "#contact-title"
EMAIL = "admin@ar27111994.dev"
PHONE = "+92-331-588-7235"
LOCATION = "Rawalpindi, Pakistan"

# ── Photo ─────────────────────────────────────────────────────────────────────
PHOTO_SRC = ""
if PHOTO_PATH.exists():
    with open(PHOTO_PATH, "rb") as f:
        PHOTO_SRC = f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode()}"

# ── Shared CSS ────────────────────────────────────────────────────────────────
CSS = r"""
@page { size: A4; margin: 0; }
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: 'Segoe UI', system-ui, -apple-system, Arial, sans-serif;
  font-size: 8.5pt;
  line-height: 1.45;
  color: #1a1a1a;
  background: #fff;
  padding: 26pt 34pt 22pt 34pt;
  -webkit-print-color-adjust: exact;
  print-color-adjust: exact;
}

/* ── Header ─── */
.hdr { padding-bottom: 8pt; margin-bottom: 3pt;
  display: flex;
  align-items: flex-start;
  gap: 14pt;
  padding-bottom: 12pt;
  margin-bottom: 6pt;
}
.hdr-photo {
  width: 54pt; height: 54pt;
  border-radius: 50%;
  object-fit: cover;
  object-position: 50% 30%;
  border: 1.5pt solid #dde3ed;
  flex-shrink: 0;
  filter: grayscale(100%);
}
.hdr-info { flex: 1; min-width: 0; }
.hdr-name {
  font-size: 22pt; font-weight: 800;
  letter-spacing: -0.03em;
  color: #071a33;
  margin: 0 0 3pt;
}
.hdr-role {
  font-size: 9.5pt; font-weight: 600;
  color: #2c5f8a;
  margin: 0 0 5pt;
  line-height: 1.35;
}
.hdr-loc {
  font-size: 8pt; color: #6b7280;
  margin: 0 0 6pt;
}
.hdr-loc svg { width: 10pt; height: 10pt; vertical-align: -1pt; margin-right: 2pt; }

/* ── Contact row ─── */
.contact-row {
  display: flex; flex-wrap: wrap; gap: 3pt 8pt;
  font-size: 7.2pt; color: #4b5563; margin-bottom: 5pt;
}
.contact-row a { color: #2563eb; text-decoration: none; }
.contact-row a:hover { text-decoration: underline; }
.contact-row svg { width: 9pt; height: 9pt; vertical-align: -1.5pt; margin-right: 1pt; }
.contact-row .sep { color: #d1d5db; }

/* ── Badge pills ─── */
.badge-row {
  display: flex; flex-wrap: wrap; gap: 3pt;
}
.badge {
  display: inline-flex; align-items: center; gap: 3pt;
  padding: 2.5pt 7pt; border-radius: 999px;
  font-size: 7.5pt; font-weight: 700;
  border: 1pt solid #dde3ed;
  background: #f8fafc;
  color: #374151;
}
.badge svg { width: 8pt; height: 8pt; flex-shrink: 0; }
.badge.blue   { border-color: #bfdbfe; background: #eff6ff; color: #1d4ed8; }
.badge.amber  { border-color: #fde68a; background: #fffbeb; color: #b45309; }
.badge.green  { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
.badge.purple { border-color: #ddd6fe; background: #f5f3ff; color: #6d28d9; }
.badge.teal   { border-color: #99f6e4; background: #f0fdfa; color: #0f766e; }

/* ── Section headers ─── */
h2 {
  font-size: 8pt; font-weight: 800;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: #0f766e;
  margin: 7pt 0 2pt 0;
  padding-bottom: 2pt;
}
h2::before {
  content: '◆'; font-size: 5pt; color: #0f766e;
  margin-right: 5pt; vertical-align: 1.5pt;
}

/* ── Entries ─── */
.entry { margin-bottom: 5pt; }
.entry-title {
  font-size: 8.8pt; font-weight: 700; color: #0f172a;
  margin: 0 0 1pt;
}
.entry-meta {
  display: flex; justify-content: space-between;
  font-size: 8.5pt; color: #64748b; margin-bottom: 3pt;
}
.entry-meta .org { font-weight: 650; color: #374151; }
.entry p, .entry li { font-size: 7.8pt; color: #374151; line-height: 1.4; margin-bottom: 2pt; }
.entry ul { margin: 2pt 0 0 12pt; padding: 0; }
.entry li::marker { color: #0f766e; }

/* ── Writing entries ─── */
.writing-item { margin-bottom: 2pt; font-size: 8pt; }
.writing-item a { color: #2563eb; text-decoration: none; font-weight: 600; }
.writing-item a:hover { text-decoration: underline; }
.writing-item .src { color: #64748b; font-size: 7.5pt; }

/* ── Skills grid ─── */
.skills-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 18pt; }
.skill-block { margin-bottom: 8pt; }
.skill-block h3 { font-size: 8.5pt; font-weight: 700; color: #0f172a; margin-bottom: 2pt; }
.skill-block p { font-size: 8.5pt; color: #374151; line-height: 1.55; }

/* ── Links ─── */
a { color: #2563eb; text-decoration: none; }
a:hover { text-decoration: underline; }
.entry svg, .writing-item svg, .small svg { width: 8pt; height: 8pt; vertical-align: -1pt; }
.lbl { font-weight: 700; color: #0f172a; }
.muted { color: #64748b; }
.small { font-size: 7.8pt; color: #4b5563; line-height: 1.5; }
.tag { font-size: 6.5pt; color: #64748b; }

/* ── Footer icons ─── */
.tri { color: #d97706; font-size: 9pt; margin-right: 3pt; }

/* ── Compact overrides for one-page ─── */
body.compact { font-size: 8.3pt; padding: 24pt 30pt 20pt 30pt; }
body.compact .hdr { padding-bottom: 8pt; margin-bottom: 3pt; padding-bottom: 8pt; }
body.compact .hdr-photo { width: 56pt; height: 56pt; }
body.compact .hdr-name { font-size: 19pt; }
body.compact .hdr-role { font-size: 9pt; }
body.compact h2 { font-size: 7.2pt; margin: 12pt 0 4pt 0; padding-bottom: 2pt; margin: 12pt 0 5pt 0; font-size: 7.2pt; }
body.compact .entry { margin-bottom: 5pt; }
body.compact .entry-title { font-size: 8.5pt; font-size: 8.5pt; }
body.compact .entry p, body.compact .entry li { font-size: 7.2pt; }
"""

# ── SVG icons ─────────────────────────────────────────────────────────────────
ICONS = {
    "email": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
    "phone": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    "globe": '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>',
    "github": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/></svg>',
    "linkedin": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>',
    "x": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>',
    "upwork": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M18.561 13.158c-1.102 0-2.135-.467-3.074-1.227l.228-1.076.008-.042c.207-1.143.849-3.06 2.839-3.06 1.492 0 2.703 1.212 2.703 2.703-.001 1.489-1.212 2.702-2.704 2.702zm0-8.14c-2.539 0-4.51 2.063-4.51 4.603 0 .845.23 1.633.628 2.313l-2.057 4.154-1.474-4.685c.359-.647.565-1.402.565-2.206 0-2.341-1.905-4.246-4.246-4.246S3.22 5.858 3.22 8.199s1.905 4.246 4.246 4.246c.542 0 1.058-.11 1.534-.296l2.615 7.601h.005l.425 1.254 3.474-7.035c.963.613 2.102.978 3.329.978 3.302 0 5.993-2.687 5.993-5.989s-2.691-5.989-5.993-5.989z"/></svg>',
    "devto": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7.42 10.05c-.18-.16-.46-.23-.84-.23H6l.02 2.44.04 2.45.56-.02c.41 0 .63-.07.83-.26.24-.24.26-.36.26-2.2 0-1.91-.02-1.96-.29-2.18zM0 4.94v14.12h24V4.94H0zM8.56 15.3c-.44.58-1.06.77-2.53.77H4.71V8.53h1.4c1.67 0 2.16.18 2.6.9.27.43.29.6.32 2.57.05 2.23-.02 2.73-.47 3.3zm5.09-5.47h-2.47v1.77h1.75v1.28h-1.75v2.84h2.47v1.32H9.22V8.56h4.43v1.27zm7.56 5.47c-.6.58-1.19.77-2.45.77H17.3l-.03-2.17-.02-2.17h1.04c1.24 0 1.62.13 2.2.64.59.52.7.94.7 2.32 0 1.35-.14 1.85-.64 2.4z"/></svg>',
    "discord": '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>',
    "microsoft": '<svg viewBox="0 0 24 24"><rect x="1" y="1" width="10" height="10" fill="#f25022"/><rect x="13" y="1" width="10" height="10" fill="#7fba00"/><rect x="1" y="13" width="10" height="10" fill="#00a4ef"/><rect x="13" y="13" width="10" height="10" fill="#ffb900"/></svg>',
    "anthropic": '<svg viewBox="0 0 24 24" fill="none"><rect width="24" height="24" rx="4" fill="#d97706"/><text x="12" y="17" text-anchor="middle" font-size="14" font-weight="900" fill="white" font-family="sans-serif">A</text></svg>',
}

# ── Helper functions ──────────────────────────────────────────────────────────

def escape(text: str) -> str:
    return text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")

def icon(name: str) -> str:
    return ICONS.get(name, "")

def hdr(photo: bool = False) -> str:
    photo_html = f'<img class="hdr-photo" src="{PHOTO_SRC}" alt="Ahmed Rehan"/>' if photo and PHOTO_SRC else ""
    return f"""<header class="hdr">
  {photo_html}
  <div class="hdr-info">
    <h1 class="hdr-name">Ahmed Rehan</h1>
    <p class="hdr-role">Full-Stack Engineer | Devtools, Agent Systems, Automation, Webhooks &amp; Performance-Conscious Products</p>
    <p class="hdr-loc">{icon('globe')} {escape(LOCATION)}</p>
    <div class="contact-row">
      {icon('email')} <a href="mailto:{EMAIL}">{EMAIL}</a>
      <span class="sep">|</span> {icon('phone')} {PHONE}
      <span class="sep">|</span> {icon('globe')} <a href="{SITE_URL}">ar27111994.dev</a>
      <span class="sep">|</span> {icon('github')} <a href="{GITHUB_URL}">github.com/ar27111994</a>
    </div>
    <div class="contact-row">
      {icon('linkedin')} <a href="{LINKEDIN_URL}">linkedin.com/in/ar27111994</a>
      <span class="sep">|</span> {icon('upwork')} <a href="{UPWORK_URL}">Upwork</a>
      <span class="sep">|</span> {icon('x')} <a href="{X_URL}">x.com/ar27111994</a>
      <span class="sep">|</span> {icon('devto')} <a href="{DEVTO_URL}">dev.to/ar27111994</a>
    </div>
    <div class="badge-row">
      <span class="badge blue">{icon('microsoft')} Microsoft Partner</span>
      <span class="badge amber">{icon('anthropic')} Anthropic Partner</span>
      <span class="badge">{icon('github')} Open-source maintainer</span>
      <span class="badge teal">Devtools builder</span>
      <span class="badge purple">Webhook / API tooling</span>
      <span class="badge green">AI-agent workflows</span>
    </div>
  </div>
</header>"""

def sec(title: str) -> str:
    return f"<h2>{escape(title)}</h2>"

# ── Build full resume ─────────────────────────────────────────────────────────

ANTHROPIC_CERTS = [
    ("Building with the Claude API", "https://verify.skilljar.com/c/kqdnoajm977y"),
    ("Claude Code in Action", "https://verify.skilljar.com/c/gv2gvaw48jus"),
    ("Introduction to Agent Skills", "https://verify.skilljar.com/c/8wqzsm9q9o9w"),
    ("Introduction to Model Context Protocol", "https://verify.skilljar.com/c/nhscqtess3nq"),
]

COURSERA_CERTS = [
    ("Machine Learning Strategy & Error Analysis", "https://www.coursera.org/account/accomplishments/verify/HQ3883739EQ7", "12/05/2019"),
    ("Deep Learning Best Practices & Optimization", "https://www.coursera.org/account/accomplishments/verify/U4QYCQLM9WUH", "07/04/2019"),
    ("Deep Learning Foundations + TensorFlow", "https://www.coursera.org/account/accomplishments/verify/TDDMYNV57A99", "20/08/2018"),
    ("Big Data Fundamentals & Hadoop", "https://www.coursera.org/account/accomplishments/verify/HHVS4SJNXDR8", "29/10/2018"),
]

def build_full_html() -> str:
    body = hdr(photo=False)

    # Summary
    body += sec("Summary")
    body += """<div class="entry">
<p>Product-minded full-stack engineer and solo builder focused on developer tools, workflow automation, agent systems, webhook/API infrastructure, and performance-conscious software. Strong background in frontend architecture, interactive product engineering, and full-stack delivery across web, mobile, API-driven, and enterprise workflow systems.</p>
<p><span class="lbl">Partner / certification track:</span> Microsoft Partner and Anthropic Partner through admin@ar27111994.dev; four Anthropic certifications completed Jun 2026.</p>
</div>"""

    # Selected Products
    body += sec("Selected Products & Open-Source Work")
    body += f"""<div class="entry">
<p class="entry-title">Webhook Debugger and Logger</p>
<p>Enterprise-grade webhook testing suite: capture, inspect, replay, forward, validate (JSON Schema), mock, and stream events in real time. SSE live streaming. SSRF-conscious forwarding. HMAC-SHA256 signature verification, structured incident log.</p>
<p class="small">{icon('github')} <a href="https://github.com/ar27111994/webhook-debugger-logger">github.com/ar27111994/webhook-debugger-logger</a></p>
</div>
<div class="entry">
<p class="entry-title">agent-harness</p>
<p>Node.js / TypeScript CLI for discovering, staging, activating, and wiring reusable AI-agent assets across VS Code/Copilot, OpenCode, Cursor, Zed, Claude Code, and Pi.</p>
<p class="small">{icon('github')} <a href="https://github.com/ar27111994/agent-harness">github.com/ar27111994/agent-harness</a></p>
</div>
<div class="entry">
<p class="entry-title">penpot-mcp</p>
<p>An agent skill for creating, auditing, and maintaining Penpot design systems, prototypes, and design tokens via MCP.</p>
<p class="small">{icon('github')} <a href="https://github.com/ar27111994/penpot-mcp">github.com/ar27111994/penpot-mcp</a></p>
</div>
<div class="entry">
<p class="entry-title">Legacy OSS / Freemium</p>
<p>OpenCart 3.x marketplace extension · Mosaico CodeIgniter integration · OpenBiz (ASP.NET MVC supply-chain) · Generic Repository Pattern · Bookstore &amp; Shopping Cart Library (used by hundreds on phpclasses.org). Additional gist proof: Global AI-agent coding rules · Remote Desktop Services HA Farm</p>
</div>"""

    # Writing
    body += sec("Writing / Public Technical Content")
    writings = [
        ("Agent assets need a lifecycle, not a dumping ground", "https://dev.to/ar27111994/agent-assets-need-a-lifecycle-not-a-dumping-ground-1i3h"),
        ("I built a more restrained alternative to giant AI skill bundles", "https://dev.to/ar27111994/i-built-a-more-restrained-alternative-to-giant-ai-skill-bundles-1kf5"),
        ("Antigravity CLI with WSL2 — setup and full story", "https://dev.to/ar27111994/antigravity-cli-with-wsl2-setup-and-full-story"),
        ("Show HN: Webhook Debugger with replay and SSRF checks", "https://news.ycombinator.com/item?id=46632472"),
    ]
    for title, url in writings:
        src = "Dev.to" if "dev.to" in url else "Hacker News"
        body += f'<p class="writing-item"><a href="{url}">{escape(title)}</a> <span class="src">{src}</span></p>'

    # Experience
    body += sec("Experience")

    body += """<div class="entry">
<p class="entry-title">Frontend Engineer</p>
<p class="entry-meta"><span class="org">Eagle 6 — cybersecurity product securing large enterprises by detecting unknown vulnerabilities</span><span>Feb 2018 – Mar 2022</span></p>
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
<p class="tag">Angular 7+ · TypeScript · Angular Material · RxJS · Akita (Redux/Flux) · GoJS · D3 · Highcharts · Leaflet · OSM · Jest · SCSS · BEM · TUS</p>
</div>"""

    body += """<div class="entry">
<p class="entry-title">Full-Stack Freelance Contractor</p>
<p class="entry-meta"><span class="org">Upwork / Independent Client Work</span><span>May 2017 – Feb 2018</span></p>
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
<p class="tag">Angular · Ionic · TypeScript · PHP · MySQL · CodeIgniter · WordPress · OpenCart · C# · Azure · Cordova · Xamarin · Apache · Nginx</p>
</div>"""

    body += """<div class="entry">
<p class="entry-title">Founder / Owner — Goggle Hunt</p>
<p class="entry-meta"><span class="org">Shopify dropshipping</span><span>May 2017 – Sep 2017</span></p>
<p>Built, operated, marketed, and sold; influencer outreach, email capture flows, Flippa exit.</p>
</div>"""

    body += """<div class="entry">
<p class="entry-title">PHP Developer</p>
<p class="entry-meta"><span class="org">GMINNS</span><span>Jul 2015 – Apr 2016</span></p>
<p>PHP web applications, database-driven features, custom CMS components.</p>
</div>"""

    body += """<div class="entry">
<p class="entry-title">Web Developer</p>
<p class="entry-meta"><span class="org">COMITS</span><span>Jul 2014 – Mar 2015</span></p>
<p>Client web projects in PHP / JavaScript; frontend, backend, deployment.</p>
</div>"""

    # Skills
    body += sec("Technical Skills")
    body += """<div class="skills-grid">
<div class="skill-block"><h3>Frontend</h3><p>TypeScript · Angular · React · Next.js · RxJS · Angular Material · Akita · Jest · SCSS · BEM · D3 · Highcharts · GoJS · Leaflet · OSM</p></div>
<div class="skill-block"><h3>Backend / Systems</h3><p>Node.js · Express · ASP.NET Core · PHP · CodeIgniter · WordPress · OpenCart · API integrations · automation workflows</p></div>
<div class="skill-block"><h3>Data / Delivery</h3><p>MySQL · SQL Server · Docker · Azure · Linux · Apify · Vercel · Git · GitHub · Jira · VS Code · WebStorm · Visual Studio</p></div>
<div class="skill-block"><h3>Infrastructure</h3><p>Apache · Nginx · IIS · XAMPP · Cordova · Xamarin · Citrix App Layering</p></div>
</div>"""

    # Education
    body += sec("Education")
    body += """<div class="entry">
<p class="entry-title">M.C.S. — Master of Computer Science</p>
<p class="entry-meta"><span class="org">Arid Agriculture University, Rawalpindi</span><span>Oct 2014 – Aug 2016</span></p>
<p class="tag">Digital Design · Web &amp; Desktop Development · OS · System Programming · Networking · Software Engineering · Database Systems · AI · Data Structures</p>
</div>
<div class="entry">
<p class="entry-title">B.Sc. — Computer, Statistics and Mathematics</p>
<p class="entry-meta"><span class="org">University of the Punjab</span><span>Sep 2012 – Jul 2014</span></p>
<p class="tag">CS · Software Engineering · Databases · OS · Statistics &amp; Probability · Calculus · Mathematical Methods</p>
</div>"""

    # Coursera certs
    body += sec("Certifications / Coursework")
    body += '<div class="entry"><p class="entry-title">Coursera Certifications</p>'
    for name, url, date in COURSERA_CERTS:
        body += f'<p class="small"><span class="lbl">{escape(name)}</span> ({date}) — <a href="{url}">{url.replace("https://", "")}</a></p>'
    body += '</div>'

    # Anthropic certs
    body += '<p style="margin-top:12pt"><span class="tri">▲</span> <span class="lbl">Anthropic Certifications</span> <span class="muted">— completed Jun 2026</span></p>'
    body += "<ul>"
    for name, url in ANTHROPIC_CERTS:
        body += f'<li><span class="lbl">{escape(name)}</span> — <a href="{url}">{url.replace("https://", "")}</a></li>'
    body += "</ul>"

    # Microsoft RDS
    body += '<p style="margin-top:10pt"><span class="tri">▲</span> <span class="lbl">Microsoft Virtual Academy</span></p>'
    body += '<p style="margin-left:12pt"><span class="lbl">Microsoft Remote Desktop Services Deep Dive</span> <span class="muted">— Pending verification</span> <a href="https://microsoft.com/en-us/learning/">(microsoft.com/en-us/learning/)</a></p>'

    # Partner track
    body += '<p style="margin-top:12pt"><span class="tri">▲</span> <span class="lbl">PARTNER / ACTIVE CREDENTIAL TRACK</span></p>'
    body += f'<p style="margin-left:12pt"><span class="tri">▲</span> <span class="lbl">Microsoft Partner:</span> partner identity via {EMAIL}.</p>'
    body += f'<p style="margin-left:12pt"><span class="tri">▲</span> <span class="lbl">Anthropic Partner:</span> partner identity via {EMAIL}.</p>'

    return f"<!DOCTYPE html><html lang='en'><head><meta charset='utf-8'><title>Ahmed Rehan — Resume</title><style>{CSS}</style></head><body>{body}</body></html>"


# ── Build ─────────────────────────────────────────────────────────────────────

@dataclass
class OutputSpec:
    filename: str
    title: str
    subject: str
    keywords: str
    html: str
    extra_css: str = ""
    page_format: str = "A4"

def pdf_out(html: str, path: str, page_format: str = "A4"):
    with sync_playwright() as p:
        browser = p.chromium.launch()
        page = browser.new_page()
        page.set_content(html, wait_until="networkidle")
        page.pdf(path=str(path), format=page_format, print_background=True)
        browser.close()

def apply_metadata(path: Path, title: str, subject: str, keywords: str):
    reader = PdfReader(str(path))
    writer = PdfWriter()
    for p in reader.pages:
        writer.add_page(p)
    writer.add_metadata({
        "/Title": title,
        "/Author": "Ahmed Rehan",
        "/Subject": subject,
        "/Keywords": keywords,
    })
    with open(str(path), "wb") as f:
        writer.write(f)

def build():
    RESUME_DIR.mkdir(parents=True, exist_ok=True)

    full_html = build_full_html()
    specs = [
        OutputSpec("resume_full.pdf", "Ahmed Rehan — Full Resume",
                   "Comprehensive resume with project depth, experience, education, and public proof.",
                   "Ahmed Rehan, full stack engineer, devtools, automation, webhook, AI agent, resume",
                   full_html, page_format="A4"),
    ]

    # Also generate one-page and client variants from the same HTML with compact CSS
    compact_html = full_html.replace("<body>", '<body class="compact">')

    for spec in specs:
        path = RESUME_DIR / spec.filename
        html = spec.html if spec.filename == "resume_full.pdf" else (
            compact_html if "one_page" in spec.filename else spec.html
        )
        pdf_out(html, path, spec.page_format)
        apply_metadata(path, spec.title, spec.subject, spec.keywords)
        print(f"  {spec.filename}: {_os.path.getsize(path)} bytes")

    print("\nDone.")

if __name__ == "__main__":
    build()
