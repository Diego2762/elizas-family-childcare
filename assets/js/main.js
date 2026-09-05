/* Eliza's Family Childcare — site interactions */
(function () {
  "use strict";

  // ---- Mobile nav toggle ----
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  var header = document.querySelector(".site-header");

  if (toggle && links) {
    toggle.addEventListener("click", function () {
      var open = links.classList.toggle("open");
      toggle.classList.toggle("is-active", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      document.body.classList.toggle("nav-open", open);
    });

    // Close the menu after tapping a link (in-page anchors)
    links.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", function () {
        links.classList.remove("open");
        toggle.classList.remove("is-active");
        toggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("nav-open");
      });
    });
  }

  // ---- Shadow / condensed header on scroll ----
  if (header) {
    var onScroll = function () {
      header.classList.toggle("scrolled", window.scrollY > 12);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
  }

  // ---- Smooth scroll with sticky-header offset ----
  document.querySelectorAll('a[href^="#"]').forEach(function (a) {
    a.addEventListener("click", function (e) {
      var id = a.getAttribute("href");
      if (id.length < 2) return;
      var target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      var offset = (header ? header.offsetHeight : 0) + 12;
      var top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top: top, behavior: "smooth" });
    });
  });

  // ---- Reveal on scroll ----
  var revealables = document.querySelectorAll(
    ".feature, .prog, .price, .split .txt, .split img, .section-head, " +
    ".stat, .cred, .step, .rel-card, .gcell, .cert-card, .value-list li, .perk, " +
    ".faq details, .split-lead > *, .callout, .contact-info, .contact-form, .tuition-table, " +
    ".plan-card, .save-tile, .included, .promise, .learn, .team-card, .team-intro, " +
    ".proof, .proof-strip"
  );
  if ("IntersectionObserver" in window && revealables.length) {
    revealables.forEach(function (el) { el.classList.add("reveal"); });
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("in");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealables.forEach(function (el) { io.observe(el); });
  } else {
    revealables.forEach(function (el) { el.classList.add("in"); });
  }

  // ---- Count-up for stat numbers ----
  var counters = document.querySelectorAll("[data-count]");
  if ("IntersectionObserver" in window && counters.length) {
    var cObs = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          var el = entry.target;
          var target = parseFloat(el.getAttribute("data-count"));
          var suffix = el.getAttribute("data-suffix") || "";
          var dur = 1100, start = null;
          var step = function (ts) {
            if (!start) start = ts;
            var p = Math.min((ts - start) / dur, 1);
            var eased = 1 - Math.pow(1 - p, 3);
            el.textContent = Math.round(target * eased) + suffix;
            if (p < 1) requestAnimationFrame(step);
            else el.textContent = target + suffix;
          };
          requestAnimationFrame(step);
          cObs.unobserve(el);
        });
      },
      { threshold: 0.4 }
    );
    counters.forEach(function (el) { cObs.observe(el); });
  }

  // ---- Mobile menu: repeat the header CTA at the bottom of the open menu ----
  // On phones the wide "Schedule a Tour" button is swapped for a round call
  // button, so the tour link needs a home inside the dropdown instead.
  (function () {
    var links = document.getElementById("navLinks");
    var cta = document.querySelector(".nav-cta .btn");
    if (!links || !cta || links.querySelector(".nav-menu-cta")) return;
    var copy = cta.cloneNode(true);
    copy.classList.add("nav-menu-cta");
    links.appendChild(copy);
  })();

  // ---- Back-to-top button ----
  var toTop = document.createElement("button");
  toTop.className = "to-top";
  // Keep it clear of the WhatsApp bubble where that one exists.
  if (document.querySelector(".wa-float")) toTop.classList.add("to-top--stacked");
  toTop.setAttribute("aria-label", "Back to top");
  toTop.innerHTML = '<svg viewBox="0 0 24 24"><path d="M12 5l7 7-1.4 1.4L13 8.8V20h-2V8.8l-4.6 4.6L5 12z"/></svg>';
  document.body.appendChild(toTop);
  toTop.addEventListener("click", function () {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
  window.addEventListener(
    "scroll",
    function () { toTop.classList.toggle("show", window.scrollY > 600); },
    { passive: true }
  );

  // ---- Current year in footers ----
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---- Reviews carousel: gentle auto-scroll, pause on hover, drag to scrub ----
  (function () {
    var viewport = document.getElementById("tstCarousel");
    var track = document.getElementById("tstTrack");
    if (!viewport || !track) return;

    var SPEED = 32;               // px per second (gentle)
    var originals = Array.prototype.slice.call(track.children);
    if (!originals.length) return;

    // Duplicate the set once for a seamless loop
    originals.forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute("aria-hidden", "true");
      track.appendChild(clone);
    });

    var setWidth = 0;
    var pos = 0;
    var paused = false;
    var dragging = false;
    var dragStartX = 0;
    var dragStartPos = 0;
    var moved = 0;
    var lastTs = null;

    function measure() {
      // Distance from first original card to its clone = width of one full set (incl. gap)
      setWidth = track.children[originals.length].offsetLeft - track.children[0].offsetLeft;
    }
    measure();
    window.addEventListener("resize", function () {
      var frac = setWidth ? pos / setWidth : 0;
      measure();
      pos = frac * setWidth;
      render();
    }, { passive: true });

    function wrap() {
      if (!setWidth) return;
      while (pos <= -setWidth) pos += setWidth;
      while (pos > 0) pos -= setWidth;
    }

    function render() {
      wrap();
      track.style.transform = "translateX(" + pos + "px)";
    }

    var reduce = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    function frame(ts) {
      if (lastTs == null) lastTs = ts;
      var dt = (ts - lastTs) / 1000;
      lastTs = ts;
      if (!paused && !dragging && !reduce) {
        pos -= SPEED * dt;
        render();
      }
      requestAnimationFrame(frame);
    }
    render();
    requestAnimationFrame(frame);

    // Pause on hover
    viewport.addEventListener("mouseenter", function () { paused = true; });
    viewport.addEventListener("mouseleave", function () { paused = false; });

    // Drag to scrub (pointer + touch)
    function down(x) {
      dragging = true;
      moved = 0;
      dragStartX = x;
      dragStartPos = pos;
      viewport.classList.add("dragging");
    }
    function move(x) {
      if (!dragging) return;
      var dx = x - dragStartX;
      moved = Math.max(moved, Math.abs(dx));
      pos = dragStartPos + dx;
      render();
    }
    function up() {
      if (!dragging) return;
      dragging = false;
      viewport.classList.remove("dragging");
    }

    if (window.PointerEvent) {
      viewport.addEventListener("pointerdown", function (e) {
        down(e.clientX);
      });
      window.addEventListener("pointermove", function (e) {
        if (dragging) { move(e.clientX); }
      });
      window.addEventListener("pointerup", up);
      window.addEventListener("pointercancel", up);
    } else {
      viewport.addEventListener("touchstart", function (e) {
        down(e.touches[0].clientX);
      }, { passive: true });
      viewport.addEventListener("touchmove", function (e) {
        move(e.touches[0].clientX);
      }, { passive: true });
      viewport.addEventListener("touchend", up);
    }

    // Prevent accidental link navigation right after a drag
    track.addEventListener("click", function (e) {
      if (moved > 6) { e.preventDefault(); }
    }, true);
  })();

  /* ---------- CONTACT FORM: tour date/time + resume upload ---------- */
  (function () {
    var pad = function (n) { return n < 10 ? "0" + n : "" + n; };
    var iso = function (d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); };

    /* Tour date: weekdays only, from today up to 6 months out */
    var dateEl = document.getElementById("ptdate");
    var dateErr = document.getElementById("ptdateErr");
    if (dateEl) {
      var today = new Date();
      var max = new Date();
      max.setMonth(max.getMonth() + 6);
      dateEl.min = iso(today);
      dateEl.max = iso(max);

      dateEl.addEventListener("change", function () {
        if (!dateEl.value) {
          if (dateErr) { dateErr.classList.remove("show"); }
          return;
        }
        var parts = dateEl.value.split("-");
        var picked = new Date(+parts[0], +parts[1] - 1, +parts[2]);
        var day = picked.getDay();
        if (day === 0 || day === 6) {
          if (dateErr) { dateErr.classList.add("show"); }
          dateEl.value = "";
        } else if (dateErr) {
          dateErr.classList.remove("show");
        }
      });
    }

    /* Resume upload */
    var drop = document.getElementById("fileDrop");
    var input = document.getElementById("presume");
    var nameEl = document.getElementById("fileName");
    var fileErr = document.getElementById("fileErr");
    if (drop && input && nameEl) {
      var idle = nameEl.getAttribute("data-idle") || nameEl.textContent;
      var MAX = 5 * 1024 * 1024;

      var reset = function () {
        nameEl.textContent = idle;
        drop.classList.remove("has");
      };

      var handle = function () {
        var f = input.files && input.files[0];
        if (!f) {
          reset();
          if (fileErr) { fileErr.classList.remove("show"); }
          return;
        }
        var ok = /\.(pdf|doc|docx)$/i.test(f.name) && f.size <= MAX;
        if (!ok) {
          input.value = "";
          reset();
          if (fileErr) { fileErr.classList.add("show"); }
          return;
        }
        if (fileErr) { fileErr.classList.remove("show"); }
        nameEl.textContent = f.name;
        drop.classList.add("has");
      };

      input.addEventListener("change", handle);

      ["dragenter", "dragover"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          e.stopPropagation();
          drop.classList.add("drag");
        });
      });
      ["dragleave", "dragend"].forEach(function (ev) {
        drop.addEventListener(ev, function (e) {
          e.preventDefault();
          e.stopPropagation();
          drop.classList.remove("drag");
        });
      });
      drop.addEventListener("drop", function (e) {
        e.preventDefault();
        e.stopPropagation();
        drop.classList.remove("drag");
        if (e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files.length) {
          try {
            input.files = e.dataTransfer.files;
          } catch (err) {
            return;
          }
          handle();
        }
      });
    }
  })();

  /* ---------- GALLERY / CERTIFICATES: view switch + lightbox ---------- */
  (function () {
    var tabs = document.querySelectorAll("[data-view-tab]");
    var panels = document.querySelectorAll("[data-view-panel]");
    if (!tabs.length || !panels.length) return;

    function showPanel(el) {
      // Elements inside a hidden panel never intersect, so nudge them in.
      var pending = el.querySelectorAll(".reveal:not(.in)");
      if (!pending.length) return;
      setTimeout(function () {
        pending.forEach(function (n) { n.classList.add("in"); });
      }, 60);
    }

    function activate(name, push) {
      tabs.forEach(function (t) {
        t.setAttribute("aria-selected", t.getAttribute("data-view-tab") === name ? "true" : "false");
      });
      panels.forEach(function (p) {
        var on = p.getAttribute("data-view-panel") === name;
        if (on) { p.removeAttribute("hidden"); showPanel(p); }
        else { p.setAttribute("hidden", ""); }
      });
      if (push && window.history && window.history.replaceState) {
        window.history.replaceState(null, "", name === defaultView ? window.location.pathname : "#" + name);
      }
    }

    // Whichever tab ships selected in the HTML is the default view.
    var selected = document.querySelector('[data-view-tab][aria-selected="true"]');
    var defaultView = selected ? selected.getAttribute("data-view-tab") : tabs[0].getAttribute("data-view-tab");

    tabs.forEach(function (t) {
      t.addEventListener("click", function () {
        activate(t.getAttribute("data-view-tab"), true);
      });
    });

    // Links elsewhere on the page that jump to a view (e.g. the hero CTA)
    document.querySelectorAll("[data-view-go]").forEach(function (el) {
      el.addEventListener("click", function (e) {
        e.preventDefault();
        activate(el.getAttribute("data-view-go"), true);
        var sw = document.querySelector(".view-switch");
        if (!sw) return;
        var off = (header ? header.offsetHeight : 0) + 18;
        window.scrollTo({ top: sw.getBoundingClientRect().top + window.scrollY - off, behavior: "smooth" });
      });
    });

    // Deep link: /gallery/#certificates or /es/gallery/#certificados
    var hash = (window.location.hash || "").replace("#", "").toLowerCase();
    if (hash) {
      var match = Array.prototype.filter.call(tabs, function (t) {
        return t.getAttribute("data-view-tab") === hash;
      })[0];
      if (match) {
        activate(hash, false);
        // Land on the switch itself, so the deep link honours what was clicked.
        var target = document.querySelector(".view-switch");
        if (target) {
          setTimeout(function () {
            var off = (header ? header.offsetHeight : 0) + 18;
            window.scrollTo({ top: target.getBoundingClientRect().top + window.scrollY - off, behavior: "smooth" });
          }, 120);
        }
      }
    }

    /* ---- Certificate lightbox ---- */
    var cards = document.querySelectorAll("[data-cert]");
    if (!cards.length) return;

    var modal = document.createElement("div");
    modal.className = "cert-modal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML =
      '<div class="cert-modal-inner">' +
        '<button class="cert-close" type="button"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>' +
        '<img alt="">' +
        '<div class="cert-modal-cap"><h3></h3><p></p></div>' +
      '</div>';
    document.body.appendChild(modal);

    var mInner = modal.querySelector(".cert-modal-inner");
    var mImg = modal.querySelector("img");
    var mTitle = modal.querySelector(".cert-modal-cap h3");
    var mMeta = modal.querySelector(".cert-modal-cap p");
    var mClose = modal.querySelector(".cert-close");
    var lastFocus = null;

    function open(card) {
      var img = card.querySelector("img");
      var full = card.getAttribute("data-full") || (img ? img.src : "");
      var webp = full.replace(/\.jpe?g$/i, ".webp");
      mImg.onerror = function () { mImg.onerror = null; mImg.src = full; };
      mImg.src = webp;
      mImg.alt = img ? img.alt : "";
      mTitle.textContent = card.getAttribute("data-title") || "";
      mMeta.textContent = card.getAttribute("data-meta") || "";
      modal.setAttribute("aria-label", mTitle.textContent);
      lastFocus = card;
      modal.classList.add("open");
      modal.setAttribute("aria-hidden", "false");
      document.body.classList.add("cert-lock");
      mClose.focus();
    }

    function close() {
      modal.classList.remove("open");
      modal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("cert-lock");
      if (lastFocus) { lastFocus.focus(); }
    }

    cards.forEach(function (card) {
      card.addEventListener("click", function () { open(card); });
    });
    mClose.addEventListener("click", close);
    modal.addEventListener("click", function (e) {
      if (!mInner.contains(e.target)) { close(); }
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && modal.classList.contains("open")) { close(); }
    });
  })();
})();
