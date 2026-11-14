import React, { useEffect, useState } from "react";
import {
    Search,
    MapPin,
    Star,
    ArrowRight,
    LogOut,
    ClipboardList,
    RefreshCw,
    X
} from "lucide-react";

import API from "../services/api";
import "./CustomerDashboard.css";

function CustomerDashboard() {
    const [showProfile, setShowProfile] = useState(false);
    const [profileData, setProfileData] = useState(null);
    // RESTAURANT STATES
    const [restaurants, setRestaurants] = useState([]);
    const [restaurantRatings, setRestaurantRatings] = useState({});

    // RESTAURANT REVIEWS MODAL
    const [selectedRestaurantReviews, setSelectedRestaurantReviews] = useState(null);
    const [restaurantReviews, setRestaurantReviews] = useState([]);
    const [restaurantReviewsLoading, setRestaurantReviewsLoading] = useState(false);
    const [restaurantReviewsError, setRestaurantReviewsError] = useState("");

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("");

    // MENU STATES
    const [selectedRestaurant, setSelectedRestaurant] = useState(null);
    const [menuItems, setMenuItems] = useState([]);
    const [menuLoading, setMenuLoading] = useState(false);
    const [menuError, setMenuError] = useState("");

    // CART STATES
    const [cart, setCart] = useState([]);
    const [showCheckout, setShowCheckout] = useState(false);

    // CHECKOUT STATES
    const [deliveryAddress, setDeliveryAddress] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [placingOrder, setPlacingOrder] = useState(false);

    // MY ORDERS STATES
    const [showMyOrders, setShowMyOrders] = useState(false);
    const [myOrders, setMyOrders] = useState([]);
    const [ordersLoading, setOrdersLoading] = useState(false);
    const [ordersError, setOrdersError] = useState("");

    // ORDER DETAILS MODAL
    const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
    const [detailsLoading, setDetailsLoading] = useState(false);
    const [detailsError, setDetailsError] = useState("");

    // RETURN AND REFUND STATES
    const [myReturns, setMyReturns] = useState([]);
    const [returnsLoading, setReturnsLoading] = useState(false);
    const [returnsError, setReturnsError] = useState("");
    const [selectedReturnOrder, setSelectedReturnOrder] = useState(null);
    const [returnReason, setReturnReason] = useState("");
    const [submittingReturn, setSubmittingReturn] = useState(false);

    // CANCELLATION STATE
    const [cancellingOrderId, setCancellingOrderId] = useState(null);

    // REVIEW STATES
    const [myReviews, setMyReviews] = useState([]);
    const [selectedReviewOrder, setSelectedReviewOrder] = useState(null);
    const [reviewRating, setReviewRating] = useState(5);
    const [reviewComment, setReviewComment] = useState("");
    const [submittingReview, setSubmittingReview] = useState(false);
    const [reviewsLoading, setReviewsLoading] = useState(false);
    const [reviewsError, setReviewsError] = useState("");

    // AI ORDER INSIGHTS STATES
    const [aiInsights, setAiInsights] = useState(null);
    const [aiInsightsLoading, setAiInsightsLoading] = useState(false);
    const [aiInsightsError, setAiInsightsError] = useState("");

    const cartCount = cart.reduce(
        (total, item) => total + item.quantity,
        0
    );

    const cartTotal = cart.reduce(
        (total, item) => total + Number(item.price) * item.quantity,
        0
    );

    // ADD ITEM TO CART
    const handleAddToCart = (item) => {
        const restaurantId = selectedRestaurant.restaurant_id;

        if (
            cart.length > 0 &&
            cart[0].restaurant_id !== restaurantId
        ) {
            alert(
                "Your cart already contains items from another restaurant. Please clear your cart before choosing another restaurant."
            );
            return;
        }

        setCart((previousCart) => {
            const existingItem = previousCart.find(
                (cartItem) => cartItem.item_id === item.item_id
            );

            if (existingItem) {
                return previousCart.map((cartItem) =>
                    cartItem.item_id === item.item_id
                        ? {
                            ...cartItem,
                            quantity: cartItem.quantity + 1
                        }
                        : cartItem
                );
            }

            return [
                ...previousCart,
                {
                    ...item,
                    restaurant_id: restaurantId,
                    quantity: 1
                }
            ];
        });
    };

    // INCREASE QUANTITY
    const increaseQuantity = (itemId) => {
        setCart((previousCart) =>
            previousCart.map((item) =>
                item.item_id === itemId
                    ? { ...item, quantity: item.quantity + 1 }
                    : item
            )
        );
    };

    // DECREASE QUANTITY
    const decreaseQuantity = (itemId) => {
        setCart((previousCart) =>
            previousCart.map((item) =>
                item.item_id === itemId
                    ? {
                        ...item,
                        quantity: Math.max(1, item.quantity - 1)
                    }
                    : item
            )
        );
    };

    // REMOVE ITEM FROM CART
    const removeFromCart = (itemId) => {
        setCart((previousCart) =>
            previousCart.filter((item) => item.item_id !== itemId)
        );
    };

    // FETCH RESTAURANTS
    useEffect(() => {
        const fetchRestaurants = async () => {
            try {
                const response = await API.get("/restaurants/");
                setRestaurants(response.data);

                await fetchRestaurantRatings(response.data);
            } catch (err) {
                console.error("Restaurant fetching error:", err);
                setError("Unable to load restaurants. Please try again.");
            } finally {
                setLoading(false);
            }
        };

        fetchRestaurants();
    }, []);

    // FETCH REVIEWS FOR A SELECTED RESTAURANT
    const fetchRestaurantReviews = async (restaurant) => {
        try {
            setRestaurantReviewsLoading(true);
            setRestaurantReviewsError("");
            setRestaurantReviews([]);
            setSelectedRestaurantReviews(restaurant);

            const response = await API.get(
                `/restaurants/${restaurant.restaurant_id}/reviews`
            );

            setRestaurantReviews(response.data);
        } catch (err) {
            console.error(
                "Restaurant reviews error:",
                err.response?.data || err
            );

            setRestaurantReviewsError(
                err.response?.data?.detail ||
                "Unable to load restaurant reviews."
            );
        } finally {
            setRestaurantReviewsLoading(false);
        }
    };

    // FETCH RESTAURANT MENU
    const handleViewMenu = async (restaurant) => {
        setSelectedRestaurant(restaurant);
        setMenuItems([]);
        setMenuError("");
        setMenuLoading(true);

        try {
            const response = await API.get(
                `/restaurants/${restaurant.restaurant_id}/menu`
            );
            setMenuItems(response.data);
        } catch (err) {
            console.error("Menu fetching error:", err);
            setMenuError("Unable to load menu. Please try again.");
        } finally {
            setMenuLoading(false);
        }
    };

    // FETCH AVERAGE RATINGS FOR ALL RESTAURANTS
    const fetchRestaurantRatings = async (restaurantList) => {
        try {
            const ratingResults = await Promise.all(
                restaurantList.map(async (restaurant) => {
                    try {
                        const response = await API.get(
                            `/restaurants/${restaurant.restaurant_id}/rating`
                        );

                        return {
                            restaurantId: restaurant.restaurant_id,
                            rating: response.data.average_rating,
                            totalReviews: response.data.total_reviews
                        };
                    } catch (err) {
                        console.error(
                            `Rating error for restaurant ${restaurant.restaurant_id}:`,
                            err
                        );

                        return {
                            restaurantId: restaurant.restaurant_id,
                            rating: 0,
                            totalReviews: 0
                        };
                    }
                })
            );

            const ratingsMap = {};

            ratingResults.forEach((result) => {
                ratingsMap[result.restaurantId] = {
                    rating: result.rating,
                    totalReviews: result.totalReviews
                };
            });

            setRestaurantRatings(ratingsMap);
        } catch (err) {
            console.error("Unable to fetch restaurant ratings:", err);
        }
    };
    // SEARCH AND CATEGORY FILTER
    const filteredRestaurants = restaurants.filter((restaurant) => {
        const searchText = search.toLowerCase();

        const restaurantName = (restaurant.restaurant_name || "").toLowerCase();
        const cuisine = (restaurant.cuisine || "").toLowerCase();

        const matchesSearch =
            restaurantName.includes(searchText) ||
            cuisine.includes(searchText);

        const categoryKeywords = {
            Pizza: ["pizza"],
            Burgers: ["burger"],
            Indian: ["indian"],
            Desserts: ["dessert", "sweet", "cake", "pancake"],
            Drinks: ["drink", "beverage", "coffee", "tea", "juice"]
        };

        const matchesCategory =
            !selectedCategory ||
            categoryKeywords[selectedCategory].some((keyword) =>
                restaurantName.includes(keyword) ||
                cuisine.includes(keyword)
            );

        return matchesSearch && matchesCategory;
    });
    // PLACE ORDER AND PROCESS SIMULATED PAYMENT
    const handleCheckout = async () => {
        if (!deliveryAddress.trim() || !phoneNumber.trim()) {
            alert("Please enter your delivery address and phone number.");
            return;
        }

        if (!/^\d{10,15}$/.test(phoneNumber.trim())) {
            alert("Please enter a valid phone number (10–15 digits).");
            return;
        }

        if (cart.length === 0) {
            alert("Your cart is empty.");
            return;
        }

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please log in before placing an order.");
            return;
        }

        const orderData = {
            restaurant_id: cart[0].restaurant_id,
            delivery_address: deliveryAddress.trim(),
            delivery_phone: phoneNumber.trim(),
            items: cart.map((item) => ({
                item_id: item.item_id,
                quantity: item.quantity
            }))
        };

        setPlacingOrder(true);
        let orderId = null;

        try {
            const response = await API.post(
                "/orders/",
                orderData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            orderId = response.data.order_id;

            const paymentResponse = await API.post(
                "/payments/",
                { order_id: orderId },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(
                `Order and Payment Successful!\n\n` +
                `Order ID: ${orderId}\n` +
                `Payment ID: ${paymentResponse.data.payment_id}\n` +
                `Amount Paid: ₹${paymentResponse.data.amount}\n` +
                `Payment Status: ${paymentResponse.data.payment_status}`
            );

            setCart([]);
            setShowCheckout(false);
            setDeliveryAddress("");
            setPhoneNumber("");

            if (showMyOrders) {
                await fetchMyOrders();
            }

        } catch (err) {
            console.error("Checkout error:", err.response?.data || err);

            if (orderId !== null) {
                alert(
                    `Order #${orderId} was placed successfully, ` +
                    `but payment could not be completed.\n\n` +
                    `Please do not place the order again.`
                );

                setCart([]);
                setShowCheckout(false);
                setDeliveryAddress("");
                setPhoneNumber("");
            } else {
                const errorMessage = err.response?.data?.detail;

                alert(
                    typeof errorMessage === "string"
                        ? errorMessage
                        : "Unable to place order. Please try again."
                );
            }
        } finally {
            setPlacingOrder(false);
        }
    };

    // FETCH CUSTOMER ORDERS
    const fetchMyOrders = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setOrdersError("Please log in again to view your orders.");
            return;
        }

        try {
            setOrdersLoading(true);
            setOrdersError("");

            const response = await API.get(
                "/orders/my-orders",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMyOrders(response.data);
        } catch (err) {
            console.error(
                "My orders fetching error:",
                err.response?.data || err
            );

            if (err.response?.status === 401) {
                setOrdersError(
                    "Your session has expired. Please log in again."
                );
            } else {
                setOrdersError(
                    err.response?.data?.detail ||
                    "Unable to load your orders. Please try again."
                );
            }
        } finally {
            setOrdersLoading(false);
        }
    };

    // FETCH RETURN REQUESTS
    const fetchMyReturns = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setReturnsError("Please log in again to view return requests.");
            return;
        }

        try {
            setReturnsLoading(true);
            setReturnsError("");

            const response = await API.get(
                "/returns/my-returns",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMyReturns(response.data);
        } catch (err) {
            console.error(
                "Return requests fetching error:",
                err.response?.data || err
            );

            setReturnsError(
                err.response?.data?.detail ||
                "Unable to load return requests. Please try again."
            );
        } finally {
            setReturnsLoading(false);
        }
    };


    // FETCH CUSTOMER PROFILE
    const fetchProfile = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please log in again.");
            return;
        }

        try {
            const response = await API.get("/users/me", {
                headers: {
                    Authorization: `Bearer ${token}`
                }
            });

            setProfileData(response.data);
            setShowProfile(true);

        } catch (err) {
            console.error(
                "Profile fetching error:",
                err.response?.data || err
            );

            alert(
                err.response?.data?.detail ||
                "Unable to load your profile."
            );
        }
    };

    // FETCH AI ORDER INSIGHTS
    const fetchAIInsights = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setAiInsightsError("Please log in again.");
            return;
        }

        try {
            setAiInsightsLoading(true);
            setAiInsightsError("");

            const response = await API.get(
                "/customer/ai-insights",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            if (response.data.ai_insights) {
                setAiInsights(response.data.ai_insights);
            } else {
                setAiInsights(null);
                setAiInsightsError(
                    response.data.message ||
                    "No order insights are available yet."
                );
            }

        } catch (err) {
            console.error(
                "AI insights error:",
                err.response?.data || err
            );

            setAiInsightsError(
                err.response?.data?.detail ||
                "Unable to load your order insights."
            );
        } finally {
            setAiInsightsLoading(false);
        }
    };

    // FETCH CUSTOMER REVIEWS
    const fetchMyReviews = async () => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setReviewsError("Please log in again to view your reviews.");
            return;
        }

        try {
            setReviewsLoading(true);
            setReviewsError("");

            const response = await API.get(
                "/reviews/my-reviews",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setMyReviews(response.data);
        } catch (err) {
            console.error(
                "Reviews fetching error:",
                err.response?.data || err
            );

            setReviewsError(
                err.response?.data?.detail ||
                "Unable to load your reviews."
            );
        } finally {
            setReviewsLoading(false);
        }
    };

    // CANCEL ORDER
    const handleCancelOrder = async (orderId) => {
        const confirmed = window.confirm(
            `Are you sure you want to cancel Order #${orderId}?`
        );

        if (!confirmed) return;

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please log in again to cancel this order.");
            return;
        }

        try {
            setCancellingOrderId(orderId);

            const response = await API.patch(
                `/orders/${orderId}/cancel`,
                {},
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(
                response.data?.message ||
                `Order #${orderId} cancelled successfully.`
            );

            await fetchMyOrders();

            if (selectedOrderDetails?.order_id === orderId) {
                setSelectedOrderDetails((previous) => ({
                    ...previous,
                    order_status: "CANCELLED"
                }));
            }

        } catch (err) {
            console.error(
                "Order cancellation error:",
                err.response?.data || err
            );

            const errorMessage = err.response?.data?.detail;

            alert(
                typeof errorMessage === "string"
                    ? errorMessage
                    : "Unable to cancel this order. Please try again."
            );
        } finally {
            setCancellingOrderId(null);
        }
    };

    // SUBMIT RETURN REQUEST
    const handleSubmitReturn = async (orderId) => {
        if (!returnReason.trim()) {
            alert("Please enter a reason for your return request.");
            return;
        }

        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please log in again.");
            return;
        }

        try {
            setSubmittingReturn(true);

            const response = await API.post(
                "/returns/",
                {
                    order_id: orderId,
                    reason: returnReason.trim()
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(
                `Return request submitted successfully!\n\n` +
                `Request ID: ${response.data.request_id}\n` +
                `Status: ${response.data.request_status}`
            );

            setReturnReason("");
            setSelectedReturnOrder(null);
            await fetchMyReturns();

        } catch (err) {
            console.error(
                "Return request error:",
                err.response?.data || err
            );

            const errorMessage = err.response?.data?.detail;

            alert(
                typeof errorMessage === "string"
                    ? errorMessage
                    : "Unable to submit return request. Please try again."
            );
        } finally {
            setSubmittingReturn(false);
        }
    };
    // OPEN REVIEW FORM
    const handleOpenReview = (orderId) => {
        setSelectedReviewOrder(orderId);
        setReviewRating(5);
        setReviewComment("");
    };

    // SUBMIT CUSTOMER REVIEW
    const handleSubmitReview = async (orderId) => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            alert("Please log in again to submit a review.");
            return;
        }

        if (reviewRating < 1 || reviewRating > 5) {
            alert("Please select a rating between 1 and 5.");
            return;
        }

        try {
            setSubmittingReview(true);

            const response = await API.post(
                "/reviews/",
                {
                    order_id: orderId,
                    rating: reviewRating,
                    comment: reviewComment.trim() || null
                },
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            alert(
                `Review submitted successfully!\n\n` +
                `Rating: ${response.data.rating}/5`
            );

            setSelectedReviewOrder(null);
            setReviewComment("");
            setReviewRating(5);

            await fetchMyReviews();

        } catch (err) {
            console.error(
                "Review submission error:",
                err.response?.data || err
            );

            const errorMessage = err.response?.data?.detail;

            alert(
                typeof errorMessage === "string"
                    ? errorMessage
                    : "Unable to submit your review. Please try again."
            );
        } finally {
            setSubmittingReview(false);
        }
    };

    // FETCH ORDER DETAILS
    const fetchOrderDetails = async (orderId) => {
        const token = localStorage.getItem("access_token");

        if (!token) {
            setDetailsError("Please log in again to view order details.");
            return;
        }

        try {
            setDetailsLoading(true);
            setDetailsError("");
            setSelectedOrderDetails(null);

            const response = await API.get(
                `/orders/${orderId}/details`,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setSelectedOrderDetails(response.data);
        } catch (err) {
            console.error(
                "Order details fetching error:",
                err.response?.data || err
            );

            setDetailsError(
                err.response?.data?.detail ||
                "Unable to load order details. Please try again."
            );
        } finally {
            setDetailsLoading(false);
        }
    };

    // OPEN MY ORDERS
    const handleShowMyOrders = () => {
        setShowMyOrders(true);
        setSelectedRestaurant(null);
        setShowCheckout(false);
        setSelectedOrderDetails(null);
        setDetailsError("");

        fetchMyOrders();
        fetchMyReturns();
        fetchMyReviews();

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // RETURN TO HOME
    const handleShowHome = () => {
        setShowMyOrders(false);
        setSelectedOrderDetails(null);

        window.scrollTo({
            top: 0,
            behavior: "smooth"
        });
    };

    // FORMAT ORDER DATE
    const formatOrderDate = (dateValue) => {
        if (!dateValue) return "Date unavailable";

        const date = new Date(dateValue);

        if (Number.isNaN(date.getTime())) {
            return "Date unavailable";
        }

        return date.toLocaleString("en-IN", {
            day: "2-digit",
            month: "short",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit"
        });
    };

    // LOGOUT
    const handleLogout = () => {
        localStorage.removeItem("access_token");
        window.location.href = "/login";
    };

    return (
        <div className="customer-dashboard">

            {/* NAVBAR */}
            <nav className="customer-navbar">
                <h2>
                    Campus<span>Bite</span>
                </h2>

                <div className="customer-nav-links">
                    <span
                        onClick={handleShowHome}
                        style={{ cursor: "pointer" }}
                    >
                        Home
                    </span>

                    <span
                        onClick={handleShowMyOrders}
                        style={{ cursor: "pointer" }}
                    >
                        My Orders
                    </span>

                    <span
                        onClick={fetchProfile}
                        style={{ cursor: "pointer" }}
                    >
                        Profile
                    </span>
                </div>

                <button
                    className="logout-button"
                    onClick={handleLogout}
                >
                    <LogOut size={17} />
                    Logout
                </button>
            </nav>

            {/* CUSTOMER PROFILE POPUP */}
            {showProfile && (
                <div
                    className="profile-modal-overlay"
                    onClick={() => setShowProfile(false)}
                >
                    <div
                        className="profile-modal"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="profile-modal-header">
                            <div>
                                <h2>My Profile</h2>
                                <p>Your CampusBite account details</p>
                            </div>

                            <button
                                onClick={() => setShowProfile(false)}
                                className="profile-close-button"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="profile-avatar">
                            <icon-placeholder />
                            <span>
                                {(profileData?.full_name || profileData?.name || "C")
                                    .charAt(0).toUpperCase()}
                            </span>
                        </div>

                        <div className="profile-details">
                            <div className="profile-detail-row">
                                <span>Full Name</span>
                                <strong>
                                    {profileData?.full_name ||
                                        profileData?.name ||
                                        "Not available"}
                                </strong>
                            </div>

                            <div className="profile-detail-row">
                                <span>Email Address</span>
                                <strong>
                                    {profileData?.email || "Not available"}
                                </strong>
                            </div>

                            <div className="profile-detail-row">
                                <span>Phone Number</span>
                                <strong>
                                    {profileData?.phone_number ||
                                        profileData?.phone ||
                                        "Not available"}
                                </strong>
                            </div>

                            <div className="profile-detail-row">
                                <span>Account Role</span>
                                <strong>
                                    {profileData?.role || "Customer"}
                                </strong>
                            </div>
                        </div>

                        <button
                            className="profile-done-button"
                            onClick={() => setShowProfile(false)}
                        >
                            Close Profile
                        </button>
                    </div>
                </div>
            )}

            {/* MY ORDERS */}
            {showMyOrders && (
                <section
                    className="customer-menu"
                    style={{ marginTop: "35px" }}
                >
                    <div className="customer-section-heading">
                        <div>
                            <h2>
                                <ClipboardList
                                    size={25}
                                    style={{
                                        verticalAlign: "middle",
                                        marginRight: "8px"
                                    }}
                                />
                                My Orders
                            </h2>

                            <p>
                                View your previous orders and their latest status.
                            </p>
                        </div>

                        <button
                            onClick={() => {
                                fetchMyOrders();
                                fetchMyReturns();
                                fetchMyReviews();
                            }}
                            disabled={
                                ordersLoading ||
                                returnsLoading ||
                                reviewsLoading
                            }
                        >
                            <RefreshCw size={15} />
                            {ordersLoading || returnsLoading || reviewsLoading
                                ? "Refreshing..."
                                : "Refresh"}
                        </button>
                    </div>


                    {/* AI ORDER INSIGHTS */}

                    <section className="customer-ai-insights">

                        <div className="customer-section-heading">
                            <div>
                                <h2>✨ Your Order Insights</h2>
                                <p>
                                    Explore your ordering habits and discover your favourites.
                                </p>
                            </div>

                            <button
                                onClick={fetchAIInsights}
                                disabled={aiInsightsLoading}
                            >
                                {aiInsightsLoading
                                    ? "Analysing..."
                                    : "Generate Insights"}
                            </button>
                        </div>

                        {aiInsightsError && (
                            <p style={{ color: "#b42318", marginTop: "12px" }}>
                                {aiInsightsError}
                            </p>
                        )}

                        {aiInsights && (
                            <>

                                {/* METRIC CARDS */}
                                <div className="ai-metrics-grid">

                                    <div className="ai-metric-card">
                                        <span className="ai-card-icon">🛍️</span>
                                        <h3>Total Orders</h3>
                                        <h2>{aiInsights.total_orders}</h2>
                                    </div>

                                    <div className="ai-metric-card">
                                        <span className="ai-card-icon">💰</span>
                                        <h3>Total Spending</h3>
                                        <h2>
                                            ₹{Number(aiInsights.total_spending).toFixed(2)}
                                        </h2>
                                    </div>

                                    <div className="ai-metric-card">
                                        <span className="ai-card-icon">📊</span>
                                        <h3>Average Order</h3>
                                        <h2>
                                            ₹{Number(aiInsights.average_order_value).toFixed(2)}
                                        </h2>
                                    </div>

                                </div>

                                {/* SUMMARY */}
                                <div className="ai-summary-card">
                                    <span>✨</span>
                                    <p>{aiInsights.summary}</p>
                                </div>

                                {/* FAVOURITES AND RECOMMENDATIONS */}
                                <div className="ai-insights-grid">

                                    {/* FAVOURITE DISHES */}
                                    <div className="ai-insight-card">
                                        <h3>🍽️ Favourite Dishes</h3>

                                        {aiInsights.favourite_dishes?.length ? (
                                            aiInsights.favourite_dishes.map((dish, index) => (
                                                <div
                                                    className="ai-insight-row"
                                                    key={index}
                                                >
                                                    <strong>{dish.dish}</strong>
                                                    <span>{dish.quantity} orders</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p>No favourite dishes yet.</p>
                                        )}
                                    </div>

                                    {/* FAVOURITE RESTAURANTS */}
                                    <div className="ai-insight-card">
                                        <h3>🏪 Favourite Restaurants</h3>

                                        {aiInsights.favourite_restaurants?.length ? (
                                            aiInsights.favourite_restaurants.map(
                                                (restaurant, index) => (
                                                    <div
                                                        className="ai-insight-row"
                                                        key={index}
                                                    >
                                                        <strong>{restaurant.restaurant}</strong>
                                                        <span>{restaurant.orders} orders</span>
                                                    </div>
                                                )
                                            )
                                        ) : (
                                            <p>No favourite restaurants yet.</p>
                                        )}
                                    </div>

                                    {/* RECOMMENDATIONS */}
                                    <div className="ai-insight-card ai-recommendations">
                                        <h3>💡 Recommendations for You</h3>

                                        {aiInsights.recommendations?.length ? (
                                            aiInsights.recommendations.map(
                                                (recommendation, index) => (
                                                    <p key={index}>
                                                        <span>✦</span> {recommendation}
                                                    </p>
                                                )
                                            )
                                        ) : (
                                            <p>
                                                Explore more dishes to receive recommendations.
                                            </p>
                                        )}
                                    </div>

                                </div>

                            </>
                        )}

                    </section>

                    {/* END OF AI ORDER INSIGHTS */}

                    {!ordersLoading && ordersError && (
                        <p style={{ color: "red" }}>{ordersError}</p>
                    )}

                    {returnsLoading && <p>Loading return requests...</p>}

                    {returnsError && (
                        <p style={{ color: "red" }}>{returnsError}</p>
                    )}

                    {reviewsError && (
                        <p style={{ color: "red" }}>{reviewsError}</p>
                    )}

                    {!ordersLoading &&
                        !ordersError &&
                        myOrders.length === 0 && (
                            <div style={{ padding: "25px 0" }}>
                                <h3>No orders yet</h3>
                                <p>Your placed orders will appear here.</p>

                                <button onClick={handleShowHome}>
                                    Explore Restaurants
                                </button>
                            </div>
                        )}

                    {!ordersLoading &&
                        !ordersError &&
                        myOrders.length > 0 && (
                            <div className="customer-restaurant-grid">
                                {myOrders.map((order) => {
                                    const restaurant = restaurants.find(
                                        (item) =>
                                            item.restaurant_id === order.restaurant_id
                                    );

                                    const returnRequest = myReturns.find(
                                        (item) =>
                                            item.order_id === order.order_id
                                    );

                                    const existingReview = myReviews.find(
                                        (item) =>
                                            item.order_id === order.order_id
                                    );

                                    return (

                                            <div className="customer-restaurant-info">

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        justifyContent: "space-between",
                                                        alignItems: "center",
                                                        gap: "12px",
                                                        flexWrap: "wrap"
                                                    }}
                                                >
                                                    <h3>
                                                        Order #{order.order_id}
                                                    </h3>

                                                    <span
                                                        style={{
                                                            backgroundColor: "#fff0e5",
                                                            color: "#e96b16",
                                                            padding: "6px 12px",
                                                            borderRadius: "20px",
                                                            fontSize: "13px",
                                                            fontWeight: "600"
                                                        }}
                                                    >
                                                        {order.order_status}
                                                    </span>
                                                </div>

                                                <p>
                                                    {restaurant?.restaurant_name ||
                                                        `Restaurant #${order.restaurant_id}`}
                                                </p>

                                                <p>
                                                    Order date:{" "}
                                                    {formatOrderDate(order.order_date)}
                                                </p>

                                                <h3>
                                                    Total: ₹
                                                    {Number(order.total_amount).toFixed(2)}
                                                </h3>

                                                <p>
                                                    Delivery address:{" "}
                                                    {order.delivery_address || "Not available"}
                                                </p>

                                                <p>
                                                    Phone:{" "}
                                                    {order.delivery_phone || "Not available"}
                                                </p>

                                                {/* VIEW DETAILS */}
                                                <button
                                                    onClick={() =>
                                                        fetchOrderDetails(order.order_id)
                                                    }
                                                    disabled={detailsLoading}
                                                    style={{ marginTop: "12px" }}
                                                >
                                                    View Details
                                                    <ArrowRight size={15} />
                                                </button>

                                                {/* CANCEL ORDER */}
                                                {order.order_status === "PLACED" && (
                                                    <button
                                                        onClick={() =>
                                                            handleCancelOrder(order.order_id)
                                                        }
                                                        disabled={
                                                            cancellingOrderId === order.order_id
                                                        }
                                                        style={{
                                                            marginTop: "10px",
                                                            marginLeft: "10px",
                                                            backgroundColor: "#fff0f0",
                                                            color: "#c62828",
                                                            border: "1px solid #e57373",
                                                            padding: "10px 15px",
                                                            borderRadius: "8px",
                                                            cursor: "pointer"
                                                        }}
                                                    >
                                                        {cancellingOrderId === order.order_id
                                                            ? "Cancelling..."
                                                            : "Cancel Order"}
                                                    </button>
                                                )}

                                                {/* REVIEW SECTION */}
                                                {order.order_status === "DELIVERED" && (
                                                    <div
                                                        style={{
                                                            marginTop: "15px",
                                                            padding: "12px",
                                                            backgroundColor: "#fffaf2",
                                                            borderRadius: "10px"
                                                        }}
                                                    >
                                                        {existingReview ? (
                                                            <>
                                                                <strong>
                                                                    <Star
                                                                        size={16}
                                                                        fill="#f5a623"
                                                                        color="#f5a623"
                                                                        style={{
                                                                            verticalAlign: "middle",
                                                                            marginRight: "5px"
                                                                        }}
                                                                    />
                                                                    Your Review
                                                                </strong>

                                                                <p style={{ color: "#e99a00" }}>
                                                                    {"★".repeat(existingReview.rating)}
                                                                    {"☆".repeat(5 - existingReview.rating)}
                                                                </p>

                                                                <p>
                                                                    {existingReview.comment ||
                                                                        "No comment added."}
                                                                </p>

                                                                <small>
                                                                    Review submitted
                                                                </small>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <strong>Enjoyed your order?</strong>

                                                                <p>
                                                                    Share your experience with this restaurant.
                                                                </p>

                                                                {selectedReviewOrder === order.order_id ? (
                                                                    <div style={{ marginTop: "12px" }}>
                                                                        <label>
                                                                            Your Rating
                                                                        </label>

                                                                        <div
                                                                            style={{
                                                                                display: "flex",
                                                                                gap: "8px",
                                                                                margin: "10px 0"
                                                                            }}
                                                                        >
                                                                            {[1, 2, 3, 4, 5].map((rating) => (
                                                                                <button
                                                                                    type="button"
                                                                                    key={rating}
                                                                                    onClick={() =>
                                                                                        setReviewRating(rating)
                                                                                    }
                                                                                    disabled={submittingReview}
                                                                                    aria-label={`${rating} stars`}
                                                                                    style={{
                                                                                        border: "none",
                                                                                        background: "transparent",
                                                                                        padding: "2px",
                                                                                        cursor: "pointer",
                                                                                        color:
                                                                                            rating <= reviewRating
                                                                                                ? "#f5a623"
                                                                                                : "#cccccc"
                                                                                    }}
                                                                                >
                                                                                    <Star
                                                                                        size={28}
                                                                                        fill={
                                                                                            rating <= reviewRating
                                                                                                ? "currentColor"
                                                                                                : "none"
                                                                                        }
                                                                                    />
                                                                                </button>
                                                                            ))}
                                                                        </div>

                                                                        <p>
                                                                            {reviewRating} out of 5 stars
                                                                        </p>

                                                                        <textarea
                                                                            rows="3"
                                                                            placeholder="Write your experience (optional)..."
                                                                            value={reviewComment}
                                                                            onChange={(e) =>
                                                                                setReviewComment(e.target.value)
                                                                            }
                                                                            disabled={submittingReview}
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "10px",
                                                                                borderRadius: "8px",
                                                                                border: "1px solid #ddd",
                                                                                boxSizing: "border-box"
                                                                            }}
                                                                        />

                                                                        <button
                                                                            onClick={() =>
                                                                                handleSubmitReview(order.order_id)
                                                                            }
                                                                            disabled={submittingReview}
                                                                            style={{ marginTop: "10px" }}
                                                                        >
                                                                            {submittingReview
                                                                                ? "Submitting..."
                                                                                : "Submit Review"}
                                                                        </button>

                                                                        <button
                                                                            onClick={() =>
                                                                                setSelectedReviewOrder(null)
                                                                            }
                                                                            disabled={submittingReview}
                                                                            style={{ marginLeft: "10px" }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() =>
                                                                            handleOpenReview(order.order_id)
                                                                        }
                                                                        style={{ marginTop: "10px" }}
                                                                    >
                                                                        Write a Review
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                                {/* RETURN SECTION */}
                                                {order.order_status === "DELIVERED" && (
                                                    <div
                                                        style={{
                                                            marginTop: "15px",
                                                            padding: "12px",
                                                            backgroundColor: "#f8f9fa",
                                                            borderRadius: "10px"
                                                        }}
                                                    >
                                                        {returnRequest ? (
                                                            <>
                                                                <strong>Return Request</strong>
                                                                <p>
                                                                    Status: {returnRequest.request_status}
                                                                </p>
                                                                <p>
                                                                    Reason: {returnRequest.reason}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <strong>Need help with this order?</strong>

                                                                {selectedReturnOrder === order.order_id ? (
                                                                    <div style={{ marginTop: "12px" }}>
                                                                        <textarea
                                                                            rows="3"
                                                                            placeholder="Enter the reason for your return request..."
                                                                            value={returnReason}
                                                                            onChange={(e) =>
                                                                                setReturnReason(e.target.value)
                                                                            }
                                                                            style={{
                                                                                width: "100%",
                                                                                padding: "10px",
                                                                                borderRadius: "8px",
                                                                                border: "1px solid #ddd",
                                                                                marginBottom: "10px",
                                                                                boxSizing: "border-box"
                                                                            }}
                                                                        />

                                                                        <button
                                                                            onClick={() =>
                                                                                handleSubmitReturn(order.order_id)
                                                                            }
                                                                            disabled={submittingReturn}
                                                                        >
                                                                            {submittingReturn
                                                                                ? "Submitting..."
                                                                                : "Submit Return Request"}
                                                                        </button>

                                                                        <button
                                                                            onClick={() => {
                                                                                setSelectedReturnOrder(null);
                                                                                setReturnReason("");
                                                                            }}
                                                                            disabled={submittingReturn}
                                                                            style={{ marginLeft: "10px" }}
                                                                        >
                                                                            Cancel
                                                                        </button>
                                                                    </div>
                                                                ) : (
                                                                    <button
                                                                        onClick={() => {
                                                                            setSelectedReturnOrder(order.order_id);
                                                                            setReturnReason("");
                                                                        }}
                                                                        style={{ marginTop: "10px" }}
                                                                    >
                                                                        Request Return
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}

                                            </div>
                                    );
                                })}
                            </div>
                        )}

                    <button
                        onClick={handleShowHome}
                        style={{ marginTop: "20px" }}
                    >
                        Back to Restaurants
                    </button>
                </section>
            )}

            {/* ORDER DETAILS POPUP MODAL */}
            {detailsLoading && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000
                }}>
                    <p style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px"
                    }}>
                        Loading order details...
                    </p>
                </div>
            )}

            {detailsError && (
                <div style={{
                    position: "fixed",
                    inset: 0,
                    backgroundColor: "rgba(0,0,0,0.45)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    zIndex: 1000,
                    padding: "20px"
                }}>
                    <div style={{
                        background: "white",
                        padding: "25px",
                        borderRadius: "12px",
                        maxWidth: "400px"
                    }}>
                        <p style={{ color: "red" }}>{detailsError}</p>
                        <button onClick={() => setDetailsError("")}>
                            Close
                        </button>
                    </div>
                </div>
            )}

            {selectedOrderDetails && (
                <div
                    onClick={() => setSelectedOrderDetails(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1001,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "#ffffff",
                            width: "100%",
                            maxWidth: "600px",
                            maxHeight: "85vh",
                            overflowY: "auto",
                            padding: "28px",
                            borderRadius: "18px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
                        }}
                    >
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "12px"
                        }}>
                            <h2>
                                Order Details #{selectedOrderDetails.order_id}
                            </h2>

                            <button
                                onClick={() => setSelectedOrderDetails(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <h3 style={{ marginTop: "25px" }}>
                            Items Ordered
                        </h3>

                        {selectedOrderDetails.items?.map((item) => (
                            <div
                                key={item.order_item_id}
                                style={{
                                    display: "flex",
                                    justifyContent: "space-between",
                                    gap: "15px",
                                    padding: "12px 0",
                                    borderBottom: "1px solid #eee"
                                }}
                            >
                                <div>
                                    <strong>{item.item_name}</strong>
                                    <p>
                                        Quantity: {item.quantity} × ₹
                                        {Number(item.item_price).toFixed(2)}
                                    </p>
                                </div>

                                <strong>
                                    ₹{Number(item.subtotal).toFixed(2)}
                                </strong>
                            </div>
                        ))}

                        <div style={{
                            marginTop: "20px",
                            padding: "15px",
                            backgroundColor: "#fff7ed",
                            borderRadius: "12px"
                        }}>
                            <h3>
                                Total: ₹
                                {Number(selectedOrderDetails.total_amount).toFixed(2)}
                            </h3>

                            <p>
                                Status: {selectedOrderDetails.order_status}
                            </p>

                            <p>
                                Delivery address:{" "}
                                {selectedOrderDetails.delivery_address || "Not available"}
                            </p>

                            <p>
                                Phone:{" "}
                                {selectedOrderDetails.delivery_phone || "Not available"}
                            </p>
                        </div>

                        <button
                            onClick={() => setSelectedOrderDetails(null)}
                            style={{ marginTop: "20px" }}
                        >
                            Close Details
                        </button>
                    </div>
                </div>
            )}
            {/* RESTAURANT REVIEWS POPUP */}
            {selectedRestaurantReviews && (
                <div
                    onClick={() => setSelectedRestaurantReviews(null)}
                    style={{
                        position: "fixed",
                        inset: 0,
                        backgroundColor: "rgba(0,0,0,0.55)",
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        zIndex: 1100,
                        padding: "20px"
                    }}
                >
                    <div
                        onClick={(e) => e.stopPropagation()}
                        style={{
                            backgroundColor: "#fff",
                            width: "100%",
                            maxWidth: "600px",
                            maxHeight: "85vh",
                            overflowY: "auto",
                            padding: "28px",
                            borderRadius: "18px",
                            boxShadow: "0 10px 40px rgba(0,0,0,0.2)"
                        }}
                    >
                        <div style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center"
                        }}>
                            <h2>
                                {selectedRestaurantReviews.restaurant_name} Reviews
                            </h2>

                            <button
                                onClick={() => setSelectedRestaurantReviews(null)}
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div style={{
                            backgroundColor: "#fff7ed",
                            padding: "15px",
                            borderRadius: "12px",
                            margin: "15px 0"
                        }}>
                            <h3 style={{ color: "#e99a00" }}>
                                <Star
                                    size={19}
                                    fill="currentColor"
                                    style={{ verticalAlign: "middle" }}
                                />
                                {" "}
                                {restaurantRatings[
                                    selectedRestaurantReviews.restaurant_id
                                ]?.rating?.toFixed(1) || "New"} / 5
                            </h3>

                            <p>
                                {restaurantRatings[
                                    selectedRestaurantReviews.restaurant_id
                                ]?.totalReviews || 0} customer reviews
                            </p>
                        </div>

                        {restaurantReviewsLoading && (
                            <p>Loading reviews...</p>
                        )}

                        {restaurantReviewsError && (
                            <p style={{ color: "red" }}>
                                {restaurantReviewsError}
                            </p>
                        )}

                        {!restaurantReviewsLoading &&
                            !restaurantReviewsError &&
                            restaurantReviews.length === 0 && (
                                <p>No reviews yet. Be the first to review!</p>
                            )}

                        {!restaurantReviewsLoading &&
                            restaurantReviews.map((review) => (
                                <div
                                    key={review.review_id}
                                    style={{
                                        padding: "15px 0",
                                        borderBottom: "1px solid #eee"
                                    }}
                                >
                                    <div style={{
                                        display: "flex",
                                        justifyContent: "space-between",
                                        gap: "10px"
                                    }}>
                                        <strong>
                                            Customer #{review.customer_id || "Customer"}
                                        </strong>

                                        <span style={{ color: "#f5a623" }}>
                                            {"★".repeat(review.rating)}
                                            {"☆".repeat(5 - review.rating)}
                                        </span>
                                    </div>

                                    <p style={{ margin: "10px 0" }}>
                                        {review.comment || "No comment provided."}
                                    </p>

                                    <small style={{ color: "#777" }}>
                                        {review.review_date
                                            ? new Date(review.review_date)
                                                .toLocaleDateString("en-IN")
                                            : "Date unavailable"}
                                    </small>
                                </div>
                            ))}

                        <button
                            onClick={() => setSelectedRestaurantReviews(null)}
                            style={{ marginTop: "20px" }}
                        >
                            Close Reviews
                        </button>
                    </div>
                </div>
            )}

            {/* HOME SECTION */}
            {!showMyOrders && (
                <>
                    {/* WELCOME SECTION */}
                    <section className="customer-welcome">
                        <div>
                            <span className="welcome-tag">
                                YOUR CAMPUS FOOD HUB
                            </span>

                            <h1>Hungry? Let's fix that!</h1>

                            <p>
                                Discover delicious food from restaurants around your campus.
                            </p>
                        </div>

                        <div className="welcome-emoji">🍔</div>
                    </section>

                    {/* SEARCH SECTION */}
                    <section className="customer-search">
                        <Search size={20} />

                        <input
                            type="text"
                            placeholder="Search for restaurants or food..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <button>Search</button>
                    </section>

                    {/* CATEGORIES */}
                    <section className="customer-categories">
                        <h2>Explore Categories</h2>

                        <div className="customer-category-list">
                            <div onClick={() => setSelectedCategory("Pizza")}>
                                🍕<p>Pizza</p>
                            </div>

                            <div onClick={() => setSelectedCategory("Burgers")}>
                                🍔<p>Burgers</p>
                            </div>

                            <div onClick={() => setSelectedCategory("Indian")}>
                                🍛<p>Indian</p>
                            </div>

                            <div onClick={() => setSelectedCategory("Desserts")}>
                                🍰<p>Desserts</p>
                            </div>

                            <div onClick={() => setSelectedCategory("Drinks")}>
                                🥤<p>Drinks</p>
                            </div>
                        </div>
                    </section>

                    {/* RESTAURANTS */}
                    <section className="customer-restaurants">
                        <div className="customer-section-heading">
                            <div>
                                <h2>Popular Restaurants</h2>
                                <p>Find your next favourite meal.</p>
                            </div>

                            <button
                                onClick={() => {
                                    setSelectedCategory("");
                                    setSearch("");
                                }}
                            >
                                View All <ArrowRight size={16} />
                            </button>
                        </div>

                        {loading && <p>Loading restaurants...</p>}

                        {!loading && error && (
                            <p style={{ color: "red" }}>{error}</p>
                        )}

                        {!loading && !error && (
                            <div className="customer-restaurant-grid">
                                {filteredRestaurants.length > 0 ? (
                                    filteredRestaurants.map((restaurant) => (
                                        <div
                                            className="customer-restaurant-card"
                                            key={restaurant.restaurant_id}
                                        >
                                            <div className="customer-food-image">
                                                🍽️
                                            </div>

                                            <div className="customer-restaurant-info">
                                                <h3>{restaurant.restaurant_name}</h3>

                                                <p>
                                                    {restaurant.cuisine || "Restaurant"}
                                                </p>

                                                <div
                                                    style={{
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "6px",
                                                        margin: "8px 0",
                                                        color: "#f5a623"
                                                    }}
                                                >
                                                    <Star
                                                        size={17}
                                                        fill="#f5a623"
                                                        color="#f5a623"
                                                    />

                                                    <strong>
                                                        {restaurantRatings[restaurant.restaurant_id]?.rating > 0
                                                            ? restaurantRatings[restaurant.restaurant_id].rating.toFixed(1)
                                                            : "New"}
                                                    </strong>

                                                    <span style={{
                                                        color: "#777",
                                                        fontSize: "13px"
                                                    }}>
                                                        ({restaurantRatings[restaurant.restaurant_id]?.totalReviews || 0} reviews)
                                                    </span>
                                                </div>

                                                <span>
                                                    <MapPin size={14} />
                                                    {restaurant.address}
                                                </span>

                                                <button
                                                    onClick={() =>
                                                        handleViewMenu(restaurant)
                                                    }
                                                >
                                                    View Menu
                                                    <ArrowRight size={15} />
                                                </button>

                                                <button
                                                    onClick={() =>
                                                        fetchRestaurantReviews(restaurant)
                                                    }
                                                    style={{
                                                        marginTop: "10px",
                                                        backgroundColor: "#fff0e5",
                                                        color: "#e96b16",
                                                        border: "1px solid #f47721",
                                                        padding: "10px 15px",
                                                        borderRadius: "8px",
                                                        cursor: "pointer"
                                                    }}
                                                >
                                                    <Star
                                                        size={15}
                                                        style={{
                                                            verticalAlign: "middle",
                                                            marginRight: "6px"
                                                        }}
                                                    />
                                                    View Reviews
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p>
                                        No restaurants found. Try another search!
                                    </p>
                                )}
                            </div>
                        )}
                    </section>

                    {/* RESTAURANT MENU */}
                    {selectedRestaurant && (
                        <section className="customer-menu">
                            <div className="customer-section-heading">
                                <div>
                                    <h2>
                                        {selectedRestaurant.restaurant_name} Menu
                                    </h2>
                                    <p>Choose your favourite food!</p>
                                </div>

                                <button
                                    onClick={() => setSelectedRestaurant(null)}
                                >
                                    Back to Restaurants
                                </button>
                            </div>

                            {menuLoading && <p>Loading menu...</p>}

                            {menuError && (
                                <p style={{ color: "red" }}>{menuError}</p>
                            )}

                            {!menuLoading && !menuError && (
                                <div className="customer-restaurant-grid">
                                    {menuItems.length > 0 ? (
                                        menuItems.map((item) => (
                                            <div
                                                className="customer-restaurant-card"
                                                key={item.item_id}
                                            >
                                                <div className="customer-food-image">
                                                    🍽️
                                                </div>

                                                <div className="customer-restaurant-info">
                                                    <h3>{item.item_name}</h3>

                                                    <p>
                                                        {item.description || item.category}
                                                    </p>

                                                    <h3>₹{item.price}</h3>

                                                    <button
                                                        onClick={() =>
                                                            handleAddToCart(item)
                                                        }
                                                    >
                                                        Add to Cart
                                                        <ArrowRight size={15} />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <p>
                                            No menu items available for this restaurant.
                                        </p>
                                    )}
                                </div>
                            )}
                        </section>
                    )}

                    {/* SHOPPING CART */}
                    {cart.length > 0 && (
                        <section className="customer-menu">
                            <div className="customer-section-heading">
                                <div>
                                    <h2>Your Cart 🛒</h2>
                                    <p>
                                        {cartCount} items added to your cart
                                    </p>
                                </div>
                            </div>

                            <div className="customer-restaurant-grid">
                                {cart.map((item) => (
                                    <div
                                        className="customer-restaurant-card"
                                        key={item.item_id}
                                    >
                                        <div className="customer-restaurant-info">
                                            <h3>{item.item_name}</h3>

                                            <div className="cart-quantity-controls">
                                                <button
                                                    onClick={() =>
                                                        decreaseQuantity(item.item_id)
                                                    }
                                                >
                                                    -
                                                </button>

                                                <span>{item.quantity}</span>

                                                <button
                                                    onClick={() =>
                                                        increaseQuantity(item.item_id)
                                                    }
                                                >
                                                    +
                                                </button>
                                            </div>

                                            <h3>
                                                ₹{Number(item.price) * item.quantity}
                                            </h3>

                                            <button
                                                className="remove-cart-button"
                                                onClick={() =>
                                                    removeFromCart(item.item_id)
                                                }
                                            >
                                                Remove
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <h2>Grand Total: ₹{cartTotal.toFixed(2)}</h2>

                            <button
                                onClick={() => setShowCheckout(true)}
                                style={{
                                    display: "block",
                                    backgroundColor: "#f47721",
                                    color: "white",
                                    padding: "15px 25px",
                                    border: "none",
                                    borderRadius: "10px",
                                    marginTop: "20px",
                                    cursor: "pointer",
                                    fontSize: "16px"
                                }}
                            >
                                Proceed to Checkout →
                            </button>
                        </section>
                    )}

                    {/* CHECKOUT */}
                    {showCheckout && (
                        <section className="customer-menu checkout-section">
                            <h2>Checkout 🛒</h2>
                            <p>Complete your delivery details.</p>

                            <div className="checkout-form">
                                <label>Delivery Address</label>

                                <textarea
                                    placeholder="Enter your full delivery address"
                                    rows="3"
                                    value={deliveryAddress}
                                    onChange={(e) =>
                                        setDeliveryAddress(e.target.value)
                                    }
                                />

                                <label>Phone Number</label>

                                <input
                                    type="tel"
                                    placeholder="Enter your phone number"
                                    value={phoneNumber}
                                    onChange={(e) =>
                                        setPhoneNumber(e.target.value)
                                    }
                                />

                                <h3>Order Summary</h3>

                                {cart.map((item) => (
                                    <div
                                        key={item.item_id}
                                        className="checkout-item"
                                    >
                                        <span>
                                            {item.item_name} × {item.quantity}
                                        </span>

                                        <span>
                                            ₹{Number(item.price) * item.quantity}
                                        </span>
                                    </div>
                                ))}

                                <h3>Grand Total: ₹{cartTotal.toFixed(2)}</h3>

                                <button
                                    className="place-order-button"
                                    onClick={handleCheckout}
                                    disabled={placingOrder}
                                >
                                    {placingOrder
                                        ? "Processing..."
                                        : "Place Order & Pay"}
                                </button>

                                <button
                                    className="cancel-checkout-button"
                                    onClick={() => setShowCheckout(false)}
                                    disabled={placingOrder}
                                >
                                    Back to Cart
                                </button>
                            </div>
                        </section>
                    )}
                </>
            )}


            {/* FOOTER */}
            <footer className="customer-footer">
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

export default CustomerDashboard;
