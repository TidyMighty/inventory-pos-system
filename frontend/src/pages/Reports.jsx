import React, { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import Topbar from "../components/Topbar";
import { StatCard } from "../components/StatCard";
import {
  getSalesSummary,
  getTopProducts,
  listSales,
} from "../api/sales";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function normalizeArray(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function getSaleTotal(sale) {
  return Number(
    sale.total ??
      sale.amount ??
      sale.grand_total ??
      sale.total_amount ??
      0
  );
}

function getBranchName(sale) {
  if (sale.branch_name) {
    return sale.branch_name;
  }

  if (typeof sale.branch === "string") {
    return sale.branch;
  }

  if (sale.branch?.name) {
    return sale.branch.name;
  }

  return "Unknown";
}

function getSaleDate(sale) {
  return (
    sale.created_at ??
    sale.created ??
    sale.date ??
    sale.timestamp ??
    sale.sale_date
  );
}

function formatDate(dateValue) {
  if (!dateValue) {
    return "";
  }

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default function Reports() {
  const [summary, setSummary] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadReports() {
      try {
        setLoading(true);
        setError("");

        const [summaryData, topProductsData, salesData] =
          await Promise.all([
            getSalesSummary({ days: 30 }),
            getTopProducts({ days: 30 }),
            listSales(),
          ]);

        if (!mounted) {
          return;
        }

        setSummary(summaryData || {});
        setTopProducts(normalizeArray(topProductsData));
        setSales(normalizeArray(salesData));
      } catch (err) {
        console.error("Reports loading error:", err);

        if (!mounted) {
          return;
        }

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Unable to load reports."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadReports();

    return () => {
      mounted = false;
    };
  }, []);

  const branchSummary = useMemo(() => {
    const branches = {};

    sales.forEach((sale) => {
      const branch = getBranchName(sale);
      const total = getSaleTotal(sale);

      if (!branches[branch]) {
        branches[branch] = {
          branch,
          sales: 0,
          transactions: 0,
        };
      }

      branches[branch].sales += total;
      branches[branch].transactions += 1;
    });

    return Object.values(branches)
      .map((branch) => ({
        ...branch,
        avgTicket:
          branch.transactions > 0
            ? branch.sales / branch.transactions
            : 0,
      }))
      .sort((a, b) => b.sales - a.sales);
  }, [sales]);

  const totalRevenue = Number(summary?.total_sales || 0);

  const transactionCount = Number(
    summary?.transaction_count || 0
  );

  const averageTicket =
    transactionCount > 0
      ? totalRevenue / transactionCount
      : 0;

  const chartProducts = topProducts
    .slice(0, 5)
    .map((product) => ({
      name:
        product.product__name ||
        product.product_name ||
        product.name ||
        "Unknown",
      units: Number(product.units_sold || 0),
    }));

  if (loading) {
    return (
      <>
        <Topbar
          eyebrow="Reports"
          title="Reports"
        />

        <div className="content">
          <div className="card card-pad">
            <div className="eyebrow">
              Loading
            </div>

            <h2>
              Loading reports...
            </h2>
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <Topbar
          eyebrow="Reports"
          title="Reports"
        />

        <div className="content">
          <div className="card card-pad">
            <div className="eyebrow">
              Reports error
            </div>

            <h2>
              Unable to load reports
            </h2>

            <p
              style={{
                marginTop: 8,
                color: "var(--ink-faint)",
              }}
            >
              {error}
            </p>

            <button
              className="btn btn-secondary"
              style={{ marginTop: 16 }}
              onClick={() =>
                window.location.reload()
              }
            >
              Retry
            </button>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Topbar
        eyebrow="Last 30 days"
        title="Reports"
      />

      <div className="content">

        {/* =========================
            SUMMARY
        ========================= */}

        <div className="stat-row">

          <StatCard
            label="Total revenue"
            prefix="$"
            value={formatMoney(totalRevenue)}
          />

          <StatCard
            label="Transactions"
            value={String(transactionCount)}
          />

          <StatCard
            label="Avg. ticket"
            prefix="$"
            value={formatMoney(averageTicket)}
          />

          <StatCard
            label="Active branches"
            value={String(
              summary?.active_branches ?? 0
            )}
          />

        </div>

        {/* =========================
            TOP PRODUCTS + BRANCHES
        ========================= */}

        <div
          className="grid-2"
          style={{ marginTop: 20 }}
        >

          {/* TOP PRODUCTS */}

          <div className="card card-pad">

            <div className="section-head">

              <div>
                <div className="eyebrow">
                  Last 30 days
                </div>

                <h2>
                  Top products
                </h2>
              </div>

            </div>

            {chartProducts.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={240}
              >

                <BarChart
                  data={chartProducts}
                  layout="vertical"
                  margin={{
                    left: 8,
                    right: 16,
                  }}
                >

                  <XAxis
                    type="number"
                    hide
                  />

                  <YAxis
                    dataKey="name"
                    type="category"
                    width={150}
                    tick={{
                      fontSize: 12,
                      fill: "#57645d",
                    }}
                    axisLine={false}
                    tickLine={false}
                  />

                  <Tooltip
                    formatter={(value) => [
                      `${value} units`,
                      "Sold",
                    ]}
                    contentStyle={{
                      fontFamily:
                        "IBM Plex Mono",
                      fontSize: 12,
                      border:
                        "1px solid #dfe4de",
                      borderRadius: 6,
                    }}
                  />

                  <Bar
                    dataKey="units"
                    fill="#1f5d3a"
                    radius={[
                      0,
                      4,
                      4,
                      0,
                    ]}
                    barSize={16}
                  />

                </BarChart>

              </ResponsiveContainer>

            ) : (

              <div
                style={{
                  padding: "50px 0",
                  textAlign: "center",
                  color:
                    "var(--ink-faint)",
                }}
              >
                No product sales found.
              </div>

            )}

          </div>

          {/* BRANCH PERFORMANCE */}

          <div className="card card-pad">

            <div className="section-head">

              <div>
                <div className="eyebrow">
                  Performance
                </div>

                <h2>
                  By branch
                </h2>
              </div>

            </div>

            {branchSummary.length > 0 ? (

              branchSummary.map((branch) => (

                <div
                  key={branch.branch}
                  style={{
                    padding: "12px 0",
                    borderBottom:
                      "1px solid var(--line)",
                  }}
                >

                  <div className="flex-between">

                    <span
                      style={{
                        fontWeight: 500,
                        fontSize: 13.5,
                      }}
                    >
                      {branch.branch}
                    </span>

                    <span
                      className="num"
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      $
                      {formatMoney(
                        branch.sales
                      )}
                    </span>

                  </div>

                  <div
                    className="num"
                    style={{
                      fontSize: 11.5,
                      color:
                        "var(--ink-faint)",
                      marginTop: 2,
                    }}
                  >
                    {branch.transactions}{" "}
                    transaction
                    {branch.transactions === 1
                      ? ""
                      : "s"}{" "}
                    · $
                    {formatMoney(
                      branch.avgTicket
                    )}{" "}
                    avg
                  </div>

                </div>

              ))

            ) : (

              <div
                style={{
                  padding: "20px 0",
                  color:
                    "var(--ink-faint)",
                }}
              >
                No branch sales found.
              </div>

            )}

          </div>

        </div>

        <hr className="perforation" />

        {/* =========================
            BRANCH SUMMARY TABLE
        ========================= */}

        <div className="card">

          <div
            className="card-pad"
            style={{
              paddingBottom: 0,
            }}
          >

            <div className="section-head">

              <div>
                <div className="eyebrow">
                  Full breakdown
                </div>

                <h2>
                  Branch summary
                </h2>
              </div>

            </div>

          </div>

          <table className="data-table">

            <thead>

              <tr>
                <th>Branch</th>
                <th>Revenue</th>
                <th>Transactions</th>
                <th>Avg. ticket</th>
              </tr>

            </thead>

            <tbody>

              {branchSummary.length > 0 ? (

                branchSummary.map((branch) => (

                  <tr key={branch.branch}>

                    <td
                      style={{
                        fontWeight: 500,
                      }}
                    >
                      {branch.branch}
                    </td>

                    <td className="num">
                      $
                      {formatMoney(
                        branch.sales
                      )}
                    </td>

                    <td className="num">
                      {branch.transactions}
                    </td>

                    <td className="num">
                      $
                      {formatMoney(
                        branch.avgTicket
                      )}
                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="4"
                    style={{
                      textAlign: "center",
                      padding: "30px",
                      color:
                        "var(--ink-faint)",
                    }}
                  >
                    No sales found.
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