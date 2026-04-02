/**
 * KEYSTONE TECHNOLOGIES — V3 Enterprise Script
 * Features: sticky nav, dropdowns, carousels, search/filter, forms, animations
 */

(function() {
  'use strict';

  /* =============================================
     UTILITIES
     ============================================= */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
  const on = (el, ev, fn) => el && el.addEventListener(ev, fn);
  const off = (el, ev, fn) => el && el.removeEventListener(ev, fn);
  const debounce = (fn, ms = 150) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); }; };
  const clamp = (val, min, max) => Math.min(Math.max(val, min), max);

  /* =============================================
     STICKY NAVIGATION
     ============================================= */
  const navbar = $('#navbar');

  function handleScroll() {
    if (!navbar) return;
    if (window.scrollY > 80) {
      navbar.classList.add('scrolled');
    } else {
      navbar.classList.remove('scrolled');
    }
  }

  on(window, 'scroll', handleScroll);
  handleScroll();

  /* =============================================
     MOBILE MENU
     ============================================= */
  const hamburger = $('.hamburger');
  const mobileNav = $('.mobile-nav');

  function openMenu() {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.add('open');
    mobileNav.classList.add('open');
    document.body.style.overflow = 'hidden';
    hamburger.setAttribute('aria-expanded', 'true');
  }

  function closeMenu() {
    if (!hamburger || !mobileNav) return;
    hamburger.classList.remove('open');
    mobileNav.classList.remove('open');
    document.body.style.overflow = '';
    hamburger.setAttribute('aria-expanded', 'false');
  }

  on(hamburger, 'click', () => {
    if (hamburger.classList.contains('open')) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close mobile nav on link click
  $$('.mobile-nav a').forEach(link => on(link, 'click', closeMenu));

  // Close on outside click
  on(document, 'click', (e) => {
    if (mobileNav && mobileNav.classList.contains('open')) {
      if (!mobileNav.contains(e.target) && !hamburger.contains(e.target)) {
        closeMenu();
      }
    }
  });

  // Keyboard trap
  on(document, 'keydown', (e) => {
    if (e.key === 'Escape') closeMenu();
  });

  /* Mobile sub-nav toggles */
  $$('.mobile-nav-toggle').forEach(toggle => {
    on(toggle, 'click', () => {
      const sub = toggle.nextElementSibling;
      const isOpen = sub.style.display === 'block';
      sub.style.display = isOpen ? 'none' : 'block';
      toggle.setAttribute('aria-expanded', String(!isOpen));
    });
  });

  /* =============================================
     CAROUSEL
     ============================================= */
  function initCarousel(wrapper) {
    if (!wrapper) return;
    const track = wrapper.querySelector('.carousel-track');
    const slides = $$('.carousel-slide', wrapper);
    const prevBtn = wrapper.querySelector('.carousel-prev');
    const nextBtn = wrapper.querySelector('.carousel-next');
    const dotsContainer = wrapper.querySelector('.carousel-dots');

    if (!track || slides.length === 0) return;

    let current = 0;
    let autoplayInterval = null;
    let isDragging = false;
    let startX = 0;
    let startTranslate = 0;

    // Determine visible slides based on viewport
    function getSlidesPerView() {
      if (window.innerWidth >= 1024) return Math.min(3, slides.length);
      if (window.innerWidth >= 640) return Math.min(2, slides.length);
      return 1;
    }

    function getMaxIndex() {
      return Math.max(0, slides.length - getSlidesPerView());
    }

    // Build dots
    function buildDots() {
      if (!dotsContainer) return;
      dotsContainer.innerHTML = '';
      const max = getMaxIndex() + 1;
      for (let i = 0; i < max; i++) {
        const dot = document.createElement('button');
        dot.className = 'carousel-dot' + (i === current ? ' active' : '');
        dot.setAttribute('aria-label', `Go to slide ${i + 1}`);
        on(dot, 'click', () => goTo(i));
        dotsContainer.appendChild(dot);
      }
    }

    function updateDots() {
      if (!dotsContainer) return;
      $$('.carousel-dot', dotsContainer).forEach((dot, i) => {
        dot.classList.toggle('active', i === current);
      });
    }

    function getSlideWidth() {
      if (slides.length === 0) return 0;
      const style = getComputedStyle(track);
      const gap = parseFloat(style.gap) || 32;
      const perView = getSlidesPerView();
      return slides[0].offsetWidth + gap;
    }

    function updateTrack(animate = true) {
      const offset = current * getSlideWidth();
      track.style.transition = animate ? 'transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)' : 'none';
      track.style.transform = `translateX(-${offset}px)`;
    }

    function goTo(index) {
      current = clamp(index, 0, getMaxIndex());
      updateTrack();
      updateDots();
      if (prevBtn) prevBtn.disabled = current === 0;
      if (nextBtn) nextBtn.disabled = current >= getMaxIndex();
    }

    function next() { goTo(current + 1); }
    function prev() { goTo(current - 1); }

    on(nextBtn, 'click', next);
    on(prevBtn, 'click', prev);

    // Keyboard navigation
    on(wrapper, 'keydown', (e) => {
      if (e.key === 'ArrowRight') next();
      if (e.key === 'ArrowLeft') prev();
    });

    // Touch / mouse drag
    function onDragStart(e) {
      isDragging = true;
      startX = (e.touches ? e.touches[0].clientX : e.clientX);
      startTranslate = current * getSlideWidth();
      track.style.transition = 'none';
    }

    function onDragMove(e) {
      if (!isDragging) return;
      const x = (e.touches ? e.touches[0].clientX : e.clientX);
      const delta = startX - x;
      track.style.transform = `translateX(-${startTranslate + delta}px)`;
    }

    function onDragEnd(e) {
      if (!isDragging) return;
      isDragging = false;
      const x = (e.changedTouches ? e.changedTouches[0].clientX : e.clientX);
      const delta = startX - x;
      if (Math.abs(delta) > 50) {
        delta > 0 ? next() : prev();
      } else {
        updateTrack();
      }
    }

    on(track, 'touchstart', onDragStart, { passive: true });
    on(track, 'touchmove', onDragMove, { passive: true });
    on(track, 'touchend', onDragEnd);
    on(track, 'mousedown', onDragStart);
    on(track, 'mousemove', onDragMove);
    on(track, 'mouseup', onDragEnd);
    on(track, 'mouseleave', onDragEnd);
    track.style.cursor = 'grab';

    // Autoplay
    function startAutoplay(delay = 5000) {
      stopAutoplay();
      autoplayInterval = setInterval(next, delay);
    }

    function stopAutoplay() {
      clearInterval(autoplayInterval);
    }

    const autoplay = wrapper.dataset.autoplay;
    if (autoplay) {
      startAutoplay(parseInt(autoplay) || 5000);
      on(wrapper, 'mouseenter', stopAutoplay);
      on(wrapper, 'mouseleave', () => startAutoplay());
    }

    // Resize
    on(window, 'resize', debounce(() => {
      buildDots();
      goTo(Math.min(current, getMaxIndex()));
    }));

    buildDots();
    goTo(0);
  }

  // Init all carousels
  $$('.carousel-wrapper').forEach(initCarousel);

  /* =============================================
     SEARCH & FILTER (Blog Articles)
     ============================================= */
  const searchInput = $('#blog-search');
  const filterTabs = $$('.filter-tab');
  const articleGrid = $('#articles-grid');

  let currentFilter = 'all';
  let currentSearch = '';

  function filterArticles() {
    if (!articleGrid) return;
    const cards = $$('.blog-card', articleGrid);
    let visibleCount = 0;

    cards.forEach(card => {
      const category = card.dataset.category || '';
      const title = card.dataset.title || '';
      const excerpt = card.dataset.excerpt || '';

      const matchFilter = currentFilter === 'all' || category.toLowerCase() === currentFilter.toLowerCase();
      const matchSearch = !currentSearch ||
        title.toLowerCase().includes(currentSearch) ||
        excerpt.toLowerCase().includes(currentSearch) ||
        category.toLowerCase().includes(currentSearch);

      const visible = matchFilter && matchSearch;
      card.style.display = visible ? '' : 'none';
      if (visible) visibleCount++;
    });

    // Update count
    const countEl = $('#articles-count');
    if (countEl) countEl.textContent = visibleCount;

    // Empty state
    let emptyEl = $('#articles-empty');
    if (visibleCount === 0) {
      if (!emptyEl) {
        emptyEl = document.createElement('div');
        emptyEl.id = 'articles-empty';
        emptyEl.className = 'text-center';
        emptyEl.style.cssText = 'padding: 4rem; grid-column: 1/-1;';
        emptyEl.innerHTML = '<p style="font-size:1.1rem; color: var(--gray-400);">No articles match your search. <button onclick="resetFilter()" style="color: var(--navy); font-weight: 600; cursor: pointer; background: none; border: none; text-decoration: underline;">Clear filters</button></p>';
        articleGrid.appendChild(emptyEl);
      }
      emptyEl.style.display = 'block';
    } else if (emptyEl) {
      emptyEl.style.display = 'none';
    }
  }

  on(searchInput, 'input', debounce((e) => {
    currentSearch = e.target.value.trim().toLowerCase();
    filterArticles();
  }, 200));

  filterTabs.forEach(tab => {
    on(tab, 'click', () => {
      filterTabs.forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      currentFilter = tab.dataset.filter || 'all';
      filterArticles();
    });
  });

  window.resetFilter = function() {
    currentFilter = 'all';
    currentSearch = '';
    if (searchInput) searchInput.value = '';
    filterTabs.forEach(t => t.classList.remove('active'));
    const allTab = filterTabs.find(t => t.dataset.filter === 'all');
    if (allTab) allTab.classList.add('active');
    filterArticles();
  };

  /* =============================================
     TABS
     ============================================= */
  $$('.tabs-nav').forEach(nav => {
    const tabBtns = $$('.tab-btn', nav);
    const tabGroup = nav.nextElementSibling;
    if (!tabGroup) return;
    const panels = $$('.tab-panel', tabGroup);

    tabBtns.forEach((btn, i) => {
      on(btn, 'click', () => {
        tabBtns.forEach(b => b.classList.remove('active'));
        panels.forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        if (panels[i]) panels[i].classList.add('active');
      });
    });
  });

  /* =============================================
     ACCORDION
     ============================================= */
  $$('.accordion-header').forEach(header => {
    on(header, 'click', () => {
      const item = header.closest('.accordion-item');
      const isOpen = item.classList.contains('open');

      // Close all siblings
      const siblings = $$('.accordion-item', item.closest('.accordion'));
      siblings.forEach(s => {
        s.classList.remove('open');
        s.querySelector('.accordion-body').style.maxHeight = null;
      });

      if (!isOpen) {
        item.classList.add('open');
        const body = item.querySelector('.accordion-body');
        body.style.maxHeight = body.scrollHeight + 'px';
      }
    });
  });

  /* =============================================
     ROI CALCULATOR
     ============================================= */
  const roiForm = $('#roi-calculator-form');
  const roiResult = $('#roi-result-amount');

  function calculateROI() {
    if (!roiForm) return;
    const employees = parseInt($('#roi-employees', roiForm)?.value) || 0;
    const hourlyRate = parseFloat($('#roi-hourly', roiForm)?.value) || 0;
    const downtime = parseFloat($('#roi-downtime', roiForm)?.value) || 0;

    // Estimated savings: 60% reduction in downtime + productivity gains
    const downtimeCostPerYear = employees * hourlyRate * downtime * 52;
    const savings = Math.round(downtimeCostPerYear * 0.6);

    if (roiResult) {
      roiResult.textContent = '$' + savings.toLocaleString();
    }
  }

  if (roiForm) {
    $$('input', roiForm).forEach(input => on(input, 'input', calculateROI));
    calculateROI();
  }

  /* =============================================
     CONTACT FORM
     ============================================= */
  const contactForm = $('#contact-form');

  on(contactForm, 'submit', function(e) {
    e.preventDefault();

    const btn = contactForm.querySelector('[type="submit"]');
    const originalText = btn.textContent;

    // Loading state
    btn.textContent = 'Sending...';
    btn.disabled = true;
    btn.style.opacity = '0.7';

    // Simulate submission (replace with real API call)
    setTimeout(() => {
      const formContent = contactForm.querySelector('.form-fields');
      const successMsg = $('#form-success');

      if (formContent) formContent.style.display = 'none';
      if (successMsg) {
        successMsg.classList.add('show');
        successMsg.style.display = 'block';
      }

      btn.textContent = originalText;
      btn.disabled = false;
      btn.style.opacity = '';
    }, 1500);
  });

  /* =============================================
     SCROLL REVEAL
     ============================================= */
  const revealEls = $$('.reveal');

  if ('IntersectionObserver' in window) {
    const revealObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          revealObserver.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15, rootMargin: '0px 0px -50px 0px' });

    revealEls.forEach(el => revealObserver.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('visible'));
  }

  /* =============================================
     COUNTER ANIMATION
     ============================================= */
  function animateCounter(el, target, duration = 2000, prefix = '', suffix = '') {
    const start = 0;
    const startTime = performance.now();
    const isDecimal = target % 1 !== 0;

    function update(currentTime) {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      const value = start + (target - start) * eased;

      el.textContent = prefix + (isDecimal ? value.toFixed(1) : Math.floor(value)) + suffix;

      if (progress < 1) requestAnimationFrame(update);
    }

    requestAnimationFrame(update);
  }

  if ('IntersectionObserver' in window) {
    const counterObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const el = entry.target;
          const target = parseFloat(el.dataset.target);
          const prefix = el.dataset.prefix || '';
          const suffix = el.dataset.suffix || '';
          animateCounter(el, target, 2000, prefix, suffix);
          counterObserver.unobserve(el);
        }
      });
    }, { threshold: 0.5 });

    $$('[data-target]').forEach(el => counterObserver.observe(el));
  }

  /* =============================================
     BACK TO TOP
     ============================================= */
  const backToTop = $('#back-to-top');

  on(window, 'scroll', debounce(() => {
    if (!backToTop) return;
    if (window.scrollY > 400) {
      backToTop.classList.add('visible');
    } else {
      backToTop.classList.remove('visible');
    }
  }, 50));

  on(backToTop, 'click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* =============================================
     SMOOTH SCROLL
     ============================================= */
  $$('a[href^="#"]').forEach(anchor => {
    on(anchor, 'click', (e) => {
      const href = anchor.getAttribute('href');
      if (href === '#') return;
      const target = $(href);
      if (target) {
        e.preventDefault();
        const navHeight = navbar ? navbar.offsetHeight : 80;
        const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 16;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

  /* =============================================
     ACTIVE NAV LINK (based on current page)
     ============================================= */
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  $$('.nav-link[href]').forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  /* =============================================
     WEBINAR & RESOURCE FILTER (resources page)
     ============================================= */
  function initResourceFilter(containerId, filterClass) {
    const container = $(`#${containerId}`);
    if (!container) return;

    const tabs = $$(`${filterClass}`, container.closest('section') || document);

    tabs.forEach(tab => {
      on(tab, 'click', () => {
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const filter = tab.dataset.filter;
        $$('[data-type]', container).forEach(item => {
          item.style.display = (filter === 'all' || item.dataset.type === filter) ? '' : 'none';
        });
      });
    });
  }

  /* =============================================
     COPY LINK
     ============================================= */
  $$('[data-copy]').forEach(btn => {
    on(btn, 'click', () => {
      const text = btn.dataset.copy;
      navigator.clipboard.writeText(text).then(() => {
        const orig = btn.textContent;
        btn.textContent = 'Copied!';
        setTimeout(() => { btn.textContent = orig; }, 2000);
      });
    });
  });

  /* =============================================
     LIGHTBOX (PDF previews)
     ============================================= */
  $$('[data-lightbox]').forEach(trigger => {
    on(trigger, 'click', (e) => {
      e.preventDefault();
      const msg = 'In a production environment, this would open the PDF in a viewer. Please contact us to receive this resource by email.';
      alert(msg);
    });
  });

  /* =============================================
     HERO VIDEO / ANIMATION
     ============================================= */
  // Typing effect for hero subtitle if present
  const typingEl = $('#hero-typing');
  if (typingEl) {
    const phrases = typingEl.dataset.phrases?.split('|') || [];
    if (phrases.length > 0) {
      let phraseIdx = 0;
      let charIdx = 0;
      let deleting = false;

      function typeLoop() {
        const phrase = phrases[phraseIdx];
        if (!deleting) {
          typingEl.textContent = phrase.slice(0, charIdx + 1);
          charIdx++;
          if (charIdx === phrase.length) {
            deleting = true;
            setTimeout(typeLoop, 2000);
            return;
          }
        } else {
          typingEl.textContent = phrase.slice(0, charIdx - 1);
          charIdx--;
          if (charIdx === 0) {
            deleting = false;
            phraseIdx = (phraseIdx + 1) % phrases.length;
          }
        }
        setTimeout(typeLoop, deleting ? 40 : 80);
      }

      typeLoop();
    }
  }

  /* =============================================
     FORM VALIDATION
     ============================================= */
  $$('form').forEach(form => {
    if (form.id === 'contact-form') return; // handled above

    on(form, 'submit', (e) => {
      const requiredFields = $$('[required]', form);
      let valid = true;

      requiredFields.forEach(field => {
        field.style.borderColor = '';
        if (!field.value.trim()) {
          field.style.borderColor = '#e53e3e';
          valid = false;
        }
      });

      if (!valid) {
        e.preventDefault();
        const firstInvalid = form.querySelector('[required]:invalid, [style*="e53e3e"]');
        if (firstInvalid) firstInvalid.focus();
      }
    });

    // Live validation
    $$('[required]', form).forEach(field => {
      on(field, 'blur', () => {
        if (!field.value.trim()) {
          field.style.borderColor = '#e53e3e';
        } else {
          field.style.borderColor = '';
        }
      });
    });
  });

  /* =============================================
     PRINT (Case Studies)
     ============================================= */
  $$('[data-action="print"]').forEach(btn => {
    on(btn, 'click', () => window.print());
  });

  console.log('%c🔒 Keystone Technologies V3', 'color: #004876; font-size: 14px; font-weight: bold;');
  console.log('%cBuilt with enterprise-grade care.', 'color: #ffb819; font-size: 11px;');

})();
