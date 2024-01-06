export const appId = import.meta.env.VITE_INSTANT_APP_ID;

export const instantSettings = {
  websocketURI: import.meta.env.VITE_INSTANT_WEBSOCKET_URI ||
    "wss://api.instantdb.com/runtime/session",
  apiURI: import.meta.env.VITE_INSTANT_API_URI || "https://api.instantdb.com",
};

export const allDbEntityTypes = [
  "logs",
  "members",
  "metrics",
  "teams",
] as const;
