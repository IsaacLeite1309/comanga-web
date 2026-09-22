import { useParams } from "react-router-dom";
import { LoadingState } from "@/components/shared/AsyncState";
import { DetailError } from "../components/AdminCatalogDetailShared";
import {
  DeleteEditionDialog,
  WorkEditionsSection,
} from "../components/EditWorkDetailsView";
import { adminCatalogPath } from "../domain/catalogPaths";
import { AdminCatalogBreadcrumb } from "../components/AdminCatalogBreadcrumb";
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
  const editionsCollection = {
    editions: details.editions,
    loading: details.editionsLoading,
    error: details.editionsError,
    pagination: details.editionsPagination,
  };

  return (
    <div className="flex-1 min-w-0 px-3 py-6 sm:px-4 sm:py-8">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <AdminCatalogBreadcrumb backTo={adminCatalogPath} items={[{ label: "Gerenciar mangás", to: adminCatalogPath }, { label: `Edições de ${details.work.title}` }]} />
        <WorkEditionsSection
          work={details.work}
          workSlug={workSlug}
          collection={editionsCollection}
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
