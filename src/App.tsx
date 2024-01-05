import { init, useQuery, id, transact, tx, useAuth } from "@instantdb/react";
import { Auth } from "./Auth";

init({
  appId: import.meta.env.VITE_INSTANT_APP_ID,
  websocketURI: "wss://api.instantdb.com/runtime/session",
  apiURI: "https://api.instantdb.com",
});

const dbTypes = ["logs", "members", "metrics", "teams"] as const;

const query = {
  teams: {
    members: {},
    metrics: {},
    logs: {
      members: {},
      metrics: {
        teams: {},
      },
    },
  },
};

export default function App() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const { isLoading, error: queryError, data } = useQuery(query);
  const { data: allItemsData } = useQuery(
    Object.fromEntries(dbTypes.map((k) => [k, {}]))
  );
  const userId = user?.id;

  if (isLoading || isAuthLoading) {
    return null;
  }
  if (queryError) {
    return <div>{queryError.message}</div>;
  }
  if (authError) {
    return <div>{authError.message}</div>;
  }
  if (!userId) {
    return <Auth />;
  }

  return (
    <main style={{ margin: "0 auto", maxWidth: "24rem" }}>
      <h1>Instant Habits</h1>
      <pre
        style={{
          fontSize: "0.7rem",
          border: "1px lightgray solid",
          backgroundColor: "#fafafa",
          padding: "1rem",
          maxHeight: "18rem",
          overflow: "auto",
        }}
      >
        {JSON.stringify(
          {
            userId,
            ...data,
          },
          null,
          "  "
        )}
      </pre>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button onClick={createTeams}>1. Create teams</button>
        <button onClick={() => addMetric(0)}>
          2. Add metric to first team
        </button>
        <button onClick={() => addMetric(1)}>
          3. Add metric to second team
        </button>
        <button onClick={() => addLog(0)}>4. Add log to first team</button>
        <button onClick={() => addLog(1)}>5. Add log to second team</button>
        <button onClick={() => deleteAll()}>Delete everything</button>
      </div>
    </main>
  );

  function deleteAll() {
    transact(
      Object.keys(allItemsData).flatMap((k) =>
        allItemsData[k].map((e: { id: string }) => tx[k][e.id].delete())
      )
    );
  }

  function createTeams() {
    if (!userId) return;
    const teamId = id();
    const otherTeamId = id();
    const otherUserId = id();

    transact([
      tx.members[userId].update({
        nickname: "marky",
      }),

      tx.members[otherUserId].update({
        nickname: "stopa",
      }),

      tx.teams[otherTeamId]
        .update({
          name: "other team",
        })
        .link({ members: otherUserId }),

      tx.teams[teamId]
        .update({
          name: "fam",
        })
        .link({ members: userId })
        .link({ members: otherUserId }),
    ]);
  }

  function addMetric(i: number) {
    const team = data.teams[i];
    if (!team) return;

    const metricId = id();

    transact([
      tx.metrics[metricId].update({
        name: "Weight",
      }),

      tx.teams[team.id].link({ metrics: metricId }),
    ]);
  }

  function addLog(i: number) {
    const team = data.teams[i];
    if (!team) return;

    const metric = team.metrics[0];
    const member = team.members[0];
    if (!metric || !member) return;

    const logId = id();

    transact([
      tx.logs[logId].update({
        value: 175,
        timestamp: new Date().toISOString(),
      }),

      tx.teams[team.id].link({ logs: logId }),
      tx.logs[logId].link({ metrics: metric.id }),
      tx.logs[logId].link({ members: member.id }),
    ]);
  }
}
