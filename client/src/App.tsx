import { QueryClientProvider } from "@tanstack/react-query";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing-page";
import AuthPage from "@/pages/auth-page";
import DashboardPage from "@/pages/dashboard-page";
import ProfilePage from "@/pages/profile-page";
import HelpCenterPage from "@/pages/help-center-page";
import AdminDashboard from "@/pages/admin/admin-dashboard";
import ManageUsers from "@/pages/admin/manage-users";
import ManageResumes from "@/pages/admin/manage-resumes";
import ApiKeys from "@/pages/admin/api-keys";
import { AuthProvider } from "@/hooks/use-auth";
import { CollaborationProvider } from "@/hooks/use-collaboration";
import { ProtectedRoute } from "@/lib/protected-route";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/help" component={HelpCenterPage} />
      <ProtectedRoute path="/dashboard" component={DashboardPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/admin" component={AdminDashboard} adminOnly />
      <ProtectedRoute path="/admin/users" component={ManageUsers} adminOnly />
      <ProtectedRoute path="/admin/resumes" component={ManageResumes} adminOnly />
      <ProtectedRoute path="/admin/api-keys" component={ApiKeys} adminOnly />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CollaborationProvider resumeId={null}>
          <Router />
          <Toaster />
        </CollaborationProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
