import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import NotFound from "./pages/NotFound.tsx";
import { ActivatePage, AuthPage, ResendActivationPage } from "@/features/auth";
import { ChecklistPage, CollectionPage } from "@/features/collection";
import { ProfilePage } from "@/features/profile";
import {
  PublicCatalogPage,
  PublicEditionDetailsPage,
  PublicWorkDetailsPage,
} from "@/features/public-catalog";
import { WishlistPage } from "@/features/wishlist";
import { AdminUsersPage } from "@/features/admin-users";
import {
  AdminOptionsPage,
  EditionDetailsPage,
  EditionFormPage,
  EditMangasPage,
  EditWorkFormPage,
  EditWorkPage,
  NewMangaPage,
  PostCreateActionsPage,
  VolumeDetailsPage,
  VolumeFormPage,
} from "@/features/admin-catalog";
import { PublicNav } from "@/components/PublicNav.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute requiredRole="Administrador">
      {children}
    </ProtectedRoute>
  );
}

const App = () => (
  <>
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background">
          <PublicNav />
          <main className="min-w-0 flex-1 flex flex-col md:ml-20 lg:ml-64 pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Navigate to="/entrar" replace />} />
              <Route path="/entrar" element={<AuthPage />} />
              <Route path="/cadastrar" element={<AuthPage />} />
              <Route path="/activate/:token" element={<ActivatePage />} />
              <Route path="/reenvio" element={<ResendActivationPage />} />
              
              <Route 
                path="/perfil/:username" 
                element={
                  <ProtectedRoute>
                    <ProfilePage />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/pesquisa" element={<PublicCatalogPage />} />
              <Route path="/obras/:slug" element={<PublicWorkDetailsPage />} />
              <Route path="/edicoes/:editionId" element={<PublicEditionDetailsPage />} />
              <Route path="/colecao" element={<CollectionPage />} />
              <Route path="/checklist" element={<ChecklistPage />} />
              <Route path="/desejos" element={<WishlistPage />} />
              <Route
                path="/admin/novo-manga"
                element={
                  <AdminRoute>
                    <NewMangaPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas"
                element={
                  <AdminRoute>
                    <EditMangasPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug"
                element={
                  <AdminRoute>
                    <EditWorkPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/editar"
                element={
                  <AdminRoute>
                    <EditWorkFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/nova"
                element={
                  <AdminRoute>
                    <EditionFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId"
                element={
                  <AdminRoute>
                    <EditionDetailsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/novo"
                element={
                  <AdminRoute>
                    <VolumeFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId"
                element={
                  <AdminRoute>
                    <VolumeDetailsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId/editar"
                element={
                  <AdminRoute>
                    <VolumeFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/editar"
                element={
                  <AdminRoute>
                    <EditionFormPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/pos-cadastro"
                element={
                  <AdminRoute>
                    <PostCreateActionsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/opcoes"
                element={
                  <AdminRoute>
                    <AdminOptionsPage />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <AdminUsersPage />
                  </AdminRoute>
                }
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
