import * as Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";
import { useEffect, useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { Heatmap } from "../components/heatmap";
import { barChart, lineChart, useChartColors } from "../lib/charts";
import { useChatData } from "../lib/chat-context";
import { MEDIA_LABELS, UserSlugParamsSchema } from "../lib/schemas";
import { fmt, sortDesc } from "../lib/utils";

export default function User() {
  const { data, slugMap } = useChatData();
  const navigate = useNavigate();
  const rawParams = useParams();
  const colors = useChartColors();
  const params = UserSlugParamsSchema.safeParse(rawParams);

  useEffect(() => {
    if (!data) {
      navigate("/");
    }
  }, [data, navigate]);

  const user = params.success ? (slugMap.get(params.data.slug) ?? null) : null;

  useEffect(() => {
    if (data && !user) {
      navigate("/stats");
    }
  }, [data, user, navigate]);

  const stats = data?.stats;

  const rank = useMemo(() => {
    if (!stats || !user) {
      return 0;
    }
    const sorted = sortDesc(stats.totalMessagesByUser);
    return sorted.findIndex(([u]) => u === user) + 1;
  }, [stats, user]);

  const trendSeries = useMemo(() => {
    if (!data || !user) {
      return [];
    }
    return [
      {
        name: user,
        type: "line" as const,
        data: data.messagesPerUserPerMonth.map(({ month, users }) => [
          new Date(`${month}-01`).getTime(),
          users[user] ?? 0,
        ]),
      },
    ];
  }, [data, user]);

  if (!data || !stats || !user) {
    return null;
  }

  const userEmojis = sortDesc(stats.emojisUsedByUser[user] ?? {}).slice(0, 10);
  const userActiveHours = stats.activeHoursByUser[user] ?? {
    Monday: {},
    Tuesday: {},
    Wednesday: {},
    Thursday: {},
    Friday: {},
    Saturday: {},
    Sunday: {},
  };

  const totalMessages = stats.totalMessagesByUser[user] ?? 0;
  const deletedCount = stats.deletedMessagesCount[user] ?? 0;
  const deletedRank =
    sortDesc(stats.deletedMessagesCount).findIndex(([u]) => u === user) + 1;
  const dailyAvg =
    stats.averageMessagePerUserPerDay.find((u) => u.user === user)?.average ??
    0;

  return (
    <main className="stats">
      <div className="stats__actions">
        <Link to="/stats" className="stats__back">
          Back to dashboard
        </Link>
      </div>

      <section className="stats__section">
        <h2>{user}</h2>
        <div className="summary">
          <div className="summary__card">
            <h3>Rank</h3>
            <p>
              #{rank} of {data.users.length}
            </p>
          </div>
          <div className="summary__card">
            <h3>Messages sent</h3>
            <p>{fmt(totalMessages)}</p>
          </div>
          <div className="summary__card">
            <h3>Avg per day</h3>
            <p>{fmt(dailyAvg)}</p>
          </div>
          <div className="summary__card">
            <h3>Deleted</h3>
            <p>{fmt(deletedCount)}</p>
            <small>
              #{deletedRank} of {data.users.length}
            </small>
          </div>
          {MEDIA_LABELS.map(([key, label]) => {
            const count = stats.totalMediaSent[key][user] ?? 0;
            if (count === 0) {
              return null;
            }
            return (
              <div className="summary__card" key={key}>
                <h3>{label}</h3>
                <p>{fmt(count)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="stats__section">
        <h2>Message trend</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={lineChart(trendSeries, colors.text)}
        />
      </section>

      {userEmojis.length > 0 && (
        <section className="stats__section">
          <h2>Top 10 emojis</h2>
          <HighchartsReact
            highcharts={Highcharts}
            options={barChart(
              userEmojis.map(([e]) => e),
              userEmojis.map(([, c]) => c),
              colors.emojis,
              colors.text,
            )}
          />
        </section>
      )}

      <section className="stats__section">
        <h2>Active hours</h2>
        <Heatmap
          activeHours={userActiveHours}
          color={colors.heatmap}
          mutedColor={colors.muted}
        />
      </section>
    </main>
  );
}
