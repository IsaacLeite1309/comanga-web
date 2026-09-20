export interface OptionValue {
  id: number | string;
  label: string;
  value?: string;
  depends_on?: Array<{
    id: number;
    label: string;
    category: {
      slug: string;
      name: string;
    };
  }>;
}

export interface WorkFormOptions {
  authors: OptionValue[];
  workTypes: OptionValue[];
  genres: OptionValue[];
  magazines: OptionValue[];
  originalPublishers: OptionValue[];
}

export interface WorkFormOptionsResponse {
  options: WorkFormOptions;
}

export interface WorkDetail {
  id: number;
  slug: string;
  title: string;
  originalTitle?: string | null;
  coverAssetId?: string | null;
  coverUrl?: string | null;
  country?: string | null;
  type?: OptionValue | null;
  adultContent: boolean;
  originalPublicationStartYear?: number | null;
  originalPublicationEndYear?: number | null;
  originalVolumeCount?: number | null;
  directRelease: boolean;
  originalPublishers: OptionValue[];
  originalPublicationStatus?: string | null;
  authors: Array<{
    author: OptionValue | null;
    roles: string[];
  }>;
  genres: OptionValue[];
  demographics: string[];
  serializationMagazines: OptionValue[];
}

export interface WorkDetailResponse {
  work: WorkDetail;
}

export interface AuthorField {
  authorId: string;
  roles: string[];
}

export type NewMangaStep = "identification" | "authors" | "publication";

export type NewMangaDraft = {
  title: string;
  originalTitle: string;
  originalPublicationStartYear: string;
  originalPublicationEndYear: string;
  originalVolumeCount: string;
  coverAssetId: string;
  coverUrl: string;
  coverPending: boolean;
  typeId: string;
  country: string;
  originalPublisherIds: number[];
  originalPublicationStatus: string;
  adultContent: boolean;
  directRelease: boolean;
  authors: AuthorField[];
  genreIds: number[];
  demographies: string[];
  magazineIds: number[];
};

export type NewMangaMode = "create" | "edit";
