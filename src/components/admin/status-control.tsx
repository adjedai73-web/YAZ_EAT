"use client";
import { useState, useTransition } from "react";
import { updateOrderStatus } from "@/lib/admin/actions";
import { STATUS_LABELS, STATUS_FLOW } from "@/lib/format";
import type { OrderStatus, OrderType } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/misc";
import { toast } from "@/components/ui/toast";
import { ConfirmButton } from "./confirm-button";

/** One-tap "next step" button + full status list + cancel with confirmation. */
export function StatusControl({ orderId, status, orderType }: { orderId: string; status: OrderStatus; orderType: OrderType }) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const flow = orderType === "PICKUP" ? STATUS_FLOW.filter((s) => s !== "OUT_FOR_DELIVERY") : STATUS_FLOW;
  const idx = flow.indexOf(status);
  const next = idx >= 0 && idx < flow.length - 1 ? flow[idx + 1] : null;

  const set = (s: OrderStatus, reason?: string) => start(async () => {
    setError(null);
    const res = await updateOrderStatus(orderId, s, reason);
    if (res?.error) setError(res.error); else toast(`Statut : ${STATUS_LABELS[s]}`);
  });

  return (
    <div className="space-y-3">
      {error && <Alert>{error}</Alert>}
      {next && status !== "CANCELLED" && (
        <Button size="lg" className="w-full" loading={pending} onClick={() => set(next)}>
          Passer à « {orderType === "PICKUP" && next === "DELIVERED" ? "Récupérée" : STATUS_LABELS[next]} »
        </Button>
      )}
      <label className="block text-sm font-semibold" htmlFor="status-select">Changer le statut</label>
      <select id="status-select" value={status} disabled={pending} onChange={(e) => set(e.target.value as OrderStatus)}
        className="h-11 w-full rounded-[var(--radius-control)] border border-line bg-paper px-3">
        {flow.map((s) => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
        <option value="CANCELLED">{STATUS_LABELS.CANCELLED}</option>
      </select>
      {status !== "CANCELLED" && status !== "DELIVERED" && (
        <ConfirmButton
          label="Annuler la commande"
          title="Annuler cette commande ?"
          description="Le client verra la commande comme annulée sur sa page de suivi."
          confirmLabel="Annuler la commande"
          withReason
          onConfirm={(reason) => set("CANCELLED", reason)}
          variant="danger-outline"
        />
      )}
    </div>
  );
}
