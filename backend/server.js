require("dotenv").config();
const express = require("express");
const cors = require("cors");
const path = require("path");

const complaintRoutes = require("./routes/complaintRoutes");
const adminRoutes = require("./routes/adminRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
const PORT = process.env.PORT || 5000;

const projectRoot = path.join(__dirname, "..");
const frontendDirectory = path.join(projectRoot, "frontend");
const uploadsDirectory = path.join(projectRoot, "uploads");

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(express.static(frontendDirectory));
app.use("/uploads", express.static(uploadsDirectory));

app.use("/api/complaints", complaintRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.get("/", (_req, res) => {
  res.sendFile(path.join(frontendDirectory, "index.html"));
});

app.get("/submit", (_req, res) => {
  res.redirect("/#submit");
});

app.get("/view", (_req, res) => {
  res.redirect("/#view");
});

app.get("/track", (_req, res) => {
  res.redirect("/#track");
});

app.get("/auth", (_req, res) => {
  res.redirect("/#auth");
});

app.get("/admin", (_req, res) => {
  res.redirect("/#admin");
});

app.get("*", (_req, res) => {
  res.sendFile(path.join(frontendDirectory, "index.html"));
});

app.use((error, _req, res, _next) => {
  if (error && error.message) {
    return res.status(400).json({ message: error.message });
  }

  return res.status(500).json({ message: "Internal server error" });
});

app.listen(PORT, () => {
  console.log(`Complaint management server running on http://localhost:${PORT}`);
});
