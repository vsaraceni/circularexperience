import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login";
import Proposals from "./pages/admin/Proposals";
import PrintablePresentation from "./pages/PrintablePresentation";
import Dashboard from "./pages/admin/Dashboard";
import Templates from "./pages/admin/Templates";
import StrategicDashboard from "./pages/admin/StrategicDashboard";
import PerformanceDashboard from "./pages/admin/PerformanceDashboard";
import Pipeline from "./pages/admin/Pipeline";
import Products from "./pages/admin/Products";
import Integrations from "./pages/admin/Integrations";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/login" element={<Login />} />
          <Route
            path="/admin/pipeline"
            element={
              <ProtectedRoute>
                <Pipeline />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/propostas"
            element={
              <ProtectedRoute>
                <Proposals />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/templates"
            element={
              <ProtectedRoute requireAdmin>
                <Templates />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/performance"
            element={
              <ProtectedRoute>
                <PerformanceDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/painel"
            element={
              <ProtectedRoute>
                <StrategicDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/produtos"
            element={
              <ProtectedRoute requireAdmin>
                <Products />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/integracoes"
            element={
              <ProtectedRoute requireAdmin>
                <Integrations />
              </ProtectedRoute>
            }
          />
          <Route path="/apresentacao-print/:slug" element={<PrintablePresentation />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
