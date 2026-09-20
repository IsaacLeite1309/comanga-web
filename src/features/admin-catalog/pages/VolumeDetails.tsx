import { useMemo } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { DetailError, DetailLoading } from "../components/AdminCatalogDetailShared";
import { VolumeSummary } from "../components/VolumeDetailsView";
import { editionAdminPath } from "../domain/catalogPaths";
import type { AdminCatalogLocationState } from "../domain/adminCatalogDetails";
import { useVolumeDetails } from "../hooks/useVolumeDetails";

const VolumeDetails = () => {
  const { workSlug = "", editionId = "", volumeId = "" } = useParams();
  const location = useLocation();
  const state = location.state as AdminCatalogLocationState | null;
  const currentVolumeId = volumeId || state?.volumeId;
  const editionPath = useMemo(
    () => editionAdminPath(workSlug, editionId),
    [workSlug, editionId],
  );
  const details = useVolumeDetails(currentVolumeId);

  if (details.loading) {
    return <DetailLoading message="Carregando dados do Volume..." />;
  }

  if (details.error || !details.volume) {
    return <DetailError message={details.error || "Volume não encontrado."} />;
  }

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link
          to={editionPath}
          state={{
            workId: state?.workId,
            editionId: state?.editionId || details.volume.editionId,
          }}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>
        <VolumeSummary
          volume={details.volume}
          workSlug={workSlug}
          editionId={editionId}
          workId={state?.workId}
          stateEditionId={state?.editionId}
        />
      </div>
    </div>
  );
};

export default VolumeDetails;
