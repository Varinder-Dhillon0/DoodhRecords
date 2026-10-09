import type { MainTabParamList } from "../types";

type TabRouteName = keyof MainTabParamList;

export type TabRouteConfig = {
  name: TabRouteName;
  activeIcon: string;
  inactiveIcon: string;
};

export const TAB_ROUTES: TabRouteConfig[] = [
  { name: "Home", activeIcon: "home", inactiveIcon: "home-outline" },
  {
    name: "Entries",
    activeIcon: "clipboard-text",
    inactiveIcon: "clipboard-text-outline",
  },
  {
    name: "Reports",
    activeIcon: "chart-box",
    inactiveIcon: "chart-box-outline",
  },
  { name: "Settings", activeIcon: "cog", inactiveIcon: "cog-outline" },
];

export const getTabIcon = (
  name: TabRouteName,
  focused: boolean,
): string => {
  const route = TAB_ROUTES.find((item) => item.name === name);
  if (!route) return "circle";
  return focused ? route.activeIcon : route.inactiveIcon;
};
