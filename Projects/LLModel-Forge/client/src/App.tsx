import { Switch, Route, Redirect } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import Dashboard from "@/pages/dashboard";
import FeatureStore from "@/pages/feature-store";
import Experiments from "@/pages/experiments";
import Labeling from "@/pages/labeling";
import Simulator from "@/pages/simulator";
import ModelRegistry from "@/pages/model-registry";
import Pipelines from "@/pages/pipelines";
import Settings from "@/pages/settings";
import Alerts from "@/pages/alerts";
import Monitoring from "@/pages/monitoring";
import ABTestingPage from "@/pages/ab-testing";
import AutoRetrainPage from "@/pages/auto-retrain";
import ExplainabilityPage from "@/pages/explainability";
import Login from "@/pages/login";
import Register from "@/pages/register";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";
import { CommandPalette, useCommandPalette } from "@/components/command-palette";
import { Loader2 } from "lucide-react";


function PublicRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isAuthenticated) {
    return <Redirect to="/" />;
  }

  return <Component />;
}

function AppLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const commandPalette = useCommandPalette();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      <Switch>
        <Route path="/login">
          <PublicRoute component={Login} />
        </Route>
        <Route path="/register">
          <PublicRoute component={Register} />
        </Route>
        <Route>
          {isAuthenticated ? (
            <div className="flex h-screen overflow-hidden bg-background text-foreground font-sans">
              <Sidebar />
              <main className="flex-1 overflow-y-auto">
                <div className="container mx-auto p-8">
                  <Switch>
                    <Route path="/" component={Dashboard} />
                    <Route path="/feature-store" component={FeatureStore} />
                    <Route path="/experiments" component={Experiments} />
                    <Route path="/labeling" component={Labeling} />
                    <Route path="/simulator" component={Simulator} />
                    <Route path="/model-registry" component={ModelRegistry} />
                    <Route path="/pipelines" component={Pipelines} />
                    <Route path="/alerts" component={Alerts} />
                    <Route path="/monitoring" component={Monitoring} />
                    <Route path="/ab-testing" component={ABTestingPage} />
                    <Route path="/auto-retrain" component={AutoRetrainPage} />
                    <Route path="/explainability" component={ExplainabilityPage} />
                    <Route path="/settings" component={Settings} />
                    <Route component={NotFound} />
                  </Switch>
                </div>
              </main>
              <Toaster />
              {/* Command Palette - Press "/" or Cmd+K to open */}
              <CommandPalette isOpen={commandPalette.isOpen} onClose={commandPalette.close} />
            </div>
          ) : (
            <Redirect to="/login" />
          )}
        </Route>
      </Switch>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  );
}

export default App;
