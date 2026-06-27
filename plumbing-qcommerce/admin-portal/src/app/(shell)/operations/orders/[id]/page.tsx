/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import StatusBadge from "@/components/admin-shell/StatusBadge";
import { cancelOperationsProductOrder, getOperationsProductOrder, reassignDelivery, type OperationsProductOrderDetail } from "@/services/operationsService";
import { currency, formatDate, statusTone } from "../../operationsHelpers";

export default function OperationsOrderDetailPage() {
  const params = useParams<{ id: string }>();
  const [order, setOrder] = useState<OperationsProductOrderDetail | null>(null);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      setOrder(await getOperationsProductOrder(params.id));
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Unable to load order");
    }
  }, [params.id]);

  useEffect(() => { void load(); }, [load]);

  async function cancelOrder() {
    if (!order) return;
    const reason = window.prompt("Cancellation reason");
    if (!reason) return;
    await cancelOperationsProductOrder(order.orderId, reason);
    await load();
  }

  async function reassign() {
    if (!order) return;
    const partner = Number(window.prompt("New delivery partner user ID"));
    if (!partner) return;
    const reason = window.prompt("Reassignment reason") || "Operations reassignment";
    await reassignDelivery(order.orderId, partner, reason);
    await load();
  }

  return (
    <div className="stack">
      <section className="panel">
        <div className="page-header">
          <div><h1 className="page-title">Product Order #{params.id}</h1><p className="page-subtitle">Order details, customer, store, items, payment, and delivery assignment.</p></div>
          {order ? <StatusBadge tone={order.delayFlag ? "warning" : statusTone(order.status)}>{order.delayFlag ? "DELAYED" : order.status}</StatusBadge> : null}
        </div>
        {error ? <div className="field-error">{error}</div> : null}
        <div className="page-actions"><button className="button button-secondary" onClick={() => void reassign()}>Reassign Delivery</button><button className="button button-danger" onClick={() => void cancelOrder()}>Cancel Order</button></div>
      </section>
      {order ? <>
        <section className="panel"><div className="detail-grid"><div className="detail-card"><div className="detail-label">Customer</div><div className="detail-value">{order.customer?.name ?? "-"}<br />{order.customer?.phone ?? "-"}<br />{order.customer?.email ?? "-"}</div></div><div className="detail-card"><div className="detail-label">Store</div><div className="detail-value">{order.store?.name ?? "-"}<br />{order.store?.address ?? "-"}</div></div><div className="detail-card"><div className="detail-label">Payment</div><div className="detail-value">{order.paymentStatus} - {currency(order.totalAmount)}</div></div><div className="detail-card"><div className="detail-label">Delivery Partner</div><div className="detail-value">{order.deliveryPartner?.name ?? "Unassigned"}<br />{order.deliveryPartner?.phone ?? ""}</div></div></div></section>
        <section className="panel"><div className="panel-header"><h2 className="panel-title">Items</h2><span className="panel-note">Created {formatDate(order.createdAt)}</span></div><div className="table-shell"><table className="table"><thead><tr><th>Product</th><th>Quantity</th><th>Price</th></tr></thead><tbody>{order.items.map((item, index) => <tr key={`${item.productId ?? index}-${index}`}><td>{item.productName}</td><td>{item.quantity}</td><td>{currency(item.price)}</td></tr>)}</tbody></table></div></section>
      </> : null}
    </div>
  );
}