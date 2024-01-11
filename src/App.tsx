import { id, transact, tx, useAuth } from "@instantdb/react";
import { Auth } from "./Auth";
import { InstantObject, useQuery } from "./util/instant";

export default function App() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const {
    isLoading: isTeamsLoading,
    error: queryError,
    data: teamsData,
  } = useQuery({
    teams: {
      $: {
        where: { "members.id": user?.id },
      },
      metrics: {
        members: {},
      },
    },
  });

  const { data: debug_allItemsData } = useQuery(allDataQuery__debug);

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
      <h1 className="text-xl font-bold">Instant Habits</h1>
      {teamsData?.teams.map((team) => (
        <div key={team.id}>
          <h2 className="text-lg font-bold">{team.name}</h2>
          {team.metrics.map((metric) => (
            <MetricsLogs key={metric.id} metric={metric} />
          ))}
        </div>
      ))}

      <div className="w-96 h-96 flex flex-col gap-2 p-4 bg-slate-200 rounded-sm fixed bottom-0 right-0">
        <h3 className="text-lg font-bold">Instant debug zone</h3>
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
        <Debug data={debug_allItemsData} />
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
    const userId1 = userId;
    const userId2 = id();
    const userId3 = id();

    function addMemberOps(nickname: string) {
      return [
        tx.members[userId1].update({
          nickname,
        }),
      ];
    }

    function addMetricOps(name: string) {
      const metricId = id();
      return [
        tx.metrics[metricId].update({
          name,
        }),

        tx.members[userId1].link({ metrics: metricId }),
        tx.teams[teamId].link({ metrics: metricId }),
        tx.members[userId2].link({ metrics: metricId }),
      ];
    }

    transact([
      ...addMemberOps("marky"),
      ...addMemberOps("stopa"),
      ...addMemberOps("joeski"),

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
        .link({ members: userId1 })
        .link({ members: userId2 }),

      ...addMetricOps("Weight"),
      ...addMetricOps("Sleep"),
      ...addMetricOps("Skincare"),
      ...addMetricOps("Train"),
      ...addMetricOps("Climb"),
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
        value: 100,
        timestamp: new Date().toISOString(),
      }),

      tx.teams[team.id].link({ logs: logId }),
      tx.logs[logId].link({ metrics: metric.id }),
      tx.logs[logId].link({ members: userId }),
    ]);
  }
}

function useLogsQuerys__WorkkaroundPleaseFix({
  metricId,
}: {
  metricId: string;
}) {
  // // FIXME: multiple clauses please! @stopachka @nezaj 🙏
  // useQuery({
  //   logs: {
  //     $: {
  //       where: { "members.id": member.id, "metrics.id": metric.id },
  //     },
  //   },
  // });

  const result = useQuery({
    logs: {
      $: {
        where: { "metrics.id": metricId },
      },
      members: {},
    },
  });

  console.log(result.data?.logs);

  return {
    workaround: {
      logsByMemberId: groupBy(
        result.data?.logs ?? [],
        (log) => log.members[0].id
      ),
    },
    result,
  };
}

function MetricsLogs({ metric }: { metric: InstantObject }) {
  const {
    result: { isLoading, error, data },
    workaround: { logsByMemberId },
  } = useLogsQuerys__WorkkaroundPleaseFix({
    metricId: metric.id,
  });

  if (isLoading) {
    return null;
  }

  if (error) {
    return <div>{error.message}</div>;
  }

  return (
    <div key={metric.id} className="mb-4">
      <h3>{metric.name}</h3>
      {Object.values(logsByMemberId).map((logs) => {
        const member = logs[0]?.members[0];
        // this should never happen
        if (!member) return null;

        return (
          <div key={metric.id} className="mb-4">
            <h3>{member.nickname}</h3>
            <div>
              {logs.map((log) => (
                <div key={log.id}>
                  {dateFromatter.format(new Date(log.timestamp))}: {log.value}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
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

const allDataQuery__debug = {
  logs: {
    metrics: {},
  },
  members: {},
  teams: {},
  metrics: {},
};

const dateFromatter = new Intl.DateTimeFormat("en-US", {
  year: "2-digit",
  month: "2-digit",
  day: "2-digit",
});

function groupBy<T, K extends keyof any>(
  array: T[],
  getKey: (item: T) => K
): Record<K, T[]> {
  return array.reduce((result, currentItem) => {
    const key = getKey(currentItem);
    if (!result[key]) {
      result[key] = [];
    }
    result[key].push(currentItem);
    return result;
  }, {} as Record<K, T[]>);
}
