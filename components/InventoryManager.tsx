"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, Check, Package, RotateCcw, Search, Save, X } from "lucide-react";
import { Product } from "../data/products";
import { loadProducts, PRODUCTS_UPDATED_EVENT, resetProducts, saveProducts } from "../data/productStore";

type Notice = { type: "success" | "info"; text: string } | null;

export default function InventoryManager() {
  const [items, setItems] = useState<Product[]>(loadProducts);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("All");
  const [notice, setNotice] = useState<Notice>(null);

  useEffect(() => {
    const handleProductsUpdated = (event: Event) => {
      const detail = (event as CustomEvent<Product[]>).detail;
      if (detail) setItems(detail);
    };
    const handleStorage = (event: StorageEvent) => {
      if (event.key === "gbp-products") setItems(loadProducts());
    };

    window.addEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
    window.addEventListener("storage", handleStorage);
    return () => {
      window.removeEventListener(PRODUCTS_UPDATED_EVENT, handleProductsUpdated);
      window.removeEventListener("storage", handleStorage);
    };
  }, []);

  const categories = ["All", ...Array.from(new Set(items.map(item => item.category)))];
  const filteredItems = useMemo(() => items.filter(item => {
    const matchesCategory = category === "All" || item.category === category;
    const matchesQuery = `${item.name} ${item.category} ${item.sku}`.toLowerCase().includes(query.toLowerCase());
    return matchesCategory && matchesQuery;
  }), [items, category, query]);

  const totalStock = items.reduce((sum, item) => sum + item.stock, 0);
  const lowStock = items.filter(item => item.stock > 0 && item.stock <= 5).length;
  const outOfStock = items.filter(item => item.stock === 0).length;

  const updateItem = (id: string, changes: Partial<Product>) => {
    const nextItems = items.map(item => item.id === id ? { ...item, ...changes } : item);
    setItems(nextItems);
    saveProducts(nextItems);
    setNotice({ type: "success", text: "Inventory updated and live in the shop." });
  };

  const updateVariants = (item: Product, value: string) => {
    const variants = value.split(",").map(variant => variant.trim()).filter(Boolean);
    updateItem(item.id, { variants });
  };

  const handleReset = () => {
    resetProducts();
    setItems(loadProducts());
    setNotice({ type: "info", text: "Inventory restored to the original demo products." });
  };
  const signOut = async () => { await fetch("/api/admin/logout", { method: "POST" }); window.location.assign("/admin/login"); };

  return (
    <div className="admin inventoryAdmin">
      <header className="adminTop">
        <div className="container adminNav">
          <a href="/admin" className="adminBrand"><span className="logoMark">GBP</span><span>GBP ADMIN</span></a>
          <div className="adminLinks">
            <a href="/admin">Orders</a>
            <a className="active" href="/admin/inventory">Inventory</a>
            <button className="signOutButton" onClick={signOut}>Sign out</button>
            <a href="/" className="btn btnGold">View Store</a>
          </div>
        </div>
      </header>

      <main className="container adminMain inventoryMain">
        <a href="/admin" className="backLink"><ArrowLeft size={15} /> Back to orders</a>
        <div className="inventoryHero">
          <div>
            <div className="kicker">Catalog control</div>
            <h1 className="serif">Inventory Studio</h1>
            <p>Edit your products in one calm, readable workspace. Every change saves instantly and appears in the storefront.</p>
          </div>
          <button className="btn btnOutline resetButton" onClick={handleReset}><RotateCcw size={14} /> Reset demo data</button>
        </div>

        <div className="inventoryStats">
          <div className="inventoryStat"><span><Package size={17} /></span><div><small>Catalog items</small><strong>{items.length}</strong></div></div>
          <div className="inventoryStat"><span><Check size={17} /></span><div><small>Total units</small><strong>{totalStock}</strong></div></div>
          <div className="inventoryStat warning"><span><span>!</span></span><div><small>Low stock</small><strong>{lowStock}</strong></div></div>
          <div className="inventoryStat danger"><span><X size={17} /></span><div><small>Out of stock</small><strong>{outOfStock}</strong></div></div>
        </div>

        <div className="inventoryToolbar">
          <label className="inventorySearch"><Search size={16} /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search by item, SKU, or class..." /></label>
          <div className="inventoryFilters">{categories.map(itemCategory => <button key={itemCategory} className={category === itemCategory ? "active" : ""} onClick={() => setCategory(itemCategory)}>{itemCategory}</button>)}</div>
        </div>

        {notice && <div className={`inventoryNotice ${notice.type}`}><span>{notice.type === "success" ? <Check size={15} /> : <RotateCcw size={15} />}</span>{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss notification"><X size={14} /></button></div>}

        <section className="inventoryList">
          <div className="inventoryListHead"><div><span className="kicker">Live catalog</span><h2 className="serif">Your products</h2></div><span className="resultCount">{filteredItems.length} of {items.length} items</span></div>
          <div className="inventoryRows">
            {filteredItems.map(item => <article className="inventoryRow" key={item.id}>
              <div className="inventoryProduct"><img src={item.image} alt="" /><div><span className="sku">{item.sku}</span><strong>{item.name}</strong><span className="inventoryHint">Changes are published to the shop automatically</span></div></div>
              <label className="inventoryField itemName"><span>Item name</span><input value={item.name} onChange={event => updateItem(item.id, { name: event.target.value })} /></label>
              <label className="inventoryField stockField"><span>Units in stock</span><input type="number" min="0" value={item.stock} onChange={event => updateItem(item.id, { stock: Math.max(0, Number(event.target.value) || 0) })} /></label>
              <label className="inventoryField"><span>Classification</span><input value={item.category} onChange={event => updateItem(item.id, { category: event.target.value })} /></label>
              <label className="inventoryField variantsField"><span>Variants <em>comma separated</em></span><input value={(item.variants || []).join(", ")} onChange={event => updateVariants(item, event.target.value)} /></label>
              <div className={`stockIndicator ${item.stock === 0 ? "empty" : item.stock <= 5 ? "low" : "healthy"}`}><span />{item.stock === 0 ? "Out of stock" : item.stock <= 5 ? "Low stock" : "In stock"}</div>
            </article>)}
            {filteredItems.length === 0 && <div className="emptyInventory">No products match your search.</div>}
          </div>
        </section>
        <p className="inventoryFooterNote"><Save size={14} /> Your edits are saved in this browser and sync across open shop tabs. A production store should connect this screen to a shared database.</p>
      </main>
    </div>
  );
}
