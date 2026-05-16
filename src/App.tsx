import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppAuthProvider } from "@/hooks/useAppAuth";
import Index from "./pages/Index";
import Quote from "./pages/Quote";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminContent from "./pages/admin/AdminContent";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import NotFound from "./pages/NotFound";
import IndexV2 from "./pages/IndexV2";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AppLayout from "./components/AppLayout";
import AppLogin from "./pages/app/AppLogin";
import AppSignup from "./pages/app/AppSignup";
import AppDashboard from "./pages/app/AppDashboard";
import AppJobs from "./pages/app/AppJobs";
import AppClients from "./pages/app/AppClients";
import AppSettings from "./pages/app/AppSettings";
import AppQuotes from "./pages/app/AppQuotes";
import AppQuoteNew from "./pages/app/AppQuoteNew";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <AppAuthProvider>
            <Routes>
              {/* Public */}
              <Route path="/" element={<IndexV2 />} />
              <Route path="/v1" element={<Index />} />
              <Route path="/quote" element={<Quote />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route path="/admin/*" element={<AdminLayout />}>
                <Route path="leads" element={<AdminLeads />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="templates" element={<AdminTemplates />} />
                <Route path="analytics" element={<AdminAnalytics />} />
              </Route>

              {/* App (separate user accounts) */}
              <Route path="/app/login" element={<AppLogin />} />
              <Route path="/app/signup" element={<AppSignup />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<AppDashboard />} />
                <Route path="jobs" element={<AppJobs />} />
                <Route path="quotes" element={<AppQuotes />} />
                <Route path="quotes/new" element={<AppQuoteNew />} />
                <Route path="clients" element={<AppClients />} />
                <Route path="settings" element={<AppSettings />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
          </AppAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
