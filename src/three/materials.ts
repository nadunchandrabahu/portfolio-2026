import * as THREE from "three";

/**
 * Materials (CLAUDE.md 7.3). Steel and brass are full-metal PBR lit by a
 * procedural Lightformer environment. Steel gets a faint temper-tint edge:
 * a fresnel term that runs straw → bronze → purple → blue at grazing angles.
 */

const TEMPER_GLSL = /* glsl */ `
  float temperFacing = clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
  float temperFres = pow(1.0 - temperFacing, 3.0);
  vec3 temperWarm = mix(vec3(0.847, 0.710, 0.416), vec3(0.659, 0.404, 0.227), smoothstep(0.0, 0.45, temperFres));
  vec3 temperCool = mix(vec3(0.420, 0.290, 0.549), vec3(0.239, 0.416, 0.620), smoothstep(0.55, 1.0, temperFres));
  vec3 temperTint = mix(temperWarm, temperCool, smoothstep(0.35, 0.75, temperFres));
  totalEmissiveRadiance += temperTint * temperFres * uTemperStrength;
`;

/**
 * Add the temper edge. The strength is a per-material uniform and the cache
 * key is constant, so every tempered material shares one shader program
 * (each extra program costs a blocking compile on first render).
 */
function withTemper<T extends THREE.MeshStandardMaterial>(material: T, strength: number): T {
  material.onBeforeCompile = (shader) => {
    shader.uniforms.uTemperStrength = { value: strength };
    shader.fragmentShader = shader.fragmentShader
      .replace("void main() {", "uniform float uTemperStrength;\nvoid main() {")
      .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>\n${TEMPER_GLSL}`);
  };
  material.customProgramCacheKey = () => "temper";
  return material;
}

/** Diamond knurl pattern drawn to a canvas, used as a bump map on the carrier rim. */
function knurlTexture(): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d");
  if (ctx) {
    ctx.fillStyle = "#808080";
    ctx.fillRect(0, 0, size, size);
    ctx.strokeStyle = "#000000";
    ctx.lineWidth = 6;
    ctx.beginPath();
    for (let i = -size; i <= size * 2; i += size / 2) {
      ctx.moveTo(i, 0);
      ctx.lineTo(i + size, size);
      ctx.moveTo(i, size);
      ctx.lineTo(i + size, 0);
    }
    ctx.stroke();
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(90, 1);
  return texture;
}

export const COLORS = {
  brass: "#b8913f",
  brassAccent: "#c9a35e",
  brassDeep: "#8c6b32",
  steel: "#a3a9b0",
  darkSteel: "#4a4f56",
  graphiteSteel: "#2f3338",
  engraving: "#9a9fa5",
} as const;

export type GearboxMaterials = ReturnType<typeof createMaterials>;

export function createMaterials() {
  const knurl = knurlTexture();

  // Standard (not Physical) PBR throughout: the extra Physical features cost
  // shader compile time and per-pixel work for no visible gain at this size.
  const materials = {
    steel: withTemper(
      new THREE.MeshStandardMaterial({
        color: COLORS.steel,
        // Just under 1 so flat faces also take soft diffuse light from the
        // environment and shade with their angle, instead of reading flat.
        metalness: 0.85,
        roughness: 0.38,
      }),
      0.18,
    ),
    ring: withTemper(
      new THREE.MeshStandardMaterial({ color: COLORS.darkSteel, metalness: 0.9, roughness: 0.4 }),
      0.1,
    ),
    brass: new THREE.MeshStandardMaterial({ color: COLORS.brass, metalness: 0.9, roughness: 0.3 }),
    carrier: new THREE.MeshStandardMaterial({
      color: COLORS.graphiteSteel,
      metalness: 0.9,
      roughness: 0.45,
    }),
    knurl: new THREE.MeshStandardMaterial({
      color: COLORS.graphiteSteel,
      metalness: 0.9,
      roughness: 0.5,
      bumpMap: knurl,
      bumpScale: 2,
    }),
    // Same program as the carrier (only uniforms differ).
    bolt: new THREE.MeshStandardMaterial({ color: "#6b7178", metalness: 1, roughness: 0.4 }),
    /** Brass inlay on the highlighted ring segment. Emissive so it reads as lit. */
    inlay: new THREE.MeshStandardMaterial({
      color: COLORS.brassAccent,
      metalness: 0.6,
      roughness: 0.35,
      emissive: COLORS.brassAccent,
      emissiveIntensity: 0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      polygonOffset: true,
      polygonOffsetFactor: -2,
    }),
    indexLine: new THREE.MeshBasicMaterial({ color: COLORS.engraving, transparent: true, opacity: 0.7 }),
    /** Blueprint mode: brass line drawing. */
    line: new THREE.LineBasicMaterial({ color: COLORS.brassAccent, transparent: true, opacity: 0 }),
    centreLine: new THREE.LineDashedMaterial({
      color: "#9a9fa5",
      dashSize: 2.2,
      gapSize: 0.7,
      transparent: true,
      opacity: 0,
    }),
  };

  const dispose = () => {
    knurl.dispose();
    Object.values(materials).forEach((m) => m.dispose());
  };

  return { ...materials, dispose };
}
