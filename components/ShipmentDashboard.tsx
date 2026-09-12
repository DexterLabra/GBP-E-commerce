"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Moon, Package, Search, Sun, Truck } from "lucide-react";
import { hydrateOrders, Order, ORDER_STATUSES } from "../data/orderStore";

export default function ShipmentDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [query, setQuery] = useState("");
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const storedTheme = window.localStorage.getItem("gbp-dark-mode") === "true";
    setDark(storedTheme);
    document.body.classList.toggle("darkMode", storedTheme);
    return () => undefined;
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (!value) { setOrders([]); return; }
    const criteria = value.includes("@") ? { email: value } : { id: value };
    hydrateOrders(criteria).then(setOrders);
  }, [query]);

  const toggleTheme = () => {
    const next = !dark;
    setDark(next);
    window.localStorage.setItem("gbp-dark-mode", String(next));
    document.body.classList.toggle("darkMode", next);
  };

  const visibleOrders = useMemo(() => orders.filter(order => `${order.id} ${order.customer.email} ${order.customer.lastName}`.toLowerCase().includes(query.toLowerCase())), [orders, query]);
  const latest = visibleOrders[0];

  return <div className="admin shipmentPage">
    <header className="adminTop"><div className="container adminNav"><a href="/" className="adminBrand"><span className="logoMark">GBP</span><span>GBP SHIPMENT DESK</span></a><div className="adminLinks"><a href="/">Store</a><button className="themeButton" onClick={toggleTheme} aria-label="Toggle dark mode">{dark ? <Sun size={16}/> : <Moon size={16}/>}</button></div></div></header>
    <main className="container adminMain shipmentMain">
      <a href="/" className="backLink"><ArrowLeft size={15}/> Back to store</a>
      <div className="shipmentHeading"><div><div className="kicker">Customer portal</div><h1 className="serif">Track your shipment</h1><p>Search with your order ID or email to see the latest movement of your GBP order.</p></div><div className="shipmentMark"><Truck size={22}/><span>Live updates</span></div></div>
      <label className="shipmentSearch"><Search size={17}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Order ID or email address" /></label>
      {!orders.length && <div className="emptyPanel"><Package size={30}/><h2 className="serif">No orders yet</h2><p>Your submitted orders will appear here for tracking.</p><a className="btn btnGold" href="/#shop">Continue shopping</a></div>}
      {orders.length > 0 && !latest && <div className="emptyPanel"><Search size={30}/><h2 className="serif">No matching shipment</h2><p>Check the order ID or email address and try again.</p></div>}
      {latest && <section className="shipmentCard">
        <div className="shipmentCardHead"><div><span className="kicker">Selected order</span><h2 className="serif">{latest.id}</h2><p>Placed {new Date(latest.createdAt).toLocaleDateString()}</p></div><span className="statusPill">{latest.status}</span></div>
        <div className="shipmentProgress">{ORDER_STATUSES.map((status, index) => { const current = ORDER_STATUSES.indexOf(latest.status); return <div className={`progressStep ${index <= current ? "complete" : ""}`} key={status}><span>{index < current ? <Check size={13}/> : index === current ? <Truck size={13}/> : index + 1}</span><small>{status}</small></div>; })}</div>
        <div className="shipmentColumns"><div><h3>Delivery details</h3><p>{latest.customer.firstName} {latest.customer.lastName}<br/>{latest.customer.address}, {latest.customer.barangay}<br/>{latest.customer.city}, {latest.customer.province} {latest.customer.postal}<br/>{latest.customer.mobile}</p></div><div><h3>Order summary</h3>{latest.items.map(item => <div className="shipmentItem" key={`${item.id}-${item.variant}`}><img src={item.image} alt=""/><span>{item.name}<small>{item.quantity} × {item.variant}</small></span><strong>₱{(item.price * item.quantity).toLocaleString()}</strong></div>)}<div className="shipmentTotal"><span>Total</span><strong>₱{latest.total.toLocaleString()}</strong></div></div></div>
      </section>}
    </main>
  </div>;
}
