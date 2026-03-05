const fs = require("fs/promises");
const path = require("path");
const supabase = require("../lib/supabaseClient");

const TABLE_NAME = "complaints";
const fallbackDataDirectory = path.join(__dirname, "..", "data");
const fallbackDataFile = path.join(fallbackDataDirectory, "complaints.json");

function buildComplaintId(existingIds = new Set()) {
  let id = "";
  do {
    const random = Math.floor(100 + Math.random() * 900);
    id = `IND-CMP-${Date.now().toString(36).toUpperCase()}-${random}`;
  } while (existingIds.has(id));

  return id;
}

function mapRowToComplaint(row) {
  if (!row) {
    return null;
  }

  return {
    complaintId: row.complaint_id,
    studentName: row.student_name || "",
    isAnonymous: Boolean(row.is_anonymous),
    email: row.email || "",
    college: row.college,
    title: row.title,
    description: row.description,
    category: row.category,
    imageUrl: row.image_url || "",
    status: row.status,
    adminComments: row.admin_comments || "",
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function applySearchFilter(records, search) {
  const query = (search || "").trim().toLowerCase();
  if (!query) {
    return records;
  }

  return records.filter((item) => {
    const haystack = [item.title, item.description, item.college, item.complaintId].join(" ").toLowerCase();
    return haystack.includes(query);
  });
}

function isConnectivityError(error) {
  const message = `${error && error.message ? error.message : ""} ${error && error.details ? error.details : ""}`.toLowerCase();
  return (
    message.includes("fetch failed") ||
    message.includes("enotfound") ||
    message.includes("econnrefused") ||
    message.includes("etimedout") ||
    message.includes("network")
  );
}

async function ensureFallbackStore() {
  await fs.mkdir(fallbackDataDirectory, { recursive: true });
  try {
    await fs.access(fallbackDataFile);
  } catch (_error) {
    await fs.writeFile(fallbackDataFile, "[]", "utf-8");
  }
}

async function readFallbackRecords() {
  await ensureFallbackStore();
  const content = await fs.readFile(fallbackDataFile, "utf-8");
  return JSON.parse(content || "[]");
}

async function writeFallbackRecords(records) {
  await fs.writeFile(fallbackDataFile, JSON.stringify(records, null, 2), "utf-8");
}

function applyFallbackFilters(records, filters = {}) {
  const { college, category, status, search } = filters;
  const filtered = records.filter((item) => {
    const collegeOk = college ? item.college === college : true;
    const categoryOk = category ? item.category === category : true;
    const statusOk = status ? item.status === status : true;
    return collegeOk && categoryOk && statusOk;
  });

  return applySearchFilter(filtered, search).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

async function createInFallback(payload) {
  const records = await readFallbackRecords();
  const existingIds = new Set(records.map((item) => item.complaintId));
  const now = new Date().toISOString();

  const complaint = {
    complaintId: buildComplaintId(existingIds),
    studentName: payload.studentName || "",
    isAnonymous: Boolean(payload.isAnonymous),
    email: payload.email || "",
    college: payload.college,
    title: payload.title,
    description: payload.description,
    category: payload.category,
    imageUrl: payload.imageUrl || "",
    status: "Pending",
    adminComments: "",
    createdAt: now,
    updatedAt: now
  };

  records.push(complaint);
  await writeFallbackRecords(records);
  return complaint;
}

async function listFromFallback(filters = {}) {
  const records = await readFallbackRecords();
  return applyFallbackFilters(records, filters);
}

async function findInFallbackByComplaintId(complaintId) {
  const records = await readFallbackRecords();
  return (
    records.find(
      (item) => String(item.complaintId || "").toLowerCase() === String(complaintId || "").trim().toLowerCase()
    ) || null
  );
}

async function updateInFallback(complaintId, updates) {
  const records = await readFallbackRecords();
  const index = records.findIndex(
    (item) => String(item.complaintId || "").toLowerCase() === String(complaintId || "").trim().toLowerCase()
  );

  if (index === -1) {
    return null;
  }

  records[index] = {
    ...records[index],
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await writeFallbackRecords(records);
  return records[index];
}

async function deleteFromFallback(complaintId) {
  const records = await readFallbackRecords();
  const index = records.findIndex(
    (item) => String(item.complaintId || "").toLowerCase() === String(complaintId || "").trim().toLowerCase()
  );

  if (index === -1) {
    return null;
  }

  const removed = records.splice(index, 1)[0];
  await writeFallbackRecords(records);
  return removed;
}

async function createInSupabase(payload, retries = 4) {
  for (let attempt = 0; attempt < retries; attempt += 1) {
    const complaintId = buildComplaintId();

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert({
        complaint_id: complaintId,
        student_name: payload.studentName || "",
        is_anonymous: Boolean(payload.isAnonymous),
        email: payload.email || "",
        college: payload.college,
        title: payload.title,
        description: payload.description,
        category: payload.category,
        image_url: payload.imageUrl || "",
        status: "Pending",
        admin_comments: ""
      })
      .select("*")
      .single();

    if (!error) {
      return mapRowToComplaint(data);
    }

    if ((error.code === "23505" || String(error.message || "").toLowerCase().includes("duplicate")) && attempt < retries - 1) {
      continue;
    }

    throw error;
  }

  throw new Error("Unable to generate unique complaint ID");
}

class Complaint {
  static async create(payload) {
    try {
      return await createInSupabase(payload);
    } catch (error) {
      if (isConnectivityError(error)) {
        return createInFallback(payload);
      }
      throw new Error(error.message || "Failed to create complaint");
    }
  }

  static async list(filters = {}) {
    try {
      let query = supabase.from(TABLE_NAME).select("*").order("created_at", { ascending: false });

      if (filters.college) {
        query = query.eq("college", filters.college);
      }

      if (filters.category) {
        query = query.eq("category", filters.category);
      }

      if (filters.status) {
        query = query.eq("status", filters.status);
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      const mapped = (data || []).map(mapRowToComplaint);
      return applySearchFilter(mapped, filters.search);
    } catch (error) {
      if (isConnectivityError(error)) {
        return listFromFallback(filters);
      }
      throw new Error(error.message || "Failed to fetch complaints");
    }
  }

  static async findByComplaintId(complaintId) {
    try {
      const normalizedId = (complaintId || "").trim().toUpperCase();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select("*")
        .eq("complaint_id", normalizedId)
        .maybeSingle();

      if (error) {
        throw error;
      }

      return mapRowToComplaint(data);
    } catch (error) {
      if (isConnectivityError(error)) {
        return findInFallbackByComplaintId(complaintId);
      }
      throw new Error(error.message || "Failed to fetch complaint");
    }
  }

  static async updateByComplaintId(complaintId, updates) {
    try {
      const normalizedId = (complaintId || "").trim().toUpperCase();
      const updatePayload = {};

      if (Object.prototype.hasOwnProperty.call(updates, "status")) {
        updatePayload.status = updates.status;
      }

      if (Object.prototype.hasOwnProperty.call(updates, "adminComments")) {
        updatePayload.admin_comments = updates.adminComments || "";
      }

      if (Object.prototype.hasOwnProperty.call(updates, "imageUrl")) {
        updatePayload.image_url = updates.imageUrl || "";
      }

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .update(updatePayload)
        .eq("complaint_id", normalizedId)
        .select("*")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return mapRowToComplaint(data);
    } catch (error) {
      if (isConnectivityError(error)) {
        return updateInFallback(complaintId, updates);
      }
      throw new Error(error.message || "Failed to update complaint");
    }
  }

  static async deleteByComplaintId(complaintId) {
    try {
      const normalizedId = (complaintId || "").trim().toUpperCase();

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .delete()
        .eq("complaint_id", normalizedId)
        .select("*")
        .maybeSingle();

      if (error) {
        throw error;
      }

      return mapRowToComplaint(data);
    } catch (error) {
      if (isConnectivityError(error)) {
        return deleteFromFallback(complaintId);
      }
      throw new Error(error.message || "Failed to delete complaint");
    }
  }
}

module.exports = Complaint;
