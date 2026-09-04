// WebGPU hero backdrop. Loaded lazily by script.js, and only when the browser
// has WebGPU and the visitor has not asked for reduced motion — the page is
// designed to look finished without it.
import { clock, effect, frameLoop, init, surface } from "vgpu";
import source from "./hero.generated.wgsl";

const INK = { dark: [0.93, 0.93, 0.93], light: [0.04, 0.04, 0.04] };

// Field units per CSS pixel of hero height. Feature size is derived from the
// canvas height rather than fixed, so a contour is the same size on the tall
// homepage hero and on the short band above an interior page's title —
// sampling those two shapes with one constant gives the short one a thin
// horizontal slice of the field, which reads as a smudge rather than contours.
const UNITS_PER_PX = 0.0024;

// The two framings. The homepage hero is tall enough to hold the pattern
// beside the headline; the interior heroes are a short band, so the field sits
// further right and feathers on all four sides.
const VARIANTS = {
  hero: {
    intensity: { dark: 0.75, light: 0.5 },
    fadeX: [0.2, 0.8],
    fadeY: [0.1, 0.85],
    fadeTop: 0.18,
  },
  page: {
    intensity: { dark: 0.62, light: 0.42 },
    fadeX: [0.12, 0.55],
    fadeY: [0.6, 0.95],
    fadeTop: 0.12,
  },
  // The contact hero carries a mailto link and a copy button below the lede,
  // so it runs well past the ~200px other interior heroes stop at. fadeY is a
  // fraction of this taller canvas, tuned so the field still fades out over
  // the same absolute band (roughly where the lede ends) instead of bleeding
  // down through the email address and button.
  contact: {
    intensity: { dark: 0.62, light: 0.42 },
    fadeX: [0.12, 0.55],
    fadeY: [0.28, 0.46],
    fadeTop: 0.12,
  },
};

function theme() {
  return document.documentElement.dataset.theme === "light" ? "light" : "dark";
}

export async function startHeroCanvas(canvas) {
  const variant = VARIANTS[canvas.dataset.heroCanvas] ?? VARIANTS.hero;
  const gpu = await init();
  const view = surface(gpu, canvas, { dpr: [1, 2] });

  const backdrop = effect(gpu, source, {
    set: {
      params: {
        resolution: view.size,
        time: 0,
        intensity: variant.intensity[theme()],
        tint: INK[theme()],
        scale: (view.size[1] / view.dpr) * UNITS_PER_PX,
        fadeX: variant.fadeX,
        fadeY: variant.fadeY,
        fadeTop: variant.fadeTop,
      },
    },
  });

  // Size-class uniforms belong in the resize handler, not the frame loop.
  view.onResize(({ width, height, dpr }) => {
    backdrop.set({
      params: { resolution: [width, height], scale: (height / dpr) * UNITS_PER_PX },
    });
  });

  // The theme toggle flips a data attribute; follow it without re-creating anything.
  const themeObserver = new MutationObserver(() => {
    const mode = theme();
    backdrop.set({ params: { tint: INK[mode], intensity: variant.intensity[mode] } });
  });
  themeObserver.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });

  // Pre-warm the pipeline so the first frame doesn't hitch. A surface's own
  // texture is only reachable inside a frame, so compile the signature instead.
  await backdrop.compile({ colors: [navigator.gpu.getPreferredCanvasFormat()] });

  // A frame-loop handle only stops; restarting means starting a new loop.
  // Time is accumulated from clamped deltas rather than read from the clock, so
  // pausing while offscreen resumes where it left off instead of jumping.
  const time = clock(gpu);
  let elapsed = 0;
  let loop = null;

  const start = () => {
    if (loop) return;
    loop = frameLoop(
      gpu,
      (frame) => {
        elapsed += Math.min(time.deltaTime, 0.1);
        backdrop.set({ params: { time: elapsed } });
        frame.pass(view, backdrop);
      },
      { fps: 30 }, // it is a backdrop; 30 is plenty and halves the GPU cost
    );
  };

  const stop = () => {
    loop?.stop();
    loop = null;
  };

  // Draw only while the hero is both on screen and in a visible tab.
  let visible = true;
  let onscreen = true;
  const sync = () => (visible && onscreen ? start() : stop());

  new IntersectionObserver(([entry]) => {
    onscreen = entry.isIntersecting;
    sync();
  }).observe(canvas);

  document.addEventListener("visibilitychange", () => {
    visible = document.visibilityState === "visible";
    sync();
  });

  start();
  canvas.dataset.ready = "true";
}
