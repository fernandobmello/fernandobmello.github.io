// Footer year
document.getElementById("year").textContent = new Date().getFullYear();

// Nav: shadow/border on scroll
const nav = document.getElementById("nav");
const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
onScroll();
window.addEventListener("scroll", onScroll, { passive: true });

// Mobile menu toggle
const toggle = document.querySelector(".nav__toggle");
const links = document.getElementById("navLinks");
toggle.addEventListener("click", () => {
  const open = links.classList.toggle("is-open");
  toggle.setAttribute("aria-expanded", open ? "true" : "false");
});
links.addEventListener("click", (e) => {
  if (e.target.tagName === "A") {
    links.classList.remove("is-open");
    toggle.setAttribute("aria-expanded", "false");
  }
});

// WhatsApp welcome chat animation
(function () {
  const chat = document.getElementById("waChat");
  const status = document.getElementById("waStatus");
  if (!chat) return;

  // dir: "in" = from Fernando, "out" = from visitor
  const script = [
    { dir: "in", text: "Hi there 👋 Welcome to my site." },
    { dir: "in", text: "I'm Fernando B. Mello, a political scientist." },
    { dir: "out", text: "Hi! What do you study?" },
    { dir: "in", text: "Political polarization — and how messaging apps like WhatsApp are reshaping politics." },
    { dir: "in", text: "In Brazil and across the Global South, one forwarded message can move votes — and a lot of misinformation. 📲" },
    { dir: "out", text: "Fitting medium to tell me 😄" },
    { dir: "in", text: "Exactly. Scroll down and I'll show you my research 👇" },
  ];

  const now = new Date();
  const stamp =
    String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0");

  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const scrollDown = () => { chat.scrollTop = chat.scrollHeight; };

  function addMessage(msg) {
    const el = document.createElement("div");
    el.className = "wa__msg " + (msg.dir === "in" ? "wa__msg--in" : "wa__msg--out");
    el.innerHTML =
      msg.text +
      '<span class="wa__t">' + stamp +
      (msg.dir === "out" ? ' <span class="wa__check">✓✓</span>' : "") +
      "</span>";
    chat.appendChild(el);
    scrollDown();
  }

  function showTyping() {
    const t = document.createElement("div");
    t.className = "wa__typing";
    t.id = "waTypingNow";
    t.innerHTML = "<span></span><span></span><span></span>";
    chat.appendChild(t);
    scrollDown();
    return t;
  }

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  async function run() {
    if (reduce) {
      script.forEach(addMessage);
      if (status) status.textContent = "online";
      return;
    }
    await sleep(500);
    for (const msg of script) {
      if (msg.dir === "in") {
        if (status) status.textContent = "typing…";
        const t = showTyping();
        await sleep(900 + Math.min(msg.text.length * 18, 1100));
        t.remove();
        if (status) status.textContent = "online";
        addMessage(msg);
        await sleep(450);
      } else {
        await sleep(550);
        addMessage(msg);
        await sleep(350);
      }
    }
  }

  // Start when the chat scrolls into view (once)
  let started = false;
  const begin = () => { if (!started) { started = true; run(); } };
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => { if (e.isIntersecting) { begin(); io.disconnect(); } });
    }, { threshold: 0.4 });
    io.observe(chat);
  } else {
    begin();
  }
})();

// Reveal on scroll
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const items = document.querySelectorAll(".reveal");
if (reduce || !("IntersectionObserver" in window)) {
  items.forEach((el) => el.classList.add("is-visible"));
} else {
  const io = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12, rootMargin: "0px 0px -40px 0px" }
  );
  items.forEach((el) => io.observe(el));
}
