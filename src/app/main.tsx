// src/app/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import ToastProvider from "@/components/ui/ToastProvider";
import { RouterProvider } from "react-router-dom";
import { router } from "@/routes/router";
import "@/i18n";
import "@/styles/index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ToastProvider>
      <RouterProvider router={router} />
    </ToastProvider>
  </React.StrictMode>
);
