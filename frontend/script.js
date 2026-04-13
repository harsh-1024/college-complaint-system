const configuredApiBase = (window.APP_CONFIG && window.APP_CONFIG.API_BASE) ? String(window.APP_CONFIG.API_BASE).trim() : "";
const API_BASE = configuredApiBase ? configuredApiBase.replace(/\/$/, "") : `${window.location.origin}/api`;
const configuredServerBase = (window.APP_CONFIG && window.APP_CONFIG.SERVER_BASE) ? String(window.APP_CONFIG.SERVER_BASE).trim() : "";
const derivedServerBase = API_BASE.replace(/\/api$/, "");
const SERVER_BASE = configuredServerBase ? configuredServerBase.replace(/\/$/, "") : derivedServerBase;
const configuredOwnerAdminEmail = (window.APP_CONFIG && window.APP_CONFIG.OWNER_ADMIN_EMAIL) ? String(window.APP_CONFIG.OWNER_ADMIN_EMAIL).trim().toLowerCase() : "";
const OWNER_ADMIN_EMAIL = configuredOwnerAdminEmail || "harshkamle03@gmail.com";
const ROUTES = ["home", "submit", "view", "track", "auth", "admin"];
const HOME_ROUTE = "home";
const THEME_KEY = "themePreference";
const USER_SESSION_KEY = "userSession";
const ADMIN_SESSION_KEY = "adminSession";

const COLLEGES = [
  "Indian Institute of Technology Indore (IIT Indore)",
  "Indian Institute of Management Indore (IIM Indore)",
  "Devi Ahilya Vishwavidyalaya (DAVV)",
  "Medi-Caps University",
  "Sage University Indore",
  "Renaissance University",
  "Malwanchal University",
  "Shri Govindram Seksaria Institute of Technology and Science (SGSITS)",
  "Institute of Engineering and Technology DAVV (IET DAVV)",
  "IPS Academy Institute of Engineering and Science",
  "Acropolis Institute of Technology and Research",
  "Indore Institute of Science and Technology",
  "Sri Aurobindo Institute of Technology",
  "Patel Group of Institutions",
  "Malwa Institute of Technology",
  "Prestige Institute of Management and Research",
  "Jaipuria Institute of Management",
  "Institute of Management Studies DAVV (IMS DAVV)",
  "Government Maharani Laxmi Bai Girls PG College",
  "Arihant College",
  "Chameli Devi Group of Institutions",
  "Astral Institute of Technology and Research",
  "Other College"
];

const CATEGORY_ICONS = { Infrastructure: "???", Cleanliness: "??", Faculty: "?????", Facilities: "??", Internet: "??", Hostel: "???", Other: "??" };

const byId = (id) => document.getElementById(id);
const backButton = byId("backButton");
const menuButton = byId("menuButton");
const mainNav = byId("mainNav");
const themeToggle = byId("themeToggle");
const toast = byId("toast");

const routeLinks = Array.from(document.querySelectorAll("[data-route-link]"));
const sectionJumpButtons = Array.from(document.querySelectorAll("[data-target-route]"));
const pageSections = new Map(Array.from(document.querySelectorAll(".page[data-route]")).map((s) => [s.dataset.route, s]));

const complaintForm = byId("complaintForm");
const studentNameInput = byId("studentName");
const emailInput = byId("email");
const collegeSelect = byId("college");
const categorySelect = byId("category");
const titleInput = byId("title");
const descriptionInput = byId("description");
const imageInput = byId("image");
const imagePreview = byId("imagePreview");
const submitMessage = byId("submitMessage");

const complaintsGrid = byId("complaintsGrid");
const searchInput = byId("searchInput");
const filterCollege = byId("filterCollege");
const filterCategory = byId("filterCategory");
const filterStatus = byId("filterStatus");

const trackForm = byId("trackForm");
const trackComplaintIdInput = byId("trackComplaintId");
const trackEmailInput = byId("trackEmail");
const trackResult = byId("trackResult");

const userSignupForm = byId("userSignupForm");
const userLoginForm = byId("userLoginForm");
const signupNameInput = byId("signupName");
const signupEmailInput = byId("signupEmail");
const signupPasswordInput = byId("signupPassword");
const loginEmailInput = byId("loginEmail");
const loginPasswordInput = byId("loginPassword");
const userAuthMessage = byId("userAuthMessage");
const userProfileCard = byId("userProfileCard");
const userIdentity = byId("userIdentity");
const userAdminStatus = byId("userAdminStatus");
const requestAdminAccessBtn = byId("requestAdminAccessBtn");
const userLogoutBtn = byId("userLogoutBtn");
const toggleUserForgotPanelBtn = byId("toggleUserForgotPanelBtn");
const userForgotPanel = byId("userForgotPanel");
const userForgotRequestForm = byId("userForgotRequestForm");
const forgotEmailInput = byId("forgotEmail");
const userResetPasswordForm = byId("userResetPasswordForm");
const resetCodeInput = byId("resetCode");
const resetNewPasswordInput = byId("resetNewPassword");
const forgotPasswordMessage = byId("forgotPasswordMessage");

