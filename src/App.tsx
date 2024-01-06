import { useQuery, id, transact, tx, useAuth } from "@instantdb/react";
import { Auth } from "./Auth";

export default function App() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const { isLoading, error: queryError, data } = useQuery(query);
  const { data: debug_allItemsData } = useQuery(debug_allDataQuery);

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
            debug_allItemsData,
          },
          null,
          "  "
        )}
      </pre>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
        <button onClick={initTeams}>1. Create teams, members, metrics</button>
        <button onClick={() => addLog(0)}>2. Add log</button>
        <button onClick={() => debug_deleteAll()}>💥 Delete everything</button>
      </div>
    </main>
  );

  function debug_deleteAll() {
    transact(
      Object.keys(debug_allItemsData).flatMap((k) =>
        debug_allItemsData[k].map((e: { id: string }) => tx[k][e.id].delete())
      )
    );
  }

  function initTeams() {
    if (!userId) return;
    const teamId = id();
    const otherTeamId = id();
    const userId2 = id();
    const userId3 = id();
    const metricId = id();

    transact([
      tx.members[userId].update({
        nickname: "marky",
      }),

      tx.members[userId2].update({
        nickname: "stopa",
      }),

      tx.members[userId3].update({
        nickname: "joeski",
      }),

      tx.metrics[metricId].update({
        name: "Weight",
      }),

      tx.teams[teamId].link({ metrics: metricId }),

      tx.members[userId].link({ metrics: metricId }),
      tx.members[userId2].link({ metrics: metricId }),

      tx.teams[otherTeamId]
        .update({
          name: "other team",
        })
        .link({ members: userId2 })
        .link({ members: userId3 }),

      tx.teams[teamId]
        .update({
          name: "fam",
        })
        .link({ members: userId })
        .link({ members: userId2 }),
    ]);
  }

  function addLog(i: number) {
    const team = data.teams[i];
    if (!team) return;

    const metric = team.metrics[0];
    if (!metric || !userId) return;

    const logId = id();

    transact([
      tx.logs[logId].update({
        value: 175,
        timestamp: new Date().toISOString(),
      }),

      tx.teams[team.id].link({ logs: logId }),
      tx.logs[logId].link({ metrics: metric.id }),
      tx.logs[logId].link({ members: userId }),
    ]);
  }
}

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

const debug_allDataQuery = {
  teams: {
    metrics: {
      logs: {
        members: {},
      },
    },
  },
  logs: {},
  metrics: {},
  members: {
    teams: {
      members: {},
    },
  },
};
