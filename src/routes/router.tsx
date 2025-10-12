// src/routes/router.tsx
import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/app/App";
import ErrorBoundaryView from "@/ui/error-boundary/ErrorBoundaryView";

import { AuthProvider } from "@/features/auth/context/AuthContext";
import LoginPage from "@/features/auth/pages/LoginPage";
import ProtectedRoute from "@/features/auth/guards/ProtectedRoute";
import AppLayout from "./AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import { RegisterPage } from "@/features/registration/pages/RegisterPage";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";

// lazy stránky
const TeamPageV2     = React.lazy(() => import("@/features/teamV2/pages/TeamPage"));
const CustomersPage  = React.lazy(() => import("@/features/customers/pages/CustomersPage"));
const ProjectsPage   = React.lazy(() => import("@/features/projects/pages/ProjectsPage"));
const StatsPageAuto  = React.lazy(() => import("@/features/teamV2/pages/stats/StatsPageAuto"));

import RowActionsDemo from "@/pages/dev/RowActionsDemo";

function RootWithProviders() {
  return (
    <AuthProvider>
      <App /> {/* Globální wrapper s <Outlet/> + Suspense, viz níže */}
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootWithProviders />,
    errorElement: <ErrorBoundaryView />, // globální fallback pro route chyby
    children: [
      { index: true, element: <Navigate to="/app/dashboard" replace /> },
      { path: "login", element: <LoginPage /> },
      { path: "register", element: <RegisterPage /> },
      {
        path: "app",
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            errorElement: <ErrorBoundaryView />, // fallback i pro vnořené
            children: [
              { path: "dashboard", element: <DashboardPage /> },
              { path: "rowactions", element: <RowActionsDemo /> },

              // Pozn.: ScopeGuard.anyOf = logické OR
              {
                path: "team",
                element: (
                  <ScopeGuard anyOf={["team:read", "team:write"]}>
                    <TeamPageV2 />
                  </ScopeGuard>
                ),
              },
              {
                path: "team/:id",
                element: (
                  <ScopeGuard anyOf={["team:read", "team:write"]}>
                    <TeamPageV2 />
                  </ScopeGuard>
                ),
              },

              {
                path: "teamstats",
                element: (
                  <ScopeGuard anyOf={["team:read", "team:write"]}>
                    <StatsPageAuto />
                  </ScopeGuard>
                ),
              },
              {
                path: "companies/:companyId/teamstats",
                element: (
                  <ScopeGuard anyOf={["team:read", "team:write"]}>
                    <StatsPageAuto />
                  </ScopeGuard>
                ),
              },

              {
                path: "customers",
                element: (
                  <ScopeGuard anyOf={["invoices:read", "invoices:write"]}>
                    <CustomersPage />
                  </ScopeGuard>
                ),
              },
              {
                path: "customers/:id",
                element: (
                  <ScopeGuard anyOf={["invoices:read", "invoices:write"]}>
                    <CustomersPage />
                  </ScopeGuard>
                ),
              },

              {
                path: "projects",
                element: (
                  <ScopeGuard anyOf={["projects:read", "projects:write"]}>
                    <ProjectsPage />
                  </ScopeGuard>
                ),
              },
              {
                path: "projects/:id",
                element: (
                  <ScopeGuard anyOf={["projects:read", "projects:write"]}>
                    <ProjectsPage />
                  </ScopeGuard>
                ),
              },

              // 404 uvnitř /app
              { path: "*", element: <ErrorBoundaryView code={404} /> },
            ],
          },
        ],
      },
      // 404 mimo /app
      { path: "*", element: <ErrorBoundaryView code={404} /> },
    ],
  },
]);
