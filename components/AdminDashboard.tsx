 "use client";

import { useEffect, useMemo, useState } from "react";
import { BarChart3, Check, Moon, Package, Search, Sun, Truck } from "lucide-react";
import { hydrateOrders, loadOrders, Order, ORDERS_UPDATED_EVENT, ORDER_STATUSES, updateOrder } from "../data/orderStore";

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>(loadOrders);
  const [filter, setFilter] = useState("All");
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem("gbp-dark-mode") === "true";
    setDark(saved);
    document.body.classList.toggle("darkMode", saved);
    const refresh = () => setOrders(loadOrders());
    hydrateOrders().then(setOrders);
    window.addEventListener(ORDERS_UPDATED_EVENT, refresh);
    window.addEventListener("storage", refresh);
    return () => { window.removeEventListener(ORDERS_UPDATED_EVENT, refresh); window.removeEventListener("storage", refresh); };
  }, []);

  const toggleTheme = () => { const next = !dark; setDark(next); window.localStorage.setItem("gbp-dark-mode", String(next)); document.body.classList.toggle("darkMode", next); };
  const filteredOrders = useMemo(() => orders.filter(order => (filter === "All" || order.status === filter) && `${order.id} ${order.customer.firstName} ${order.customer.lastName} ${order.customer.email}`.toLowerCase().includes(query.toLowerCase())), [orders, filter, query]);
  const revenue = orders.reduce((sum, order) => sum + order.total, 0);
  const activeShipments = orders.filter(order => order.status !== "Delivered").length;
  const delivered = orders.filter(order => order.status === "Delivered").length;
  const statusCounts = ORDER_STATUSES.map(status => ({ status, count: orders.filter(order => order.status === status).length }));
  const maxCount = Math.max(1, ...statusCounts.map(item => item.count));
  const advanceOrder = async (order: Order) => { const nextIndex = Math.min(ORDER_STATUSES.indexOf(order.status) + 1, ORDER_STATUSES.length - 1); await updateOrder(order.id, { status: ORDER_STATUSES[nextIndex], trackingNumber: nextIndex >= 5 ? `GBP-${order.id.slice(-6)}` : order.trackingNumber }); setOrders(loadOrders()); };
  const signOut = async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.assign("/admin/login"); };

  return (
    <div className="admin adminDashboard">
      <header className="adminTop"><div className="container adminNav"><a href="/admin" className="adminBrand"><span className="logoMark">GBP</span><span>GBP ADMIN • ORDER MANAGEMENT</span></a><div className="adminLinks"><a className="active" href="/admin">Orders</a><a href="/admin/inventory">Inventory</a><a href="/shipment">Shipment portal</a><button className="themeButton" onClick={toggleTheme} aria-label="Toggle dark mode">{dark ? <Sun size={16}/> : <Moon size={16}/>}</button><button className="signOutButton" onClick={signOut}>Sign out</button><a href="/" className="btn btnGold">View Store</a></div></div></header>
      <main className="container adminMain">
        <div className="dashboardIntro"><div><div className="kicker">Operations / live workspace</div><h1 className="serif">Order command center</h1><p>Review every submitted order, confirm payment, and move shipments forward from one place.</p></div><div className="liveBadge"><span/> Live sync enabled</div></div>
        <div className="kpis">
          <div className="kpi"><span className="kpiIcon"><Package size={18}/></span><small>Total Orders</small><strong>{orders.length}</strong><em>All submitted orders</em></div><div className="kpi"><span className="kpiIcon"><Truck size={18}/></span><small>Active Shipments</small><strong>{activeShipments}</strong><em>Awaiting delivery</em></div><div className="kpi"><span className="kpiIcon"><BarChart3 size={18}/></span><small>Gross Sales</small><strong>₱{revenue.toLocaleString()}</strong><em>Across all orders</em></div><div className="kpi"><span className="kpiIcon"><Check size={18}/></span><small>Delivered</small><strong>{delivered}</strong><em>Completed orders</em></div>
        </div>
        <section className="analyticsGrid"><div className="analyticsPanel"><div className="panelHeading"><div><span className="kicker">Fulfillment pulse</span><h2 className="serif">Shipment pipeline</h2></div><BarChart3 size={20}/></div><div className="barChart">{statusCounts.map(item => <div className="barGroup" key={item.status}><div className="barTrack"><span style={{height:`${Math.max(item.count / maxCount * 100, item.count ? 12 : 3)}%`}}/></div><strong>{item.count}</strong><small>{item.status.replace("Payment Verification", "Payment").replace("Ready for Shipment", "Ready")}</small></div>)}</div></div><div className="analyticsPanel spotlight"><span className="kicker">Conversion snapshot</span><h2 className="serif">Keep every order moving.</h2><p>Advance each order as payment is confirmed, packed, and handed to the courier. Customers see the new status in the shipment portal.</p><div className="spotlightMetric"><strong>{orders.length ? Math.round(delivered / orders.length * 100) : 0}%</strong><span>delivery completion rate</span></div></div></section>
        <section className="orderSection"><div className="sectionHead"><div><div className="kicker">Live catalog orders</div><h2 className="serif">Shipment queue</h2></div><span className="resultCount">{filteredOrders.length} visible</span></div><div className="orderToolbar"><label className="inventorySearch"><Search size={16}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search order, customer, or email"/></label><div className="statusFilters">{["All", ...ORDER_STATUSES].map(status => <button key={status} className={filter === status ? "active" : ""} onClick={() => setFilter(status)}>{status}</button>)}</div></div><div className="orderCards">{filteredOrders.map(order => <article className="orderCard" key={order.id}><div className="orderCardTop"><div><span className="orderId">{order.id}</span><h3>{order.customer.firstName} {order.customer.lastName}</h3><small>{order.customer.email} · {new Date(order.createdAt).toLocaleDateString()}</small></div><span className="statusPill">{order.status}</span></div><div className="orderCardBody"><div className="orderProducts">{order.items.map(item => <span key={`${item.id}-${item.variant}`}><img src={item.image} alt=""/>{item.name} <b>×{item.quantity}</b></span>)}</div><div className="orderMeta"><span>Payment<strong>{order.payment}</strong></span><span>Total<strong>₱{order.total.toLocaleString()}</strong></span><span>Destination<strong>{order.customer.city}</strong></span></div></div><div className="orderCardFooter"><span>{order.trackingNumber ? `Tracking: ${order.trackingNumber}` : "No tracking number yet"}</span><button className="btn btnDark" onClick={() => advanceOrder(order)} disabled={order.status === "Delivered"}>{order.status === "Delivered" ? "Complete" : "Advance shipment"} <Truck size={14}/></button></div></article>)}{!filteredOrders.length && <div className="emptyPanel"><Package size={28}/><h2 className="serif">No orders match</h2><p>Submitted checkout orders will appear here automatically.</p></div>}</div></section>
      </main>
    </div>
  );
}