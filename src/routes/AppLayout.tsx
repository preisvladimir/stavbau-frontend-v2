import { Outlet } from "react-router-dom";
import Topbar from "./components/Topbar";
import Sidebar from "./components/Sidebar";

/** TODO: responsive layout, aria landmarks, focus styles */
export default function AppLayout() {
  return (
    <div className="min-h-dvh flex">
      <Sidebar />
      <main className="flex-1">
        <Topbar />
        <div className="p-6"><Outlet /></div>
      </main>
    </div>
  );
}
