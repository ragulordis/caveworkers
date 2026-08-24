import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import React from "react";
import { useEffect } from "react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import Home from "./pages/Home";
import DataAnalystPage from "./pages/DataAnalystPage";
import QaPage from "./pages/QaPage";
import Login from "./pages/Login";
import { useAuth } from "./_core/hooks/useAuth";

export function TenantGate({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  useEffect(() => { if (!loading && !isAuthenticated) setLocation("/login"); }, [isAuthenticated, loading, setLocation]);
  if (loading || !isAuthenticated) return <main className="app-noise mesh-glow grid min-h-screen place-items-center bg-[#0a0b0e] text-sm text-zinc-500">Verifying secure workspace access…</main>;
  return <>{children}</>;
}

function WorkspaceRoute() { return <TenantGate><Home /></TenantGate>; }
function DataRoute() { return <TenantGate><DataAnalystPage /></TenantGate>; }
function QaRoute() { return <TenantGate><QaPage /></TenantGate>; }

function Router() {
  return (
    <Switch>
      <Route path={"/"} component={WorkspaceRoute} />
      <Route path={"/login"} component={Login} />
      <Route path={"/data"} component={DataRoute} />
      <Route path={"/qa"} component={QaRoute} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster theme="dark" position="top-center" />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
