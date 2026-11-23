/** True if the browser can create a WebGL context (WebGL2 preferred). */
export function hasWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    const gl = canvas.getContext("webgl2") ?? canvas.getContext("webgl");
    const ok = gl !== null;
    // Release the probe context straight away.
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return ok;
  } catch {
    return false;
  }
}

/** Phones, small screens and weak CPUs get the lighter render path (CLAUDE.md 7.5). */
export function isLowPower(): boolean {
  const small = window.matchMedia("(max-width: 767px)").matches;
  const fewCores = (navigator.hardwareConcurrency ?? 8) <= 4;
  const coarse = window.matchMedia("(pointer: coarse)").matches;
  return small || fewCores || coarse;
}
