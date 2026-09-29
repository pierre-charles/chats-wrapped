import { Fragment } from "react";
import { type ActiveHours, DayOfWeekSchema } from "../lib/schemas";
import { fmt } from "../lib/utils";

const DAYS = DayOfWeekSchema.options;
const HOURS = Array.from({ length: 24 }, (_, i) => String(i)) as string[];

export function Heatmap({
  activeHours,
  color,
  mutedColor,
}: {
  activeHours: ActiveHours;
  color: string;
  mutedColor: string;
}) {
  const maxCount = Math.max(
    1,
    ...DAYS.flatMap((d) => HOURS.map((h) => activeHours[d]?.[h] ?? 0)),
  );
  const sqrtMax = Math.sqrt(maxCount);

  return (
    <div className="heatmap">
      <div className="heatmap__corner" />
      {HOURS.map((h) => (
        <div key={h} className="heatmap__hour" style={{ color: mutedColor }}>
          {h.padStart(2, "0")}
        </div>
      ))}
      {DAYS.map((day) => (
        <Fragment key={day}>
          <div className="heatmap__day" style={{ color: mutedColor }}>
            {day.slice(0, 3)}
          </div>
          {HOURS.map((h) => {
            const count = activeHours[day]?.[h] ?? 0;
            const opacity = Math.sqrt(count) / sqrtMax;
            return (
              <div
                key={h}
                className="heatmap__cell"
                style={{
                  backgroundColor: color,
                  opacity: Math.max(0.05, opacity),
                }}
                title={`${day} ${h.padStart(2, "0")}:00 — ${fmt(count)} messages`}
              />
            );
          })}
        </Fragment>
      ))}
      <div className="heatmap__key">
        <span style={{ color: mutedColor }}>Less</span>
        <div
          className="heatmap__key-gradient"
          style={{
            background: `linear-gradient(to right, transparent, ${color})`,
          }}
        />
        <span style={{ color: mutedColor }}>More</span>
      </div>
    </div>
  );
}
