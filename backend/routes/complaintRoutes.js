const express = require("express");
const path = require("path");
const fs = require("fs/promises");
const crypto = require("crypto");
const multer = require("multer");
const Complaint = require("../models/Complaint");
const supabase = require("../lib/supabaseClient");

const router = express.Router();
const storageBucket = process.env.SUPABASE_STORAGE_BUCKET || "complaint-images";
const uploadsDirectory = path.join(__dirname, "..", "..", "uploads");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (!file.mimetype.startsWith("image/")) {
      cb(new Error("Only image uploads are allowed"));
      return;
    }
    cb(null, true);
  }
});

function isValidEmail(value) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isConnectivityError(error) {
  const message = `${error && error.message ? error.message : ""}`.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    message.includes("network")
  );
}

function sanitizePublicRecord(record) {
  return {
    complaintId: record.complaintId,
    studentName: record.isAnonymous ? "Anonymous User" : record.studentName || "",
    college: record.college,
    title: record.title,
    description: record.description,
    category: record.category,
    imageUrl: record.imageUrl,
    status: record.status,
    adminComments: record.adminComments,
    createdAt: record.createdAt
  };
}

async function uploadImageToSupabase(file) {
  if (!file) {
    return "";
  }

  const extension = path.extname(file.originalname || "").replace(/[^a-zA-Z0-9.]/g, "") || ".jpg";
  const objectPath = `complaints/${Date.now()}-${crypto.randomUUID()}${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(storageBucket)
    .upload(objectPath, file.buffer, {
      contentType: file.mimetype,
      upsert: false
    });

  if (uploadError) {
    throw new Error(uploadError.message || "Unable to upload image to Supabase Storage");
  }

  const { data } = supabase.storage.from(storageBucket).getPublicUrl(objectPath);
  return data && data.publicUrl ? data.publicUrl : "";
}

async function uploadImageLocally(file) {
  if (!file) {
    return "";
  }

  await fs.mkdir(uploadsDirectory, { recursive: true });
  const extension = path.extname(file.originalname || "").replace(/[^a-zA-Z0-9.]/g, "") || ".jpg";
  const fileName = `${Date.now()}-${crypto.randomUUID()}${extension}`;
  const fullPath = path.join(uploadsDirectory, fileName);
  await fs.writeFile(fullPath, file.buffer);

  return `/uploads/${fileName}`;
}

async function resolveImageUpload(file) {
  if (!file) {
    return "";
  }

  try {
    return await uploadImageToSupabase(file);
  } catch (error) {
    if (!isConnectivityError(error)) {
      throw error;
    }

    // Fallback to local upload when Supabase host is unreachable.
    return uploadImageLocally(file);
  }
}

// Create a new complaint with optional image evidence.
router.post("/", upload.single("image"), async (req, res) => {
  try {
    const { studentName, isAnonymous, email, college, title, description, category } = req.body;

    if (!college || !title || !description || !category) {
      return res.status(400).json({ message: "College, title, description, and category are required" });
    }

    if (email && !isValidEmail(email)) {
      return res.status(400).json({ message: "Please provide a valid email address" });
    }

    const imageUrl = await resolveImageUpload(req.file);

    const complaint = await Complaint.create({
      studentName: studentName || "",
      isAnonymous: String(isAnonymous) === "true",
      email: email || "",
      college,
      title,
      description,
      category,
      imageUrl
    });

    return res.status(201).json({ message: "Complaint submitted", complaint: sanitizePublicRecord(complaint) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to submit complaint" });
  }
});

// Public list endpoint with search and filter support.
router.get("/", async (req, res) => {
  try {
    const complaints = await Complaint.list({
      college: req.query.college,
      category: req.query.category,
      status: req.query.status,
      search: req.query.search
    });

    return res.json({ complaints: complaints.map(sanitizePublicRecord) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Unable to fetch complaints" });
  }
});

// Track by complaint ID and optional email.
router.get("/track", async (req, res) => {
  try {
    const complaintId = (req.query.complaintId || "").trim();
    const email = (req.query.email || "").trim();

    if (!complaintId) {
      return res.status(400).json({ message: "Complaint ID is required" });
    }

    const complaint = await Complaint.findByComplaintId(complaintId);

    if (!complaint) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    if (email && complaint.email && email.toLowerCase() !== complaint.email.toLowerCase()) {
      return res.status(403).json({ message: "Email does not match this complaint" });
    }

    return res.json({ complaint: sanitizePublicRecord(complaint) });
  } catch (error) {
    return res.status(500).json({ message: error.message || "Failed to track complaint" });
  }
});

module.exports = router;
