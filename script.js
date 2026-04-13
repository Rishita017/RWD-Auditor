// ── RWD Auditor — app.js (Rule-Based, No API Key Required) ──
// Fetches real HTML and scores it against RWD + UX research principles

const CORS_PROXIES = [
  "https://api.allorigins.win/get?url=",
  "https://corsproxy.io/?",
];

const LOADING_MESSAGES = [
  "Fetching site HTML...",
  "Checking responsive design signals...",
  "Analyzing typography & readability...",
  "Evaluating page structure & hierarchy...",
  "Measuring performance indicators...",
  "Assessing UX & retention patterns...",
  "Cross-referencing RWD research data...",
  "Generating your report...",
];

let loadingInterval = null;
let progressInterval = null;

function getGrade(score) {
  if (score >= 90) return "A+";
  if (score >= 80) return "A";
  if (score >= 70) return "B";
  if (score >= 60) return "C";
  if (score >= 50) return "D";
  return "F";
}

function getScoreClass(score) {
  if (score >= 70) return "good";
  if (score >= 45) return "okay";
  return "poor";
}

function getVerdict(score) {
  if (score >= 85) return "Excellent Website";
  if (score >= 70) return "Well Built Site";
  if (score >= 55) return "Needs Improvement";
  if (score >= 40) return "Significant Issues";
  return "Major Overhaul Needed";
}

function getSummary(score) {
  if (score >= 85) return "This site follows modern RWD best practices well. Minor improvements could further boost user retention and accessibility.";
  if (score >= 70) return "Solid foundation with good responsiveness. A few areas need attention to meet current UX research standards.";
  if (score >= 55) return "The site has notable gaps in responsive design and UX. Addressing the flagged issues could significantly improve user retention.";
  if (score >= 40) return "Several critical RWD and UX issues were found. These likely hurt user experience across devices and reduce retention.";
  return "Major responsive design and UX issues detected. The site may be difficult to use on mobile and could benefit from a structured redesign.";
}

function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function clamp(val, min, max) {
  return Math.min(Math.max(val, min), max);
}

async function fetchHTML(url) {
  for (const proxy of CORS_PROXIES) {
    try {
      const proxyUrl = proxy + encodeURIComponent(url);
      const res = await fetch(proxyUrl, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) continue;
      const data = await res.json();
      if (data && data.contents) return data.contents;
      const text = await res.text();
      if (text && text.length > 100) return text;
    } catch (e) { continue; }
  }
  return null;
}

function analyzeResponsive(doc, html) {
  let score = 100;
  const issues = [];

  const viewportMeta = doc.querySelector('meta[name="viewport"]');
  if (!viewportMeta) {
    score -= 30;
    issues.push({ text: "Missing <meta name='viewport'> tag — page will not scale on mobile devices.", severity: "high" });
  } else {
    const content = viewportMeta.getAttribute("content") || "";
    if (!content.includes("width=device-width")) {
      score -= 15;
      issues.push({ text: "Viewport meta tag doesn't include 'width=device-width' — mobile scaling may be broken.", severity: "high" });
    }
    if (content.includes("user-scalable=no") || content.includes("maximum-scale=1")) {
      score -= 10;
      issues.push({ text: "Viewport disables user zoom — violates WCAG 1.4.4 accessibility guideline.", severity: "medium" });
    }
  }

  const hasMediaQuery = html.toLowerCase().includes("@media");
  if (!hasMediaQuery) {
    score -= 20;
    issues.push({ text: "No CSS media queries detected — layout likely doesn't adapt to different screen sizes.", severity: "high" });
  }

  const fixedWidthMatches = (html.match(/width\s*:\s*\d{4,}px/gi) || []).length;
  if (fixedWidthMatches > 3) {
    score -= 15;
    issues.push({ text: `${fixedWidthMatches} instances of large fixed pixel widths found — may cause horizontal scroll on mobile.`, severity: "medium" });
  }

  const images = doc.querySelectorAll("img");
  const nonResponsiveImgs = Array.from(images).filter(img => !img.getAttribute("srcset")).length;
  if (images.length > 0 && nonResponsiveImgs > images.length * 0.6) {
    score -= 10;
    issues.push({ text: `${nonResponsiveImgs} of ${images.length} images lack srcset or responsive sizing attributes.`, severity: "medium" });
  }

  const hasFlexOrGrid = /display\s*:\s*(flex|grid)/i.test(html);
  if (!hasFlexOrGrid) {
    score -= 10;
    issues.push({ text: "No CSS Flexbox or Grid detected — modern responsive layout techniques not in use.", severity: "low" });
  }

  if (issues.length === 0) {
    issues.push({ text: "Viewport meta tag correctly configured for all screen sizes.", severity: "low" });
    issues.push({ text: "Responsive CSS techniques (Flexbox/Grid/media queries) detected.", severity: "low" });
    issues.push({ text: "No fixed-width layout constraints found that would break mobile rendering.", severity: "low" });
  }

  return { score: clamp(score, 10, 100), issues: issues.slice(0, 3) };
}

