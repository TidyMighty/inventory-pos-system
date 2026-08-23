import React from "react";
import {
  Navigate,
  Route,
  BrowserRouter as Router,
  Routes,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import { isAuthenticated } from "./api/auth";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import ProductList from "./pages/ProductList";
import Inventory from "./pages/Inventory";
import POSCheckout from "./pages/POSCheckout";
import Reports from "./pages/Reports";

function ProtectedLayout({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="app-shell">
      <Sidebar />

      <div className="main">
        {children}
      </div>
    </div>
  );
}

export default function App() {
  return (
    <Router>
      <Routes>

        <Route
          path="/login"
          element={<Login />}
        />

        <Route
          path="/"
          element={
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          }
        />

        <Route
          path="/products"
          element={
            <ProtectedLayout>
              <ProductList />
            </ProtectedLayout>
          }
        />

        <Route
          path="/inventory"
          element={
            <ProtectedLayout>
              <Inventory />
            </ProtectedLayout>
          }
        />

        <Route
          path="/pos"
          element={
            <ProtectedLayout>
              <POSCheckout />
            </ProtectedLayout>
          }
        />

        <Route
          path="/reports"
          element={
            <ProtectedLayout>
              <Reports />
            </ProtectedLayout>
          }
        />

        <Route
          path="*"
          element={<Navigate to="/" replace />}
        />

      </Routes>
    </Router>
  );
}
