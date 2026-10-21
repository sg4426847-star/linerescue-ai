import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import LineRescueApp from "./pages/LineRescue";

function App() {
  return <ErrorBoundary>
    <TooltipProvider>
      <Toaster />
      <Switch>
        <Route path="/" component={LineRescueApp} />
        <Route path="/simulator" component={LineRescueApp} />
        <Route path="/recovery" component={LineRescueApp} />
        <Route path="/impact" component={LineRescueApp} />
        <Route path="/audit" component={LineRescueApp} />
        <Route path="/data" component={LineRescueApp} />
        <Route path="/sap" component={LineRescueApp} />
        <Route path="/business" component={LineRescueApp} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </TooltipProvider>
  </ErrorBoundary>;
}

export default App;
