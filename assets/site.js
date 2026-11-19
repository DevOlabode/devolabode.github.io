// Shared behaviour for every page: theme toggle, scroll reveals, nav highlight, copy email.
// The saved theme itself is applied by a one-line snippet in <head>, before first paint.
(function () {
  var root = document.documentElement;
  var reduceMotion = matchMedia('(prefers-reduced-motion: reduce)');
  var systemDark = matchMedia('(prefers-color-scheme: dark)');

  /* ---------- Theme toggle ---------- */
  var toggle = document.querySelector('.theme-toggle');

  function isDark() {
    var saved = root.dataset.theme;
    return saved ? saved === 'dark' : systemDark.matches;
  }

  function sync() {
    var dark = isDark();
    toggle.setAttribute('aria-pressed', String(dark));
    document.querySelectorAll('meta[name="theme-color"]').forEach(function (m) {
      m.content = dark ? '#0f0f10' : '#fafaf8';
    });
  }

  function setTheme(next) {
    root.dataset.theme = next;
    try { localStorage.setItem('theme', next); } catch (e) {}
    sync();
  }

  if (toggle) {
    toggle.hidden = false;
    sync();
    systemDark.addEventListener('change', sync);

    toggle.addEventListener('click', function () {
      var next = isDark() ? 'light' : 'dark';
      if (!document.startViewTransition || reduceMotion.matches) return setTheme(next);

      // Reveal the new theme in a circle growing out of the button.
      var r = toggle.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      var radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      root.classList.add('theme-switching');
      var transition = document.startViewTransition(function () { setTheme(next); });
      transition.ready.then(function () {
        root.animate(
          { clipPath: ['circle(0 at ' + x + 'px ' + y + 'px)', 'circle(' + radius + 'px at ' + x + 'px ' + y + 'px)'] },
          { duration: 550, easing: 'cubic-bezier(.2, .7, .2, 1)', pseudoElement: '::view-transition-new(root)' }
        );
      });
      transition.finished.finally(function () { root.classList.remove('theme-switching'); });
    });
  }

  /* ---------- Reveal content as it scrolls into view ---------- */
  // Only elements below the fold are hidden, so nothing on screen ever flickers,
  // and if this script never runs, everything stays visible.
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    var reveal = new IntersectionObserver(function (entries) {
      var n = 0;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        entry.target.style.animationDelay = (n++ * 80) + 'ms'; // stagger items that arrive together
        entry.target.classList.add('in');
        reveal.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });

    document.querySelectorAll(
      '.sec-head, .project, .more-list li, .xp > li, .skills > div, .two > *, .cta, .row, .flow li, .pager a'
    ).forEach(function (el) {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.classList.add('reveal');
      reveal.observe(el);
    });
  }

  /* ---------- Highlight the nav link for the section on screen ---------- */
  var navLinks = {};
  document.querySelectorAll('.nav a[href^="/#"]').forEach(function (a) { navLinks[a.hash.slice(1)] = a; });
  var sections = Object.keys(navLinks).map(function (id) { return document.getElementById(id); }).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        navLinks[entry.target.id].classList.toggle('is-active', entry.isIntersecting);
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach(function (s) { spy.observe(s); });
  }

  /* ---------- Copy-email button (hidden until the Clipboard API is available) ---------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    if (!navigator.clipboard) return;
    var status = document.getElementById('copy-status');
    btn.hidden = false;
    btn.addEventListener('click', function () {
      navigator.clipboard.writeText(btn.dataset.copy).then(function () {
        btn.textContent = 'Copied';
        if (status) status.textContent = 'Email address copied';
      }, function () {
        btn.textContent = 'Copy failed';
      });
      setTimeout(function () {
        btn.textContent = 'Copy';
        if (status) status.textContent = '';
      }, 1800);
    });
  });
})();
