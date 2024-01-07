import { id, transact, tx, useAuth } from "@instantdb/react";
import { Auth } from "./Auth";
import { useQuery } from "./util/useQuery";

export default function App() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const {
    isLoading: isTeamsLoading,
    error: queryError,
    data: teamsData,
  } = useQuery(teamsQuery({ memberId: user?.id }));

  const { data: debug_allItemsData } = useQuery(debug_allDataQuery);

  const userId = user?.id;

  if (isTeamsLoading || isAuthLoading) {
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
    <main className="py-2 flex flex-col gap-2 mx-auto max-w-md">
      <h1 className="text-lg font-bold">Instant Habits</h1>
      {teamsData?.teams.map((team: any) => (
        <div key={team.id}>
          <h2>{team.name}</h2>
          {team.members.map((member: any) => (
            <div key={member.id}>
              <h3>{member.nickname}</h3>
              <MemberLogs memberId={member.id} />
            </div>
          ))}
        </div>
      ))}
      <div className="flex flex-col gap-2 mt-8 p-4 bg-slate-200 rounded-sm">
        <h3>Debug zone</h3>
        <div className="flex flex-col gap-1">
          <button className="btn" onClick={initTeams}>
            1. Create teams, members, metrics
          </button>
          <button className="btn" onClick={() => addLog(0)}>
            2. Add log
          </button>
          <button className="btn" onClick={() => debug_deleteAll()}>
            💥 Delete everything
          </button>
        </div>
        <Debug data={debug_allDataQuery} />
      </div>
    </main>
  );

  function debug_deleteAll() {
    transact(
      Object.entries(debug_allItemsData ?? {}).flatMap(([k, v]) =>
        v.map((e: { id: string }) => tx[k][e.id].delete())
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
    const team = teamsData?.teams[i];
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

function MemberLogs({ memberId }: { memberId: string }) {
  const { isLoading, error, data } = useQuery(metricsQuery({ memberId }));

  if (isLoading) {
    return null;
  }
  if (error) {
    return <div>{error.message}</div>;
  }

  return <Debug data={data} />;
}

function Debug(props: any) {
  return (
    <pre
      className="font-mono p-4 text-xs overflow-auto max-h-60"
      style={{
        border: "1px lightgray solid",
        backgroundColor: "#fafafa",
        padding: "1rem",
      }}
    >
      {JSON.stringify(props, null, "  ")}
    </pre>
  );
}

function teamsQuery({ memberId }: { memberId?: string }) {
  return {
    teams: {
      $: {
        where: { "members.id": memberId },
      },
      members: {},
      metrics: {},
    },
  };
}

function metricsQuery({ memberId }: { memberId: string }) {
  return {
    metrics: {
      $: {
        where: { "members.id": memberId },
      },
      logs: {
        $: {
          where: { "members.id": memberId },
        },
      },
    },
  };
}

const debug_allDataQuery = {
  teams: {
    members: {
      metrics: {
        logs: {
          members: {},
        },
      },
    },
  },
  members: {
    teams: {
      members: {},
    },
  },
  logs: {},
  metrics: {},
};
