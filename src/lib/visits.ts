import type { Callplan, Product } from "@/data/types";
import { visitDates } from "@/lib/callplan";

/** Deterministic 0..1 from a string (stable dummy results across reloads). */
function hash01(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 10000) / 10000;
}

export interface Visit { callplanId: string; hub: string; salesmanId: string; outletId: string; date: string; done: boolean; effective: boolean; value: number; productId?: string }

/**
 * Dummy visit results as they would come back from Mile Field (webhook):
 * only Published callplans, only dates up to today.
 * ~88% of planned calls are visited; ~60% of visits are effective (with an order).
 */
export function buildVisits(callplans: Callplan[], products: Product[], today: string): Visit[] {
  const out: Visit[] = [];
  callplans.filter((c) => c.status === "Published").forEach((c) =>
    c.lines.forEach((l) =>
      visitDates(c.startDate, c.endDate, l.hari, l.siklus).filter((d) => d <= today).forEach((date) => {
        const k = `${c.id}|${l.id}|${date}`;
        const sBias = (Number(l.salesmanId.slice(1)) % 4) * 0.04; // some salesmen do worse
        const done = hash01(k + "v") < 0.92 - sBias;
        const effective = done && hash01(k + "e") < 0.64 - sBias;
        const value = effective ? Math.round((0.8 + hash01(k + "n") * 3.7) * 1_000_000 / 10000) * 10000 : 0;
        out.push({ callplanId: c.id, hub: c.hub, salesmanId: l.salesmanId, outletId: l.outletId, date, done, effective, value, productId: effective ? products[Math.floor(hash01(k + "p") * products.length)].id : undefined });
      })
    )
  );
  return out;
}

export const pct = (a: number, b: number) => (b === 0 ? 0 : Math.round((a / b) * 100));

export function rupiahShort(n: number) {
  if (Math.abs(n) >= 1_000_000_000) return `Rp ${(n / 1_000_000_000).toLocaleString("id-ID", { maximumFractionDigits: 2 })} M`;
  if (Math.abs(n) >= 1_000_000) return `Rp ${(n / 1_000_000).toLocaleString("id-ID", { maximumFractionDigits: 1 })} jt`;
  return "Rp " + Math.round(n).toLocaleString("id-ID");
}
