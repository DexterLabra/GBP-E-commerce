export const ORDERS_STORAGE_KEY = "gbp-orders";
export const ORDERS_UPDATED_EVENT = "gbp-orders-updated";

export const ORDER_STATUSES = [
  "Order Received",
  "Payment Verification",
  "Confirmed",
  "Preparing",
  "Ready for Shipment",
  "Shipped",
  "Delivered"
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number];

export type OrderItem = {
  id: string;
  name: string;
  image: string;
  price: number;
  quantity: number;
  variant: string;
};

export type Order = {
  id: string;
  createdAt: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    mobile: string;
    address: string;
    barangay: string;
    city: string;
    province: string;
    postal: string;
  };
  payment: string;
  reference: string;
  notes: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  trackingNumber?: string;
};

export function loadOrders(): Order[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ORDERS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveOrders(orders: Order[]) {
  window.localStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(orders));
  window.dispatchEvent(new CustomEvent(ORDERS_UPDATED_EVENT, { detail: orders }));
}

export async function hydrateOrders(criteria?: { id?: string; email?: string }): Promise<Order[]> {
  try {
    const params = new URLSearchParams(criteria?.id ? { id: criteria.id } : criteria?.email ? { email: criteria.email } : undefined);
    const response = await fetch(`/api/orders${params.toString() ? `?${params}` : ""}`, { cache: "no-store" });
    const payload = await response.json();
    if (response.ok && payload.configured) {
      const orders = Array.isArray(payload.orders) ? payload.orders as Order[] : [];
      saveOrders(orders);
      return orders;
    }
  } catch { /* Use the local cache while offline. */ }
  return loadOrders();
}

export async function addOrder(order: Order) {
  try {
    const response = await fetch("/api/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(order) });
    if (response.ok) {
      const payload = await response.json();
      const savedOrder = payload.order as Order;
      saveOrders([savedOrder, ...loadOrders().filter(item => item.id !== savedOrder.id)]);
      return savedOrder;
    }
  } catch { /* Fall through to the local cache while offline. */ }
  saveOrders([order, ...loadOrders().filter(item => item.id !== order.id)]);
  return order;
}

export async function updateOrder(id: string, changes: Partial<Pick<Order, "status" | "trackingNumber">>) {
  try {
    const response = await fetch(`/api/orders/${encodeURIComponent(id)}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(changes) });
    if (response.ok) {
      const payload = await response.json();
      const updatedOrder = payload.order as Order;
      saveOrders(loadOrders().map(order => order.id === id ? { ...order, ...updatedOrder } : order));
      return updatedOrder;
    }
  } catch { /* Fall through to the local cache while offline. */ }
  const updatedOrders = loadOrders().map(order => order.id === id ? { ...order, ...changes } : order);
  saveOrders(updatedOrders);
  return updatedOrders.find(order => order.id === id);
}
