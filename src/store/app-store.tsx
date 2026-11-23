import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { AuditAction, Callplan, CallplanLine, DemoUser, Opportunity, OppStage, Outlet, Product, Salesman } from "@/data/types";
import { CALLPLANS, OPPS, OUTLETS, PRODUCTS, SALESMEN, USERS } from "@/data/seed";
import { findOverlaps, overlapMessage } from "@/lib/callplan";
import { nowStamp } from "@/lib/format";

export interface Toast { id: number; tone?: "success" | "info" | "warning" | "danger"; title: string; desc?: string }
type Result = { ok: true; id?: string } | { ok: false; error: string };

interface Data { callplans: Callplan[]; opps: Opportunity[]; outlets: Outlet[]; salesmen: Salesman[]; products: Product[]; userId: string }
const KEY = "callplan-demo-v2";
const fresh = (): Data => ({ callplans: CALLPLANS, opps: OPPS, outlets: OUTLETS, salesmen: SALESMEN, products: PRODUCTS, userId: "U1" });
function load(): Data {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) return { ...fresh(), ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return fresh();
}

interface Ctx extends Data {
  user: DemoUser;
  users: DemoUser[];
  can: (perm: string) => boolean;
  switchUser: (id: string) => void;
  resetDemo: () => void;
  importCallplan: (p: { hub: string; startDate: string; endDate: string; fileName: string; lines: Omit<CallplanLine, "id">[] }) => Result;
  editCallplan: (id: string, patch: { startDate: string; endDate: string; lines: CallplanLine[] }, note: string) => Result;
  approveCallplan: (id: string) => Result;
  publishCallplan: (id: string) => Result;
  moveOpp: (id: string, stage: OppStage) => void;
  addOpp: (o: Omit<Opportunity, "id">) => void;
  toasts: Toast[];
  toast: (t: Omit<Toast, "id">) => void;
  dismissToast: (id: number) => void;
}

const AppCtx = createContext<Ctx | null>(null);
export const useApp = () => {
  const c = useContext(AppCtx);
  if (!c) throw new Error("useApp outside provider");
  return c;
};

let lineSeq = Date.now();

export function AppProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<Data>(load);
  const [toasts, setToasts] = useState<Toast[]>([]);
  useEffect(() => {
    try { localStorage.setItem(KEY, JSON.stringify(data)); } catch { /* ignore */ }
  }, [data]);

  const user = USERS.find((u) => u.id === data.userId) ?? USERS[0];
  const can = useCallback((perm: string) => user.perms.includes(perm), [user]);

  const toast = useCallback((t: Omit<Toast, "id">) => {
    const id = Date.now() + Math.random();
    setToasts((x) => [...x, { ...t, id }]);
    setTimeout(() => setToasts((x) => x.filter((y) => y.id !== id)), 4500);
  }, []);

  const log = (c: Callplan, action: AuditAction, note?: string, at = nowStamp()): Callplan => ({
    ...c, updatedBy: user.name, updatedAt: at, audit: [...c.audit, { at, by: user.name, action, note }],
  });
  const find = (id: string) => data.callplans.find((c) => c.id === id);
  const replace = (c: Callplan) => setData((d) => ({ ...d, callplans: d.callplans.map((x) => (x.id === c.id ? c : x)) }));

  const importCallplan: Ctx["importCallplan"] = (p) => {
    if (!can("import_callplan")) return { ok: false, error: "Tidak punya izin import_callplan" };
    if (p.endDate < p.startDate) return { ok: false, error: "End cycle date harus sama atau setelah start cycle date" };
    const ov = findOverlaps(data.callplans, p.hub, p.startDate, p.endDate);
    if (ov.length) return { ok: false, error: overlapMessage(ov[0]) };
    const ym = p.startDate.slice(0, 7).replace("-", "");
    const n = data.callplans.filter((c) => c.id.startsWith(`CP-${ym}-`)).length + 1;
    const id = `CP-${ym}-${String(n).padStart(3, "0")}`;
    const at = nowStamp();
    const cp: Callplan = {
      id, hub: p.hub, startDate: p.startDate, endDate: p.endDate, status: "Draft", fileName: p.fileName,
      lines: p.lines.map((l) => ({ ...l, id: `L${lineSeq++}` })),
      createdBy: user.name, createdAt: at, updatedBy: user.name, updatedAt: at,
      audit: [{ at, by: user.name, action: "Import", note: `${p.lines.length} baris dari ${p.fileName}` }],
    };
    setData((d) => ({ ...d, callplans: [cp, ...d.callplans] }));
    return { ok: true, id };
  };

  const editCallplan: Ctx["editCallplan"] = (id, patch, note) => {
    const c = find(id);
    if (!c) return { ok: false, error: "Callplan tidak ditemukan" };
    if (!can("edit_callplan")) return { ok: false, error: "Tidak punya izin edit_callplan" };
    if (c.status !== "Draft") return { ok: false, error: `Callplan sudah ${c.status}, tidak bisa diedit` };
    if (patch.endDate < patch.startDate) return { ok: false, error: "End cycle date harus sama atau setelah start cycle date" };
    const ov = findOverlaps(data.callplans, c.hub, patch.startDate, patch.endDate, id);
    if (ov.length) return { ok: false, error: overlapMessage(ov[0]) };
    replace(log({ ...c, ...patch }, "Edit", note));
    return { ok: true };
  };

  const approveCallplan: Ctx["approveCallplan"] = (id) => {
    const c = find(id);
    if (!c) return { ok: false, error: "Callplan tidak ditemukan" };
    if (!can("approve_callplan")) return { ok: false, error: "Tidak punya izin approve_callplan" };
    if (c.status !== "Draft") return { ok: false, error: `Status ${c.status}, hanya Draft yang bisa di-approve` };
    if (!c.lines.length) return { ok: false, error: "Callplan tidak punya baris" };
    const ov = findOverlaps(data.callplans, c.hub, c.startDate, c.endDate, id);
    if (ov.length) return { ok: false, error: overlapMessage(ov[0]) };
    replace(log({ ...c, status: "Approved" }, "Approve"));
    return { ok: true };
  };

  const publishCallplan: Ctx["publishCallplan"] = (id) => {
    const c = find(id);
    if (!c) return { ok: false, error: "Callplan tidak ditemukan" };
    if (!can("publish_callplan")) return { ok: false, error: "Tidak punya izin publish_callplan" };
    if (c.status !== "Approved") return { ok: false, error: "Hanya callplan Approved yang bisa di-publish" };
    replace(log({ ...c, status: "Published" }, "Publish", "Dikirim ke Mile Field sebagai jadwal kunjungan"));
    return { ok: true };
  };

  const value: Ctx = {
    ...data,
    user,
    users: USERS,
    can,
    switchUser: (id) => setData((d) => ({ ...d, userId: id })),
    resetDemo: () => setData({ ...fresh(), userId: data.userId }),
    importCallplan,
    editCallplan,
    approveCallplan,
    publishCallplan,
    moveOpp: (id, stage) => setData((d) => ({ ...d, opps: d.opps.map((o) => (o.id === id ? { ...o, stage } : o)) })),
    addOpp: (o) => setData((d) => ({ ...d, opps: [...d.opps, { ...o, id: `OP-${String(d.opps.length + 1).padStart(3, "0")}` }] })),
    toasts,
    toast,
    dismissToast: (id) => setToasts((x) => x.filter((y) => y.id !== id)),
  };
  return <AppCtx.Provider value={value}>{children}</AppCtx.Provider>;
}
