import { Badge } from "@/components/ui/badge";
import type { AuditAction, CallplanStatus } from "@/data/types";

const S: Record<CallplanStatus, "warning" | "info" | "success"> = { Draft: "warning", Approved: "info", Published: "success" };
export const StatusBadge = ({ s }: { s: CallplanStatus }) => <Badge variant={S[s]}>{s}</Badge>;

const A: Record<AuditAction, "neutral" | "orange" | "info" | "success"> = { Import: "neutral", Edit: "orange", Approve: "info", Publish: "success" };
export const ActionBadge = ({ a }: { a: AuditAction }) => <Badge variant={A[a]}>{a}</Badge>;
