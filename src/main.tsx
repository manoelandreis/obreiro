import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { initConsentLoader } from "./lib/consentLoader";

initConsentLoader();

createRoot(document.getElementById("root")!).render(<App />);
