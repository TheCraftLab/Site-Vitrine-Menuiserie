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
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "change-me";

const DEFAULT_CONTENT = {
  meta: {
    businessName: "Atelier Menuiserie Dupont",
    phone: "06 00 00 00 00",
    email: "contact@menuiserie-dupont.fr"
  },
  hero: {
    eyebrow: "Agencement, renovation, sur mesure",
    title: "Votre menuisier sur mesure",
    subtitle: "Fenêtres, portes, parquets et agencements intérieurs avec finitions soignées.",
    primaryCta: "Demander un devis",
    secondaryCta: "Voir les realisations",
    panelTitle: "Finition nette. Delais tenus.",
    highlights: [
      "Intervention locale rapide",
      "Materiaux bois, PVC, aluminium",
      "Pose et details soignes"
    ]
  },
  about:
    "J'accompagne les particuliers et professionnels sur des projets de menuiserie bois, PVC et aluminium. Conseils, prise de cotes et pose.",
  aboutSection: {
    kicker: "L'atelier",
    title: "Un style precis, une execution propre",
    cards: [
      {
        title: "Etude technique",
        description: "Prise de cotes, conseil materiaux et contraintes du bati."
      },
      {
        title: "Fabrication adaptee",
        description: "Details ajustes a votre interieur et a votre usage quotidien."
      }
    ]
  },
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
const ADMIN_REALM = 'Basic realm="Site Admin", charset="UTF-8"';

function normalizeAdminPath(rawPath) {
  const fallback = "atelier-admin";
  const reserved = new Set(["api", "uploads"]);
  if (typeof rawPath !== "string") return `/${fallback}`;
  const cleaned = rawPath
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "");
  const safeValue = cleaned || fallback;
  if (reserved.has(safeValue.toLowerCase())) return `/${fallback}`;
  return `/${safeValue}`;
}

const ADMIN_PATH = normalizeAdminPath(process.env.ADMIN_PATH || "atelier-admin");
const ADMIN_PATH_EXACT = new RegExp(`^${ADMIN_PATH}$`);
const ADMIN_PATH_SLASH_EXACT = new RegExp(`^${ADMIN_PATH}/$`);

app.use(express.json({ limit: "1mb" }));

function cleanText(value, maxLength = 1000) {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, maxLength);
}

function mergeText(value, fallback, maxLength = 1000) {
  if (typeof value !== "string") return fallback;
  return cleanText(value, maxLength);
}

function cleanTextArray(value, maxItems = 6, maxLength = 100) {
  if (!Array.isArray(value)) return [];
  return value
    .map((entry) => cleanText(entry, maxLength))
    .filter(Boolean)
    .slice(0, maxItems);
}

function mergeTextArray(value, fallback, maxItems = 6, maxLength = 100) {
  const cleaned = cleanTextArray(value, maxItems, maxLength);
  return cleaned.length ? cleaned : fallback;
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

function cleanAboutCard(card) {
  if (!card || typeof card !== "object") return null;
  const title = cleanText(card.title, 90);
  const description = cleanText(card.description, 220);
  if (!title && !description) return null;
  return { title, description };
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
      eyebrow: mergeText(base.hero?.eyebrow, DEFAULT_CONTENT.hero.eyebrow, 80),
      title: mergeText(base.hero?.title, DEFAULT_CONTENT.hero.title, 90),
      subtitle: mergeText(base.hero?.subtitle, DEFAULT_CONTENT.hero.subtitle, 220),
      primaryCta: mergeText(base.hero?.primaryCta, DEFAULT_CONTENT.hero.primaryCta, 50),
      secondaryCta: mergeText(base.hero?.secondaryCta, DEFAULT_CONTENT.hero.secondaryCta, 50),
      panelTitle: mergeText(base.hero?.panelTitle, DEFAULT_CONTENT.hero.panelTitle, 90),
      highlights: mergeTextArray(base.hero?.highlights, DEFAULT_CONTENT.hero.highlights, 6, 90)
    },
    about: mergeText(base.about, DEFAULT_CONTENT.about, 1000),
    aboutSection: {
      kicker: mergeText(base.aboutSection?.kicker, DEFAULT_CONTENT.aboutSection.kicker, 60),
      title: mergeText(base.aboutSection?.title, DEFAULT_CONTENT.aboutSection.title, 110),
      cards: Array.isArray(base.aboutSection?.cards)
        ? base.aboutSection.cards.map(cleanAboutCard).filter(Boolean).slice(0, 4)
        : DEFAULT_CONTENT.aboutSection.cards
    },
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
  if (!normalized.aboutSection.cards.length) {
    normalized.aboutSection.cards = DEFAULT_CONTENT.aboutSection.cards;
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

function timingSafeStringCompare(left, right) {
  const leftBuffer = Buffer.from(String(left));
  const rightBuffer = Buffer.from(String(right));
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
}

function parseBasicAuthorization(header) {
  if (!header || !header.startsWith("Basic ")) return null;
  const encoded = header.slice(6).trim();
  if (!encoded) return null;

  let decoded = "";
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }

  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex <= -1) return null;
  return {
    username: decoded.slice(0, separatorIndex),
    password: decoded.slice(separatorIndex + 1)
  };
}

