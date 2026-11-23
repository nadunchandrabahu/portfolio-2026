import { Section } from "@/components/layout/Section";
import { SectionHeader } from "@/components/layout/SectionHeader";
import { ChipList } from "@/components/ui/Chip";
import { ExternalTextLink } from "@/components/ui/ExternalTextLink";
import { Todo } from "@/components/ui/Todo";
import { certificates, certificatesIntro, type Certificate } from "@/content/certificates";
import { degrees } from "@/content/education";
import { pending, SHOW_PLACEHOLDERS } from "@/content/types";
import { formatMonth } from "@/lib/format";

// Placeholder slots show in development only (CLAUDE.md 5.7).
const visibleCertificates = certificates.filter(
  (c) => c.status === "published" || SHOW_PLACEHOLDERS,
);

function CertificateCard({ cert }: { cert: Certificate }) {
  if (cert.status === "placeholder") {
    return (
      <div className="flex min-h-44 flex-col justify-between rounded-machined border border-dashed border-steel-line p-5">
        <p className="eyebrow text-concrete">Slot reserved</p>
        <p className="font-mono text-small text-concrete">{cert.title}</p>
        <Todo item={pending("Certificate title, issuer, date and link")} />
      </div>
    );
  }
  return (
    <article className="machined-card lift-card flex h-full flex-col gap-3 p-5">
      {cert.image ? (
        // Issuer logos are tiny local files; next/image adds nothing here.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={cert.image} alt="" width={32} height={32} className="size-8 object-contain" />
      ) : null}
      <h4 className="font-display font-semibold text-bone">{cert.title}</h4>
      <p className="text-small text-concrete">
        {cert.issuer}
        <span className="font-mono"> · {formatMonth(cert.date)}</span>
        {cert.hours ? <span className="font-mono"> · {cert.hours} h</span> : null}
      </p>
      <ChipList items={cert.skills} label="Skills" />
      <div className="mt-auto">
        {cert.credentialUrl ? (
          <ExternalTextLink href={cert.credentialUrl}>Verify</ExternalTextLink>
        ) : (
          <Todo item={pending("Credential URL and 2–3 skill chips")} />
        )}
      </div>
    </article>
  );
}

export function Education() {
  return (
    <Section id="education" className="bg-cast">
      <SectionHeader id="education" />

      <ul className="grid gap-6 lg:grid-cols-2">
        {degrees.map((degree, i) => (
          <li
            key={degree.title}
            data-reveal
            style={{ "--reveal-index": i } as React.CSSProperties}
            className="machined-card flex flex-col gap-3 p-6 sm:p-8"
          >
            <p className="font-mono text-mono-label tracking-[0.08em] text-concrete">{degree.years}</p>
            <h3 className="font-display text-h3 font-semibold text-bone">{degree.title}</h3>
            <p className="text-concrete">
              {degree.institution}, {degree.place}
            </p>
            {degree.note ? <p className="font-mono text-small text-brass">{degree.note}</p> : null}
            {degree.credentialUrl ? (
              <div className="mt-auto pt-2">
                <ExternalTextLink href={degree.credentialUrl}>View certificate</ExternalTextLink>
              </div>
            ) : null}
            {degree.pendingNotes?.map((item) => (
              <Todo key={item.note} item={item} />
            ))}
          </li>
        ))}
      </ul>

      {visibleCertificates.length > 0 ? (
        <div className="mt-16">
          <p className="eyebrow text-concrete" data-reveal>
            {certificatesIntro.eyebrow}
          </p>
          <h3 className="mt-2 font-display text-h3 font-semibold text-bone" data-reveal>
            {certificatesIntro.title}
          </h3>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {visibleCertificates.map((cert, i) => (
              <li
                key={cert.id}
                data-reveal
                style={{ "--reveal-index": i % 4 } as React.CSSProperties}
              >
                <CertificateCard cert={cert} />
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </Section>
  );
}
