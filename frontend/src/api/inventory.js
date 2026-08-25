import client from "./client";

// ============================================================
// BRANCHES
// ============================================================

export function listBranches() {
  return client
    .get("/inventory/branches/")
    .then((r) => r.data);
}

// ============================================================
// CURRENT INVENTORY / STOCK
// ============================================================

export function getInventory(branchId) {
  return client
    .get("/inventory/", {
      params: branchId
        ? { branch_id: branchId }
        : {},
    })
    .then((r) => r.data);
}

// ============================================================
// PRODUCTS
// ============================================================

export function listProducts(params = {}) {
  return client
    .get("/inventory/products/", {
      params,
    })
    .then((r) => r.data);
}

export function createProduct(product) {
  return client
    .post("/inventory/products/", product)
    .then((r) => r.data);
}

// ============================================================
// STOCK RECEIVING
// ============================================================

export function receiveStock(data) {
  return client
    .post("/inventory/receipts/", data)
    .then((r) => r.data);
}

export function listReceivingHistory(branchId) {
  return client
    .get("/inventory/receipts/", {
      params: branchId
        ? { branch_id: branchId }
        : {},
    })
    .then((r) => r.data);
}

// ============================================================
// STOCK ADJUSTMENTS
// ============================================================

export function adjustStock(data) {
  return client
    .post("/inventory/adjustments/", data)
    .then((r) => r.data);
}

export function listAdjustmentHistory(branchId) {
  return client
    .get("/inventory/adjustments/", {
      params: branchId
        ? { branch_id: branchId }
        : {},
    })
    .then((r) => r.data);
}