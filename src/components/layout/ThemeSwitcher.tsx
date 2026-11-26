"use client";

import { CloudRain, Lightbulb } from "lucide-react";
import { setEffects, useEffects } from "@/lib/theme";

const toggle =
  "inline-flex size-11 items-center justify-center rounded-machined border transition-colors aria-pressed:border-brass aria-pressed:bg-brass/15 aria-pressed:text-brass";
const off = "border-steel-line text-concrete hover:border-brass/60 hover:text-brass";

/**
 * Two header switches over the dark workshop: lights (a bright LED
 * overhead) and rain. Each is an on/off toggle button; both can be on.
 */
export function ThemeSwitcher() {
  const { light, rain } = useEffects();
  return (
    <div role="group" aria-label="Lighting and weather" className="flex items-center gap-2">
      <button
        type="button"
        aria-pressed={light}
        title={light ? "Lights on" : "Lights off"}
        onClick={() => setEffects({ light: !light })}
        className={`${toggle} ${off}`}
      >
        <Lightbulb aria-hidden="true" className="size-5" />
        <span className="sr-only">Lights</span>
      </button>
      <button
        type="button"
        aria-pressed={rain}
        title={rain ? "Rain on" : "Rain off"}
        onClick={() => setEffects({ rain: !rain })}
        className={`${toggle} ${off}`}
      >
        <CloudRain aria-hidden="true" className="size-5" />
        <span className="sr-only">Rain</span>
      </button>
    </div>
  );
}
