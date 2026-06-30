import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { AppAuthProvider } from "@/hooks/useAppAuth";

import Quote from "./pages/Quote";
import AdminLogin from "./pages/AdminLogin";
import AdminLayout from "./components/AdminLayout";
import AdminLeads from "./pages/admin/AdminLeads";
import AdminContent from "./pages/admin/AdminContent";
import AdminTemplates from "./pages/admin/AdminTemplates";
import AdminAnalytics from "./pages/admin/AdminAnalytics";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminDns from "./pages/admin/AdminDns";
import { useEffect } from "react";
import { initPosthog, initCrisp } from "./lib/integrations";
import NotFound from "./pages/NotFound";
import IndexV2 from "./pages/IndexV2";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import AppLayout from "./components/AppLayout";
import AppLogin from "./pages/app/AppLogin";
import AppSignup from "./pages/app/AppSignup";
import AppForgotPassword from "./pages/app/AppForgotPassword";
import AppResetPassword from "./pages/app/AppResetPassword";
import { Navigate } from "react-router-dom";
import AppJobs from "./pages/app/AppJobs";
import AppClients from "./pages/app/AppClients";
import AppSettings from "./pages/app/AppSettings";
import AppQuotes from "./pages/app/AppQuotes";
import AppQuoteNew from "./pages/app/AppQuoteNew";
import AppQuoteDetail from "./pages/app/AppQuoteDetail";
import AppQuotePreview from "./pages/app/AppQuotePreview";
import AppPlans from "./pages/app/AppPlans";
import AppBrand from "./pages/app/AppBrand";
import AppHelp from "./pages/app/AppHelp";
import PublicQuote from "./pages/PublicQuote";
import CookieConsent from "./components/CookieConsent";
import Unsubscribe from "./pages/Unsubscribe";

const queryClient = new QueryClient();

const App = () => {
  useEffect(() => { initPosthog(); initCrisp(); }, []);
  return (
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
              
              <Route path="/quote" element={<Quote />} />
              <Route path="/privacidade" element={<PrivacyPolicy />} />
              <Route path="/q/:token" element={<PublicQuote />} />
              <Route path="/unsubscribe" element={<Unsubscribe />} />

              {/* Admin */}
              <Route path="/admin" element={<AdminLogin />} />
              <Route element={<AdminLayout />}>
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/leads" element={<AdminLeads />} />
                <Route path="/admin/content" element={<AdminContent />} />
                <Route path="/admin/templates" element={<AdminTemplates />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                <Route path="/admin/dns" element={<AdminDns />} />
              </Route>

              {/* App (separate user accounts) */}
              <Route path="/app/login" element={<AppLogin />} />
              <Route path="/app/signup" element={<AppSignup />} />
              <Route path="/app/forgot-password" element={<AppForgotPassword />} />
              <Route path="/app/reset-password" element={<AppResetPassword />} />
              <Route path="/app" element={<AppLayout />}>
                <Route index element={<Navigate to="/app/quotes" replace />} />
                <Route path="jobs" element={<AppJobs />} />
                <Route path="quotes" element={<AppQuotes />} />
                <Route path="quotes/new" element={<AppQuoteNew />} />
                <Route path="quotes/:id" element={<AppQuoteDetail />} />
                <Route path="quotes/:id/preview" element={<AppQuotePreview />} />
                <Route path="clients" element={<AppClients />} />
                <Route path="settings" element={<AppSettings />} />
                <Route path="brand" element={<AppBrand />} />
                <Route path="planos" element={<AppPlans />} />
                <Route path="ajuda" element={<AppHelp />} />
              </Route>

              <Route path="*" element={<NotFound />} />
            </Routes>
            <CookieConsent />
          </AppAuthProvider>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
  );
};

export default App;
