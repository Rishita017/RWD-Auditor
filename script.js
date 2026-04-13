// Auto theme (time-based)
const hour = new Date().getHours();
if (hour >= 6 && hour < 18) {
  document.body.classList.add("light");
}

// Toggle theme
function toggleDarkMode() {
  document.body.classList.toggle("light");
}

// Accessibility mode
function toggleAccessibility() {
  document.body.classList.toggle("accessibility");
}

// Device detection
function detectDevice() {
  const el = document.getElementById("deviceType");
  el.innerText = window.innerWidth < 768 
    ? "📱 Mobile View Active" 
    : "💻 Desktop View Active";
}

detectDevice();
window.onresize = detectDevice;