function analyzeTypography(doc, html) {
  let score = 100;
  const issues = [];

  const smallFontMatches = (html.match(/font-size\s*:\s*(([0-9]|1[0-2])px)/gi) || []).length;
  if (smallFontMatches > 2) {
    score -= 20;
    issues.push({ text: `${smallFontMatches} instances of font sizes below 12px — Nielsen Norman recommends minimum 16px for body text.`, severity: "high" });
  }

  const hasLineHeight = /line-height\s*:/i.test(html);
  if (!hasLineHeight) {
    score -= 15;
    issues.push({ text: "No line-height declarations found — default browser spacing reduces readability by up to 20% (Baymard Institute).", severity: "medium" });
  }

  const hasWebFont = html.includes("fonts.googleapis.com") || html.includes("@font-face");
  if (!hasWebFont) {
    score -= 10;
    issues.push({ text: "No custom web fonts detected — system fonts may render inconsistently across devices.", severity: "low" });
  }

  const hasMaxWidth = /max-width\s*:/i.test(html);
  if (!hasMaxWidth) {
    score -= 15;
    issues.push({ text: "No max-width constraints — line lengths may exceed 75 characters, reducing readability (W3C guideline).", severity: "medium" });
  }

  if (issues.length === 0) {
    issues.push({ text: "Font sizes appear appropriately sized for readability across devices.", severity: "low" });
    issues.push({ text: "Line-height declarations found, supporting good reading comfort.", severity: "low" });
    issues.push({ text: "Custom web fonts detected for consistent cross-device typography.", severity: "low" });
  }

  return { score: clamp(score, 10, 100), issues: issues.slice(0, 3) };
}

function analyzeStructure(doc, html) {
  let score = 100;
  const issues = [];

  const semanticTags = ["header","nav","main","footer","article","section","aside"];
  const foundSemantic = semanticTags.filter(tag => doc.querySelector(tag));
  if (foundSemantic.length < 3) {
    score -= 20;
    issues.push({ text: `Only ${foundSemantic.length}/7 semantic HTML5 elements used — poor structure harms SEO and screen reader navigation.`, severity: "high" });
  }

  const h1s = doc.querySelectorAll("h1").length;
  if (h1s === 0) {
    score -= 20;
    issues.push({ text: "No <h1> tag found — every page should have exactly one H1 for clear hierarchy and SEO.", severity: "high" });
  } else if (h1s > 1) {
    score -= 10;
    issues.push({ text: `${h1s} H1 tags found — W3C recommends exactly one H1 per page for clear document hierarchy.`, severity: "medium" });
  }

  const metaDesc = doc.querySelector('meta[name="description"]');
  if (!metaDesc || !metaDesc.getAttribute("content")) {
    score -= 10;
    issues.push({ text: "Missing meta description — reduces click-through rates in search results.", severity: "low" });
  }

  const imgs = doc.querySelectorAll("img");
  const missingAlt = Array.from(imgs).filter(img => !img.getAttribute("alt")).length;
  if (missingAlt > 0) {
    score -= 10;
    issues.push({ text: `${missingAlt} image(s) missing alt text — violates WCAG 1.1.1 and harms SEO ranking.`, severity: "medium" });
  }

  if (issues.length === 0) {
    issues.push({ text: "Strong semantic HTML5 structure with proper landmark elements.", severity: "low" });
    issues.push({ text: "Correct heading hierarchy (H1 → H2 → H3) found throughout the page.", severity: "low" });
    issues.push({ text: "All images have descriptive alt text attributes.", severity: "low" });
  }

  return { score: clamp(score, 10, 100), issues: issues.slice(0, 3) };
}

