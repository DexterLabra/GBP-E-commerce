"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Barcode,
  Bell,
  Box,
  CheckCheck,
  ChevronDown,
  CircleDollarSign,
  ClipboardList,
  Clock3,
  CreditCard,
  Database,
  Gauge,
  Globe,
  LayoutDashboard,
  LogOut,
  Moon,
  PackageCheck,
  PackageSearch,
  PackageX,
  PencilLine,
  Search,
  ShieldCheck,
  ShoppingBag,
  SunMedium,
  Truck,
  UserCircle2,
  Users,
  Warehouse,
} from "lucide-react";

type ThemeMode = "light" | "dark";
type ModuleKey =
  | "Dashboard"
  | "Orders"
  | "Logistics"
  | "Barcode Scanner"
  | "Inventory"
  | "Dispatch Registry"
  | "Order Command Center"
  | "Shipment Queue"
  | "Shipment Tracker"
  | "Products/SKU"
  | "Payments"
  | "Returns & Damages"
  | "Reports"
  | "Audit Logs"
  | "Users"
  | "Settings";

type PaymentMethod = "GCASH" | "Bank Transfer" | "COD";
type PaymentStatus = "Pending" | "Confirmed";
type LogisticsStatus = "Pending" | "Received" | "Not Received";
type DispatchStatus = "Ready for Dispatch" | "Dispatched" | "Completed";
type ScannerAction = "Stock In" | "Stock Out" | "Return";

type OrderRecord = {
  id: string;
  salesOrderNumber: string;
  clientName: string;
  contactNumber: string;
  address: string;
  province: string;
  city: string;
  barangay: string;
  productSku: string;
  productName: string;
  quantity: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  paymentReference: string;
  codAmount: number;
  orderDate: string;
  notes: string;
  logisticsStatus: LogisticsStatus;
  dispatchStatus: DispatchStatus;
  trackingNumber: string;
  createdAt: string;
};

type InventoryItem = {
  id: string;
  sku: string;
  productName: string;
  category: string;
  material: string;
  designNo: string;
  colorVariant: string;
  designVariant: string;
  itemNumber: string;
  barcode: string;
  onHand: number;
  reserved: number;
  dispatched: number;
  returned: number;
  damaged: number;
  lowStockThreshold: number;
  price: number;
  lastUpdated: string;
  status: "Healthy" | "Low Stock" | "Critical";
};

type DispatchRecord = {
  id: string;
  salesOrderNumber: string;
  clientName: string;
  address: string;
  contactNumber: string;
  productSku: string;
  productName: string;
  quantity: number;
  courier: string;
  trackingNumber: string;
  shippingFee: number;
  dispatchDate: string;
  dispatcher: string;
  remarks: string;
  status: DispatchStatus;
};

type ScanTransaction = {
  id: string;
  timestamp: string;
  user: string;
  sku: string;
  product: string;
  quantity: number;
  type: ScannerAction | "Order Received" | "Fulfillment" | "Dispatch";
  reference: string;
  status: "Success" | "Error";
};

type NotificationItem = {
  id: string;
  title: string;
  detail: string;
  type: "success" | "warning" | "info" | "error";
  time: string;
};

type AuditLog = {
  id: string;
  user: string;
  action: string;
  record: string;
  details: string;
  date: string;
  time: string;
};

type UserRole = "Administrator" | "CSR" | "Logistics Staff" | "Inventory Staff" | "Management";

const NAV_ITEMS: { label: ModuleKey; icon: any }[] = [
  { label: "Dashboard", icon: LayoutDashboard },
  { label: "Orders", icon: ClipboardList },
  { label: "Logistics", icon: PackageCheck },
  { label: "Barcode Scanner", icon: Barcode },
  { label: "Inventory", icon: Warehouse },
  { label: "Dispatch Registry", icon: Truck },
  { label: "Order Command Center", icon: Activity },
  { label: "Shipment Queue", icon: ShoppingBag },
  { label: "Shipment Tracker", icon: PackageSearch },
  { label: "Products/SKU", icon: Box },
  { label: "Payments", icon: CreditCard },
  { label: "Returns & Damages", icon: AlertTriangle },
  { label: "Reports", icon: Gauge },
  { label: "Audit Logs", icon: Database },
  { label: "Users", icon: Users },
  { label: "Settings", icon: ShieldCheck },
];

const createId = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

const formatMoney = (value: number) => `₱${value.toLocaleString("en-PH", { maximumFractionDigits: 2 })}`;

const readLocalStorage = <T,>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const writeLocalStorage = (key: string, value: unknown) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(key, JSON.stringify(value));
  }
};

const initialInventory: InventoryItem[] = [
  {
    id: "INV-01",
    sku: "WOOD-FURN-004-CHAR-BLACK-00017",
    productName: "Classic Coffee Table",
    category: "Furniture",
    material: "Wood",
    designNo: "FURN-004",
    colorVariant: "Charcoal",
    designVariant: "Black",
    itemNumber: "00017",
    barcode: "WOOD-FURN-004-CHAR-BLACK-00017",
    onHand: 18,
    reserved: 4,
    dispatched: 7,
    returned: 1,
    damaged: 0,
    lowStockThreshold: 10,
    price: 4999,
    lastUpdated: "2026-09-21T09:20:00",
    status: "Healthy",
  },
  {
    id: "INV-02",
    sku: "GLASS-LAMP-011-GOLD-STD-00022",
    productName: "Golden Luxe Table Lamp",
    category: "Lighting",
    material: "Glass",
    designNo: "LAMP-011",
    colorVariant: "Gold",
    designVariant: "Standard",
    itemNumber: "00022",
    barcode: "GLASS-LAMP-011-GOLD-STD-00022",
    onHand: 9,
    reserved: 2,
    dispatched: 5,
    returned: 0,
    damaged: 1,
    lowStockThreshold: 8,
    price: 2899,
    lastUpdated: "2026-09-21T11:55:00",
    status: "Low Stock",
  },
  {
    id: "INV-03",
    sku: "METAL-FIG-007-SILVER-ALT-00003",
    productName: "Silver Frame Wall Art",
    category: "Wall Decor",
    material: "Metal",
    designNo: "FIG-007",
    colorVariant: "Silver",
    designVariant: "Alternate",
    itemNumber: "00003",
    barcode: "METAL-FIG-007-SILVER-ALT-00003",
    onHand: 5,
    reserved: 2,
    dispatched: 3,
    returned: 1,
    damaged: 1,
    lowStockThreshold: 6,
    price: 2199,
    lastUpdated: "2026-09-22T08:15:00",
    status: "Low Stock",
  },
  {
    id: "INV-04",
    sku: "CERAMIC-ORN-015-WHITE-STD-00048",
    productName: "White Ceramic Vase",
    category: "Home Decor",
    material: "Ceramic",
    designNo: "ORN-015",
    colorVariant: "White",
    designVariant: "Standard",
    itemNumber: "00048",
    barcode: "CERAMIC-ORN-015-WHITE-STD-00048",
    onHand: 24,
    reserved: 8,
    dispatched: 11,
    returned: 2,
    damaged: 0,
    lowStockThreshold: 12,
    price: 1499,
    lastUpdated: "2026-09-22T07:14:00",
    status: "Healthy",
  },
  {
    id: "INV-05",
    sku: "TEXTILE-CUSH-019-BLUE-NOVA-00009",
    productName: "Velvet Accent Cushion",
    category: "Textiles",
    material: "Textile",
    designNo: "CUSH-019",
    colorVariant: "Blue",
    designVariant: "Nova",
    itemNumber: "00009",
    barcode: "TEXTILE-CUSH-019-BLUE-NOVA-00009",
    onHand: 20,
    reserved: 5,
    dispatched: 9,
    returned: 0,
    damaged: 1,
    lowStockThreshold: 10,
    price: 799,
    lastUpdated: "2026-09-21T10:42:00",
    status: "Healthy",
  },
  {
    id: "INV-06",
    sku: "WOOD-RACK-021-MAHOGANY-CLASSIC-00005",
    productName: "Mahogany Shelf Rack",
    category: "Storage",
    material: "Wood",
    designNo: "RACK-021",
    colorVariant: "Mahogany",
    designVariant: "Classic",
    itemNumber: "00005",
    barcode: "WOOD-RACK-021-MAHOGANY-CLASSIC-00005",
    onHand: 4,
    reserved: 1,
    dispatched: 2,
    returned: 0,
    damaged: 0,
    lowStockThreshold: 5,
    price: 3999,
    lastUpdated: "2026-09-22T12:05:00",
    status: "Critical",
  },
];

