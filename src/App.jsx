import { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Dashboard from "./pages/Dashboard";
import Menu from "./pages/Menu";
import AddDish from "./pages/AddDish";
import Tables from "./pages/Tables";
import Inventory from "./pages/Inventory";
import {
  getDishes,
  addDish,
  updateDish,
  deleteDish,
  getInventory,
} from "./services/api";

import "./App.css";

export default function App() {
  const [dishes, setDishes] = useState([]);
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      setError("");

      const [dishesData, inventoryData] = await Promise.all([
        getDishes(),
        getInventory(),
      ]);

      setDishes(dishesData);
      setInventory(inventoryData);
    } catch (err) {
      console.error("Failed to fetch data:", err);
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
      const updatedDish = await updateDish(id, data);
      setDishes((prev) =>
        prev.map((dish) => (dish.id === id ? updatedDish : dish)),
      );
    } catch (err) {
      console.error("Failed to update dish:", err);
      alert("Failed to update dish. Please try again.");
    }
  }

  async function handleDelete(id) {
    try {
      await deleteDish(id);
      setDishes((prev) => prev.filter((dish) => dish.id !== id));
    } catch (err) {
      console.error("Failed to delete dish:", err);
      alert("Failed to delete dish. Please try again.");
    }
  }

  async function handleToggle(id) {
    const dish = dishes.find((d) => d.id === id);
    if (!dish) return;

    try {
      const updatedDish = await updateDish(id, {
        ...dish,
        available: !dish.available,
      });

      setDishes((prev) => prev.map((d) => (d.id === id ? updatedDish : d)));
    } catch (err) {
      console.error("Failed to toggle dish:", err);
      alert("Failed to update availability. Please try again.");
    }
  }

  if (loading) {
    return (
      <div className="global-loading">
        <span className="loading-icon">🍽</span>
        <p>Loading menu...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="global-error">
        <span>⚠️</span>
        <p>{error}</p>
        <button className="btn btn-primary" onClick={fetchData}>
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
          <Route
            path="/"
            element={<Dashboard dishes={dishes} inventory={inventory} />}
          />
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
          <Route
            path="/inventory"
            element={<Inventory inventory={inventory} />}
          />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
