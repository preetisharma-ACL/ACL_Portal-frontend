import { type RouteDefinition } from "@solidjs/router";
import { requireMeQuery, savedQuery, trackingQuery, myLeadsQuery } from "~/lib/queries";
import AccountDashboard from "~/pages/AccountDashboard";

export const route = {
  // requireMeQuery issues the SSR redirect to the login prompt when not authed;
  // the rest warm the dashboard data.
  preload: () => {
    void requireMeQuery();
    void savedQuery();
    void trackingQuery();
    void myLeadsQuery();
  },
} satisfies RouteDefinition;

export default function AccountRoute() {
  return <AccountDashboard />;
}
