import { useMemo } from "react";
import { Link } from "react-router-dom";

export default function Dashboard({ dishes, inventory }) {
  const stats = useMemo(() => {
    const categories = [...new Set(dishes.map((d) => d.category))];
    return {
      total: dishes.length,
      available: dishes.filter((d) => d.available).length,
      unavailable: dishes.filter((d) => !d.available).length,
      categories: categories.length,
    };
  }, [dishes]);

  const recentDishes = dishes.slice(-4).reverse();

  const cards = [
    {
      label: "Total Dishes",
      value: stats.total,
      icon: "🍴",
      color: "card-blue",
    },
    {
      label: "Available",
      value: stats.available,
      icon: "✅",
      color: "card-green",
    },
    {
      label: "Unavailable",
      value: stats.unavailable,
      icon: "⏸",
      color: "card-red",
    },
    {
      label: "Categories",
      value: stats.categories,
      icon: "🗂",
      color: "card-amber",
    },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Overview of your restaurant menu</p>
        </div>
        <Link to="/add" className="btn btn-primary">
          + Add New Dish
        </Link>
      </div>

      <div className="stat-grid">
        {cards.map((card) => (
          <div key={card.label} className={`stat-card ${card.color}`}>
            <div className="stat-icon">{card.icon}</div>
            <div className="stat-info">
              <span className="stat-value">{card.value}</span>
              <span className="stat-label">{card.label}</span>
            </div>
          </div>
        ))}
      </div>
      {/* Low Stock Alerts */}
      {inventory.length > 0 && (
        <div className="alerts-section">
          <div className="section-header">
            <h2 className="section-title">⚠️ Stock Alerts</h2>
            <Link to="/inventory" className="link-subtle">
              Manage inventory →
            </Link>
          </div>
          <div className="alerts-list">
            {inventory
              .filter((i) => i.quantity === 0)
              .map((i) => (
                <div key={i.id} className="alert-row alert-danger">
                  <span>
                    🔴 <strong>{i.dishName}</strong> — Out of Stock
                  </span>
                  <span className="alert-note">Auto disabled on menu</span>
                </div>
              ))}
            {inventory
              .filter((i) => i.quantity > 0 && i.quantity <= i.lowStockAlert)
              .map((i) => (
                <div key={i.id} className="alert-row alert-warning">
                  <span>
                    🟡 <strong>{i.dishName}</strong> — Only {i.quantity}{" "}
                    {i.unit} left
                  </span>
                  <span className="alert-note">Low stock</span>
                </div>
              ))}
            {inventory.filter((i) => i.quantity === 0).length === 0 &&
              inventory.filter(
                (i) => i.quantity > 0 && i.quantity <= i.lowStockAlert,
              ).length === 0 && (
                <div className="alert-row alert-ok">
                  ✅ All items are well stocked
                </div>
              )}
          </div>
        </div>
      )}
      <div className="dashboard-bottom">
        <div className="recent-section">
          <div className="section-header">
            <h2 className="section-title">Recently Added</h2>
            <Link to="/menu" className="link-subtle">
              View all →
            </Link>
          </div>
          {recentDishes.length === 0 ? (
            <div className="empty-state">
              <p>
                No dishes yet. <Link to="/add">Add your first dish</Link>
              </p>
            </div>
          ) : (
            <div className="recent-grid">
              {recentDishes.map((dish) => (
                <div key={dish.id} className="recent-card">
                  <img
                    src={dish.imageUrl}
                    alt={dish.name}
                    className="recent-img"
                  />
                  <div className="recent-info">
                    <span className="recent-name">{dish.name}</span>
                    <span className="recent-category">{dish.category}</span>
                    <span className="recent-price">₹{dish.price}</span>
                  </div>
                  <span
                    className={`badge ${dish.available ? "badge-available" : "badge-unavailable"}`}
                  >
                    {dish.available ? "Available" : "Off"}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="category-section">
          <h2 className="section-title">By Category</h2>
          <div className="category-list">
            {[...new Set(dishes.map((d) => d.category))].map((cat) => {
              const count = dishes.filter((d) => d.category === cat).length;
              const avail = dishes.filter(
                (d) => d.category === cat && d.available,
              ).length;
              return (
                <div key={cat} className="category-row">
                  <span className="category-name">{cat}</span>
                  <div className="category-meta">
                    <span className="category-count">{count} dishes</span>
                    <div className="category-bar">
                      <div
                        className="category-bar-fill"
                        style={{ width: `${(avail / count) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
