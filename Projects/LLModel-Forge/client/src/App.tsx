import { Switch, Route } from "wouter";
import { Sidebar } from "@/components/layout/Sidebar";
import Dashboard from "@/pages/dashboard";
import FeatureStore from "@/pages/feature-store";
import Experiments from "@/pages/experiments";
import Labeling from "@/pages/labeling";
import Simulator from "@/pages/simulator";
import ModelRegistry from "@/pages/model-registry";
import Pipelines from "@/pages/pipelines";
import NotFound from "@/pages/not-found";
import { Toaster } from "@/components/ui/toaster";

function App() {
  return (
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
            <Route component={NotFound} />
          </Switch>
        </div>
      </main>
      <Toaster />
    </div>
  );
}

export default App;
