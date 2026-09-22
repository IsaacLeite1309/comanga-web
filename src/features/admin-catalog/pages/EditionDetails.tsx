import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DetailError, DetailLoading } from "../components/AdminCatalogDetailShared";
import {
  DeleteVolumeDialog,
  EditionVolumesSection,
} from "../components/EditionDetailsView";
import { workAdminPath } from "../domain/catalogPaths";
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

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link
          to={workPath}
          state={{ workId }}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>
        <EditionVolumesSection
          edition={details.edition}
          volumes={details.volumes}
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
