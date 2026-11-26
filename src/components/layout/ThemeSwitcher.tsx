"use client";

import { Check, CloudRain, Moon, Sun } from "lucide-react";
import { useEffect, useId, useRef, useState } from "react";
import { setTheme, useTheme, type Theme } from "@/lib/theme";

const OPTIONS: {
  value: Theme;
  label: string;
  hint: string;
  icon: typeof Moon;
}[] = [
  { value: "dark", label: "Dark", hint: "Night workshop", icon: Moon },
  { value: "light", label: "Light", hint: "Drafting paper", icon: Sun },
  { value: "rain", label: "Rain", hint: "Grey and gloomy", icon: CloudRain },
];

/**
 * Header theme selector: a button showing the current theme that opens a
 * short list (disclosure pattern; each option is a toggle button). Esc or a
 * click outside closes it; focus returns to the button.
 */
export function ThemeSwitcher() {
  const theme = useTheme();
  const [open, setOpen] = useState(false);
  const listId = useId();
  const wrapper = useRef<HTMLDivElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const current = OPTIONS.find((o) => o.value === theme) ?? OPTIONS[0]!;
  const CurrentIcon = current.icon;

  useEffect(() => {
    if (!open) return;
    const onPointer = (e: PointerEvent) => {
      if (!wrapper.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      e.preventDefault(); // so an open chat panel doesn't also close
      setOpen(false);
      button.current?.focus();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey, true);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey, true);
    };
  }, [open]);

  const choose = (value: Theme) => {
    setTheme(value);
    setOpen(false);
    button.current?.focus();
  };

  return (
    <div ref={wrapper} className="relative">
      <button
        ref={button}
        type="button"
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((o) => !o)}
        className="inline-flex size-11 items-center justify-center rounded-machined border border-steel-line text-concrete transition-colors hover:border-brass/60 hover:text-brass aria-expanded:border-brass/60 aria-expanded:text-brass"
      >
        <CurrentIcon aria-hidden="true" className="size-5" />
        <span className="sr-only">Theme: {current.label}. Change theme</span>
      </button>
      {open ? (
        <ul
          id={listId}
          aria-label="Theme"
          className="machined-card absolute top-full right-0 z-10 mt-2 w-52 p-1.5"
        >
          {OPTIONS.map(({ value, label, hint, icon: Icon }) => (
            <li key={value}>
              <button
                type="button"
                aria-pressed={value === theme}
                onClick={() => choose(value)}
                className="flex min-h-11 w-full items-center gap-3 rounded-sm px-3 text-left text-bone transition-colors hover:bg-cast aria-pressed:text-brass"
              >
                <Icon aria-hidden="true" className="size-4 shrink-0" />
                <span className="flex flex-col leading-tight">
                  <span className="font-mono text-mono-label tracking-[0.08em] uppercase">
                    {label}
                  </span>
                  <span className="text-[12px] text-concrete">{hint}</span>
                </span>
                {value === theme ? (
                  <Check aria-hidden="true" className="ml-auto size-4" />
                ) : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
