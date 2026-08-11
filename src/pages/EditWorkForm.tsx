import { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { api } from "@/services/api";
import NewManga from "./NewManga";

interface LocationState {
  workId?: number;
}

interface WorksResponse {
  works: Array<{
    id: number;
    title: string;
  }>;
}

function normalizeTitle(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function buildWorkPath(workSlug = "") {
  return `/admin/editar-mangas/obras/${encodeURIComponent(decodeURIComponent(workSlug))}`;
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
    const workTitle = decodeURIComponent(workSlug);

    async function resolveWorkIdByTitle() {
      setLoading(true);
      setError("");

      try {
        const response = await api.get<WorksResponse>("/admin/works", {
          params: {
            term: workTitle,
            order: "ASC",
            page: 1,
            limit: 50,
          },
        });
        const matchedWork = response.data.works.find((work) => (
          normalizeTitle(work.title) === normalizeTitle(workTitle)
        ));

        if (!isMounted) return;

        if (!matchedWork) {
          setError("Obra não encontrada.");
          return;
        }

        setResolvedWorkId(String(matchedWork.id));
      } catch {
        if (isMounted) setError("Erro ao carregar Obra para edição.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    resolveWorkIdByTitle();

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

  return <NewManga mode="edit" workId={resolvedWorkId} returnPath={buildWorkPath(workSlug || "")} />;
};

export default EditWorkForm;
