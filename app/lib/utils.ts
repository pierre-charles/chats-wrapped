export const fmt = (n: number) => Intl.NumberFormat("en-GB").format(n);

export const sortDesc = (data: Record<string, number>) =>
  Object.entries(data).sort((a, b) => b[1] - a[1]);

export const sumValues = (obj: Record<string, number>) =>
  Object.values(obj).reduce((a, b) => a + b, 0);
