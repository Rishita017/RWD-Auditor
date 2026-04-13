// ── RWD Auditor — app.js ──
// Uses Claude AI API to analyze websites for RWD, UX, and performance principles

const CLAUDE_API = "https://api.anthropic.com/v1/messages";

const CATEGORIES = [
  { id: "responsive",   icon: "◈", name: "Responsive Design"       },
  { id: "typography",   icon: "Aa", name: "Typography & Readability" },
  { id: "structure",    icon: "⊞", name: "Page Structure & Hierarchy"},
  { id: "performance",  icon: "⚡", name: "Load Speed & Performance" },
  { id: "ux",           icon: "◎", name: "UX & User Retention"      },
];

const LOADING_MESSAGES = [
  "Fetching site metadata...",
  "Analyzing responsive design signals...",
  "Checking typography & readability...",
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

function normalizeUrl(raw) {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  return "https://" + trimmed;
}

function startLoadingUI() {
  let msgIdx = 0;
  let progress = 0;
  const statusEl = document.getElementById("loadingStatus");
  const barEl = document.getElementById("loadingBar");

  statusEl.textContent = LOADING_MESSAGES[0];
  barEl.style.width = "5%";

  loadingInterval = setInterval(() => {
    msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
    statusEl.textContent = LOADING_MESSAGES[msgIdx];
  }, 2200);

  progressInterval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 6, 88);
    barEl.style.width = progress + "%";
  }, 400);
}

function stopLoadingUI() {
  clearInterval(loadingInterval);
  clearInterval(progressInterval);
  document.getElementById("loadingBar").style.width = "100%";
}

async function startAudit() {
  const rawUrl = document.getElementById("urlInput").value;
  const url = normalizeUrl(rawUrl);

  if (!url) {
    shakeInput(); return;
  }

  // UI transitions
  document.querySelector(".hero").style.display = "none";
  document.getElementById("howSection").style.display = "none";
  document.getElementById("resultsSection").style.display = "none";
  document.getElementById("loadingSection").style.display = "flex";

  startLoadingUI();

  try {
    const result = await analyzeWithClaude(url);
    stopLoadingUI();
    document.getElementById("loadingSection").style.display = "none";
    renderResults(url, result);
    document.getElementById("resultsSection").style.display = "block";
    window.scrollTo({ top: 0, behavior: "smooth" });
  } catch (err) {
    stopLoadingUI();
    document.getElementById("loadingSection").style.display = "none";
    document.querySelector(".hero").style.display = "block";
    document.getElementById("howSection").style.display = "block";
    showError("Analysis failed. Please check the URL and try again.");
    console.error(err);
  }
}

async function analyzeWithClaude(url) {
  const prompt = `You are an expert web auditor specializing in Responsive Web Design (RWD), UX research, and website performance. Analyze the website at: ${url}

Based on research principles from Nielsen Norman Group, Google Core Web Vitals, WCAG 2.2, W3C RWD standards, and Baymard Institute UX research, evaluate this website across these 5 categories:

1. Responsive Design / Mobile-Friendliness
2. Typography & Readability
3. Page Structure & Hierarchy
4. Load Speed & Performance
5. UX & User Retention Signals

You must respond ONLY with a valid JSON object in this exact structure (no markdown, no extra text):
{
  "overallScore": <number 0-100>,
  "summary": "<2-sentence overall verdict>",
  "badges": [
    {"label": "<short label>", "type": "<good|amber|red>"},
    {"label": "<short label>", "type": "<good|amber|red>"},
    {"label": "<short label>", "type": "<good|amber|red>"}
  ],
  "categories": {
    "responsive": {
      "score": <number 0-100>,
      "issues": [
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"}
      ]
    },
    "typography": {
      "score": <number 0-100>,
      "issues": [
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"}
      ]
    },
    "structure": {
      "score": <number 0-100>,
      "issues": [
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"}
      ]
    },
    "performance": {
      "score": <number 0-100>,
      "issues": [
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"}
      ]
    },
    "ux": {
      "score": <number 0-100>,
      "issues": [
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"},
        {"text": "<specific finding>", "severity": "<high|medium|low>"}
      ]
    }
  }
}

Be specific and realistic. Use your knowledge of the website if you know it. Give genuine, actionable findings based on RWD research principles.`;

  const response = await fetch(CLAUDE_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1000,
      messages: [{ role: "user", content: prompt }]
    })
  });

  if (!response.ok) throw new Error("API error: " + response.status);

  const data = await response.json();
  const raw = data.content.map(b => b.text || "").join("");
  const clean = raw.replace(/```json|```/g, "").trim();
  return JSON.parse(clean);
}

