import Image from "next/image";
import { GithubIcon, LinkedinIcon } from "@/components/ui/BrandIcons";
import { EmailIconLink } from "@/components/ui/Email";
import { site } from "@/content/site";
import { DataPlate } from "./DataPlate";

const iconLink =
  "inline-flex size-11 items-center justify-center rounded-machined border border-steel-line text-concrete transition-colors hover:border-brass/60 hover:text-brass";

export function Hero() {
  return (
    <section
      id="hero"
      aria-labelledby="hero-title"
      data-section="hero"
      className="relative overflow-x-clip"
    >
      <div aria-hidden="true" className="blueprint-grid absolute inset-0" />

      <div className="relative mx-auto grid max-w-7xl items-center gap-y-8 px-4 pt-6 pb-20 sm:px-6 lg:grid-cols-[55fr_45fr] lg:gap-x-8 lg:px-8 lg:pt-16 lg:pb-28">
        {/* Gearbox: above the text on mobile, right column (bleeding off) on desktop. */}
        <div className="relative -mx-4 h-[60vw] max-h-[30rem] sm:mx-0 lg:order-2 lg:-mr-[max(2rem,calc((100vw-80rem)/2+2rem))] lg:h-auto lg:max-h-none">
          {/* Raster render of <GearboxPoster />: far cheaper to paint on phones than the
              live SVG. The 3D canvas replaces it in phase 3 and falls back to it. */}
          <Image
            src="/gearbox-poster.webp"
            alt=""
            width={1200}
            height={1200}
            preload
            fetchPriority="high"
            sizes="(min-width: 1024px) 45vw, 60vw"
            className="mx-auto h-full w-auto lg:h-auto lg:w-full lg:drop-shadow-[0_30px_40px_rgb(0_0_0/0.55)] lg:[transform:perspective(1600px)_rotateY(-22deg)_rotateX(12deg)]"
          />
        </div>

        <div className="@container lg:order-1">
          <p className="eyebrow text-concrete">{site.eyebrow}</p>
          <h1
            id="hero-title"
            className="display-expanded mt-5 text-[length:min(var(--text-display-xl),9.6cqi)] font-extrabold uppercase text-bone"
          >
            <span className="block">Nadun</span>
            <span className="block">Chandrabahu</span>
          </h1>
          <p className="mt-5 font-display text-h3 font-medium text-bone">{site.role}</p>
          <p className="mt-4 max-w-[52ch] text-concrete">{site.heroLine}</p>
          <p className="mt-3 max-w-[52ch] text-concrete">{site.heroSubLine}</p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <a
              href="#work"
              className="inline-flex min-h-11 items-center rounded-sm bg-brass px-6 font-mono text-small font-medium uppercase tracking-[0.08em] text-graphite transition hover:brightness-110 active:bg-brass-deep"
            >
              View work
            </a>
            {/* "Ask the workshop" joins here in phase 5 (site.features.chat). */}
            <div className="flex items-center gap-2 sm:ml-2">
              <a href={site.links.github} rel="noopener noreferrer" target="_blank" className={iconLink}>
                <GithubIcon />
                <span className="sr-only">GitHub (opens in a new tab)</span>
              </a>
              <a href={site.links.linkedin} rel="noopener noreferrer" target="_blank" className={iconLink}>
                <LinkedinIcon />
                <span className="sr-only">LinkedIn (opens in a new tab)</span>
              </a>
              <EmailIconLink className={iconLink} />
            </div>
          </div>

          <div className="mt-10">
            <DataPlate />
            <p className="mt-4 font-mono text-small text-concrete">{site.availability}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
