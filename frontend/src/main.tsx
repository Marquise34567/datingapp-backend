import React from "react";
import { createRoot } from "react-dom/client";
import PremiumDatingAdvicePage from "./components/PremiumDatingAdvicePage";
import InitToken from "./components/InitToken";
import "./index.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <InitToken />
    <PremiumDatingAdvicePage />
  </React.StrictMode>
);
