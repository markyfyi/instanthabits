export const appId = import.meta.env.VITE_INSTANT_APP_ID;

export const instantSettings = {
  websocketURI: "wss://api.instantdb.com/runtime/session",
  apiURI: "https://api.instantdb.com",
};

export const allDbEntityTypes = [
  "logs",
  "members",
  "metrics",
  "teams",
] as const;
