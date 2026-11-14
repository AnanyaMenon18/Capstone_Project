
import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
    RefreshCw,
    RotateCcw,
    ClipboardList,
    Clock,
    CheckCircle,
    XCircle,
    CalendarDays,
    UserRound,
    Package
} from "lucide-react";

import API from "../services/api";
import "./OwnerDashboard.css";
import "./OwnerMenu.css";

function OwnerReturns() {
    const [returns, setReturns] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [updatingReturn, setUpdatingReturn] = useState(null);

    const navigate = useNavigate();

    // Read backend errors safely
    const getErrorMessage = (err) => {
        const detail = err.response?.data?.detail;

        if (typeof detail === "string") return detail;

        if (Array.isArray(detail)) {
            return detail.map(item => item.msg || JSON.stringify(item)).join(", ");
        }

        if (detail && typeof detail === "object") {
            return detail.message || detail.msg || JSON.stringify(detail);
        }

        return err.message || "Something went wrong. Please try again.";
    };

    // Fetch return requests
    const fetchReturns = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Session expired. Please log in again.");
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            setError("");

            const response = await API.get("/owner/returns", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setReturns(response.data);

        } catch (err) {
            console.error("Error fetching return requests:", err.response?.data || err);
            setError(getErrorMessage(err));

        } finally {
            setLoading(false);
        }
    };

    // Approve or reject a request
    const handleReturnStatus = async (requestId, newStatus) => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Session expired. Please log in again.");
            return;
        }

        const action = newStatus === "APPROVED" ? "approve" : "reject";

        const confirmed = window.confirm(
            `Are you sure you want to ${action} Return Request #${requestId}?`
        );

        if (!confirmed) return;

        try {
            setUpdatingReturn(requestId);

            await API.patch(
                `/owner/returns/${requestId}/status`,
                {
                    request_status: newStatus
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(`Return Request #${requestId} ${action}d successfully.`);

            await fetchReturns();

        } catch (err) {
            console.error("Return status update error:", err.response?.data || err);
            alert(`Unable to update return request: ${getErrorMessage(err)}`);

        } finally {
            setUpdatingReturn(null);
        }
    };

    useEffect(() => {
        fetchReturns();
    }, []);

    // Logout
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        navigate("/login");
    };

    // Request statistics
    const pendingCount = returns.filter(
        item => item.request_status?.toUpperCase() === "PENDING"
    ).length;

    const approvedCount = returns.filter(
        item => item.request_status?.toUpperCase() === "APPROVED"
    ).length;

    const rejectedCount = returns.filter(
        item => item.request_status?.toUpperCase() === "REJECTED"
    ).length;

    const formatDate = (date) => {
        if (!date) return "Not available";

        const parsedDate = new Date(date);

        if (Number.isNaN(parsedDate.getTime())) {
            return "Not available";
        }

        return parsedDate.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    return (
        <div className="owner-dashboard owner-returns-page">

            {/* Navigation */}
            <nav className="owner-navbar">
                <h2>
                    Campus<span>Bite</span>
                </h2>

                <div className="owner-nav-links">
                    <Link to="/owner-dashboard">Dashboard</Link>

                    <Link to="/owner-orders">Orders</Link>

                    <Link to="/owner-menu">Menu</Link>

                    <Link
                        to="/owner-returns"
                        style={{ fontWeight: "bold" }}
                    >
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

            {/* Hero Section */}
            <section className="owner-returns-hero">
                <div className="owner-returns-hero-content">
                    <span className="owner-tag">
                        CUSTOMER SERVICE
                    </span>

                    <h1>Return & Refund Requests</h1>

                    <p>
                        Manage customer return requests, review complaints,
                        and process refund decisions.
                    </p>
                </div>

                <div className="owner-returns-hero-icon">
                    <RotateCcw size={58} strokeWidth={1.8} />
                </div>
            </section>

            {/* Heading and Refresh */}
            <div className="owner-section-heading owner-returns-heading">
                <div>
                    <h2>Customer Requests</h2>
                    <p>Review and process incoming return requests.</p>
                </div>

                <button
                    className="owner-refresh-button"
                    onClick={fetchReturns}
                    disabled={loading}
                >
                    <RefreshCw size={17} />
                    {loading ? "Refreshing..." : "Refresh"}
                </button>
            </div>

            {/* Statistics */}
            {!loading && !error && (
                <div className="owner-returns-stats">

                    <div className="owner-returns-stat total">
                        <div className="owner-returns-stat-icon">
                            <ClipboardList size={23} />
                        </div>
                        <div>
                            <h3>{returns.length}</h3>
                            <p>Total Requests</p>
                        </div>
                    </div>

                    <div className="owner-returns-stat pending">
                        <div className="owner-returns-stat-icon">
                            <Clock size={23} />
                        </div>
                        <div>
                            <h3>{pendingCount}</h3>
                            <p>Pending</p>
                        </div>
                    </div>

                    <div className="owner-returns-stat approved">
                        <div className="owner-returns-stat-icon">
                            <CheckCircle size={23} />
                        </div>
                        <div>
                            <h3>{approvedCount}</h3>
                            <p>Approved</p>
                        </div>
                    </div>

                    <div className="owner-returns-stat rejected">
                        <div className="owner-returns-stat-icon">
                            <XCircle size={23} />
                        </div>
                        <div>
                            <h3>{rejectedCount}</h3>
                            <p>Rejected</p>
                        </div>
                    </div>

                </div>
            )}

            {/* Requests */}
            <section className="owner-returns-section">

                <div className="owner-returns-section-title">
                    <div>
                        <h2>
                            <Package size={22} />
                            All Return Requests
                        </h2>
                        <p>
                            View request details and their current status.
                        </p>
                    </div>

                    {!loading && !error && (
                        <span className="owner-returns-count">
                            {returns.length} Requests
                        </span>
                    )}
                </div>

                {loading ? (
                    <div className="owner-returns-message">
                        <RefreshCw className="owner-returns-loading-icon" size={25} />
                        <p>Loading return requests...</p>
                    </div>

                ) : error ? (
                    <div className="owner-returns-message owner-returns-error">
                        <XCircle size={25} />
                        <p>{error}</p>
                        <button onClick={fetchReturns}>Try Again</button>
                    </div>

                ) : returns.length === 0 ? (
                    <div className="owner-returns-message">
                        <ClipboardList size={35} />
                        <h3>No return requests yet</h3>
                        <p>Customer return requests will appear here.</p>
                    </div>

                ) : (
                    <div className="owner-returns-grid">

                        {returns.map(request => {
                            const status =
                                request.request_status?.toUpperCase() || "UNKNOWN";

                            const isPending = status === "PENDING";
                            const isUpdating =
                                updatingReturn === request.request_id;

                            return (
                                <article
                                    className="owner-returns-card"
                                    key={request.request_id}
                                >

                                    {/* Card Header */}
                                    <div className="owner-returns-card-header">
                                        <div>
                                            <span className="owner-returns-request-label">
                                                RETURN REQUEST
                                            </span>
                                            <h3>Request #{request.request_id}</h3>
                                        </div>

                                        <span
                                            className={`owner-returns-badge ${status.toLowerCase()}`}
                                        >
                                            {status}
                                        </span>
                                    </div>

                                    {/* Details */}
                                    <div className="owner-returns-details">

                                        <div className="owner-returns-detail-row">
                                            <Package size={18} />
                                            <span>
                                                <small>Order ID</small>
                                                <strong>#{request.order_id}</strong>
                                            </span>
                                        </div>

                                        <div className="owner-returns-detail-row">
                                            <UserRound size={18} />
                                            <span>
                                                <small>Customer ID</small>
                                                <strong>{request.customer_id}</strong>
                                            </span>
                                        </div>

                                        <div className="owner-returns-detail-row">
                                            <CalendarDays size={18} />
                                            <span>
                                                <small>Request Date</small>
                                                <strong>{formatDate(request.request_date)}</strong>
                                            </span>
                                        </div>

                                    </div>

                                    {/* Reason */}
                                    <div className="owner-returns-reason">
                                        <span>Customer's Reason</span>
                                        <p>{request.reason || "No reason provided."}</p>
                                    </div>

                                    {/* Actions */}
                                    {isPending ? (
                                        <div className="owner-returns-actions">

                                            <button
                                                className="owner-returns-approve"
                                                type="button"
                                                onClick={() =>
                                                    handleReturnStatus(
                                                        request.request_id,
                                                        "APPROVED"
                                                    )
                                                }
                                                disabled={isUpdating}
                                            >
                                                <CheckCircle size={17} />
                                                Approve
                                            </button>

                                            <button
                                                className="owner-returns-reject"
                                                type="button"
                                                onClick={() =>
                                                    handleReturnStatus(
                                                        request.request_id,
                                                        "REJECTED"
                                                    )
                                                }
                                                disabled={isUpdating}
                                            >
                                                <XCircle size={17} />
                                                Reject
                                            </button>

                                        </div>
                                    ) : (
                                        <div className="owner-returns-processed">
                                            {status === "APPROVED" ? (
                                                <CheckCircle size={18} />
                                            ) : (
                                                <XCircle size={18} />
                                            )}

                                            <span>
                                                This request has already been processed.
                                            </span>
                                        </div>
                                    )}

                                    {isUpdating && (
                                        <p className="owner-returns-updating">
                                            Updating request...
                                        </p>
                                    )}

                                </article>
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

export default OwnerReturns;
