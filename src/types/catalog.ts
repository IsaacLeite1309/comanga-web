export interface OptionValue {
  id: number | string;
  label: string;
  value?: string;
}

export type CatalogVisibility = "Privado" | "Público";

export interface WorkSummary {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverUrl?: string | null;
  visibility: CatalogVisibility;
  type?: OptionValue | null;
  country?: string | null;
  authors?: OptionValue[];
  editionsCount?: number;
}
