import React from "react";
import { NavLink } from "react-router-dom";

const NAV = [
  { to: "/", label: "Dashboard", idx: "01" },
  { to: "/products", label: "Products", idx: "02" },
  { to: "/inventory", label: "Inventory", idx: "03" },
  { to: "/pos", label: "POS Checkout", idx: "04" },
  { to: "/reports", label: "Reports", idx: "05" },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <span className="mark" />
        <span>Ledger</span>
      </div>

      <div className="sidebar-section-label">
        Operations
      </div>

      {NAV.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            `nav-item${isActive ? " active" : ""}`
          }
        >
          <span className="idx">
            {item.idx}
          </span>

          {item.label}
        </NavLink>
      ))}

      <div className="sidebar-footer">
        Multi-branch inventory &amp; POS
        <br />
        v0.1 — local build
      </div>
    </aside>
  );
}
