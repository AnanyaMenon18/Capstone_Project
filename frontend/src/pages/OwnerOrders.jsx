
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import API from "../services/api";
import "./OwnerDashboard.css";

function OwnerOrders() {
    const [orders, setOrders] = useState([]);
    const [deliveryPartners, setDeliveryPartners] = useState([]);

    const [selectedPartners, setSelectedPartners] = useState({});
    const [loading, setLoading] = useState(true);
    const [partnersLoading, setPartnersLoading] = useState(true);
    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    const [updatingOrder, setUpdatingOrder] = useState(null);
    const [assigningOrder, setAssigningOrder] = useState(null);

    const navigate = useNavigate();

    const statusFlow = {
        PLACED: ["ACCEPTED"],
        ACCEPTED: ["PREPARING"],
        PREPARING: ["READY"],
        READY: [],
        PICKED_UP: [],
        OUT_FOR_DELIVERY: [],
        DELIVERED: [],
        CANCELLED: []
    };

    // Authentication headers
    const getHeaders = () => {
        const token = localStorage.getItem("access_token");

        return {
            Authorization: `Bearer ${token}`
        };
    };

    // Read backend errors
    const getErrorMessage = (err) => {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") {
            return detail;
        }

        if (Array.isArray(detail)) {
            return detail
                .map(item => item.msg || JSON.stringify(item))
                .join(", ");
        }

        if (detail && typeof detail === "object") {
            return detail.message ||
                detail.msg ||
                JSON.stringify(detail);
        }

        return err.message || "Something went wrong. Please try again.";
    };

    // Fetch restaurant orders
    const fetchOrders = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Session expired. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await API.get("/owner/orders", {
                headers: getHeaders()
            });

            setOrders(response.data);

        } catch (err) {
            console.error(
                "Error fetching owner orders:",
                err.response?.data || err
            );

            setError(getErrorMessage(err));

        } finally {
            setLoading(false);
        }
    };

    // Fetch registered delivery partners
    const fetchDeliveryPartners = async () => {
        try {
            setPartnersLoading(true);

            const response = await API.get(
                "/owner/delivery-partners",
                { headers: getHeaders() }
            );

            setDeliveryPartners(response.data);

        } catch (err) {
            console.error(
                "Delivery partner fetch error:",
                err.response?.data || err
            );

            setError(
                "Unable to load delivery partners: " +
                getErrorMessage(err)
            );

        } finally {
            setPartnersLoading(false);
        }
    };

    // Update restaurant order status
    const handleStatusUpdate = async (orderId, newStatus) => {
        const order = orders.find(
            item => item.order_id === orderId
        );

        if (!order) {
            setError("Order not found.");
            return;
        }

        const allowedStatuses = statusFlow[order.order_status] || [];

        if (!allowedStatuses.includes(newStatus)) {
            setError(
                `Invalid status change from ${order.order_status} to ${newStatus}.`
            );
            return;
        }

        try {
            setUpdatingOrder(orderId);
            setError("");
            setMessage("");

            await API.patch(
                `/owner/orders/${orderId}/status`,
                {
                    order_status: newStatus
                },
                {
                    headers: getHeaders()
                }
            );

            setMessage(
                `Order #${orderId} updated to ${newStatus}.`
            );

            await fetchOrders();

        } catch (err) {
            console.error(
                "Status update error:",
                err.response?.data || err
            );

            setError(
                `Unable to update order status: ${getErrorMessage(err)}`
            );

        } finally {
            setUpdatingOrder(null);
        }
    };

    // Assign delivery partner to an order
    const handleAssignDelivery = async (orderId) => {
        const partnerId = selectedPartners[orderId];

        if (!partnerId) {
            setError("Please select a delivery partner first.");
            return;
        }

        const confirmed = window.confirm(
            `Assign delivery partner #${partnerId} to Order #${orderId}?`
        );

        if (!confirmed) return;

        try {
            setAssigningOrder(orderId);
            setError("");
            setMessage("");

            await API.patch(
                `/owner/orders/${orderId}/assign-delivery`,
                {
                    delivery_partner_id: Number(partnerId)
                },
                {
                    headers: getHeaders()
                }
            );

            setMessage(
                `Delivery partner assigned successfully to Order #${orderId}.`
            );

            await fetchOrders();

        } catch (err) {
            console.error(
                "Delivery assignment error:",
                err.response?.data || err
            );

            setError(
                `Unable to assign delivery partner: ${getErrorMessage(err)}`
            );

        } finally {
            setAssigningOrder(null);
        }
    };

    useEffect(() => {
        fetchOrders();
        fetchDeliveryPartners();
    }, []);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    return (
        <div className="owner-dashboard">

            {/* Navigation */}
            <nav className="owner-navbar">

                <h2>
                    Campus<span>Bite</span>
                </h2>

                <div className="owner-nav-links">

                    <Link to="/owner-dashboard">
                        Dashboard
                    </Link>

                    <Link
                        to="/owner-orders"
                        style={{ fontWeight: "bold" }}
                    >
                        Orders
                    </Link>

                    <Link to="/owner-menu">
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

            {/* Page Heading */}
            <section className="owner-welcome">

                <div>
                    <span className="owner-tag">
                        RESTAURANT MANAGEMENT
                    </span>

                    <h1>Order Management</h1>

                    <p>
                        View incoming orders and manage their preparation
                        and delivery status.
                    </p>
                </div>

                <div className="owner-welcome-emoji">
                    📦
                </div>

            </section>

            {/* Orders Heading */}
            <div className="owner-section-heading">

                <div>
                    <h2>All Orders</h2>

                    <p>
                        Manage orders received by your restaurant.
                    </p>
                </div>

                <button
                    className="owner-refresh-button"
                    onClick={() => {
                        fetchOrders();
                        fetchDeliveryPartners();
                    }}
                    disabled={loading}
                >
                    ↻ Refresh
                </button>

            </div>

            {/* Success and Error Messages */}
            {message && (
                <div
                    style={{
                        background: "#e8f7ed",
                        color: "#218447",
                        padding: "14px",
                        borderRadius: "10px",
                        margin: "15px 0"
                    }}
                >
                    {message}
                </div>
            )}

            {error && (
                <div
                    className="owner-error"
                    style={{ margin: "15px 0" }}
                >
                    {error}
                </div>
            )}

            {/* Order Statistics */}
            {!loading && !error && (
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
                        <h3>
                            {orders.filter(
                                order => order.order_status === "DELIVERED"
                            ).length}
                        </h3>
                        <p>Delivered</p>
                    </div>

                </div>
            )}

            {/* Orders List */}
            <section className="owner-orders-section">

                {loading ? (

                    <p className="owner-message">
                        Loading orders...
                    </p>

                ) : error && orders.length === 0 ? (

                    <p className="owner-error">
                        {error}
                    </p>

                ) : orders.length === 0 ? (

                    <p className="owner-message">
                        No orders received yet.
                    </p>

                ) : (

                    <div className="owner-orders-grid">

                        {orders.map(order => {

                            const nextStatuses =
                                statusFlow[order.order_status] || [];

                            const isAssigned =
                                Boolean(order.delivery_partner_id);

                            return (

                                <div
                                    className="owner-order-card"
                                    key={order.order_id}
                                >

                                    {/* Order Header */}
                                    <div className="owner-order-header">

                                        <h3>
                                            Order #{order.order_id}
                                        </h3>

                                        <span className="owner-status">
                                            {order.order_status}
                                        </span>

                                    </div>

                                    {/* Order Details */}
                                    <div className="owner-order-info">

                                        <p>
                                            <strong>Customer ID:</strong>{" "}
                                            {order.customer_id}
                                        </p>

                                        <p>
                                            <strong>Order Date:</strong>{" "}
                                            {order.order_date
                                                ? new Date(
                                                    order.order_date
                                                ).toLocaleString()
                                                : "Not available"}
                                        </p>

                                        <p>
                                            <strong>Delivery Address:</strong>{" "}
                                            {order.delivery_address ||
                                                "Not provided"}
                                        </p>

                                        <p>
                                            <strong>Phone:</strong>{" "}
                                            {order.delivery_phone ||
                                                "Not provided"}
                                        </p>

                                        <p className="owner-order-total">
                                            Total: ₹
                                            {Number(
                                                order.total_amount
                                            ).toFixed(2)}
                                        </p>

                                    </div>

                                    {/* Restaurant Status Update */}
                                    <div className="owner-status-update">

                                        <label>
                                            Update Order Status
                                        </label>

                                        {nextStatuses.length > 0 ? (

                                            <select
                                                value={order.order_status}
                                                onChange={(e) =>
                                                    handleStatusUpdate(
                                                        order.order_id,
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    updatingOrder ===
                                                    order.order_id
                                                }
                                            >

                                                <option
                                                    value={order.order_status}
                                                >
                                                    Current: {order.order_status}
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
                                                {order.order_status === "READY"
                                                    ? "Ready for delivery partner."
                                                    : "No further restaurant updates."}
                                            </p>

                                        )}

                                        {updatingOrder === order.order_id && (
                                            <small>
                                                Updating status...
                                            </small>
                                        )}

                                    </div>

                                    {/* Delivery Partner Assignment */}
                                    {order.order_status === "READY" && (

                                        <div
                                            style={{
                                                marginTop: "20px",
                                                padding: "16px",
                                                background: "#fff8f1",
                                                border: "1px solid #f2dfce",
                                                borderRadius: "12px"
                                            }}
                                        >

                                            <h4
                                                style={{
                                                    marginTop: 0,
                                                    marginBottom: "12px"
                                                }}
                                            >
                                                🚚 Delivery Assignment
                                            </h4>

                                            {isAssigned ? (

                                                <p
                                                    style={{
                                                        color: "#218447",
                                                        fontWeight: "600"
                                                    }}
                                                >
                                                    ✓ Assigned to Delivery Partner
                                                    #{order.delivery_partner_id}
                                                </p>

                                            ) : (

                                                <>
                                                    <p>
                                                        This order is ready.
                                                        Select a delivery partner
                                                        to assign it.
                                                    </p>

                                                    <select
                                                        value={
                                                            selectedPartners[order.order_id] || ""
                                                        }
                                                        onChange={(e) =>
                                                            setSelectedPartners(prev => ({
                                                                ...prev,
                                                                [order.order_id]: e.target.value
                                                            }))
                                                        }
                                                        disabled={
                                                            partnersLoading ||
                                                            assigningOrder === order.order_id
                                                        }
                                                        style={{
                                                            width: "100%",
                                                            padding: "11px",
                                                            border: "1px solid #e5d5c8",
                                                            borderRadius: "8px",
                                                            marginBottom: "12px"
                                                        }}
                                                    >

                                                        <option value="">
                                                            {partnersLoading
                                                                ? "Loading delivery partners..."
                                                                : "Select Delivery Partner"}
                                                        </option>

                                                        {deliveryPartners.map(partner => (

                                                            <option
                                                                key={partner.user_id}
                                                                value={partner.user_id}
                                                            >
                                                                {partner.name} — ID: {partner.user_id}
                                                            </option>

                                                        ))}

                                                    </select>

                                                    {!partnersLoading &&
                                                        deliveryPartners.length === 0 && (
                                                            <p style={{ color: "#c0392b" }}>
                                                                No registered delivery partners found.
                                                            </p>
                                                        )}

                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            handleAssignDelivery(order.order_id)
                                                        }
                                                        disabled={
                                                            !selectedPartners[order.order_id] ||
                                                            assigningOrder === order.order_id ||
                                                            partnersLoading
                                                        }
                                                        style={{
                                                            width: "100%",
                                                            padding: "12px",
                                                            background: "#ed7622",
                                                            color: "#fff",
                                                            border: "none",
                                                            borderRadius: "8px",
                                                            fontWeight: "600",
                                                            cursor: "pointer",
                                                            opacity:
                                                                !selectedPartners[order.order_id]
                                                                    ? 0.6
                                                                    : 1
                                                        }}
                                                    >
                                                        {assigningOrder === order.order_id
                                                            ? "Assigning..."
                                                            : "Assign Delivery Partner"}
                                                    </button>
                                                </>

                                            )}

                                        </div>

                                    )}

                                    {order.delivery_partner_id &&
                                        order.order_status !== "READY" && (
                                            <p
                                                style={{
                                                    marginTop: "12px",
                                                    color: "#218447",
                                                    fontWeight: "600"
                                                }}
                                            >
                                                Delivery Partner ID:{" "}
                                                {order.delivery_partner_id}
                                            </p>
                                        )}

                                </div>

                            );

                        })}

                    </div>

                )}

            </section>

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

export default OwnerOrders;
