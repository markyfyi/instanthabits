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
    members: {},
    logs: {},
    teams: {
      metrics: {
        teams: {},
      },

      members: {
        logs: {
          metrics: {
            teams: {
              members: {},
            },
          },
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
    const teamId = id();
    const memberId = id();

    const otherTeamId = id();
    const otherMemberId = id();

    transact([
      tx.teams[teamId].update({
        name: "fam",
      }),

      tx.members[memberId].update({
        user: userId,
      }),

      tx.teams[teamId].link({ members: memberId }),

      tx.teams[otherTeamId].update({
        name: "other team",
      }),
      tx.members[otherMemberId].update({
        user: id(),
      }),
      tx.teams[otherTeamId].link({ members: otherMemberId }),
    ]);
  }

  function addMetric(i: number) {
    const team = data.teams[i];
    if (!team || !userId) return;

    console.log({ team, userId });

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
    const member = data.teams[i].members[0];
    if (!metric || !member || !userId) return;

    const logId = id();

    transact([
      tx.logs[logId].update({
        value: 175,
        timestamp: new Date().toISOString(),
      }),

      tx.metrics[metric.id].link({ logs: logId }),
      tx.logs[logId].link({ members: member.id }),
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
            teams: data?.teams ?? [],
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
