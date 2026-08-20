import React from "react";
import { logout } from "../api/auth";
import { useNavigate } from "react-router-dom";

export default function Topbar({ title, eyebrow }) {
  const navigate = useNavigate();

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

  return (
    <div className="topbar">
      <div>
        {eyebrow && <div className="topbar-meta">{eyebrow}</div>}
        <h1>{title}</h1>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
        <span className="topbar-meta">{today}</span>
        <div className="user-chip">
          <div className="avatar">SM</div>
          <div>
            <div style={{ fontSize: 12.5, fontWeight: 600 }}>Store Manager</div>
            <div className="role">Downtown Branch</div>
          </div>
        </div>
        <button className="btn btn-secondary" onClick={handleLogout}>
          Sign out
        </button>
      </div>
    </div>
  );
}
