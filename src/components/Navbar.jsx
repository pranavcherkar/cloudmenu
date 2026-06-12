import { NavLink } from "react-router-dom";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <span className="navbar-logo">🍽</span>
        <span className="navbar-title">CloudMenu</span>
        <span className="navbar-subtitle">Restaurant Manager</span>
      </div>
      <div className="navbar-links">
        <NavLink
          to="/"
          end
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Dashboard
        </NavLink>
        <NavLink
          to="/menu"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Menu
        </NavLink>
        <NavLink
          to="/tables"
          className={({ isActive }) =>
            isActive ? "nav-link active" : "nav-link"
          }
        >
          Tables
        </NavLink>
        <NavLink
          to="/add"
          className={({ isActive }) =>
            isActive ? "nav-link nav-link-cta active" : "nav-link nav-link-cta"
          }
        >
          + Add Dish
        </NavLink>
      </div>
    </nav>
  );
}
