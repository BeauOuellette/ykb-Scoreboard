import { StrictMode, Suspense, lazy } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Layout } from "@/components/layout/Layout";
import { PageSkeleton } from "@/components/shared/PageSkeleton";
import "./index.css";

const ScoreboardPage = lazy(() => import("./pages/ScoreboardPage"));
const GamePage = lazy(() => import("./pages/GamePage"));
const TeamPage = lazy(() => import("./pages/TeamPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const ScatterPage = lazy(() => import("./pages/ScatterPage"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<PageSkeleton />}>
          <Routes>
            <Route element={<Layout />}>
              <Route path="/" element={<ScoreboardPage />} />
              <Route path="/game/:id" element={<GamePage />} />
              <Route path="/team/:abbr" element={<TeamPage />} />
              <Route path="/leaderboards" element={<LeaderboardPage />} />
              <Route path="/scatter" element={<ScatterPage />} />
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>
);
