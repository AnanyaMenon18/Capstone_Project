
import React, { useState } from "react";
import API from "../services/api";
import "./Login.css";

function Login() {
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });

    const [message, setMessage] = useState("");
    const [error, setError] = useState("");

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage("");
        setError("");

        try {
            const loginData = new URLSearchParams();

            loginData.append("username", formData.email);
            loginData.append("password", formData.password);

            const response = await API.post("/login", loginData, {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
            });

            localStorage.setItem(
                "access_token",
                response.data.access_token
            );

            const userResponse = await API.get("/users/me", {
                headers: {
                    Authorization: `Bearer ${response.data.access_token}`
                }
            });

            const role = userResponse.data.role;

            if (role === "customer") {
                window.location.href = "/customer-dashboard";
            } else if (role === "restaurant_owner") {
                window.location.href = "/owner-dashboard";
            } else if (role === "delivery_partner") {
                window.location.href = "/delivery-dashboard";
            }
        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Login failed. Please check your credentials."
            );
        }
    };

    return (
        <div className="login-container">
            <div className="login-card">

                <h1>Welcome Back!</h1>
                <p>Login to your CampusBite account.</p>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>

                    <label>Email Address</label>
                    <input
                        type="email"
                        name="email"
                        placeholder="Enter your email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />

                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        placeholder="Enter your password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <button type="submit">
                        Login
                    </button>

                </form>

            </div>
        </div>
    );
}

export default Login;
