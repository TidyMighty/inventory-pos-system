import React, { useState } from "react";
import Topbar from "../components/Topbar";

// Swap for listProducts() from src/api/products.js when the backend is ready.
const CATALOG = [
  { sku: "BEV-1042", name: "Espresso Beans 1kg", price: 18.5 },
  { sku: "FOD-5501", name: "Almond Croissant", price: 3.75 },
  { sku: "FOD-5502", name: "Blueberry Muffin", price: 3.25 },
  { sku: "BEV-1050", name: "Whole Bean Decaf 1kg", price: 17.0 },
  { sku: "BEV-2210", name: "Oat Milk 1L", price: 4.25 },
  { sku: "SUP-0031", name: "Paper Cups 12oz (x50)", price: 6.0 },
];

export default function POSCheckout() {
  const [ticket, setTicket] = useState([]);

  function addItem(product) {
    setTicket((prev) => {
      const existing = prev.find((line) => line.sku === product.sku);
      if (existing) {
        return prev.map((line) =>
          line.sku === product.sku ? { ...line, qty: line.qty + 1 } : line
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
  }

  function removeItem(sku) {
    setTicket((prev) => prev.filter((line) => line.sku !== sku));
  }

  const total = ticket.reduce((sum, line) => sum + line.price * line.qty, 0);

  async function completeSale() {
    // Swap for createSale(branchId, items) from src/api/sales.js.
    alert(`Sale completed: $${total.toFixed(2)} across ${ticket.length} line item(s).`);
    setTicket([]);
  }

  return (
    <>
      <Topbar eyebrow="Downtown Branch" title="POS Checkout" />
      <div className="content">
        <div className="pos-layout">
          <div>
            <div className="section-head">
              <div>
                <div className="eyebrow">Tap to add</div>
                <h2>Catalogue</h2>
              </div>
            </div>
            <div className="pos-grid">
              {CATALOG.map((item) => (
                <div key={item.sku} className="pos-item" onClick={() => addItem(item)}>
                  <div className="name">{item.name}</div>
                  <div className="sku">{item.sku}</div>
                  <div className="price num">${item.price.toFixed(2)}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="ticket">
            <div className="ticket-head">
              <div className="eyebrow">Current ticket</div>
              <h2 style={{ fontSize: 15, marginTop: 4 }}>
                {ticket.length} item{ticket.length === 1 ? "" : "s"}
              </h2>
            </div>

            <div className="ticket-lines">
              {ticket.length === 0 ? (
                <div className="empty-ticket">
                  Nothing added yet. Tap a product to start the ticket.
                </div>
              ) : (
                ticket.map((line) => (
                  <div key={line.sku} className="ticket-line">
                    <div>
                      <div style={{ fontWeight: 500 }}>{line.name}</div>
                      <div className="num" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                        {line.qty} × ${line.price.toFixed(2)}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span className="num" style={{ fontWeight: 600 }}>
                        ${(line.qty * line.price).toFixed(2)}
                      </span>
                      <button
                        onClick={() => removeItem(line.sku)}
                        aria-label={`Remove ${line.name}`}
                        style={{
                          border: "none",
                          background: "none",
                          color: "var(--ink-faint)",
                          cursor: "pointer",
                          fontSize: 16,
                          lineHeight: 1,
                        }}
                      >
                        ×
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="ticket-total">
              <span className="label">Total due</span>
              <span className="value">${total.toFixed(2)}</span>
            </div>

            <div className="ticket-actions">
              <button
                className="btn btn-primary btn-block"
                onClick={completeSale}
                disabled={ticket.length === 0}
              >
                Complete sale
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
