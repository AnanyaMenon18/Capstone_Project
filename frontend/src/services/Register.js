
import React, { useState } from "react";
import API from "../services/api";

function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "customer"
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
            const response = await API.post("/users/", formData);

            setMessage("Registration successful! Welcome to CampusBite.");

            setFormData({
                name: "",
                email: "",
                password: "",
                phone: "",
                role: "customer"
            });

        } catch (err) {
            setError(
                err.response?.data?.detail ||
                "Registration failed. Please try again."
            );
        }
    };

    return (
        <div className="register-container">
            <div className="register-card">

                <h1>Join CampusBite</h1>
                <p>Create your account and get started!</p>

                {message && <p className="success-message">{message}</p>}
                {error && <p className="error-message">{error}</p>}

                <form onSubmit={handleSubmit}>

                    <label>Full Name</label>
                    <input
                        type="text"
                        name="name"
                        placeholder="Enter your name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />

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
                        placeholder="Create a password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />

                    <label>Phone Number</label>
                    <input
                        type="tel"
                        name="phone"
                        placeholder="Enter your phone number"
                        value={formData.phone}
                        onChange={handleChange}
                    />

                    <label>Register As</label>
                    <select
                        name="role"
                        value={formData.role}
                        onChange={handleChange}
                    >
                        <option value="customer">Customer</option>
                        <option value="restaurant_owner">
                            Restaurant Owner
                        </option>
                        <option value="delivery_partner">
                            Delivery Partner
                        </option>
                    </select>

                    <button type="submit">
                        Create Account
                    </button>

                </form>
            </div>
        </div>
    );
}

export default Register;
