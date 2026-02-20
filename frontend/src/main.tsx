import React from "react";
import { createRoot } from "react-dom/client";
import PremiumDatingAdvicePage from "./components/PremiumDatingAdvicePage";
import MaintenanceOverlay from "./components/MaintenanceOverlay";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    {/* Render maintenance page as the only UI until removed */}
    <MaintenanceOverlay />
  </React.StrictMode>
);
 
