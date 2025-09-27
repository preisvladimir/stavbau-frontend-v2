import { createBrowserRouter, Navigate } from "react-router-dom";
import App from "@/app/App";

import { AuthProvider } from "@/features/auth/context/AuthContext";
import LoginPage from "@/features/auth/pages/LoginPage";
import ProtectedRoute from "@/features/auth/guards/ProtectedRoute";
import AppLayout from "./AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsListPage from "@/pages/projects/ProjectsListPage";
import ProjectNewPage from "@/pages/projects/ProjectNewPage";
import { RegisterPage } from "@/features/registration/pages/RegisterPage";
import ScopeGuard from "@/features/auth/guards/ScopeGuard";
import TeamPage from "@/features/team/pages/TeamPageV2";
import CustomersListPage from "@/features/customers/pages/CustomersListPage";

function RootWithProviders() {
  return (
    <AuthProvider>
      <App /> {/* Globální wrapper s <Outlet/> */}
    </AuthProvider>
  );
}

export const router = createBrowserRouter([
  {
    path: "/",
    element: <RootWithProviders />,
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
            children: [
              { path: "dashboard", element: <DashboardPage /> },
              { path: "projects", element: <ProjectsListPage /> },
              { path: "projects/new", element: <ProjectNewPage /> },
              {
                path: "team",
                element: (
                  <ScopeGuard required={["team:read", "team:write"]}>
                    <TeamPage />
                  </ScopeGuard>
                ),
              },
              {
                path: "customers",
                element: (
                  <ScopeGuard required={["invoices:read", "invoices:write"]}>
                    <CustomersListPage />
                  </ScopeGuard>
                ),
              },
              {
                path: "customers/:id",
                element: (
                  <ScopeGuard required={["invoices:read", "invoices:write"]}>
                    <CustomersListPage />
                  </ScopeGuard>
                ),
              },
            ],
          },
        ],
      },
    ],
  },
]);
