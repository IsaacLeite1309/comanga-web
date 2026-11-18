import { useEffect, useRef } from "react";
import { privacyPolicy, termsOfUse } from "@/components/legal/legalDocuments";

const documents = { privacy: privacyPolicy, terms: termsOfUse };
const dateFormatter = new Intl.DateTimeFormat("pt-BR", { dateStyle: "long", timeZone: "UTC" });

export function LegalDocumentPage({ kind }: { kind: keyof typeof documents }) {
  const { title, version, date, sections } = documents[kind];
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = `${title} | CoMangá`;
    headingRef.current?.focus();
    return () => { document.title = previousTitle; };
  }, [title]);

  return (
    <div className="page-gutter py-6 sm:py-10">
      <article aria-labelledby="legal-document-title" className="mx-auto max-w-prose break-words">
        <header className="mb-8 space-y-3">
          <h1 id="legal-document-title" ref={headingRef} tabIndex={-1} className="text-3xl font-bold text-foreground sm:text-4xl">{title}</h1>
          <p className="text-sm text-foreground">Versão {version} · <time dateTime={date}>{dateFormatter.format(new Date(date))}</time></p>
        </header>
        <div className="space-y-7 leading-relaxed text-foreground">
          {sections.map((section) => (
            <section key={section.title} className="space-y-3">
              <h2 className="text-xl font-semibold">{section.title}</h2>
              {section.paragraphs.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.contactEmail && (
                <a
                  href={`mailto:${section.contactEmail}`}
                  className="inline-flex min-h-11 max-w-full items-center rounded-sm underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  {section.contactEmail}
                </a>
              )}
            </section>
          ))}
        </div>
      </article>
    </div>
  );
}
