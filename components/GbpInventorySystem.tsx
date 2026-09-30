"use client";

import { useEffect, useMemo, useRef, useState } from "react";
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
import { isOperationsSnapshot, OPERATIONS_STORAGE_KEY, OPERATIONS_UPDATED_EVENT, OPERATIONS_VERSION_KEY, OperationsSnapshot } from "../data/operationsStore";

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
type DispatchStatus = "Ready for Dispatch" | "Dispatched" | "In Transit" | "Completed";
type WorkflowStage = "Order Command Center" | "Picking" | "Packing" | "Quality Check" | "Shipment Queue" | "Barcode Verification" | "Dispatched" | "In Transit" | "Delivered";
type ScannerAction = "Stock In" | "Stock Out" | "Order Picking" | "Dispatch" | "Returns" | "Inventory Verification";

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
  workflowStatus?: WorkflowStage;
  trackingNumber: string;
  createdAt: string;
};

const WORKFLOW_STAGES: WorkflowStage[] = [
  "Order Command Center",
  "Picking",
  "Packing",
  "Quality Check",
  "Shipment Queue",
  "Barcode Verification",
  "Dispatched",
  "In Transit",
  "Delivered",
];

const getWorkflowStage = (order: OrderRecord): WorkflowStage => {
  if (order.workflowStatus) return order.workflowStatus;
  if (order.dispatchStatus === "Completed") return "Delivered";
  if (order.dispatchStatus === "Dispatched") return "Dispatched";
  return "Order Command Center";
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
  dimensions?: string;
  weightKg?: number;
  imageUrl?: string;
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
  previousValue?: string;
  newValue?: string;
};

type RecoveryRecord = {
  id: string;
  reference: string;
  kind: "Return" | "Damage";
  sku: string;
  product: string;
  quantity: number;
  user: string;
  reason: string;
  createdAt: string;
};

type UserRole =
  | "Admin"
  | "Administrator"
  | "Management"
  | "Logistics"
  | "Warehouse"
  | "Accounting"
  | "CSR"
  | "Logistics Staff"
  | "Inventory Staff"
  | "Management"
  | "Owner/Management"
  | "Accounting Staff"
  | "CSR-CSRM"
  | "Online Sales Design Consultant";

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

const ROLE_MODULES: Partial<Record<UserRole, ModuleKey[]>> = {
  Accounting: ["Dashboard", "Orders", "Payments", "Reports"],
  "Accounting Staff": ["Dashboard", "Orders", "Payments", "Reports"],
  Logistics: ["Dashboard", "Logistics", "Barcode Scanner", "Dispatch Registry", "Order Command Center", "Shipment Queue", "Shipment Tracker"],
  "Logistics Staff": ["Dashboard", "Logistics", "Barcode Scanner", "Dispatch Registry", "Order Command Center", "Shipment Queue", "Shipment Tracker"],
  Warehouse: ["Dashboard", "Barcode Scanner", "Inventory", "Order Command Center", "Shipment Queue", "Products/SKU", "Returns & Damages", "Audit Logs"],
  "Inventory Staff": ["Dashboard", "Barcode Scanner", "Inventory", "Order Command Center", "Shipment Queue", "Products/SKU", "Returns & Damages", "Audit Logs"],
  CSR: ["Dashboard", "Orders", "Logistics", "Order Command Center", "Shipment Tracker"],
  "CSR-CSRM": ["Dashboard", "Orders", "Logistics", "Order Command Center", "Shipment Tracker"],
  "Online Sales Design Consultant": ["Dashboard", "Orders", "Products/SKU", "Shipment Tracker"],
};

const getRoleModules = (role: UserRole): ModuleKey[] => ROLE_MODULES[role]
  || ["Dashboard", "Orders", "Logistics", "Barcode Scanner", "Inventory", "Dispatch Registry", "Order Command Center", "Shipment Queue", "Shipment Tracker", "Products/SKU", "Payments", "Returns & Damages", "Reports", "Audit Logs", "Users", "Settings"];

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

const OFFICIAL_INVENTORY_VERSION = 1;
const OFFICIAL_INVENTORY_VERSION_KEY = "gbp-official-inventory-version";
const officialCatalogRows = [
  { sku: "RHL - 001", productName: "Nordic Minimalist Romantic Couple Sculpture with Moon Night Lamp", category: "Lamps", price: 1499 },
  { sku: "CAF - 001", productName: "Elegant Golden Arowana Ceramic Decor", category: "Figurines", price: 1999 },
  { sku: "RHF - 001", productName: "Minimalist Reading Yoga Girl in White and Gold", category: "Figurines", price: 1299 },
  { sku: "RHL - 003", productName: "Nordic Minimalist Kneeling Human Sculpture with Night Lamp", category: "Lamps", price: 1999 },
  { sku: "MCH - 001", productName: "Elegant Metal Candle Holder in Gold", category: "Candle Holders", price: 799 },
  { sku: "RHL - 002", productName: "Nordic Minimalist Thinking Human Sculpture with Moon Night Lamp", category: "Lamps", price: 2499 },
  { sku: "RAF - 001", productName: "Cute Polar Bear with Trinket and Welcome Tray", category: "Figurines", price: 1499 },
  { sku: "RAL - 001", productName: "Modern Leopard Decor Sculpture with Night Lamp", category: "Lamps", price: 3499 },
  { sku: "RAL - 001-Gold/Black", productName: "Modern Leopard Decor Sculpture with Night Lamp", category: "Lamps", price: 3499 },
  { sku: "RAB - 001", productName: "Modern Owl Decorative Bookend in White and Gold", category: "Bookends", price: 1499 },
  { sku: "RHF - 002", productName: "Minimalist Sitting Yoga Girl in White and Gold", category: "Figurines", price: 1299 },
  { sku: "RHF - 003", productName: "Abstract Praying Head Sculpture in Gold and Black", category: "Figurines", price: 2499 },
  { sku: "RHF - 003-A", productName: "Abstract Praying Head Sculpture in Gold and Black", category: "Figurines", price: 1299 },
  { sku: "RHF - 003-B", productName: "Abstract Praying Head Sculpture in Gold and Black", category: "Figurines", price: 1299 },
  { sku: "RHF - 003-C", productName: "Abstract Praying Head Sculpture in Gold and Black", category: "Figurines", price: 1099 },
  { sku: "RHF - 004", productName: "Elegant Lady Justice Goddess of Law Decor Sculpture", category: "Figurines", price: 1299 },
];

