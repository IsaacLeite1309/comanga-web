import { Link, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { LoadingState } from "@/components/shared/AsyncState";
import { DetailError } from "../components/AdminCatalogDetailShared";
import {
  DeleteEditionDialog,
  WorkEditionsSection,
} from "../components/EditWorkDetailsView";
import { adminCatalogPath } from "../domain/catalogPaths";
import { useCatalogDetailView } from "../hooks/useCatalogDetailView";
import { useWorkDetails } from "../hooks/useWorkDetails";

const EditWork = () => {
  const { workSlug = "" } = useParams();
  const details = useWorkDetails(workSlug);
  const view = useCatalogDetailView(details.editions.length);

  if (details.loading) {
    return <LoadingState message="Carregando dados da Obra..." fullPage />;
  }

  if (details.error || !details.work) {
    return <DetailError message={details.error || "Obra não encontrada."} />;
  }

  const editionActions = {
    deletingId: details.deletingId,
    updatingVisibilityId: details.updatingVisibilityId,
    onDelete: details.setDeletingEdition,
    onToggleVisibility: details.toggleEditionVisibility,
  };

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <Link
          to={adminCatalogPath}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-input px-4 text-sm font-bold text-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>
        <WorkEditionsSection
          work={details.work}
          workSlug={workSlug}
          editions={details.editions}
          viewMode={view.viewMode}
          showGridView={view.showGridView}
          actions={editionActions}
          onViewModeChange={view.setViewMode}
        />
        {details.deletingEdition && (
          <DeleteEditionDialog
            edition={details.deletingEdition}
            deleting={Boolean(details.deletingId)}
            onCancel={() => details.setDeletingEdition(null)}
            onConfirm={details.confirmDeleteEdition}
          />
        )}
      </div>
    </div>
  );
};

export default EditWork;
