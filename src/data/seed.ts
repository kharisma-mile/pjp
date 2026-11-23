import type { Callplan, DemoUser, Hari, Opportunity, Outlet, Product, Salesman, Siklus } from "./types";

export const HUBS = ["Jakarta", "Bandung", "Surabaya", "Semarang"];
export const HARI: Hari[] = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
export const SIKLUS: Siklus[] = ["weekly", "biweekly"];

/** Demo users. Who can do what is decided only by the permissions on the user (no role names in logic). */
export const USERS: DemoUser[] = [
  { id: "U1", name: "Rina Admin", role: "Admin Sales", perms: ["import_callplan", "edit_callplan"] },
  { id: "U2", name: "Dewi Supervisor", role: "Sales Supervisor", perms: ["approve_callplan", "publish_callplan"] },
  { id: "U3", name: "Kharisma", role: "Super Admin", perms: ["import_callplan", "edit_callplan", "approve_callplan", "publish_callplan"] },
];

export const PRODUCTS: Product[] = [
  { id: "P1", sku: "UP-KR-001", name: "Kursi Plastik Napolly", category: "Furniture", uom: "Pcs", price: 85000 },
  { id: "P2", sku: "UP-EM-002", name: "Ember Tutup 25L", category: "Household", uom: "Pcs", price: 42000 },
  { id: "P3", sku: "UP-BK-003", name: "Baskom Bulat 40cm", category: "Household", uom: "Pcs", price: 18000 },
  { id: "P4", sku: "UP-CT-004", name: "Container Box 50L", category: "Storage", uom: "Pcs", price: 120000 },
  { id: "P5", sku: "UP-GL-005", name: "Gelas Plastik 12oz (isi 50)", category: "Packaging", uom: "Pak", price: 23000 },
  { id: "P6", sku: "UP-TS-006", name: "Tempat Sampah Injak 20L", category: "Household", uom: "Pcs", price: 95000 },
  { id: "P7", sku: "UP-RK-007", name: "Rak Susun 4 Tingkat", category: "Storage", uom: "Pcs", price: 210000 },
  { id: "P8", sku: "UP-MJ-008", name: "Meja Lipat Plastik", category: "Furniture", uom: "Pcs", price: 175000 },
];

export const SALESMEN: Salesman[] = [
  { id: "S1", name: "Haris", hub: "Jakarta", phone: "0812-1100-2201" },
  { id: "S2", name: "Budi", hub: "Jakarta", phone: "0812-1100-2202" },
  { id: "S3", name: "Andre", hub: "Bandung", phone: "0812-1100-2203" },
  { id: "S4", name: "Sari", hub: "Surabaya", phone: "0812-1100-2204" },
  { id: "S5", name: "Yoga", hub: "Semarang", phone: "0812-1100-2205" },
];

const o = (id: string, name: string, hub: string, address: string, owner: string): Outlet => ({ id, name, hub, address, owner });
export const OUTLETS: Outlet[] = [
  o("O1", "Toko Haris", "Jakarta", "Jl. Pasar Baru 12, Jakarta Pusat", "Pak Haris"),
  o("O2", "Toko Sandhy", "Jakarta", "Jl. Tebet Raya 45, Jakarta Selatan", "Pak Sandhy"),
  o("O3", "Toko Frengky", "Jakarta", "Jl. Mangga Dua 8, Jakarta Utara", "Pak Frengky"),
  o("O4", "Toko Mile", "Jakarta", "Jl. Kemang Raya 20, Jakarta Selatan", "Bu Mila"),
  o("O5", "Toko Sumber Rejeki", "Jakarta", "Jl. Cempaka Putih 3, Jakarta Pusat", "Pak Hendra"),
  o("O6", "Toko Maju Jaya", "Jakarta", "Jl. Kramat Jati 77, Jakarta Timur", "Bu Lina"),
  o("O7", "Toko Plastik Abadi", "Bandung", "Jl. Kosambi 15, Bandung", "Pak Ujang"),
  o("O8", "Toko Sinar Baru", "Bandung", "Jl. Cibadak 40, Bandung", "Bu Euis"),
  o("O9", "Toko Berkah", "Surabaya", "Jl. Pasar Atom 9, Surabaya", "Pak Slamet"),
  o("O10", "Toko Sentosa", "Surabaya", "Jl. Kapasan 21, Surabaya", "Bu Ning"),
  o("O11", "Toko Laris", "Semarang", "Jl. Johar 5, Semarang", "Pak Joko"),
];

