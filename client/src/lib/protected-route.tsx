import { useAuth } from "@/hooks/use-auth";
import { Redirect, Route } from "wouter";
import LoadingPage from "@/components/loading-page";
import SplashScreen from "@/components/splash-screen";
import { useState, useEffect } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Show splash screen only on initial login
  useEffect(() => {
    if (!isLoading && user && initialLoad) {
      setShowSplash(true);
      setInitialLoad(false);
    }
  }, [isLoading, user, initialLoad]);

  const handleSplashComplete = () => {
    setShowSplash(false);
  };

  if (isLoading) {
    return (
      <Route path={path}>
        <LoadingPage />
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  return (
    <Route path={path}>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      <Component />
    </Route>
  );
}
