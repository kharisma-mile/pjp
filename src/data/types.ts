export type Hari = "Senin" | "Selasa" | "Rabu" | "Kamis" | "Jumat" | "Sabtu";
export type Siklus = "weekly" | "biweekly";
export type CallplanStatus = "Draft" | "Approved" | "Published";
export type AuditAction = "Import" | "Edit" | "Approve" | "Publish";

export interface Product { id: string; sku: string; name: string; category: string; uom: string; price: number }
export interface Outlet { id: string; name: string; hub: string; address: string; owner: string }
export interface Salesman { id: string; name: string; hub: string; phone: string }

export interface CallplanLine { id: string; outletId: string; salesmanId: string; hari: Hari; siklus: Siklus }

export interface AuditEntry { at: string; by: string; action: AuditAction; note?: string }

export interface Callplan {
  id: string;
  hub: string;
  startDate: string; // YYYY-MM-DD
  endDate: string;
  status: CallplanStatus;
  fileName: string;
  lines: CallplanLine[];
  createdBy: string;
  createdAt: string;
  updatedBy: string;
  updatedAt: string;
  audit: AuditEntry[];
}

export type OppStage = "Prospek" | "Dijadwalkan" | "Negosiasi" | "Menang" | "Batal";
export interface Opportunity { id: string; name: string; outletName: string; salesmanId: string; value: number; stage: OppStage; nextFollowUp: string }

export interface DemoUser { id: string; name: string; role: string; perms: string[] }
