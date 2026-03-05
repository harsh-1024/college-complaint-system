const express = require("express");
const crypto = require("crypto");

const User = require("../models/User");

const router = express.Router();
const activeUserTokens = new Map();

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value || "");
}

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

function generateToken() {
  return crypto.randomBytes(24).toString("hex");
}

function authenticateUser(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || !activeUserTokens.has(token)) {
    return res.status(401).json({ message: "Unauthorized user request" });
  }

  req.userToken = token;
  req.user = activeUserTokens.get(token);
  return next();
}

router.post("/signup", async (req, res) => {
  try {
    const name = (req.body.name || "").trim();
    const email = normalizeEmail(req.body.email || "");
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    if (!isValidEmail(email)) {
      return res.status(400).json({ message: "Please enter a valid email" });
    }

    const user = await User.signup({ name, email, password });
    const message = email === User.ownerEmail ? "Owner password/account configured successfully" : "User signed up successfully";
    return res.status(201).json({ message, user });
  } catch (error) {
    const message = error.message || "Unable to sign up";
    const statusCode = /already exists/i.test(message) ? 409 : 400;
    return res.status(statusCode).json({ message });
  }
});

router.post("/login", async (req, res) => {
  try {
    const email = normalizeEmail(req.body.email || "");
    const password = String(req.body.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.authenticate(email, password);

    if (!user) {
      return res.status(401).json({ message: "Invalid user credentials" });
    }

    const token = generateToken();
    activeUserTokens.set(token, user);

    return res.json({ message: "User login successful", token, user });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to login" });
  }
});

router.post("/logout", authenticateUser, (req, res) => {
  activeUserTokens.delete(req.userToken);
  return res.json({ message: "User logged out successfully" });
});

router.get("/me", authenticateUser, (req, res) => {
  return res.json({ user: req.user });
});

router.post("/request-admin", authenticateUser, async (req, res) => {
  try {
    const updated = await User.requestAdminAccess(req.user.email);

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    activeUserTokens.set(req.userToken, updated);

    return res.json({
      message:
        updated.adminStatus === "approved"
          ? "Admin access is already approved"
          : "Admin access request submitted for approval",
      user: updated
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to request admin access" });
  }
});

module.exports = router;
