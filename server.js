const express = require("express");
const multer = require("multer");
const fs = require("fs/promises");
const path = require("path");
const crypto = require("crypto");

const app = express();

const PORT = process.env.PORT || 3000;
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, "data");
const CONTENT_FILE = path.join(DATA_DIR, "content.json");
const UPLOAD_DIR = path.join(DATA_DIR, "uploads");
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || "change-me";

const DEFAULT_CONTENT = {
  meta: {
    businessName: "Atelier Menuiserie Dupont",
    phone: "06 00 00 00 00",
    email: "contact@menuiserie-dupont.fr"
  },
  hero: {
    title: "Votre menuisier sur mesure",
    subtitle:
      "Fenêtres, portes, escaliers et agencements intérieurs avec finitions soignées."
  },
  about:
    "Nous accompagnons les particuliers et professionnels sur des projets de menuiserie bois, PVC et aluminium. Conseils, prise de cotes, fabrication et pose.",
  services: [
    {
      title: "Fabrication sur mesure",
      description:
        "Conception et réalisation de menuiseries adaptées à vos dimensions et à votre style."
    },
    {
      title: "Rénovation",
      description:
        "Remplacement de menuiseries existantes avec amélioration de l'isolation et du confort."
    },
    {
      title: "Pose et finitions",
      description:
        "Installation propre, réglages précis et finitions pour un résultat durable."
    }
  ],
  cta: "Demandez un devis gratuit sous 48h.",
  gallery: []
};

const IMAGE_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".gif", ".avif"]);

app.use(express.json({ limit: "1mb" }));

function cleanText(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function mergeText(value, fallback, maxLength = 1000) {
  if (typeof value !== "string") return fallback;
  return cleanText(value, maxLength);
}

function cleanService(service) {
  if (!service || typeof service !== "object") return null;
  const title = cleanText(service.title, 80);
  const description = cleanText(service.description, 240);
  if (!title && !description) return null;
  return { title, description };
}

function cleanGalleryItem(item) {
  if (!item || typeof item !== "object") return null;
  const url = cleanText(item.url, 255);
  if (!url.startsWith("/uploads/")) return null;
  const alt = cleanText(item.alt, 140);
  return { url, alt: alt || "Photo réalisation" };
}

function sanitizeFilename(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9.-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^[-.]+|[-.]+$/g, "");
}

async function ensureStorage() {
  await fs.mkdir(UPLOAD_DIR, { recursive: true });
  try {
    await fs.access(CONTENT_FILE);
  } catch {
    await saveContent(DEFAULT_CONTENT);
  }
}

async function loadContent() {
  const raw = await fs.readFile(CONTENT_FILE, "utf8");
  const parsed = JSON.parse(raw);
  return normalizeContent(parsed);
}

function normalizeContent(content) {
  const base = { ...DEFAULT_CONTENT, ...(content || {}) };
  const normalized = {
    meta: {
      businessName: mergeText(base.meta?.businessName, DEFAULT_CONTENT.meta.businessName, 80),
      phone: mergeText(base.meta?.phone, DEFAULT_CONTENT.meta.phone, 40),
      email: mergeText(base.meta?.email, DEFAULT_CONTENT.meta.email, 120)
    },
    hero: {
      title: mergeText(base.hero?.title, DEFAULT_CONTENT.hero.title, 90),
      subtitle: mergeText(base.hero?.subtitle, DEFAULT_CONTENT.hero.subtitle, 220)
    },
    about: mergeText(base.about, DEFAULT_CONTENT.about, 1000),
    services: Array.isArray(base.services)
      ? base.services.map(cleanService).filter(Boolean).slice(0, 8)
      : DEFAULT_CONTENT.services,
    cta: mergeText(base.cta, DEFAULT_CONTENT.cta, 180),
    gallery: Array.isArray(base.gallery)
      ? base.gallery.map(cleanGalleryItem).filter(Boolean)
      : []
  };

  if (!normalized.services.length) {
    normalized.services = DEFAULT_CONTENT.services;
  }
  return normalized;
}

