import React from "react";
import ReactDOM from "react-dom/client";
import { DynamicProvider } from "./provider";
import App from "./App";
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DynamicProvider>
      <App />
    </DynamicProvider>
  </React.StrictMode>
);

