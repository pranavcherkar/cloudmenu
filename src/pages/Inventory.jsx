import { useState, useEffect } from "react";
import {
  getInventory,
  addInventoryItem,
  updateInventoryItem,
  removeInventoryItem,
} from "../services/api";
import { getDishes } from "../services/api";

function getStockStatus(quantity, lowStockAlert) {
  if (quantity === 0)
    return { label: "Out of Stock", color: "stock-out", icon: "🔴" };
  if (quantity <= lowStockAlert)
    return { label: "Low Stock", color: "stock-low", icon: "🟡" };
  return { label: "In Stock", color: "stock-ok", icon: "🟢" };
}

export default function Inventory() {
  const [inventory, setInventory] = useState([]);
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [saving, setSaving] = useState(false);

  const EMPTY_FORM = {
    dishId: "",
    dishName: "",
    quantity: 0,
    unit: "portions",
    lowStockAlert: 5,
  };
  const [form, setForm] = useState(EMPTY_FORM);

  useEffect(() => {
    Promise.all([fetchInventory(), fetchDishes()]);
  }, []);

  async function fetchInventory() {
    try {
      setLoading(true);
      const data = await getInventory();
      setInventory(data);
    } catch (err) {
      console.error("Failed to fetch inventory:", err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchDishes() {
    try {
      const data = await getDishes();
      setDishes(data);
    } catch (err) {
      console.error("Failed to fetch dishes:", err);
    }
  }

  // Dishes that don't have inventory yet
  const availableDishes = dishes.filter(
    (d) => !inventory.find((i) => i.dishId === d.id),
  );

  function openAdd() {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setShowModal(true);
  }

  function openEdit(item) {
    setEditItem(item);
    setForm({
      dishId: item.dishId,
      dishName: item.dishName,
      quantity: item.quantity,
      unit: item.unit,
      lowStockAlert: item.lowStockAlert,
    });
    setShowModal(true);
  }

  function handleDishSelect(e) {
    const dish = dishes.find((d) => d.id === e.target.value);
    if (dish) setForm((p) => ({ ...p, dishId: dish.id, dishName: dish.name }));
  }

  async function handleSave() {
    if (!form.dishId) return;
    setSaving(true);
    try {
      if (editItem) {
        const updated = await updateInventoryItem(editItem.id, form);
        setInventory((prev) =>
          prev.map((i) => (i.id === editItem.id ? updated : i)),
        );
      } else {
        const created = await addInventoryItem(form);
        setInventory((prev) => [...prev, created]);
      }
      setShowModal(false);
      setForm(EMPTY_FORM);
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleQuantityChange(item, delta) {
    const newQty = Math.max(0, item.quantity + delta);
    try {
      const updated = await updateInventoryItem(item.id, {
        ...item,
        quantity: newQty,
      });
      setInventory((prev) => prev.map((i) => (i.id === item.id ? updated : i)));
    } catch (err) {
      console.error("Failed to update quantity:", err);
    }
  }

  async function handleRemove(id, name) {
    if (!window.confirm(`Remove inventory for "${name}"?`)) return;
    try {
      await removeInventoryItem(id);
      setInventory((prev) => prev.filter((i) => i.id !== id));
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  }

  // Stats
  const outOfStock = inventory.filter((i) => i.quantity === 0).length;
  const lowStock = inventory.filter(
    (i) => i.quantity > 0 && i.quantity <= i.lowStockAlert,
  ).length;
  const inStock = inventory.filter((i) => i.quantity > i.lowStockAlert).length;

  if (loading)
    return (
      <div className="global-loading">
        <span className="loading-icon">📦</span>
        <p>Loading inventory...</p>
      </div>
    );

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Inventory</h1>
          <p className="page-subtitle">
            Track dish stock levels — auto disables when out of stock
          </p>
        </div>
        <button
          className="btn btn-primary"
          onClick={openAdd}
          disabled={availableDishes.length === 0}
        >
          + Add Item
        </button>
      </div>

      {/* Stats */}
      <div className="table-stats">
        <div className="tstat-card">
          <span className="tstat-icon">📦</span>
          <span className="tstat-value">{inventory.length}</span>
          <span className="tstat-label">Tracked Dishes</span>
        </div>
        <div className="tstat-card tstat-green">
          <span className="tstat-icon">🟢</span>
          <span className="tstat-value">{inStock}</span>
          <span className="tstat-label">In Stock</span>
        </div>
        <div className="tstat-card tstat-amber">
          <span className="tstat-icon">🟡</span>
          <span className="tstat-value">{lowStock}</span>
          <span className="tstat-label">Low Stock</span>
        </div>
        <div className="tstat-card tstat-red">
          <span className="tstat-icon">🔴</span>
          <span className="tstat-value">{outOfStock}</span>
          <span className="tstat-label">Out of Stock</span>
        </div>
      </div>

      {/* Inventory List */}
      {inventory.length === 0 ? (
        <div className="empty-state large">
          <span className="empty-icon">📦</span>
          <p>No inventory tracked yet.</p>
          <p style={{ fontSize: "13px", color: "var(--text-3)" }}>
            Add dishes to start tracking stock levels.
          </p>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Item
          </button>
        </div>
      ) : (
        <div className="inv-grid">
          {inventory
            .sort((a, b) => a.quantity - b.quantity)
            .map((item) => {
              const status = getStockStatus(item.quantity, item.lowStockAlert);
              return (
                <div key={item.id} className={`inv-card ${status.color}`}>
                  <div className="inv-card-header">
                    <span className="inv-dish-name">{item.dishName}</span>
                    <span className={`inv-badge ${status.color}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>

                  <div className="inv-quantity-row">
                    <button
                      className="qty-btn qty-minus"
                      onClick={() => handleQuantityChange(item, -1)}
                      disabled={item.quantity === 0}
                    >
                      −
                    </button>
                    <div className="qty-display">
                      <span className="qty-value">{item.quantity}</span>
                      <span className="qty-unit">{item.unit}</span>
                    </div>
                    <button
                      className="qty-btn qty-plus"
                      onClick={() => handleQuantityChange(item, +1)}
                    >
                      +
                    </button>
                  </div>

                  <div className="inv-alert-row">
                    ⚠️ Alert below {item.lowStockAlert} {item.unit}
                  </div>

                  {item.quantity === 0 && (
                    <div className="inv-disabled-note">
                      🚫 Dish auto-disabled on menu
                    </div>
                  )}

                  <div className="inv-actions">
                    <button
                      className="btn btn-sm btn-outline"
                      onClick={() => openEdit(item)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleRemove(item.id, item.dishName)}
                    >
                      Remove
                    </button>
                  </div>

                  <div className="inv-updated">
                    Updated{" "}
                    {new Date(item.updatedAt).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </div>
                </div>
              );
            })}
        </div>
      )}

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? "Edit Inventory Item" : "Add Inventory Item"}</h3>
              <button
                className="modal-close"
                onClick={() => setShowModal(false)}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              {!editItem && (
                <div className="form-group">
                  <label className="form-label">Select Dish *</label>
                  <select
                    className="form-input"
                    value={form.dishId}
                    onChange={handleDishSelect}
                  >
                    <option value="">-- Select a dish --</option>
                    {availableDishes.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {editItem && (
                <div className="form-group">
                  <label className="form-label">Dish</label>
                  <input
                    className="form-input"
                    value={form.dishName}
                    disabled
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Quantity *</label>
                  <input
                    type="number"
                    min="0"
                    className="form-input"
                    value={form.quantity}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        quantity: Number(e.target.value),
                      }))
                    }
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Unit</label>
                  <select
                    className="form-input"
                    value={form.unit}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, unit: e.target.value }))
                    }
                  >
                    <option>portions</option>
                    <option>plates</option>
                    <option>pieces</option>
                    <option>bowls</option>
                    <option>glasses</option>
                    <option>kg</option>
                    <option>liters</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Low Stock Alert Threshold</label>
                <input
                  type="number"
                  min="1"
                  className="form-input"
                  value={form.lowStockAlert}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      lowStockAlert: Number(e.target.value),
                    }))
                  }
                />
                <p className="form-hint">
                  Show warning when quantity drops to or below this number.
                </p>
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
                onClick={handleSave}
                disabled={saving || !form.dishId}
              >
                {saving ? "Saving..." : editItem ? "Save Changes" : "Add Item"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
