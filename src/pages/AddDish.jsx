import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { CATEGORIES } from "../data/dishes";
import { getUploadUrl, uploadImageToS3 } from "../services/api";
const EMPTY_FORM = {
  name: "",
  description: "",
  category: CATEGORIES[0],
  price: "",
  available: true,
  imageUrl: "",
};

export default function AddDish({ dishes, onAdd, onUpdate }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(EMPTY_FORM);
  const [previewUrl, setPreviewUrl] = useState("");
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isEdit) {
      const dish = dishes.find((d) => d.id === id);
      if (dish) {
        setForm({
          name: dish.name,
          description: dish.description,
          category: dish.category,
          price: dish.price,
          available: dish.available,
          imageUrl: dish.imageUrl,
        });
        setPreviewUrl(dish.imageUrl);
      }
    }
  }, [id, dishes, isEdit]);

  function handleChange(e) {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    setErrors((prev) => ({ ...prev, [name]: "" }));
  }

  function handleImageFile(e) {
    const file = e.target.files[0];
    if (!file) return;
    const localUrl = URL.createObjectURL(file);
    setPreviewUrl(localUrl);
    setForm((prev) => ({ ...prev, imageUrl: localUrl }));
    setErrors((prev) => ({ ...prev, imageUrl: "" }));
  }

  function handleImageUrl(e) {
    const val = e.target.value;
    setForm((prev) => ({ ...prev, imageUrl: val }));
    setPreviewUrl(val);
    setErrors((prev) => ({ ...prev, imageUrl: "" }));
  }

  function validate() {
    const errs = {};
    if (!form.name.trim()) errs.name = "Dish name is required.";
    if (!form.description.trim()) errs.description = "Description is required.";
    if (!form.price || isNaN(form.price) || Number(form.price) <= 0)
      errs.price = "Enter a valid price.";
    if (!form.imageUrl.trim())
      errs.imageUrl = "Add an image URL or upload a file.";
    return errs;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }

    setSaving(true);
    try {
      let finalImageUrl = form.imageUrl;

      // If user uploaded a file (blob URL), upload it to S3 first
      if (previewUrl.startsWith("blob:")) {
        const fileInput = document.querySelector("input[type='file']");
        const file = fileInput?.files[0];

        if (file) {
          // Step 1: Get pre-signed URL from Lambda
          const { uploadUrl, imageUrl } = await getUploadUrl(
            file.name,
            file.type,
          );

          // Step 2: Upload file directly to S3
          await uploadImageToS3(uploadUrl, file);

          // Step 3: Use the permanent S3 URL
          finalImageUrl = imageUrl;
        }
      }

      const payload = {
        ...form,
        price: Number(form.price),
        imageUrl: finalImageUrl,
      };

      if (isEdit) {
        await onUpdate(id, payload);
      } else {
        await onAdd(payload);
      }

      navigate("/menu");
    } catch (err) {
      console.error("Submit error:", err);
      alert("Something went wrong. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="page">
      <div className="page-header">
        <div>
          <h1 className="page-title">
            {isEdit ? "Edit Dish" : "Add New Dish"}
          </h1>
          <p className="page-subtitle">
            {isEdit
              ? "Update the dish details below."
              : "Fill in the details to add a dish to your menu."}
          </p>
        </div>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>
          ← Back
        </button>
      </div>

      <div className="form-layout">
        <form className="dish-form" onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Dish Name *</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="e.g. Paneer Butter Masala"
              className={`form-input ${errors.name ? "input-error" : ""}`}
            />
            {errors.name && <span className="error-msg">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label">Description *</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              placeholder="Brief description of the dish…"
              rows={3}
              className={`form-input form-textarea ${errors.description ? "input-error" : ""}`}
            />
            {errors.description && (
              <span className="error-msg">{errors.description}</span>
            )}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Category *</label>
              <select
                name="category"
                value={form.category}
                onChange={handleChange}
                className="form-input"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Price (₹) *</label>
              <input
                type="number"
                name="price"
                value={form.price}
                onChange={handleChange}
                placeholder="0"
                min="0"
                className={`form-input ${errors.price ? "input-error" : ""}`}
              />
              {errors.price && (
                <span className="error-msg">{errors.price}</span>
              )}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Image</label>
            <div className="image-input-group">
              <input
                type="text"
                value={form.imageUrl.startsWith("blob:") ? "" : form.imageUrl}
                onChange={handleImageUrl}
                placeholder="Paste an image URL…"
                className={`form-input ${errors.imageUrl ? "input-error" : ""}`}
              />
              <span className="input-divider">or</span>
              <label className="btn btn-outline btn-file">
                Upload file
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageFile}
                  hidden
                />
              </label>
            </div>
            {errors.imageUrl && (
              <span className="error-msg">{errors.imageUrl}</span>
            )}
          </div>

          <div className="form-group">
            <label className="form-label checkbox-label">
              <input
                type="checkbox"
                name="available"
                checked={form.available}
                onChange={handleChange}
                className="form-checkbox"
              />
              <span>Mark as Available</span>
            </label>
            <p className="form-hint">
              Uncheck to hide this dish from the live menu.
            </p>
          </div>

          <div className="form-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate(-1)}
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary" disabled={saving}>
              {saving ? "Saving…" : isEdit ? "Save Changes" : "Add Dish"}
            </button>
          </div>
        </form>

        <div className="preview-panel">
          <h3 className="preview-title">Preview</h3>
          <div className="preview-card">
            <div className="preview-img-wrap">
              {previewUrl ? (
                <img
                  src={previewUrl}
                  alt="preview"
                  className="preview-img"
                  onError={() => setPreviewUrl("")}
                />
              ) : (
                <div className="preview-placeholder">
                  <span>🖼</span>
                  <span>Image preview</span>
                </div>
              )}
              {form.available !== undefined && (
                <span
                  className={`badge badge-float ${form.available ? "badge-available" : "badge-unavailable"}`}
                >
                  {form.available ? "Available" : "Unavailable"}
                </span>
              )}
            </div>
            <div className="preview-body">
              <span className="preview-category">{form.category}</span>
              <h4 className="preview-name">{form.name || "Dish Name"}</h4>
              <p className="preview-desc">
                {form.description || "Description will appear here."}
              </p>
              <span className="preview-price">
                {form.price ? `₹${form.price}` : "₹0"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
