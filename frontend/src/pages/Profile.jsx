
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    UserRound,
    Mail,
    Phone,
    ShieldCheck,
    Pencil,
    Save,
    X,
    ArrowLeft,
    LogOut
} from "lucide-react";

import API from "../services/api";
import "./Profile.css";

function Profile() {

    const navigate = useNavigate();

    const [profile, setProfile] = useState(null);

    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone: ""
    });

    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);

    const [error, setError] = useState("");
    const [message, setMessage] = useState("");

    // GET CURRENT USER PROFILE
    const fetchProfile = async () => {

        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Please log in to view your profile.");
            setLoading(false);
            return;
        }

        try {

            setLoading(true);
            setError("");

            const response = await API.get(
                "/users/me",
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            const user = response.data;

            setProfile(user);

            setFormData({
                name: user.name || "",
                email: user.email || "",
                phone: user.phone || ""
            });

        } catch (err) {

            console.error(
                "Profile fetching error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to load your profile."
            );

        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    // HANDLE INPUT CHANGES
    const handleChange = (e) => {

        const { name, value } = e.target;

        setFormData((previous) => ({
            ...previous,
            [name]: value
        }));
    };

    // EDIT PROFILE
    const handleEdit = () => {

        setFormData({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || ""
        });

        setEditing(true);
        setMessage("");
        setError("");
    };

    // CANCEL EDITING
    const handleCancel = () => {

        setFormData({
            name: profile.name || "",
            email: profile.email || "",
            phone: profile.phone || ""
        });

        setEditing(false);
        setError("");
        setMessage("");
    };

    // SAVE PROFILE
    const handleSave = async (e) => {

        e.preventDefault();

        const token = localStorage.getItem("access_token");

        if (!token) {
            setError("Please log in again.");
            return;
        }

        if (
            !formData.name.trim() ||
            !formData.email.trim() ||
            !formData.phone.trim()
        ) {
            setError("Please fill in all the fields.");
            return;
        }

        try {

            setSaving(true);
            setError("");
            setMessage("");

            const updatedData = {
                name: formData.name.trim(),
                email: formData.email.trim(),
                phone: formData.phone.trim()
            };

            const response = await API.put(
                "/users/me",
                updatedData,
                {
                    headers: {
                        Authorization: `Bearer ${token}`
                    }
                }
            );

            setProfile(response.data);

            setFormData({
                name: response.data.name || "",
                email: response.data.email || "",
                phone: response.data.phone || ""
            });

            setEditing(false);

            setMessage("Your profile has been updated successfully!");

        } catch (err) {

            console.error(
                "Profile update error:",
                err.response?.data || err
            );

            setError(
                err.response?.data?.detail ||
                "Unable to update your profile. Please try again."
            );

        } finally {
            setSaving(false);
        }
    };

    // LOGOUT
    const handleLogout = () => {

        localStorage.removeItem("access_token");

        navigate("/login");
    };

    // BACK TO DASHBOARD
    const handleBack = () => {

        if (profile?.role === "restaurant_owner") {
            navigate("/owner-dashboard");
        } else if (profile?.role === "delivery_partner") {
            navigate("/delivery-dashboard");
        }
    };

    // FORMAT ROLE
    const formatRole = (role) => {

        if (role === "restaurant_owner") {
            return "Restaurant Owner";
        }

        if (role === "delivery_partner") {
            return "Delivery Partner";
        }

        return role || "User";
    };

    // LOADING
    if (loading) {
        return (
            <div className="profile-loading">
                <div className="profile-spinner"></div>
                <p>Loading your profile...</p>
            </div>
        );
    }

    // ERROR
    if (!profile) {
        return (
            <div className="profile-page">
                <div className="profile-card profile-error-card">
                    <h2>Unable to load profile</h2>
                    <p>{error}</p>

                    <button
                        className="profile-primary-button"
                        onClick={fetchProfile}
                    >
                        Try Again
                    </button>

                    <button
                        className="profile-secondary-button"
                        onClick={() => navigate("/login")}
                    >
                        Go to Login
                    </button>
                </div>
            </div>
        );
    }

    // ROLE CHECK
    if (
        profile.role !== "restaurant_owner" &&
        profile.role !== "delivery_partner"
    ) {
        return (
            <div className="profile-page">
                <div className="profile-card profile-error-card">
                    <h2>Access Restricted</h2>
                    <p>
                        This profile page is available only to
                        Restaurant Owners and Delivery Partners.
                    </p>

                    <button
                        className="profile-primary-button"
                        onClick={() => navigate("/customer-dashboard")}
                    >
                        Return to Dashboard
                    </button>
                </div>
            </div>
        );
    }

    return (

        <div className="profile-page">

            {/* NAVBAR */}
            <nav className="profile-navbar">

                <div className="profile-logo">
                    Campus<span>Bite</span>
                </div>

                <div className="profile-nav-actions">

                    <button
                        className="profile-back-button"
                        onClick={handleBack}
                    >
                        <ArrowLeft size={17} />
                        Dashboard
                    </button>

                    <button
                        className="profile-logout-button"
                        onClick={handleLogout}
                    >
                        <LogOut size={17} />
                        Logout
                    </button>

                </div>

            </nav>

            {/* PAGE CONTENT */}
            <main className="profile-container">

                <div className="profile-heading">

                    <span className="profile-tag">
                        ACCOUNT SETTINGS
                    </span>

                    <h1>My Profile</h1>

                    <p>
                        Manage your personal information and
                        account details.
                    </p>

                </div>

                {/* PROFILE CARD */}
                <section className="profile-card">

                    {/* PROFILE HEADER */}
                    <div className="profile-card-header">

                        <div className="profile-avatar">
                            <UserRound size={35} />
                        </div>

                        <div className="profile-user-heading">

                            <h2>{profile.name}</h2>

                            <span className="profile-role-badge">
                                <ShieldCheck size={15} />
                                {formatRole(profile.role)}
                            </span>

                        </div>

                        {!editing && (

                            <button
                                className="profile-edit-button"
                                onClick={handleEdit}
                            >
                                <Pencil size={16} />
                                Edit Profile
                            </button>

                        )}

                    </div>

                    <div className="profile-divider"></div>

                    {/* MESSAGES */}
                    {error && (
                        <div className="profile-error-message">
                            {error}
                        </div>
                    )}

                    {message && (
                        <div className="profile-success-message">
                            {message}
                        </div>
                    )}

                    {/* PROFILE FORM */}
                    <form onSubmit={handleSave}>

                        <div className="profile-fields">

                            {/* NAME */}
                            <div className="profile-field">

                                <label>
                                    <UserRound size={16} />
                                    Full Name
                                </label>

                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Enter your full name"
                                    required
                                />

                            </div>

                            {/* EMAIL */}
                            <div className="profile-field">

                                <label>
                                    <Mail size={16} />
                                    Email Address
                                </label>

                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Enter your email"
                                    required
                                />

                            </div>

                            {/* PHONE */}
                            <div className="profile-field">

                                <label>
                                    <Phone size={16} />
                                    Phone Number
                                </label>

                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    disabled={!editing}
                                    placeholder="Enter your phone number"
                                    required
                                />

                            </div>

                            {/* ROLE */}
                            <div className="profile-field">

                                <label>
                                    <ShieldCheck size={16} />
                                    Account Role
                                </label>

                                <input
                                    type="text"
                                    value={formatRole(profile.role)}
                                    disabled
                                />

                                <small>
                                    Your account role cannot be changed.
                                </small>

                            </div>

                        </div>

                        {/* ACTION BUTTONS */}
                        {editing && (

                            <div className="profile-form-actions">

                                <button
                                    type="button"
                                    className="profile-secondary-button"
                                    onClick={handleCancel}
                                    disabled={saving}
                                >
                                    <X size={17} />
                                    Cancel
                                </button>

                                <button
                                    type="submit"
                                    className="profile-primary-button"
                                    disabled={saving}
                                >
                                    <Save size={17} />
                                    {saving ? "Saving..." : "Save Changes"}
                                </button>

                            </div>

                        )}

                    </form>

                    {/* ACCOUNT INFORMATION */}
                    <div className="profile-account-info">

                        <h3>Account Information</h3>

                        <div>
                            <span>User ID</span>
                            <strong>#{profile.user_id}</strong>
                        </div>

                        <div>
                            <span>Account Created</span>
                            <strong>
                                {profile.created_at
                                    ? new Date(
                                        profile.created_at
                                    ).toLocaleDateString("en-IN")
                                    : "Not available"}
                            </strong>
                        </div>

                    </div>

                </section>

                <p className="profile-footer">
                    CampusBite · Your food, your campus, your experience.
                </p>

            </main>

        </div>
    );
}

export default Profile;
