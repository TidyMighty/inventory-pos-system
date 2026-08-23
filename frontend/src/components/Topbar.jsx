import React from "react";
import { getCurrentUser, logout } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title, eyebrow }) {
  const navigate = useNavigate();
  const user = getCurrentUser();

  function handleLogout() {
    logout();
    navigate("/login");
  }

  const today = new Date().toLocaleDateString(undefined, {
    weekday: "short",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  const roleLabels = {
    admin: "Store Admin",
    manager: "Store Manager",
    cashier: "Cashier",
  };

  const role = String(user?.role || "").toLowerCase();
  const displayRole = roleLabels[role] || "User";

  const firstName = user?.first_name || "";
  const lastName = user?.last_name || "";
  const fullName = `${firstName} ${lastName}`.trim();

  const displayName =
    fullName ||
    user?.username ||
    displayRole;

  const branchName =
    user?.branch?.name ||
    (role === "admin" ? "All Branches" : "No Branch Assigned");

  const initials =
    fullName
      ? fullName
          .split(" ")
          .filter(Boolean)
          .map((name) => name[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()
      : displayName.slice(0, 2).toUpperCase();

  return (
    <div className="topbar">
      <div>
        {eyebrow && <div className="topbar-meta">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="topbar-meta">{today}</span>

        <div className="user-chip">
          <div className="avatar">{initials}</div>

          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>
              {displayRole}
            </div>

            <div className="role">
              {branchName}
            </div>
          </div>
        </div>

        <button className="btn btn-secondary" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}