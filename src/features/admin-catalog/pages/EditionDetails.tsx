import { useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { DetailError, DetailLoading } from "../components/AdminCatalogDetailShared";
import {
  DeleteVolumeDialog,
  EditionVolumesSection,
} from "../components/EditionDetailsView";
import { workAdminPath } from "../domain/catalogPaths";
import { AdminCatalogBreadcrumb } from "../components/AdminCatalogBreadcrumb";
import type { AdminCatalogLocationState } from "../domain/adminCatalogDetails";
import { useCatalogDetailView } from "../hooks/useCatalogDetailView";
import { useEditionDetails } from "../hooks/useEditionDetails";

const EditionDetails = () => {
  const { workSlug = "", editionId = "" } = useParams();
  const location = useLocation();
  const state = location.state as AdminCatalogLocationState | null;
  const currentEditionId = editionId || state?.editionId;
  const workPath = useMemo(() => workAdminPath(workSlug), [workSlug]);
  const details = useEditionDetails(currentEditionId);
  const view = useCatalogDetailView(details.volumes.length);

  if (details.loading) {
    return <DetailLoading message="Carregando dados da Edição..." />;
  }

  if (details.error || !details.edition) {
    return <DetailError message={details.error || "Edição não encontrada."} />;
  }

  const workId = state?.workId || details.edition.workId;
  const navigation = {
    workSlug,
    workId,
    editionId: details.edition.id,
  };
  const volumeActions = {
    deletingId: details.deletingId,
    onDelete: details.setDeletingVolume,
  };
  const volumesCollection = {
    volumes: details.volumes,
    loading: details.volumesLoading,
    error: details.volumesError,
    pagination: details.volumesPagination,
  };

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminCatalogBreadcrumb backTo={workPath} backState={{ workId }} items={[{ label: "Gerenciar mangás", to: "/admin/gerenciar-mangas" }, { label: `Edições de ${decodeURIComponent(workSlug)}`, to: workPath, state: { workId } }, { label: `Volumes da ${details.edition.chronologicalNumber}ª edição` }]} />
        <EditionVolumesSection
          edition={details.edition}
          collection={volumesCollection}
          navigation={navigation}
          viewMode={view.viewMode}
          showGridView={view.showGridView}
          actions={volumeActions}
          onViewModeChange={view.setViewMode}
        />
        {details.deletingVolume && (
          <DeleteVolumeDialog
            volume={details.deletingVolume}
            deleting={Boolean(details.deletingId)}
            onCancel={() => details.setDeletingVolume(null)}
            onConfirm={details.confirmDeleteVolume}
          />
        )}
      </div>
    </div>
  );
};

export default EditionDetails;
