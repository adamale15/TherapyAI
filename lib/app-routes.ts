export const appViewPaths = {
  home: "/",
  student: "/journal",
  personas: "/personas",
  practitioner: "/programs",
  briefing: "/briefing",
  session: "/session",
  summary: "/report",
} as const;

export type AppView = keyof typeof appViewPaths;

const pathToView = Object.fromEntries(
  Object.entries(appViewPaths).map(([view, path]) => [path, view])
) as Record<string, AppView>;

const caseScopedViews = new Set<AppView>(["briefing", "session", "summary"]);

function normalizePathname(pathname: string) {
  if (!pathname || pathname === "/") return "/";
  return pathname.replace(/\/+$/, "") || "/";
}

export function viewForPathname(pathname: string): AppView {
  return pathToView[normalizePathname(pathname)] ?? "home";
}

export function pathForView(
  view: AppView,
  options: { personaId?: string } = {}
) {
  const path = appViewPaths[view];

  if (!options.personaId || !caseScopedViews.has(view)) {
    return path;
  }

  return `${path}?case=${encodeURIComponent(options.personaId)}`;
}
