import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import Login from "./pages/Login";
import Proposals from "./pages/admin/Proposals";
import ProposalView from "./pages/ProposalView";
import PrintablePresentation from "./pages/PrintablePresentation";
import Dashboard from "./pages/admin/Dashboard";
import Templates from "./pages/admin/Templates";
import StrategicDashboard from "./pages/admin/StrategicDashboard";
import PerformanceDashboard from "./pages/admin/PerformanceDashboard";
import Pipeline from "./pages/admin/Pipeline";
import Unsubscribe from "./pages/Unsubscribe";
import ProtectedRoute from "./components/auth/ProtectedRoute";

const queryClient = new QueryClient();

const isCrmDomain = window.location.hostname.startsWith("crm.");

const CrmRoutes = () => (
  <Routes>
    <Route path="/" element={<Navigate to="/admin/pipeline" replace />} />
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
    <Route path="/proposta/:slug" element={<ProposalView />} />
    <Route path="/apresentacao-print/:slug" element={<PrintablePresentation />} />
    <Route path="*" element={<Navigate to="/admin/pipeline" replace />} />
  </Routes>
);

const SiteRoutes = () => (
  <Routes>
    <Route path="/" element={<Index />} />
    <Route path="/login" element={<Login />} />
    <Route
      path="/admin/pipeline"
      element={
        <ProtectedRoute>
          <Pipeline />
        </ProtectedRoute>
      }
    />
    <Route path="/proposta/:slug" element={<ProposalView />} />
    <Route path="/apresentacao-print/:slug" element={<PrintablePresentation />} />
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
    <Route path="/unsubscribe" element={<Unsubscribe />} />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        {isCrmDomain ? <CrmRoutes /> : <SiteRoutes />}
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
