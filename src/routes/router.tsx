import { createBrowserRouter, Navigate } from "react-router-dom";
import LoginPage from "@/features/auth/pages/LoginPage";
import ProtectedRoute from "@/features/auth/guards/ProtectedRoute";
import AppLayout from "./AppLayout";
import DashboardPage from "@/pages/DashboardPage";
import ProjectsListPage from "@/pages/projects/ProjectsListPage";
import ProjectNewPage from "@/pages/projects/ProjectNewPage";

/** TODO: doplnit ScopeGuard uvnitř stránek podle potřeby */
export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/", element: <Navigate to="/app/dashboard" replace /> },
  {
    path: "/app",
    element: <ProtectedRoute />,
    children: [
      { element: <AppLayout />, children: [
        { path: "dashboard", element: <DashboardPage /> },
        { path: "projects", element: <ProjectsListPage /> },
        { path: "projects/new", element: <ProjectNewPage /> },
      ]},
    ],
  },
]);
