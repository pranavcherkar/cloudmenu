import { useState } from "react";
import { Link } from "react-router-dom";

export default function Menu({ dishes, onDelete, onToggle }) {
  const [search, setSearch] = useState("");
  const [filterCat, setFilterCat] = useState("All");
  const [filterAvail, setFilterAvail] = useState("All");

  const categories = ["All", ...new Set(dishes.map((d) => d.category))];

  const filtered = dishes.filter((d) => {
    const matchSearch =
      d.name.toLowerCase().includes(search.toLowerCase()) ||
      d.description.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === "All" || d.category === filterCat;
    const matchAvail =
      filterAvail === "All" ||
      (filterAvail === "Available" ? d.available : !d.available);
    return matchSearch && matchCat && matchAvail;
  });

  function handleDelete(id, name) {
    if (window.confirm(`Delete "${name}"? This cannot be undone.`)) {
      onDelete(id);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Menu</h1>
          <p className="page-subtitle">{filtered.length} of {dishes.length} dishes</p>
        </div>
        <Link to="/add" className="btn btn-primary">+ Add Dish</Link>
      </div>

      <div className="filter-bar">
        <input
          type="text"
          placeholder="Search dishes…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="search-input"
        />
        <div className="filter-chips">
          {categories.map((cat) => (
            <button
              key={cat}
              className={`chip ${filterCat === cat ? "chip-active" : ""}`}
              onClick={() => setFilterCat(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
        <select
          value={filterAvail}
          onChange={(e) => setFilterAvail(e.target.value)}
          className="select-input"
        >
          <option>All</option>
          <option>Available</option>
          <option>Unavailable</option>
        </select>
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state large">
          <span className="empty-icon">🍽</span>
          <p>No dishes match your filters.</p>
          <button className="btn btn-ghost" onClick={() => { setSearch(""); setFilterCat("All"); setFilterAvail("All"); }}>
            Clear filters
          </button>
        </div>
      ) : (
        <div className="dish-grid">
          {filtered.map((dish) => (
            <div key={dish.id} className={`dish-card ${!dish.available ? "dish-card-dim" : ""}`}>
              <div className="dish-img-wrap">
                <img src={dish.imageUrl} alt={dish.name} className="dish-img" />
                <span className={`badge badge-float ${dish.available ? "badge-available" : "badge-unavailable"}`}>
                  {dish.available ? "Available" : "Unavailable"}
                </span>
                <span className="badge badge-cat-float">{dish.category}</span>
              </div>
              <div className="dish-body">
                <h3 className="dish-name">{dish.name}</h3>
                <p className="dish-desc">{dish.description}</p>
                <div className="dish-footer">
                  <span className="dish-price">₹{dish.price}</span>
                  <div className="dish-actions">
                    <Link to={`/edit/${dish.id}`} className="btn btn-sm btn-outline">
                      Edit
                    </Link>
                    <button
                      className={`btn btn-sm ${dish.available ? "btn-warning" : "btn-success"}`}
                      onClick={() => onToggle(dish.id)}
                    >
                      {dish.available ? "Disable" : "Enable"}
                    </button>
                    <button
                      className="btn btn-sm btn-danger"
                      onClick={() => handleDelete(dish.id, dish.name)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
