import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import AddDish from "./pages/AddDish";
import Tables from "./pages/Tables";
import { getDishes, addDish, updateDish, deleteDish } from "./services/api";
import "./App.css";

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch all dishes from DynamoDB on first load
  useEffect(() => {
    fetchDishes();
  }, []);

  async function fetchDishes() {
    try {
      setLoading(true);
      setError("");
      const data = await getDishes();
      setDishes(data);
    } catch (err) {
      console.error("Failed to fetch dishes:", err);
      setError("Could not connect to server. Check your API URL.");
    } finally {
      setLoading(false);
    }
  }

  async function handleAdd(data) {
    try {
      const newDish = await addDish(data);
      setDishes((prev) => [...prev, newDish]);
    } catch (err) {
      console.error("Failed to add dish:", err);
      alert("Failed to add dish. Please try again.");
    }
  }

  async function handleUpdate(id, data) {
    try {
      const updated = await updateDish(id, data);
      setDishes((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      console.error("Failed to update dish:", err);
      alert("Failed to update dish. Please try again.");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDish(id);
      setDishes((prev) => prev.filter((d) => d.id !== id));
    } catch (err) {
      console.error("Failed to delete dish:", err);
      alert("Failed to delete dish. Please try again.");
    }
  }

  async function handleToggle(id) {
    const dish = dishes.find((d) => d.id === id);
    if (!dish) return;
    try {
      const updated = await updateDish(id, { available: !dish.available });
      setDishes((prev) => prev.map((d) => (d.id === id ? updated : d)));
    } catch (err) {
      console.error("Failed to toggle dish:", err);
      alert("Failed to update availability. Please try again.");
    }
  }

  // Global loading screen
  if (loading) {
    return (
      <div className="global-loading">
        <span className="loading-icon">🍽</span>
        <p>Loading menu...</p>
      </div>
    );
  }

  // Global error screen
  if (error) {
    return (
      <div className="global-error">
        <span>⚠️</span>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchDishes}>
          Retry
        </button>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route path="/" element={<Dashboard dishes={dishes} />} />
          <Route
            path="/menu"
            element={
              <Menu
                dishes={dishes}
                onDelete={handleDelete}
                onToggle={handleToggle}
              />
            }
          />
          <Route
            path="/add"
            element={
              <AddDish
                dishes={dishes}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
              />
            }
          />
          <Route
            path="/edit/:id"
            element={
              <AddDish
                dishes={dishes}
                onAdd={handleAdd}
                onUpdate={handleUpdate}
              />
            }
          />
          <Route path="/tables" element={<Tables />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
