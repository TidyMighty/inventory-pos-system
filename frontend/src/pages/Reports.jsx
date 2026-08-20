import React from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import Topbar from "../components/Topbar";
import { StatCard } from "../components/StatCard";

// Swap for getTopProducts() / getSalesSummary() from src/api/sales.js.
const TOP_PRODUCTS = [
  { name: "Espresso Beans 1kg", units: 214 },
  { name: "Almond Croissant", units: 188 },
  { name: "Blueberry Muffin", units: 165 },
  { name: "Oat Milk 1L", units: 140 },
  { name: "Whole Bean Decaf 1kg", units: 96 },
];

const BRANCH_SUMMARY = [
  { branch: "Downtown", sales: 18420, transactions: 312, avgTicket: 59.04 },
  { branch: "Riverside", sales: 12960, transactions: 241, avgTicket: 53.78 },
  { branch: "Airport", sales: 9870, transactions: 198, avgTicket: 49.85 },
];

export default function Reports() {
  return (
    <>
      <Topbar eyebrow="This month" title="Reports" />
      <div className="content">
        <div className="stat-row">
          <StatCard label="Total revenue" prefix="$" value="41,250.00" delta="8.1% vs last month" deltaDirection="up" />
          <StatCard label="Transactions" value="751" delta="34 vs last month" deltaDirection="up" />
          <StatCard label="Avg. ticket" prefix="$" value="54.93" />
          <StatCard label="Return rate" value="1.2%" delta="0.3% vs last month" deltaDirection="down" />
        </div>

        <div className="grid-2" style={{ marginTop: 20 }}>
          <div className="card card-pad">
            <div className="section-head">
              <div>
                <div className="eyebrow">By units sold</div>
                <h2>Top products</h2>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={TOP_PRODUCTS} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" hide />
                <YAxis
                  dataKey="name"
                  type="category"
                  width={150}
                  tick={{ fontSize: 12, fill: "#57645d" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(v) => [`${v} units`, "Sold"]}
                  contentStyle={{ fontFamily: "IBM Plex Mono", fontSize: 12, border: "1px solid #dfe4de", borderRadius: 6 }}
                />
                <Bar dataKey="units" fill="#1f5d3a" radius={[0, 4, 4, 0]} barSize={16} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card card-pad">
            <div className="section-head">
              <div>
                <div className="eyebrow">Performance</div>
                <h2>By branch</h2>
              </div>
            </div>
            {BRANCH_SUMMARY.map((b) => (
              <div
                key={b.branch}
                style={{
                  padding: "12px 0",
                  borderBottom: "1px solid var(--line)",
                }}
              >
                <div className="flex-between">
                  <span style={{ fontWeight: 500, fontSize: 13.5 }}>{b.branch}</span>
                  <span className="num" style={{ fontWeight: 600 }}>
                    ${b.sales.toLocaleString()}
                  </span>
                </div>
                <div className="num" style={{ fontSize: 11.5, color: "var(--ink-faint)", marginTop: 2 }}>
                  {b.transactions} transactions · ${b.avgTicket.toFixed(2)} avg
                </div>
              </div>
            ))}
          </div>
        </div>

        <hr className="perforation" />

        <div className="card">
          <div className="card-pad" style={{ paddingBottom: 0 }}>
            <div className="section-head">
              <div>
                <div className="eyebrow">Full breakdown</div>
                <h2>Branch summary</h2>
              </div>
              <button className="btn btn-secondary">Export CSV</button>
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
              {BRANCH_SUMMARY.map((b) => (
                <tr key={b.branch}>
                  <td style={{ fontWeight: 500 }}>{b.branch}</td>
                  <td className="num">${b.sales.toLocaleString()}</td>
                  <td className="num">{b.transactions}</td>
                  <td className="num">${b.avgTicket.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