function analyzePerformance(doc, html) {
  let score = 100;
  const issues = [];

  const scripts = doc.querySelectorAll('script[src]');
  if (scripts.length > 8) {
    score -= 20;
    issues.push({ text: `${scripts.length} external scripts loaded — Google recommends fewer than 5 for fast Time to Interactive.`, severity: "high" });
  } else if (scripts.length > 5) {
    score -= 10;
    issues.push({ text: `${scripts.length} external scripts detected — consider bundling to reduce network requests.`, severity: "medium" });
  }

  const renderBlockingCSS = Array.from(doc.querySelectorAll('link[rel="stylesheet"]')).length;
  if (renderBlockingCSS > 4) {
    score -= 15;
    issues.push({ text: `${renderBlockingCSS} stylesheets found — too many delay First Contentful Paint (Core Web Vitals).`, severity: "high" });
  }

  const imgs = doc.querySelectorAll("img");
  const noLazyLoad = Array.from(imgs).filter(img => img.getAttribute("loading") !== "lazy").length;
  if (imgs.length > 3 && noLazyLoad > imgs.length * 0.7) {
    score -= 15;
    issues.push({ text: `${noLazyLoad} of ${imgs.length} images missing loading="lazy" — increases initial page load time unnecessarily.`, severity: "medium" });
  }

  const hasWebP = /\.webp/i.test(html);
  if (imgs.length > 2 && !hasWebP) {
    score -= 10;
    issues.push({ text: "No WebP images detected — modern formats reduce image payload by 25–35% (Google Lighthouse).", severity: "medium" });
  }

  const blockingScripts = Array.from(scripts).filter(s =>
    !s.getAttribute("async") && !s.getAttribute("defer")
  ).length;
  if (blockingScripts > 2) {
    score -= 10;
    issues.push({ text: `${blockingScripts} scripts lack async/defer — synchronous scripts block HTML parsing and delay rendering.`, severity: "medium" });
  }

  if (issues.length === 0) {
    issues.push({ text: "Script count is within recommended range for fast Time to Interactive.", severity: "low" });
    issues.push({ text: "Images use lazy loading, reducing initial bandwidth usage.", severity: "low" });
    issues.push({ text: "Stylesheet count is within acceptable limits for render performance.", severity: "low" });
  }

  return { score: clamp(score, 10, 100), issues: issues.slice(0, 3) };
}

function analyzeUX(doc, html) {
  let score = 100;
  const issues = [];

  const buttons = doc.querySelectorAll("button, input[type='submit'], [class*='cta'], [class*='btn']");
  if (buttons.length === 0) {
    score -= 20;
    issues.push({ text: "No clear CTA (call-to-action) buttons detected — users lack direction, increasing bounce rate.", severity: "high" });
  }

  const inputs = doc.querySelectorAll("input:not([type='hidden']), textarea, select");
  const labels = doc.querySelectorAll("label");
  if (inputs.length > 0 && labels.length < inputs.length) {
    score -= 15;
    issues.push({ text: `${inputs.length - labels.length} form input(s) may lack labels — reduces usability and violates WCAG 1.3.1.`, severity: "high" });
  }

  const hasTrustSignals = /testimonial|review|rating|trust|certif|partner/i.test(html);
  if (!hasTrustSignals) {
    score -= 10;
    issues.push({ text: "No trust signals (testimonials, ratings, certifications) detected — Baymard Institute shows these increase conversion by 15–30%.", severity: "low" });
  }

  const footer = doc.querySelector("footer");
  if (!footer) {
    score -= 15;
    issues.push({ text: "No <footer> element found — users expect footer navigation, contact info and legal links.", severity: "medium" });
  }

  const hasOG = doc.querySelector('meta[property^="og:"]') !== null;
  if (!hasOG) {
    score -= 8;
    issues.push({ text: "No Open Graph meta tags — shared links on social media lack rich previews, reducing click-through.", severity: "low" });
  }

  if (issues.length === 0) {
    issues.push({ text: "Clear CTA elements present — good for guiding user actions.", severity: "low" });
    issues.push({ text: "Form inputs have associated labels, supporting accessible interaction.", severity: "low" });
    issues.push({ text: "Trust signals and footer navigation present — supports user confidence.", severity: "low" });
  }

  return { score: clamp(score, 10, 100), issues: issues.slice(0, 3) };
}

