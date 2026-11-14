
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./DeliveryDashboard.css";

function DeliveryOrders() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingOrder, setUpdatingOrder] = useState(null);

    const navigate = useNavigate();

    // Allowed delivery status transitions
    const statusOptions = {
        READY: ["PICKED_UP"],
        PICKED_UP: ["OUT_FOR_DELIVERY"],
        OUT_FOR_DELIVERY: ["DELIVERED"],
        DELIVERED: []
    };

    // Fetch assigned orders
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
                "Delivery orders error:",
                err.response?.data || err
            );

            const detail = err.response?.data?.detail;

            setError(
                typeof detail === "string"
                    ? detail
                    : "Unable to load assigned orders."
            );

        } finally {
            setLoading(false);
        }
    };

    // Update delivery status
    const handleStatusUpdate = async (orderId, newStatus) => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please log in again.");
            return;
        }

        const order = orders.find(
            item => item.order_id === orderId
        );

        if (!order) {
            alert("Order not found.");
            return;
        }

        const allowedStatuses =
            statusOptions[order.order_status] || [];

        if (!allowedStatuses.includes(newStatus)) {
            alert("Invalid delivery status transition.");
            return;
        }

        try {
            setUpdatingOrder(orderId);

            await API.patch(
                `/delivery/orders/${orderId}/status`,
                {
                    order_status: newStatus
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert("Delivery status updated successfully!");

            await fetchOrders();

        } catch (err) {
            console.error(
                "Delivery status error:",
                err.response?.data || err
            );

            const detail = err.response?.data?.detail;

            alert(
                typeof detail === "string"
                    ? detail
                    : "Unable to update delivery status."
            );

        } finally {
            setUpdatingOrder(null);
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

                    <Link to="/delivery-dashboard">
                        Dashboard
                    </Link>

                    <Link
                        to="/delivery-orders"
                        style={{
                            color: "#F47721",
                            fontWeight: "bold"
                        }}
                    >
                        My Deliveries
                    </Link>

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

                    <h1>My Deliveries</h1>

                    <p>
                        View assigned orders and update their
                        delivery progress.
                    </p>

                </div>

                <div className="delivery-emoji">
                    🛵
                </div>

            </section>

            {/* Page Heading */}
            <div className="delivery-section-heading">

                <div>
                    <h2>Assigned Orders</h2>

                    <p>
                        Manage your current and completed deliveries.
                    </p>
                </div>

                <button
                    onClick={fetchOrders}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>

            </div>

            {/* Statistics */}
            {!loading && !error && (

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

            )}

            {/* Orders */}
            <section className="delivery-orders-section">

                {loading ? (

                    <p>Loading assigned orders...</p>

                ) : error ? (

                    <p className="delivery-error">
                        {error}
                    </p>

                ) : orders.length === 0 ? (

                    <p className="delivery-empty">
                        No orders assigned to you yet.
                    </p>

                ) : (

                    <div className="delivery-orders-grid">

                        {orders.map(order => {

                            const nextStatuses =
                                statusOptions[order.order_status] || [];

                            return (

                                <div
                                    className="delivery-order-card"
                                    key={order.order_id}
                                >

                                    {/* Order Header */}
                                    <div className="delivery-order-header">

                                        <h3>
                                            Order #{order.order_id}
                                        </h3>

                                        <span className="delivery-status">
                                            {order.order_status}
                                        </span>

                                    </div>

                                    {/* Order Information */}
                                    <div className="delivery-order-info">

                                        <p>
                                            <strong>Customer ID:</strong>{" "}
                                            {order.customer_id}
                                        </p>

                                        <p>
                                            <strong>Delivery Address:</strong>{" "}
                                            {order.delivery_address ||
                                                "Not available"}
                                        </p>

                                        <p>
                                            <strong>Phone:</strong>{" "}
                                            {order.delivery_phone ||
                                                "Not available"}
                                        </p>

                                        <p>
                                            <strong>Order Date:</strong>{" "}
                                            {order.order_date
                                                ? new Date(
                                                    order.order_date
                                                ).toLocaleString()
                                                : "Not available"}
                                        </p>

                                        <h3>
                                            Total: ₹
                                            {Number(
                                                order.total_amount
                                            ).toFixed(2)}
                                        </h3>

                                    </div>

                                    {/* Status Update */}
                                    <div className="delivery-status-update">

                                        <label>
                                            Update Delivery Status
                                        </label>

                                        {nextStatuses.length > 0 ? (

                                            <select
                                                value=""
                                                onChange={(e) => {
                                                    if (e.target.value) {
                                                        handleStatusUpdate(
                                                            order.order_id,
                                                            e.target.value
                                                        );
                                                    }
                                                }}
                                                disabled={
                                                    updatingOrder ===
                                                    order.order_id
                                                }
                                            >

                                                <option value="" disabled>
                                                    Select next status
                                                </option>

                                                {nextStatuses.map(status => (

                                                    <option
                                                        key={status}
                                                        value={status}
                                                    >
                                                        {status}
                                                    </option>

                                                ))}

                                            </select>

                                        ) : (

                                            <p>
                                                Delivery completed.
                                            </p>

                                        )}

                                        {updatingOrder === order.order_id && (
                                            <small>
                                                Updating...
                                            </small>
                                        )}

                                    </div>

                                </div>

                            );

                        })}

                    </div>

                )}

            </section>

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

export default DeliveryOrders;