const initialOrders: OrderRecord[] = [
  {
    id: "ORD-1001",
    salesOrderNumber: "SO-2026-1001",
    clientName: "Maria Villanueva",
    contactNumber: "+63 917 123 4567",
    address: "Unit 12C, Grace Residences",
    province: "Metro Manila",
    city: "Quezon City",
    barangay: "Commonwealth",
    productSku: "GLASS-LAMP-011-GOLD-STD-00022",
    productName: "Golden Luxe Table Lamp",
    quantity: 2,
    paymentMethod: "GCASH",
    paymentStatus: "Confirmed",
    paymentReference: "REF-GBPGCASH-9382",
    codAmount: 0,
    orderDate: "2026-09-21",
    notes: "Deliver before 5 PM.",
    logisticsStatus: "Received",
    dispatchStatus: "Ready for Dispatch",
    trackingNumber: "GBP-TRK-884201",
    createdAt: "2026-09-21T08:22:00",
  },
  {
    id: "ORD-1002",
    salesOrderNumber: "SO-2026-1002",
    clientName: "Ruben Santos",
    contactNumber: "+63 998 221 1144",
    address: "Block 4 Lot 9, San Jose Subdivision",
    province: "Laguna",
    city: "Biñan",
    barangay: "San Francisco",
    productSku: "WOOD-FURN-004-CHAR-BLACK-00017",
    productName: "Classic Coffee Table",
    quantity: 1,
    paymentMethod: "Bank Transfer",
    paymentStatus: "Pending",
    paymentReference: "BPI-TF-20260921-4421",
    codAmount: 0,
    orderDate: "2026-09-22",
    notes: "Need protective wrapping for glass top.",
    logisticsStatus: "Pending",
    dispatchStatus: "Ready for Dispatch",
    trackingNumber: "GBP-TRK-778210",
    createdAt: "2026-09-22T09:35:00",
  },
  {
    id: "ORD-1003",
    salesOrderNumber: "SO-2026-1003",
    clientName: "Nina Perez",
    contactNumber: "+63 920 444 6781",
    address: "10 Maple Grove House",
    province: "Cebu",
    city: "Cebu City",
    barangay: "Mabolo",
    productSku: "CERAMIC-ORN-015-WHITE-STD-00048",
    productName: "White Ceramic Vase",
    quantity: 3,
    paymentMethod: "COD",
    paymentStatus: "Confirmed",
    paymentReference: "",
    codAmount: 4497,
    orderDate: "2026-09-20",
    notes: "Please contact before delivery.",
    logisticsStatus: "Not Received",
    dispatchStatus: "Dispatched",
    trackingNumber: "GBP-TRK-549021",
    createdAt: "2026-09-20T14:42:00",
  },
  {
    id: "ORD-1004",
    salesOrderNumber: "SO-2026-1004",
    clientName: "Joaquin Rivera",
    contactNumber: "+63 906 271 8901",
    address: "12A Camia Street",
    province: "Davao del Sur",
    city: "Davao City",
    barangay: "Poblacion",
    productSku: "METAL-FIG-007-SILVER-ALT-00003",
    productName: "Silver Frame Wall Art",
    quantity: 2,
    paymentMethod: "GCASH",
    paymentStatus: "Confirmed",
    paymentReference: "GPAY-JR-1048",
    codAmount: 0,
    orderDate: "2026-09-22",
    notes: "Gift order and delivery by Friday.",
    logisticsStatus: "Received",
    dispatchStatus: "Completed",
    trackingNumber: "GBP-TRK-204876",
    createdAt: "2026-09-22T06:02:00",
  },
];

const initialDispatches: DispatchRecord[] = [
  {
    id: "DSP-01",
    salesOrderNumber: "SO-2026-1001",
    clientName: "Maria Villanueva",
    address: "Commonwealth, Quezon City",
    contactNumber: "+63 917 123 4567",
    productSku: "GLASS-LAMP-011-GOLD-STD-00022",
    productName: "Golden Luxe Table Lamp",
    quantity: 2,
    courier: "J&T Express",
    trackingNumber: "GBP-TRK-884201",
    shippingFee: 350,
    dispatchDate: "2026-09-22",
    dispatcher: "J. Navarro",
    remarks: "Fragile packaging applied.",
    status: "Ready for Dispatch",
  },
  {
    id: "DSP-02",
    salesOrderNumber: "SO-2026-1003",
    clientName: "Nina Perez",
    address: "Mabolo, Cebu City",
    contactNumber: "+63 920 444 6781",
    productSku: "CERAMIC-ORN-015-WHITE-STD-00048",
    productName: "White Ceramic Vase",
    quantity: 3,
    courier: "LBC",
    trackingNumber: "GBP-TRK-549021",
    shippingFee: 420,
    dispatchDate: "2026-09-21",
    dispatcher: "R. Dela Cruz",
    remarks: "Awaiting final confirmation.",
    status: "Dispatched",
  },
];

