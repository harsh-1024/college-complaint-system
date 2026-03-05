const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const dataDirectory = path.join(__dirname, "..", "data");
const usersFile = path.join(dataDirectory, "users.json");

function normalizeEmail(value = "") {
  return value.trim().toLowerCase();
}

function hashPassword(password = "") {
  return crypto.createHash("sha256").update(String(password)).digest("hex");
}

async function ensureStore() {
  await fs.mkdir(dataDirectory, { recursive: true });
  try {
    await fs.access(usersFile);
  } catch (_error) {
    await fs.writeFile(usersFile, "[]", "utf-8");
  }
}

async function readUsers() {
  await ensureStore();
  const content = await fs.readFile(usersFile, "utf-8");
  return JSON.parse(content || "[]");
}

async function writeUsers(users) {
  await fs.writeFile(usersFile, JSON.stringify(users, null, 2), "utf-8");
}

function sanitizeUser(user) {
  if (!user) {
    return null;
  }

  return {
    name: user.name || "",
    email: user.email,
    adminStatus: user.adminStatus || "none",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt
  };
}

class User {
  static get ownerEmail() {
    return normalizeEmail(process.env.OWNER_ADMIN_EMAIL || "harshkamle03@gmail.com");
  }

  static async findByEmail(email) {
    const normalized = normalizeEmail(email);
    if (!normalized) {
      return null;
    }

    const users = await readUsers();
    const found = users.find((item) => item.email === normalized) || null;
    return sanitizeUser(found);
  }

  static async signup(payload = {}) {
    const name = (payload.name || "").trim();
    const email = normalizeEmail(payload.email || "");
    const password = String(payload.password || "");

    if (!email) {
      throw new Error("Email is required");
    }

    if (password.length < 6) {
      throw new Error("Password must be at least 6 characters");
    }

    const users = await readUsers();
    const existingIndex = users.findIndex((item) => item.email === email);
    const now = new Date().toISOString();

    // Owner can re-run signup to choose/change password anytime.
    if (existingIndex !== -1) {
      if (email === this.ownerEmail) {
        users[existingIndex].name = name || users[existingIndex].name || "Owner Admin";
        users[existingIndex].passwordHash = hashPassword(password);
        users[existingIndex].adminStatus = "approved";
        users[existingIndex].updatedAt = now;
        await writeUsers(users);
        return sanitizeUser(users[existingIndex]);
      }

      throw new Error("User with this email already exists");
    }

    const user = {
      name: name || (email === this.ownerEmail ? "Owner Admin" : ""),
      email,
      passwordHash: hashPassword(password),
      adminStatus: email === this.ownerEmail ? "approved" : "none",
      createdAt: now,
      updatedAt: now
    };

    users.push(user);
    await writeUsers(users);

    return sanitizeUser(user);
  }

  static async authenticate(email, password) {
    const normalized = normalizeEmail(email || "");
    const users = await readUsers();
    const user = users.find((item) => item.email === normalized);

    if (!user) {
      return null;
    }

    if (user.passwordHash !== hashPassword(password || "")) {
      return null;
    }

    return sanitizeUser(user);
  }

  static async requestAdminAccess(email) {
    const normalized = normalizeEmail(email || "");
    const users = await readUsers();
    const index = users.findIndex((item) => item.email === normalized);

    if (index === -1) {
      return null;
    }

    if (normalized === this.ownerEmail) {
      users[index].adminStatus = "approved";
    } else if (users[index].adminStatus !== "approved") {
      users[index].adminStatus = "pending";
    }

    users[index].updatedAt = new Date().toISOString();
    await writeUsers(users);

    return sanitizeUser(users[index]);
  }

  static async listByAdminStatuses(statuses = []) {
    const normalizedStatuses = statuses.map((item) => String(item || "").toLowerCase());
    const users = await readUsers();

    return users
      .filter((item) => normalizedStatuses.includes(String(item.adminStatus || "").toLowerCase()))
      .map(sanitizeUser)
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  }

  static async updateAdminStatus(email, status) {
    const normalizedEmail = normalizeEmail(email || "");
    const normalizedStatus = String(status || "").toLowerCase();
    const allowedStatuses = ["none", "pending", "approved", "rejected"];

    if (!allowedStatuses.includes(normalizedStatus)) {
      throw new Error("Invalid admin status");
    }

    const users = await readUsers();
    const index = users.findIndex((item) => item.email === normalizedEmail);

    if (index === -1) {
      return null;
    }

    users[index].adminStatus = normalizedEmail === this.ownerEmail ? "approved" : normalizedStatus;
    users[index].updatedAt = new Date().toISOString();

    await writeUsers(users);
    return sanitizeUser(users[index]);
  }
}

module.exports = User;
