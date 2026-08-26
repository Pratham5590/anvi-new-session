/* =========================================================
   ANVI // NEW SESSION — shared behaviour
   Runs on every page. Nothing here changes navigation logic —
   each page's buttons are plain <a href="pageN.html"> links.
   ========================================================= */

(function () {
  "use strict";

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------------- sound engine (Web Audio API, no files) ---------------- */
  var SOUND_KEY = "anvi-sound-on";
  var soundOn = localStorage.getItem(SOUND_KEY) === "true";
  var ctx = null;

  function getCtx() {
    if (!ctx) {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (AC) ctx = new AC();
    }
    return ctx;
  }

  function tone(freq, duration, type, gainPeak) {
    if (!soundOn) return;
    var c = getCtx();
    if (!c) return;
    if (c.state === "suspended") c.resume();
    var osc = c.createOscillator();
    var gain = c.createGain();
    osc.type = type || "sine";
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(0, c.currentTime);
    gain.gain.linearRampToValueAtTime(gainPeak || 0.06, c.currentTime + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + duration);
    osc.connect(gain).connect(c.destination);
    osc.start();
    osc.stop(c.currentTime + duration);
  }

  var Sound = {
    click: function () { tone(520, 0.09, "sine", 0.05); },
    error: function () { tone(140, 0.28, "sawtooth", 0.05); setTimeout(function () { tone(110, 0.22, "sawtooth", 0.04); }, 90); },
    confirm: function () { tone(660, 0.1, "sine", 0.05); setTimeout(function () { tone(880, 0.14, "sine", 0.05); }, 90); },
    success: function () { [523, 659, 784, 1046].forEach(function (f, i) { setTimeout(function () { tone(f, 0.22, "sine", 0.05); }, i * 90); }); }
  };
  window.AnviSound = Sound;

  /* ---------------- chrome: sound toggle ---------------- */
  var soundToggle = document.getElementById("soundToggle");
  function paintSoundToggle() {
    if (!soundToggle) return;
    soundToggle.textContent = soundOn ? "🔊 SOUND: ON" : "🔈 SOUND: OFF";
    soundToggle.setAttribute("aria-pressed", String(soundOn));
    soundToggle.setAttribute("aria-label", "Toggle interface sound, currently " + (soundOn ? "on" : "off"));
  }
  paintSoundToggle();
  if (soundToggle) {
    soundToggle.addEventListener("click", function () {
      soundOn = !soundOn;
      localStorage.setItem(SOUND_KEY, String(soundOn));
      paintSoundToggle();
      if (soundOn) Sound.confirm();
    });
  }

  /* ---------------- chrome: session tag easter egg ---------------- */
  var sessionBtn = document.getElementById("sessionBtn");
  var toastEl = document.getElementById("toast");
  var sessionMessages = [
    "SESSION INTEGRITY: QUESTIONABLE",
    "RE-INDEXING ANVI RECORDS...",
    "THIS BUTTON DOES NOTHING. YOU'RE STILL HERE THOUGH.",
    "ACCESS LOG UPDATED. WE SAW THAT.",
    "SESSION ID IS NOT ACTUALLY RANDOM. IT'S JUST 47.",
    "DEPARTMENT OF WHY HAS BEEN NOTIFIED."
  ];
  function toast(msg) {
    if (!toastEl) return;
    toastEl.textContent = msg;
    toastEl.classList.add("show");
    clearTimeout(toastEl._t);
    toastEl._t = setTimeout(function () { toastEl.classList.remove("show"); }, 2200);
  }
  if (sessionBtn) {
    sessionBtn.addEventListener("click", function () {
      Sound.click();
      toast(sessionMessages[Math.floor(Math.random() * sessionMessages.length)]);
    });
  }

  /* ---------------- chrome: logo secret (click 5x fast) ---------------- */
  var logoBtn = document.getElementById("logoBtn");
  var logoClicks = 0;
  var logoTimer = null;
  if (logoBtn) {
    logoBtn.addEventListener("click", function () {
      Sound.click();
      logoClicks++;
      clearTimeout(logoTimer);
      logoTimer = setTimeout(function () { logoClicks = 0; }, 1400);
      if (logoClicks === 5) {
        logoClicks = 0;
        toast("UNAUTHORIZED ACCESS DETECTED. REDIRECTING...");
        Sound.error();
        setTimeout(function () { window.location.href = "page12.html"; }, 650);
      }
    });
  }

  /* ---------------- back button ---------------- */
  var backBtn = document.getElementById("backBtn");
  if (backBtn) {
    backBtn.addEventListener("click", function () {
      Sound.click();
      if (window.history.length > 1) window.history.back();
      else window.location.href = "index.html";
    });
  }

  /* ---------------- click sound + micro-delay on every choice button ---------------- */
  document.querySelectorAll(".choice").forEach(function (btn) {
    btn.addEventListener("click", function (e) {
      var href = btn.getAttribute("href");

      /* the finale button gets confetti + glitch before it loops back to index */
      if (btn.id === "finalBtn") {
        e.preventDefault();
        Sound.success();
        var finalPage = document.querySelector(".page");
        if (finalPage && !reduceMotion) finalPage.classList.add("glitching");
        if (window.AnviConfetti) window.AnviConfetti(2400);
        setTimeout(function () { window.location.href = href; }, reduceMotion ? 200 : 1900);
        return;
      }

      if (!href || btn.hasAttribute("data-no-delay")) { Sound.click(); return; }
      e.preventDefault();
      Sound.click();
      var pageEl = document.querySelector(".page");
      if (pageEl && !reduceMotion) {
        pageEl.style.transition = "opacity 160ms ease";
        pageEl.style.opacity = "0";
      }
      setTimeout(function () { window.location.href = href; }, reduceMotion ? 0 : 150);
    });
  });

  /* ---------------- entrance fx: error flash / glitch / shake ---------------- */
  var body = document.body;
  var fxOverlay = document.getElementById("fxOverlay");
  var pageEl = document.querySelector(".page");
  var fx = body.getAttribute("data-fx");

  function runErrorFlash(lines, cb) {
    if (!fxOverlay) return cb && cb();
    if (reduceMotion) { cb && cb(); return; }
    Sound.error();
    fxOverlay.innerHTML = lines.map(function (l) { return '<div class="fx-line">' + l + '</div>'; }).join("");
    fxOverlay.classList.add("show");
    setTimeout(function () {
      fxOverlay.classList.remove("show");
      cb && cb();
    }, 550);
  }

  if (fx === "error" && pageEl) {
    pageEl.style.visibility = "hidden";
    runErrorFlash(["0x4E41564C — RECALCULATING NARRATIVE", "PLEASE STAND BY"], function () {
      pageEl.style.visibility = "visible";
      pageEl.classList.add("glitching");
    });
  } else if (fx === "glitch" && pageEl) {
    pageEl.classList.add("glitching");
  } else if (fx === "shake" && pageEl) {
    setTimeout(function () { pageEl.classList.add("shake"); }, 350);
  }

  /* ---------------- confetti (used on the final page) ---------------- */
  window.AnviConfetti = function (durationMs) {
    var canvas = document.getElementById("confettiCanvas");
    if (!canvas || reduceMotion) return;
    var ctx2d = canvas.getContext("2d");
    var W = (canvas.width = window.innerWidth);
    var H = (canvas.height = window.innerHeight);
    canvas.classList.add("show");
    var colors = ["#c9a24b", "#eecb82", "#ece5d6", "#8a6bb0", "#6f9a72", "#e07a6f"];
    var pieces = [];
    for (var i = 0; i < 140; i++) {
      pieces.push({
        x: Math.random() * W,
        y: -20 - Math.random() * H,
        w: 5 + Math.random() * 6,
        h: 8 + Math.random() * 10,
        rot: Math.random() * 360,
        vRot: -6 + Math.random() * 12,
        vy: 2 + Math.random() * 3,
        vx: -1.5 + Math.random() * 3,
        color: colors[Math.floor(Math.random() * colors.length)]
      });
    }
    var start = Date.now();
    var dur = durationMs || 2600;
    function frame() {
      ctx2d.clearRect(0, 0, W, H);
      var elapsed = Date.now() - start;
      pieces.forEach(function (p) {
        p.x += p.vx;
        p.y += p.vy;
        p.rot += p.vRot;
        ctx2d.save();
        ctx2d.translate(p.x, p.y);
        ctx2d.rotate((p.rot * Math.PI) / 180);
        ctx2d.fillStyle = p.color;
        ctx2d.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx2d.restore();
      });
      if (elapsed < dur) {
        requestAnimationFrame(frame);
      } else {
        canvas.classList.remove("show");
        ctx2d.clearRect(0, 0, W, H);
      }
    }
    requestAnimationFrame(frame);
  };

  /* ---------------- keyboard: press "v" three times for a void shortcut ---------------- */
  var vPresses = 0, vTimer = null;
  document.addEventListener("keydown", function (e) {
    if (e.key.toLowerCase() !== "v") return;
    vPresses++;
    clearTimeout(vTimer);
    vTimer = setTimeout(function () { vPresses = 0; }, 1200);
    if (vPresses === 3) {
      vPresses = 0;
      toast("KEY SEQUENCE RECOGNIZED. OPENING RESTRICTED NODE.");
      setTimeout(function () { window.location.href = "page12.html"; }, 500);
    }
  });
})();
