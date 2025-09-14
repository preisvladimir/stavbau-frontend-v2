import React from "react";
import { Outlet } from "react-router-dom";

/**
 * Globální ErrorBoundary + App wrapper.
 * TODO:
 * - doplnit vlastní ErrorBoundary (fallback UI, i18n hlášky)
 * - případně globální LoadingOverlay / Suspense boundary
 */
export default function App() {
  return (
    <React.Fragment>
      {/* TODO: ErrorBoundary, Suspense wrapper */}
      <Outlet />
    </React.Fragment>
  );
}