const adminLoginForm = byId("adminLoginForm");
const adminEmailInput = byId("adminEmail");
const adminPasswordInput = byId("adminPassword");
const toggleAdminForgotPanelBtn = byId("toggleAdminForgotPanelBtn");
const adminForgotPanel = byId("adminForgotPanel");
const adminForgotRequestForm = byId("adminForgotRequestForm");
const adminForgotEmailInput = byId("adminForgotEmail");
const adminResetPasswordForm = byId("adminResetPasswordForm");
const adminResetCodeInput = byId("adminResetCode");
const adminNewPasswordInput = byId("adminNewPassword");
const adminForgotPasswordMessage = byId("adminForgotPasswordMessage");
const adminLoginMessage = byId("adminLoginMessage");
const ownerAdminEmailText = byId("ownerAdminEmailText");
const useOwnerAdminBtn = byId("useOwnerAdminBtn");
const adminPanel = byId("adminPanel");
const adminIdentity = byId("adminIdentity");
const adminLogoutBtn = byId("adminLogoutBtn");
const adminSearchInput = byId("adminSearchInput");
const adminFilterCollege = byId("adminFilterCollege");
const adminFilterStatus = byId("adminFilterStatus");
const adminComplaintsGrid = byId("adminComplaintsGrid");
const adminActionMessage = byId("adminActionMessage");
const adminRequestsPanel = byId("adminRequestsPanel");
const adminRequestsList = byId("adminRequestsList");

let currentRoute = HOME_ROUTE;
let toastTimer = null;
let userSession = JSON.parse(localStorage.getItem(USER_SESSION_KEY) || "null");
let adminSession = JSON.parse(localStorage.getItem(ADMIN_SESSION_KEY) || "null");

const normalizeRoute = (r) => (ROUTES.includes(r) ? r : HOME_ROUTE);
const routeHash = (r) => `#${normalizeRoute(r)}`;
const getRouteFromLocation = () => normalizeRoute((window.location.hash || "#home").replace("#", "").trim().toLowerCase());

function setMenuState(open) {
  if (!mainNav || !menuButton) return;
  mainNav.classList.toggle("open", open);
  menuButton.setAttribute("aria-expanded", String(open));
}

function updateBackButtonState() {
  if (backButton) backButton.disabled = window.history.length <= 1;
}

function setActiveNav(route) {
  routeLinks.forEach((link) => link.classList.toggle("active", link.dataset.routeLink === route));
}

function setActiveSection(route) {
  pageSections.forEach((section, key) => {
    const active = key === route;
    section.hidden = !active;
    section.classList.toggle("active", active);
  });
}

function renderRoute(route) {
  const safe = normalizeRoute(route);
  currentRoute = safe;
  setActiveNav(safe);
  setActiveSection(safe);
  setMenuState(false);
  updateBackButtonState();
  window.scrollTo({ top: 0, behavior: "smooth" });
  if (safe === "view") loadPublicComplaints();
  if (safe === "admin" && adminSession?.token) {
    loadAdminComplaints();
    if (adminSession.isOwner) loadAdminRequests();
  }
}

function navigate(route, options = {}) {
  const safe = normalizeRoute(route);
  const hash = routeHash(safe);
  if (options.push === false) window.history.replaceState({ route: safe }, "", hash);
  else window.history.pushState({ route: safe }, "", hash);
  renderRoute(safe);
}

function applyTheme(mode) {
  const next = mode === "dark" ? "dark" : "light";
  document.body.classList.toggle("dark-mode", next === "dark");
  localStorage.setItem(THEME_KEY, next);
  if (themeToggle) themeToggle.textContent = next === "dark" ? "Light" : "Dark";
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 2400);
}

function initializePasswordVisibilityToggles() {
  const passwordInputs = Array.from(document.querySelectorAll("input[type='password']"));

  passwordInputs.forEach((input) => {
    if (input.dataset.passwordToggleReady === "true") return;
    input.dataset.passwordToggleReady = "true";

    const wrapper = document.createElement("div");
    wrapper.className = "password-field";

    const parent = input.parentNode;
    parent.insertBefore(wrapper, input);
    wrapper.appendChild(input);

    const toggleButton = document.createElement("button");
    toggleButton.type = "button";
    toggleButton.className = "password-toggle";
    toggleButton.setAttribute("aria-label", "Hold to show password");
    toggleButton.innerHTML = "&#128065;";
    wrapper.appendChild(toggleButton);

    const showPassword = () => {
      input.type = "text";
      toggleButton.classList.add("active");
    };

    const hidePassword = () => {
      input.type = "password";
      toggleButton.classList.remove("active");
    };

    toggleButton.addEventListener("pointerdown", (event) => {
      event.preventDefault();
      showPassword();
    });
    toggleButton.addEventListener("pointerleave", hidePassword);
    toggleButton.addEventListener("blur", hidePassword);

    toggleButton.addEventListener("keydown", (event) => {
      if (event.key === " " || event.key === "Enter") {
        event.preventDefault();
        showPassword();
      }
    });
    toggleButton.addEventListener("keyup", hidePassword);

    document.addEventListener("pointerup", hidePassword);
    document.addEventListener("pointercancel", hidePassword);
  });
}

