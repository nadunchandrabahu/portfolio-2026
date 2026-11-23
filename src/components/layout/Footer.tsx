import { ArrowUp } from "lucide-react";
import { site } from "@/content/site";
import { KnurlDivider } from "./KnurlDivider";

export function Footer() {
  return (
    <footer className="bg-cast [contain-intrinsic-size:auto_480px] [content-visibility:auto]">
      <KnurlDivider />
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <figure className="mx-auto max-w-2xl text-center">
          <blockquote className="font-sans-italic text-body text-bone italic">
            <p>&ldquo;{site.verse.text}&rdquo;</p>
          </blockquote>
          <figcaption className="eyebrow mt-4 text-brass">{site.verse.reference}</figcaption>
        </figure>

        <div className="mt-16 flex flex-col gap-4 border-t border-steel-line pt-6 font-mono text-mono-label text-concrete sm:flex-row sm:items-center sm:justify-between">
          <p>
            {site.footer.copyright} · {site.footer.credit}
          </p>
          <a
            href="#hero"
            className="link-underline inline-flex min-h-11 w-fit items-center gap-1.5 hover:text-bone"
          >
            Back to top
            <ArrowUp aria-hidden="true" className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
