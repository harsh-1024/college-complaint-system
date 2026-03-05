const express = require("express");
const crypto = require("crypto");

const Complaint = require("../models/Complaint");
const User = require("../models/User");
const supabase = require("../lib/supabaseClient");

const router = express.Router();
const activeTokens = new Map();
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "complaint-images";

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

function generateAdminToken() {
  return crypto.randomBytes(24).toString("hex");
}

function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";

  if (!token || !activeTokens.has(token)) {
    return res.status(401).json({ message: "Unauthorized admin request" });
  }

  req.adminToken = token;
  req.admin = activeTokens.get(token);
  return next();
}

function requireOwner(req, res, next) {
  if (!req.admin || !req.admin.isOwner) {
    return res.status(403).json({ message: "Only owner admin can perform this action" });
  }

  return next();
}

function extractStorageObjectPath(imageUrl) {
  if (!imageUrl) {
    return "";
  }

  try {
    const parsedUrl = new URL(imageUrl);
    const marker = `/object/public/${storageBucket}/`;
    const markerIndex = parsedUrl.pathname.indexOf(marker);

    if (markerIndex === -1) {
      return "";
    }

    return decodeURIComponent(parsedUrl.pathname.slice(markerIndex + marker.length));
  } catch (_error) {
    return "";
  }
}

async function removeSupabaseImageIfExists(imageUrl) {
  const objectPath = extractStorageObjectPath(imageUrl);
  if (!objectPath) {
    return;
  }

  await supabase.storage.from(storageBucket).remove([objectPath]);
}

router.post("/login", async (req, res) => {
  try {
    const username = (req.body.username || "").trim();
    const password = String(req.body.password || "");

    if (!username || !password) {
      return res.status(400).json({ message: "Username and password are required" });
    }

    const normalized = normalizeEmail(username);
    const ownerEmail = User.ownerEmail;
    const user = await User.authenticate(normalized, password);

    if (!user) {
      return res.status(401).json({ message: "Invalid admin credentials" });
    }

    const isOwner = normalized === ownerEmail;

    if (!isOwner && user.adminStatus !== "approved") {
      await User.requestAdminAccess(normalized);
      return res.status(403).json({
        message: "Admin access requires approval from harshkamle03@gmail.com. Request has been marked pending."
      });
    }

    const token = generateAdminToken();
    activeTokens.set(token, { email: normalized, isOwner });

    return res.json({
      message: "Admin login successful",
      token,
      isOwner,
      email: normalized
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Admin login failed" });
  }
});

router.post("/logout", authenticateAdmin, (req, res) => {
  activeTokens.delete(req.adminToken);
  return res.json({ message: "Logged out successfully" });
});

router.get("/access-requests", authenticateAdmin, requireOwner, async (_req, res) => {
  try {
    const requests = await User.listByAdminStatuses(["pending"]);
    return res.json({ requests });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch access requests" });
  }
});

router.patch("/access-requests/:email", authenticateAdmin, requireOwner, async (req, res) => {
  try {
    const email = req.params.email;
    const status = String(req.body.status || "").toLowerCase();

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "Status must be approved or rejected" });
    }

    const updated = await User.updateAdminStatus(email, status);

    if (!updated) {
      return res.status(404).json({ message: "User not found" });
    }

    return res.json({
      message: `Admin access ${status} for ${updated.email}`,
      user: updated
    });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update access request" });
  }
});

router.get("/complaints", authenticateAdmin, async (req, res) => {
  try {
    const complaints = await Complaint.list({
      college: req.query.college,
      status: req.query.status,
      search: req.query.search
    });

    return res.json({ complaints });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch admin complaints" });
  }
});

router.patch("/complaints/:complaintId", authenticateAdmin, async (req, res) => {
  try {
    const { complaintId } = req.params;
    const { status, adminComments } = req.body;
    const allowedStatuses = ["Pending", "In Progress", "Resolved"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Status must be Pending, In Progress, or Resolved" });
    }

    const updated = await Complaint.updateByComplaintId(complaintId, {
      status,
      adminComments: adminComments || ""
    });

    if (!updated) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    return res.json({ message: "Complaint updated", complaint: updated });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to update complaint" });
  }
});

router.delete("/complaints/:complaintId", authenticateAdmin, async (req, res) => {
  try {
    const removed = await Complaint.deleteByComplaintId(req.params.complaintId);

    if (!removed) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    await removeSupabaseImageIfExists(removed.imageUrl);
    return res.json({ message: "Complaint deleted", complaint: removed });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to delete complaint" });
  }
});

module.exports = router;
