import type * as Highcharts from "highcharts";

const fmt = (n: number) => Intl.NumberFormat("en-GB").format(n);

const BASE: Highcharts.Options = {
  title: { text: "" },
  credits: { enabled: false },
  legend: { enabled: false },
  chart: {
    backgroundColor: "transparent",
    borderColor: "transparent",
    style: { fontFamily: "Inter, system-ui, sans-serif" }
  },
  tooltip: {
    enabled: true,
    style: { fontSize: "14px" },
    formatter() {
      return fmt((this as unknown as { y: number }).y);
    }
  },
  xAxis: {
    labels: { style: { fontSize: "14px" } }
  },
  yAxis: {
    title: { text: "" },
    labels: { style: { fontSize: "14px" } },
    min: 0
  }
};

export function barChart(
  categories: string[],
  data: number[],
  color: string
): Highcharts.Options {
  return {
    ...BASE,
    xAxis: { ...BASE.xAxis, categories },
    series: [{ type: "bar", data, color }]
  };
}

export function lineChart(
  series: Highcharts.SeriesOptionsType[]
): Highcharts.Options {
  return {
    ...BASE,
    legend: { enabled: true },
    chart: { ...BASE.chart, type: "line" },
    xAxis: {
      type: "datetime",
      labels: { style: { fontSize: "14px" } }
    },
    tooltip: {
      ...BASE.tooltip,
      shared: false
    },
    series
  };
}

export { fmt };
