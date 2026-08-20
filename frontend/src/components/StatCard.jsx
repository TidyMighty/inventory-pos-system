import React from "react";

export function StatCard({ label, value, delta, deltaDirection, prefix = "" }) {
  return (
    <div className="stat-card">
      <div className="label">{label}</div>
      <div className="value">
        {prefix}
        {value}
      </div>
      {delta && (
        <div className={`delta ${deltaDirection === "down" ? "down" : "up"}`}>
          {deltaDirection === "down" ? "▼" : "▲"} {delta}
        </div>
      )}
    </div>
  );
}

export function StockBadge({ status }) {
  const map = {
    ok: { cls: "ok", text: "In stock" },
    low: { cls: "low", text: "Low stock" },
    out: { cls: "out", text: "Out of stock" },
  };
  const { cls, text } = map[status] || map.ok;
  return <span className={`badge ${cls}`}>{text}</span>;
}
