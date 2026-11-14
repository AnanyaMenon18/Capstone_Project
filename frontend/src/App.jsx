
import { useState, useEffect } from "react";
import API from "./services/api";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import Register from "./pages/Register";
import Login from "./pages/Login";
import CustomerDashboard from "./pages/CustomerDashboard";
import OwnerDashboard from "./pages/OwnerDashboard";
import OwnerOrders from "./pages/OwnerOrders";
import OwnerReturns from "./pages/OwnerReturns";
import OwnerMenu from "./pages/OwnerMenu";
import DeliveryDashboard from "./pages/DeliveryDashboard";
import DeliveryOrders from "./pages/DeliveryOrders";
import Profile from "./pages/Profile";

import {
    Search,
    ShoppingBag,
    MapPin,
    ArrowRight,
    Clock,
    Star,
    Utensils,
    UserRound
} from "lucide-react";

import "./App.css";

function Home() {
    const navigate = useNavigate();
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("All");

    const categories = [
        { name: "All", icon: "🍽️" },
        { name: "Pizza", icon: "🍕" },
        { name: "Burgers", icon: "🍔" },
        { name: "Indian", icon: "🍛" },
        { name: "Desserts", icon: "🍰" },
        { name: "Drinks", icon: "🥤" }
    ];

    const restaurants = [
        {
            name: "The Pizza Corner",
            category: "Pizza",
            rating: "4.8",
            time: "20-30 min",
            price: "₹200 for two",
            emoji: "🍕",
            color: "#FCE5D4"
        },
        {
            name: "Burger House",
            category: "Burgers",
            rating: "4.6",
            time: "25-35 min",
            price: "₹250 for two",
            emoji: "🍔",
            color: "#F5E6C8"
        },
        {
            name: "Spice Route",
            category: "Indian",
            rating: "4.9",
            time: "30-40 min",
            price: "₹300 for two",
            emoji: "🍛",
            color: "#F8DDCE"
        },
        {
            name: "Sweet Treats",
            category: "Desserts",
            rating: "4.7",
            time: "15-25 min",
            price: "₹180 for two",
            emoji: "🍰",
            color: "#F5E1E8"
        }
    ];

    const filteredRestaurants = restaurants.filter((restaurant) => {
        const matchesSearch = restaurant.name
            .toLowerCase()
            .includes(search.toLowerCase());

        const matchesCategory =
            activeCategory === "All" ||
            restaurant.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    return (
        <div className="app">

            {/* NAVBAR */}
            <nav className="navbar">

                <div className="logo">
                    <span className="logo-icon">C</span>
                    Campus<span>Bite</span>
                </div>

                <div className="nav-location">
                    <MapPin size={18} />
                    <div>
                        <small>Delivering to</small>
                        <strong>Your Campus</strong>
                    </div>
                </div>
                <div className="nav-actions">
                <button
                    className="nav-login"
                  
                    onClick={() => navigate("/login")}
                >
                    <UserRound size={18} />
                    Login
                </button>

                <button
                    className="cart-button"
                    onClick={() => navigate("/register")}
                >
                    Sign Up
                </button>

                    <button className="cart-button">
                        <ShoppingBag size={18} />
                        My Cart
                    </button>

                </div>

            </nav>

            {/* HERO SECTION */}
            <section className="hero">

                <div className="hero-content">

                    <span className="hero-tag">
                        GOOD FOOD. GOOD MOOD.
                    </span>

                    <h1>
                        Your cravings,
                        <br />
                        <span>our priority.</span>
                    </h1>

                    <p>
                        Discover amazing food around your campus.
                        Order your favourites and get them delivered
                        right to your doorstep.
                    </p>

                    <div className="search-box">

                        <Search size={21} />

                        <input
                            type="text"
                            placeholder="Search restaurants..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />

                        <button>Search</button>

                    </div>

                    <div className="hero-note">
                        <Utensils size={17} />
                        Delicious food, just a few clicks away.
                    </div>

                </div>

                <div className="hero-visual">

                    <div className="food-circle">
                        🍔
                    </div>

                    <div className="floating-food food-one">🍕</div>
                    <div className="floating-food food-two">🍟</div>
                    <div className="floating-food food-three">🥤</div>

                    <div className="hero-label">
                        <Star size={15} fill="currentColor" />
                        Made for food lovers
                    </div>

                </div>

            </section>

            {/* CATEGORIES */}
            <section className="categories-section">

                <div className="section-heading">

                    <div>
                        <span className="section-tag">EXPLORE</span>
                        <h2>What are you craving?</h2>
                    </div>

                    <p>Find something delicious today.</p>

                </div>

                <div className="category-list">

                    {categories.map((category) => (

                        <button
                            key={category.name}
                            className={
                                activeCategory === category.name
                                    ? "category-card active"
                                    : "category-card"
                            }
                            onClick={() => setActiveCategory(category.name)}
                        >
                            <span>{category.icon}</span>
                            {category.name}
                        </button>

                    ))}

                </div>

            </section>

            {/* RESTAURANTS */}
            <section className="restaurants-section">

                <div className="section-heading">

                    <div>
                        <span className="section-tag">
                            HANDPICKED FOR YOU
                        </span>
                        <h2>Popular near you</h2>
                    </div>

                    <button className="view-all">
                        Explore all <ArrowRight size={17} />
                    </button>

                </div>

                <div className="restaurant-grid">

                    {filteredRestaurants.length > 0 ? (

                        filteredRestaurants.map((restaurant) => (

                            <div
                                className="restaurant-card"
                                key={restaurant.name}
                            >

                                <div
                                    className="restaurant-image"
                                    style={{
                                        backgroundColor: restaurant.color
                                    }}
                                >

                                    <span>{restaurant.emoji}</span>

                                    <span className="rating">
                                        <Star
                                            size={14}
                                            fill="currentColor"
                                        />
                                        {restaurant.rating}
                                    </span>

                                </div>

                                <div className="restaurant-info">

                                    <h3>{restaurant.name}</h3>
                                    <p>{restaurant.category} food</p>

                                    <div className="restaurant-details">

                                        <span>
                                            <Clock size={14} />
                                            {restaurant.time}
                                        </span>

                                        <span>{restaurant.price}</span>

                                    </div>

                                    <button
                                        className="order-button"
                                        onClick={() => navigate("/customer-dashboard")}
                                    >
                                        View Menu <ArrowRight size={15} />
                                    </button>

                                </div>

                            </div>

                        ))

                    ) : (

                        <p className="no-results">
                            No restaurants found. Try another search!
                        </p>

                    )}

                </div>

            </section>

            {/* FOOTER */}
            <footer className="footer">

                <div className="logo">
                    <span className="logo-icon">C</span>
                    Campus<span>Bite</span>
                </div>

                <p>Made with ❤️ for campus food lovers.</p>

                <small>
                    © 2026 CampusBite. All rights reserved.
                </small>

            </footer>

        </div>
    );
}

function App() {

    return (
        <BrowserRouter>

            <Routes>

                {/* Home */}
                <Route path="/" element={<Home />} />

                {/* Authentication */}
                <Route path="/register" element={<Register />} />
                <Route path="/login" element={<Login />} />

                {/* Customer */}
                <Route
                    path="/customer-dashboard"
                    element={<CustomerDashboard />}
                />

                {/* Restaurant Owner */}
                
                <Route
                    path="/owner-dashboard"
                    element={<OwnerDashboard />}
                />

                <Route
                    path="/owner-menu"
                    element={<OwnerMenu />}
                />

                <Route
                    path="/owner-orders"
                    element={<OwnerOrders />}
                />

                <Route
                    path="/owner-returns"
                    element={<OwnerReturns />}
                />
                {/* Delivery Partner */}
                <Route
                    path="/delivery-dashboard"
                    element={<DeliveryDashboard />}
                />

                <Route
                    path="/delivery-orders"
                    element={<DeliveryOrders />}
                />
                {/* Shared Profile Page */}
                <Route
                    path="/profile"
                    element={<Profile />}
                />
                </Routes>
        </BrowserRouter>
    );
}

export default App;
