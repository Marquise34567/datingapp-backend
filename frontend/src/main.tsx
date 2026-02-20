import React from "react";
import { createRoot } from "react-dom/client";
import PremiumDatingAdvicePage from "./components/PremiumDatingAdvicePage";
import MaintenanceOverlay from "./components/MaintenanceOverlay";
import "./index.css";

// Show overlay when Vite env flag is set to "true"
const MAINTENANCE_MODE = (import.meta.env.VITE_MAINTENANCE_MODE || "").toLowerCase() === "true";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <PremiumDatingAdvicePage />
    {MAINTENANCE_MODE ? <MaintenanceOverlay /> : null}
  </React.StrictMode>
);
 
