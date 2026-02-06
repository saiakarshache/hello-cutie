// =============================
// DOM
// =============================
const views = {
  ask: document.getElementById("askCard"),
  yes: document.getElementById("yesPanel"),
};

const yesBtn = document.getElementById("yesBtn");
const noBtn  = document.getElementById("noBtn");

const fxLayer = document.getElementById("fxLayer");
const yesImg  = document.querySelector(".yes-img");

// =============================
// View system (prevents flash)
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
// FX: heart shower (smooth + capped DOM)
// =============================
function startHeartShower(durationMs = 2500){
  if(!fxLayer) return;

  const start = performance.now();
  const spawnEveryMs = 70;
  const maxOnScreen = 120;
  let lastSpawn = 0;

  function spawnOne(){
    if(fxLayer.childElementCount > maxOnScreen) return;

    const d = document.createElement("div");
    d.className = "heart-drop";
    d.textContent = "❤";

    const left = Math.random() * window.innerWidth;
    const size = 16 + Math.random() * 18;
    const fallMs = 2600 + Math.random() * 1900;

    // drift + rotation as CSS vars
    const drift = (Math.random() - 0.5) * 120;
    const rot = (Math.random() * 240 - 120);

    d.style.left = `${left}px`;
    d.style.fontSize = `${size}px`;
    d.style.animationDuration = `${fallMs}ms`;
    d.style.setProperty("--drift", `${drift}px`);
    d.style.setProperty("--rot", `${rot}deg`);

    fxLayer.appendChild(d);
    d.addEventListener("animationend", () => d.remove(), { once: true });
  }

  function loop(t){
    const elapsed = t - start;
    if(elapsed >= durationMs) return;

    if(t - lastSpawn >= spawnEveryMs){
      spawnOne();
      if(Math.random() > 0.6) spawnOne();
      lastSpawn = t;
    }
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}

// =============================
// Balloon mechanic (5 clicks)
// =============================
let noClicks = 0;
let yesScale = 1;
let noScale  = 1;

// 5 clicks to pop:
// yesScale = 1 + (5 * 0.12) = 1.60
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

  // hearts immediately
  startHeartShower(5000);

  // pop anim
  yesBtn.animate(
    [
      { transform: `scale(${yesScale})` },
      { transform: `scale(${yesScale + 0.12})` },
      { transform: `scale(0.98)` },
      { transform: `scale(1)` }
    ],
    { duration: 700, easing: "cubic-bezier(0.16, 1, 0.3, 1)" }
  );

  // switch view cleanly
  setTimeout(() => {
    setActive(views.yes);
    resetBalloon();
  }, 360);
}

function onNo(){
  if(!noBtn) return;

  const r = noBtn.getBoundingClientRect();

  // big heart above NO
  spawnFloatHeartAt(r.left + r.width/2, r.top - 10);

  // wobble
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
// Preload YES image (fixes “lag”)
// =============================
async function preloadYesImage(){
  if(!yesImg?.src) return;
  const img = new Image();
  img.src = yesImg.src;
  try{ await img.decode(); } catch(e){}
}

// =============================
// Navigation
// =============================
function goAsk(){
  setActive(views.ask);
  resetBalloon();
}
function goYes(){
  startHeartShower(2200);
  setTimeout(() => setActive(views.yes), 120);
}

// =============================
// Events
// =============================
yesBtn?.addEventListener("click", goYes);

noBtn?.addEventListener("click", (e) => {
  e.preventDefault();
  onNo();
});

noBtn?.addEventListener("touchstart", (e) => {
  e.preventDefault();
  onNo();
}, { passive:false });

document.getElementById("restartBtn")?.addEventListener("click", goAsk);

// =============================
// Init
// =============================
(async function init(){
  await preloadYesImage();
  setActive(views.ask);
})();
