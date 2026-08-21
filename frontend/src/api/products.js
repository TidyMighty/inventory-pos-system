import client from "./client";

export function listProducts(params = {}) {
  return client
    .get("/inventory/products/", { params })
    .then((r) => r.data);
}

export function createProduct(product) {
  return client
    .post("/inventory/products/", product)
    .then((r) => r.data);
}

export function listBranches() {
  return client
    .get("/inventory/branches/")
    .then((r) => r.data);
}

export function getInventory(branchId) {
  return client
    .get("/inventory/", {
      params: branchId ? { branch_id: branchId } : {},
    })
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