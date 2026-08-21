
import React, { useEffect, useState } from "react";
import Topbar from "../components/Topbar";
import { StockBadge } from "../components/StatCard";
import {
  listProducts,
  createProduct,
  listBranches,
  restock,
} from "../api/products";

function statusFor(qty, threshold) {
  if (qty === 0) return "out";
  if (qty <= threshold) return "low";
  return "ok";
}

export default function ProductList() {
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState("");

  const [showProductForm, setShowProductForm] = useState(false);
  const [showStockForm, setShowStockForm] = useState(false);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [productForm, setProductForm] = useState({
    sku: "",
    name: "",
    category: "",
    price: "",
  });

  const [stockForm, setStockForm] = useState({
    product: "",
    branch: "",
    quantity: "",
  });

  async function loadBranches() {
    const branchData = await listBranches();
    const loadedBranches = branchData.results || [];

    setBranches(loadedBranches);

    if (!selectedBranch && loadedBranches.length > 0) {
      const activeBranch =
        loadedBranches.find((branch) => branch.is_active) ||
        loadedBranches[0];

      setSelectedBranch(String(activeBranch.id));

      setStockForm((current) => ({
        ...current,
        branch: String(activeBranch.id),
      }));

      return activeBranch.id;
    }

    return selectedBranch ? Number(selectedBranch) : null;
  }

  async function loadProducts(branchId) {
    if (!branchId) {
      setProducts([]);
      return;
    }

    const productData = await listProducts({
      branch_id: branchId,
    });

    setProducts(productData.results || []);
  }

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const branchId = await loadBranches();

      if (branchId) {
        await loadProducts(branchId);
      } else {
        setProducts([]);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not load products or branches."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (!selectedBranch) return;

    loadProducts(Number(selectedBranch)).catch((err) => {
      console.error(err);
      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not load products for this branch."
      );
    });

    setStockForm((current) => ({
      ...current,
      branch: selectedBranch,
    }));
  }, [selectedBranch]);

  async function handleCreateProduct(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      await createProduct({
        sku: productForm.sku,
        name: productForm.name,
        category: productForm.category,
        price: Number(productForm.price),
        is_active: true,
      });

      setProductForm({
        sku: "",
        name: "",
        category: "",
        price: "",
      });

      setShowProductForm(false);

      await loadProducts(Number(selectedBranch));
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not create product."
      );
    } finally {
      setSaving(false);
    }
  }

  async function handleRestock(e) {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");

      const productId = Number(stockForm.product);
      const branchId = Number(stockForm.branch);
      const quantity = Number(stockForm.quantity);

      if (!productId || !branchId || !quantity || quantity < 1) {
        setError("Please select a product, branch, and valid quantity.");
        return;
      }

      await restock(productId, branchId, quantity);

      setStockForm({
        product: "",
        branch: String(branchId),
        quantity: "",
      });

      setShowStockForm(false);

      if (String(branchId) === String(selectedBranch)) {
        await loadProducts(branchId);
      }
    } catch (err) {
      console.error(err);

      setError(
        err.response?.data
          ? JSON.stringify(err.response.data)
          : "Could not add stock."
      );
    } finally {
      setSaving(false);
    }
  }

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
              onChange={(e) => setSelectedBranch(e.target.value)}
              style={{
                padding: "9px 12px",
                border: "1px solid var(--line-strong)",
                borderRadius: 6,
                fontSize: 13,
                minWidth: 180,
              }}
            >
              <option value="">Select branch</option>

              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.name}
                </option>
              ))}
            </select>

            <input
              className="num"
              style={{
                padding: "9px 12px",
                border: "1px solid var(--line-strong)",
                borderRadius: 6,
                fontSize: 13,
                width: 220,
              }}
              placeholder="Search name or SKU..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />

            <button
              className="btn btn-primary"
              onClick={() => {
                setError("");
                setShowProductForm(true);
                setShowStockForm(false);
              }}
            >
              + New product
            </button>

            <button
              className="btn"
              onClick={() => {
                setError("");
                setShowStockForm(true);
                setShowProductForm(false);

                setStockForm((current) => ({
                  ...current,
                  branch: selectedBranch,
                }));
              }}
              disabled={!selectedBranch}
            >
              + Add stock
            </button>
          </div>
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

        {showProductForm && (
          <div className="card" style={{ marginBottom: 20, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Create a product</h3>

            <form
              onSubmit={handleCreateProduct}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(4, 1fr)",
                gap: 12,
              }}
            >
              <input
                required
                placeholder="SKU"
                value={productForm.sku}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    sku: e.target.value,
                  })
                }
              />

              <input
                required
                placeholder="Product name"
                value={productForm.name}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    name: e.target.value,
                  })
                }
              />

              <input
                placeholder="Category"
                value={productForm.category}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    category: e.target.value,
                  })
                }
              />

              <input
                required
                type="number"
                step="0.01"
                min="0"
                placeholder="Price"
                value={productForm.price}
                onChange={(e) =>
                  setProductForm({
                    ...productForm,
                    price: e.target.value,
                  })
                }
              />

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: 10,
                }}
              >
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Creating..." : "Create product"}
                </button>

                <button
                  className="btn"
                  type="button"
                  onClick={() => setShowProductForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showStockForm && (
          <div className="card" style={{ marginBottom: 20, padding: 20 }}>
            <h3 style={{ marginTop: 0 }}>Add stock</h3>

            <form
              onSubmit={handleRestock}
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(3, 1fr)",
                gap: 12,
              }}
            >
              <select
                required
                value={stockForm.product}
                onChange={(e) =>
                  setStockForm({
                    ...stockForm,
                    product: e.target.value,
                  })
                }
              >
                <option value="">Select product</option>

                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.sku} - {product.name}
                  </option>
                ))}
              </select>

              <select
                required
                value={stockForm.branch}
                onChange={(e) =>
                  setStockForm({
                    ...stockForm,
                    branch: e.target.value,
                  })
                }
              >
                <option value="">Select branch</option>

                {branches.map((branch) => (
                  <option key={branch.id} value={branch.id}>
                    {branch.name}
                  </option>
                ))}
              </select>

              <input
                required
                type="number"
                min="1"
                placeholder="Quantity"
                value={stockForm.quantity}
                onChange={(e) =>
                  setStockForm({
                    ...stockForm,
                    quantity: e.target.value,
                  })
                }
              />

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  gap: 10,
                }}
              >
                <button
                  className="btn btn-primary"
                  type="submit"
                  disabled={saving}
                >
                  {saving ? "Adding..." : "Add stock"}
                </button>

                <button
                  className="btn"
                  type="button"
                  onClick={() => setShowStockForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        <div className="card">
          {loading ? (
            <div style={{ padding: 30, textAlign: "center" }}>
              Loading products...
            </div>
          ) : (
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
                  <tr key={p.id}>
                    <td className="num cell-muted">{p.sku}</td>

                    <td style={{ fontWeight: 500 }}>
                      {p.name}
                    </td>

                    <td className="cell-muted">
                      {p.category || "-"}
                    </td>

                    <td className="num">
                      ${Number(p.price).toFixed(2)}
                    </td>

                    <td className="num">
                      {p.qty ?? 0}
                    </td>

                    <td>
                      <StockBadge
                        status={statusFor(
                          p.qty ?? 0,
                          p.threshold ?? 10
                        )}
                      />
                    </td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      style={{
                        textAlign: "center",
                        padding: "28px 0",
                        color: "var(--ink-faint)",
                      }}
                    >
                      No products found for this branch.
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