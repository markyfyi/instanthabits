import "dotenv/config";
import { readFileSync, writeFileSync } from "fs";

const filePath = "./instantdb-permissions.json";
const appId = process.env.VITE_INSTANT_APP_ID;
const token = process.env.INSTANT_TOKEN;

const cmd = process.argv[2];

if (!cmd) {
  console.error("Error: No command provided, specify `pull` or `push`");
} else if (cmd === "pull") {
  const data = (
    await fetch("https://api.instantdb.com/dash/apps", {
      method: "GET",
      headers: {
        accept: "*/*",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
    }).then((res) => res.json())
  ).apps?.find((app) => app.id === appId)?.rules;

  writeFileSync(filePath, JSON.stringify(data, null, "\t"), "utf-8");
  console.log("OK");
} else if (cmd === "push") {
  const code = JSON.parse(readFileSync(filePath, "utf8"));

  const res = await fetch(
    `https://api.instantdb.com/dash/apps/${appId}/rules`,
    {
      method: "POST",
      headers: {
        accept: "*/*",
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({ code }),
    }
  );

  console.log(res.status, res.statusText);
}
