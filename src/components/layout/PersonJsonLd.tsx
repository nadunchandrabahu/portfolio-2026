import { about } from "@/content/about";
import { degrees } from "@/content/education";
import { site } from "@/content/site";
import { SITE_URL } from "@/lib/siteUrl";

/**
 * schema.org Person (CLAUDE.md 11). Static data from the content files,
 * serialised with "<" escaped so nothing in it can close the script tag.
 */
export function PersonJsonLd() {
  const alumniOf = [...new Set(degrees.map((d) => d.institution))].map((name) => ({
    "@type": "CollegeOrUniversity",
    name,
  }));
  const person = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: site.name,
    jobTitle: site.role,
    url: `${SITE_URL}/`,
    image: `${SITE_URL}${about.portrait.src}`,
    address: { "@type": "PostalAddress", addressLocality: "Sydney", addressCountry: "AU" },
    sameAs: [site.links.linkedin, site.links.github],
    alumniOf,
  };
  return (
    <script
      type="application/ld+json"
      // Static, escaped JSON (Next.js docs pattern). Not user content.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(person).replace(/</g, "\u003c") }}
    />
  );
}