export const OPPS: Opportunity[] = [
  { id: "OP-001", name: "Order perdana kursi", outletName: "Toko Sumber Rejeki", salesmanId: "S1", value: 8500000, stage: "Prospek", nextFollowUp: "2026-11-25" },
  { id: "OP-002", name: "Restock container box", outletName: "Toko Maju Jaya", salesmanId: "S2", value: 12000000, stage: "Dijadwalkan", nextFollowUp: "2026-11-24" },
  { id: "OP-003", name: "Produk baru rak susun", outletName: "Toko Plastik Abadi", salesmanId: "S3", value: 6300000, stage: "Negosiasi", nextFollowUp: "2026-11-26" },
  { id: "OP-004", name: "Proyek meja lipat sekolah", outletName: "Toko Berkah", salesmanId: "S4", value: 35000000, stage: "Negosiasi", nextFollowUp: "2026-11-27" },
  { id: "OP-005", name: "Gelas plastik katering", outletName: "Toko Laris", salesmanId: "S5", value: 4600000, stage: "Menang", nextFollowUp: "2026-11-20" },
  { id: "OP-006", name: "Ember grosir", outletName: "Toko Sentosa", salesmanId: "S4", value: 3100000, stage: "Batal", nextFollowUp: "2026-11-18" },
];

const line = (n: number, outletId: string, salesmanId: string, hari: Hari, siklus: Siklus) => ({ id: `L${n}`, outletId, salesmanId, hari, siklus });

export const CALLPLANS: Callplan[] = [
  {
    id: "CP-202611-001", hub: "Jakarta", startDate: "2026-11-09", endDate: "2026-11-20", status: "Published", fileName: "callplan_jakarta_9-20nov.xlsx",
    lines: [line(1, "O1", "S1", "Senin", "weekly"), line(2, "O2", "S1", "Selasa", "biweekly"), line(3, "O5", "S2", "Rabu", "weekly"), line(4, "O6", "S2", "Kamis", "weekly")],
    createdBy: "Rina Admin", createdAt: "2026-11-06 09:12", updatedBy: "Dewi Supervisor", updatedAt: "2026-11-07 10:05",
    audit: [
      { at: "2026-11-06 09:12", by: "Rina Admin", action: "Import", note: "4 baris dari callplan_jakarta_9-20nov.xlsx" },
      { at: "2026-11-06 14:30", by: "Rina Admin", action: "Edit", note: "Toko Sandhy: siklus weekly → biweekly" },
      { at: "2026-11-07 09:40", by: "Dewi Supervisor", action: "Approve" },
      { at: "2026-11-07 10:05", by: "Dewi Supervisor", action: "Publish", note: "Dikirim ke Mile Field sebagai jadwal kunjungan" },
    ],
  },
  {
    id: "CP-202611-002", hub: "Surabaya", startDate: "2026-11-23", endDate: "2026-12-04", status: "Approved", fileName: "callplan_sby_23nov-4des.xlsx",
    lines: [line(5, "O9", "S4", "Senin", "weekly"), line(6, "O10", "S4", "Rabu", "biweekly")],
    createdBy: "Rina Admin", createdAt: "2026-11-19 08:30", updatedBy: "Dewi Supervisor", updatedAt: "2026-11-20 16:10",
    audit: [
      { at: "2026-11-19 08:30", by: "Rina Admin", action: "Import", note: "2 baris dari callplan_sby_23nov-4des.xlsx" },
      { at: "2026-11-20 16:10", by: "Dewi Supervisor", action: "Approve" },
    ],
  },
  {
    id: "CP-202611-003", hub: "Bandung", startDate: "2026-11-30", endDate: "2026-12-11", status: "Draft", fileName: "callplan_bdg.xlsx",
    lines: [line(7, "O7", "S3", "Selasa", "weekly"), line(8, "O8", "S3", "Kamis", "biweekly")],
    createdBy: "Rina Admin", createdAt: "2026-11-21 11:00", updatedBy: "Rina Admin", updatedAt: "2026-11-21 11:00",
    audit: [{ at: "2026-11-21 11:00", by: "Rina Admin", action: "Import", note: "2 baris dari callplan_bdg.xlsx" }],
  },
];
