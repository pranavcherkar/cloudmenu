import { useState, useEffect } from "react";
import {
  getTables,
  addTable,
  updateTableStatus,
  removeTable,
} from "../services/api";

const STATUS_CONFIG = {
  available: { label: "Available", color: "status-available", icon: "🟢" },
  occupied: { label: "Occupied", color: "status-occupied", icon: "🔴" },
  "bill-requested": {
    label: "Bill Requested",
    color: "status-bill",
    icon: "🟡",
  },
};

export default function Tables() {
  const [tables, setTables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [newTable, setNewTable] = useState({ capacity: 4 });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTables();
  }, []);

  async function fetchTables() {
    try {
      setLoading(true);
      const data = await getTables();
      setTables(data);
    } catch (err) {
      console.error("Failed to fetch tables:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleStatusChange(id, status) {
    try {
      const updated = await updateTableStatus(id, status);
      setTables((prev) => prev.map((t) => (t.id === id ? updated : t)));
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  }

  async function handleAddTable() {
    if (!newTable.number) return;
    setSaving(true);
    try {
      const created = await addTable(newTable);
      setTables((prev) =>
        [...prev, created].sort((a, b) => a.number - b.number),
      );
      setShowModal(false);
      setNewTable({ capacity: 4 });
    } catch (err) {
      console.error("Failed to add table:", err);
    } finally {
      setSaving(false);
    }
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove ${name}? This cannot be undone.`)) return;
    try {
      await removeTable(id);
      setTables((prev) => prev.filter((t) => t.id !== id));
    } catch (err) {
      console.error("Failed to remove table:", err);
    }
  }

  // Stats
  const total = tables.length;
  const available = tables.filter((t) => t.status === "available").length;
  const occupied = tables.filter((t) => t.status === "occupied").length;
  const billReq = tables.filter((t) => t.status === "bill-requested").length;

  if (loading)
    return (
      <div className="global-loading">
        <span className="loading-icon">🍽</span>
        <p>Loading tables...</p>
      </div>
    );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Table Management</h1>
          <p className="page-subtitle">
            Monitor and update table occupancy in real time
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowModal(true)}>
          + Add Table
        </button>
      </div>

      {/* Stats Row */}
      <div className="table-stats">
        <div className="tstat-card">
          <span className="tstat-icon">🪑</span>
          <span className="tstat-value">{total}</span>
          <span className="tstat-label">Total Tables</span>
        </div>
        <div className="tstat-card tstat-green">
          <span className="tstat-icon">🟢</span>
          <span className="tstat-value">{available}</span>
          <span className="tstat-label">Available</span>
        </div>
        <div className="tstat-card tstat-red">
          <span className="tstat-icon">🔴</span>
          <span className="tstat-value">{occupied}</span>
          <span className="tstat-label">Occupied</span>
        </div>
        <div className="tstat-card tstat-amber">
          <span className="tstat-icon">🟡</span>
          <span className="tstat-value">{billReq}</span>
          <span className="tstat-label">Bill Requested</span>
        </div>
      </div>

      {/* Tables Grid */}
      {tables.length === 0 ? (
        <div className="empty-state large">
          <span className="empty-icon">🪑</span>
          <p>No tables yet. Add your first table.</p>
          <button
            className="btn btn-primary"
            onClick={() => setShowModal(true)}
          >
            + Add Table
          </button>
        </div>
      ) : (
        <div className="tables-grid">
          {tables.map((table) => {
            const cfg = STATUS_CONFIG[table.status] || STATUS_CONFIG.available;
            return (
              <div key={table.id} className={`table-card ${cfg.color}`}>
                <div className="table-card-header">
                  <span className="table-number">{table.name}</span>
                  <span className="table-capacity">
                    👥 {table.capacity} seats
                  </span>
                </div>

                <div className="table-status-badge">
                  {cfg.icon} {cfg.label}
                </div>

                {table.occupiedAt && table.status === "occupied" && (
                  <div className="table-time">
                    Since{" "}
                    {new Date(table.occupiedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                )}

                {/* Status Action Buttons */}
                <div className="table-actions">
                  {table.status !== "available" && (
                    <button
                      className="btn btn-sm btn-success"
                      onClick={() => handleStatusChange(table.id, "available")}
                    >
                      ✅ Free
                    </button>
                  )}
                  {table.status !== "occupied" && (
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleStatusChange(table.id, "occupied")}
                    >
                      🔴 Occupy
                    </button>
                  )}
                  {table.status !== "bill-requested" && (
                    <button
                      className="btn btn-sm btn-warning"
                      onClick={() =>
                        handleStatusChange(table.id, "bill-requested")
                      }
                    >
                      🟡 Bill
                    </button>
                  )}
                </div>

                <button
                  className="table-remove-btn"
                  onClick={() => handleRemove(table.id, table.name)}
                  title="Remove table"
                >
                  ✕
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Table Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Add New Table</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">Table Number *</label>
                <input
                  type="number"
                  className="form-input"
                  placeholder="e.g. 5"
                  value={newTable.number || ""}
                  onChange={(e) =>
                    setNewTable((p) => ({
                      ...p,
                      number: Number(e.target.value),
                      name: `Table ${e.target.value}`,
                    }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Custom Name (optional)</label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Window Table, VIP Room"
                  value={newTable.name || ""}
                  onChange={(e) =>
                    setNewTable((p) => ({ ...p, name: e.target.value }))
                  }
                />
              </div>
              <div className="form-group">
                <label className="form-label">Seating Capacity</label>
                <select
                  className="form-input"
                  value={newTable.capacity}
                  onChange={(e) =>
                    setNewTable((p) => ({
                      ...p,
                      capacity: Number(e.target.value),
                    }))
                  }
                >
                  {[2, 4, 6, 8, 10, 12].map((n) => (
                    <option key={n} value={n}>
                      {n} seats
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-ghost"
                onClick={() => setShowModal(false)}
              >
                Cancel
              </button>
              <button
                className="btn btn-primary"
                onClick={handleAddTable}
                disabled={saving}
              >
                {saving ? "Adding..." : "Add Table"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
