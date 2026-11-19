import { LegalLinks } from "./LegalLinks";

export function LegalFooter() {
  return (
    <footer className="page-gutter py-3">
      <nav aria-label="Documentos legais" className="flex justify-center">
        <LegalLinks />
      </nav>
    </footer>
  );
}
