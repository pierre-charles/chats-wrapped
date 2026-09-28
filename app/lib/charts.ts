import type * as Highcharts from "highcharts";

const fmt = (n: number) => Intl.NumberFormat("en-GB").format(n);

function base(textColor: string): Highcharts.Options {
  return {
    title: { text: "" },
    credits: { enabled: false },
    legend: { enabled: false },
    chart: {
      backgroundColor: "transparent",
      borderColor: "transparent",
      style: { fontFamily: "Geist, system-ui, sans-serif" }
    },
    tooltip: {
      enabled: true,
      style: { fontSize: "14px" },
      formatter() {
        return fmt((this as unknown as { y: number }).y);
      }
    },
    xAxis: {
      labels: { style: { fontSize: "14px", color: textColor } }
    },
    yAxis: {
      title: { text: "" },
      labels: { style: { fontSize: "14px", color: textColor } },
      gridLineColor: "transparent",
      min: 0
    }
  };
}

export function barChart(
  categories: string[],
  data: number[],
  color: string,
  textColor = "#1a1a1a"
): Highcharts.Options {
  const b = base(textColor);
  return {
    ...b,
    xAxis: { ...b.xAxis, categories },
    series: [{ type: "bar", data, color, borderWidth: 0 }]
  };
}

export function lineChart(
  series: Highcharts.SeriesOptionsType[],
  textColor = "#1a1a1a"
): Highcharts.Options {
  const b = base(textColor);
  return {
    ...b,
    legend: { enabled: true, itemStyle: { color: textColor } },
    chart: { ...b.chart, type: "line" },
    xAxis: {
      type: "datetime",
      labels: { style: { fontSize: "14px", color: textColor } }
    },
    tooltip: {
      ...b.tooltip,
      shared: false
    },
    series
  };
}

export { fmt };
