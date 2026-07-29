/* ==========================================================================
   Kaloyan Krastev — Portfolio
   Vanilla JS only. No frameworks, no build step.
   Sections: theme, scroll progress, navbar scroll state, mobile menu,
   scroll reveal, smooth scroll, GitHub live activity line,
   copy-to-clipboard + toast, footer year.
   ========================================================================== */

(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------------
     1. Theme (dark default, light optional) — persisted via cookie so
        it survives without relying on localStorage.
     ------------------------------------------------------------------ */

  var THEME_COOKIE = 'portfolio_theme';

  function getCookie(name) {
    var match = document.cookie.match(new RegExp('(?:^|; )' + name + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  function setCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    document.cookie = name + '=' + encodeURIComponent(value) + expires + '; path=/; SameSite=Strict';
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
  }

  function initTheme() {
    var saved = getCookie(THEME_COOKIE);
    if (saved === 'light' || saved === 'dark') {
      applyTheme(saved);
    } else {
      var systemPrefersLight = window.matchMedia('(prefers-color-scheme: light)').matches;
      applyTheme(systemPrefersLight ? 'light' : 'dark');
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
    var next = current === 'light' ? 'dark' : 'light';
    applyTheme(next);
    setCookie(THEME_COOKIE, next, 365);
  }

  var themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }

  initTheme();

  /* ------------------------------------------------------------------
     2. Scroll progress hairline + navbar scroll state
     ------------------------------------------------------------------ */

  var navbar = document.getElementById('navbar');
  var scrollProgress = document.getElementById('scrollProgress');
  var lastScrollState = false;

  function updateOnScroll() {
    var shouldBeScrolled = window.scrollY > 12;
    if (navbar && shouldBeScrolled !== lastScrollState) {
      navbar.classList.toggle('is-scrolled', shouldBeScrolled);
      lastScrollState = shouldBeScrolled;
    }

    if (scrollProgress) {
      var scrollTop = window.scrollY;
      var docHeight = document.documentElement.scrollHeight - window.innerHeight;
      var pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      scrollProgress.style.width = pct + '%';
    }
  }

  updateOnScroll();
  window.addEventListener('scroll', updateOnScroll, { passive: true });
  window.addEventListener('resize', updateOnScroll);

  /* ------------------------------------------------------------------
     3. Mobile menu
     ------------------------------------------------------------------ */

  var navToggle = document.getElementById('navToggle');
  var mobilePanel = document.getElementById('mobilePanel');
  var mobilePanelClose = document.getElementById('mobilePanelClose');
  var scrim = document.getElementById('scrim');

  function openMobileMenu() {
    mobilePanel.classList.add('is-open');
    scrim.classList.add('is-open');
    navToggle.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
  }

  function closeMobileMenu() {
    mobilePanel.classList.remove('is-open');
    scrim.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  if (navToggle) {
    navToggle.addEventListener('click', function () {
      var isOpen = mobilePanel.classList.contains('is-open');
      if (isOpen) {
        closeMobileMenu();
      } else {
        openMobileMenu();
      }
    });
  }

  if (mobilePanelClose) mobilePanelClose.addEventListener('click', closeMobileMenu);
  if (scrim) scrim.addEventListener('click', closeMobileMenu);

  if (mobilePanel) {
    Array.prototype.forEach.call(mobilePanel.querySelectorAll('a'), function (link) {
      link.addEventListener('click', closeMobileMenu);
    });
  }

  document.addEventListener('keydown', function (event) {
    if (event.key === 'Escape') closeMobileMenu();
  });

  /* ------------------------------------------------------------------
     4. Reveal-on-scroll — IntersectionObserver, staggered within groups
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
     5. Smooth scroll for in-page anchors (progressive enhancement on
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
     6. GitHub live activity line (inside the Contact "source control" row)
     ------------------------------------------------------------------ */

  var GITHUB_USERNAME = 'kaloyansys32';

  function setGithubSub(text) {
    var el = document.getElementById('githubSub');
    if (!el) return;
    el.textContent = text;
    el.classList.remove('is-loading');
  }

  // Fetches profile + repos independently so a rate limit on one endpoint
  // doesn't blank out information available from the other.
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

  function loadGithubActivity() {
    var githubSub = document.getElementById('githubSub');
    if (!githubSub) return;

    Promise.all([
      fetchJson('https://api.github.com/users/' + GITHUB_USERNAME),
      fetchJson('https://api.github.com/users/' + GITHUB_USERNAME + '/repos?per_page=100')
    ])
      .then(function (results) {
        var user = results[0];
        var repos = Array.isArray(results[1]) ? results[1] : [];
        var totalStars = repos.reduce(function (sum, repo) {
          return sum + (repo.stargazers_count || 0);
        }, 0);
        var repoCount = user.public_repos != null ? user.public_repos : repos.length;
        setGithubSub(repoCount + ' public repos · ' + totalStars + ' stars');
      })
      .catch(function (err) {
        console.error('[github-activity]', err.message);
        // Fail quietly — the row still works fine as a plain link.
        githubSub.remove();
      });
  }

  loadGithubActivity();

  /* ------------------------------------------------------------------
     7. Project card metadata — star count per repo, fetched independently
        per card so one failing request doesn't affect the others.
     ------------------------------------------------------------------ */

  function loadProjectMeta() {
    var metaEls = Array.prototype.slice.call(document.querySelectorAll('.project-meta[data-repo]'));

    metaEls.forEach(function (el) {
      var repo = el.getAttribute('data-repo');
      fetchJson('https://api.github.com/repos/' + GITHUB_USERNAME + '/' + repo)
        .then(function (data) {
          var stars = data.stargazers_count || 0;
          el.textContent = '★ ' + stars;
          el.classList.remove('is-loading');
        })
        .catch(function (err) {
          console.error('[project-meta] ' + repo, err.message);
          // Fail quietly — the card still reads fine without a live star count.
          el.remove();
        });
    });
  }

  loadProjectMeta();

  /* ------------------------------------------------------------------
     8. Copy email to clipboard + toast
     ------------------------------------------------------------------ */

  var copyEmailRow = document.getElementById('copyEmailRow');
  var toast = document.getElementById('toast');
  var toastTimeout = null;

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

  if (copyEmailRow) {
    copyEmailRow.addEventListener('click', function () {
      var emailValueEl = document.getElementById('emailValue');
      var email = emailValueEl ? emailValueEl.textContent.trim() : '';
      if (!email) return;

      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard
          .writeText(email)
          .then(function () { showToast('Email copied to clipboard'); })
          .catch(function () { showToast('Could not copy — email: ' + email); });
      } else {
        showToast('Email: ' + email);
      }
    });
  }

  /* ------------------------------------------------------------------
     9. Footer year
     ------------------------------------------------------------------ */

  var yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

})();
