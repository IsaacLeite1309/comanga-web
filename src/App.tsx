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
import { PublicNav } from "@/components/PublicNav.tsx";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const App = () => (
  <TooltipProvider>
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <div className="flex min-h-screen w-full bg-background">
          <PublicNav />
          <main className="flex-1 flex flex-col md:ml-20 lg:ml-56 pb-16 md:pb-0">
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
