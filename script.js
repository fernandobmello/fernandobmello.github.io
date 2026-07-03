// Footer year
const yearEl = document.getElementById("year");
if (yearEl) yearEl.textContent = new Date().getFullYear();

// Nav: shadow/border on scroll
const nav = document.getElementById("nav");
if (nav) {
  const onScroll = () => nav.classList.toggle("is-scrolled", window.scrollY > 8);
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
}

// Mobile menu toggle
const navToggle = document.querySelector(".nav__toggle");
const navLinks = document.getElementById("navLinks");
if (navToggle && navLinks) {
  navToggle.addEventListener("click", () => {
    const open = navLinks.classList.toggle("is-open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("is-open");
      navToggle.setAttribute("aria-expanded", "false");
    }
  });
}

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
    { dir: "in", text: "Political polarization, and how messaging apps like WhatsApp are reshaping politics." },
    { dir: "in", text: "In Brazil and across the Global South, one forwarded message can move votes, and spread a lot of misinformation. 📲" },
    { dir: "out", text: "Ha, fitting that you're telling me this over WhatsApp 😄" },
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
    t.innerHTML = "<span></span><span></span><span></span>";
    chat.appendChild(t);
    scrollDown();
    return t;
  }

  async function run() {
    // Loop the conversation forever: play it, wait 10s, clear, replay.
    while (true) {
      chat.querySelectorAll(".wa__msg, .wa__typing").forEach((el) => el.remove());
      await sleep(400);
      for (const msg of script) {
        if (msg.dir === "in") {
          // incoming: show the typing indicator, then the message
          if (status) status.textContent = "typing…";
          const t = showTyping();
          await sleep(750 + Math.min(msg.text.length * 16, 900));
          t.remove();
          if (status) status.textContent = "online";
          addMessage(msg);
          await sleep(450);
        } else {
          // outgoing (you): a short beat, then the reply
          await sleep(550);
          addMessage(msg);
          await sleep(350);
        }
      }
      await sleep(10000);
    }
  }

  // The chat is the first thing on the page, so just start it shortly after load.
  let started = false;
  const begin = () => { if (started) return; started = true; run(); };
  if (document.readyState === "complete") {
    begin();
  } else {
    window.addEventListener("load", begin, { once: true });
    // safety net in case the load event was already missed
    setTimeout(begin, 1200);
  }
})();

// Teaching stats: count-up + gauge fill when scrolled into view
(function () {
  const stats = document.querySelector(".teach-stats");
  if (!stats) return;
  const counters = stats.querySelectorAll("[data-count]");
  const ring = stats.querySelector(".tstat__ring");

  function animateCount(el) {
    const target = parseInt(el.getAttribute("data-count"), 10) || 0;
    const dur = 1300;
    const start = performance.now();
    (function step(now) {
      const p = Math.min((now - start) / dur, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased);
      if (p < 1) requestAnimationFrame(step);
    })(start);
  }

  let done = false;
  const go = () => {
    if (done) return;
    done = true;
    counters.forEach(animateCount);
    if (ring) requestAnimationFrame(() => ring.classList.add("is-on"));
  };

  const inView = () => {
    const r = stats.getBoundingClientRect();
    return r.top < window.innerHeight * 0.85 && r.bottom > 0;
  };
  const check = () => { if (inView()) { go(); window.removeEventListener("scroll", check); } };

  if (inView()) {
    go();
  } else {
    window.addEventListener("scroll", check, { passive: true });
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (entries.some((e) => e.isIntersecting)) { go(); io.disconnect(); }
      }, { threshold: 0.4 });
      io.observe(stats);
    }
  }
})();

// Presentations password gate
(function () {
  const gate = document.getElementById("pwgate");
  if (!gate) return;
  const form = document.getElementById("pwgateForm");
  const input = document.getElementById("pwgateInput");
  const err = document.getElementById("pwgateErr");
  const sub = document.getElementById("pwgateSub");
  const HASH = "3f94986891646f845f29635c66294012c72affc7e7c9179fa818e5cfcbd20761";
  const KEY = "pres-unlocked";
  let target = null;

  async function sha256(str) {
    const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(str));
    return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  const open = (url, name) => {
    target = url;
    err.hidden = true;
    input.value = "";
    sub.textContent = name
      ? "Enter the password to open “" + name + "”."
      : "Enter the password to open this presentation.";
    gate.hidden = false;
    setTimeout(() => input.focus(), 50);
  };
  const close = () => { gate.hidden = true; };

  document.querySelectorAll(".pres__open").forEach((btn) => {
    btn.addEventListener("click", () => {
      const url = btn.getAttribute("data-url");
      if (sessionStorage.getItem(KEY) === "1") { window.location.href = url; return; }
      open(url, btn.querySelector(".pres__title")?.textContent.trim());
    });
  });

  gate.querySelectorAll("[data-close]").forEach((el) => el.addEventListener("click", close));
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !gate.hidden) close(); });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const ok = (await sha256(input.value)) === HASH;
    if (ok) {
      sessionStorage.setItem(KEY, "1");
      if (target) window.location.href = target;
    } else {
      err.hidden = false;
      input.select();
    }
  });
})();

// Student comments reveal (Teaching)
document.querySelectorAll(".comments__toggle").forEach((btn) => {
  const panel = document.getElementById(btn.getAttribute("aria-controls"));
  const label = btn.querySelector(".comments__label");
  const quotes = panel ? panel.querySelectorAll(".quote") : [];
  btn.addEventListener("click", () => {
    const willOpen = panel.hasAttribute("hidden");
    btn.setAttribute("aria-expanded", willOpen ? "true" : "false");
    if (label) label.textContent = willOpen ? "Hide students' comments" : "See selected students' comments";
    if (willOpen) {
      panel.hidden = false;
      quotes.forEach((q, i) => setTimeout(() => q.classList.add("in"), 120 + i * 180));
    } else {
      panel.hidden = true;
      quotes.forEach((q) => q.classList.remove("in"));
    }
  });
});

// Research flip cards
document.querySelectorAll(".flip").forEach((card) => {
  const toggle = () => {
    const flipped = card.classList.toggle("is-flipped");
    card.setAttribute("aria-pressed", flipped ? "true" : "false");
  };
  card.addEventListener("click", toggle);
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      toggle();
    }
  });
});

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
