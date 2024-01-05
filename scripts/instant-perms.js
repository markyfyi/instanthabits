import "dotenv/config";
import { readFileSync } from "fs";

const code = JSON.parse(readFileSync("./instantdb-permissions.json", "utf8"));

const res = await fetch(
  `https://api.instantdb.com/dash/apps/${process.env.VITE_INSTANT_APP_ID}`,
  {
    method: "POST",
    headers: {
      accept: "*/*",
      authorization: `Bearer ${process.env.INSTANT_TOKEN}`,
      "content-type": "application/json",
    },
    body: JSON.stringify({ code }),
  }
);

console.log(res.ok ? "ok" : "failed");
