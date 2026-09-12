import { products as seedProducts, Product } from "./products";

export const PRODUCTS_STORAGE_KEY = "gbp-products";
export const PRODUCTS_UPDATED_EVENT = "gbp-products-updated";

export function loadProducts(): Product[] {
  if (typeof window === "undefined") return seedProducts;

  const raw = window.localStorage.getItem(PRODUCTS_STORAGE_KEY);
  if (!raw) return seedProducts;

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : seedProducts;
  } catch {
    return seedProducts;
  }
}

export function saveProducts(nextProducts: Product[]) {
  window.localStorage.setItem(PRODUCTS_STORAGE_KEY, JSON.stringify(nextProducts));
  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT, { detail: nextProducts }));
}

export function resetProducts() {
  window.localStorage.removeItem(PRODUCTS_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(PRODUCTS_UPDATED_EVENT, { detail: seedProducts }));
}