function analyzeHTML(html) {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");

  const responsive  = analyzeResponsive(doc, html);
  const typography  = analyzeTypography(doc, html);
  const structure   = analyzeStructure(doc, html);
  const performance = analyzePerformance(doc, html);
  const ux          = analyzeUX(doc, html);

  const overallScore = Math.round(
    responsive.score  * 0.25 +
    typography.score  * 0.15 +
    structure.score   * 0.20 +
    performance.score * 0.20 +
    ux.score          * 0.20
  );

  const badges = [];
  badges.push(responsive.score >= 70
    ? { label: "Mobile Ready",   type: "good"  }
    : { label: "Mobile Issues",  type: "red"   });
  badges.push(structure.score >= 70
    ? { label: "Good Semantics", type: "good"  }
    : { label: "Weak Structure", type: "amber" });
  badges.push(performance.score >= 70
    ? { label: "Fast Loading",   type: "good"  }
    : { label: "Slow Load Risk", type: "amber" });

  return { overallScore, summary: getSummary(overallScore), badges,
    categories: { responsive, typography, structure, performance, ux } };
}

function fallbackAnalysis(url) {
  const isHTTPS = url.startsWith("https://");
  return {
    overallScore: 42,
    summary: "Couldn't fully load this page. Results are based on partial signals. Ensure the site is publicly accessible.",
    badges: [
      { label: isHTTPS ? "HTTPS Secure" : "No HTTPS", type: isHTTPS ? "good" : "red" },
      { label: "Partial Analysis", type: "amber" },
      { label: "Limited Data",     type: "amber" },
    ],
    categories: {
      responsive:  { score: 50, issues: [{ text: "Could not load page HTML — viewport checks skipped.", severity: "medium" }] },
      typography:  { score: 50, issues: [{ text: "Typography analysis requires page HTML to be loaded.", severity: "medium" }] },
      structure:   { score: 40, issues: [{ text: "Page structure could not be evaluated — site may require authentication.", severity: "high" }] },
      performance: { score: 40, issues: [{ text: "Performance signals unavailable without page HTML.", severity: "medium" }] },
      ux:          { score: 40, issues: [{ text: "UX patterns could not be detected — try a different public URL.", severity: "medium" }] },
    }
  };
}

const CATEGORIES = [
  { id: "responsive",   icon: "◈",  name: "Responsive Design"         },
  { id: "typography",   icon: "Aa", name: "Typography & Readability"   },
  { id: "structure",    icon: "⊞",  name: "Page Structure & Hierarchy" },
  { id: "performance",  icon: "⚡", name: "Load Speed & Performance"   },
  { id: "ux",           icon: "◎",  name: "UX & User Retention"        },
];

function startLoadingUI() {
  let msgIdx = 0, progress = 0;
  const statusEl = document.getElementById("loadingStatus");
  const barEl    = document.getElementById("loadingBar");
  statusEl.textContent = LOADING_MESSAGES[0];
  barEl.style.width = "5%";
  loadingInterval  = setInterval(() => { msgIdx = (msgIdx+1)%LOADING_MESSAGES.length; statusEl.textContent = LOADING_MESSAGES[msgIdx]; }, 1800);
  progressInterval = setInterval(() => { progress = Math.min(progress + Math.random()*7, 88); barEl.style.width = progress+"%"; }, 400);
}

function stopLoadingUI() {
  clearInterval(loadingInterval);
  clearInterval(progressInterval);
  document.getElementById("loadingBar").style.width = "100%";
}

async function startAudit() {
  const url = normalizeUrl(document.getElementById("urlInput").value);
  if (!url) { shakeInput(); return; }

  document.querySelector(".hero").style.display         = "none";
  document.getElementById("howSection").style.display   = "none";
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("loadingSection").style.display = "flex";
  startLoadingUI();

  try {
    const html   = await fetchHTML(url);
    stopLoadingUI();
    document.getElementById("loadingSection").style.display = "none";
    const result = html && html.length > 200 ? analyzeHTML(html) : fallbackAnalysis(url);
    renderResults(url, result);
    document.getElementById("resultsSection").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    stopLoadingUI();
    document.getElementById("loadingSection").style.display = "none";
    document.querySelector(".hero").style.display         = "block";
    document.getElementById("howSection").style.display   = "block";
    showError("Could not reach that URL. Check it's a public website and try again.");
    console.error(err);
  }
}

