import { BrowserRouter, Route, Routes, Navigate } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import Index from "./pages/Index.tsx";
import Activate from "./pages/Activate.tsx";
import ResendActivation from "./pages/ResendActivation.tsx";
import UserProfile from "./pages/UserProfile.tsx";
import Colecao from "./pages/Colecao.tsx";
import Pesquisa from "./pages/Pesquisa.tsx";
import Checklist from "./pages/Checklist.tsx";
import Desejos from "./pages/Desejos.tsx";
import NotFound from "./pages/NotFound.tsx";
import UserManagement from "./pages/UserManagement.tsx";
import AdminOptions from "./pages/AdminOptions.tsx";
import NewManga from "./pages/NewManga.tsx";
import EditMangas from "./pages/EditMangas.tsx";
import EditWork from "./pages/EditWork.tsx";
import EditWorkForm from "./pages/EditWorkForm.tsx";
import EditionForm from "./pages/EditionForm.tsx";
import EditionDetails from "./pages/EditionDetails.tsx";
import VolumeDetails from "./pages/VolumeDetails.tsx";
import VolumeForm from "./pages/VolumeForm.tsx";
import PostCreateActions from "./pages/PostCreateActions.tsx";
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
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen w-full max-w-full overflow-x-hidden bg-background">
          <PublicNav />
          <main className="min-w-0 flex-1 flex flex-col md:ml-20 lg:ml-64 pb-16 md:pb-0">
            <Routes>
              <Route path="/" element={<Navigate to="/entrar" replace />} />
              <Route path="/entrar" element={<Index />} />
              <Route path="/cadastrar" element={<Index />} />
              <Route path="/activate/:token" element={<Activate />} />
              <Route path="/reenvio" element={<ResendActivation />} />
              
              <Route 
                path="/perfil/:username" 
                element={
                  <ProtectedRoute>
                    <UserProfile />
                  </ProtectedRoute>
                } 
              />
              
              <Route path="/pesquisa" element={<Pesquisa />} />
              <Route path="/colecao" element={<Colecao />} />
              <Route path="/checklist" element={<Checklist />} />
              <Route path="/desejos" element={<Desejos />} />
              <Route
                path="/admin/novo-manga"
                element={
                  <AdminRoute>
                    <NewManga />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas"
                element={
                  <AdminRoute>
                    <EditMangas />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug"
                element={
                  <AdminRoute>
                    <EditWork />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/editar"
                element={
                  <AdminRoute>
                    <EditWorkForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/nova"
                element={
                  <AdminRoute>
                    <EditionForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId"
                element={
                  <AdminRoute>
                    <EditionDetails />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/novo"
                element={
                  <AdminRoute>
                    <VolumeForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId"
                element={
                  <AdminRoute>
                    <VolumeDetails />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/volumes/:volumeId/editar"
                element={
                  <AdminRoute>
                    <VolumeForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/editar-mangas/obras/:workSlug/edicoes/:editionId/editar"
                element={
                  <AdminRoute>
                    <EditionForm />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/pos-cadastro"
                element={
                  <AdminRoute>
                    <PostCreateActions />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/opcoes"
                element={
                  <AdminRoute>
                    <AdminOptions />
                  </AdminRoute>
                }
              />
              <Route
                path="/admin/users"
                element={
                  <AdminRoute>
                    <UserManagement />
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
  </TooltipProvider>
);

export default App;
