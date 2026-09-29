import { index, type RouteConfig, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("stats", "routes/stats.tsx"),
  route("stats/:slug", "routes/user.tsx"),
] satisfies RouteConfig;
