const crypto = require("crypto");

class Admin {
  static get username() {
    return process.env.ADMIN_USERNAME || "admin";
  }

  static get additionalUsernames() {
    const configured = (process.env.ADMIN_ADDITIONAL_USERNAMES || "")
      .split(",")
      .map((value) => value.trim())
      .filter(Boolean);

    // Keep this email enabled as requested.
    configured.push("harshkamle03@gmail.com");

    return Array.from(new Set(configured));
  }

  static get password() {
    return process.env.ADMIN_PASSWORD || "admin123";
  }

  static get allowedUsernames() {
    return Array.from(new Set([this.username, ...this.additionalUsernames]));
  }

  static validateCredentials(username, password) {
    const normalizedInput = (username || "").trim().toLowerCase();
    const isAllowedUser = this.allowedUsernames.some(
      (allowed) => allowed.toLowerCase() === normalizedInput
    );

    return isAllowedUser && password === this.password;
  }

  static generateToken() {
    return crypto.randomBytes(24).toString("hex");
  }
}

module.exports = Admin;
