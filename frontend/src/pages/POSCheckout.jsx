import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { listProducts, listBranches } from "../api/products";
import { createSale } from "../api/sales";

export default function POSCheckout() {
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");
  const [ticket, setTicket] = useState([]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function loadBranches() {
    const data = await listBranches();
    const loadedBranches = data.results || [];

    setBranches(loadedBranches);

    if (!selectedBranch && loadedBranches.length > 0) {
      const activeBranch =
        loadedBranches.find((branch) => branch.is_active) ||
        loadedBranches[0];

      setSelectedBranch(String(activeBranch.id));
      return activeBranch.id;
    }

    return selectedBranch;
  }

  async function loadProducts(branchId) {
    if (!branchId) return;

    const data = await listProducts({
      branch_id: branchId,
    });

    setProducts(data.results || []);
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const branchId = await loadBranches();

      if (branchId) {
        await loadProducts(branchId);
      }
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not load branches or products."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  async function handleBranchChange(e) {
    const branchId = e.target.value;

    setSelectedBranch(branchId);
    setTicket([]);
    setSuccess("");
    setError("");

    if (!branchId) {
      setProducts([]);
      return;
    }

    try {
      setLoading(true);

      await loadProducts(branchId);
    } catch (err) {
      console.error(err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not load products for this branch."
      );
    } finally {
      setLoading(false);
    }
  }

  function addItem(product) {
    if ((product.qty ?? 0) <= 0) {
      setError(`${product.name} is out of stock at this branch.`);
      return;
    }

    setError("");
    setSuccess("");

    setTicket((prev) => {
      const existing = prev.find((line) => line.product === product.id);

      if (existing) {
        if (existing.qty >= product.qty) {
          setError(
            `Only ${product.qty} units of ${product.name} are available.`
          );
          return prev;
        }

        return prev.map((line) =>
          line.product === product.id
            ? { ...line, qty: line.qty + 1 }
            : line
        );
      }

      return [
        ...prev,
        {
          product: product.id,
          sku: product.sku,
          name: product.name,
          price: Number(product.price),
          available: product.qty ?? 0,
          qty: 1,
        },
      ];
    });
  }

  function decreaseItem(productId) {
    setTicket((prev) =>
      prev
        .map((line) =>
          line.product === productId
            ? { ...line, qty: line.qty - 1 }
            : line
        )
        .filter((line) => line.qty > 0)
    );
  }

  function removeItem(productId) {
    setTicket((prev) =>
      prev.filter((line) => line.product !== productId)
    );
  }

  const total = useMemo(
    () =>
      ticket.reduce(
        (sum, line) => sum + Number(line.price) * line.qty,
        0
      ),
    [ticket]
  );

  async function completeSale() {
    if (!selectedBranch) {
      setError("Please select a branch.");
      return;
    }

    if (ticket.length === 0) {
      setError("Add at least one product to the ticket.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const items = ticket.map((line) => ({
        product: line.product,
        quantity: line.qty,
      }));

      const sale = await createSale(
        Number(selectedBranch),
        items
      );

      setSuccess(
        `Sale #${sale.id} completed successfully. Total: $${Number(
          sale.total
        ).toFixed(2)}`
      );

      setTicket([]);

      await loadProducts(selectedBranch);
    } catch (err) {
      console.error(err);

      const backendError = err.response?.data;

      setError(
        backendError
          ? JSON.stringify(backendError)
          : "Could not complete sale."
      );
    } finally {
      setSaving(false);
    }
  }

  const selectedBranchName =
    branches.find(
      (branch) => String(branch.id) === String(selectedBranch)
    )?.name || "Select branch";

  return (
    <>
      <Topbar
        eyebrow={selectedBranchName}
        title="POS Checkout"
      />

      <div className="content">
        <div
          style={{
            marginBottom: 20,
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <label style={{ fontWeight: 600 }}>
            Operating branch
          </label>

          <select
            value={selectedBranch}
            onChange={handleBranchChange}
            style={{
              minWidth: 220,
              padding: "9px 12px",
            }}
          >
            <option value="">Select branch</option>

            {branches.map((branch) => (
              <option key={branch.id} value={branch.id}>
                {branch.name}
              </option>
            ))}
          </select>
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 6,
              background: "#fff1f1",
              color: "#b42318",
              border: "1px solid #f5c2c7",
            }}
          >
            {error}
          </div>
        )}

        {success && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 6,
              background: "#ecfdf3",
              color: "#027a48",
              border: "1px solid #abefc6",
            }}
          >
            {success}
          </div>
        )}

        <div className="pos-layout">
          <div>
            <div className="section-head">
              <div>
                <div className="eyebrow">
                  {selectedBranchName}
                </div>
                <h2>Catalogue</h2>
              </div>
            </div>

            {loading ? (
              <div
                className="card"
                style={{
                  padding: 30,
                  textAlign: "center",
                }}
              >
                Loading products...
              </div>
            ) : products.length === 0 ? (
              <div
                className="card"
                style={{
                  padding: 30,
                  textAlign: "center",
                }}
              >
                No products with inventory available at this branch.
              </div>
            ) : (
              <div className="pos-grid">
                {products.map((product) => {
                  const qty = product.qty ?? 0;

                  return (
                    <div
                      key={product.id}
                      className="pos-item"
                      onClick={() => addItem(product)}
                      style={{
                        opacity: qty <= 0 ? 0.5 : 1,
                        cursor:
                          qty > 0 ? "pointer" : "not-allowed",
                      }}
                    >
                      <div className="name">
                        {product.name}
                      </div>

                      <div className="sku">
                        {product.sku}
                      </div>

                      <div className="price num">
                        ${Number(product.price).toFixed(2)}
                      </div>

                      <div
                        style={{
                          marginTop: 6,
                          fontSize: 12,
                          color:
                            qty > 0
                              ? "var(--ink-muted)"
                              : "#b42318",
                        }}
                      >
                        Stock: {qty}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="ticket">
            <div className="ticket-head">
              <div className="eyebrow">
                Current ticket
              </div>

              <h2
                style={{
                  fontSize: 15,
                  marginTop: 4,
                }}
              >
                {ticket.length} item
                {ticket.length === 1 ? "" : "s"}
              </h2>
            </div>

            <div className="ticket-lines">
              {ticket.length === 0 ? (
                <div className="empty-ticket">
                  Nothing added yet. Tap a product to start
                  the ticket.
                </div>
              ) : (
                ticket.map((line) => (
                  <div
                    key={line.product}
                    className="ticket-line"
                  >
                    <div>
                      <div style={{ fontWeight: 500 }}>
                        {line.name}
                      </div>

                      <div
                        className="num"
                        style={{
                          fontSize: 11,
                          color: "var(--ink-faint)",
                        }}
                      >
                        {line.qty} × $
                        {Number(line.price).toFixed(2)}
                      </div>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                      }}
                    >
                      <button
                        onClick={() =>
                          decreaseItem(line.product)
                        }
                        style={{
                          border: "1px solid var(--line)",
                          background: "white",
                          cursor: "pointer",
                          width: 26,
                          height: 26,
                        }}
                      >
                        −
                      </button>

                      <span
                        className="num"
                        style={{ fontWeight: 600 }}
                      >
                        {line.qty}
                      </span>

                      <button
                        onClick={() => {
                          const product = products.find(
                            (p) => p.id === line.product
                          );

                          if (product) addItem(product);
                        }}
                        style={{
                          border: "1px solid var(--line)",
                          background: "white",
                          cursor: "pointer",
                          width: 26,
                          height: 26,
                        }}
                      >
                        +
                      </button>

                      <span
                        className="num"
                        style={{
                          fontWeight: 600,
                          minWidth: 65,
                          textAlign: "right",
                        }}
                      >
                        $
                        {(
                          line.qty * Number(line.price)
                        ).toFixed(2)}
                      </span>

                      <button
                        onClick={() =>
                          removeItem(line.product)
                        }
                        aria-label={`Remove ${line.name}`}
                        style={{
                          border: "none",
                          background: "none",
                          color: "var(--ink-faint)",
                          cursor: "pointer",
                          fontSize: 16,
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
              <span className="label">
                Total due
              </span>

              <span className="value">
                ${total.toFixed(2)}
              </span>
            </div>

            <div className="ticket-actions">
              <button
                className="btn btn-primary btn-block"
                onClick={completeSale}
                disabled={
                  saving ||
                  ticket.length === 0 ||
                  !selectedBranch
                }
              >
                {saving
                  ? "Completing sale..."
                  : "Complete sale"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}