function isAuthorized(req) {
  const authHeader = req.get("authorization");
  const credentials = parseBasicAuthorization(authHeader);
  if (!credentials) return false;
  return (
    timingSafeStringCompare(credentials.username, ADMIN_USERNAME) &&
    timingSafeStringCompare(credentials.password, ADMIN_PASSWORD)
  );
}

function requireAdminPage(req, res, next) {
  if (!isAuthorized(req)) {
    res.set("WWW-Authenticate", ADMIN_REALM);
    return res.status(401).send("Authentication required");
  }
  return next();
}

function requireAdminApi(req, res, next) {
  if (!isAuthorized(req)) {
    res.set("WWW-Authenticate", ADMIN_REALM);
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

app.put("/api/content", requireAdminApi, async (req, res) => {
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
        eyebrow: mergeText(incoming.hero?.eyebrow, current.hero.eyebrow, 80),
        title: mergeText(incoming.hero?.title, current.hero.title, 90),
        subtitle: mergeText(incoming.hero?.subtitle, current.hero.subtitle, 220),
        primaryCta: mergeText(incoming.hero?.primaryCta, current.hero.primaryCta, 50),
        secondaryCta: mergeText(incoming.hero?.secondaryCta, current.hero.secondaryCta, 50),
        panelTitle: mergeText(incoming.hero?.panelTitle, current.hero.panelTitle, 90),
        highlights: Array.isArray(incoming.hero?.highlights)
          ? mergeTextArray(incoming.hero.highlights, current.hero.highlights, 6, 90)
          : current.hero.highlights
      },
      about: mergeText(incoming.about, current.about, 1000),
      aboutSection: {
        kicker: mergeText(
          incoming.aboutSection?.kicker,
          current.aboutSection.kicker,
          60
        ),
        title: mergeText(incoming.aboutSection?.title, current.aboutSection.title, 110),
        cards: Array.isArray(incoming.aboutSection?.cards)
          ? incoming.aboutSection.cards.map(cleanAboutCard).filter(Boolean).slice(0, 4)
          : current.aboutSection.cards
      },
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

app.post("/api/upload", requireAdminApi, upload.single("photo"), async (req, res) => {
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

app.delete("/api/upload/:filename", requireAdminApi, async (req, res) => {
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

app.get(["/admin.html", "/admin.js", "/admin.css"], (_req, res) => {
  return res.status(404).send("Not found");
});

app.get(ADMIN_PATH_EXACT, requireAdminPage, (_req, res) => {
  return res.redirect(302, `${ADMIN_PATH}/`);
});

app.get(ADMIN_PATH_SLASH_EXACT, requireAdminPage, (_req, res) => {
  return res.sendFile(path.join(__dirname, "public", "admin.html"));
});

app.get(`${ADMIN_PATH}/admin.css`, requireAdminPage, (_req, res) => {
  return res.sendFile(path.join(__dirname, "public", "admin.css"));
});

app.get(`${ADMIN_PATH}/admin.js`, requireAdminPage, (_req, res) => {
  return res.sendFile(path.join(__dirname, "public", "admin.js"));
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
      console.log(`Admin URL path: ${ADMIN_PATH}/`);
    });
  } catch (error) {
    console.error("Startup failed:", error);
    process.exit(1);
  }
}

start();
