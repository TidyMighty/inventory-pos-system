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
import { StatCard, StockBadge } from "../components/StatCard";

// Placeholder data shaped like what /api/sales/reports/summary/ and
// /api/inventory/ will return — swap the useEffect below for real client
// calls once those endpoints exist (see src/api/sales.js, products.js).
const TREND = [
  { day: "Mon", sales: 4200 },
  { day: "Tue", sales: 3980 },
  { day: "Wed", sales: 5120 },
  { day: "Thu", sales: 4870 },
  { day: "Fri", sales: 6430 },
  { day: "Sat", sales: 7210 },
  { day: "Sun", sales: 5560 },
];

const LOW_STOCK = [
  { name: "Espresso Beans 1kg", sku: "BEV-1042", qty: 3, threshold: 10, status: "low" },
  { name: "Oat Milk 1L", sku: "BEV-2210", qty: 0, threshold: 8, status: "out" },
  { name: "Paper Cups 12oz", sku: "SUP-0031", qty: 6, threshold: 20, status: "low" },
];

const RECENT_SALES = [
  { id: "TXN-8841", branch: "Downtown", items: 3, total: 214.5, time: "10:42 AM" },
  { id: "TXN-8840", branch: "Riverside", items: 1, total: 42.0, time: "10:31 AM" },
  { id: "TXN-8839", branch: "Downtown", items: 5, total: 388.2, time: "10:07 AM" },
  { id: "TXN-8838", branch: "Airport", items: 2, total: 96.75, time: "9:52 AM" },
];

export default function Dashboard() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Replace with: getSalesSummary().then(setSummary) once the backend
    // reporting endpoints are built.
    setReady(true);
  }, []);

  return (
    <>
      <Topbar eyebrow="Overview — All branches" title="Dashboard" />
      <div className="content">
        <div className="stat-row">
          <StatCard label="Today's sales" prefix="$" value="5,560.00" delta="12.4% vs yesterday" deltaDirection="up" />
          <StatCard label="Transactions" value="86" delta="6 vs yesterday" deltaDirection="up" />
          <StatCard label="Low stock items" value="7" delta="2 new today" deltaDirection="down" />
          <StatCard label="Active branches" value="3" />
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="card card-pad">
            <div className="section-head">
              <div>
                <div className="eyebrow">Last 7 days</div>
                <h2>Sales trend</h2>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={TREND} margin={{ left: -18, right: 8 }}>
                <defs>
                  <linearGradient id="salesFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#1f5d3a" stopOpacity={0.28} />
                    <stop offset="100%" stopColor="#1f5d3a" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fontSize: 12, fill: "#8b968f", fontFamily: "IBM Plex Mono" }}
                  axisLine={{ stroke: "#dfe4de" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "#8b968f", fontFamily: "IBM Plex Mono" }}
                  axisLine={false}
                  tickLine={false}
                  width={52}
                  tickFormatter={(v) => `$${v / 1000}k`}
                />
                <Tooltip
                  formatter={(v) => [`$${v.toLocaleString()}`, "Sales"]}
                  contentStyle={{
                    fontFamily: "IBM Plex Mono",
                    fontSize: 12,
                    border: "1px solid #dfe4de",
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
          </div>

          <div className="card card-pad">
            <div className="section-head">
              <div>
                <div className="eyebrow">Needs attention</div>
                <h2>Low stock</h2>
              </div>
            </div>
            {LOW_STOCK.map((item) => (
              <div
                key={item.sku}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{item.name}</div>
                  <div className="num" style={{ fontSize: 11, color: "var(--ink-faint)" }}>
                    {item.sku} · {item.qty} left
                  </div>
                </div>
                <StockBadge status={item.status} />
              </div>
            ))}
          </div>
        </div>

        <hr className="perforation" />

        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Live feed</div>
                <h2>Recent transactions</h2>
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
              {RECENT_SALES.map((sale) => (
                <tr key={sale.id}>
                  <td className="num">{sale.id}</td>
                  <td>{sale.branch}</td>
                  <td className="num">{sale.items}</td>
                  <td className="num">${sale.total.toFixed(2)}</td>
                  <td className="num cell-muted">{sale.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
