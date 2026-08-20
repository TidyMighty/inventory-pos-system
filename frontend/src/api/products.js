import client from "./client";

// Matches the /api/inventory/ endpoints described in the getting-started guide.
// Adjust paths here once you build out inventory/urls.py + views.py.

export function listProducts(params = {}) {
  return client.get("/inventory/products/", { params }).then((r) => r.data);
}

export function getInventory(branchId) {
  return client
    .get("/inventory/", { params: { branch_id: branchId } })
    .then((r) => r.data);
}

export function restock(productId, branchId, quantity) {
  return client
    .post("/inventory/restock/", {
      product: productId,
      branch: branchId,
      quantity,
    })
    .then((r) => r.data);
}
