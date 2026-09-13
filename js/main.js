/* PowerCMS 12 官网 - 交互脚本 */
(function () {
  "use strict";

  /* ---------- 头部滚动状态 ---------- */
  var header = document.querySelector(".header");
  function onScroll() {
    if (header) header.classList.toggle("scrolled", window.scrollY > 8);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- 移动端菜单 ---------- */
  var menuBtn = document.querySelector(".menu-btn");
  var mobileNav = document.querySelector(".mobile-nav");
  if (menuBtn && mobileNav) {
    menuBtn.addEventListener("click", function () {
      mobileNav.classList.toggle("open");
    });
  }

  /* ---------- 当前页导航高亮 ---------- */
  var page = (location.pathname.split("/").pop() || "index.html").replace(".html", "");
  document.querySelectorAll("[data-nav]").forEach(function (a) {
    if (a.getAttribute("data-nav") === page) a.classList.add("active");
  });

  /* ---------- Tabs ---------- */
  document.querySelectorAll(".tabs").forEach(function (tabs) {
    var btns = tabs.querySelectorAll(".tab");
    var group = tabs.getAttribute("data-tab-group");
    btns.forEach(function (btn) {
      btn.addEventListener("click", function () {
        btns.forEach(function (b) { b.classList.remove("active"); });
        btn.classList.add("active");
        document.querySelectorAll('.tab-panel[data-panel-group="' + group + '"]').forEach(function (p) {
          p.classList.toggle("active", p.getAttribute("data-panel") === btn.getAttribute("data-tab"));
        });
      });
    });
  });

  /* ---------- 入场动画 ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    document.querySelectorAll(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("in"); });
  }

  /* ---------- 多语言 ---------- */
  var STORAGE_KEY = "pcms-lang";
  function getLang() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === "zh" || saved === "en") return saved;
    } catch (e) { /* ignore */ }
    return "zh";
  }

  function applyLang(lang) {
    if (typeof window.I18N !== "object" || !window.I18N[lang]) return;
    var dict = window.I18N[lang];
    document.querySelectorAll("[data-i18n]").forEach(function (el) {
      var key = el.getAttribute("data-i18n");
      if (dict[key] != null) el.innerHTML = dict[key];
    });
    document.documentElement.setAttribute("lang", lang === "zh" ? "zh-CN" : "en");
    document.querySelectorAll(".lang-toggle button").forEach(function (b) {
      b.classList.toggle("active", b.getAttribute("data-lang") === lang);
    });
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
  }

  document.querySelectorAll(".lang-toggle button").forEach(function (btn) {
    btn.addEventListener("click", function () {
      applyLang(btn.getAttribute("data-lang"));
    });
  });

  /* 初始语言：默认中文（HTML 内置中文文案，仅当用户曾切换为英文时覆盖） */
  if (getLang() === "en") applyLang("en");
  window.__applyLang = applyLang; // 供调试使用
})();
