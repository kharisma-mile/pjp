import { CalendarCheck2, CalendarRange, FileClock, Store } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { StatCard } from "@/components/stat-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ActionBadge, StatusBadge } from "@/components/status-badge";
import { useApp } from "@/store/app-store";
import { HUBS } from "@/data/seed";
import { fmtDate, todayIso } from "@/lib/format";
import { navigate } from "@/lib/nav";

export function DashboardPage() {
  const { callplans, outlets, salesmen } = useApp();
  const today = todayIso();
  const count = (s: string) => callplans.filter((c) => c.status === s).length;
  const activity = callplans.flatMap((c) => c.audit.map((a) => ({ ...a, cp: c }))).sort((a, b) => b.at.localeCompare(a.at)).slice(0, 8);

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" subtitle={`Ringkasan callplan · hari ini ${fmtDate(today)}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Callplan Draft" value={String(count("Draft"))} hint="Menunggu approve" icon={FileClock} tone="warning" onClick={() => navigate("callplan")} />
        <StatCard label="Callplan Approved" value={String(count("Approved"))} hint="Siap di-publish" icon={CalendarRange} onClick={() => navigate("callplan")} />
        <StatCard label="Callplan Published" value={String(count("Published"))} hint="Sudah di Mile Field" icon={CalendarCheck2} tone="success" onClick={() => navigate("callplan")} />
        <StatCard label="Outlet / Salesman" value={`${outlets.length} / ${salesmen.length}`} hint="Master data" icon={Store} tone="orange" />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">Siklus per Hub</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Hub</TableHead><TableHead>Siklus berjalan</TableHead><TableHead>Siklus berikutnya</TableHead></TableRow></TableHeader>
              <TableBody>
                {HUBS.map((h) => {
                  const mine = callplans.filter((c) => c.hub === h).sort((a, b) => a.startDate.localeCompare(b.startDate));
                  const cur = mine.find((c) => c.startDate <= today && today <= c.endDate);
                  const next = mine.find((c) => c.startDate > today);
                  const cell = (c?: typeof cur) => c ? (
                    <button className="flex items-center gap-2 text-left hover:underline" onClick={() => navigate(`callplan/${c.id}`)}>
                      <span className="text-sm">{fmtDate(c.startDate)} – {fmtDate(c.endDate)}</span><StatusBadge s={c.status} />
                    </button>
                  ) : <span className="text-sm text-muted-foreground">Belum ada</span>;
                  return <TableRow key={h}><TableCell className="font-medium">{h}</TableCell><TableCell>{cell(cur)}</TableCell><TableCell>{cell(next)}</TableCell></TableRow>;
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Aktivitas terakhir</CardTitle></CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader><TableRow><TableHead>Waktu</TableHead><TableHead>Callplan</TableHead><TableHead>Aksi</TableHead><TableHead>Oleh</TableHead></TableRow></TableHeader>
              <TableBody>
                {activity.map((a, i) => (
                  <TableRow key={i}>
                    <TableCell className="whitespace-nowrap text-xs text-muted-foreground">{fmtDate(a.at)}</TableCell>
                    <TableCell><button className="font-medium text-primary hover:underline" onClick={() => navigate(`callplan/${a.cp.id}`)}>{a.cp.id}</button></TableCell>
                    <TableCell><ActionBadge a={a.action} /></TableCell>
                    <TableCell className="text-sm">{a.by}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