function renderResults(url, data) {
  // URL display
  document.getElementById("auditedUrl").textContent = url;

  // Score ring SVG gradient injection
  const svg = document.querySelector(".score-ring");
  if (!svg.querySelector("defs")) {
    const defs = document.createElementNS("http://www.w3.org/2000/svg", "defs");
    defs.innerHTML = `<linearGradient id="scoreGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#5b8fff"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>`;
    svg.prepend(defs);
  }

  // Animate score number
  const scoreEl = document.getElementById("scoreNumber");
  const target = data.overallScore;
  let current = 0;
  const step = Math.ceil(target / 60);
  const counter = setInterval(() => {
    current = Math.min(current + step, target);
    scoreEl.textContent = current;
    if (current >= target) clearInterval(counter);
  }, 20);

  // Grade
  document.getElementById("scoreGrade").textContent = getGrade(target);

  // Ring fill
  const circumference = 515;
  const offset = circumference - (target / 100) * circumference;
  setTimeout(() => {
    document.getElementById("ringFill").style.strokeDashoffset = offset;
  }, 100);

  // Verdict & summary
  document.getElementById("scoreVerdict").textContent = getVerdict(target);
  document.getElementById("scoreSummary").textContent = data.summary;

  // Badges
  const badgesEl = document.getElementById("scoreBadges");
  badgesEl.innerHTML = (data.badges || []).map(b =>
    `<span class="badge badge-${b.type === "good" ? "green" : b.type === "amber" ? "amber" : "red"}">${b.label}</span>`
  ).join("");

  // Category cards
  const grid = document.getElementById("categoriesGrid");
  grid.innerHTML = "";
  CATEGORIES.forEach((cat, i) => {
    const catData = data.categories[cat.id];
    if (!catData) return;
    const cls = getScoreClass(catData.score);
    const statusLabel = cls === "good" ? "Good" : cls === "okay" ? "Needs Work" : "Poor";

    const card = document.createElement("div");
    card.className = "cat-card";
    card.style.animationDelay = (i * 0.1) + "s";
    card.innerHTML = `
      <div class="cat-header">
        <span class="cat-name">${cat.icon} ${cat.name}</span>
        <span class="cat-status ${cls}">${statusLabel}</span>
      </div>
      <div class="cat-score-row">
        <span class="cat-score-num ${cls}">${catData.score}</span>
        <div class="cat-bar-wrap">
          <div class="cat-bar ${cls}" style="width:0%" data-width="${catData.score}%"></div>
        </div>
      </div>
      <ul class="cat-issues">
        ${(catData.issues || []).map(issue =>
          `<li class="cat-issue">
            <span class="issue-dot ${issue.severity}"></span>
            <span>${issue.text}</span>
          </li>`
        ).join("")}
      </ul>
    `;
    grid.appendChild(card);
  });

  // Animate bars after DOM paint
  setTimeout(() => {
    document.querySelectorAll(".cat-bar[data-width]").forEach(bar => {
      bar.style.width = bar.dataset.width;
    });
  }, 200);
}

function resetAudit() {
  document.getElementById("resultsSection").style.display = "none";
  document.querySelector(".hero").style.display = "block";
  document.getElementById("howSection").style.display = "block";
  document.getElementById("urlInput").value = "";
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function shakeInput() {
  const wrap = document.querySelector(".input-wrapper");
  wrap.style.animation = "shake 0.4s ease";
  setTimeout(() => wrap.style.animation = "", 400);
}

function showError(msg) {
  const existing = document.getElementById("errorMsg");
  if (existing) existing.remove();
  const el = document.createElement("div");
  el.id = "errorMsg";
  el.style.cssText = "text-align:center;color:#f87171;font-family:var(--font-mono);font-size:0.8rem;margin-top:1rem;";
  el.textContent = msg;
  document.querySelector(".input-wrapper").after(el);
  setTimeout(() => el.remove(), 5000);
}

// Shake keyframe injection
const style = document.createElement("style");
style.textContent = `@keyframes shake {
  0%,100%{transform:translateX(0)} 20%{transform:translateX(-8px)} 40%{transform:translateX(8px)}
  60%{transform:translateX(-5px)} 80%{transform:translateX(5px)}
}`;
document.head.appendChild(style);

// Enter key support
document.addEventListener("DOMContentLoaded", () => {
  document.getElementById("urlInput").addEventListener("keydown", e => {
    if (e.key === "Enter") startAudit();
  });
});
