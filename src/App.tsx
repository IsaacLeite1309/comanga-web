import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import NotFound from "./app/NotFound.tsx";
import { ActivatePage, AuthPage, AuthProvider, ResendActivationPage, PasswordRecoveryPage, useAuth } from "@/features/auth";
import { CollectionPage } from "@/features/collection";
import { ProfilePage } from "@/features/profile";
import {
  PublicCatalogPage,
  PublicChecklistPage,
  PublicAuthorWorksPage,
  PublicEditionDetailsPage,
  EditionVolumeSelectionPage,
  PublicVolumeDetailsPage,
  PublicWorkDetailsPage,
} from "@/features/public-catalog";
import { WishlistPage } from "@/features/wishlist";
import { PublicNav } from "@/app/PublicNav";
import { CollectorMenuPrefetch } from "@/app/CollectorMenuPrefetch";
import { DetailScrollReset } from "@/app/DetailScrollReset";
import { ProtectedRoute } from "@/app/ProtectedRoute";
import { PersonalRoute } from "@/app/PersonalRoute";
import { GuestRoute } from "@/app/GuestRoute";
import { PublicProfileRoute } from "@/app/PublicProfileRoute";

const AdminUsersPage = lazy(() => import("@/features/admin-users").then((module) => ({ default: module.AdminUsersPage })));
const AdminOptionsPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.AdminOptionsPage })));
const EditionDetailsPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.EditionDetailsPage })));
const EditionFormPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.EditionFormPage })));
const EditMangasPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.EditMangasPage })));
const EditWorkFormPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.EditWorkFormPage })));
const EditWorkPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.EditWorkPage })));
const NewMangaPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.NewMangaPage })));
const PostCreateActionsPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.PostCreateActionsPage })));
const VolumeFormPage = lazy(() => import("@/features/admin-catalog").then((module) => ({ default: module.VolumeFormPage })));

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="Administrador">
      <Suspense fallback={<p role="status" className="p-6">Carregando...</p>}>
        {children}
      </Suspense>
    </ProtectedRoute>
  );
}

function GuestPage({ children }: { children: React.ReactNode }) {
  return <GuestRoute>{children}</GuestRoute>;
}

function PublicPage({ children }: { children: React.ReactNode }) {
  return <PublicProfileRoute>{children}</PublicProfileRoute>;
}

function LibraryPage({ kind }: { kind: "collection" | "wishlist" }) {
  const { isAuthenticated } = useAuth();
  return (
    <PublicPage>
      {kind === "collection"
        ? <CollectionPage isAuthenticated={isAuthenticated} />
        : <WishlistPage isAuthenticated={isAuthenticated} />}
    </PublicPage>
  );
}

function adminPage(page: React.ReactNode) {
  return <AdminRoute>{page}</AdminRoute>;
}

const App = () => (
  <>
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <CollectorMenuPrefetch />
        <DetailScrollReset />
        <div className="flex min-h-screen w-full max-w-full overflow-x-clip bg-background">
          <PublicNav />
          <main className="min-w-0 flex-1 flex flex-col md:ml-20 lg:ml-56 pb-16 md:pb-0">
            <Routes>
              <Route path="/recuperar-senha" element={<GuestPage><PasswordRecoveryPage /></GuestPage>} />
              <Route path="/redefinir-senha/:token?" element={<GuestPage><PasswordRecoveryPage reset /></GuestPage>} />
              <Route path="/" element={<Navigate to="/colecao" replace />} />
              <Route path="/entrar" element={<GuestPage><AuthPage /></GuestPage>} />
              <Route path="/cadastrar" element={<GuestPage><AuthPage /></GuestPage>} />
              <Route path="/activate/:token" element={<ActivatePage />} />
              <Route path="/reenvio" element={<GuestPage><ResendActivationPage /></GuestPage>} />
              
              <Route 
                path="/perfil/:username" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              <Route
                path="/perfil"
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                }
              />
              
              <Route path="/pesquisa" element={<PublicPage><PublicCatalogPage /></PublicPage>} />
              <Route path="/lancamentos" element={<PublicPage><PublicChecklistPage /></PublicPage>} />
              <Route path="/autor/:authorSlug" element={<PublicPage><PublicAuthorWorksPage /></PublicPage>} />
              <Route path="/obra/:slug" element={<PublicPage><PublicWorkDetailsPage /></PublicPage>} />
              <Route path="/obra/:slug/edicao/:editionNumber" element={<PublicPage><PublicEditionDetailsPage /></PublicPage>} />
              <Route path="/obra/:slug/edicao/:editionNumber/selecionar/colecao" element={<PublicPage><PersonalRoute><EditionVolumeSelectionPage mode="colecao" /></PersonalRoute></PublicPage>} />
              <Route path="/obra/:slug/edicao/:editionNumber/selecionar/desejos" element={<PublicPage><PersonalRoute><EditionVolumeSelectionPage mode="desejos" /></PersonalRoute></PublicPage>} />
              <Route path="/obra/:slug/edicao/:editionNumber/selecionar/lidos" element={<PublicPage><PersonalRoute><EditionVolumeSelectionPage mode="lidos" /></PersonalRoute></PublicPage>} />
              <Route path="/obra/:slug/edicao/:editionNumber/volume/:volumeNumber" element={<PublicPage><PublicVolumeDetailsPage /></PublicPage>} />
              <Route path="/colecao" element={<LibraryPage kind="collection" />} />
              <Route path="/colecao/:slug/edicao/:editionNumber" element={<PersonalRoute><PublicEditionDetailsPage /></PersonalRoute>} />
              <Route path="/colecao/:slug/edicao/:editionNumber/selecionar/colecao" element={<PersonalRoute><EditionVolumeSelectionPage mode="colecao" /></PersonalRoute>} />
              <Route path="/colecao/:slug/edicao/:editionNumber/selecionar/desejos" element={<PersonalRoute><EditionVolumeSelectionPage mode="desejos" /></PersonalRoute>} />
              <Route path="/colecao/:slug/edicao/:editionNumber/selecionar/lidos" element={<PersonalRoute><EditionVolumeSelectionPage mode="lidos" /></PersonalRoute>} />
              <Route path="/desejos" element={<LibraryPage kind="wishlist" />} />
              <Route
                path="/admin/novo-manga"
                element={adminPage(<NewMangaPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas"
                element={adminPage(<EditMangasPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/edicoes"
                element={adminPage(<EditWorkPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/editar"
                element={adminPage(<EditWorkFormPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/nova"
                element={adminPage(<EditionFormPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes"
                element={adminPage(<EditionDetailsPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes/novo"
                element={adminPage(<VolumeFormPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId"
                element={adminPage(<VolumeFormPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId/editar"
                element={adminPage(<VolumeFormPage />)}
              />
              <Route
                path="/admin/gerenciar-mangas/obras/:workSlug/edicoes/:editionId/editar"
                element={adminPage(<EditionFormPage />)}
              />
              <Route
                path="/admin/pos-cadastro"
                element={adminPage(<PostCreateActionsPage />)}
              />
              <Route
                path="/admin/opcoes"
                element={adminPage(<AdminOptionsPage />)}
              />
              <Route
                path="/admin/users"
                element={adminPage(<AdminUsersPage />)}
              />
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </BrowserRouter>
  </>
);

export default App;
