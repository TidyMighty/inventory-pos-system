import React, { useEffect, useMemo, useState } from "react";
import Topbar from "../components/Topbar";
import { StockBadge } from "../components/StatCard";
import { getCurrentUser } from "../api/auth";
import {
  listBranches,
  listProducts,
  createProduct,
  getInventory,
  receiveStock,
  listReceivingHistory,
  adjustStock,
  listAdjustmentHistory,
} from "../api/inventory";

function formatDate(value) {
  if (!value) return "-";

  return new Date(value).toLocaleString();
}

function getRole(user) {
  if (!user) return "";

  return String(
    user.role ||
      user.user_role ||
      (user.is_admin ? "ADMIN" : "")
  ).toUpperCase();
}

export default function Inventory() {
  const user = getCurrentUser();

  const isAdmin =
    Boolean(user?.is_admin) ||
    getRole(user) === "ADMIN";

  const isManager =
    getRole(user) === "MANAGER";

  const canReceive = isAdmin || isManager;

  const [branches, setBranches] = useState([]);
  const [products, setProducts] = useState([]);
  const [stock, setStock] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [adjustments, setAdjustments] = useState([]);

  const [selectedBranch, setSelectedBranch] = useState("");
  const [query, setQuery] = useState("");

  const [activeTab, setActiveTab] = useState("stock");

  const [showReceive, setShowReceive] = useState(false);
  const [showAdjustment, setShowAdjustment] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [receiveForm, setReceiveForm] = useState({
    product: "",
    branch: "",
    quantity: "",
    reference: "",
    notes: "",
  });

  const [adjustmentForm, setAdjustmentForm] = useState({
    product: "",
    branch: "",
    quantity: "",
    reason: "damaged",
    notes: "",
  });

  // ==========================================================
  // LOAD BRANCHES
  // ==========================================================

  async function loadBranches() {
    const data = await listBranches();

    const rows = data.results || [];

    setBranches(rows);

    if (rows.length === 0) {
      setSelectedBranch("");
      return null;
    }

    const currentUserBranch =
      user?.branch ||
      user?.branch_id;

    let branch;

    if (!isAdmin && currentUserBranch) {
      branch =
        rows.find(
          (b) => String(b.id) === String(currentUserBranch)
        ) || rows[0];
    } else if (selectedBranch) {
      branch =
        rows.find(
          (b) => String(b.id) === String(selectedBranch)
        ) || rows[0];
    } else {
      branch =
        rows.find((b) => b.is_active) ||
        rows[0];
    }

    const branchId = String(branch.id);

    setSelectedBranch(branchId);

    setReceiveForm((current) => ({
      ...current,
      branch: branchId,
    }));

    setAdjustmentForm((current) => ({
      ...current,
      branch: branchId,
    }));

    return branch.id;
  }

  // ==========================================================
  // LOAD DATA
  // ==========================================================

  async function loadInventoryData(branchId) {
    if (!branchId) {
      setStock([]);
      setReceipts([]);
      setAdjustments([]);
      return;
    }

    const [
      stockData,
      productData,
      receiptData,
    ] = await Promise.all([
      getInventory(branchId),
      listProducts({ branch_id: branchId }),
      listReceivingHistory(branchId),
    ]);

    setStock(stockData.results || []);
    setProducts(productData.results || []);
    setReceipts(receiptData.results || []);

    if (isAdmin) {
      const adjustmentData =
        await listAdjustmentHistory(branchId);

      setAdjustments(
        adjustmentData.results || []
      );
    } else {
      setAdjustments([]);
    }
  }

  async function loadAll() {
    try {
      setLoading(true);
      setError("");

      const branchId = await loadBranches();

      if (branchId) {
        await loadInventoryData(branchId);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not load inventory data."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;

    loadInventoryData(
      Number(selectedBranch)
    ).catch((err) => {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not load inventory."
      );
    });

    setReceiveForm((current) => ({
      ...current,
      branch: selectedBranch,
    }));

    setAdjustmentForm((current) => ({
      ...current,
      branch: selectedBranch,
    }));
  }, [selectedBranch]);

  // ==========================================================
  // FILTER STOCK
  // ==========================================================

  const filteredStock = useMemo(() => {
    const search = query.toLowerCase();

    return stock.filter(
      (row) =>
        row.product_name
          ?.toLowerCase()
          .includes(search) ||
        row.sku
          ?.toLowerCase()
          .includes(search)
    );
  }, [stock, query]);

  // ==========================================================
  // RECEIVE STOCK
  // ==========================================================

  async function handleReceive(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const quantity = Number(
        receiveForm.quantity
      );

      if (
        !receiveForm.product ||
        !receiveForm.branch ||
        quantity < 1
      ) {
        setError(
          "Select a product, branch and valid quantity."
        );
        return;
      }

      await receiveStock({
        product: Number(receiveForm.product),
        branch: Number(receiveForm.branch),
        quantity,
        reference: receiveForm.reference,
        notes: receiveForm.notes,
      });

      setSuccess(
        "Stock received successfully."
      );

      setReceiveForm({
        product: "",
        branch: selectedBranch,
        quantity: "",
        reference: "",
        notes: "",
      });

      setShowReceive(false);

      await loadInventoryData(
        Number(selectedBranch)
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not receive stock."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // ADJUST STOCK
  // ==========================================================

  async function handleAdjustment(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      const quantity = Number(
        adjustmentForm.quantity
      );

      if (
        !adjustmentForm.product ||
        !adjustmentForm.branch ||
        !quantity
      ) {
        setError(
          "Select a product, branch and adjustment quantity."
        );
        return;
      }

      await adjustStock({
        product: Number(
          adjustmentForm.product
        ),
        branch: Number(
          adjustmentForm.branch
        ),
        quantity,
        reason: adjustmentForm.reason,
        notes: adjustmentForm.notes,
      });

      setSuccess(
        "Stock adjustment recorded successfully."
      );

      setAdjustmentForm({
        product: "",
        branch: selectedBranch,
        quantity: "",
        reason: "damaged",
        notes: "",
      });

      setShowAdjustment(false);

      await loadInventoryData(
        Number(selectedBranch)
      );
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not adjust stock."
      );
    } finally {
      setSaving(false);
    }
  }

  // ==========================================================
  // UI
  // ==========================================================

  return (
    <>
      <Topbar
        eyebrow="Inventory"
        title="Inventory Management"
      />

      <div className="content">

        {/* HEADER */}
        <div className="section-head">
          <div>
            <div className="eyebrow">
              Stock control &amp; audit trail
            </div>
            <h2>Inventory Management</h2>
          </div>

          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <select
              value={selectedBranch}
              onChange={(e) =>
                setSelectedBranch(e.target.value)
              }
              disabled={!isAdmin}
              style={{
                padding: "9px 12px",
                border:
                  "1px solid var(--line-strong)",
                borderRadius: 6,
                fontSize: 13,
                minWidth: 180,
              }}
            >
              <option value="">
                Select branch
              </option>

              {branches.map((branch) => (
                <option
                  key={branch.id}
                  value={branch.id}
                >
                  {branch.name}
                </option>
              ))}
            </select>

            <input
              style={{
                padding: "9px 12px",
                border:
                  "1px solid var(--line-strong)",
                borderRadius: 6,
                fontSize: 13,
                width: 220,
              }}
              placeholder="Search product or SKU..."
              value={query}
              onChange={(e) =>
                setQuery(e.target.value)
              }
            />

            {canReceive && (
              <button
                className="btn btn-primary"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowReceive(true);
                  setShowAdjustment(false);
                }}
              >
                + Receive stock
              </button>
            )}

            {isAdmin && (
              <button
                className="btn"
                onClick={() => {
                  setError("");
                  setSuccess("");
                  setShowAdjustment(true);
                  setShowReceive(false);
                }}
              >
                + Adjust stock
              </button>
            )}
          </div>
        </div>

        {/* MESSAGES */}

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: 12,
              borderRadius: 6,
              background: "#fff1f1",
              color: "#b42318",
              border:
                "1px solid #f5c2c7",
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
              color: "#067647",
              border:
                "1px solid #abefc6",
            }}
          >
            {success}
          </div>
        )}

        {/* RECEIVE FORM */}

        {showReceive && canReceive && (
          <div
            className="card"
            style={{
              marginBottom: 20,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Receive stock
            </h3>

            <form
              onSubmit={handleReceive}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <select
                required
                value={
                  receiveForm.product
                }
                onChange={(e) =>
                  setReceiveForm({
                    ...receiveForm,
                    product:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.sku} -{" "}
                    {product.name}
                  </option>
                ))}
              </select>

              <select
                required
                value={
                  receiveForm.branch
                }
                onChange={(e) =>
                  setReceiveForm({
                    ...receiveForm,
                    branch:
                      e.target.value,
                  })
                }
                disabled={!isAdmin}
              >
                <option value="">
                  Select branch
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </option>
                ))}
              </select>

              <input
                required
                type="number"
                min="1"
                placeholder="Quantity"
                value={
                  receiveForm.quantity
                }
                onChange={(e) =>
                  setReceiveForm({
                    ...receiveForm,
                    quantity:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Reference / PO number"
                value={
                  receiveForm.reference
                }
                onChange={(e) =>
                  setReceiveForm({
                    ...receiveForm,
                    reference:
                      e.target.value,
                  })
                }
              />

              <input
                placeholder="Notes"
                value={
                  receiveForm.notes
                }
                onChange={(e) =>
                  setReceiveForm({
                    ...receiveForm,
                    notes:
                      e.target.value,
                  })
                }
              />

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                }}
              >
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Receiving..."
                    : "Receive stock"}
                </button>

                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    setShowReceive(false)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ADJUSTMENT FORM */}

        {showAdjustment && isAdmin && (
          <div
            className="card"
            style={{
              marginBottom: 20,
              padding: 20,
            }}
          >
            <h3 style={{ marginTop: 0 }}>
              Stock adjustment
            </h3>

            <p
              style={{
                color: "var(--ink-muted)",
                fontSize: 13,
              }}
            >
              Positive quantity adds stock.
              Negative quantity removes stock.
            </p>

            <form
              onSubmit={handleAdjustment}
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <select
                required
                value={
                  adjustmentForm.product
                }
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    product:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select product
                </option>

                {products.map((product) => (
                  <option
                    key={product.id}
                    value={product.id}
                  >
                    {product.sku} -{" "}
                    {product.name}
                  </option>
                ))}
              </select>

              <select
                required
                value={
                  adjustmentForm.branch
                }
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    branch:
                      e.target.value,
                  })
                }
              >
                <option value="">
                  Select branch
                </option>

                {branches.map((branch) => (
                  <option
                    key={branch.id}
                    value={branch.id}
                  >
                    {branch.name}
                  </option>
                ))}
              </select>

              <input
                required
                type="number"
                placeholder="e.g. -2 or +5"
                value={
                  adjustmentForm.quantity
                }
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    quantity:
                      e.target.value,
                  })
                }
              />

              <select
                required
                value={
                  adjustmentForm.reason
                }
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    reason:
                      e.target.value,
                  })
                }
              >
                <option value="damaged">
                  Damaged
                </option>
                <option value="expired">
                  Expired
                </option>
                <option value="missing">
                  Missing
                </option>
                <option value="count_correction">
                  Count correction
                </option>
                <option value="other">
                  Other
                </option>
              </select>

              <input
                placeholder="Notes"
                value={
                  adjustmentForm.notes
                }
                onChange={(e) =>
                  setAdjustmentForm({
                    ...adjustmentForm,
                    notes:
                      e.target.value,
                  })
                }
              />

              <div
                style={{
                  display: "flex",
                  gap: 10,
                }}
              >
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving
                    ? "Adjusting..."
                    : "Save adjustment"}
                </button>

                <button
                  className="btn"
                  type="button"
                  onClick={() =>
                    setShowAdjustment(false)
                  }
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABS */}

        <div
          style={{
            display: "flex",
            gap: 8,
            marginBottom: 16,
          }}
        >
          <button
            className={
              activeTab === "stock"
                ? "btn btn-primary"
                : "btn"
            }
            onClick={() =>
              setActiveTab("stock")
            }
          >
            Current Stock
          </button>

          <button
            className={
              activeTab === "receipts"
                ? "btn btn-primary"
                : "btn"
            }
            onClick={() =>
              setActiveTab("receipts")
            }
          >
            Receiving History
          </button>

          {isAdmin && (
            <button
              className={
                activeTab === "adjustments"
                  ? "btn btn-primary"
                  : "btn"
              }
              onClick={() =>
                setActiveTab("adjustments")
              }
            >
              Adjustment History
            </button>
          )}
        </div>

        {/* CONTENT */}

        <div className="card">
          {loading ? (
            <div
              style={{
                padding: 30,
                textAlign: "center",
              }}
            >
              Loading inventory...
            </div>
          ) : activeTab === "stock" ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Branch</th>
                  <th>Quantity</th>
                  <th>Threshold</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>

              <tbody>
                {filteredStock.map((row) => (
                  <tr key={row.id}>
                    <td className="num cell-muted">
                      {row.sku}
                    </td>

                    <td
                      style={{
                        fontWeight: 500,
                      }}
                    >
                      {row.product_name}
                    </td>

                    <td className="cell-muted">
                      {row.branch_name}
                    </td>

                    <td className="num">
                      {row.quantity}
                    </td>

                    <td className="num">
                      {row.low_stock_threshold}
                    </td>

                    <td>
                      <StockBadge
                        status={
                          row.status
                        }
                      />
                    </td>

                    <td className="cell-muted">
                      {formatDate(
                        row.updated_at
                      )}
                    </td>
                  </tr>
                ))}

                {filteredStock.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "28px 0",
                        color:
                          "var(--ink-faint)",
                      }}
                    >
                      No stock found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : activeTab === "receipts" ? (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Branch</th>
                  <th>Quantity</th>
                  <th>Reference</th>
                  <th>Received by</th>
                </tr>
              </thead>

              <tbody>
                {receipts.map((row) => (
                  <tr key={row.id}>
                    <td className="cell-muted">
                      {formatDate(
                        row.created_at
                      )}
                    </td>

                    <td className="num cell-muted">
                      {row.sku}
                    </td>

                    <td
                      style={{
                        fontWeight: 500,
                      }}
                    >
                      {row.product_name}
                    </td>

                    <td>
                      {row.branch_name}
                    </td>

                    <td className="num">
                      +{row.quantity}
                    </td>

                    <td className="cell-muted">
                      {row.reference ||
                        "-"}
                    </td>

                    <td>
                      {row.received_by_name ||
                        "-"}
                    </td>
                  </tr>
                ))}

                {receipts.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "28px 0",
                        color:
                          "var(--ink-faint)",
                      }}
                    >
                      No receiving history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="data-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>SKU</th>
                  <th>Product</th>
                  <th>Branch</th>
                  <th>Adjustment</th>
                  <th>Reason</th>
                  <th>Adjusted by</th>
                </tr>
              </thead>

              <tbody>
                {adjustments.map((row) => (
                  <tr key={row.id}>
                    <td className="cell-muted">
                      {formatDate(
                        row.created_at
                      )}
                    </td>

                    <td className="num cell-muted">
                      {row.sku}
                    </td>

                    <td
                      style={{
                        fontWeight: 500,
                      }}
                    >
                      {row.product_name}
                    </td>

                    <td>
                      {row.branch_name}
                    </td>

                    <td
                      className="num"
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {row.quantity > 0
                        ? `+${row.quantity}`
                        : row.quantity}
                    </td>

                    <td>
                      {row.reason}
                    </td>

                    <td>
                      {row.adjusted_by_name ||
                        "-"}
                    </td>
                  </tr>
                ))}

                {adjustments.length ===
                  0 && (
                  <tr>
                    <td
                      colSpan={7}
                      style={{
                        textAlign:
                          "center",
                        padding:
                          "28px 0",
                        color:
                          "var(--ink-faint)",
                      }}
                    >
                      No adjustment history.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </>
  );
}
