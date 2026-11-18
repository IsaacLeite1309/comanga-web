import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { termsOfUse, privacyPolicy } from "./legalDocuments";
import { PRIVACY_POLICY_PATH, TERMS_OF_USE_PATH } from "./legalPaths";

const documents = [
  { path: TERMS_OF_USE_PATH, title: termsOfUse.title },
  { path: PRIVACY_POLICY_PATH, title: privacyPolicy.title },
];

export function LegalLinks() {
  return (
    <ul className="flex flex-wrap items-center gap-x-4">
      {documents.map(({ path, title }) => (
        <li key={path}>
          <Link
            to={path}
            target="_blank"
            rel="noopener"
            aria-label={`${title} (abre em nova aba)`}
            className="inline-flex min-h-11 items-center gap-1 rounded-sm text-sm text-foreground underline underline-offset-4 hover:text-primary focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            {title}
            <ExternalLink className="h-3 w-3 shrink-0" aria-hidden="true" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
