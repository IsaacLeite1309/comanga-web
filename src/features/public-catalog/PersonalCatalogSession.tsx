import { Fragment, useEffect, useState, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/features/auth";
import { subscribePersonalLibraryUpdates } from "@/features/personal-library";
import { LoadingState } from "@/components/shared/AsyncState";

export function PersonalCatalogSession({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const { pathname } = useLocation();
  const [revision, setRevision] = useState(0);
  useEffect(() => subscribePersonalLibraryUpdates(() => setRevision(value => value + 1)), []);
  if (loading) return <LoadingState message="Carregando catálogo..." fullPage />;
  const identity = JSON.stringify([user?.id ?? null, user?.conteudo_adulto, user?.active_profile, pathname, revision]);
  return <Fragment key={identity}>{children}</Fragment>;
}
