import type * as Highcharts from "highcharts";
import { useEffect, useState } from "react";

import { fmt } from "./utils";

function resolveColor(varName: string): string {
  const el = document.createElement("div");
  el.style.display = "none";
  el.style.color = `var(${varName})`;
  document.body.appendChild(el);
  const resolved = getComputedStyle(el).color;
  el.remove();
  return resolved;
}

const DEFAULT_COLORS = {
  emojis: "#2b7a9e",
  messages: "#a569bd",
  deleted: "#c9304d",
  avgUser: "#0f766e",
  avgDay: "#c2610c",
  heatmap: "#128c55",
  text: "#1a1a1a",
  muted: "#595959",
};

function resolveAll() {
  if (typeof document === "undefined") {
    return DEFAULT_COLORS;
  }
  return {
    emojis: resolveColor("--chart-emojis"),
    messages: resolveColor("--chart-messages"),
    deleted: resolveColor("--chart-deleted"),
    avgUser: resolveColor("--chart-avg-user"),
    avgDay: resolveColor("--chart-avg-day"),
    heatmap: resolveColor("--chart-heatmap"),
    text: resolveColor("--color-text"),
    muted: resolveColor("--color-text-muted"),
  };
}

export function useChartColors() {
  const [colors, setColors] = useState(DEFAULT_COLORS);

  useEffect(() => {
    const update = () => requestAnimationFrame(() => setColors(resolveAll()));
    update();
    const mq = matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  return colors;
}

function base(textColor: string): Highcharts.Options {
  return {
    title: { text: "" },
    credits: { enabled: false },
    legend: { enabled: false },
    chart: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      style: { fontFamily: "Geist, system-ui, sans-serif" },
    },
    tooltip: {
      enabled: true,
      style: { fontSize: "14px" },
      formatter() {
        return fmt((this as unknown as { y: number }).y);
      },
    },
    xAxis: {
      labels: { style: { fontSize: "14px", color: textColor } },
    },
    yAxis: {
      title: { text: "" },
      labels: { style: { fontSize: "14px", color: textColor } },
      gridLineColor: "transparent",
      min: 0,
    },
  };
}

export function barChart(
  categories: string[],
  data: number[],
  color: string,
  textColor = "#1a1a1a",
): Highcharts.Options {
  const b = base(textColor);
  return {
    ...b,
    xAxis: {
      ...b.xAxis,
      categories,
      labels: { ...(b.xAxis as Highcharts.XAxisOptions).labels, step: 1 },
    },
    series: [{ type: "bar", data, color, borderWidth: 0 }],
  };
}

export function lineChart(
  series: Highcharts.SeriesOptionsType[],
  textColor = "#1a1a1a",
): Highcharts.Options {
  const b = base(textColor);
  return {
    ...b,
    legend: { enabled: true, itemStyle: { color: textColor } },
    chart: { ...b.chart, type: "line" },
    xAxis: {
      type: "datetime",
      labels: { style: { fontSize: "14px", color: textColor } },
    },
    tooltip: {
      ...b.tooltip,
      shared: false,
    },
    series,
  };
}

export { fmt } from "./utils";
