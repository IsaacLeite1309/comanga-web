export interface PersonalPagination { page: number; limit: number; total: number; totalPages: number }
export interface PersonalWork { id: number; slug: string; title: string; coverUrl?: string | null }
export interface PersonalEdition { id: number; chronologicalNumber: number; brazilPublicationStatus: string; brazilianPublisher: { id: number; label: string } }
export interface PersonalVolume { id: number; number: number; singleVolume: boolean; coverUrl?: string | null }
export interface PersonalVolumeState { volumeId: number; owned: boolean; read: boolean | null; wished: boolean }
export interface CollectionProgress { owned: number; total: number; read: number; wished: number }
export interface CollectionEditionResponse {
  edition: PersonalEdition & { work: PersonalWork };
  volumes: (PersonalVolume & { owned: boolean; read: boolean | null; wished: boolean })[];
  progress: CollectionProgress;
  pagination: PersonalPagination;
}
export interface CollectedEdition {
  edition: PersonalEdition;
  volumes: (PersonalVolume & { read: boolean })[];
  progress: CollectionProgress;
  volumesPagination: PersonalPagination;
}
export interface CollectionResponse {
  works: { work: PersonalWork; editions: CollectedEdition[] }[];
  totals: { editions: number; volumes: number };
  pagination: PersonalPagination;
}
export interface WishlistVolume extends PersonalVolume { affiliateLink: string | null; work: PersonalWork; edition: PersonalEdition }
export interface WishlistResponse { volumes: WishlistVolume[]; totals: { volumes: number }; pagination: PersonalPagination }
export interface CollectionDelta { addVolumeIds: number[]; removeVolumeIds: number[] }
