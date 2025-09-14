import React from "react";
import ReactDOM from "react-dom/client";
//import App from "./App";
import '@/styles/index.css'

// Providers
import "@/i18n"; // inicializace i18next
import { AuthProvider } from "@/features/auth/context/AuthContext";
import ToastProvider from "@/components/ui/ToastProvider";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/router";

/**
 * Entry point aplikace (bootstrap).
 * Zajišťuje globální providery (i18n, AuthContext, Toast, Router).
 */
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>
);
