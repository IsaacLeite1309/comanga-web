import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/services/api";
import { getApiError } from "@/lib/apiError";
import { workAdminPath } from "@/lib/catalogPaths";
import NewManga from "./NewManga";

interface LocationState {
  workId?: number;
}

interface WorkResponse {
  work: {
    id: number;
    slug: string;
    title: string;
  };
}

const EditWorkForm = () => {
  const { workSlug } = useParams();
  const location = useLocation();
  const state = location.state as LocationState | null;
  const [resolvedWorkId, setResolvedWorkId] = useState(state?.workId ? String(state.workId) : "");
  const [loading, setLoading] = useState(!state?.workId);
  const [error, setError] = useState("");

  useEffect(() => {
    if (state?.workId || !workSlug) return;

    let isMounted = true;
    async function resolveWorkIdBySlug() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<WorkResponse>(`/admin/works/slug/${encodeURIComponent(workSlug)}`);

        if (!isMounted) return;

        setResolvedWorkId(String(response.data.work.id));
      } catch (requestError) {
        if (isMounted) setError(getApiError(requestError, "Erro ao carregar Obra para edição."));
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    resolveWorkIdBySlug();

    return () => {
      isMounted = false;
    };
  }, [state?.workId, workSlug]);

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-muted-foreground">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
        Carregando dados da Obra...
      </div>
    );
  }

  if (error || !resolvedWorkId) {
    return (
      <div className="flex flex-1 items-center justify-center px-4 py-10 text-sm font-semibold text-red-300">
        {error || "Obra não encontrada."}
      </div>
    );
  }

  return <NewManga mode="edit" workId={resolvedWorkId} returnPath={workAdminPath(workSlug || "")} />;
};

export default EditWorkForm;