function setFeedback(element, message, type = "") {
  if (!element) return;
  element.textContent = message;
  element.classList.remove("success", "error");
  if (type) element.classList.add(type);
}

function toggleForgotPanel(panel, button, forceOpen) {
  if (!panel) return;
  const open = typeof forceOpen === "boolean" ? forceOpen : panel.classList.contains("hidden");
  panel.classList.toggle("hidden", !open);
  if (button) button.textContent = open ? "Hide Forgot Password" : "Forgot Password?";
}

function seedOwnerAdminFields() {
  if (ownerAdminEmailText) {
    ownerAdminEmailText.textContent = OWNER_ADMIN_EMAIL;
  }

  [adminEmailInput, adminForgotEmailInput].filter(Boolean).forEach((input) => {
    input.placeholder = OWNER_ADMIN_EMAIL;
    if (!input.value.trim()) {
      input.value = OWNER_ADMIN_EMAIL;
    }
  });
}

async function requestPasswordResetCode(email) {
  const response = await fetch(`${API_BASE}/auth/forgot-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to generate reset code");
  return data;
}

async function submitPasswordResetCode(email, code, newPassword) {
  const response = await fetch(`${API_BASE}/auth/reset-password`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code, newPassword })
  });

  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to reset password");
  return data;
}
function mediaPath(imageUrl) {
  if (!imageUrl) return "";
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl;
  return `${SERVER_BASE}${imageUrl}`;
}

function escapeHtml(value = "") {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/\"/g, "&quot;").replace(/'/g, "&#39;");
}

function shortText(text = "", limit = 130) {
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function statusClass(status = "") {
  const s = status.toLowerCase();
  if (s === "resolved") return "resolved";
  if (s === "in progress") return "progress";
  return "pending";
}

function populateCollegeOptions() {
  const fill = (select, label) => {
    if (!select) return;
    select.innerHTML = `<option value="">${label}</option>`;
    COLLEGES.forEach((college) => {
      const option = document.createElement("option");
      option.value = college;
      option.textContent = college;
      select.appendChild(option);
    });
  };
  fill(collegeSelect, "Choose college");
  fill(filterCollege, "All Colleges");
  fill(adminFilterCollege, "All Colleges");
}
function complaintCardTemplate(complaint) {
  const icon = CATEGORY_ICONS[complaint.category] || CATEGORY_ICONS.Other;
  const image = complaint.imageUrl ? `<img src="${mediaPath(complaint.imageUrl)}" alt="Complaint evidence" />` : "";
  return `
    <article class="complaint-card">
      ${image}
      <h3>${icon} ${escapeHtml(complaint.title)}</h3>
      <p class="meta"><strong>College:</strong> ${escapeHtml(complaint.college)}</p>
      <p class="meta"><strong>Category:</strong> ${escapeHtml(complaint.category)}</p>
      <p>${escapeHtml(shortText(complaint.description))}</p>
      <div class="card-foot">
        <span class="status-badge ${statusClass(complaint.status)}">${escapeHtml(complaint.status)}</span>
        <span class="meta">${escapeHtml(complaint.complaintId)}</span>
      </div>
    </article>
  `;
}

function handleImagePreview() {
  if (!imageInput || !imagePreview) return;
  const file = imageInput.files && imageInput.files[0] ? imageInput.files[0] : null;
  if (!file) {
    imagePreview.classList.add("hidden");
    imagePreview.src = "";
    return;
  }
  if (!file.type.startsWith("image/")) {
    setFeedback(submitMessage, "Only image files are allowed.", "error");
    imageInput.value = "";
    imagePreview.classList.add("hidden");
    imagePreview.src = "";
    return;
  }
  const reader = new FileReader();
  reader.onload = (event) => {
    imagePreview.src = event.target.result;
    imagePreview.classList.remove("hidden");
  };
  reader.readAsDataURL(file);
}

async function handleComplaintSubmit(event) {
  event.preventDefault();
  if (!collegeSelect || !categorySelect || !titleInput || !descriptionInput) return;

  const studentName = studentNameInput ? studentNameInput.value.trim() : "";
  const email = emailInput ? emailInput.value.trim() : "";
  const college = collegeSelect.value;
  const category = categorySelect.value;
  const title = titleInput.value.trim();
  const description = descriptionInput.value.trim();

  if (!college || !category || !title || !description) {
    setFeedback(submitMessage, "College, category, title, and description are required.", "error");
    return;
  }

  const formData = new FormData();
  formData.append("studentName", studentName);
  formData.append("email", email);
  formData.append("isAnonymous", String(!studentName));
  formData.append("college", college);
  formData.append("category", category);
  formData.append("title", title);
  formData.append("description", description);
  if (imageInput?.files?.[0]) formData.append("image", imageInput.files[0]);

  try {
    const response = await fetch(`${API_BASE}/complaints`, { method: "POST", body: formData });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to submit complaint");

    const complaintId = data.complaint ? data.complaint.complaintId : "";
    setFeedback(submitMessage, `Complaint submitted successfully. Complaint ID: ${complaintId}`, "success");
    showToast("Complaint submitted. Redirecting to Home...");

    complaintForm.reset();
    if (imagePreview) {
      imagePreview.classList.add("hidden");
      imagePreview.src = "";
    }
    if (trackComplaintIdInput && complaintId) trackComplaintIdInput.value = complaintId;

    await loadPublicComplaints();
    setTimeout(() => navigate(HOME_ROUTE, { push: true }), 320);
  } catch (error) {
    setFeedback(submitMessage, error.message || "Submission failed", "error");
  }
}

async function loadPublicComplaints() {
  if (!complaintsGrid) return;
  try {
    const params = new URLSearchParams({
      search: searchInput ? searchInput.value.trim() : "",
      college: filterCollege ? filterCollege.value : "",
      category: filterCategory ? filterCategory.value : "",
      status: filterStatus ? filterStatus.value : ""
    });
    const response = await fetch(`${API_BASE}/complaints?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load complaints");

    if (!data.complaints?.length) {
      complaintsGrid.innerHTML = '<div class="empty-state">No complaints found for selected filters.</div>';
      return;
    }

    complaintsGrid.innerHTML = data.complaints.map(complaintCardTemplate).join("");
  } catch (error) {
    complaintsGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "Failed to load complaints")}</div>`;
  }
}

async function handleTrackSubmit(event) {
  event.preventDefault();
  const complaintId = trackComplaintIdInput ? trackComplaintIdInput.value.trim() : "";
  const email = trackEmailInput ? trackEmailInput.value.trim() : "";

  if (!complaintId) {
    trackResult.innerHTML = '<p class="feedback-text error">Complaint ID is required.</p>';
    return;
  }

  try {
    const params = new URLSearchParams({ complaintId, email });
    const response = await fetch(`${API_BASE}/complaints/track?${params.toString()}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to track complaint");

    const complaint = data.complaint;
    const image = complaint.imageUrl ? `<img src="${mediaPath(complaint.imageUrl)}" alt="Complaint evidence" />` : "";

    trackResult.innerHTML = `
      <article class="track-card">
        <h3>${escapeHtml(complaint.title)}</h3>
        <p><strong>Complaint ID:</strong> ${escapeHtml(complaint.complaintId)}</p>
        <p><strong>College:</strong> ${escapeHtml(complaint.college)}</p>
        <p><strong>Category:</strong> ${escapeHtml(complaint.category)}</p>
        <p><strong>Description:</strong> ${escapeHtml(complaint.description)}</p>
        ${image}
        <p><strong>Status:</strong> <span class="status-badge ${statusClass(complaint.status)}">${escapeHtml(complaint.status)}</span></p>
        <p><strong>Admin Comments:</strong> ${escapeHtml(complaint.adminComments || "No updates yet")}</p>
        <p><strong>Submitted:</strong> ${new Date(complaint.createdAt).toLocaleString()}</p>
      </article>
    `;
  } catch (error) {
    trackResult.innerHTML = `<p class="feedback-text error">${escapeHtml(error.message || "Tracking failed")}</p>`;
  }
}

