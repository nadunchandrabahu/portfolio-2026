"use client";

import { Bloom, EffectComposer, SMAA, ToneMapping } from "@react-three/postprocessing";
import { ToneMappingMode } from "postprocessing";

/**
 * Postprocessing (desktop only, CLAUDE.md 3): SMAA and a very light bloom that
 * only catches the lit brass inlay. Its own chunk, so phones never load it.
 * The composer disables renderer tone mapping, so ACES is applied here to
 * match the non-composited look.
 */
export default function Effects() {
  return (
    <EffectComposer multisampling={0}>
      <Bloom luminanceThreshold={0.9} luminanceSmoothing={0.15} intensity={0.35} mipmapBlur />
      <ToneMapping mode={ToneMappingMode.ACES_FILMIC} />
      <SMAA />
    </EffectComposer>
  );
}
