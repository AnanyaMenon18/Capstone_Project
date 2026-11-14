
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./OwnerDashboard.css";

function OwnerDashboard() {
    const [orders, setOrders] = useState([]);
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [restaurants, setRestaurants] = useState([]);
    const [showRestaurantForm, setShowRestaurantForm] = useState(false);
    const [restaurantName, setRestaurantName] = useState("");
    const [restaurantAddress, setRestaurantAddress] = useState("");
    const [restaurantCuisine, setRestaurantCuisine] = useState("");
    const [restaurantRating, setRestaurantRating] = useState("0");
    const [restaurantMessage, setRestaurantMessage] = useState("");

    const navigate = useNavigate();

    const fetchDashboardData = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Session expired. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const headers = {
                Authorization: `Bearer ${token}`
            };

            const [ordersResponse, returnsResponse] = await Promise.all([
                API.get("/owner/orders", { headers }),
                API.get("/owner/returns", { headers })
            ]);

            setOrders(ordersResponse.data);
            setReturns(returnsResponse.data);

        } catch (err) {
            console.error("Dashboard error:", err.response?.data || err);
            setError(
                typeof err.response?.data?.detail === "string"
                    ? err.response.data.detail
                    : err.message || "Unable to load dashboard."
            );
        } finally {
            setLoading(false);
        }
    };
    const handleCreateRestaurant = async (e) => {
        e.preventDefault();

        const token = localStorage.getItem("access_token");

        if (!token) {
            setRestaurantMessage("Please log in again.");
            return;
        }

        try {
            setRestaurantMessage("Creating restaurant...");

            const response = await API.post(
                "/restaurants/",
                {
                    restaurant_name: restaurantName,
                    address: restaurantAddress,
                    cuisine: restaurantCuisine,
                    rating: Number(restaurantRating)
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setRestaurants(prev => [...prev, response.data]);

            setRestaurantMessage("Restaurant created successfully!");

            setRestaurantName("");
            setRestaurantAddress("");
            setRestaurantCuisine("");
            setRestaurantRating("0");

            setShowRestaurantForm(false);

        } catch (err) {
            console.error("Create restaurant error:", err.response?.data || err);

            setRestaurantMessage(
                typeof err.response?.data?.detail === "string"
                    ? err.response.data.detail
                    : "Unable to create restaurant."
            );
        }
    };

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    const pendingReturns = returns.filter(
        item => item.request_status?.toUpperCase() === "PENDING"
    ).length;

    return (
        <div className="owner-dashboard">

            {/* Navigation */}
            <nav className="owner-navbar">
                <h2>
                    Campus<span>Bite</span>
                </h2>

                <div className="owner-nav-links">
                    <Link to="/owner-dashboard">Dashboard</Link>
                    <Link to="/owner-orders">Orders</Link>
                    <Link to="/owner-menu">Menu</Link>
                    <Link to="/owner-returns">Return Requests</Link>
                    <button
                        type="button"
                        onClick={() => window.location.href = "/profile"}
                        style={{
                            background: "transparent",
                            border: "none",
                            font: "inherit",
                            cursor: "pointer",
                            color: "inherit"
                        }}
                    >
                        Profile
                    </button>
                </div>

                <button
                    className="owner-logout-button"
                    onClick={handleLogout}
                >
                    Logout
                </button>
            </nav>

            {/* Welcome */}
            <section className="owner-welcome">
                <div>
                    <span className="owner-tag">
                        RESTAURANT MANAGEMENT
                    </span>

                    <h1>Welcome, Restaurant Owner!</h1>

                    <p>
                        Manage your restaurant, orders and customer requests
                        from one place.
                    </p>
                </div>

                <div className="owner-welcome-emoji">
                    🍽️
                </div>
            </section>

            {/* Dashboard */}
            <section className="owner-section-heading">
                <div>
                    <h2>Dashboard Overview</h2>
                    <p>Here's what's happening at your restaurant.</p>
                </div>

                <button
                    className="owner-refresh-button"
                    onClick={fetchDashboardData}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>
            </section>

            {loading ? (
                <p className="owner-message">Loading dashboard...</p>
            ) : error ? (
                <p className="owner-error">{error}</p>
            ) : (
                <>
                    {/* Statistics */}
                    <div className="owner-stats">

                        <div className="owner-stat-card">
                            <h3>{orders.length}</h3>
                            <p>Total Orders</p>
                        </div>

                        <div className="owner-stat-card">
                            <h3>
                                {orders.filter(
                                    order => order.order_status === "PLACED"
                                ).length}
                            </h3>
                            <p>New Orders</p>
                        </div>

                        <div className="owner-stat-card">
                            <h3>
                                {orders.filter(
                                    order => order.order_status === "PREPARING"
                                ).length}
                            </h3>
                            <p>Preparing</p>
                        </div>

                        <div className="owner-stat-card">
                            <h3>{pendingReturns}</h3>
                            <p>Pending Returns</p>
                        </div>

                    </div>

                    {/* Quick Navigation */}
                    <section className="owner-orders-section">
                        <h2>Manage Your Restaurant</h2>

                        <div className="owner-orders-grid">

                            {/* Menu Management */}
                            <div className="owner-order-card">
                                <h3>🍽️ Menu Management</h3>
                                <p>
                                    Add new dishes, edit prices,
                                    manage menu items and update availability.
                                </p>

                                <button
                                    className="owner-refresh-button"
                                    onClick={() => navigate("/owner-menu")}
                                >
                                    Manage Menu →
                                </button>
                            </div>

                            {/* Order Management */}
                            <div className="owner-order-card">
                                <h3>📦 Order Management</h3>
                                <p>
                                    View incoming orders, customer details
                                    and update order statuses.
                                </p>

                                <button
                                    className="owner-refresh-button"
                                    onClick={() => navigate("/owner-orders")}
                                >
                                    Manage Orders →
                                </button>
                            </div>

                            {/* Return Requests */}
                            <div className="owner-order-card">
                                <h3>↩️ Return Requests</h3>
                                <p>
                                    Review customer return requests and
                                    approve or reject them.
                                </p>

                                <button
                                    className="owner-refresh-button"
                                    onClick={() => navigate("/owner-returns")}
                                >
                                    View Requests →
                                </button>
                            </div>

                        </div>
                    </section>
                </>
            )}
            {/* Create Restaurant Section */}
            <div className="owner-section">
                <h2>My Restaurants</h2>

                <button
                    className="owner-button"
                    onClick={() => {
                        setShowRestaurantForm(!showRestaurantForm);
                        setRestaurantMessage("");
                    }}
                >
                    {showRestaurantForm ? "Cancel" : "+ Create Restaurant"}
                </button>

                {showRestaurantForm && (
                    <form
                        className="restaurant-form"
                        onSubmit={handleCreateRestaurant}
                    >
                        <input
                            type="text"
                            placeholder="Restaurant Name"
                            value={restaurantName}
                            onChange={(e) => setRestaurantName(e.target.value)}
                            required
                        />

                        <input
                            type="text"
                            placeholder="Restaurant Address"
                            value={restaurantAddress}
                            onChange={(e) => setRestaurantAddress(e.target.value)}
                            required
                        />

                        <input
                            type="text"
                            placeholder="Cuisine (e.g. Indian, Chinese)"
                            value={restaurantCuisine}
                            onChange={(e) => setRestaurantCuisine(e.target.value)}
                            required
                        />

                        <input
                            type="number"
                            placeholder="Rating"
                            min="0"
                            max="5"
                            step="0.1"
                            value={restaurantRating}
                            onChange={(e) => setRestaurantRating(e.target.value)}
                        />

                        <button type="submit" className="owner-button">
                            Submit Restaurant
                        </button>
                    </form>
                )}

                {restaurantMessage && (
                    <p className="owner-message">{restaurantMessage}</p>
                )}

                {restaurants.map((restaurant) => (
                    <div key={restaurant.restaurant_id} className="restaurant-card">
                        <h3>{restaurant.restaurant_name}</h3>
                        <p>{restaurant.address}</p>
                        <p>{restaurant.cuisine}</p>
                    </div>
                ))}
            </div>
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

export default OwnerDashboard;
