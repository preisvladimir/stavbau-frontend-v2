// src/routes/router.tsx
import * as React from "react";
import { createBrowserRouter, Navigate } from "react-router-dom";

// --- App shell & error boundary ---
import App from "@/app/App";
import AppLayout from "./AppLayout";
import ErrorBoundaryView from "@/ui/error-boundary/ErrorBoundaryView";

// --- Auth / guards ---
import { AuthProvider } from "@/features/auth/context/AuthContext";
import LoginPage from "@/features/auth/pages/LoginPage";
import ProtectedRoute from "@/features/auth/guards/ProtectedRoute";

// --- RBAC (jediný zdroj pravdy) ---
import { ScopeGuard, sc } from "@/rbac";

// --- Pages ---
import DashboardPage from "@/pages/DashboardPage";
import { RegisterPage } from "@/features/registration/pages/RegisterPage";
const TeamPageV2    = React.lazy(() => import("@/features/teamV2/pages/TeamPage"));
const CustomersPage = React.lazy(() => import("@/features/customers/pages/CustomersPage"));
const ProjectsPage  = React.lazy(() => import("@/features/projects/pages/ProjectsPage"));
const StatsPageAuto = React.lazy(() => import("@/features/teamV2/pages/stats/StatsPageAuto"));
import RowActionsDemo from "@/pages/dev/RowActionsDemo";

function RootWithProviders() {
  return (
    <AuthProvider>
      <App /> {/* Globální wrapper s <Outlet/> + Suspense */}
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootWithProviders />,
    errorElement: <ErrorBoundaryView />,
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
            errorElement: <ErrorBoundaryView />,
            children: [
              { path: "dashboard", element: <DashboardPage /> },
              { path: "rowactions", element: <RowActionsDemo /> },

              // --- Team ---
              {
                path: "team",
                element: (
                  <ScopeGuard anyOf={[sc.team.read, sc.team.write]}>
                    <TeamPageV2 />
                  </ScopeGuard>
                ),
              },
              {
                path: "team/:id",
                element: (
                  <ScopeGuard anyOf={[sc.team.read, sc.team.write]}>
                    <TeamPageV2 />
                  </ScopeGuard>
                ),
              },

              // --- Team Stats ---
              {
                path: "teamstats",
                element: (
                  <ScopeGuard anyOf={[sc.team.read, sc.team.write]}>
                    <StatsPageAuto />
                  </ScopeGuard>
                ),
              },
              {
                path: "companies/:companyId/teamstats",
                element: (
                  <ScopeGuard anyOf={[sc.team.read, sc.team.write]}>
                    <StatsPageAuto />
                  </ScopeGuard>
                ),
              },

              // --- Customers ---
              // Pozn.: původně bylo "invoices:write". V našem katalogu není meta "invoices:write".
              // Pro čtení seznamu zákazníků dává smysl read scope (případně doplníme sc.customers.read, až bude v katalogu).
              {
                path: "customers",
                element: (
                  <ScopeGuard anyOf={[sc.customers.read]}>
                    <CustomersPage />
                  </ScopeGuard>
                ),
              },
              {
                path: "customers/:id",
                element: (
                  <ScopeGuard anyOf={[sc.customers.read]}>
                    <CustomersPage />
                  </ScopeGuard>
                ),
              },

              // --- Projects ---
              // Meta "projects:write" v katalogu nemáme; pro zobrazení stačí read.
              {
                path: "projects",
                element: (
                  <ScopeGuard anyOf={[sc.projects.read, sc.projects.write]}>
                    <ProjectsPage />
                  </ScopeGuard>
                ),
              },
              {
                path: "projects/:id",
                element: (
                  <ScopeGuard anyOf={[sc.projects.read, sc.projects.write]}>
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