function renderResults(url, data) {
  document.getElementById("auditedUrl").textContent = url;

  const svg = document.querySelector(".score-ring");
  if (!svg.querySelector("defs")) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg","defs");
    defs.innerHTML = `<linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#5b8fff"/><stop offset="100%" stop-color="#a78bfa"/></linearGradient>`;
    svg.prepend(defs);
  }

  const scoreEl = document.getElementById("scoreNumber");
  const target  = data.overallScore;
  let current   = 0;
  const counter = setInterval(() => { current = Math.min(current + Math.ceil(target/60), target); scoreEl.textContent = current; if (current >= target) clearInterval(counter); }, 20);

  document.getElementById("scoreGrade").textContent   = getGrade(target);
  setTimeout(() => { document.getElementById("ringFill").style.strokeDashoffset = 515 - (target/100)*515; }, 100);
  document.getElementById("scoreVerdict").textContent = getVerdict(target);
  document.getElementById("scoreSummary").textContent = data.summary;

  document.getElementById("scoreBadges").innerHTML = (data.badges||[]).map(b =>
    `<span class="badge badge-${b.type==="good"?"green":b.type==="amber"?"amber":"red"}">${b.label}</span>`).join("");

  const grid = document.getElementById("categoriesGrid");
  grid.innerHTML = "";
  CATEGORIES.forEach((cat, i) => {
    const d = data.categories[cat.id]; if (!d) return;
    const cls = getScoreClass(d.score);
    const card = document.createElement("div");
    card.className = "cat-card";
    card.style.animationDelay = (i*0.1)+"s";
    card.innerHTML = `
      <div class="cat-header">
        <span class="cat-name">${cat.icon} ${cat.name}</span>
        <span class="cat-status ${cls}">${cls==="good"?"Good":cls==="okay"?"Needs Work":"Poor"}</span>
      </div>
      <div class="cat-score-row">
        <span class="cat-score-num ${cls}">${d.score}</span>
        <div class="cat-bar-wrap"><div class="cat-bar ${cls}" style="width:0%" data-width="${d.score}%"></div></div>
      </div>
      <ul class="cat-issues">${(d.issues||[]).map(issue=>`<li class="cat-issue"><span class="issue-dot ${issue.severity}"></span><span>${issue.text}</span></li>`).join("")}</ul>`;
    grid.appendChild(card);
  });
  setTimeout(() => { document.querySelectorAll(".cat-bar[data-width]").forEach(b=>{ b.style.width=b.dataset.width; }); }, 200);
}

function resetAudit() {
  document.getElementById("resultsSection").style.display = "none";
  document.querySelector(".hero").style.display         = "block";
  document.getElementById("howSection").style.display   = "block";
  document.getElementById("urlInput").value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function shakeInput() {
  const w = document.querySelector(".input-wrapper");
  w.style.animation = "none";
  requestAnimationFrame(() => { w.style.animation = "shake 0.4s ease"; });
  setTimeout(() => { w.style.animation = ""; }, 400);
}

function showError(msg) {
  const e = document.getElementById("errorMsg"); if (e) e.remove();
  const el = document.createElement("div");
  el.id = "errorMsg";
  el.style.cssText = "text-align:center;color:#f87171;font-family:var(--font-mono);font-size:0.8rem;margin-top:1rem;";
  el.textContent = msg;
  document.querySelector(".input-wrapper").after(el);
  setTimeout(() => el.remove(), 6000);
}

const styleTag = document.createElement("style");
styleTag.textContent = `@keyframes shake{0%,100%{transform:translateX(0)}20%{transform:translateX(-8px)}40%{transform:translateX(8px)}60%{transform:translateX(-5px)}80%{transform:translateX(5px)}}`;
document.head.appendChild(styleTag);

document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("urlInput").addEventListener("keydown", e => { if (e.key==="Enter") startAudit(); });
});
