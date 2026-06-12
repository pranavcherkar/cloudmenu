import axios from "axios";

// Reads from .env file
const BASE_URL = import.meta.env.VITE_API_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// ── Dish CRUD ──────────────────────────────────────────────────

export async function getDishes() {
  const response = await api.get("/dishes");
  return response.data;
}

export async function addDish(dishData) {
  const response = await api.post("/dishes", dishData);
  return response.data;
}

export async function updateDish(id, dishData) {
  const response = await api.put(`/dishes/${id}`, dishData);
  return response.data;
}

export async function deleteDish(id) {
  const response = await api.delete(`/dishes/${id}`);
  return response.data;
}

// ── Image Upload ───────────────────────────────────────────────

export async function getUploadUrl(fileName, contentType) {
  const response = await api.post("/upload-url", { fileName, contentType });
  return response.data; // { uploadUrl, imageUrl }
}

export async function uploadImageToS3(uploadUrl, file) {
  // Direct upload to S3 — bypasses our API
  await axios.put(uploadUrl, file, {
    headers: { "Content-Type": file.type },
  });
}

// ── Table Management ───────────────────────────────────────────

export async function getTables() {
  const response = await api.get("/tables");
  return response.data;
}

export async function addTable(tableData) {
  const response = await api.post("/tables", tableData);
  return response.data;
}

export async function updateTableStatus(id, status) {
  const response = await api.put(`/tables/${id}`, { status });
  return response.data;
}

export async function removeTable(id) {
  const response = await api.delete(`/tables/${id}`);
  return response.data;
}