function setUserSession(next) {
  userSession = next;
  if (next) localStorage.setItem(USER_SESSION_KEY, JSON.stringify(next));
  else localStorage.removeItem(USER_SESSION_KEY);
  renderUserSession();
}

function renderUserSession() {
  if (!userProfileCard || !userIdentity || !userAdminStatus || !requestAdminAccessBtn) return;
  if (!userSession?.user) {
    userProfileCard.classList.add("hidden");
    userIdentity.textContent = "";
    userAdminStatus.textContent = "";
    return;
  }

  const user = userSession.user;
  userProfileCard.classList.remove("hidden");
  userIdentity.textContent = `Signed in as: ${user.email}`;
  userAdminStatus.textContent = `Admin Status: ${user.adminStatus || "none"}`;

  const approved = (user.adminStatus || "").toLowerCase() === "approved";
  requestAdminAccessBtn.disabled = approved;
  requestAdminAccessBtn.textContent = approved ? "Admin Permission Approved" : "Request Admin Permission";
}

const userHeaders = () => (userSession?.token ? { Authorization: `Bearer ${userSession.token}` } : {});

async function handleUserSignup(event) {
  event.preventDefault();
  const payload = {
    name: signupNameInput ? signupNameInput.value.trim() : "",
    email: signupEmailInput ? signupEmailInput.value.trim() : "",
    password: signupPasswordInput ? signupPasswordInput.value : ""
  };

  try {
    const response = await fetch(`${API_BASE}/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Sign up failed");

    setFeedback(userAuthMessage, data.message || "Sign up successful. Please sign in.", "success");
    showToast("User signup successful");
    userSignupForm.reset();
  } catch (error) {
    setFeedback(userAuthMessage, error.message || "Sign up failed", "error");
  }
}

async function handleUserLogin(event) {
  event.preventDefault();
  const payload = {
    email: loginEmailInput ? loginEmailInput.value.trim() : "",
    password: loginPasswordInput ? loginPasswordInput.value : ""
  };

  try {
    const response = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Sign in failed");

    setUserSession({ token: data.token, user: data.user });
    setFeedback(userAuthMessage, "User signed in successfully.", "success");
    showToast("User signed in");
    userLoginForm.reset();
  } catch (error) {
    setFeedback(userAuthMessage, error.message || "Sign in failed", "error");
  }
}

async function handleUserLogout() {
  try {
    if (userSession?.token) await fetch(`${API_BASE}/auth/logout`, { method: "POST", headers: { ...userHeaders() } });
  } catch (_error) {
    // Ignore
  }
  setUserSession(null);
  setFeedback(userAuthMessage, "User logged out.", "success");
}

async function handleUserForgotRequest(event) {
  event.preventDefault();
  const email = forgotEmailInput ? forgotEmailInput.value.trim() : "";

  if (!email) {
    setFeedback(forgotPasswordMessage, "Please enter your email", "error");
    return;
  }

  try {
    const data = await requestPasswordResetCode(email);
    let message = `Reset code sent to ${email}. Please check your Gmail inbox/spam.`;

    if (data.resetCode) {
      message = `Reset code: ${data.resetCode} (valid for 15 minutes)`;
      showToast("Reset code generated");
    }

    setFeedback(forgotPasswordMessage, message, "success");

    if (resetCodeInput) resetCodeInput.focus();
  } catch (error) {
    setFeedback(forgotPasswordMessage, error.message || "Unable to generate reset code", "error");
  }
}

async function handleUserResetPassword(event) {
  event.preventDefault();

  const email = forgotEmailInput ? forgotEmailInput.value.trim() : "";
  const code = resetCodeInput ? resetCodeInput.value.trim() : "";
  const newPassword = resetNewPasswordInput ? resetNewPasswordInput.value : "";

  if (!email || !code || !newPassword) {
    setFeedback(forgotPasswordMessage, "Email, reset code, and new password are required", "error");
    return;
  }

  try {
    await submitPasswordResetCode(email, code, newPassword);
    setFeedback(forgotPasswordMessage, "Password updated successfully. You can now sign in.", "success");
    showToast("Password updated");

    if (loginEmailInput) loginEmailInput.value = email;
    if (loginPasswordInput) loginPasswordInput.value = "";
    if (userResetPasswordForm) userResetPasswordForm.reset();
    if (loginPasswordInput) loginPasswordInput.focus();
  } catch (error) {
    setFeedback(forgotPasswordMessage, error.message || "Unable to reset password", "error");
  }
}

async function handleAdminForgotRequest(event) {
  event.preventDefault();
  const email = adminForgotEmailInput ? adminForgotEmailInput.value.trim() : "";

  if (!email) {
    setFeedback(adminForgotPasswordMessage, "Please enter admin email", "error");
    return;
  }

  try {
    const data = await requestPasswordResetCode(email);
    let message = `Reset code sent to ${email}. Please check your Gmail inbox/spam.`;

    if (data.resetCode) {
      message = `Reset code: ${data.resetCode} (valid for 15 minutes)`;
      showToast("Admin reset code generated");
    }

    setFeedback(adminForgotPasswordMessage, message, "success");
    if (adminResetCodeInput) adminResetCodeInput.focus();
  } catch (error) {
    setFeedback(adminForgotPasswordMessage, error.message || "Unable to generate reset code", "error");
  }
}

async function handleAdminResetPassword(event) {
  event.preventDefault();

  const email = adminForgotEmailInput ? adminForgotEmailInput.value.trim() : "";
  const code = adminResetCodeInput ? adminResetCodeInput.value.trim() : "";
  const newPassword = adminNewPasswordInput ? adminNewPasswordInput.value : "";

  if (!email || !code || !newPassword) {
    setFeedback(adminForgotPasswordMessage, "Email, reset code, and new password are required", "error");
    return;
  }

  try {
    await submitPasswordResetCode(email, code, newPassword);
    setFeedback(adminForgotPasswordMessage, "Admin password updated. Sign in with the new password.", "success");
    showToast("Admin password updated");

    if (adminEmailInput) adminEmailInput.value = email;
    if (adminPasswordInput) adminPasswordInput.value = "";
    if (adminResetPasswordForm) adminResetPasswordForm.reset();
    if (adminPasswordInput) adminPasswordInput.focus();
  } catch (error) {
    setFeedback(adminForgotPasswordMessage, error.message || "Unable to reset password", "error");
  }
}
async function handleRequestAdminAccess() {
  if (!userSession?.token) {
    setFeedback(userAuthMessage, "Please sign in as user first.", "error");
    return;
  }
  try {
    const response = await fetch(`${API_BASE}/auth/request-admin`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...userHeaders() }
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to request admin access");

    setUserSession({ token: userSession.token, user: data.user });
    setFeedback(userAuthMessage, data.message, "success");
  } catch (error) {
    setFeedback(userAuthMessage, error.message || "Unable to request admin access", "error");
  }
}
function setAdminSession(next) {
  adminSession = next;
  if (next) localStorage.setItem(ADMIN_SESSION_KEY, JSON.stringify(next));
  else localStorage.removeItem(ADMIN_SESSION_KEY);
  renderAdminSession();
}

function renderAdminSession() {
  if (!adminPanel || !adminIdentity || !adminRequestsPanel) return;
  if (!adminSession?.token) {
    adminPanel.classList.add("hidden");
    adminIdentity.textContent = "";
    adminRequestsPanel.classList.add("hidden");
    return;
  }

  adminPanel.classList.remove("hidden");
  adminIdentity.textContent = `Signed in as: ${adminSession.email}${adminSession.isOwner ? " (Owner)" : ""}`;
  adminRequestsPanel.classList.toggle("hidden", !adminSession.isOwner);
}

const adminHeaders = () => (adminSession?.token ? { Authorization: `Bearer ${adminSession.token}` } : {});

async function handleAdminLogin(event) {
  event.preventDefault();
  const emailValue = adminEmailInput ? adminEmailInput.value.trim() : "";
  const payload = {
    username: emailValue,
    email: emailValue,
    password: adminPasswordInput ? adminPasswordInput.value : ""
  };

  try {
    const response = await fetch(`${API_BASE}/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Admin sign in failed");

    setAdminSession({ token: data.token, email: data.email, isOwner: Boolean(data.isOwner) });
    setFeedback(adminLoginMessage, "Admin signed in successfully.", "success");
    showToast("Admin signed in");
    adminLoginForm.reset();
    seedOwnerAdminFields();

    await loadAdminComplaints();
    if (adminSession.isOwner) await loadAdminRequests();
  } catch (error) {
    setFeedback(adminLoginMessage, error.message || "Admin sign in failed", "error");
  }
}

async function handleAdminLogout() {
  try {
    if (adminSession?.token) await fetch(`${API_BASE}/admin/logout`, { method: "POST", headers: { ...adminHeaders() } });
  } catch (_error) {
    // Ignore
  }
  setAdminSession(null);
  seedOwnerAdminFields();
  setFeedback(adminLoginMessage, "Admin logged out.", "success");
}

function adminCardTemplate(complaint) {
  const image = complaint.imageUrl ? `<img src="${mediaPath(complaint.imageUrl)}" alt="Complaint evidence" />` : "";
  return `
    <article class="complaint-card" data-id="${escapeHtml(complaint.complaintId)}">
      ${image}
      <h3>${escapeHtml(complaint.title)}</h3>
      <p class="meta"><strong>ID:</strong> ${escapeHtml(complaint.complaintId)}</p>
      <p class="meta"><strong>Student:</strong> ${escapeHtml(complaint.studentName || "Anonymous User")}</p>
      <p class="meta"><strong>Email:</strong> ${escapeHtml(complaint.email || "Not provided")}</p>
      <p class="meta"><strong>College:</strong> ${escapeHtml(complaint.college)}</p>
      <p class="meta"><strong>Category:</strong> ${escapeHtml(complaint.category)}</p>
      <p>${escapeHtml(shortText(complaint.description, 170))}</p>
      <div class="admin-action-card">
        <label>Status
          <select class="admin-status">
            <option value="Pending" ${complaint.status === "Pending" ? "selected" : ""}>Pending</option>
            <option value="In Progress" ${complaint.status === "In Progress" ? "selected" : ""}>In Progress</option>
            <option value="Resolved" ${complaint.status === "Resolved" ? "selected" : ""}>Resolved</option>
          </select>
        </label>
        <label>Admin Comments / Update
          <textarea class="admin-comments" rows="3" placeholder="Add action comments">${escapeHtml(complaint.adminComments || "")}</textarea>
        </label>
        <div class="actions-row">
          <button type="button" class="primary-btn save-complaint" disabled>Save Update</button>
          <button type="button" class="secondary-btn delete-complaint">Delete</button>
        </div>
      </div>
    </article>
  `;
}

const normalizeAdminComment = (v) => (v || "").trim();

function isAdminCardDirty(article) {
  const statusInput = article.querySelector(".admin-status");
  const commentInput = article.querySelector(".admin-comments");
  if (!statusInput || !commentInput) return false;
  const savedStatus = article.dataset.savedStatus || "";
  const savedComments = article.dataset.savedComments || "";
  return statusInput.value !== savedStatus || normalizeAdminComment(commentInput.value) !== savedComments;
}

function updateAdminSaveButtonState(article) {
  const saveButton = article.querySelector(".save-complaint");
  if (!saveButton) return;
  const dirty = isAdminCardDirty(article);
  saveButton.classList.toggle("is-dirty", dirty);
  saveButton.disabled = !dirty;
}

function setAdminCardBaseline(article) {
  const statusInput = article.querySelector(".admin-status");
  const commentInput = article.querySelector(".admin-comments");
  article.dataset.savedStatus = statusInput ? statusInput.value : "";
  article.dataset.savedComments = commentInput ? normalizeAdminComment(commentInput.value) : "";
  updateAdminSaveButtonState(article);
}

function initializeAdminSaveStates() {
  if (!adminComplaintsGrid) return;
  adminComplaintsGrid.querySelectorAll(".complaint-card").forEach((article) => setAdminCardBaseline(article));
}

async function loadAdminComplaints() {
  if (!adminComplaintsGrid || !adminSession?.token) return;
  try {
    const params = new URLSearchParams({
      search: adminSearchInput ? adminSearchInput.value.trim() : "",
      college: adminFilterCollege ? adminFilterCollege.value : "",
      status: adminFilterStatus ? adminFilterStatus.value : ""
    });
    const response = await fetch(`${API_BASE}/admin/complaints?${params.toString()}`, { headers: { ...adminHeaders() } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load admin complaints");

    if (!data.complaints?.length) {
      adminComplaintsGrid.innerHTML = '<div class="empty-state">No complaints found.</div>';
      return;
    }

    adminComplaintsGrid.innerHTML = data.complaints.map(adminCardTemplate).join("");
    initializeAdminSaveStates();
  } catch (error) {
    adminComplaintsGrid.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "Unable to load admin complaints")}</div>`;
  }
}

async function updateComplaint(complaintId, status, adminComments) {
  const response = await fetch(`${API_BASE}/admin/complaints/${encodeURIComponent(complaintId)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ status, adminComments })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to update complaint");
  return data;
}

async function deleteComplaint(complaintId) {
  const response = await fetch(`${API_BASE}/admin/complaints/${encodeURIComponent(complaintId)}`, { method: "DELETE", headers: { ...adminHeaders() } });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to delete complaint");
  return data;
}

function renderAdminRequests(requests) {
  if (!adminRequestsList) return;
  if (!requests.length) {
    adminRequestsList.innerHTML = '<div class="empty-state">No pending admin access requests.</div>';
    return;
  }

  adminRequestsList.innerHTML = requests.map((request) => `
      <article class="request-item" data-email="${escapeHtml(request.email)}">
        <strong>${escapeHtml(request.name || "Unnamed User")}</strong>
        <p class="line">Email: ${escapeHtml(request.email)}</p>
        <p class="line">Requested: ${new Date(request.updatedAt || request.createdAt).toLocaleString()}</p>
        <div class="actions-row">
          <button type="button" class="primary-btn request-approve">Approve</button>
          <button type="button" class="secondary-btn request-reject">Reject</button>
        </div>
      </article>
    `).join("");
}

async function loadAdminRequests() {
  if (!adminSession?.token || !adminSession.isOwner || !adminRequestsList) return;
  try {
    const response = await fetch(`${API_BASE}/admin/access-requests`, { headers: { ...adminHeaders() } });
    const data = await response.json();
    if (!response.ok) throw new Error(data.message || "Unable to load admin requests");
    renderAdminRequests(data.requests || []);
  } catch (error) {
    adminRequestsList.innerHTML = `<div class="empty-state">${escapeHtml(error.message || "Failed to load access requests")}</div>`;
  }
}

async function updateAdminRequest(email, status) {
  const response = await fetch(`${API_BASE}/admin/access-requests/${encodeURIComponent(email)}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", ...adminHeaders() },
    body: JSON.stringify({ status })
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.message || "Unable to update request");
  return data;
}

function attachNavigationEvents() {
  routeLinks.forEach((link) => link.addEventListener("click", (e) => {
    e.preventDefault();
    navigate(link.dataset.routeLink, { push: true });
  }));

  sectionJumpButtons.forEach((button) => button.addEventListener("click", () => navigate(button.dataset.targetRoute, { push: true })));

  if (menuButton) menuButton.addEventListener("click", () => setMenuState(menuButton.getAttribute("aria-expanded") !== "true"));
  if (themeToggle) themeToggle.addEventListener("click", () => applyTheme(document.body.classList.contains("dark-mode") ? "light" : "dark"));

  if (backButton) {
    backButton.addEventListener("click", () => {
      if (window.history.length > 1) window.history.back();
      else navigate(HOME_ROUTE, { push: false });
    });
  }

  document.addEventListener("click", (event) => {
    if (!mainNav || !menuButton) return;
    const withinNav = event.target.closest("#mainNav") || event.target.closest("#menuButton");
    if (!withinNav) setMenuState(false);
  });

  window.addEventListener("popstate", (event) => {
    const route = event.state?.route || getRouteFromLocation();
    renderRoute(route);
  });

  window.addEventListener("hashchange", () => {
    const route = getRouteFromLocation();
    if (route !== currentRoute) navigate(route, { push: false });
  });
}

function attachFormEvents() {
  if (imageInput) imageInput.addEventListener("change", handleImagePreview);
  if (complaintForm) complaintForm.addEventListener("submit", handleComplaintSubmit);
  if (trackForm) trackForm.addEventListener("submit", handleTrackSubmit);

  [searchInput, filterCollege, filterCategory, filterStatus].filter(Boolean).forEach((element) => {
    element.addEventListener("input", loadPublicComplaints);
    element.addEventListener("change", loadPublicComplaints);
  });

  if (userSignupForm) userSignupForm.addEventListener("submit", handleUserSignup);
  if (userLoginForm) userLoginForm.addEventListener("submit", handleUserLogin);
  if (requestAdminAccessBtn) requestAdminAccessBtn.addEventListener("click", handleRequestAdminAccess);
  if (userLogoutBtn) userLogoutBtn.addEventListener("click", handleUserLogout);

  if (toggleUserForgotPanelBtn) {
    toggleUserForgotPanelBtn.addEventListener("click", () => {
      if (forgotEmailInput && loginEmailInput && !forgotEmailInput.value.trim()) {
        forgotEmailInput.value = loginEmailInput.value.trim();
      }
      toggleForgotPanel(userForgotPanel, toggleUserForgotPanelBtn);
    });
  }

  if (userForgotRequestForm) userForgotRequestForm.addEventListener("submit", handleUserForgotRequest);
  if (userResetPasswordForm) userResetPasswordForm.addEventListener("submit", handleUserResetPassword);

  if (adminLoginForm) adminLoginForm.addEventListener("submit", handleAdminLogin);
  if (adminLogoutBtn) adminLogoutBtn.addEventListener("click", handleAdminLogout);

  if (toggleAdminForgotPanelBtn) {
    toggleAdminForgotPanelBtn.addEventListener("click", () => {
      if (adminForgotEmailInput && adminEmailInput && !adminForgotEmailInput.value.trim()) {
        adminForgotEmailInput.value = adminEmailInput.value.trim();
      }
      toggleForgotPanel(adminForgotPanel, toggleAdminForgotPanelBtn);
    });
  }

  if (adminForgotRequestForm) adminForgotRequestForm.addEventListener("submit", handleAdminForgotRequest);
  if (adminResetPasswordForm) adminResetPasswordForm.addEventListener("submit", handleAdminResetPassword);
  if (useOwnerAdminBtn) {
    useOwnerAdminBtn.addEventListener("click", () => {
      if (adminEmailInput) {
        adminEmailInput.value = OWNER_ADMIN_EMAIL;
        adminEmailInput.focus();
      }
      if (adminForgotEmailInput && !adminForgotEmailInput.value.trim()) {
        adminForgotEmailInput.value = OWNER_ADMIN_EMAIL;
      }
      setFeedback(adminLoginMessage, `Owner admin email loaded: ${OWNER_ADMIN_EMAIL}`, "success");
    });
  }

  [adminSearchInput, adminFilterCollege, adminFilterStatus].filter(Boolean).forEach((element) => {
    element.addEventListener("input", loadAdminComplaints);
    element.addEventListener("change", loadAdminComplaints);
  });

  if (adminComplaintsGrid) {
    adminComplaintsGrid.addEventListener("input", (event) => {
      if (!event.target.matches(".admin-comments")) return;
      const article = event.target.closest(".complaint-card");
      if (article) updateAdminSaveButtonState(article);
    });

    adminComplaintsGrid.addEventListener("change", (event) => {
      if (!event.target.matches(".admin-status")) return;
      const article = event.target.closest(".complaint-card");
      if (article) updateAdminSaveButtonState(article);
    });

    adminComplaintsGrid.addEventListener("click", async (event) => {
      const article = event.target.closest(".complaint-card");
      if (!article) return;
      const complaintId = article.dataset.id;

      if (event.target.closest(".save-complaint")) {
        const status = article.querySelector(".admin-status").value;
        const adminComments = article.querySelector(".admin-comments").value.trim();
        try {
          await updateComplaint(complaintId, status, adminComments);
          setAdminCardBaseline(article);
          setFeedback(adminActionMessage, `Updated ${complaintId} successfully.`, "success");
          await Promise.all([loadAdminComplaints(), loadPublicComplaints()]);
        } catch (error) {
          setFeedback(adminActionMessage, error.message || "Update failed", "error");
        }
      }

      if (event.target.closest(".delete-complaint")) {
        if (!window.confirm("Delete this complaint permanently?")) return;
        try {
          await deleteComplaint(complaintId);
          setFeedback(adminActionMessage, `Deleted ${complaintId}.`, "success");
          await Promise.all([loadAdminComplaints(), loadPublicComplaints()]);
        } catch (error) {
          setFeedback(adminActionMessage, error.message || "Delete failed", "error");
        }
      }
    });
  }

  if (adminRequestsList) {
    adminRequestsList.addEventListener("click", async (event) => {
      const requestCard = event.target.closest(".request-item");
      if (!requestCard) return;
      const email = requestCard.dataset.email;

      try {
        if (event.target.closest(".request-approve")) {
          await updateAdminRequest(email, "approved");
          setFeedback(adminActionMessage, `Approved admin access for ${email}`, "success");
          await loadAdminRequests();
        } else if (event.target.closest(".request-reject")) {
          await updateAdminRequest(email, "rejected");
          setFeedback(adminActionMessage, `Rejected admin access for ${email}`, "success");
          await loadAdminRequests();
        }
      } catch (error) {
        setFeedback(adminActionMessage, error.message || "Failed to update request", "error");
      }
    });
  }
}

async function init() {
  populateCollegeOptions();
  initializePasswordVisibilityToggles();
  applyTheme(localStorage.getItem(THEME_KEY) || "light");
  seedOwnerAdminFields();

  attachNavigationEvents();
  attachFormEvents();

  renderUserSession();
  renderAdminSession();

  const initialRoute = getRouteFromLocation();
  window.history.replaceState({ route: initialRoute }, "", routeHash(initialRoute));
  renderRoute(initialRoute);

  await loadPublicComplaints();
}

init();

