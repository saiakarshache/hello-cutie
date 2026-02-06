// =============================
// DOM
// =============================
const views = {
  ask: document.getElementById("askCard"),
  yes: document.getElementById("yesPanel"),
};

const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");
const restartBtn = document.getElementById("restartBtn");

const fxLayer = document.getElementById("fxLayer");
const yesImg  = document.querySelector(".yes-img");

// =============================
// View system
// =============================
function setActive(viewEl){
  Object.values(views).forEach(v => v?.classList.remove("is-active"));
  viewEl?.classList.add("is-active");
}

// =============================
// FX: big floating heart on NO
// =============================
function spawnFloatHeartAt(x, y){
  if(!fxLayer) return;

  const h = document.createElement("div");
  h.className = "heart-float";
  h.textContent = "❤";
  h.style.left = `${x}px`;
  h.style.top  = `${y}px`;

  const drift = (Math.random() - 0.5) * 18;

  h.animate(
    [
      { transform: "translate3d(-50%, -50%, 0) scale(0.78)", opacity: 0 },
      { transform: "translate3d(-50%, -50%, 0) scale(1.10)", opacity: 1, offset: 0.18 },
      { transform: `translate3d(calc(-50% + ${drift}px), -120px, 0) scale(1.14)`, opacity: 0 }
    ],
    { duration: 760, easing: "cubic-bezier(0.16,1,0.3,1)", fill: "forwards" }
  );

  fxLayer.appendChild(h);
  setTimeout(() => h.remove(), 820);
}

// =============================
// FX: heart shower (capped for mobile)
// =============================
function startHeartShower(durationMs = 2200){
  if(!fxLayer) return;

  const start = performance.now();
  const spawnEveryMs = 110;   // smoother on mobile
  const maxOnScreen = 60;     // cap DOM nodes
  let lastSpawn = 0;

  function spawnOne(){
    if(fxLayer.childElementCount > maxOnScreen) return;

    const d = document.createElement("div");
    d.className = "heart-drop";
    d.textContent = "❤";

    const left = Math.random() * window.innerWidth;
    const size = 16 + Math.random() * 16;
    const fallMs = 2400 + Math.random() * 1600;

    const drift = (Math.random() - 0.5) * 100;
    const rot = (Math.random() * 220 - 110);

    d.style.left = `${left}px`;
    d.style.fontSize = `${size}px`;
    d.style.animationDuration = `${fallMs}ms`;
    d.style.setProperty("--drift", `${drift}px`);
    d.style.setProperty("--rot", `${rot}deg`);

    fxLayer.appendChild(d);
    d.addEventListener("animationend", () => d.remove(), { once: true });
  }

  function loop(t){
    if(t - start >= durationMs) return;

    if(t - lastSpawn >= spawnEveryMs){
      spawnOne();
      if(Math.random() > 0.65) spawnOne();
      lastSpawn = t;
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// =============================
// Balloon mechanic
// =============================
let noClicks = 0;
let yesScale = 1;
let noScale  = 1;

const YES_GROW_STEP  = 0.20;
const NO_SHRINK_STEP = 0.09;
const YES_MAX        = 1.55;
const NO_MIN         = 0.58;

function applyButtonScales(){
  if(yesBtn){
    yesBtn.classList.add("is-growing");
    yesBtn.style.setProperty("--btnScale", String(yesScale));
    setTimeout(() => yesBtn.classList.remove("is-growing"), 540);
  }
  if(noBtn){
    noBtn.style.setProperty("--btnScale", String(noScale));
  }
}

function resetBalloon(){
  noClicks = 0;
  yesScale = 1;
  noScale  = 1;
  yesBtn?.style.setProperty("--btnScale", "1");
  noBtn?.style.setProperty("--btnScale", "1");
}

function popYesBalloon(){
  if(!yesBtn) return;

  startHeartShower(2200);

  yesBtn.animate(
    [
      { transform: `scale(${yesScale})` },
      { transform: `scale(${yesScale + 0.12})` },
      { transform: `scale(0.98)` },
      { transform: `scale(1)` }
    ],
    { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
  );

  setTimeout(() => {
    setActive(views.yes);
    resetBalloon();
  }, 320);
}

function onNo(){
  if(!noBtn) return;

  const r = noBtn.getBoundingClientRect();
  spawnFloatHeartAt(r.left + r.width/2, r.top - 10);

  noBtn.animate(
    [
      { transform: `scale(${noScale}) translate3d(0,0,0)` },
      { transform: `scale(${noScale}) translate3d(-1px,0,0)` },
      { transform: `scale(${noScale}) translate3d(1px,0,0)` },
      { transform: `scale(${noScale}) translate3d(0,0,0)` }
    ],
    { duration: 220, easing: "ease-out" }
  );

  noClicks += 1;
  yesScale = Math.min(YES_MAX, 1 + noClicks * YES_GROW_STEP);
  noScale  = Math.max(NO_MIN,  1 - noClicks * NO_SHRINK_STEP);

  applyButtonScales();

  if(yesScale >= YES_MAX){
    popYesBalloon();
  }
}

// =============================
// Navigation
// =============================
function goAsk(){
  setActive(views.ask);
  resetBalloon();
}

function goYes(){
  startHeartShower(1600);
  setTimeout(() => setActive(views.yes), 120);
}

// =============================
// Preload YES image
// =============================
async function preloadYesImage(){
  if(!yesImg?.src) return;
  const img = new Image();
  img.src = yesImg.src;
  try{ await img.decode(); } catch(e){}
}

// =============================
// Mobile fast-tap binding (fixes laggy taps)
// =============================
function bindFastTap(el, handler){
  if(!el) return;
  el.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    handler(e);
  }, { passive: false });
}

// =============================
// Init
// =============================
(async function init(){
  await preloadYesImage();
  setActive(views.ask);

  bindFastTap(yesBtn, goYes);
  bindFastTap(noBtn, onNo);
  bindFastTap(restartBtn, goAsk);
})();
