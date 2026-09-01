/* Thirumoorthi Samiyappan — portfolio
   Vanilla JS, no dependencies. View routing, theme, command palette,
   project filter/search/sort/layout, scroll reveal, stat count-up.
   Everything degrades: without JS the page is one long scrollable document. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var VIEWS = ["overview", "projects", "references", "resume", "contact"];

  /* ---------------------------------------------------------------- year */
  var yr = document.getElementById("year");
  if (yr) yr.textContent = new Date().getFullYear();

  /* --------------------------------------------------------------- theme */
  var KEY = "tm-theme";
  var themeBtn = document.getElementById("theme");
  function sysDark() { return matchMedia("(prefers-color-scheme: dark)").matches; }
  themeBtn && themeBtn.addEventListener("click", function () {
    var cur = root.getAttribute("data-theme") || (sysDark() ? "dark" : "light");
    var next = cur === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    try { localStorage.setItem(KEY, next); } catch (e) {}
  });

  /* -------------------------------------------------------- mobile menu */
  var nav = document.getElementById("nav");
  var menuBtn = document.getElementById("menu");
  function closeMenu() {
    if (!nav) return;
    nav.classList.remove("is-open");
    menuBtn && menuBtn.setAttribute("aria-expanded", "false");
  }
  menuBtn && menuBtn.addEventListener("click", function () {
    var open = nav.classList.toggle("is-open");
    menuBtn.setAttribute("aria-expanded", String(open));
  });

  /* --------------------------------------------------------- topbar state */
  var topbar = document.getElementById("top");
  var stickTick = false;
  addEventListener("scroll", function () {
    if (stickTick) return;
    stickTick = true;
    requestAnimationFrame(function () {
      topbar && topbar.classList.toggle("is-stuck", scrollY > 4);
      stickTick = false;
    });
  }, { passive: true });

  /* ----------------------------------------------------------- view router */
  var navBtns = Array.prototype.slice.call(document.querySelectorAll(".nav__btn"));
  var sections = {};
  VIEWS.forEach(function (v) { sections[v] = document.getElementById(v); });

  function showView(name, opts) {
    if (VIEWS.indexOf(name) === -1) name = "overview";
    opts = opts || {};
    VIEWS.forEach(function (v) {
      var sec = sections[v];
      if (!sec) return;
      var active = v === name;
      sec.hidden = !active;
      sec.classList.toggle("view-enter", active && !reduce);
    });
    navBtns.forEach(function (b) {
      var active = b.dataset.view === name;
      if (active) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    // play reveals inside the now-visible view
    var sec = sections[name];
    if (sec) {
      requestAnimationFrame(function () {
        sec.querySelectorAll(".reveal").forEach(function (el) { el.classList.add("is-in"); });
      });
      if (name === "overview") runCountUp();
      if (name === "projects") applyProjects();
    }
    if (!opts.silent) {
      if (("#" + name) !== location.hash) history.pushState({ view: name }, "", "#" + name);
    }
    if (opts.scroll !== false) {
      var y = topbar ? topbar.offsetHeight : 0;
      var target = sec ? sec.getBoundingClientRect().top + scrollY - y - 8 : 0;
      window.scrollTo({ top: name === "overview" ? 0 : Math.max(0, target), behavior: reduce ? "auto" : "smooth" });
    }
    if (opts.focus !== false && sec) {
      sec.setAttribute("tabindex", "-1");
      sec.focus({ preventScroll: true });
    }
    closeMenu();
  }

  document.addEventListener("click", function (e) {
    var trigger = e.target.closest("[data-view]");
    if (trigger) {
      e.preventDefault();
      showView(trigger.dataset.view);
    }
    var soon = e.target.closest("[data-soon]");
    if (soon) showToast(soon.dataset.soon);
  });

  addEventListener("popstate", function () {
    showView((location.hash || "#overview").slice(1), { silent: true, focus: false });
  });

  /* ------------------------------------------------------------- toast */
  var toastEl = document.getElementById("toast");
  var toastT;
  function showToast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("is-shown");
    clearTimeout(toastT);
    toastT = setTimeout(function () { toastEl.classList.remove("is-shown"); }, 3200);
  }

  /* --------------------------------------------------------- count-up */
  var counted = false;
  function runCountUp() {
    if (counted || reduce) return;
    counted = true;
    document.querySelectorAll(".stat__num[data-count]").forEach(function (el) {
      var end = parseInt(el.dataset.count, 10);
      var suffix = el.dataset.suffix || "";
      var start = performance.now(), dur = 900;
      function step(now) {
        var p = Math.min(1, (now - start) / dur);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(eased * end) + suffix;
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }

  /* ----------------------------------------------------- projects tools */
  var list = document.getElementById("project-list");
  var cards = list ? Array.prototype.slice.call(list.querySelectorAll(".pcard")) : [];
  var emptyEl = document.getElementById("proj-empty");
  var filterBtns = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var searchEl = document.getElementById("proj-search");
  var sortEl = document.getElementById("proj-sort");
  var layoutBtns = Array.prototype.slice.call(document.querySelectorAll(".view-switch button"));
  var state = { filter: "all", q: "", sort: "featured", layout: "grid" };

  function applyProjects() {
    if (!list) return;
    var q = state.q.trim().toLowerCase();
    var shown = 0;
    cards.forEach(function (c) {
      var cat = c.dataset.cat;
      var hay = (c.dataset.title + " " + c.dataset.tech + " " + cat).toLowerCase();
      var ok = (state.filter === "all" || cat === state.filter) && (!q || hay.indexOf(q) !== -1);
      c.hidden = !ok;
      if (ok) shown++;
    });
    var sorted = cards.slice().sort(function (a, b) {
      if (state.sort === "az") return a.dataset.title.localeCompare(b.dataset.title);
      if (state.sort === "new") return b.dataset.date.localeCompare(a.dataset.date);
      // featured first, then newest
      var f = (b.dataset.featured | 0) - (a.dataset.featured | 0);
      return f || b.dataset.date.localeCompare(a.dataset.date);
    });
    sorted.forEach(function (c) { list.insertBefore(c, emptyEl); });
    if (emptyEl) emptyEl.hidden = shown !== 0;
    list.dataset.layout = state.layout;
  }

  filterBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      state.filter = b.dataset.filter;
      filterBtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      applyProjects();
    });
  });
  searchEl && searchEl.addEventListener("input", function () { state.q = searchEl.value; applyProjects(); });
  sortEl && sortEl.addEventListener("change", function () { state.sort = sortEl.value; applyProjects(); });
  layoutBtns.forEach(function (b) {
    b.addEventListener("click", function () {
      state.layout = b.dataset.layout;
      layoutBtns.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      applyProjects();
    });
  });

  /* --------------------------------------------------- command palette */
  var cmdk = document.getElementById("cmdk");
  var cmdkInput = document.getElementById("cmdk-input");
  var cmdkResults = document.getElementById("cmdk-results");
  var openBtn = document.getElementById("cmdk-open");
  var lastFocus = null;
  var idx = [];
  var flat = [];
  var sel = 0;

  function buildIndex() {
    idx = [];
    idx.push({ group: "Sections", items: [
      { label: "Overview", meta: "", view: "overview" },
      { label: "Projects", meta: "5", view: "projects" },
      { label: "Reference Hub", meta: "6", view: "references" },
      { label: "Resume & Skills", meta: "", view: "resume" },
      { label: "Contact", meta: "", view: "contact" }
    ]});
    var proj = cards.map(function (c) {
      return { label: c.dataset.title, meta: c.dataset.cat, view: "projects", el: c };
    });
    idx.push({ group: "Projects", items: proj });
    var notes = Array.prototype.slice.call(document.querySelectorAll("#references .note")).map(function (n) {
      return { label: n.querySelector("h3").textContent, meta: n.querySelector(".note__date").textContent.replace(/\s+/g, " ").trim(), view: "references", el: n };
    });
    idx.push({ group: "Reference Hub", items: notes });
  }

  function renderCmdk() {
    var q = cmdkInput.value.trim().toLowerCase();
    cmdkResults.innerHTML = "";
    flat = [];
    idx.forEach(function (grp) {
      var matches = grp.items.filter(function (it) {
        return !q || (it.label + " " + it.meta).toLowerCase().indexOf(q) !== -1;
      });
      if (!matches.length) return;
      var h = document.createElement("div");
      h.className = "cmdk__group";
      h.textContent = grp.group;
      cmdkResults.appendChild(h);
      matches.forEach(function (it) {
        var b = document.createElement("button");
        b.className = "cmdk__item";
        b.type = "button";
        b.setAttribute("role", "option");
        b.innerHTML =
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6"/></svg>' +
          '<span class="t"></span><span class="d"></span>';
        b.querySelector(".t").textContent = it.label;
        b.querySelector(".d").textContent = it.meta;
        var myIndex = flat.length;
        b.addEventListener("click", function () { execItem(it); });
        b.addEventListener("mousemove", function () { setSel(myIndex); });
        cmdkResults.appendChild(b);
        flat.push({ it: it, el: b });
      });
    });
    if (!flat.length) {
      var e = document.createElement("div");
      e.className = "cmdk__empty";
      e.textContent = "Nothing matches “" + cmdkInput.value + "”";
      cmdkResults.appendChild(e);
    }
    setSel(0);
  }

  function setSel(i) {
    if (!flat.length) return;
    sel = (i + flat.length) % flat.length;
    flat.forEach(function (f, n) {
      f.el.setAttribute("aria-selected", String(n === sel));
      if (n === sel) f.el.scrollIntoView({ block: "nearest" });
    });
  }

  function execItem(it) {
    closeCmdk();
    showView(it.view);
    if (it.el) {
      setTimeout(function () {
        it.el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
        it.el.classList.add("is-flash");
        setTimeout(function () { it.el.classList.remove("is-flash"); }, 1200);
      }, reduce ? 0 : 260);
    }
  }

  function openCmdk() {
    if (!cmdk) return;
    lastFocus = document.activeElement;
    cmdk.hidden = false;
    requestAnimationFrame(function () { cmdk.classList.add("is-open"); });
    cmdkInput.value = "";
    buildIndex();
    renderCmdk();
    cmdkInput.focus();
  }
  function closeCmdk() {
    if (!cmdk) return;
    cmdk.classList.remove("is-open");
    setTimeout(function () { cmdk.hidden = true; }, 180);
    lastFocus && lastFocus.focus && lastFocus.focus();
  }

  openBtn && openBtn.addEventListener("click", openCmdk);
  cmdkInput && cmdkInput.addEventListener("input", renderCmdk);
  cmdk && cmdk.addEventListener("click", function (e) { if (e.target === cmdk) closeCmdk(); });
  cmdkInput && cmdkInput.addEventListener("keydown", function (e) {
    if (e.key === "ArrowDown") { e.preventDefault(); setSel(sel + 1); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSel(sel - 1); }
    else if (e.key === "Enter") { e.preventDefault(); flat[sel] && execItem(flat[sel].it); }
    else if (e.key === "Escape") { e.preventDefault(); closeCmdk(); }
  });

  addEventListener("keydown", function (e) {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      cmdk && cmdk.classList.contains("is-open") ? closeCmdk() : openCmdk();
    } else if (e.key === "Escape" && cmdk && cmdk.classList.contains("is-open")) {
      closeCmdk();
    }
  });

  /* --------------------------------------------------------- reveal */
  var reveals = document.querySelectorAll(".reveal");
  if (reveals.length && !reduce && "IntersectionObserver" in window) {
    var safety = setTimeout(function () {
      reveals.forEach(function (el) { el.classList.add("is-in"); });
    }, 2600);
    addEventListener("pagehide", function () { clearTimeout(safety); });
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  } else {
    reveals.forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ------------------------------------------------------- boot */
  applyProjects();
  var start = (location.hash || "#overview").slice(1);
  showView(VIEWS.indexOf(start) !== -1 ? start : "overview", { silent: true, scroll: false, focus: false });
})();