async function saveContent(content) {
  const normalized = normalizeContent(content);
  const tempFile = `${CONTENT_FILE}.tmp`;
  await fs.writeFile(tempFile, JSON.stringify(normalized, null, 2), "utf8");
  await fs.rename(tempFile, CONTENT_FILE);
  return normalized;
}

function requireAdmin(req, res, next) {
  const token = req.get("x-admin-token");
  if (!token || token !== ADMIN_TOKEN) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  return next();
}

const storage = multer.diskStorage({
  destination: async (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const original = sanitizeFilename(file.originalname || "photo");
    const extension = path.extname(original);
    const safeExtension = IMAGE_EXTENSIONS.has(extension) ? extension : ".jpg";
    const baseName = path.basename(original, extension) || "photo";
    const unique = `${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;
    cb(null, `${baseName}-${unique}${safeExtension}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const extension = path.extname(file.originalname.toLowerCase());
    if (!IMAGE_EXTENSIONS.has(extension)) {
      return cb(new Error("Only image files are allowed"));
    }
    cb(null, true);
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/content", async (_req, res) => {
  try {
    const content = await loadContent();
    res.json(content);
  } catch (error) {
    res.status(500).json({ error: "Unable to load content", detail: error.message });
  }
});

app.put("/api/content", requireAdmin, async (req, res) => {
  try {
    const current = await loadContent();
    const incoming = req.body || {};

    const updated = {
      ...current,
      meta: {
        businessName: mergeText(incoming.meta?.businessName, current.meta.businessName, 80),
        phone: mergeText(incoming.meta?.phone, current.meta.phone, 40),
        email: mergeText(incoming.meta?.email, current.meta.email, 120)
      },
      hero: {
        title: mergeText(incoming.hero?.title, current.hero.title, 90),
        subtitle: mergeText(incoming.hero?.subtitle, current.hero.subtitle, 220)
      },
      about: mergeText(incoming.about, current.about, 1000),
      cta: mergeText(incoming.cta, current.cta, 180),
      services: Array.isArray(incoming.services)
        ? incoming.services.map(cleanService).filter(Boolean).slice(0, 8)
        : current.services
    };

    if (Array.isArray(incoming.gallery)) {
      updated.gallery = incoming.gallery.map(cleanGalleryItem).filter(Boolean);
    }

    const saved = await saveContent(updated);
    res.json(saved);
  } catch (error) {
    res.status(500).json({ error: "Unable to save content", detail: error.message });
  }
});

app.post("/api/upload", requireAdmin, upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "Photo is required" });
    }

    const content = await loadContent();
    const alt = cleanText(req.body.alt || req.file.originalname, 140) || "Photo réalisation";
    const entry = { url: `/uploads/${req.file.filename}`, alt };

    content.gallery.push(entry);
    const saved = await saveContent(content);

    return res.status(201).json({
      uploaded: entry,
      gallery: saved.gallery
    });
  } catch (error) {
    return res.status(500).json({ error: "Upload failed", detail: error.message });
  }
});

app.delete("/api/upload/:filename", requireAdmin, async (req, res) => {
  try {
    const filename = sanitizeFilename(req.params.filename || "");
    if (!filename) {
      return res.status(400).json({ error: "Invalid filename" });
    }

    const filepath = path.join(UPLOAD_DIR, filename);
    await fs.rm(filepath, { force: true });

    const content = await loadContent();
    content.gallery = content.gallery.filter((item) => item.url !== `/uploads/${filename}`);
    const saved = await saveContent(content);

    return res.json({ deleted: filename, gallery: saved.gallery });
  } catch (error) {
    return res.status(500).json({ error: "Delete failed", detail: error.message });
  }
});

app.use((error, _req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ error: "Image too large (max 8 MB)" });
    }
    return res.status(400).json({ error: error.message });
  }
  if (error && error.message === "Only image files are allowed") {
    return res.status(400).json({ error: "Only image files are allowed" });
  }
  return next(error);
});

app.use("/uploads", express.static(UPLOAD_DIR));
app.use(express.static(path.join(__dirname, "public")));

app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({ error: "Not found" });
  }
  return res.sendFile(path.join(__dirname, "public", "index.html"));
});

async function start() {
  try {
    await ensureStorage();
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

start();