const initialInventory: InventoryItem[] = officialCatalogRows.map((product, index) => {
  const skuParts = product.sku.split("-").map((part) => part.trim());
  return {
    id: `GBP-${String(index + 1).padStart(3, "0")}`,
    sku: product.sku,
    productName: product.productName,
    category: product.category,
    material: skuParts[0] || "DECOR",
    designNo: skuParts[1] || product.sku,
    colorVariant: skuParts[2] || "Standard",
    designVariant: skuParts[3] || "Standard",
    itemNumber: skuParts[skuParts.length - 1] || String(index + 1).padStart(3, "0"),
    barcode: product.sku,
    onHand: 0,
    reserved: 0,
    dispatched: 0,
    returned: 0,
    damaged: 0,
    lowStockThreshold: 0,
    price: product.price,
    dimensions: "",
    weightKg: 0,
    imageUrl: "",
    lastUpdated: "2026-09-30T00:00:00.000Z",
    status: "Critical",
  };
});

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
    workflowStatus: "Barcode Verification",
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
  { name: "Greecely Buendia ♀️ ", role: "Owner/Management", status: "Active", email: "gbphomedecors@mail.com" },
  { name: "Audry Casandra Paalam ♀️", role: "Accounting Staff", status: "Active", email: "finance.gbphomedecors@gmail.com" },
  { name: "Mariel Giane Herrera ♀️", role: "CSR-CSRM", status: "Active", email: "sales.gbphomedecors@gmail.com" },
  { name: "Dexter Labra ♂️", role: "Logistics Staff", status: "Idle", email: "logistics@gbphomeart.com" },
  { name: "Mhey-Ann Hernandez ♀️", role: "Online Sales Design Consultant", status: "Active", email: "sales.gbphomedecors@gmail.com" },
  { name: "Christine Joie Quirap ♀️", role: "Online Sales Design Consultant", status: "Active", email: "sales.gbphomedecors@gmail.com" },
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
  const [trackingQuery, setTrackingQuery] = useState("");
  const [cachedOperations] = useState<OperationsSnapshot | null>(() => {
    const cached = readLocalStorage<unknown>(OPERATIONS_STORAGE_KEY, null);
    return isOperationsSnapshot(cached) ? cached : null;
  });
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => cachedOperations ? cachedOperations.notifications as NotificationItem[] : readLocalStorage("gbp-notifications", initialNotifications));
  const [orders, setOrders] = useState<OrderRecord[]>(() => cachedOperations ? cachedOperations.orders as OrderRecord[] : readLocalStorage("gbp-orders", initialOrders));
  const [inventory, setInventory] = useState<InventoryItem[]>(() => {
    if (readLocalStorage<number>(OFFICIAL_INVENTORY_VERSION_KEY, 0) < OFFICIAL_INVENTORY_VERSION) return initialInventory;
    return cachedOperations ? cachedOperations.inventory as InventoryItem[] : readLocalStorage("gbp-inventory", initialInventory);
  });
  const [dispatches, setDispatches] = useState<DispatchRecord[]>(() => cachedOperations ? cachedOperations.dispatches as DispatchRecord[] : readLocalStorage("gbp-dispatches", initialDispatches));
  const [scanHistory, setScanHistory] = useState<ScanTransaction[]>(() => cachedOperations ? cachedOperations.scanHistory as ScanTransaction[] : readLocalStorage("gbp-scan-history", initialScanHistory));
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => cachedOperations ? cachedOperations.auditLogs as AuditLog[] : readLocalStorage("gbp-audit-logs", initialAudit));
  const [recoveryHistory, setRecoveryHistory] = useState<RecoveryRecord[]>(() => cachedOperations?.recoveryHistory as RecoveryRecord[] || readLocalStorage("gbp-recovery-history", []));
  const [roleUsers, setRoleUsers] = useState<typeof initialUsers>(() => cachedOperations ? cachedOperations.users as typeof initialUsers : readLocalStorage("gbp-users-official-v1", initialUsers));
  const [operationsReady, setOperationsReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"connecting" | "connected" | "offline" | "conflict">("connecting");
  const operationsVersion = useRef(readLocalStorage(OPERATIONS_VERSION_KEY, 0));
  const applyingRemoteSnapshot = useRef(false);
  const databaseAvailable = useRef(false);
  const catalogMigrationPending = useRef(readLocalStorage<number>(OFFICIAL_INVENTORY_VERSION_KEY, 0) < OFFICIAL_INVENTORY_VERSION);
  const [activeRole, setActiveRole] = useState<UserRole>("Administrator");
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [datePreset, setDatePreset] = useState<"Today" | "This Week" | "This Month" | "Custom Range">("This Month");
  const [isAuthenticated, setIsAuthenticated] = useState(true);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [toast, setToast] = useState<{ type: "success" | "error" | "info" | "warning"; message: string } | null>(null);
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
  const [recoveryForm, setRecoveryForm] = useState({ sku: "", kind: "Return" as RecoveryRecord["kind"], quantity: "1", reference: "", reason: "" });
  const [productForm, setProductForm] = useState({ sku: "", name: "", category: "", price: "", stock: "0", minimumStock: "0", dimensions: "", weightKg: "", imageUrl: "" });

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
    let active = true;
    let firstSync = true;
    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(OPERATIONS_UPDATED_EVENT);

    const applySnapshot = (snapshot: OperationsSnapshot, version: number) => {
      operationsVersion.current = version;
      applyingRemoteSnapshot.current = true;
      setOrders(snapshot.orders as OrderRecord[]);
      setInventory(snapshot.inventory as InventoryItem[]);
      setDispatches(snapshot.dispatches as DispatchRecord[]);
      setScanHistory(snapshot.scanHistory as ScanTransaction[]);
      setAuditLogs(snapshot.auditLogs as AuditLog[]);
      setRecoveryHistory((snapshot.recoveryHistory || []) as RecoveryRecord[]);
      setNotifications(snapshot.notifications as NotificationItem[]);
      setRoleUsers(snapshot.users as typeof initialUsers);
    };

    const syncFromServer = async () => {
      try {
        const response = await fetch("/api/operations", { cache: "no-store" });
        if (response.status === 401) {
          window.location.assign("/admin/login?next=%2F");
          return;
        }
        if (!response.ok) throw new Error("Operations database is unavailable.");
        const payload = await response.json();
        if (!payload.configured) throw new Error("Operations database is not configured.");

        databaseAvailable.current = true;
        const version = Number(payload.version) || 0;
        if (isOperationsSnapshot(payload.state) && (firstSync || version > operationsVersion.current)) {
          applySnapshot(payload.state, version);
        } else {
          operationsVersion.current = Math.max(operationsVersion.current, version);
        }
        firstSync = false;
        setSyncStatus("connected");
        setOperationsReady(true);
      } catch {
        databaseAvailable.current = false;
        if (active) {
          setSyncStatus("offline");
          setOperationsReady(true);
        }
      }
    };

    channel?.addEventListener("message", (event: MessageEvent) => {
      const message = event.data as { snapshot?: unknown; version?: number };
      if (isOperationsSnapshot(message?.snapshot)) {
        applySnapshot(message.snapshot, Number(message.version) || operationsVersion.current);
      }
    });
    void syncFromServer();
    const polling = window.setInterval(syncFromServer, 4000);

    return () => {
      active = false;
      window.clearInterval(polling);
      channel?.close();
    };
  }, []);

  const operationsSnapshot: OperationsSnapshot = { orders, inventory, dispatches, scanHistory, auditLogs, recoveryHistory, notifications, users: roleUsers, inventoryCatalogVersion: OFFICIAL_INVENTORY_VERSION };

  useEffect(() => {
    writeLocalStorage(OPERATIONS_STORAGE_KEY, operationsSnapshot);
    writeLocalStorage(OPERATIONS_VERSION_KEY, operationsVersion.current);
    writeLocalStorage("gbp-orders", orders);
    writeLocalStorage("gbp-inventory", inventory);
    writeLocalStorage("gbp-dispatches", dispatches);
    writeLocalStorage("gbp-scan-history", scanHistory);
    writeLocalStorage("gbp-audit-logs", auditLogs);
    writeLocalStorage("gbp-recovery-history", recoveryHistory);
    writeLocalStorage("gbp-notifications", notifications);
    writeLocalStorage("gbp-users-official-v1", roleUsers);

    if (!operationsReady) return;
    if (applyingRemoteSnapshot.current) {
      applyingRemoteSnapshot.current = false;
      return;
    }
    if (!databaseAvailable.current) return;

    const channel = typeof BroadcastChannel === "undefined" ? null : new BroadcastChannel(OPERATIONS_UPDATED_EVENT);
    channel?.postMessage({ snapshot: operationsSnapshot, version: operationsVersion.current });
    channel?.close();

    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch("/api/operations", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: operationsSnapshot, version: operationsVersion.current }),
        });
        if (response.status === 409) {
          setSyncStatus("conflict");
          setToast({ type: "warning", message: "A newer update was saved by another operator. The latest database state is being loaded." });
          const latest = await fetch("/api/operations", { cache: "no-store" });
          const payload = await latest.json();
          if (latest.ok && isOperationsSnapshot(payload.state)) {
            operationsVersion.current = Number(payload.version) || 0;
            applyingRemoteSnapshot.current = true;
            setOrders(payload.state.orders as OrderRecord[]);
            setInventory(payload.state.inventory as InventoryItem[]);
            setDispatches(payload.state.dispatches as DispatchRecord[]);
            setScanHistory(payload.state.scanHistory as ScanTransaction[]);
            setAuditLogs(payload.state.auditLogs as AuditLog[]);
            setRecoveryHistory((payload.state.recoveryHistory || []) as RecoveryRecord[]);
            setNotifications(payload.state.notifications as NotificationItem[]);
            setRoleUsers(payload.state.users as typeof initialUsers);
          }
          return;
        }
        if (!response.ok) throw new Error("Save failed.");
        const payload = await response.json();
        operationsVersion.current = Number(payload.version) || operationsVersion.current;
        writeLocalStorage(OPERATIONS_VERSION_KEY, operationsVersion.current);
        setSyncStatus("connected");
      } catch {
        databaseAvailable.current = false;
        setSyncStatus("offline");
        setToast({ type: "warning", message: "Changes are saved locally and will sync when the database is available." });
      }
    }, 250);

    return () => window.clearTimeout(timer);
  }, [operationsReady, orders, inventory, dispatches, scanHistory, auditLogs, recoveryHistory, notifications, roleUsers]);

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

  const addAuditLog = (user: string, action: string, record: string, details: string, previousValue?: string, newValue?: string) => {
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
        previousValue,
        newValue,
      },
      ...current,
    ].slice(0, 1000));
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
  const inventoryValue = inventory.reduce((sum, item) => sum + item.price * item.onHand, 0);
  const inventoryCategories = new Set(inventory.map((item) => item.category)).size;

  const handleLogin = async () => {
    if (!loginForm.email.trim() || !loginForm.password) {
      setToast({ type: "error", message: "Enter your admin username and password." });
      return;
    }
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginForm.email.trim(), password: loginForm.password }),
      });
      if (!response.ok) {
        setToast({ type: "error", message: "Admin sign-in failed. Check your credentials." });
        return;
      }
      setIsAuthenticated(true);
      window.location.assign("/");
    } catch {
      setToast({ type: "error", message: "Unable to reach the sign-in service." });
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/admin/logout", { method: "POST" });
    } finally {
      window.location.assign("/admin/login?next=%2F");
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

    if (orders.some((order) => order.salesOrderNumber.toLowerCase() === orderForm.salesOrderNumber.trim().toLowerCase())) {
      setToast({ type: "error", message: "That sales order number already exists." });
      return;
    }

    const product = inventory.find((item) => item.sku.toLowerCase() === orderForm.productSku.trim().toLowerCase());
    if (!product) {
      setToast({ type: "error", message: "Select a product SKU from the inventory catalog." });
      return;
    }
    const availableStock = product.onHand - product.reserved;
    if (quantity > availableStock) {
      setToast({ type: "error", message: `Only ${Math.max(availableStock, 0)} units of ${product.productName} are available.` });
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
      productSku: product.sku,
      productName: product.productName,
      quantity,
      paymentMethod: orderForm.paymentMethod,
      paymentStatus: "Pending",
      paymentReference: orderForm.paymentReference,
      codAmount: Number(orderForm.codAmount || 0),
      orderDate: orderForm.orderDate,
      notes: orderForm.notes,
      logisticsStatus: "Pending",
      dispatchStatus: "Ready for Dispatch",
      workflowStatus: "Order Command Center",
      trackingNumber: `GBP-TRK-${Math.floor(100000 + Math.random() * 900000)}`,
      createdAt: new Date().toISOString(),
    };

    setInventory((current) => current.map((item) => item.id === product.id
      ? { ...item, reserved: item.reserved + quantity, lastUpdated: new Date().toISOString() }
      : item));
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
    addAuditLog(activeRole, "Order saved and stock reserved", newOrder.salesOrderNumber, `${quantity} × ${product.sku}; payment ${newOrder.paymentStatus}; fulfillment entered command center.`);
    addNotification("Order created", `${newOrder.salesOrderNumber} reserved ${quantity} × ${product.productName}.`, "success");
    setToast({ type: "success", message: "Order created, stock reserved, and added to the command center." });
    setModule("Order Command Center");
  };

  const handleAdvanceWorkflow = (order: OrderRecord) => {
    const currentStage = getWorkflowStage(order);
    const currentIndex = WORKFLOW_STAGES.indexOf(currentStage);
    const nextStage = WORKFLOW_STAGES[currentIndex + 1];
    if (!nextStage || currentStage === "Barcode Verification") {
      setToast({ type: "info", message: "Scan the order SKU to complete barcode verification and dispatch." });
      return;
    }
    if (currentStage === "Order Command Center" && order.paymentMethod !== "COD" && order.paymentStatus !== "Confirmed") {
      setToast({ type: "warning", message: "Confirm payment before starting order picking." });
      return;
    }

    const changes: Partial<OrderRecord> = { workflowStatus: nextStage };
    if (nextStage === "Shipment Queue") changes.dispatchStatus = "Ready for Dispatch";
    if (nextStage === "Delivered") {
      changes.dispatchStatus = "Completed";
      if (order.paymentMethod === "COD") changes.paymentStatus = "Confirmed";
    }
    if (nextStage === "In Transit") changes.dispatchStatus = "In Transit";
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, ...changes } : item));
    if (nextStage === "In Transit" || nextStage === "Delivered") {
      setDispatches((current) => current.map((dispatch) => dispatch.salesOrderNumber === order.salesOrderNumber
        ? { ...dispatch, status: nextStage === "In Transit" ? "In Transit" : "Completed" }
        : dispatch));
    }
    addAuditLog(activeRole, "Fulfillment stage advanced", order.salesOrderNumber, `${currentStage} → ${nextStage}.`, currentStage, nextStage);
    addNotification("Fulfillment updated", `${order.salesOrderNumber} moved to ${nextStage}.`, "info");
    setToast({ type: "success", message: `${order.salesOrderNumber} moved to ${nextStage}.` });
  };

  const handleConfirmPayment = (order: OrderRecord) => {
    if (order.paymentStatus === "Confirmed") return;
    setOrders((current) => current.map((item) => item.id === order.id ? { ...item, paymentStatus: "Confirmed" } : item));
    addAuditLog(activeRole, "Payment confirmed", order.salesOrderNumber, `${order.paymentMethod} payment was confirmed.`, "Pending", "Confirmed");
    addNotification("Payment confirmed", `${order.salesOrderNumber} is cleared for fulfillment.`, "success");
    setToast({ type: "success", message: `Payment confirmed for ${order.salesOrderNumber}.` });
  };

  const handleLogisticsStatus = (orderId: string, status: LogisticsStatus) => {
    setOrders((current) =>
      current.map((order) =>
        order.id === orderId
          ? {
              ...order,
              logisticsStatus: status,
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

    const recordFailedScan = (message: string) => {
      const failedTransaction: ScanTransaction = {
        id: createId("SCN"),
        timestamp: new Date().toISOString(),
        user: activeRole,
        sku: normalized,
        product: "Unmatched scan",
        quantity: 0,
        type: scanAction,
        reference: "Barcode validation",
        status: "Error",
      };
      setScanHistory((current) => [failedTransaction, ...current].slice(0, 50));
      addNotification("Barcode action rejected", message, "error");
      setToast({ type: "error", message });
    };

    const parsedBarcode = parseBarcode(normalized);
    if (!parsedBarcode) {
      recordFailedScan("Barcode format invalid. Expected material-category-design-color-variant-item.");
      return;
    }

    const matchedItem = inventory.find(
      (item) => item.barcode.toLowerCase() === normalized.toLowerCase() || item.sku.toLowerCase() === normalized.toLowerCase(),
    );

    if (!matchedItem) {
      recordFailedScan("No inventory record matched this barcode. Please verify SKU or scan again.");
      return;
    }

    if (scanAction === "Inventory Verification" && scanHistory.some((entry) => entry.sku.toLowerCase() === matchedItem.sku.toLowerCase() && entry.type === scanAction && entry.status === "Success" && entry.timestamp.slice(0, 10) === new Date().toISOString().slice(0, 10))) {
      recordFailedScan("This item has already been verified today.");
      return;
    }

    let quantity = 1;
    let reference = `SCAN-${matchedItem.sku}`;
    if (scanAction === "Order Picking") {
      const order = orders.find((item) => item.productSku === matchedItem.sku && getWorkflowStage(item) === "Picking");
      if (!order) {
        recordFailedScan("No order in picking matches this SKU.");
        return;
      }
      if (order.paymentMethod !== "COD" && order.paymentStatus !== "Confirmed") {
        recordFailedScan("Confirm payment before picking this order.");
        return;
      }
      quantity = order.quantity;
      reference = order.salesOrderNumber;
      setOrders((current) => current.map((item) => item.id === order.id ? { ...item, workflowStatus: "Packing" } : item));
      addAuditLog(activeRole, "Order picked by barcode", order.salesOrderNumber, `${quantity} × ${matchedItem.sku}.`, "Picking", "Packing");
    } else if (scanAction === "Dispatch") {
      const order = orders.find((item) => item.productSku === matchedItem.sku && getWorkflowStage(item) === "Barcode Verification");
      if (!order || !handleDispatchSubmit(order.id)) {
        if (!order) recordFailedScan("No order awaiting barcode verification matches this SKU.");
        return;
      }
      quantity = order.quantity;
      reference = order.salesOrderNumber;
    } else if (scanAction === "Stock Out") {
      if (matchedItem.onHand - matchedItem.reserved < 1) {
        recordFailedScan("No unreserved units are available to stock out.");
        return;
      }
      setInventory((current) => current.map((item) => item.id === matchedItem.id
        ? { ...item, onHand: item.onHand - 1, dispatched: item.dispatched + 1, lastUpdated: new Date().toISOString(), status: item.onHand - 1 <= item.lowStockThreshold ? "Low Stock" : "Healthy" }
        : item));
    } else if (scanAction === "Stock In") {
      setInventory((current) => current.map((item) => item.id === matchedItem.id
        ? { ...item, onHand: item.onHand + 1, lastUpdated: new Date().toISOString(), status: item.onHand + 1 <= item.lowStockThreshold ? "Low Stock" : "Healthy" }
        : item));
    } else if (scanAction === "Returns") {
      setInventory((current) => current.map((item) => item.id === matchedItem.id
        ? { ...item, onHand: item.onHand + 1, returned: item.returned + 1, lastUpdated: new Date().toISOString(), status: item.onHand + 1 <= item.lowStockThreshold ? "Low Stock" : "Healthy" }
        : item));
    }

    const transaction: ScanTransaction = {
      id: createId("SCN"),
      timestamp: new Date().toISOString(),
      user: activeRole,
      sku: matchedItem.sku,
      product: matchedItem.productName,
      quantity,
      type: scanAction,
      reference,
      status: "Success",
    };

    setScanHistory((current) => [transaction, ...current].slice(0, 100));
    addAuditLog(activeRole, `${scanAction} scan processed`, matchedItem.sku, `${quantity} × ${matchedItem.productName}; reference ${reference}.`);
    addNotification(`${scanAction} completed`, `${matchedItem.productName} · ${quantity} unit${quantity === 1 ? "" : "s"}.`, "success");
    setToast({ type: "success", message: `${scanAction} completed for ${matchedItem.productName}.` });
    setScanInput("");
  };

  const handleDispatchSubmit = (orderId?: string): boolean => {
    const order = orders.find((item) => item.id === orderId) || orders.find((item) => getWorkflowStage(item) === "Barcode Verification");
    if (!order) {
      setToast({ type: "warning", message: "No order is awaiting barcode verification." });
      return false;
    }
    if (getWorkflowStage(order) !== "Barcode Verification") {
      setToast({ type: "warning", message: "Move the order to barcode verification before dispatch." });
      return false;
    }
    const existingDispatch = dispatches.find((dispatch) => dispatch.salesOrderNumber === order.salesOrderNumber);
    if (existingDispatch && existingDispatch.status !== "Ready for Dispatch") {
      setToast({ type: "error", message: "This order has already been dispatched." });
      return false;
    }
    const product = inventory.find((item) => item.sku === order.productSku);
    if (!product || product.onHand < order.quantity || product.reserved < order.quantity) {
      setToast({ type: "error", message: "Reserved inventory does not cover this order. Review stock before dispatch." });
      return false;
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
      status: "Dispatched",
    };

    setInventory((current) => current.map((item) => item.id === product.id
      ? { ...item, onHand: item.onHand - order.quantity, reserved: item.reserved - order.quantity, dispatched: item.dispatched + order.quantity, lastUpdated: new Date().toISOString(), status: item.onHand - order.quantity <= item.lowStockThreshold ? "Low Stock" : "Healthy" }
      : item));
    setDispatches((current) => existingDispatch
      ? current.map((dispatch) => dispatch.id === existingDispatch.id ? { ...dispatch, status: "Dispatched", trackingNumber: order.trackingNumber } : dispatch)
      : [newDispatch, ...current]);
    setOrders((current) =>
      current.map((item) =>
        item.id === order.id ? { ...item, workflowStatus: "Dispatched", dispatchStatus: "Dispatched", logisticsStatus: "Received" } : item,
      ),
    );
    addAuditLog(activeRole, "Order dispatched", order.salesOrderNumber, `${order.quantity} × ${product.sku}; tracking ${order.trackingNumber}.`, "Barcode Verification", "Dispatched");
    addNotification("Dispatch registered", `${order.salesOrderNumber} is now in shipment tracking.`, "success");
    setToast({ type: "success", message: `${order.salesOrderNumber} dispatched and inventory deducted.` });
    return true;
  };

  const handleUpdateInventory = (inventoryId: string, field: keyof InventoryItem, value: string | number) => {
    const existing = inventory.find((item) => item.id === inventoryId);
    if (!existing) return;
    if (typeof value === "number" && (!Number.isFinite(value) || value < 0)) {
      setToast({ type: "error", message: "Inventory values must be zero or greater." });
      return;
    }
    if ((field === "onHand" || field === "lowStockThreshold") && typeof value === "number" && !Number.isInteger(value)) {
      setToast({ type: "error", message: "Stock counts and thresholds must be whole numbers." });
      return;
    }
    if (field === "onHand" && Number(value) < existing.reserved) {
      setToast({ type: "error", message: `On-hand stock cannot be lower than ${existing.reserved} reserved units.` });
      return;
    }
    if (field === "price" && Number(value) <= 0) {
      setToast({ type: "error", message: "Product price must be greater than zero." });
      return;
    }
    setInventory((current) =>
      current.map((item) => {
        if (item.id !== inventoryId) return item;
        const nextItem = { ...item, [field]: value } as InventoryItem;
        nextItem.status = nextItem.onHand === 0 ? "Critical" : nextItem.onHand <= nextItem.lowStockThreshold ? "Low Stock" : "Healthy";
        return nextItem;
      }),
    );
    addAuditLog(activeRole, "Inventory updated", existing.sku, `${String(field)} updated.`, String(existing[field] ?? ""), String(value));
  };

  const handleRecoverySubmit = () => {
    const product = inventory.find((item) => item.sku === recoveryForm.sku);
    const quantity = Number(recoveryForm.quantity);
    if (!product || !Number.isInteger(quantity) || quantity <= 0 || !recoveryForm.reason.trim()) {
      setToast({ type: "error", message: "Choose a SKU, enter a positive whole quantity, and provide a reason." });
      return;
    }
    const available = product.onHand - product.reserved;
    if (recoveryForm.kind === "Damage" && quantity > available) {
      setToast({ type: "error", message: `Only ${Math.max(available, 0)} unreserved units can be marked damaged.` });
      return;
    }

    const now = new Date();
    const reference = recoveryForm.reference.trim() || `REC-${now.getTime()}`;
    const oldOnHand = product.onHand;
    const nextOnHand = recoveryForm.kind === "Return" ? oldOnHand + quantity : oldOnHand - quantity;
    const recovery: RecoveryRecord = {
      id: createId("REC").toUpperCase(),
      reference,
      kind: recoveryForm.kind,
      sku: product.sku,
      product: product.productName,
      quantity,
      user: activeRole,
      reason: recoveryForm.reason.trim(),
      createdAt: now.toISOString(),
    };

    setInventory((current) => current.map((item) => item.id === product.id
      ? {
          ...item,
          onHand: nextOnHand,
          returned: item.returned + (recoveryForm.kind === "Return" ? quantity : 0),
          damaged: item.damaged + (recoveryForm.kind === "Damage" ? quantity : 0),
          lastUpdated: now.toISOString(),
          status: nextOnHand <= item.lowStockThreshold ? "Low Stock" : "Healthy",
        }
      : item));
    setRecoveryHistory((current) => [recovery, ...current].slice(0, 500));
    addAuditLog(activeRole, `${recoveryForm.kind} recorded`, reference, `${quantity} × ${product.sku}. ${recovery.reason}`, `On hand: ${oldOnHand}; returned: ${product.returned}; damaged: ${product.damaged}`, `On hand: ${nextOnHand}; returned: ${product.returned + (recoveryForm.kind === "Return" ? quantity : 0)}; damaged: ${product.damaged + (recoveryForm.kind === "Damage" ? quantity : 0)}`);
    addNotification(`${recoveryForm.kind} recorded`, `${reference} adjusted ${product.productName} by ${quantity}.`, recoveryForm.kind === "Damage" ? "warning" : "success");
    setRecoveryForm((current) => ({ ...current, quantity: "1", reference: "", reason: "" }));
    setToast({ type: "success", message: `${recoveryForm.kind} recorded and inventory adjusted.` });
  };

  const handleProductCreate = () => {
    const parsed = parseBarcode(productForm.sku.trim());
    const price = Number(productForm.price);
    const stock = Number(productForm.stock);
    const minimumStock = Number(productForm.minimumStock);
    const weightKg = Number(productForm.weightKg || 0);
    if (!parsed || !productForm.name.trim() || !productForm.category.trim() || !Number.isFinite(price) || price <= 0 || !Number.isInteger(stock) || stock < 0 || !Number.isInteger(minimumStock) || minimumStock < 0 || !Number.isFinite(weightKg) || weightKg < 0) {
      setToast({ type: "error", message: "Enter a valid six-part SKU, product name, category, price, stock, and minimum stock." });
      return;
    }
    if (inventory.some((item) => item.sku.toLowerCase() === productForm.sku.trim().toLowerCase())) {
      setToast({ type: "error", message: "That SKU already exists in the catalog." });
      return;
    }

    const item: InventoryItem = {
      id: createId("INV").toUpperCase(),
      sku: productForm.sku.trim(),
      productName: productForm.name.trim(),
      category: productForm.category.trim(),
      material: parsed.material,
      designNo: parsed.designNo,
      colorVariant: parsed.colorVariant,
      designVariant: parsed.designVariant,
      itemNumber: parsed.itemNumber,
      barcode: productForm.sku.trim(),
      onHand: stock,
      reserved: 0,
      dispatched: 0,
      returned: 0,
      damaged: 0,
      lowStockThreshold: minimumStock,
      price,
      dimensions: productForm.dimensions.trim(),
      weightKg,
      imageUrl: productForm.imageUrl.trim(),
      lastUpdated: new Date().toISOString(),
      status: stock <= minimumStock ? "Low Stock" : "Healthy",
    };
    setInventory((current) => [item, ...current]);
    addAuditLog(activeRole, "Product created", item.sku, `Created ${item.productName}.`, "Not in catalog", `SKU ${item.sku}; stock ${stock}; price ${formatMoney(price)}`);
    addNotification("Product added", `${item.productName} is now available in the catalog.`, "success");
    setProductForm({ sku: "", name: "", category: "", price: "", stock: "0", minimumStock: "0", dimensions: "", weightKg: "", imageUrl: "" });
    setToast({ type: "success", message: `${item.productName} added to the catalog.` });
  };

  const handleProductDelete = (item: InventoryItem) => {
    const referenced = orders.some((order) => order.productSku === item.sku)
      || dispatches.some((dispatch) => dispatch.productSku === item.sku)
      || recoveryHistory.some((record) => record.sku === item.sku)
      || scanHistory.some((scan) => scan.sku === item.sku);
    if (referenced) {
      setToast({ type: "error", message: "This SKU is referenced by an order or recovery record and cannot be deleted." });
      return;
    }
    if (!window.confirm(`Remove ${item.productName} from the product catalog?`)) return;
    setInventory((current) => current.filter((product) => product.id !== item.id));
    addAuditLog(activeRole, "Product removed", item.sku, `Removed ${item.productName}.`, `SKU ${item.sku}; stock ${item.onHand}`, "Removed from catalog");
    setToast({ type: "success", message: `${item.productName} removed from the catalog.` });
  };

  const liveKpis = [
    { label: "Total Orders", value: orders.length, icon: ClipboardList, tone: "gold" },
    { label: "Pending Orders", value: orders.filter((order) => order.paymentStatus === "Pending").length, icon: Clock3, tone: "blue" },
    { label: "Confirmed Payments", value: paidOrders, icon: CheckCheck, tone: "green" },
    { label: "Ready for Dispatch", value: dispatches.filter((d) => d.status === "Ready for Dispatch").length, icon: Truck, tone: "purple" },
    { label: "Units on Hand", value: totalInventory, icon: Warehouse, tone: "navy" },
    { label: "Low Stock Items", value: lowStockCount, icon: AlertTriangle, tone: "amber" },
  ];

  const chartData = [
    ...Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setDate(1);
      date.setMonth(date.getMonth() - (5 - index));
      const monthKey = date.toISOString().slice(0, 7);
      return {
        label: date.toLocaleDateString("en", { month: "short" }),
        value: orders.filter((order) => {
          const orderDate = typeof order?.orderDate === "string"
            ? order.orderDate
            : typeof order?.createdAt === "string" ? order.createdAt : "";
          return orderDate.slice(0, 7) === monthKey;
        }).length,
      };
    }),
  ];
  const maxMonthlyOrders = Math.max(1, ...chartData.map((item) => item.value));

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
                  <label className="field"><span>Product SKU</span><select value={orderForm.productSku} onChange={(e) => { const product = inventory.find((item) => item.sku === e.target.value); setOrderForm({ ...orderForm, productSku: e.target.value, productName: product?.productName || "" }); }}><option value="">Select an in-stock SKU</option>{inventory.map((item) => <option key={item.id} value={item.sku} disabled={item.onHand <= item.reserved}>{item.sku} · {Math.max(item.onHand - item.reserved, 0)} available</option>)}</select></label>
                  <label className="field"><span>Product Name</span><input value={orderForm.productName} readOnly placeholder="Selected from catalog" /></label>
                  <label className="field"><span>Quantity</span><input type="number" min="1" value={orderForm.quantity} onChange={(e) => setOrderForm({ ...orderForm, quantity: e.target.value })} /></label>
                  <label className="field"><span>Payment Method</span><select value={orderForm.paymentMethod} onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value as PaymentMethod })}><option value="GCASH">GCASH</option><option value="Bank Transfer">Bank Transfer</option><option value="COD">COD</option></select></label>
                  <label className="field"><span>Payment Status</span><select value="Pending" disabled><option value="Pending">Pending verification</option></select></label>
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
                    <option value="Order Picking">Order Picking</option>
                    <option value="Dispatch">Dispatch</option>
                    <option value="Returns">Returns</option>
                    <option value="Inventory Verification">Inventory Verification</option>
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
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">Dispatch Registry</span>
                <h1>Outbound shipments</h1>
              </div>
              <button className="primary-button" onClick={() => { setScanAction("Dispatch"); setModule("Barcode Scanner"); }}>Open dispatch scanner</button>
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
                    <tr><th>SO No.</th><th>Client</th><th>Courier</th><th>Tracking</th><th>Qty</th><th>Fee</th><th>Status</th><th>Journey</th><th>Action</th></tr>
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
                        <td>{getWorkflowStage(orders.find((order) => order.salesOrderNumber === dispatch.salesOrderNumber) || initialOrders[0])}</td>
                        <td>{(() => { const order = orders.find((item) => item.salesOrderNumber === dispatch.salesOrderNumber); const stage = order ? getWorkflowStage(order) : "Delivered"; return order && (stage === "Dispatched" || stage === "In Transit") ? <button className="tiny-button success" onClick={() => handleAdvanceWorkflow(order)}>{stage === "Dispatched" ? "Mark in transit" : "Mark delivered"}</button> : "—"; })()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      case "Order Command Center":
      case "Shipment Queue": {
        const isShipmentQueue = module === "Shipment Queue";
        const workflowOrders = visibleOrders.filter((order) => {
          const stage = getWorkflowStage(order);
          return isShipmentQueue
            ? stage === "Shipment Queue" || stage === "Barcode Verification"
            : stage !== "Dispatched" && stage !== "In Transit" && stage !== "Delivered";
        });
        return (
          <div className="module-shell">
            <div className="page-header">
              <div>
                <span className="eyebrow">{isShipmentQueue ? "Shipment Queue" : "Order Command Center"}</span>
                <h1>{isShipmentQueue ? "Ready for barcode verification" : "Fulfillment workboard"}</h1>
              </div>
              {!isShipmentQueue && <span className="mini-pill">{workflowOrders.length} open orders</span>}
            </div>
            <div className="stat-grid">
              {[
                { label: "Queue Count", value: queueCount },
                { label: "Ready to Ship", value: orders.filter((order) => getWorkflowStage(order) === "Shipment Queue" || getWorkflowStage(order) === "Barcode Verification").length },
                { label: "In Transit", value: orders.filter((order) => getWorkflowStage(order) === "In Transit").length },
                { label: "Completed", value: completedOrders },
              ].map((item) => <div className="mini-stat" key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}
            </div>
            <div className="panel">
              <div className="table-wrap">
                <table>
                  <thead><tr><th>SO No.</th><th>Customer</th><th>Product SKU</th><th>Payment</th><th>Fulfillment stage</th><th>Action</th></tr></thead>
                  <tbody>
                    {workflowOrders.map((order) => {
                      const stage = getWorkflowStage(order);
                      const actionLabel = stage === "Order Command Center" ? "Start picking" : stage === "Picking" ? "Move to packing" : stage === "Packing" ? "Quality check" : stage === "Quality Check" ? "Queue shipment" : stage === "Shipment Queue" ? "Verify barcode" : "Scan to dispatch";
                      return <tr key={order.id}>
                        <td>{order.salesOrderNumber}</td>
                        <td>{order.clientName}<div className="muted-small">{order.city}</div></td>
                        <td>{order.productSku}<div className="muted-small">{order.quantity} × {order.productName}</div></td>
                        <td><span className={`status-badge ${order.paymentStatus === "Confirmed" || order.paymentMethod === "COD" ? "success" : "neutral"}`}>{order.paymentMethod === "COD" ? "COD" : order.paymentStatus}</span></td>
                        <td><span className="status-badge advice">{stage}</span></td>
                        <td><button className="tiny-button success" onClick={() => { if (stage === "Barcode Verification") { setScanAction("Dispatch"); setScanInput(order.productSku); setModule("Barcode Scanner"); } else handleAdvanceWorkflow(order); }}>{actionLabel}</button></td>
                      </tr>;
                    })}
                    {!workflowOrders.length && <tr><td colSpan={6}>No orders in this queue.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        );
      }
      case "Shipment Tracker": {
        const trackingSearch = trackingQuery.trim().toLowerCase();
        const trackedOrder = trackingSearch
          ? orders.find((order) => `${order.salesOrderNumber} ${order.trackingNumber} ${order.clientName}`.toLowerCase().includes(trackingSearch))
          : orders[0];
        const stage = trackedOrder ? getWorkflowStage(trackedOrder) : null;
        const activeStep = !trackedOrder ? -1 : stage === "Delivered" ? 9 : stage === "In Transit" ? 8 : stage === "Dispatched" ? 7 : stage === "Barcode Verification" ? 6 : stage === "Shipment Queue" ? 5 : stage === "Quality Check" ? 4 : stage === "Packing" ? 3 : stage === "Picking" ? 2 : trackedOrder.paymentStatus === "Confirmed" || trackedOrder.paymentMethod === "COD" ? 1 : 0;
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
                <input value={trackingQuery} onChange={(e) => setTrackingQuery(e.target.value)} placeholder="Search order number, tracking, or customer" />
                <span className="mini-pill">{trackedOrder ? stage : "No match"}</span>
              </div>
              {trackedOrder ? <>
                <div className="tracking-order-summary"><strong>{trackedOrder.salesOrderNumber} · {trackedOrder.clientName}</strong><span>{trackedOrder.productName} ×{trackedOrder.quantity}</span><span>{trackedOrder.trackingNumber}</span></div>
                <div className="timeline">
                  {["Order Received", "Payment Verification", "Picking", "Packing", "Quality Check", "Shipment Queue", "Barcode Verification", "Dispatched", "In Transit", "Delivered"].map((label, index) => (
                    <div key={label} className={`timeline-step ${index <= activeStep ? "active" : ""}`}>
                      <span>{index + 1}</span>
                      <strong>{label}</strong>
                      <small>{index === activeStep ? "Current stage" : ""}</small>
                    </div>
                  ))}
                </div>
              </> : <p className="empty-state">No shipment matches that search.</p>}
            </div>
          </div>
        );
      }
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
              <div className="panel-title-row"><div><span className="eyebrow">Master catalog</span><h2>Add a product / SKU</h2></div></div>
              <div className="form-grid">
                <label className="field"><span>SKU / barcode</span><input value={productForm.sku} onChange={(event) => setProductForm({ ...productForm, sku: event.target.value.toUpperCase() })} placeholder="WOOD-FURN-004-CHAR-BLACK-00017" /></label>
                <label className="field"><span>Product name</span><input value={productForm.name} onChange={(event) => setProductForm({ ...productForm, name: event.target.value })} /></label>
                <label className="field"><span>Category</span><input value={productForm.category} onChange={(event) => setProductForm({ ...productForm, category: event.target.value })} /></label>
                <label className="field"><span>Price (PHP)</span><input type="number" min="0.01" step="0.01" value={productForm.price} onChange={(event) => setProductForm({ ...productForm, price: event.target.value })} /></label>
                <label className="field"><span>Opening stock</span><input type="number" min="0" step="1" value={productForm.stock} onChange={(event) => setProductForm({ ...productForm, stock: event.target.value })} /></label>
                <label className="field"><span>Minimum stock</span><input type="number" min="0" step="1" value={productForm.minimumStock} onChange={(event) => setProductForm({ ...productForm, minimumStock: event.target.value })} /></label>
                <label className="field"><span>Dimensions</span><input value={productForm.dimensions} onChange={(event) => setProductForm({ ...productForm, dimensions: event.target.value })} placeholder="L × W × H" /></label>
                <label className="field"><span>Weight (kg)</span><input type="number" min="0" step="0.01" value={productForm.weightKg} onChange={(event) => setProductForm({ ...productForm, weightKg: event.target.value })} /></label>
                <label className="field"><span>Product image URL</span><input type="url" value={productForm.imageUrl} onChange={(event) => setProductForm({ ...productForm, imageUrl: event.target.value })} /></label>
              </div>
              <button className="primary-button" onClick={handleProductCreate}>Add product to catalog</button>
            </div>
            <div className="panel">
              <div className="panel-title-row"><h2>Products / SKU</h2><span className="mini-pill">{visibleInventory.length} products</span></div>
              <div className="table-wrap">
                <table>
                  <thead>
                    <tr><th>SKU / barcode</th><th>Product</th><th>Category</th><th>Color</th><th>Variant</th><th>Dimensions</th><th>Weight</th><th>Price</th><th>On hand</th><th>Min stock</th><th>Status</th><th>Image URL</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {visibleInventory.map((item) => (
                      <tr key={item.id}>
                        <td>{item.sku}</td>
                        <td><input aria-label={`${item.sku} product name`} value={item.productName} onChange={(event) => handleUpdateInventory(item.id, "productName", event.target.value)} /></td>
                        <td><input aria-label={`${item.sku} category`} value={item.category} onChange={(event) => handleUpdateInventory(item.id, "category", event.target.value)} /></td>
                        <td>{item.colorVariant}</td>
                        <td>{item.designVariant}</td>
                        <td><input aria-label={`${item.sku} dimensions`} value={item.dimensions || ""} onChange={(event) => handleUpdateInventory(item.id, "dimensions", event.target.value)} /></td>
                        <td><input aria-label={`${item.sku} weight`} type="number" min="0" step="0.01" value={item.weightKg || 0} onChange={(event) => handleUpdateInventory(item.id, "weightKg", Number(event.target.value))} /></td>
                        <td><input aria-label={`${item.sku} price`} type="number" min="0" step="0.01" value={item.price} onChange={(event) => handleUpdateInventory(item.id, "price", Number(event.target.value))} /></td>
                        <td><input aria-label={`${item.sku} stock`} type="number" min={item.reserved} step="1" value={item.onHand} onChange={(event) => handleUpdateInventory(item.id, "onHand", Number(event.target.value))} /></td>
                        <td><input aria-label={`${item.sku} minimum stock`} type="number" min="0" step="1" value={item.lowStockThreshold} onChange={(event) => handleUpdateInventory(item.id, "lowStockThreshold", Number(event.target.value))} /></td>
                        <td><span className={`status-badge ${item.onHand <= item.lowStockThreshold ? "warning" : "success"}`}>{item.onHand <= item.lowStockThreshold ? "Low stock" : "Active"}</span></td>
                        <td><input aria-label={`${item.sku} image URL`} type="url" value={item.imageUrl || ""} onChange={(event) => handleUpdateInventory(item.id, "imageUrl", event.target.value)} /></td>
                        <td><button className="tiny-button danger" onClick={() => handleProductDelete(item)}>Delete</button></td>
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
                    <tr><th>SO No.</th><th>Customer</th><th>Method</th><th>Status</th><th>Reference</th><th>Amount</th><th>Action</th></tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => {
                      const product = inventory.find((item) => item.sku === order.productSku);
                      const amount = order.paymentMethod === "COD" ? order.codAmount : (product?.price || 0) * order.quantity;
                      return (
                      <tr key={order.id}>
                        <td>{order.salesOrderNumber}</td>
                        <td>{order.clientName}</td>
                        <td>{order.paymentMethod}</td>
                        <td><span className={`status-badge ${order.paymentStatus === "Confirmed" ? "success" : "neutral"}`}>{order.paymentStatus}</span></td>
                        <td>{order.paymentReference || "-"}</td>
                        <td>{formatMoney(amount)}</td>
                        <td>{order.paymentMethod === "COD" || order.paymentStatus === "Confirmed" ? "—" : <button className="tiny-button success" onClick={() => handleConfirmPayment(order)}>Confirm</button>}</td>
                      </tr>
                    );})}
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
            <div className="panel recovery-panel">
              <div className="panel-title-row"><div><span className="eyebrow">Inventory adjustment</span><h2>Record a return or damaged item</h2></div></div>
              <div className="form-grid">
                <label className="field"><span>Product SKU</span><select value={recoveryForm.sku} onChange={(event) => setRecoveryForm({ ...recoveryForm, sku: event.target.value })}><option value="">Select product</option>{inventory.map((item) => <option key={item.id} value={item.sku}>{item.sku} · {item.productName}</option>)}</select></label>
                <label className="field"><span>Adjustment type</span><select value={recoveryForm.kind} onChange={(event) => setRecoveryForm({ ...recoveryForm, kind: event.target.value as RecoveryRecord["kind"] })}><option value="Return">Return to stock</option><option value="Damage">Mark damaged</option></select></label>
                <label className="field"><span>Quantity</span><input type="number" min="1" step="1" value={recoveryForm.quantity} onChange={(event) => setRecoveryForm({ ...recoveryForm, quantity: event.target.value })} /></label>
                <label className="field"><span>Reference</span><input value={recoveryForm.reference} onChange={(event) => setRecoveryForm({ ...recoveryForm, reference: event.target.value })} placeholder="Return or incident reference" /></label>
                <label className="field span-2"><span>Reason / condition notes</span><input value={recoveryForm.reason} onChange={(event) => setRecoveryForm({ ...recoveryForm, reason: event.target.value })} placeholder="Describe the return or damage" /></label>
              </div>
              <button className="primary-button" onClick={handleRecoverySubmit}>Save inventory adjustment</button>
            </div>
            <div className="panel">
              <div className="panel-title-row"><h2>Inventory recovery totals</h2></div>
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
            <div className="panel">
              <div className="panel-title-row"><h2>Recovery records</h2><span className="mini-pill">{recoveryHistory.length} records</span></div>
              <div className="table-wrap">
                <table>
                  <thead><tr><th>Reference</th><th>Type</th><th>SKU / product</th><th>Qty</th><th>Operator</th><th>Reason</th><th>Date</th></tr></thead>
                  <tbody>{recoveryHistory.map((entry) => <tr key={entry.id}><td>{entry.reference}</td><td>{entry.kind}</td><td>{entry.sku}<div className="muted-small">{entry.product}</div></td><td>{entry.quantity}</td><td>{entry.user}</td><td>{entry.reason}</td><td>{new Date(entry.createdAt).toLocaleString()}</td></tr>)}{!recoveryHistory.length && <tr><td colSpan={7}>No recovery records yet.</td></tr>}</tbody>
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
            <div className="stat-grid">
              {[
                { label: "Orders", value: orders.length },
                { label: "Sales value", value: formatMoney(orders.reduce((sum, order) => sum + (order.paymentMethod === "COD" ? order.codAmount : (inventory.find((item) => item.sku === order.productSku)?.price || 0) * order.quantity), 0)) },
                { label: "Paid orders", value: paidOrders },
                { label: "Dispatches", value: dispatches.length },
                { label: "Returned units", value: returnedItems },
                { label: "Damaged units", value: damagedItems },
                { label: "Staff actions", value: auditLogs.length },
              ].map((item) => <div className="mini-stat" key={item.label}><small>{item.label}</small><strong>{item.value}</strong></div>)}
            </div>
            <div className="report-grid">
              <div className="panel">
                <div className="panel-title-row"><h2>Monthly order volume</h2><span className="mini-pill">Last six months</span></div>
                <div className="bar-chart">
                  {chartData.map((entry) => (
                    <div key={entry.label} className="bar-group">
                      <span title={`${entry.value} orders`} style={{ height: `${entry.value ? Math.max((entry.value / maxMonthlyOrders) * 160, 12) : 3}px` }} />
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
                    <tr><th>User</th><th>Action</th><th>Record</th><th>Details</th><th>Previous value</th><th>New value</th><th>Date</th><th>Time</th></tr>
                  </thead>
                  <tbody>
                    {auditLogs.map((entry) => (
                      <tr key={entry.id}>
                        <td>{entry.user}</td>
                        <td>{entry.action}</td>
                        <td>{entry.record}</td>
                        <td>{entry.details}</td>
                        <td>{entry.previousValue || "—"}</td>
                        <td>{entry.newValue || "—"}</td>
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
          <div className="module-shell settings-page">
            <div className="page-header settings-header">
              <div>
                <span className="eyebrow">Settings</span>
                <h1>System configuration</h1>
                <p>Personalize your workspace and manage how GBP operations stay in sync.</p>
              </div>
            </div>
            <div className="settings-grid">
              <section className="settings-card">
                <div className="settings-card-heading">
                  <span className="settings-icon"><SunMedium size={18} /></span>
                  <div><span className="eyebrow">Display</span><h2>Appearance</h2></div>
                </div>
                <p>Choose the theme that feels right for your workspace.</p>
                <div className="theme-segment" role="group" aria-label="Color theme">
                  <button className={theme === "light" ? "active" : ""} aria-pressed={theme === "light"} onClick={() => setTheme("light")}><SunMedium size={15} /> Light</button>
                  <button className={theme === "dark" ? "active" : ""} aria-pressed={theme === "dark"} onClick={() => setTheme("dark")}><Moon size={15} /> Dark</button>
                </div>
              </section>

              <section className="settings-card">
                <div className="settings-card-heading">
                  <span className="settings-icon"><ShieldCheck size={18} /></span>
                  <div><span className="eyebrow">Workspace</span><h2>Role access</h2></div>
                </div>
                <p>Set the active role used across the operations workspace.</p>
                <label className="settings-field"><span>Current role</span><select value={activeRole} onChange={(event) => { const nextRole = event.target.value as UserRole; setActiveRole(nextRole); if (!getRoleModules(nextRole).includes(module)) setModule("Dashboard"); }}><option>Admin</option><option>Administrator</option><option>Management</option><option>Owner/Management</option><option>Logistics</option><option>Logistics Staff</option><option>Warehouse</option><option>Inventory Staff</option><option>Accounting</option><option>Accounting Staff</option><option>CSR</option><option>CSR-CSRM</option><option>Online Sales Design Consultant</option></select></label>
              </section>

              <section className="settings-card">
                <div className="settings-card-heading">
                  <span className="settings-icon"><Bell size={18} /></span>
                  <div><span className="eyebrow">System</span><h2>Notifications</h2></div>
                </div>
                <p>Refresh the activity feed with the latest workspace updates.</p>
                <button className="settings-sync" onClick={() => addNotification("System update", "All modules synchronized.", "info")}><span>Sync workspace</span><ArrowRight size={16} /></button>
              </section>
            </div>
          </div>
        );
      default:
        return (
          <div className="module-shell dashboard-view">
            <div className="page-header dashboard-header">
              <div>
                <span className="eyebrow">GBP Home Art &amp; Decors</span>
                <h1>GBP DASHBOARD</h1>
                <p>Home styling, lighting and decor operations at a glance.</p>
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
              <div className="panel profile-panel">
                <div className="panel-title-row">
                  <div>
                    <span className="eyebrow">Store profile</span>
                    <h2>Curated for the home</h2>
                  </div>
                  <span className="mini-pill">Philippine peso · PHP</span>
                </div>
                <p className="profile-copy">A considered collection of decor, lighting and statement pieces, managed from order intake through dispatch.</p>
                <div className="profile-stats">
                  <div><small>Catalog categories</small><strong>{inventoryCategories}</strong></div>
                  <div><small>Active SKUs</small><strong>{inventory.length}</strong></div>
                  <div><small>Stock value</small><strong>{formatMoney(inventoryValue)}</strong></div>
                  <div><small>Returns recorded</small><strong>{returnedItems}</strong></div>
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
                <div className="panel-title-row"><div><span className="eyebrow">Activity</span><h2>Recent updates</h2></div></div>
                <div className="stack-list">
                  {notifications.slice(0, 4).map((note) => (
                    <div className="list-row note-row" key={note.id}>
                      <div>
                        <strong>{note.title}</strong>
                        <small>{note.detail}</small>
                      </div>
                      <span className={`status-badge ${note.type === "success" ? "success" : note.type === "warning" ? "warning" : note.type === "error" ? "danger" : "neutral"}`}>{note.time}</span>
                    </div>
                  ))}
                  {!notifications.length && <p className="dashboard-empty">No recent updates.</p>}
                </div>
              </div>

              <div className="panel">
                <div className="panel-title-row"><div><span className="eyebrow">Order flow</span><h2>Shipment funnel</h2></div></div>
                <div className="stack-list">
                  {[
                    { label: "Orders in Fulfillment", value: orders.filter((o) => o.logisticsStatus === "Pending").length },
                    { label: "Ready for Dispatch", value: dispatches.filter((d) => d.status === "Ready for Dispatch").length },
                    { label: "Dispatched", value: dispatches.filter((d) => d.status === "Dispatched").length },
                    { label: "Delivered", value: completedOrders },
                    { label: "Damaged units", value: damagedItems },
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
            <label className="field"><span>Admin username</span><input autoComplete="username" value={loginForm.email} onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })} /></label>
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
            {NAV_ITEMS.filter(({ label }) => getRoleModules(activeRole).includes(label)).map(({ label, icon: Icon }) => (
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
            <button className="ghost-button danger" onClick={handleLogout}>
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
              <div className={`sync-indicator ${syncStatus}`} role="status" aria-live="polite">
                <span />
                {syncStatus === "connected" ? "Database synced" : syncStatus === "connecting" ? "Connecting" : syncStatus === "conflict" ? "Sync conflict" : "Offline · local cache"}
              </div>
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
