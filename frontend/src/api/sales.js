import client from "./client";

export function createSale(branchId, items) {
  // items: [{ product: id, quantity: n }]
  return client
    .post("/sales/", { branch: branchId, items })
    .then((r) => r.data);
}

export function listSales(params = {}) {
  return client.get("/sales/", { params }).then((r) => r.data);
}

export function getSalesSummary(params = {}) {
  return client.get("/sales/reports/summary/", { params }).then((r) => r.data);
}

export function getTopProducts(params = {}) {
  return client.get("/sales/reports/top-products/", { params }).then((r) => r.data);
}
