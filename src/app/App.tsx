// src/app/App.tsx
import * as React from "react";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <React.Fragment>
      {/* Globální Suspense pro lazy route komponenty */}
      <React.Suspense
        fallback={
          <div className="flex min-h-[40vh] items-center justify-center">
            <div className="rounded-xl border p-4 text-sm text-muted-foreground">
              Načítání…
            </div>
          </div>
        }
      >
        <Outlet />
      </React.Suspense>
    </React.Fragment>
  );
}
