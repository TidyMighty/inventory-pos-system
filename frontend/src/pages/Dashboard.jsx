import React, { useEffect, useState } from "react";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import Topbar from "../components/Topbar";
import { StatCard } from "../components/StatCard";
import { getSalesSummary, listSales } from "../api/sales";

function formatMoney(value) {
  return Number(value || 0).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function formatDate(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

function formatTime(dateValue) {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) {
    return String(dateValue);
  }

  return date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
  });
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

function getSaleItemsCount(sale) {
  if (Array.isArray(sale.items)) {
    return sale.items.reduce(
      (total, item) => total + Number(item.quantity || 0),
      0
    );
  }

  return Number(
    sale.items_count ??
      sale.item_count ??
      sale.quantity ??
      0
  );
}

function getBranchName(sale) {
  if (typeof sale.branch === "string") {
    return sale.branch;
  }

  if (sale.branch?.name) {
    return sale.branch.name;
  }

  if (sale.branch_name) {
    return sale.branch_name;
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

function normalizeSalesResponse(data) {
  if (Array.isArray(data)) {
    return data;
  }

  if (Array.isArray(data?.results)) {
    return data.results;
  }

  if (Array.isArray(data?.sales)) {
    return data.sales;
  }

  if (Array.isArray(data?.data)) {
    return data.data;
  }

  return [];
}

function normalizeTrend(summary) {
  if (!Array.isArray(summary?.trend)) {
    return [];
  }

  return summary.trend.map((item) => ({
    day: item.day,
    sales: Number(item.sales || 0),
  }));
}

export default function Dashboard() {
  const [summary, setSummary] = useState(null);
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadDashboard() {
      try {
        setLoading(true);
        setError("");

        const [summaryData, salesData] = await Promise.all([
          getSalesSummary(),
          listSales(),
        ]);

        if (!mounted) return;

        setSummary(summaryData);
        setSales(normalizeSalesResponse(salesData));
      } catch (err) {
        console.error("Dashboard loading error:", err);

        if (!mounted) return;

        setError(
          err?.response?.data?.detail ||
            err?.response?.data?.message ||
            "Unable to load dashboard data."
        );
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      mounted = false;
    };
  }, []);

  const trend = normalizeTrend(summary);

  const recentSales = [...sales]
    .sort((a, b) => {
      const dateA = new Date(
        getSaleDate(a) || 0
      ).getTime();

      const dateB = new Date(
        getSaleDate(b) || 0
      ).getTime();

      return dateB - dateA;
    })
    .slice(0, 5);

  if (loading) {
    return (
      <>
        <Topbar
          eyebrow="Overview"
          title="Dashboard"
        />

        <div className="content">
          <div className="card card-pad">
            <div className="eyebrow">
              Loading
            </div>

            <h2>
              Loading dashboard data...
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
          eyebrow="Overview"
          title="Dashboard"
        />

        <div className="content">
          <div className="card card-pad">
            <div className="eyebrow">
              Dashboard error
            </div>

            <h2>
              Unable to load dashboard
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
        eyebrow="Overview"
        title="Dashboard"
      />

      <div className="content">

        {/* =========================
            SUMMARY CARDS
        ========================= */}

        <div className="stat-row">

          <StatCard
            label="Today's sales"
            prefix="$"
            value={formatMoney(
              summary?.today_sales
            )}
          />

          <StatCard
            label="Today's transactions"
            value={String(
              summary?.today_transactions ?? 0
            )}
          />

          <StatCard
            label="Low stock items"
            value={String(
              summary?.low_stock_items ?? 0
            )}
          />

          <StatCard
            label="Active branches"
            value={String(
              summary?.active_branches ?? 0
            )}
          />

        </div>

        {/* =========================
            SALES TREND
        ========================= */}

        <div
          className="grid-2"
          style={{ marginTop: 20 }}
        >

          <div className="card card-pad">

            <div className="section-head">

              <div>
                <div className="eyebrow">
                  Last 7 days
                </div>

                <h2>
                  Sales trend
                </h2>
              </div>

            </div>

            {trend.length > 0 ? (

              <ResponsiveContainer
                width="100%"
                height={220}
              >

                <AreaChart
                  data={trend}
                  margin={{
                    left: -18,
                    right: 8,
                  }}
                >

                  <defs>

                    <linearGradient
                      id="salesFill"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >

                      <stop
                        offset="0%"
                        stopColor="#1f5d3a"
                        stopOpacity={0.28}
                      />

                      <stop
                        offset="100%"
                        stopColor="#1f5d3a"
                        stopOpacity={0}
                      />

                    </linearGradient>

                  </defs>

                  <XAxis
                    dataKey="day"
                    tick={{
                      fontSize: 12,
                      fill: "#8b968f",
                      fontFamily:
                        "IBM Plex Mono",
                    }}
                    axisLine={{
                      stroke: "#dfe4de",
                    }}
                    tickLine={false}
                  />

                  <YAxis
                    tick={{
                      fontSize: 11,
                      fill: "#8b968f",
                      fontFamily:
                        "IBM Plex Mono",
                    }}
                    axisLine={false}
                    tickLine={false}
                    width={52}
                    tickFormatter={(value) =>
                      `$${Number(value || 0) / 1000}k`
                    }
                  />

                  <Tooltip
                    formatter={(value) => [
                      `$${formatMoney(value)}`,
                      "Sales",
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

                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="#1f5d3a"
                    strokeWidth={2}
                    fill="url(#salesFill)"
                  />

                </AreaChart>

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
                No sales data available yet.
              </div>

            )}

          </div>

          {/* =========================
              LOW STOCK
          ========================= */}

          <div className="card card-pad">

            <div className="section-head">

              <div>
                <div className="eyebrow">
                  Needs attention
                </div>

                <h2>
                  Low stock
                </h2>
              </div>

            </div>

            {Number(
              summary?.low_stock_items || 0
            ) > 0 ? (

              <div
                style={{
                  padding: "20px 0",
                  color:
                    "var(--ink-faint)",
                }}
              >

                {summary.low_stock_items}{" "}
                item
                {summary.low_stock_items === 1
                  ? ""
                  : "s"}{" "}
                currently need
                attention.

              </div>

            ) : (

              <div
                style={{
                  padding: "20px 0",
                  color:
                    "var(--ink-faint)",
                }}
              >
                No low-stock items reported.
              </div>

            )}

          </div>

        </div>

        <hr className="perforation" />

        {/* =========================
            RECENT TRANSACTIONS
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
                  Live feed
                </div>

                <h2>
                  Recent transactions
                </h2>
              </div>

            </div>

          </div>

          <table className="data-table">

            <thead>

              <tr>
                <th>Ticket</th>
                <th>Branch</th>
                <th>Items</th>
                <th>Total</th>
                <th>Time</th>
              </tr>

            </thead>

            <tbody>

              {recentSales.length > 0 ? (

                recentSales.map((sale) => (

                  <tr key={sale.id}>

                    <td className="num">
                      {sale.id ?? "—"}
                    </td>

                    <td>
                      {getBranchName(sale)}
                    </td>

                    <td className="num">
                      {getSaleItemsCount(
                        sale
                      )}
                    </td>

                    <td className="num">
                      $
                      {formatMoney(
                        getSaleTotal(sale)
                      )}
                    </td>

                    <td className="num cell-muted">

                      {formatDate(
                        getSaleDate(sale)
                      )}{" "}

                      {formatTime(
                        getSaleDate(sale)
                      )}

                    </td>

                  </tr>

                ))

              ) : (

                <tr>

                  <td
                    colSpan="5"
                    style={{
                      textAlign:
                        "center",
                      padding: "30px",
                      color:
                        "var(--ink-faint)",
                    }}
                  >
                    No transactions found.
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