const initialNotifications: NotificationItem[] = [
  { id: "NTF-01", title: "New order received", detail: "SO-2026-1002 was created for Ruben Santos.", type: "success", time: "2 min ago" },
  { id: "NTF-02", title: "Payment confirmed", detail: "GCASH payment for SO-2026-1001 is verified.", type: "info", time: "12 min ago" },
  { id: "NTF-03", title: "Low stock alert", detail: "Mahogany Shelf Rack is below threshold.", type: "warning", time: "31 min ago" },
  { id: "NTF-04", title: "Duplicate scan prevented", detail: "Barcode already exists in the active scan log.", type: "error", time: "1 hr ago" },
];

const initialAudit: AuditLog[] = [
  { id: "AUD-001", user: "A. Reyes", action: "Order Saved", record: "SO-2026-1001", details: "Created order and moved to logistics queue.", date: "2026-09-21", time: "08:22" },
  { id: "AUD-002", user: "L. Santos", action: "Barcode Scan", record: "GLASS-LAMP-011-GOLD-STD-00022", details: "Stock Out scan processed and inventory adjusted.", date: "2026-09-21", time: "12:03" },
  { id: "AUD-003", user: "M. Bautista", action: "Dispatch Update", record: "SO-2026-1003", details: "Order status advanced to Dispatched.", date: "2026-09-21", time: "16:48" },
];

const initialUsers: { name: string; role: UserRole; status: "Active" | "Idle"; email: string }[] = [
  { name: "Alyssa Reyes", role: "Administrator", status: "Active", email: "alyssa@gbphomeart.com" },
  { name: "Benedict Cruz", role: "CSR", status: "Active", email: "csr@gbphomeart.com" },
  { name: "Liza Santos", role: "Logistics Staff", status: "Idle", email: "logistics@gbphomeart.com" },
  { name: "Mica Bautista", role: "Inventory Staff", status: "Active", email: "inventory@gbphomeart.com" },
  { name: "Daniel Kim", role: "Management", status: "Active", email: "mgmt@gbphomeart.com" },
];

const initialScanHistory: ScanTransaction[] = [
  {
    id: "SCN-001",
    timestamp: "2026-09-21T14:12:00",
    user: "Liza Santos",
    sku: "GLASS-LAMP-011-GOLD-STD-00022",
    product: "Golden Luxe Table Lamp",
    quantity: 1,
    type: "Stock Out",
    reference: "SO-2026-1001",
    status: "Success",
  },
  {
    id: "SCN-002",
    timestamp: "2026-09-22T09:18:00",
    user: "Mica Bautista",
    sku: "WOOD-RACK-021-MAHOGANY-CLASSIC-00005",
    product: "Mahogany Shelf Rack",
    quantity: 1,
    type: "Stock In",
    reference: "PO-2026-007",
    status: "Success",
  },
];

const parseBarcode = (barcode: string) => {
  const normalized = barcode.trim();
  const segments = normalized.split("-");
  if (segments.length !== 6) return null;
  const [material, category, designNo, colorVariant, designVariant, itemNumber] = segments;
  return { material, category, designNo, colorVariant, designVariant, itemNumber };
};

