// src/app/main.tsx
import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";

import { router } from "@/routes/router";
import "@/i18n";
import "@/styles/index.css";

import { FeedbackProvider } from "@/ui/feedback";
import { registerGlobalApiErrorHandlers } from "@/auth/bootstrapErrorHandlers";

// zaregistrujeme globální handlery hned při startu aplikace
const unregister = registerGlobalApiErrorHandlers();

// HMR úklid (volitelné – už to zvládne i idempotence, ale ať je to čisté)
if (import.meta && import.meta.hot) {
  import.meta.hot.dispose(() => {
    try { unregister?.(); } catch {}
  });
}

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <FeedbackProvider toastPosition="bottom-right" toastMax={3} toastDuration={4000}>
      <RouterProvider router={router} />
    </FeedbackProvider>
  </React.StrictMode>
);
