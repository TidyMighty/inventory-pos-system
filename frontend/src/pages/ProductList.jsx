import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { StockBadge } from "../components/StatCard";

// Swap this for `listProducts()` from src/api/products.js once
// inventory/views.py exposes GET /api/inventory/products/.
const PLACEHOLDER_PRODUCTS = [
  { sku: "BEV-1042", name: "Espresso Beans 1kg", category: "Beverage", price: 18.5, qty: 3, threshold: 10 },
  { sku: "BEV-2210", name: "Oat Milk 1L", category: "Beverage", price: 4.25, qty: 0, threshold: 8 },
  { sku: "SUP-0031", name: "Paper Cups 12oz", category: "Supplies", price: 0.12, qty: 6, threshold: 20 },
  { sku: "FOD-5501", name: "Almond Croissant", category: "Food", price: 3.75, qty: 42, threshold: 15 },
  { sku: "FOD-5502", name: "Blueberry Muffin", category: "Food", price: 3.25, qty: 31, threshold: 15 },
  { sku: "BEV-1050", name: "Whole Bean Decaf 1kg", category: "Beverage", price: 17.0, qty: 25, threshold: 10 },
];

function statusFor(qty, threshold) {
  if (qty === 0) return "out";
  if (qty <= threshold) return "low";
  return "ok";
}

export default function ProductList() {
  const [query, setQuery] = useState("");
  const [products] = useState(PLACEHOLDER_PRODUCTS);

  const filtered = products.filter(
    (p) =>
      p.name.toLowerCase().includes(query.toLowerCase()) ||
      p.sku.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <>
      <Topbar eyebrow="Catalogue" title="Products" />
      <div className="content">
        <div className="section-head">
          <div>
            <div className="eyebrow">{filtered.length} items</div>
            <h2>All products</h2>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <input
              className="num"
              style={{
                padding: "9px 12px",
                border: "1px solid var(--line-strong)",
                borderRadius: 6,
                fontSize: 13,
                width: 220,
              }}
              placeholder="Search name or SKU…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button className="btn btn-primary">+ New product</button>
          </div>
        </div>

        <div className="card">
          <table className="data-table">
            <thead>
              <tr>
                <th>SKU</th>
                <th>Product</th>
                <th>Category</th>
                <th>Price</th>
                <th>In stock</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.sku}>
                  <td className="num cell-muted">{p.sku}</td>
                  <td style={{ fontWeight: 500 }}>{p.name}</td>
                  <td className="cell-muted">{p.category}</td>
                  <td className="num">${p.price.toFixed(2)}</td>
                  <td className="num">{p.qty}</td>
                  <td>
                    <StockBadge status={statusFor(p.qty, p.threshold)} />
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: "center", padding: "28px 0", color: "var(--ink-faint)" }}>
                    No products match "{query}".
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
