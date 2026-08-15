/* ==========================================================================
   Kaloyan K. — Personal site
   Vanilla JS only. No frameworks, no build step.
   Sections: navbar scroll state, mobile menu, scroll reveal, smooth scroll,
   GitHub repo stats, copy-to-clipboard, footer year.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. Navbar scroll state — subtle translucent/blurred background
     ------------------------------------------------------------------ */

  var nav = document.getElementById('nav');
  var lastScrollState = false;

  function updateOnScroll() {
    var shouldBeScrolled = window.scrollY > 12;
    if (nav && shouldBeScrolled !== lastScrollState) {
      nav.classList.toggle('is-scrolled', shouldBeScrolled);
      lastScrollState = shouldBeScrolled;
    }
  }

  updateOnScroll();
  window.addEventListener('scroll', updateOnScroll, { passive: true });

  /* ------------------------------------------------------------------
     2. Mobile menu
     ------------------------------------------------------------------ */

  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var mobileMenuClose = document.getElementById('mobileMenuClose');
  var menuScrim = document.getElementById('menuScrim');

  function openMobileMenu() {
    mobileMenu.classList.add('is-open');
    menuScrim.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobileMenu.classList.remove('is-open');
    menuScrim.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.contains('is-open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobileMenuClose) mobileMenuClose.addEventListener('click', closeMobileMenu);
  if (menuScrim) menuScrim.addEventListener('click', closeMobileMenu);

  if (mobileMenu) {
    Array.prototype.forEach.call(mobileMenu.querySelectorAll('a'), function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMobileMenu();
  });

  /* ------------------------------------------------------------------
     3. Reveal-on-scroll — IntersectionObserver
     ------------------------------------------------------------------ */

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -40px 0px' }
    );

    revealEls.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------------------
     4. Smooth scroll for in-page anchors (progressive enhancement on
        top of CSS scroll-behavior, mainly here to close the mobile menu
        and manage focus for accessibility)
     ------------------------------------------------------------------ */

  Array.prototype.forEach.call(document.querySelectorAll('a[href^="#"]'), function (link) {
    link.addEventListener('click', function (event) {
      var targetId = link.getAttribute('href');
      if (!targetId || targetId === '#') return;
      var target = document.querySelector(targetId);
      if (!target) return;

      event.preventDefault();
      target.scrollIntoView({ behavior: prefersReducedMotion ? 'auto' : 'smooth', block: 'start' });

      // Move focus for keyboard/screen-reader users once the scroll settles.
      window.setTimeout(function () {
        target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      }, prefersReducedMotion ? 0 : 450);
    });
  });

  /* ------------------------------------------------------------------
     5. GitHub repo stats — star count per project, fetched independently
        per card so one failing request doesn't affect the others.
     ------------------------------------------------------------------ */

  var GITHUB_USERNAME = 'Im4TheOne';

  function fetchJson(url) {
    return fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      cache: 'no-store'
    }).then(function (res) {
      if (!res.ok) {
        throw new Error('GitHub request failed with status ' + res.status + ' at ' + url);
      }
      return res.json();
    });
  }

  function loadProjectStats() {
    var statEls = Array.prototype.slice.call(document.querySelectorAll('.project-stat[data-repo]'));

    statEls.forEach(function (el) {
      var repo = el.getAttribute('data-repo');
      fetchJson('https://api.github.com/repos/' + GITHUB_USERNAME + '/' + repo)
        .then(function (data) {
          var stars = data.stargazers_count || 0;
          var label = stars === 1 ? '1 star' : stars + ' stars';
          el.textContent = label + ' on GitHub';
          el.classList.remove('is-loading');
        })
        .catch(function (err) {
          console.error('[project-stats] ' + repo, err.message);
          // Fail quietly — the project still reads fine without a live star count.
          el.remove();
        });
    });
  }

  loadProjectStats();

  /* ------------------------------------------------------------------
     6. Copy email to clipboard + toast
     ------------------------------------------------------------------ */

  var copyEmailBtn = document.getElementById('copyEmailBtn');
  var toast = document.getElementById('toast');
  var toastTimeout = null;
  var EMAIL = 'contactim4theone@gmail.com';

  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    if (toastTimeout) {
      window.clearTimeout(toastTimeout);
      toast.classList.remove('is-active');
    }
    window.setTimeout(function () { toast.classList.add('is-active'); }, 20);
    toastTimeout = window.setTimeout(function () { toast.classList.remove('is-active'); }, 2400);
  }

  if (copyEmailBtn) {
    copyEmailBtn.addEventListener('click', function () {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(EMAIL)
          .then(function () { showToast('Email copied to clipboard'); })
          .catch(function () { showToast('Email: ' + EMAIL); });
      } else {
        showToast('Email: ' + EMAIL);
      }
    });
  }

  /* ------------------------------------------------------------------
     7. Footer year
     ------------------------------------------------------------------ */

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
