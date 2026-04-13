// 🌗 Time-based theme
const hour = new Date().getHours();
if (hour >= 18 || hour < 6) {
  document.body.classList.add("dark");
}

// 🎛️ Toggle Dark Mode
function toggleDarkMode() {
  document.body.classList.toggle("dark");
}

// ♿ Accessibility Mode
function toggleAccessibility() {
  document.body.classList.toggle("accessibility");
}

// 📱 Device detection
function detectDevice() {
  const text = document.getElementById("deviceType");
  if (window.innerWidth < 768) {
    text.innerText = "📱 Mobile View";
  } else {
    text.innerText = "💻 Desktop View";
  }
}

detectDevice();
window.onresize = detectDevice;
