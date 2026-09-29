import * as Highcharts from "highcharts";
import { HighchartsReact } from "highcharts-react-official";
import { useEffect, useMemo } from "react";
import { Link, useNavigate } from "react-router";
import { Heatmap } from "../components/heatmap";
import { barChart, lineChart, useChartColors } from "../lib/charts";
import { useChatData } from "../lib/chat-context";
import { DayOfWeekSchema, MEDIA_LABELS, SlugSchema } from "../lib/schemas";
import { fmt, sortDesc, sumValues } from "../lib/utils";

const formatDate = (date: Date) =>
  new Intl.DateTimeFormat("en-GB", {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(date);

const DAYS = DayOfWeekSchema.options;

export default function Stats() {
  const { data, clear } = useChatData();
  const navigate = useNavigate();
  const colors = useChartColors();

  useEffect(() => {
    if (!data) {
      navigate("/");
    }
  }, [data, navigate]);

  const stats = data?.stats;

  const messageSenders = useMemo(
    () => sortDesc(stats?.totalMessagesByUser ?? {}),
    [stats],
  );

  const topEmojis = useMemo(
    () => sortDesc(stats?.totalEmojisUsed ?? {}).slice(0, 10),
    [stats],
  );

  const deleters = useMemo(
    () => sortDesc(stats?.deletedMessagesCount ?? {}),
    [stats],
  );

  const monthlyTrendSeries = useMemo(() => {
    if (!data) {
      return [];
    }

    const allUsers = new Set<string>();
    for (const m of data.messagesPerUserPerMonth) {
      for (const user of Object.keys(m.users)) {
        allUsers.add(user);
      }
    }

    return Array.from(allUsers).map((user) => ({
      name: user,
      type: "line" as const,
      data: data.messagesPerUserPerMonth.map(({ month, users }) => [
        new Date(`${month}-01`).getTime(),
        users[user] ?? 0,
      ]),
    }));
  }, [data]);

  if (!data || !stats) {
    return null;
  }

  const totalEmojis = sumValues(stats.totalEmojisUsed);

  const avgPerUser = [...stats.averageMessagePerUserPerDay].sort(
    (a, b) => b.average - a.average,
  );

  const avgPerDay = DAYS.filter(
    (d) => stats.averageMessagePerIndividualDay[d],
  ).map((d) => ({
    day: d,
    ...stats.averageMessagePerIndividualDay[d],
  }));

  return (
    <main className="stats">
      <div className="stats__actions">
        <button
          type="button"
          className="stats__back"
          onClick={() => {
            clear();
            navigate("/");
          }}
        >
          Upload another
        </button>
      </div>

      <nav className="stats__nav">
        <h2>Contents</h2>
        <ol>
          <li>
            <a href="#podium">Top senders</a>
          </li>
          <li>
            <a href="#summary">Summary</a>
          </li>
          <li>
            <a href="#active-hours">Active hours</a>
          </li>
          <li>
            <a href="#messages-trends">Messages sent trends</a>
          </li>
          <li>
            <a href="#messages-sent">Messages sent ranked</a>
          </li>
          <li>
            <a href="#top-emojis">Top 10 emojis used</a>
          </li>
          <li>
            <a href="#avg-per-person">Average daily messages per person</a>
          </li>
          <li>
            <a href="#avg-per-day">Average messages per day of week</a>
          </li>
          <li>
            <a href="#messages-deleted">Messages deleted ranked</a>
          </li>
          <li>
            <a href="#users">Users</a>
          </li>
        </ol>
      </nav>

      <section className="stats__section" id="podium">
        <h2>Top senders</h2>
        <div className="podium">
          {messageSenders.slice(0, 3).map(([name, count], i) => (
            <div key={name} className={`podium__place podium__place--${i + 1}`}>
              <span className="podium__medal">{["🥇", "🥈", "🥉"][i]}</span>
              <span className="podium__name">{name}</span>
              <span className="podium__count">{fmt(count)} messages</span>
            </div>
          ))}
        </div>
      </section>

      <section className="stats__section" id="summary">
        <h2>Summary</h2>
        <div className="summary">
          <div className="summary__card">
            <h3>Days active</h3>
            <p>{fmt(stats.days)}</p>
          </div>
          <div className="summary__card">
            <h3>Messages sent</h3>
            <p>{fmt(stats.totalMessages)}</p>
          </div>
          <div className="summary__card">
            <h3>Avg messages per day</h3>
            <p>{fmt(stats.averageMessagePerDay)}</p>
          </div>
          <div className="summary__card">
            <h3>Most active day</h3>
            <p>{formatDate(stats.mostActiveDay.date)}</p>
            <small>{fmt(stats.mostActiveDay.totalMessages)} messages</small>
          </div>
          <div className="summary__card">
            <h3>Least active day</h3>
            <p>{formatDate(stats.leastActiveDay.date)}</p>
            <small>{fmt(stats.leastActiveDay.totalMessages)} messages</small>
          </div>
          <div className="summary__card">
            <h3>Emojis sent</h3>
            <p>{fmt(totalEmojis)}</p>
          </div>
          {MEDIA_LABELS.map(([key, label]) => {
            const total = sumValues(stats.totalMediaSent[key]);
            if (total === 0) {
              return null;
            }
            return (
              <div className="summary__card" key={key}>
                <h3>{label}</h3>
                <p>{fmt(total)}</p>
              </div>
            );
          })}
        </div>
      </section>

      <section className="stats__section" id="active-hours">
        <h2>Active hours</h2>
        <Heatmap
          activeHours={stats.activeHours}
          color={colors.heatmap}
          mutedColor={colors.muted}
        />
      </section>

      <section className="stats__section" id="messages-trends">
        <h2>Messages sent trends</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={lineChart(monthlyTrendSeries, colors.text)}
        />
      </section>

      <section className="stats__section" id="messages-sent">
        <h2>Messages sent ranked</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={barChart(
            messageSenders.map(([u]) => u),
            messageSenders.map(([, c]) => c),
            colors.messages,
            colors.text,
          )}
        />
      </section>

      <section className="stats__section" id="top-emojis">
        <h2>Top 10 emojis used</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={barChart(
            topEmojis.map(([e]) => e),
            topEmojis.map(([, c]) => c),
            colors.emojis,
            colors.text,
          )}
        />
      </section>

      <section className="stats__section" id="avg-per-person">
        <h2>Average daily messages per person</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={barChart(
            avgPerUser.map((d) => d.user),
            avgPerUser.map((d) => d.average),
            colors.avgUser,
            colors.text,
          )}
        />
      </section>

      <section className="stats__section" id="avg-per-day">
        <h2>Average messages per day of week</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={barChart(
            avgPerDay.map((d) => d.day),
            avgPerDay.map((d) => d.average),
            colors.avgDay,
            colors.text,
          )}
        />
      </section>

      <section className="stats__section" id="messages-deleted">
        <h2>Messages deleted ranked</h2>
        <HighchartsReact
          highcharts={Highcharts}
          options={barChart(
            deleters.map(([u]) => u),
            deleters.map(([, c]) => c),
            colors.deleted,
            colors.text,
          )}
        />
      </section>

      <section className="stats__section" id="users">
        <h2>Users</h2>
        <div className="user-list">
          {messageSenders.map(([name, count]) => (
            <Link
              key={name}
              to={`/stats/${SlugSchema.parse(name)}`}
              className="user-list__item"
            >
              <span className="user-list__name">{name}</span>
              <span className="user-list__bottom">
                <span className="user-list__count">{fmt(count)} messages</span>
                <span className="user-list__arrow">→</span>
              </span>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
