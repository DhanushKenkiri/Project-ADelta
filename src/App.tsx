import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import TemplatesPage from "./pages/templates";
import TemplateDetailPage from "./pages/template/[id]";
import TemplateGeneratorPage from "./pages/template-generator";
import { FeedbackProvider } from "./components/FeedbackProvider";
import FeedbackDashboard from "./pages/feedback-dashboard";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import Profile from "./pages/Profile";
import StorageDemoPage from "./pages/storage-demo";
import MyTemplates from "./pages/my-templates";
import Settings from "./pages/Settings";
import { AuthProvider } from "./lib/AuthContext";
import { PrivateRoute } from "./components/PrivateRoute";
import { useAuth } from "./lib/AuthContext";
import { initializeVercelBlob } from "@/integrations/vercel/init";
import MultiFileUploadExample from "./pages/multi-file-upload-example";
import MailInboxPage from "./pages/MailInbox";
import ComposePage from "./pages/Compose";
import InboxPage from "./pages/inbox";
import WalletProvider from "./components/WalletProvider";

const queryClient = new QueryClient();

// Redirect component that checks authentication status
const HomeRedirect = () => {
  const { user, loading } = useAuth();
  
  // While checking auth status, show nothing
  if (loading) return null;
  
  // If user is logged in, go to home page, otherwise to login
  return user ? <Navigate to="/" /> : <Navigate to="/login" />;
};

// Initialize storage services component
const StorageInitializer = () => {
  useEffect(() => {
    // Initialize Vercel Blob services when the app loads
    try {
      initializeVercelBlob().then(({ success }) => {
        if (success) {
          console.log('Vercel Blob services initialized successfully');
        }
      }).catch(err => {
        // Silently ignore Vercel Blob initialization errors in development
        console.log('Note: Vercel Blob initialization skipped (requires production environment)');
      });
    } catch (error) {
      // Ignore errors
      console.log('Note: Vercel Blob initialization skipped (requires production environment)');
    }
  }, []);
  
  return null;
};

// Wallet-enabled route component
const WalletRoute = ({ children }: { children: React.ReactNode }) => {
  return (
    <WalletProvider>
      {children}
    </WalletProvider>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <FeedbackProvider apiEndpoint="/api/feedback" debugMode={false}>
          <StorageInitializer />
          <Toaster />
          <Sonner position="top-center" />
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              
              {/* Root redirect based on auth status */}
              <Route path="/" element={
                <PrivateRoute>
                  <Index />
                </PrivateRoute>
              } />
              
              {/* Protected routes */}
              <Route element={<PrivateRoute />}>
                <Route path="/profile" element={<Profile />} />
                <Route path="/templates" element={<TemplatesPage />} />
                <Route path="/my-templates" element={<MyTemplates />} />
                <Route path="/template/:id" element={<TemplateDetailPage />} />
                <Route path="/template-generator" element={<TemplateGeneratorPage />} />
                <Route path="/feedback-dashboard" element={<FeedbackDashboard />} />
                <Route path="/storage-demo" element={<StorageDemoPage />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="/multi-file-upload-example" element={<MultiFileUploadExample />} />
                <Route path="/mail-inbox" element={<MailInboxPage />} />
                <Route path="/mail" element={<MailInboxPage />} />
                
                {/* Wallet-enabled routes */}
                <Route path="/compose" element={
                  <WalletRoute>
                    <ComposePage />
                  </WalletRoute>
                } />
                <Route path="/inbox" element={
                  <WalletRoute>
                    <InboxPage />
                  </WalletRoute>
                } />
              </Route>
              
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </FeedbackProvider>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
