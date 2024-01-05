import "dotenv/config";
import { readFileSync } from "fs";

const appId = process.env.VITE_INSTANT_APP_ID;
const token = process.env.INSTANT_TOKEN;

const code = JSON.parse(readFileSync("./instantdb-permissions.json", "utf8"));

const res = await fetch(`https://api.instantdb.com/dash/apps/${appId}/rules`, {
  method: "POST",
  headers: {
    accept: "*/*",
    authorization: `Bearer ${token}`,
    "content-type": "application/json",
  },
  body: JSON.stringify({ code }),
});

console.log(res.status, res.statusText);
