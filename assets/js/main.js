(function () {
  "use strict";

  var REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE_POINTER = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  var body = document.body;
  body.classList.add("is-locked");
  var nav = document.querySelector("[data-nav]");
  var hero = document.querySelector(".hero");
  var scrollTopBtn = document.querySelector("[data-scrolltop]");

  function clamp(v, min, max) {
    return Math.max(min, Math.min(max, v));
  }

  function prefersReduced() {
    return REDUCED;
  }

  var preloader = (function () {
    var el = document.querySelector("[data-preloader]");
    if (!el) return { start: function () {} };
    var done = false;

    function startHero() {
      if (!hero) return;
      hero.classList.add("is-loaded");
      hero.querySelectorAll(".hero .hl").forEach(function (h, i) {
        setTimeout(function () { h.classList.add("is-in"); }, i * 150);
      });
    }

    function unlock() {
      body.classList.remove("is-locked");
    }

    function finish() {
      if (done) return;
      done = true;
      if (REDUCED) {
        el.classList.add("is-leaving", "is-hidden");
        startHero();
        unlock();
        return;
      }
      el.classList.add("is-leaving");
      startHero();
      setTimeout(function () {
        el.classList.add("is-hidden");
        unlock();
      }, 550);
    }

    window.addEventListener("load", function () {
      setTimeout(finish, 800);
    });
    setTimeout(finish, 5200);

    return { start: function () {} };
  })();

  preloader.start();

  var navState = (function () {
    function update() {
      var y = window.scrollY;
      if (nav) nav.classList.toggle("is-scrolled", y > 40);
      if (scrollTopBtn) scrollTopBtn.classList.toggle("is-visible", y > 900);
    }
    window.addEventListener("scroll", update, { passive: true });
    update();
  })();

  var menu = (function () {
    var toggle = document.querySelector("[data-menu-toggle]");
    var panel = document.querySelector("[data-mobile-menu]");
    if (!toggle || !panel) return;

    function open() {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      toggle.setAttribute("aria-expanded", "true");
      toggle.setAttribute("aria-label", "Close menu");
      body.classList.add("is-locked");
      panel.querySelectorAll(".mobile-menu__nav a").forEach(function (a, i) {
        a.style.transitionDelay = i * 0.06 + "s";
      });
    }

    function close() {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-label", "Open menu");
      body.classList.remove("is-locked");
    }

    toggle.addEventListener("click", function () {
      panel.classList.contains("is-open") ? close() : open();
    });

    panel.querySelectorAll("[data-menu-link]").forEach(function (a) {
      a.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) close();
    });

    return { close: close };
  })();

  var revealer = (function () {
    if (prefersReduced()) {
      document.querySelectorAll("[data-reveal]").forEach(function (el) {
        el.classList.add("is-in");
      });
      document.querySelectorAll(".hl").forEach(function (el) {
        el.classList.add("is-in");
      });
      return;
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          var el = entry.target;
          el.classList.add("is-in");
          io.unobserve(el);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -8% 0px" });

    document.querySelectorAll("[data-reveal]").forEach(function (el) {
      io.observe(el);
    });

    document.querySelectorAll(".hl").forEach(function (el) {
      if (el.closest(".hero")) return;
      io.observe(el);
    });
  })();

  var parallax = (function () {
    if (prefersReduced()) return;
    var items = Array.prototype.slice.call(document.querySelectorAll("[data-parallax]")).filter(function (el) {
      return !el.closest(".gallery__item");
    });
    if (!items.length) return;

    var ticking = false;

    function update() {
      ticking = false;
      var vh = window.innerHeight;
      items.forEach(function (el) {
        var rect = el.getBoundingClientRect();
        if (rect.bottom < -vh || rect.top > vh * 2) return;
        var speed = parseFloat(el.getAttribute("data-parallax")) || 0.12;
        var center = rect.top + rect.height / 2 - vh / 2;
        var maxOffset = rect.height * 0.05;
        var offset = clamp(-center * speed, -maxOffset, maxOffset);
        el.style.transform = "translate3d(0," + offset.toFixed(1) + "px,0)";
      });
    }

    window.addEventListener("scroll", function () {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(update);
      }
    }, { passive: true });
    window.addEventListener("resize", update);
    update();
  })();

  var magnetic = (function () {
    if (!FINE_POINTER || prefersReduced()) return;
    var els = document.querySelectorAll("[data-magnetic]");

    els.forEach(function (el) {
      var strength = el.classList.contains("btn--lg") ? 0.35 : 0.25;

      el.addEventListener("pointermove", function (e) {
        var rect = el.getBoundingClientRect();
        var dx = e.clientX - (rect.left + rect.width / 2);
        var dy = e.clientY - (rect.top + rect.height / 2);
        var tx = clamp(dx * strength, -8, 8);
        var ty = clamp(dy * strength, -8, 8);
        el.style.transform = "translate3d(" + tx.toFixed(1) + "px," + ty.toFixed(1) + "px,0)";
      });

      el.addEventListener("pointerleave", function () {
        el.style.transform = "";
      });
    });
  })();

  var counters = (function () {
    var els = document.querySelectorAll("[data-count]");
    if (!els.length) return;

    function run(el) {
      var target = parseInt(el.getAttribute("data-count"), 10) || 0;
      if (prefersReduced()) {
        el.textContent = target;
        return;
      }
      var start = performance.now();
      var dur = 1400;

      function frame(now) {
        var p = clamp((now - start) / dur, 0, 1);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * p);
        if (p < 1) requestAnimationFrame(frame);
        else el.textContent = target;
      }
      requestAnimationFrame(frame);
    }

    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          run(entry.target);
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.4 });

    els.forEach(function (el) { io.observe(el); });
  })();

  var plans = (function () {
    var rows = Array.prototype.slice.call(document.querySelectorAll("[data-plan]"));
    var detail = document.querySelector("[data-plan-detail]");
    if (!rows.length || !detail) return;

    var term = detail.querySelector(".plan-detail__term");
    var amount = detail.querySelector("[data-plan-amount]");
    var per = detail.querySelector("[data-plan-per]");
    var benefits = detail.querySelector("[data-plan-benefits]");
    var joinSelect = document.querySelector("[data-join-plan]");

    var DATA = {
      monthly: { term: "1 Month Membership", amount: "520", per: "per month", option: "1 Month — AED 520", benefits: ["Unlimited gym access — 24/7", "Premium supplement access", "Spa & sauna — coming soon", "Full membership benefits"] },
      quarterly: { term: "3 Month Membership", amount: "1326", per: "≈ AED 442 / month", option: "3 Month — AED 1326", benefits: ["Unlimited gym access — 24/7", "Premium supplement access", "Spa & sauna — coming soon", "Full membership benefits"] },
      half: { term: "6 Month Membership", amount: "2340", per: "≈ AED 390 / month", option: "6 Month — AED 2340", benefits: ["Unlimited gym access — 24/7", "Premium supplement access", "Spa & sauna — coming soon", "Full membership benefits"] },
      annual: { term: "12 Month Membership", amount: "4056", per: "≈ AED 338 / month", option: "12 Month — AED 4056", benefits: ["Unlimited gym access — 24/7", "Premium supplement access", "Spa & sauna — coming soon", "Full membership benefits"] }
    };

    function select(key) {
      var d = DATA[key];
      rows.forEach(function (r) {
        var active = r.getAttribute("data-plan") === key;
        r.classList.toggle("is-active", active);
        r.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (amount) {
        amount.style.opacity = "0";
        setTimeout(function () {
          amount.textContent = d.amount;
          amount.style.opacity = "1";
        }, 220);
      }
      if (term) term.textContent = d.term;
      if (per) per.textContent = d.per;
      if (benefits) {
        benefits.querySelectorAll("li").forEach(function (li, i) {
          li.style.transitionDelay = i * 60 + "ms";
          li.style.opacity = "0";
          li.style.transform = "translateY(8px)";
          setTimeout(function () {
            li.textContent = d.benefits[i];
            li.style.opacity = "1";
            li.style.transform = "none";
          }, 160 + i * 60);
        });
      }
      if (joinSelect) joinSelect.value = d.option;
    }

    rows.forEach(function (row, i) {
      row.addEventListener("click", function () {
        select(row.getAttribute("data-plan"));
      });
      row.addEventListener("keydown", function (e) {
        var idx = rows.indexOf(row);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          rows[(idx + 1) % rows.length].focus();
          rows[(idx + 1) % rows.length].click();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          rows[(idx - 1 + rows.length) % rows.length].focus();
          rows[(idx - 1 + rows.length) % rows.length].click();
        }
      });
    });

    select("monthly");
  })();

  var showcase = (function () {
    var cats = Array.prototype.slice.call(document.querySelectorAll("[data-cat]"));
    var media = document.querySelector("[data-showcase-media]");
    var img = document.querySelector("[data-showcase-img]");
    var tag = document.querySelector("[data-showcase-tag]");
    var desc = document.querySelector("[data-showcase-desc]");
    if (!cats.length || !media || !img) return;

    var DATA = {
      strength: { src: "assets/img/gym-1.jpg", tag: "Strength", title: "Strength", copy: "Dedicated strength zones — racks, platforms and heavy iron for the work that builds you. Serious floor, serious atmosphere." },
      freeweights: { src: "assets/img/gym-2.jpg", tag: "Free Weights", title: "Free Weights", copy: "A full free-weight floor — dumbbells, bars and plates for the movements that build muscle." },
      machines: { src: "assets/img/hero-2.jpg", tag: "Machines", title: "Machines", copy: "High-spec machines across the floor, engineered for focused, controlled work and progressive load." },
      posing: { src: "assets/img/gym-4.jpg", tag: "Posing Room", title: "Posing Room", copy: "A dedicated posing room for bodybuilders — from contest prep to perfecting the presentation." }
    };

    var switching = false;

    function select(key) {
      if (switching) return;
      var d = DATA[key];
      if (!d) return;

      cats.forEach(function (c) {
        var active = c.getAttribute("data-cat") === key;
        c.classList.toggle("is-active", active);
        c.setAttribute("aria-selected", active ? "true" : "false");
      });

      if (img.getAttribute("src") === d.src) return;

      switching = true;
      media.classList.add("is-anim");
      if (tag) tag.style.opacity = "0";

      setTimeout(function () {
        img.setAttribute("src", d.src);
        if (tag) {
          tag.textContent = d.tag;
          tag.style.opacity = "1";
        }
        if (desc) {
          desc.style.opacity = "0";
          setTimeout(function () {
            desc.querySelector("h3").textContent = d.title;
            desc.querySelector("p").textContent = d.copy;
            desc.style.opacity = "1";
          }, 180);
        }
        media.classList.remove("is-anim");
        switching = false;
      }, 620);
    }

    cats.forEach(function (cat) {
      cat.addEventListener("click", function () {
        select(cat.getAttribute("data-cat"));
      });
      cat.addEventListener("keydown", function (e) {
        var idx = cats.indexOf(cat);
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          cats[(idx + 1) % cats.length].focus();
          cats[(idx + 1) % cats.length].click();
        } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          cats[(idx - 1 + cats.length) % cats.length].focus();
          cats[(idx - 1 + cats.length) % cats.length].click();
        }
      });
    });
  })();

  var reviews = (function () {
    var viewport = document.querySelector("[data-reviews-viewport]");
    var track = document.querySelector("[data-reviews-track]");
    var cards = track ? Array.prototype.slice.call(track.children) : [];
    var prev = document.querySelector("[data-reviews-prev]");
    var next = document.querySelector("[data-reviews-next]");
    var progress = document.querySelector("[data-reviews-progress]");
    if (!track || !cards.length) return;

    var index = 0;
    var card = 0;
    var dragging = false;
    var startX = 0;
    var deltaX = 0;
    var hasMoved = false;

    function measure() {
      card = cards[0].getBoundingClientRect().width + 24;
      index = clamp(index, 0, cards.length - 1);
      apply();
    }

    function apply() {
      track.style.transform = "translate3d(" + -index * card + "px,0,0)";
      if (progress) {
        progress.style.width = (100 / cards.length) + "%";
        progress.style.transform = "translateX(" + index * 100 + "%)";
      }
      cards.forEach(function (c, i) {
        c.setAttribute("aria-hidden", i === index ? "false" : "true");
      });
    }

    function go(i) {
      index = clamp(i, 0, cards.length - 1);
      apply();
    }

    if (next) next.addEventListener("click", function () { go(index + 1); });
    if (prev) prev.addEventListener("click", function () { go(index - 1); });

    track.addEventListener("keydown", function (e) {
      if (e.key === "ArrowRight") go(index + 1);
      if (e.key === "ArrowLeft") go(index - 1);
    });

    if (FINE_POINTER || true) {
      track.addEventListener("pointerdown", function (e) {
        dragging = true;
        hasMoved = false;
        startX = e.clientX;
        track.classList.add("is-dragging");
        track.setPointerCapture(e.pointerId);
      });

      track.addEventListener("pointermove", function (e) {
        if (!dragging) return;
        deltaX = e.clientX - startX;
        if (Math.abs(deltaX) > 6) hasMoved = true;
        track.style.transition = "none";
        track.style.transform = "translate3d(" + (-index * card + deltaX) + "px,0,0)";
      });

      var endDrag = function () {
        if (!dragging) return;
        dragging = false;
        track.classList.remove("is-dragging");
        track.style.transition = "";
        if (hasMoved) {
          if (deltaX < -40) go(index + 1);
          else if (deltaX > 40) go(index - 1);
          else apply();
        }
        deltaX = 0;
      };

      track.addEventListener("pointerup", endDrag);
      track.addEventListener("pointercancel", endDrag);
    }

    cards.forEach(function (c) {
      c.addEventListener("click", function (e) {
        if (hasMoved) {
          e.preventDefault();
          e.stopPropagation();
        }
      });
    });

    window.addEventListener("resize", measure);
    measure();
  })();

  var clock = (function () {
    var el = document.querySelector("[data-clock]");
    if (!el) return;

    function tick() {
      var t = new Date().toLocaleTimeString("en-GB", {
        timeZone: "Asia/Dubai",
        hour12: false,
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit"
      });
      el.textContent = t;
    }
    tick();
    setInterval(tick, 1000);
  })();

  var cursor = (function () {
    if (!FINE_POINTER || prefersReduced()) return;
    var el = document.querySelector("[data-cursor]");
    if (!el) return;

    var dot = el.querySelector(".cursor__dot");
    var ring = el.querySelector(".cursor__ring");
    var label = el.querySelector(".cursor__label");
    var x = -100, y = -100, rx = -100, ry = -100;
    var shown = false;

    function loop() {
      rx += (x - rx) * 0.16;
      ry += (y - ry) * 0.16;
      if (dot) dot.style.transform = "translate(" + x + "px," + y + "px) translate(-50%,-50%)";
      if (ring) ring.style.transform = "translate(" + rx + "px," + ry + "px) translate(-50%,-50%)";
      requestAnimationFrame(loop);
    }
    requestAnimationFrame(loop);

    document.addEventListener("pointermove", function (e) {
      x = e.clientX;
      y = e.clientY;
      if (!shown) {
        shown = true;
        el.style.opacity = "1";
      }

      var t = e.target.closest("a, button, select, input, [data-reviews-track]");
      var cls = "";
      var txt = "";

      if (e.target.closest("[data-reviews-track]")) {
        cls = "is-view";
        txt = "Drag";
      } else if (e.target.closest(".gallery__item, .showcase__media")) {
        cls = "is-view";
        txt = "View";
      } else if (t) {
        cls = "is-go";
        txt = "Go";
      }

      el.className = "cursor" + (cls ? " " + cls : "");
      if (label) label.textContent = txt;
    });

    document.addEventListener("pointerdown", function () {
      el.classList.add("is-down");
    });
    document.addEventListener("pointerup", function () {
      el.classList.remove("is-down");
    });
  })();

  var join = (function () {
    var panel = document.querySelector("[data-join]");
    if (!panel) return;

    var backdrops = panel.querySelectorAll("[data-join-close]");
    var form = panel.querySelector("[data-join-form]");
    var closeBtns = Array.prototype.slice.call(backdrops);

    function open() {
      panel.classList.add("is-open");
      panel.setAttribute("aria-hidden", "false");
      body.classList.add("is-locked");
      var first = panel.querySelector("input, select");
      if (first) setTimeout(function () { first.focus(); }, 350);
    }

    function close() {
      panel.classList.remove("is-open");
      panel.setAttribute("aria-hidden", "true");
      body.classList.remove("is-locked");
    }

    document.addEventListener("click", function (e) {
      var a = e.target.closest('a[href="#join"]');
      if (a) {
        e.preventDefault();
        open();
      }
    });

    closeBtns.forEach(function (btn) {
      btn.addEventListener("click", close);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && panel.classList.contains("is-open")) close();
    });

    if (form) {
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        var f = new FormData(form);
        var name = f.get("name") || "";
        var contact = f.get("contact") || "";
        var plan = f.get("plan") || "";
        var subject = "Membership enquiry — Muscle Hut Dubai";
        var body = "Name: " + name + "\nContact: " + contact + "\nInterested in: " + plan + "\n\nSent from musclehut.ae";
        var mail = "mailto:support@muscle-hut.com?subject=" + encodeURIComponent(subject) + "&body=" + encodeURIComponent(body);
        window.location.href = mail;
        close();
      });
    }

    return { open: open, close: close };
  })();
})();
