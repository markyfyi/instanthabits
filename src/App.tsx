import { id, transact, tx, useAuth } from "@instantdb/react";
import { Auth } from "./Auth";
import { InstantObject, useQuery } from "./util/instant";
import { RefObject, forwardRef } from "react";

export default function App() {
  const { user, isLoading: isAuthLoading, error: authError } = useAuth();
  const {
    isLoading: isTeamsLoading,
    error: queryError,
    data: teamsData,
    instantDebugRef,
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

  const { data: debug_allItemsData, instantDebugRef: allItemsDebugRef } =
    useQuery(allDataQuery__debug);

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
    <main className="py-2 mx-auto max-w-md">
      <div className="flex flex-col gap-2" ref={instantDebugRef}>
        <h1 className="text-xl font-bold">Instant Habits</h1>
        {teamsData?.teams.map((team) => (
          <div key={team.id} className="flex flex-col gap-2">
            <h2 className="text-lg font-bold mb-2">{team.name}</h2>
            {team.metrics.map((metric) => (
              <MetricsLogs key={metric.id} userId={userId} metric={metric} />
            ))}
          </div>
        ))}
      </div>

      <div
        ref={allItemsDebugRef}
        className="w-96 max-h-96 flex flex-col gap-2 p-4 bg-slate-200 rounded-sm fixed bottom-0 right-0"
      >
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

    function addMemberOps(id: string, nickname: string) {
      return [
        tx.members[id].update({
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
      ...addMemberOps(userId1, "marky"),
      ...addMemberOps(userId2, "stopa"),
      ...addMemberOps(userId3, "joeski"),

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

function MetricsLogs({
  metric,
  userId,
}: {
  metric: InstantObject;
  userId: string;
}) {
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
    <div key={metric.id} className="flex flex-col gap-2">
      <h3 className="font-bold">{metric.name}</h3>

      <div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            const form = e.target as HTMLFormElement;
            // @ts-expect-error elements key
            const value = parseInt(form.elements.namedItem("value")?.value);
            if (isNaN(value)) return;

            addLog(value);

            form.reset();
          }}
        >
          <input
            className="rounded w-full py-2 px-4 text-gray-700 border"
            name="value"
            type="text"
            placeholder="Value"
          />
          <button className="btn" type="submit">
            Log
          </button>
        </form>
      </div>

      {Object.values(logsByMemberId).map((logs) => {
        const member = logs[0]?.members[0];
        // this should never happen
        if (!member) return null;

        return (
          <div key={metric.id} className="mb-4">
            <h4 className="font-bold">{member.nickname}</h4>
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

  function addLog(value: any) {
    const logId = id();

    transact([
      tx.logs[logId].update({
        value,
        timestamp: new Date().toISOString(),
      }),
      tx.logs[logId].link({ metrics: metric.id }),
      tx.logs[logId].link({ members: userId }),
    ]);
  }
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
