
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./DeliveryDashboard.css";

function DeliveryDashboard() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    const navigate = useNavigate();

    // Fetch assigned orders for dashboard statistics
    const fetchOrders = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await API.get(
                "/delivery/my-orders",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setOrders(response.data);

        } catch (err) {
            console.error(
                "Delivery dashboard error:",
                err.response?.data || err
            );

            const detail = err.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to load delivery dashboard."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchOrders();
    }, []);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    const readyOrders = orders.filter(
        order => order.order_status === "READY"
    ).length;

    const activeOrders = orders.filter(
        order =>
            order.order_status === "PICKED_UP" ||
            order.order_status === "OUT_FOR_DELIVERY"
    ).length;

    const deliveredOrders = orders.filter(
        order => order.order_status === "DELIVERED"
    ).length;

    return (
        <div className="delivery-dashboard">

            {/* Navigation */}
            <nav className="delivery-navbar">

                <h2>
                    Campus<span>Bite</span>
                </h2>

                <div className="delivery-nav-links">

                    <span
                        onClick={() => window.location.href = "/delivery-dashboard"}
                        style={{ cursor: "pointer" }}
                    >
                        Dashboard
                    </span>

                    <span
                        onClick={() => window.location.href = "/delivery-orders"}
                        style={{ cursor: "pointer" }}
                    >
                        My Deliveries
                    </span>

                    <span
                        onClick={() => window.location.href = "/profile"}
                        style={{ cursor: "pointer" }}
                    >
                        Profile
                    </span>

                </div>
                <button
                    onClick={handleLogout}
                    className="delivery-logout-button"
                >
                    Logout
                </button>

            </nav>

            {/* Welcome Section */}
            <section className="delivery-welcome">

                <div>

                    <span className="delivery-tag">
                        DELIVERY PARTNER PORTAL
                    </span>

                    <h1>Welcome, Delivery Partner!</h1>

                    <p>
                        Track your assigned deliveries and keep
                        customers updated on their orders.
                    </p>

                </div>

                <div className="delivery-emoji">
                    🛵
                </div>

            </section>

            {/* Dashboard Heading */}
            <div className="delivery-section-heading">

                <div>
                    <h2>Dashboard Overview</h2>

                    <p>
                        Here's an overview of your delivery activity.
                    </p>
                </div>

                <button
                    onClick={fetchOrders}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>

            </div>

            {loading ? (

                <p>Loading dashboard...</p>

            ) : error ? (

                <p className="delivery-error">{error}</p>

            ) : (

                <>
                    {/* Statistics */}
                    <section className="delivery-stats">

                        <div className="delivery-stat-card">
                            <h3>{orders.length}</h3>
                            <p>Assigned Orders</p>
                        </div>

                        <div className="delivery-stat-card">
                            <h3>{readyOrders}</h3>
                            <p>Ready for Pickup</p>
                        </div>

                        <div className="delivery-stat-card">
                            <h3>{activeOrders}</h3>
                            <p>Active Deliveries</p>
                        </div>

                        <div className="delivery-stat-card">
                            <h3>{deliveredOrders}</h3>
                            <p>Delivered</p>
                        </div>

                    </section>

                    {/* Quick Navigation */}
                    <section className="delivery-orders-section">

                        <div className="delivery-section-heading">
                            <div>
                                <h2>Manage Your Deliveries</h2>

                                <p>
                                    View assigned orders and update
                                    delivery progress.
                                </p>
                            </div>
                        </div>

                        <div className="delivery-orders-grid">

                            <div className="delivery-order-card">

                                <div className="delivery-order-header">
                                    <h3>📦 My Deliveries</h3>
                                </div>

                                <div className="delivery-order-info">
                                    <p>
                                        View all your assigned orders,
                                        customer contact details and
                                        delivery addresses.
                                    </p>

                                    <h3>
                                        {orders.length} Assigned Orders
                                    </h3>
                                </div>

                                <button
                                    className="delivery-logout-button"
                                    onClick={() =>
                                        navigate("/delivery-orders")
                                    }
                                >
                                    View Deliveries →
                                </button>

                            </div>

                            <div className="delivery-order-card">

                                <div className="delivery-order-header">
                                    <h3>🚚 Delivery Progress</h3>
                                </div>

                                <div className="delivery-order-info">
                                    <p>
                                        Keep customers informed by
                                        updating pickup, transit and
                                        delivery statuses.
                                    </p>

                                    <h3>
                                        {activeOrders} Active Deliveries
                                    </h3>
                                </div>

                                <button
                                    className="delivery-logout-button"
                                    onClick={() =>
                                        navigate("/delivery-orders")
                                    }
                                >
                                    Manage Status →
                                </button>

                            </div>

                        </div>

                    </section>
                </>
            )}

            {/* Footer */}
            <footer className="delivery-footer">

                <h2>
                    Campus<span>Bite</span>
                </h2>

                <p>
                    Delivering happiness, one order at a time.
                </p>

            </footer>

        </div>
    );
}

export default DeliveryDashboard;
