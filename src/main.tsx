import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { init } from "@instantdb/react";
import { instantSettings, appId } from "./config.ts";

init({
  ...instantSettings,
  appId,
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