export default function GbpInventorySystem() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [module, setModule] = useState<ModuleKey>("Dashboard");
  const [search, setSearch] = useState("");
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => readLocalStorage("gbp-notifications", initialNotifications));
  const [orders, setOrders] = useState<OrderRecord[]>(() => readLocalStorage("gbp-orders", initialOrders));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => readLocalStorage("gbp-inventory", initialInventory));
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => readLocalStorage("gbp-dispatches", initialDispatches));
  const [scanHistory, setScanHistory] = useState<ScanTransaction[]>(() => readLocalStorage("gbp-scan-history", initialScanHistory));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => readLocalStorage("gbp-audit-logs", initialAudit));
  const [roleUsers, setRoleUsers] = useState(() => readLocalStorage("gbp-users", initialUsers));
  const [activeRole, setActiveRole] = useState<UserRole>("Administrator");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [datePreset, setDatePreset] = useState<"Today" | "This Week" | "This Month" | "Custom Range">("This Month");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "admin@gbphomeart.com", password: "gbp123" });
  const [toast, setToast] = useState<{ type: "success" | "error" | "info"; message: string } | null>(null);
  const [orderForm, setOrderForm] = useState({
    salesOrderNumber: "SO-2026-1015",
    clientName: "",
    contactNumber: "",
    address: "",
    province: "",
    city: "",
    barangay: "",
    productSku: "",
    productName: "",
    quantity: "1",
    paymentMethod: "GCASH" as PaymentMethod,
    paymentStatus: "Pending" as PaymentStatus,
    paymentReference: "",
    codAmount: "0",
    orderDate: new Date().toISOString().slice(0, 10),
    notes: "",
  });
  const [scanInput, setScanInput] = useState("");
  const [scanAction, setScanAction] = useState<ScannerAction>("Stock In");

  useEffect(() => {
    const savedTheme = readLocalStorage<ThemeMode>("gbp-theme", "light");
    setTheme(savedTheme);
    document.body.dataset.theme = savedTheme;
  }, []);

  useEffect(() => {
    writeLocalStorage("gbp-theme", theme);
    document.body.dataset.theme = theme;
  }, [theme]);

  useEffect(() => {
    writeLocalStorage("gbp-orders", orders);
  }, [orders]);

  useEffect(() => {
    writeLocalStorage("gbp-inventory", inventory);
  }, [inventory]);

  useEffect(() => {
    writeLocalStorage("gbp-dispatches", dispatches);
  }, [dispatches]);

  useEffect(() => {
    writeLocalStorage("gbp-scan-history", scanHistory);
  }, [scanHistory]);

  useEffect(() => {
    writeLocalStorage("gbp-audit-logs", auditLogs);
  }, [auditLogs]);

  useEffect(() => {
    writeLocalStorage("gbp-notifications", notifications);
  }, [notifications]);

  useEffect(() => {
    writeLocalStorage("gbp-users", roleUsers);
  }, [roleUsers]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const queueCount = dispatches.filter((item) => item.status !== "Completed").length;
  const completedOrders = orders.filter((order) => order.dispatchStatus === "Completed").length;
  const lowStockCount = inventory.filter((item) => item.onHand <= item.lowStockThreshold).length;
  const totalInventory = inventory.reduce((sum, item) => sum + item.onHand, 0);
  const paidOrders = orders.filter((order) => order.paymentStatus === "Confirmed").length;

  const addAuditLog = (user: string, action: string, record: string, details: string) => {
    const now = new Date();
    setAuditLogs((current) => [
      {
        id: createId("AUD").toUpperCase(),
        user,
        action,
        record,
        details,
        date: now.toISOString().slice(0, 10),
        time: now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      ...current,
    ].slice(0, 20));
  };

  const addNotification = (title: string, detail: string, type: NotificationItem["type"]) => {
    setNotifications((current) => [
      { id: createId("NTF"), title, detail, type, time: "Just now" },
      ...current,
    ].slice(0, 6));
  };

  const dateMatches = (dateString: string) => {
    const selected = new Date(dateString);
    const today = new Date();
    const currentMonthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    switch (datePreset) {
      case "Today":
        return selected.toDateString() === today.toDateString();
      case "This Week": {
        const diff = Math.floor((today.getTime() - selected.getTime()) / 86400000);
        return diff >= 0 && diff <= 7;
      }
      case "This Month":
        return selected >= currentMonthStart;
      case "Custom Range":
        return selected.toISOString().slice(0, 10) === selectedDate;
      default:
        return true;
    }
  };

  const visibleOrders = useMemo(() => {
    return orders.filter((order) => {
      const matchesText = `${order.salesOrderNumber} ${order.clientName} ${order.productName} ${order.productSku}`
        .toLowerCase()
        .includes(search.toLowerCase());
      const matchesDate = dateMatches(order.orderDate);
      return matchesText && matchesDate;
    });
  }, [orders, search, datePreset, selectedDate]);

  const visibleInventory = useMemo(() => {
    return inventory.filter((item) => {
      const matchesText = `${item.productName} ${item.sku} ${item.category} ${item.barcode}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesText;
    });
  }, [inventory, search]);

  const visibleDispatches = useMemo(() => {
    return dispatches.filter((dispatch) => {
      const matchesText = `${dispatch.salesOrderNumber} ${dispatch.clientName} ${dispatch.productName} ${dispatch.courier}`
        .toLowerCase()
        .includes(search.toLowerCase());
      return matchesText;
    });
  }, [dispatches, search]);

  const dispatchVolume = dispatches.reduce((sum, item) => sum + item.shippingFee, 0);
  const avgDispatchFee = dispatches.length ? dispatchVolume / dispatches.length : 0;
  const returnedItems = inventory.reduce((sum, item) => sum + item.returned, 0);
  const damagedItems = inventory.reduce((sum, item) => sum + item.damaged, 0);

  const handleLogin = () => {
    if (loginForm.email && loginForm.password) {
      setIsAuthenticated(true);
      setToast({ type: "success", message: "Welcome back, GBP operations team." });
    }
  };

  const handleOrderSubmit = () => {
    const required = [
      orderForm.salesOrderNumber,
      orderForm.clientName,
      orderForm.contactNumber,
      orderForm.address,
      orderForm.province,
      orderForm.city,
      orderForm.barangay,
      orderForm.productSku,
      orderForm.productName,
      orderForm.quantity,
    ];

    if (required.some((value) => !String(value).trim())) {
      setToast({ type: "error", message: "Please complete the order form before saving." });
      return;
    }

    const quantity = Number(orderForm.quantity);
    if (Number.isNaN(quantity) || quantity <= 0) {
      setToast({ type: "error", message: "Order quantity must be greater than zero." });
      return;
    }

    const newOrder: OrderRecord = {
      id: createId("ORD").toUpperCase(),
      salesOrderNumber: orderForm.salesOrderNumber,
      clientName: orderForm.clientName,
      contactNumber: orderForm.contactNumber,
      address: orderForm.address,
      province: orderForm.province,
      city: orderForm.city,
      barangay: orderForm.barangay,
      productSku: orderForm.productSku,
      productName: orderForm.productName,
      quantity,
      paymentMethod: orderForm.paymentMethod,
      paymentStatus: orderForm.paymentStatus,
      paymentReference: orderForm.paymentReference,
      codAmount: Number(orderForm.codAmount || 0),
      orderDate: orderForm.orderDate,
      notes: orderForm.notes,
      logisticsStatus: "Pending",
      dispatchStatus: "Ready for Dispatch",
      trackingNumber: `GBP-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
    };

    setOrders((current) => [newOrder, ...current]);
    setOrderForm({
      salesOrderNumber: `SO-2026-${Math.floor(1016 + Math.random() * 100)}`,
      clientName: "",
      contactNumber: "",
      address: "",
      province: "",
      city: "",
      barangay: "",
      productSku: "",
      productName: "",
      quantity: "1",
      paymentMethod: "GCASH",
      paymentStatus: "Pending",
      paymentReference: "",
      codAmount: "0",
      orderDate: new Date().toISOString().slice(0, 10),
      notes: "",
    });
    addAuditLog("CSR Operator", "Order saved", newOrder.salesOrderNumber, "Order created and moved to logistics queue.");
    addNotification("Order created", `${newOrder.salesOrderNumber} has entered the logistics queue.`, "success");
    setToast({ type: "success", message: "Order saved successfully and queued for logistics." });
    setModule("Logistics");
  };

  const handleLogisticsStatus = (orderId: string, status: LogisticsStatus) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              logisticsStatus: status,
              paymentStatus: status === "Received" ? "Confirmed" : order.paymentStatus,
            }
          : order,
      ),
    );
    const record = orders.find((order) => order.id === orderId);
    if (record) {
      addAuditLog("Logistics Staff", "Order status update", record.salesOrderNumber, `Logistics marked as ${status}.`);
      addNotification("Logistics update", `${record.salesOrderNumber} changed to ${status}.`, status === "Received" ? "success" : "warning");
      setToast({ type: "info", message: `Order ${record.salesOrderNumber} marked as ${status}.` });
    }
  };

  const handleScan = () => {
    const normalized = scanInput.trim();
    if (!normalized) {
      setToast({ type: "error", message: "Scan or enter a valid barcode first." });
      return;
    }

    const parsedBarcode = parseBarcode(normalized);
    if (!parsedBarcode) {
      setToast({ type: "error", message: "Barcode format invalid. Expected material-category-design-color-variant-item." });
      addNotification("Invalid barcode", `Attempted scan ${normalized} was rejected due to format.`, "error");
      const failedTransaction: ScanTransaction = {
        id: createId("SCN"),
        timestamp: new Date().toISOString(),
        user: activeRole,
        sku: normalized,
        product: "Unknown",
        quantity: 0,
        type: scanAction,
        reference: "Barcode validation",
        status: "Error",
      };
      setScanHistory((current) => [failedTransaction, ...current].slice(0, 10));
      return;
    }

    const matchedItem = inventory.find(
      (item) => item.barcode.toLowerCase() === normalized.toLowerCase() || item.sku.toLowerCase() === normalized.toLowerCase(),
    );

    if (!matchedItem) {
      setToast({ type: "error", message: "No inventory record matched this barcode. Please verify SKU or scan again." });
      addNotification("Scan mismatch", `Barcode ${normalized} was not recognized in inventory.`, "error");
      return;
    }

    if (scanHistory.some((entry) => entry.sku.toLowerCase() === matchedItem.sku.toLowerCase() && entry.status === "Success" && entry.timestamp.slice(0, 10) === new Date().toISOString().slice(0, 10))) {
      setToast({ type: "error", message: "Duplicate scan detected. This barcode has already been processed today." });
      addNotification("Duplicate scan", `Barcode ${matchedItem.barcode} already processed.`, "error");
      return;
    }

    const quantity = matchedItem.onHand > 0 ? 1 : 0;
    setInventory((current) =>
      current.map((item) => {
        if (item.id !== matchedItem.id) return item;
        if (scanAction === "Stock In") return { ...item, onHand: item.onHand + quantity, lastUpdated: new Date().toISOString(), status: item.onHand + quantity <= item.lowStockThreshold ? "Low Stock" : "Healthy" };
        if (scanAction === "Stock Out") return { ...item, onHand: Math.max(0, item.onHand - quantity), dispatched: item.dispatched + quantity, lastUpdated: new Date().toISOString(), status: Math.max(0, item.onHand - quantity) <= item.lowStockThreshold ? "Low Stock" : "Healthy" };
        return { ...item, returned: item.returned + quantity, onHand: item.onHand + quantity, lastUpdated: new Date().toISOString() };
      }),
    );

    const transaction: ScanTransaction = {
      id: createId("SCN"),
      timestamp: new Date().toISOString(),
      user: activeRole,
      sku: matchedItem.sku,
      product: matchedItem.productName,
      quantity,
      type: scanAction,
      reference: `SCAN-${matchedItem.sku}`,
      status: "Success",
    };

    setScanHistory((current) => [transaction, ...current].slice(0, 12));
    addAuditLog(activeRole, `${scanAction} scan processed`, matchedItem.sku, `Barcode scan successfully processed for ${matchedItem.productName}.`);
    addNotification(scanAction === "Stock In" ? "Stock in recorded" : scanAction === "Stock Out" ? "Inventory deducted" : "Return recorded", `${matchedItem.productName} updated in inventory.`, "success");
    setToast({ type: "success", message: `${scanAction} scan processed for ${matchedItem.productName}.` });
    setScanInput("");
  };

  const handleDispatchSubmit = () => {
    const order = orders[0];
    if (!order) {
      setToast({ type: "error", message: "No active order found for dispatch." });
      return;
    }

    const newDispatch: DispatchRecord = {
      id: createId("DSP").toUpperCase(),
      salesOrderNumber: order.salesOrderNumber,
      clientName: order.clientName,
      address: `${order.city}, ${order.barangay}`,
      contactNumber: order.contactNumber,
      productSku: order.productSku,
      productName: order.productName,
      quantity: order.quantity,
      courier: "J&T Express",
      trackingNumber: order.trackingNumber,
      shippingFee: 350,
      dispatchDate: new Date().toISOString().slice(0, 10),
      dispatcher: "J. Navarro",
      remarks: "Packaging and dispatch prepared.",
      status: "Ready for Dispatch",
    };

    setDispatches((current) => [newDispatch, ...current]);
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, dispatchStatus: "Ready for Dispatch", logisticsStatus: "Received" } : item,
      ),
    );
    addAuditLog("Dispatcher", "Dispatch record created", order.salesOrderNumber, "Order placed into ready-for-dispatch queue.");
    addNotification("Dispatch scheduled", `${order.salesOrderNumber} queued for dispatch.`, "info");
    setToast({ type: "success", message: "Dispatch record created." });
  };

  const handleUpdateInventory = (inventoryId: string, field: keyof InventoryItem, value: string | number) => {
    setInventory((current) =>
      current.map((item) => {
        if (item.id !== inventoryId) return item;
        const nextItem = { ...item, [field]: value } as InventoryItem;
        nextItem.status = nextItem.onHand <= nextItem.lowStockThreshold ? "Low Stock" : "Healthy";
        return nextItem;
      }),
    );
    addAuditLog("Inventory Staff", "Inventory updated", inventoryId, `${String(field)} updated to ${String(value)}.`);
  };

  const liveKpis = [
    { label: "Total Orders", value: orders.length, icon: ClipboardList, tone: "gold" },
    { label: "Pending Orders", value: orders.filter((order) => order.paymentStatus === "Pending").length, icon: Clock3, tone: "blue" },
    { label: "Confirmed Payments", value: paidOrders, icon: CheckCheck, tone: "green" },
    { label: "Orders Received by Logistics", value: orders.filter((order) => order.logisticsStatus === "Received").length, icon: PackageCheck, tone: "amber" },
    { label: "Ready for Dispatch", value: dispatches.filter((d) => d.status === "Ready for Dispatch").length, icon: Truck, tone: "purple" },
    { label: "Total Dispatch", value: dispatches.length, icon: ArrowRight, tone: "gold" },
    { label: "Completed Orders", value: completedOrders, icon: CheckCheck, tone: "green" },
    { label: "Current Inventory", value: totalInventory, icon: Warehouse, tone: "navy" },
    { label: "Returns", value: returnedItems, icon: PackageCheck, tone: "orange" },
    { label: "Damaged Items", value: damagedItems, icon: AlertTriangle, tone: "red" },
    { label: "Low Stock Items", value: lowStockCount, icon: AlertTriangle, tone: "amber" },
    { label: "In Transit", value: dispatches.filter((d) => d.status === "Dispatched").length, icon: Globe, tone: "teal" },
  ];

  const chartData = [
    { label: "Jan", value: 34 },
    { label: "Feb", value: 48 },
    { label: "Mar", value: 36 },
    { label: "Apr", value: 62 },
    { label: "May", value: 54 },
    { label: "Jun", value: 74 },
    { label: "Jul", value: 68 },
    { label: "Aug", value: 80 },
    { label: "Sep", value: 72 },
  ];

  const renderModule = () => {
    switch (module) {
      case "Orders":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Order Management</span>
                <h1>Sales order intake</h1>
              </div>
              <button className="primary-button" onClick={handleOrderSubmit}>Save Order</button>
            </div>

            <div className="two-column-grid">
              <div className="panel">
                <div className="panel-title-row">
                  <h2>Customer & order details</h2>
                </div>
                <div className="form-grid">
                  <label className="field"><span>Sales Order Number</span><input value={orderForm.salesOrderNumber} onChange={(e) => setOrderForm({ ...orderForm, salesOrderNumber: e.target.value })} /></label>
                  <label className="field"><span>Client Name</span><input value={orderForm.clientName} onChange={(e) => setOrderForm({ ...orderForm, clientName: e.target.value })} /></label>
                  <label className="field"><span>Contact Number</span><input value={orderForm.contactNumber} onChange={(e) => setOrderForm({ ...orderForm, contactNumber: e.target.value })} /></label>
                  <label className="field"><span>Order Date</span><input type="date" value={orderForm.orderDate} onChange={(e) => setOrderForm({ ...orderForm, orderDate: e.target.value })} /></label>
                  <label className="field span-2"><span>Complete Address</span><input value={orderForm.address} onChange={(e) => setOrderForm({ ...orderForm, address: e.target.value })} /></label>
                  <label className="field"><span>Province</span><input value={orderForm.province} onChange={(e) => setOrderForm({ ...orderForm, province: e.target.value })} /></label>
                  <label className="field"><span>City / Municipality</span><input value={orderForm.city} onChange={(e) => setOrderForm({ ...orderForm, city: e.target.value })} /></label>
                  <label className="field"><span>Barangay</span><input value={orderForm.barangay} onChange={(e) => setOrderForm({ ...orderForm, barangay: e.target.value })} /></label>
                  <label className="field"><span>Product SKU</span><input value={orderForm.productSku} onChange={(e) => setOrderForm({ ...orderForm, productSku: e.target.value })} /></label>
                  <label className="field"><span>Product Name</span><input value={orderForm.productName} onChange={(e) => setOrderForm({ ...orderForm, productName: e.target.value })} /></label>
                  <label className="field"><span>Quantity</span><input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} /></label>
                  <label className="field"><span>Payment Method</span><select value={orderForm.paymentMethod} onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value as PaymentMethod })}><option value="GCASH">GCASH</option><option value="Bank Transfer">Bank Transfer</option><option value="COD">COD</option></select></label>
                  <label className="field"><span>Payment Status</span><select value={orderForm.paymentStatus} onChange={(e) => setOrderForm({ ...orderForm, paymentStatus: e.target.value as PaymentStatus })}><option value="Pending">Pending</option><option value="Confirmed">Confirmed</option></select></label>
                  <label className="field"><span>Payment Reference</span><input value={orderForm.paymentReference} onChange={(e) => setOrderForm({ ...orderForm, paymentReference: e.target.value })} /></label>
                  <label className="field"><span>COD Amount</span><input type="number" value={orderForm.codAmount} onChange={(e) => setOrderForm({ ...orderForm, codAmount: e.target.value })} /></label>
                  <label className="field span-2"><span>Notes</span><textarea value={orderForm.notes} onChange={(e) => setOrderForm({ ...orderForm, notes: e.target.value })} /></label>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title-row"><h2>Order queue</h2><span className="mini-pill">{visibleOrders.length} active</span></div>
                <div className="stack-list">
                  {visibleOrders.slice(0, 6).map((order) => (
                    <div className="list-row" key={order.id}>
                      <div>
                        <strong>{order.salesOrderNumber}</strong>
                        <small>{order.clientName}</small>
                      </div>
                      <div>
                        <span className="status-badge status-border">{order.paymentStatus}</span>
                        <small>{order.logisticsStatus}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case "Logistics":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Logistics Processing</span>
                <h1>Inbound orders queue</h1>
              </div>
              <button className="secondary-button" onClick={() => setModule("Barcode Scanner")}>Open scanner</button>
            </div>
            <div className="panel">
              <div className="panel-title-row">
                <h2>Receiving status board</h2>
                <span className="mini-pill">{orders.filter((o) => o.logisticsStatus === "Received").length} received</span>
              </div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>SO No.</th><th>Client</th><th>Product</th><th>Qty</th><th>Payment</th><th>Logistics</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {visibleOrders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.salesOrderNumber}</td>
                        <td>{order.clientName}<div className="muted-small">{order.city}</div></td>
                        <td>{order.productName}</td>
                        <td>{order.quantity}</td>
                        <td>{order.paymentMethod}<div className="muted-small">{order.paymentStatus}</div></td>
                        <td>
                          <span className={`status-badge ${order.logisticsStatus === "Received" ? "success" : order.logisticsStatus === "Not Received" ? "danger" : "neutral"}`}>
                            {order.logisticsStatus}
                          </span>
                        </td>
                        <td>
                          <div className="table-actions">
                            <button className="tiny-button success" onClick={() => handleLogisticsStatus(order.id, "Received")}>Received</button>
                            <button className="tiny-button danger" onClick={() => handleLogisticsStatus(order.id, "Not Received")}>Not Received</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Barcode Scanner":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Barcode Scanner</span>
                <h1>Scan, validate, and process</h1>
              </div>
            </div>
            <div className="two-column-grid">
              <div className="panel scanner-panel">
                <div className="panel-title-row"><h2>Scanner input</h2></div>
                <div className="scanner-box">
                  <label className="scanner-label">Enter barcode or scan with keyboard HID device</label>
                  <input value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="e.g. WOOD-FURN-004-CHAR-BLACK-00017" />
                  <select value={scanAction} onChange={(e) => setScanAction(e.target.value as ScannerAction)}>
                    <option value="Stock In">Stock In</option>
                    <option value="Stock Out">Stock Out</option>
                    <option value="Return">Return</option>
                  </select>
                  <button className="primary-button" onClick={handleScan}>Process Scan</button>
                </div>
                <div className="barcode-format">
                  <span>Code 128 format</span>
                  <strong>Material-Product Category-Design No-Color Variant-Design Variant-Unique Item Number</strong>
                  <code>WOOD-FURN-004-CHAR-BLACK-00017</code>
                </div>
              </div>

              <div className="panel">
                <div className="panel-title-row"><h2>Scan history</h2><span className="mini-pill">{scanHistory.length} events</span></div>
                <div className="stack-list">
                  {scanHistory.map((entry) => (
                    <div className="list-row scan-row" key={entry.id}>
                      <div>
                        <strong>{entry.product}</strong>
                        <small>{entry.sku}</small>
                      </div>
                      <div>
                        <span className={`status-badge ${entry.status === "Success" ? "success" : "danger"}`}>{entry.status}</span>
                        <small>{entry.type}</small>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
      case "Inventory":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Inventory Management</span>
                <h1>Current stock ledger</h1>
              </div>
            </div>
            <div className="stat-grid">
              {[
                { label: "Current Inventory", value: totalInventory },
                { label: "Available Qty", value: inventory.reduce((sum, item) => sum + item.onHand, 0) },
                { label: "Reserved Qty", value: inventory.reduce((sum, item) => sum + item.reserved, 0) },
                { label: "Damaged Qty", value: damagedItems },
              ].map((item) => (
                <div className="mini-stat" key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>SKU</th><th>Product</th><th>Category</th><th>Barcode</th><th>On Hand</th><th>Reserved</th><th>Dispatched</th><th>Returned</th><th>Damaged</th><th>Low Stock</th></tr>
                  </thead>
                  <tbody>
                    {visibleInventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.sku}</td>
                        <td>{item.productName}</td>
                        <td>{item.category}</td>
                        <td>{item.barcode}</td>
                        <td><input value={item.onHand} onChange={(e) => handleUpdateInventory(item.id, "onHand", Number(e.target.value))} /></td>
                        <td>{item.reserved}</td>
                        <td>{item.dispatched}</td>
                        <td>{item.returned}</td>
                        <td>{item.damaged}</td>
                        <td><span className={`status-badge ${item.onHand <= item.lowStockThreshold ? "warning" : "success"}`}>{item.lowStockThreshold}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Dispatch Registry":
      case "Order Command Center":
      case "Shipment Queue":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Dispatch Registry</span>
                <h1>Shipment queue and order command center</h1>
              </div>
              <button className="primary-button" onClick={handleDispatchSubmit}>Create Dispatch</button>
            </div>
            <div className="stat-grid">
              {[
                { label: "Queue Count", value: queueCount },
                { label: "Completed", value: completedOrders },
                { label: "Dispatch Fees", value: formatMoney(dispatchVolume) },
                { label: "Avg Shipping", value: formatMoney(avgDispatchFee) },
              ].map((item) => (
                <div className="mini-stat" key={item.label}>
                  <small>{item.label}</small>
                  <strong>{item.value}</strong>
                </div>
              ))}
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>SO No.</th><th>Client</th><th>Courier</th><th>Tracking</th><th>Qty</th><th>Fee</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {visibleDispatches.map((dispatch) => (
                      <tr key={dispatch.id}>
                        <td>{dispatch.salesOrderNumber}</td>
                        <td>{dispatch.clientName}</td>
                        <td>{dispatch.courier}</td>
                        <td>{dispatch.trackingNumber}</td>
                        <td>{dispatch.quantity}</td>
                        <td>{formatMoney(dispatch.shippingFee)}</td>
                        <td><span className={`status-badge ${dispatch.status === "Completed" ? "success" : dispatch.status === "Dispatched" ? "warning" : "neutral"}`}>{dispatch.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Shipment Tracker":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Shipment Tracker</span>
                <h1>Real-time order journey</h1>
              </div>
            </div>
            <div className="panel tracker-panel">
              <div className="tracker-input-row">
                <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by Sales Order Number or tracking number" />
                <button className="primary-button">Track</button>
              </div>
              <div className="timeline">
                {[
                  "Order Received",
                  "Payment Verification",
                  "Logistics Received",
                  "Picking/Fulfillment",
                  "Barcode Scanned",
                  "Inventory Deducted",
                  "Ready for Dispatch",
                  "Dispatched",
                  "In Transit",
                  "Delivered/Completed",
                ].map((stage, index) => (
                  <div key={stage} className={`timeline-step ${index < 7 ? "active" : ""}`}>
                    <span>{index + 1}</span>
                    <strong>{stage}</strong>
                    <small>{index === 0 ? "09:20 AM" : index === 3 ? "11:10 AM" : index === 6 ? "01:45 PM" : ""}</small>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      case "Products/SKU":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Products & SKU</span>
                <h1>Catalog reference</h1>
              </div>
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>SKU</th><th>Product</th><th>Category</th><th>Color</th><th>Variant</th><th>Barcode</th><th>Price</th></tr>
                  </thead>
                  <tbody>
                    {visibleInventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.sku}</td>
                        <td>{item.productName}</td>
                        <td>{item.category}</td>
                        <td>{item.colorVariant}</td>
                        <td>{item.designVariant}</td>
                        <td>{item.barcode}</td>
                        <td>{formatMoney(item.price)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Payments":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Payments</span>
                <h1>Payment overview</h1>
              </div>
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>SO No.</th><th>Customer</th><th>Method</th><th>Status</th><th>Reference</th><th>Amount</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>{order.salesOrderNumber}</td>
                        <td>{order.clientName}</td>
                        <td>{order.paymentMethod}</td>
                        <td><span className={`status-badge ${order.paymentStatus === "Confirmed" ? "success" : "neutral"}`}>{order.paymentStatus}</span></td>
                        <td>{order.paymentReference || "-"}</td>
                        <td>{formatMoney(order.codAmount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Returns & Damages":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Returns & Damages</span>
                <h1>Recovery monitoring</h1>
              </div>
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>SKU</th><th>Product</th><th>Returned</th><th>Damaged</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {inventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.sku}</td>
                        <td>{item.productName}</td>
                        <td>{item.returned}</td>
                        <td>{item.damaged}</td>
                        <td><span className={`status-badge ${item.damaged > 0 ? "danger" : "success"}`}>{item.damaged > 0 ? "Needs review" : "Healthy"}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Reports":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Reports</span>
                <h1>Operational summary</h1>
              </div>
            </div>
            <div className="report-grid">
              <div className="panel">
                <h2>Order volume</h2>
                <div className="bar-chart">
                  {chartData.map((entry) => (
                    <div key={entry.label} className="bar-group">
                      <span style={{ height: `${entry.value * 2.5}px` }} />
                      <small>{entry.label}</small>
                    </div>
                  ))}
                </div>
              </div>
              <div className="panel">
                <h2>Inventory movement</h2>
                <div className="donut-wrap">
                  <div className="donut-ring">
                    <span>{Math.round((paidOrders / Math.max(orders.length, 1)) * 100)}%</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      case "Audit Logs":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Audit Logs</span>
                <h1>All system actions</h1>
              </div>
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>User</th><th>Action</th><th>Record</th><th>Details</th><th>Date</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.user}</td>
                        <td>{entry.action}</td>
                        <td>{entry.record}</td>
                        <td>{entry.details}</td>
                        <td>{entry.date}</td>
                        <td>{entry.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Users":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Users</span>
                <h1>Role-based access</h1>
              </div>
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>Name</th><th>Role</th><th>Email</th><th>Status</th></tr>
                  </thead>
                  <tbody>
                    {roleUsers.map((person, index) => (
                      <tr key={`${person.email}-${index}`}>
                        <td>{person.name}</td>
                        <td>{person.role}</td>
                        <td>{person.email}</td>
                        <td><span className={`status-badge ${person.status === "Active" ? "success" : "neutral"}`}>{person.status}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Settings":
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Settings</span>
                <h1>System configuration</h1>
              </div>
            </div>
            <div className="panel settings-box">
              <div className="setting-row"><span>Light / Dark mode</span><button className="secondary-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>{theme === "light" ? "Dark Mode" : "Light Mode"}</button></div>
              <div className="setting-row"><span>Role access</span><select value={activeRole} onChange={(e) => setActiveRole(e.target.value as UserRole)}><option>Administrator</option><option>CSR</option><option>Logistics Staff</option><option>Inventory Staff</option><option>Management</option></select></div>
              <div className="setting-row"><span>Notifications</span><button className="secondary-button" onClick={() => addNotification("System update", "All modules synchronized.", "info")}>Sync now</button></div>
            </div>
          </div>
        );
      default:
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Dashboard</span>
                <h1>GBP executive overview</h1>
              </div>
              <div className="top-actions">
                <div className="date-control">
                  <button className={`chip ${datePreset === "Today" ? "active" : ""}`} onClick={() => setDatePreset("Today")}>Today</button>
                  <button className={`chip ${datePreset === "This Week" ? "active" : ""}`} onClick={() => setDatePreset("This Week")}>This Week</button>
                  <button className={`chip ${datePreset === "This Month" ? "active" : ""}`} onClick={() => setDatePreset("This Month")}>This Month</button>
                </div>
                <input type="date" value={selectedDate} onChange={(e) => { setSelectedDate(e.target.value); setDatePreset("Custom Range"); }} />
              </div>
            </div>

            <div className="kpi-grid">
              {liveKpis.map((kpi) => {
                const Icon = kpi.icon;
                return (
                  <div className="kpi-card" key={kpi.label}>
                    <div className="kpi-icon">
                      <Icon size={15} />
                    </div>
                    <small>{kpi.label}</small>
                    <strong>{kpi.value}</strong>
                  </div>
                );
              })}
            </div>

            <div className="dashboard-grid">
              <div className="panel panel-large">
                <div className="panel-title-row">
                  <h2>Order volume</h2>
                  <span className="mini-pill">{datePreset}</span>
                </div>
                <div className="bar-chart">
                  {chartData.map((entry) => (
                    <div key={entry.label} className="bar-group">
                      <span style={{ height: `${entry.value * 2.8}px` }} />
                      <small>{entry.label}</small>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel panel-compact">
                <div className="panel-title-row"><h2>Payment status</h2></div>
                <div className="stack-list">
                  <div className="list-row"><div><strong>Pending</strong></div><div><span className="status-badge neutral">{orders.filter((o) => o.paymentStatus === "Pending").length}</span></div></div>
                  <div className="list-row"><div><strong>Confirmed</strong></div><div><span className="status-badge success">{paidOrders}</span></div></div>
                  <div className="list-row"><div><strong>COD</strong></div><div><span className="status-badge warning">{orders.filter((o) => o.paymentMethod === "COD").length}</span></div></div>
                </div>
              </div>
            </div>

            <div className="dashboard-grid two-grid">
              <div className="panel">
                <div className="panel-title-row"><h2>Recent notification center</h2></div>
                <div className="stack-list">
                  {notifications.map((note) => (
                    <div className="list-row note-row" key={note.id}>
                      <div>
                        <strong>{note.title}</strong>
                        <small>{note.detail}</small>
                      </div>
                      <span className={`status-badge ${note.type === "success" ? "success" : note.type === "warning" ? "warning" : note.type === "error" ? "danger" : "neutral"}`}>{note.time}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel">
                <div className="panel-title-row"><h2>Shipment funnel</h2></div>
                <div className="stack-list">
                  {[
                    { label: "Orders in Fulfillment", value: orders.filter((o) => o.logisticsStatus === "Pending").length },
                    { label: "Ready for Dispatch", value: dispatches.filter((d) => d.status === "Ready for Dispatch").length },
                    { label: "Dispatched", value: dispatches.filter((d) => d.status === "Dispatched").length },
                    { label: "Delivered", value: completedOrders },
                  ].map((entry) => (
                    <div className="list-row" key={entry.label}>
                      <div><strong>{entry.label}</strong></div>
                      <div><span className="status-badge advice">{entry.value}</span></div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <>
      {!isAuthenticated && (
        <div className="login-overlay">
          <div className="login-card">
            <div className="brand-mark">
              <img src="/gbp-logo.png" alt="GBP Home Art & Decors" />
              <div>
                <span className="eyebrow">GBP HOME ART & DECO</span>
                <h2>Operations portal</h2>
              </div>
            </div>
            <label className="field"><span>Email</span><input value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} /></label>
            <label className="field"><span>Password</span><input type="password" value={loginForm.password} onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })} /></label>
            <button className="primary-button" onClick={handleLogin}>Sign in</button>
          </div>
        </div>
      )}

      <div className="gbp-shell">
        <aside className="sidebar">
          <div className="brand-block">
            <img src="/gbp-logo.png" alt="GBP logo" />
            <div>
              <span>GBP</span>
              <strong>Home Art & Decors</strong>
            </div>
          </div>

          <nav className="sidebar-nav">
            {NAV_ITEMS.map(({ label, icon: Icon }) => (
              <button key={label} className={`nav-item ${module === label ? "active" : ""}`} onClick={() => setModule(label)}>
                <Icon size={16} />
                <span>{label}</span>
              </button>
            ))}
          </nav>

          <div className="sidebar-footer">
            <button className="ghost-button" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
              {theme === "light" ? <Moon size={15} /> : <SunMedium size={15} />}
              <span>{theme === "light" ? "Dark" : "Light"} Mode</span>
            </button>
            <button className="ghost-button danger" onClick={() => setIsAuthenticated(false)}>
              <LogOut size={15} />
              <span>Log out</span>
            </button>
          </div>
        </aside>

        <main className="content-panel">
          <header className="topbar">
            <div className="search-wrap">
              <Search size={16} />
              <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search orders, SKU, courier, tracking..." />
            </div>
            <div className="topbar-actions">
              <button className="icon-button" aria-label="Notifications">
                <Bell size={16} />
                <span>{notifications.length}</span>
              </button>
              <div className="profile-box">
                <UserCircle2 size={30} />
                <div>
                  <strong>{activeRole}</strong>
                  <small>Operations Portal</small>
                </div>
              </div>
            </div>
          </header>

          <div className="content-inner">{renderModule()}</div>
        </main>
      </div>

      {toast && <div className={`toast ${toast.type}`}>{toast.message}</div>}
    </>
  );
}
