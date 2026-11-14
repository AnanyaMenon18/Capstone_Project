
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./OwnerDashboard.css";
import "./OwnerMenu.css";

function OwnerMenu() {
    const navigate = useNavigate();

    const [restaurants, setRestaurants] = useState([]);
    const [selectedRestaurant, setSelectedRestaurant] = useState("");
    const [menuItems, setMenuItems] = useState([]);

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [updatingItemId, setUpdatingItemId] = useState(null);

    const [searchTerm, setSearchTerm] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("all");
    const [availabilityFilter, setAvailabilityFilter] = useState("all");

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");
    const [editingItem, setEditingItem] = useState(null);

    const [formData, setFormData] = useState({
        item_name: "",
        description: "",
        price: "",
        category: "",
        is_available: true
    });

    const getHeaders = () => ({
        Authorization: `Bearer ${localStorage.getItem("access_token")}`
    });

    // Fetch owner's restaurants
    const fetchRestaurants = async () => {
        try {
            setLoading(true);
            setError("");

            const response = await API.get(
                "/owner/restaurants",
                { headers: getHeaders() }
            );

            setRestaurants(response.data);

            if (response.data.length > 0) {
                setSelectedRestaurant(
                    String(response.data[0].restaurant_id)
                );
            } else {
                setMenuItems([]);
                setError("You have not created a restaurant yet.");
            }
        } catch (err) {
            console.error("Restaurant fetch error:", err);
            setError(
                err.response?.data?.detail ||
                "Unable to load your restaurant."
            );
        } finally {
            setLoading(false);
        }
    };

    // Fetch selected restaurant's menu
    const fetchMenuItems = async () => {
        if (!selectedRestaurant) return;

        try {
            setLoading(true);
            setError("");

            const response = await API.get(
                `/restaurants/${selectedRestaurant}/menu`,
                { headers: getHeaders() }
            );

            setMenuItems(response.data);
        } catch (err) {
            console.error("Menu fetch error:", err);
            setError(
                err.response?.data?.detail ||
                "Unable to load menu items."
            );
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRestaurants();
    }, []);

    useEffect(() => {
        if (selectedRestaurant) {
            fetchMenuItems();
        }
    }, [selectedRestaurant]);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    // Form changes
    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;

        setFormData(prev => ({
            ...prev,
            [name]: type === "checkbox" ? checked : value
        }));
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            item_name: "",
            description: "",
            price: "",
            category: "",
            is_available: true
        });

        setEditingItem(null);
    };

    // Add or update dish
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        if (!selectedRestaurant) {
            setError("Please select a restaurant.");
            return;
        }

        if (!formData.item_name.trim()) {
            setError("Please enter a dish name.");
            return;
        }

        const price = Number(formData.price);

        if (!Number.isFinite(price) || price <= 0) {
            setError("Please enter a valid price greater than zero.");
            return;
        }

        const payload = {
            item_name: formData.item_name.trim(),
            description: formData.description.trim() || null,
            price,
            category: formData.category.trim() || null,
            is_available: formData.is_available
        };

        try {
            setSaving(true);

            if (editingItem) {
                await API.patch(
                    `/menu-items/${editingItem.item_id}`,
                    payload,
                    { headers: getHeaders() }
                );

                setMessage("Menu item updated successfully!");
            } else {
                await API.post(
                    "/menu-items/",
                    {
                        restaurant_id: Number(selectedRestaurant),
                        ...payload
                    },
                    { headers: getHeaders() }
                );

                setMessage("New menu item added successfully!");
            }

            resetForm();
            await fetchMenuItems();

        } catch (err) {
            console.error("Menu save error:", err);
            setError(
                err.response?.data?.detail ||
                "Unable to save menu item."
            );
        } finally {
            setSaving(false);
        }
    };

    // Edit dish
    const handleEdit = (item) => {
        setEditingItem(item);

        setFormData({
            item_name: item.item_name || "",
            description: item.description || "",
            price: item.price ?? "",
            category: item.category || "",
            is_available: item.is_available ?? true
        });

        setMessage("");
        setError("");

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // Change availability
    const handleAvailability = async (item) => {
        setMessage("");
        setError("");
        setUpdatingItemId(item.item_id);

        try {
            await API.patch(
                `/menu-items/${item.item_id}`,
                { is_available: !item.is_available },
                { headers: getHeaders() }
            );

            setMessage(
                `${item.item_name} is now ${item.is_available ? "unavailable" : "available"
                }.`
            );

            await fetchMenuItems();
        } catch (err) {
            console.error("Availability update error:", err);
            setError(
                err.response?.data?.detail ||
                "Unable to update availability."
            );
        } finally {
            setUpdatingItemId(null);
        }
    };

    // Remove dish from active menu safely
    const handleRemove = async (item) => {
        const confirmed = window.confirm(
            `Remove "${item.item_name}" from the active menu?`
        );

        if (!confirmed) return;

        setMessage("");
        setError("");
        setUpdatingItemId(item.item_id);

        try {
            await API.patch(
                `/menu-items/${item.item_id}`,
                { is_available: false },
                { headers: getHeaders() }
            );

            setMessage(
                `${item.item_name} has been removed from the active menu.`
            );

            await fetchMenuItems();
        } catch (err) {
            console.error("Remove item error:", err);
            setError(
                err.response?.data?.detail ||
                "Unable to remove menu item."
            );
        } finally {
            setUpdatingItemId(null);
        }
    };

    // Statistics
    const availableCount = menuItems.filter(
        item => item.is_available
    ).length;

    const unavailableCount = menuItems.length - availableCount;

    // Categories
    const categories = [
        ...new Set(
            menuItems.map(item => item.category || "General")
        )
    ].sort();

    // Search and filters
    const filteredMenuItems = menuItems.filter(item => {
        const query = searchTerm.trim().toLowerCase();

        const matchesSearch =
            !query ||
            (item.item_name || "").toLowerCase().includes(query) ||
            (item.category || "").toLowerCase().includes(query) ||
            (item.description || "").toLowerCase().includes(query);

        const matchesCategory =
            categoryFilter === "all" ||
            (item.category || "General") === categoryFilter;

        const matchesAvailability =
            availabilityFilter === "all" ||
            (availabilityFilter === "available" && item.is_available) ||
            (availabilityFilter === "unavailable" && !item.is_available);

        return (
            matchesSearch &&
            matchesCategory &&
            matchesAvailability
        );
    });

    const clearFilters = () => {
        setSearchTerm("");
        setCategoryFilter("all");
        setAvailabilityFilter("all");
    };

    return (
        <div className="owner-dashboard owner-menu-page">

            {/* Navigation */}
            <nav className="owner-navbar">
                <h2>
                    Campus<span>Bite</span>
                </h2>

                <div className="owner-nav-links">
                    <Link to="/owner-dashboard">Dashboard</Link>
                    <Link to="/owner-orders">Orders</Link>

                    <Link
                        to="/owner-menu"
                        className="owner-active-link"
                    >
                        Menu
                    </Link>

                    <Link to="/owner-returns">
                        Return Requests
                    </Link>
                </div>

                <button
                    className="owner-logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </nav>

            {/* Hero section */}
            <section className="owner-welcome owner-menu-hero">
                <div>
                    <span className="owner-tag">
                        RESTAURANT MANAGEMENT
                    </span>

                    <h1>Menu Management</h1>

                    <p>
                        Manage your dishes, prices and availability
                        all in one place.
                    </p>
                </div>

                <div className="owner-welcome-emoji">
                    🍽️
                </div>
            </section>

            {/* Restaurant selection and refresh */}
            <div className="owner-section-heading owner-menu-toolbar">
                <div>
                    <h2>Your Restaurant Menu</h2>
                    <p>Manage the dishes offered by your restaurant.</p>
                </div>

                <button
                    className="owner-refresh-button"
                    onClick={fetchMenuItems}
                    disabled={!selectedRestaurant || loading}
                >
                    ↻ {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {restaurants.length > 0 && (
                <div className="owner-menu-restaurant">
                    <label>Select Restaurant</label>

                    <select
                        value={selectedRestaurant}
                        onChange={(e) => {
                            setSelectedRestaurant(e.target.value);
                            resetForm();
                            clearFilters();
                            setMessage("");
                            setError("");
                        }}
                    >
                        {restaurants.map(restaurant => (
                            <option
                                key={restaurant.restaurant_id}
                                value={restaurant.restaurant_id}
                            >
                                {restaurant.restaurant_name}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {message && (
                <div className="owner-menu-success">
                    {message}
                </div>
            )}

            {error && (
                <div className="owner-error owner-menu-error">
                    {error}
                </div>
            )}

            {loading && restaurants.length === 0 ? (
                <p className="owner-message">
                    Loading your restaurant...
                </p>
            ) : restaurants.length > 0 && (
                <>
                    {/* Statistics */}
                    <div className="owner-stats">
                        <div className="owner-stat-card">
                            <h3>{menuItems.length}</h3>
                            <p>Total Menu Items</p>
                        </div>

                        <div className="owner-stat-card">
                            <h3>{availableCount}</h3>
                            <p>Available</p>
                        </div>

                        <div className="owner-stat-card">
                            <h3>{unavailableCount}</h3>
                            <p>Unavailable</p>
                        </div>

                        <div className="owner-stat-card">
                            <h3>{categories.length}</h3>
                            <p>Categories</p>
                        </div>
                    </div>

                    {/* Add / Edit form */}
                    <section className="owner-menu-panel">
                        <div className="owner-section-heading">
                            <div>
                                <h2>
                                    {editingItem
                                        ? "Edit Menu Item"
                                        : "Add New Dish"}
                                </h2>

                                <p>
                                    Enter the details of your menu item.
                                </p>
                            </div>
                        </div>

                        <form onSubmit={handleSubmit}>
                            <div className="owner-menu-form-grid">
                                <div className="owner-menu-field">
                                    <label>Dish Name *</label>
                                    <input
                                        type="text"
                                        name="item_name"
                                        placeholder="e.g. Paneer Tikka"
                                        value={formData.item_name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="owner-menu-field">
                                    <label>Category</label>
                                    <input
                                        type="text"
                                        name="category"
                                        placeholder="e.g. Indian"
                                        value={formData.category}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="owner-menu-field">
                                    <label>Price (₹) *</label>
                                    <input
                                        type="number"
                                        name="price"
                                        min="0.01"
                                        step="0.01"
                                        placeholder="Enter price"
                                        value={formData.price}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div className="owner-menu-field">
                                    <label>Availability</label>
                                    <select
                                        value={String(formData.is_available)}
                                        onChange={e =>
                                            setFormData(prev => ({
                                                ...prev,
                                                is_available:
                                                    e.target.value === "true"
                                            }))
                                        }
                                    >
                                        <option value="true">Available</option>
                                        <option value="false">Unavailable</option>
                                    </select>
                                </div>

                                <div className="owner-menu-field owner-menu-full">
                                    <label>Description</label>
                                    <textarea
                                        name="description"
                                        rows="3"
                                        placeholder="Describe your dish..."
                                        value={formData.description}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>

                            <div className="owner-menu-form-actions">
                                <button
                                    type="submit"
                                    className="owner-primary-button"
                                    disabled={saving}
                                >
                                    {saving
                                        ? "Saving..."
                                        : editingItem
                                            ? "Update Dish"
                                            : "+ Add Dish"}
                                </button>

                                {editingItem && (
                                    <button
                                        type="button"
                                        className="owner-menu-cancel-button"
                                        onClick={resetForm}
                                    >
                                        Cancel Edit
                                    </button>
                                )}
                            </div>
                        </form>
                    </section>

                    {/* Menu list */}
                    <section className="owner-menu-panel">
                        <div className="owner-section-heading">
                            <div>
                                <h2>All Menu Items</h2>
                                <p>
                                    Search, filter and manage your dishes.
                                </p>
                            </div>
                        </div>

                        {/* Search and filters */}
                        <div className="owner-menu-filters">
                            <input
                                type="search"
                                placeholder="Search dishes..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />

                            <select
                                value={categoryFilter}
                                onChange={e =>
                                    setCategoryFilter(e.target.value)
                                }
                            >
                                <option value="all">All Categories</option>
                                {categories.map(category => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>

                            <select
                                value={availabilityFilter}
                                onChange={e =>
                                    setAvailabilityFilter(e.target.value)
                                }
                            >
                                <option value="all">All Items</option>
                                <option value="available">Available</option>
                                <option value="unavailable">Unavailable</option>
                            </select>

                            <button
                                type="button"
                                className="owner-menu-clear-button"
                                onClick={clearFilters}
                            >
                                Clear
                            </button>
                        </div>

                        {loading ? (
                            <p className="owner-message">
                                Loading menu items...
                            </p>
                        ) : menuItems.length === 0 ? (
                            <div className="owner-menu-empty">
                                <h3>No menu items yet</h3>
                                <p>
                                    Add your first dish using the form above.
                                </p>
                            </div>
                        ) : filteredMenuItems.length === 0 ? (
                            <div className="owner-menu-empty">
                                <h3>No matching dishes found</h3>
                                <p>
                                    Try changing your search or filters.
                                </p>
                                <button
                                    type="button"
                                    onClick={clearFilters}
                                >
                                    Clear Filters
                                </button>
                            </div>
                        ) : (
                            <div className="owner-menu-grid">
                                {filteredMenuItems.map(item => (
                                    <article
                                        className="owner-menu-item-card"
                                        key={item.item_id}
                                    >
                                        <div className="owner-menu-item-top">
                                            <div>
                                                <span className="owner-menu-category">
                                                    {item.category || "General"}
                                                </span>

                                                <h3>{item.item_name}</h3>
                                            </div>

                                            <span
                                                className={
                                                    item.is_available
                                                        ? "owner-menu-status available"
                                                        : "owner-menu-status unavailable"
                                                }
                                            >
                                                {item.is_available
                                                    ? "Available"
                                                    : "Unavailable"}
                                            </span>
                                        </div>

                                        <p className="owner-menu-description">
                                            {item.description ||
                                                "No description provided."}
                                        </p>

                                        <h2 className="owner-menu-price">
                                            ₹{Number(item.price).toFixed(2)}
                                        </h2>

                                        <div className="owner-menu-item-actions">
                                            <button
                                                type="button"
                                                onClick={() => handleEdit(item)}
                                                disabled={updatingItemId === item.item_id}
                                            >
                                                Edit
                                            </button>

                                            <button
                                                type="button"
                                                onClick={() => handleAvailability(item)}
                                                disabled={updatingItemId === item.item_id}
                                            >
                                                {updatingItemId === item.item_id
                                                    ? "Updating..."
                                                    : item.is_available
                                                        ? "Mark Unavailable"
                                                        : "Mark Available"}
                                            </button>

                                            {item.is_available && (
                                                <button
                                                    type="button"
                                                    className="owner-menu-remove-button"
                                                    onClick={() => handleRemove(item)}
                                                    disabled={updatingItemId === item.item_id}
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}

            {/* Footer */}
            <footer className="owner-footer">
                <h2>
                    Campus<span>Bite</span>
                </h2>
                <p>
                    Good food. Good mood. Made for campus food lovers.
                </p>
            </footer>
        </div>
    );
}

export default OwnerMenu;
