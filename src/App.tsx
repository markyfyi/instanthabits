import { init, useQuery, id, transact, tx, useAuth } from "@instantdb/react";
import { Auth } from "./Auth";

init({
  appId: import.meta.env.VITE_INSTANT_APP_ID,
  websocketURI: "wss://api.instantdb.com/runtime/session",
  // @ts-expect-error
  apiURI: "https://api.instantdb.com",
});

export default function App() {
  const { user, isLoading: isAuthLodaing } = useAuth();

  const { isLoading, error, data } = useQuery({
    metrics: {},
    logs: {},
    teams: {
      members: {},
      metrics: {
        teams: {},
      },
      logs: {
        metrics: {
          teams: {},
        },
      },
    },
  });

  const userId = user?.id;

  if (isAuthLodaing) {
    return null;
  }

  if (!userId) {
    return <Auth />;
  }

  function deleteAll() {
    transact(
      Object.keys(data).flatMap((k) =>
        data[k].map((e: { id: string }) => tx[k][e.id].delete())
      )
    );
  }

  function createTeams() {
    if (!userId) return;
    const teamId = id();

    const otherTeamId = id();
    const otherUserId = id();

    transact([
      tx.members[userId].update({}),
      tx.members[otherUserId].update({}),

      tx.teams[teamId]
        .update({
          name: "fam",
        })
        .link({ members: userId }),

      tx.teams[otherTeamId]
        .update({
          name: "other team",
        })
        .link({ members: otherUserId }),
    ]);
  }

  function addMetric(i: number) {
    const team = data.teams[i];
    if (!team || !userId) return;

    const metricId = id();

    transact([
      tx.metrics[metricId].update({
        name: "Weight",
      }),

      tx.teams[team.id].link({ metrics: metricId }),
    ]);
  }

  function addLog(i: number) {
    const metric = data.teams[i].metrics[0];
    const memberId = data.teams[i].members[0];
    if (!metric || !memberId || !userId) return;

    const logId = id();

    transact([
      tx.logs[logId].update({
        value: 175,
        timestamp: new Date().toISOString(),
        memberId,
      }),

      tx.metrics[metric.id].link({ logs: logId }),
    ]);
  }

  return (
    <main style={{ margin: "0 auto", maxWidth: "24rem" }}>
      <h1>Instant Habits</h1>
      <pre
        style={{
          border: "1px lightgray solid",
          padding: "1rem",
          maxHeight: "18rem",
          overflow: "auto",
        }}
      >
        {JSON.stringify(
          {
            userId,
            teams: data?.teams ?? null,
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
}
