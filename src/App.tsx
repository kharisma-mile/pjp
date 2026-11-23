import { useEffect, useState } from "react";
import { Boxes, CalendarRange, ClipboardCheck, GitBranch, LayoutDashboard, Store, UserRound, type LucideIcon } from "lucide-react";
import { AppProvider } from "@/store/app-store";
import { Topbar } from "@/components/topbar";
import { Toaster } from "@/components/toaster";
import { cn } from "@/lib/utils";
import { DashboardPage } from "@/pages/dashboard";
import { OutletsPage, ProductsPage, SalesmenPage } from "@/pages/master";
import { PipelinePage } from "@/pages/pipeline";
import { CallplanListPage } from "@/pages/callplan-list";
import { CallplanDetailPage } from "@/pages/callplan-detail";

interface NavItem { key: string; label: string; icon: LucideIcon; group: string }
const NAV: NavItem[] = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard, group: "" },
  { key: "products", label: "Product", icon: Boxes, group: "Master" },
  { key: "outlets", label: "Outlet", icon: Store, group: "Master" },
  { key: "salesmen", label: "Salesman", icon: UserRound, group: "Master" },
  { key: "pipeline", label: "Pipeline", icon: GitBranch, group: "Sales" },
  { key: "callplan", label: "Callplan", icon: CalendarRange, group: "Sales" },
];

const readHash = () => window.location.hash.replace(/^#\/?/, "") || "dashboard";
import { navigate } from "@/lib/nav";

function Shell() {
  const [route, setRoute] = useState(readHash);
  useEffect(() => {
    const on = () => setRoute(readHash());
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  const [base, param] = route.split("/");

  const page =
    base === "callplan" && param ? <CallplanDetailPage key={param} id={param} /> :
    ({
      dashboard: <DashboardPage />,
      products: <ProductsPage />,
      outlets: <OutletsPage />,
      salesmen: <SalesmenPage />,
      pipeline: <PipelinePage />,
      callplan: <CallplanListPage />,
    } as Record<string, JSX.Element>)[base] ?? <DashboardPage />;

  const groups = Array.from(new Set(NAV.map((n) => n.group)));
  return (
    <div className="flex h-screen w-full overflow-hidden bg-muted/40">
      <aside className="flex h-full w-[220px] shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-md bg-primary"><ClipboardCheck className="h-5 w-5 text-primary-foreground" /></div>
          <div className="leading-tight">
            <p className="text-sm font-bold text-foreground">Simple Callplan</p>
            <p className="text-xs text-muted-foreground">Unggul Plastik · demo</p>
          </div>
        </div>
        <nav className="mile-scroll flex-1 overflow-y-auto px-2 pb-4">
          {groups.map((g) => (
            <div key={g || "root"} className="pb-1">
              {g && <p className="px-2 pb-1 pt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{g}</p>}
              {NAV.filter((n) => n.group === g).map((n) => {
                const Icon = n.icon;
                const active = base === n.key;
                return (
                  <button key={n.key} onClick={() => navigate(n.key)}
                    className={cn("flex w-full items-center gap-3 rounded-md px-2 py-2 text-sm font-medium transition-colors",
                      active ? "bg-sidebar-accent text-sidebar-accent-foreground" : "text-sidebar-foreground hover:bg-muted")}>
                    <Icon className={cn("h-[18px] w-[18px]", active ? "text-primary" : "text-muted-foreground")} />
                    <span className="flex-1 text-left">{n.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </nav>
        <p className="border-t border-sidebar-border px-4 py-3 text-[11px] text-muted-foreground">Mockup demo · data dummy tersimpan di browser</p>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="mile-scroll flex-1 overflow-y-auto p-6">{page}</main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
      <Toaster />
    </AppProvider>
  );
}
