import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Apply persisted theme before first render to prevent flash
const stored = localStorage.getItem('gfc-theme') || 'dark';
document.documentElement.classList.remove('dark', 'light');
document.documentElement.classList.add(stored);

createRoot(document.getElementById("root")!).render(<App />);
