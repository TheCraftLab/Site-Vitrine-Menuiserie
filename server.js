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
  labels: {
    navAbout: "Atelier",
    navServices: "Prestations",
    navGallery: "Realisations",
    navContact: "Contact",
    topbarCta: "Demander un devis",
    backToTop: "Retour en haut",
    mobilePhone: "Appeler",
    mobileEmail: "Email"
  },
  visibility: {
    topbar: true,
    nav: true,
    topbarCta: true,
    hero: true,
    heroEyebrow: true,
    heroSubtitle: true,
    heroPrimaryCta: true,
    heroSecondaryCta: true,
    heroHighlights: true,
    heroPanel: true,
    heroPanelKicker: true,
    heroPanelStats: true,
    trustBand: true,
    about: true,
    aboutText: true,
    aboutCards: true,
    services: true,
    process: true,
    gallery: true,
    contact: true,
    contactPhone: true,
    contactEmail: true,
    footer: true,
    backToTop: true,
    mobileCta: true,
    mobilePhone: true,
    mobileEmail: true
  },
  hero: {
    eyebrow: "Menuiserie artisanale, renovation et sur mesure",
    title: "Des menuiseries durables, posees avec precision",
    subtitle:
      "Fenetres, portes, escaliers et agencements interieurs avec une execution propre du premier rendez-vous a la pose finale.",
    primaryCta: "Demander un devis",
    secondaryCta: "Voir les realisations",
    panelKicker: "Projet neuf ou renovation",
    panelTitle: "Un interlocuteur unique pour un chantier maitrise",
    highlights: ["Devis detaille sous 48h", "Bois, PVC et aluminium", "Pose soignee et delais annonces"],
    stats: [
      { value: "+250", label: "chantiers livres" },
      { value: "4.8/5", label: "avis clients" },
      { value: "10 ans", label: "d'experience" }
    ]
  },
  trustBand: {
    items: [
      { title: "Reponse rapide", text: "Retour sous 24h pour qualifier votre besoin." },
      {
        title: "Intervention locale",
        text: "Visites techniques et conseils adaptes a votre chantier."
      },
      {
        title: "Garantie",
        text: "Execution propre, materiaux selectionnes et suivi apres pose."
      }
    ]
  },
  about:
    "Nous accompagnons particuliers et professionnels sur des projets de menuiserie interieure et exterieure. Chaque chantier est prepare avec prise de cotes, conseils techniques, choix des materiaux et suivi jusqu'aux finitions.",
  aboutSection: {
    kicker: "L'atelier",
    title: "Un savoir-faire artisanal adapte aux exigences d'aujourd'hui",
    cards: [
      {
        title: "Etude technique",
        description:
          "Analyse du bati, prise de mesures et recommandations selon vos contraintes reelles."
      },
      {
        title: "Fabrication precise",
        description: "Assemblages rigoureux et finitions personnalisees pour un rendu durable."
      },
      {
        title: "Pose controlee",
        description:
          "Installation propre, reglages finaux et verification detaillee avant livraison."
      }
    ]
  },
  servicesSection: {
    kicker: "Prestations",
    title: "Des solutions adaptees a chaque projet"
  },
  services: [
    {
      title: "Fenetres et ouvertures",
      description:
        "Remplacement et pose sur mesure pour ameliorer confort, esthetique et isolation."
    },
    {
      title: "Portes interieures et exterieures",
      description:
        "Conception, renovation et installation avec finitions adaptees a votre style."
    },
    {
      title: "Escaliers et garde-corps",
      description: "Realisation sur mesure alliant securite, robustesse et lignes contemporaines."
    },
    {
      title: "Agencement interieur",
      description:
        "Placards, bibliotheques, dressing et rangements optimises pour vos espaces."
    }
  ],
  processSection: {
    kicker: "Methode",
    title: "Un process clair en 4 etapes",
    steps: [
      {
        number: "01",
        title: "Echange initial",
        description:
          "Vous decrivez votre besoin, vos contraintes et le niveau de finition attendu."
      },
      {
        number: "02",
        title: "Visite et cotes",
        description: "Nous validons les dimensions, la technique et les options de materiaux."
      },
      {
        number: "03",
        title: "Fabrication",
        description:
          "Chaque element est prepare selon votre interieur et votre usage quotidien."
      },
      {
        number: "04",
        title: "Pose et controle",
        description: "Installation, reglages et controle final pour un rendu net et durable."
      }
    ]
  },
  gallerySection: {
    kicker: "Portfolio",
    title: "Realisations recentes"
  },
  contactSection: {
    kicker: "Votre projet",
    title: "Parlons de vos travaux de menuiserie",
    message: "Parlez-nous de votre projet et recevez un devis clair et personnalise."
  },
  cta: "Parlez-nous de votre projet et recevez un devis clair et personnalise.",
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

function cleanBoolean(value, fallback = false) {
  if (typeof value === "boolean") return value;
  return fallback;
}

function cleanHeroStat(item) {
  if (!item || typeof item !== "object") return null;
  const value = cleanText(item.value, 32);
  const label = cleanText(item.label, 80);
  if (!value && !label) return null;
  return { value, label };
}

function cleanTrustItem(item) {
  if (!item || typeof item !== "object") return null;
  const title = cleanText(item.title, 70);
  const text = cleanText(item.text, 180);
  if (!title && !text) return null;
  return { title, text };
}

function cleanProcessStep(step) {
  if (!step || typeof step !== "object") return null;
  const number = cleanText(step.number, 16);
  const title = cleanText(step.title, 80);
  const description = cleanText(step.description, 220);
  if (!number && !title && !description) return null;
  return { number, title, description };
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
  const legacyContactMessage = mergeText(base.cta, DEFAULT_CONTENT.contactSection.message, 180);
  const contactMessage = mergeText(
    base.contactSection?.message,
    legacyContactMessage,
    180
  );

  const normalized = {
    meta: {
      businessName: mergeText(base.meta?.businessName, DEFAULT_CONTENT.meta.businessName, 80),
      phone: mergeText(base.meta?.phone, DEFAULT_CONTENT.meta.phone, 40),
      email: mergeText(base.meta?.email, DEFAULT_CONTENT.meta.email, 120)
    },
    labels: {
      navAbout: mergeText(base.labels?.navAbout, DEFAULT_CONTENT.labels.navAbout, 26),
      navServices: mergeText(base.labels?.navServices, DEFAULT_CONTENT.labels.navServices, 26),
      navGallery: mergeText(base.labels?.navGallery, DEFAULT_CONTENT.labels.navGallery, 26),
      navContact: mergeText(base.labels?.navContact, DEFAULT_CONTENT.labels.navContact, 26),
      topbarCta: mergeText(base.labels?.topbarCta, DEFAULT_CONTENT.labels.topbarCta, 50),
      backToTop: mergeText(base.labels?.backToTop, DEFAULT_CONTENT.labels.backToTop, 50),
      mobilePhone: mergeText(base.labels?.mobilePhone, DEFAULT_CONTENT.labels.mobilePhone, 24),
      mobileEmail: mergeText(base.labels?.mobileEmail, DEFAULT_CONTENT.labels.mobileEmail, 24)
    },
    visibility: {
      topbar: cleanBoolean(base.visibility?.topbar, DEFAULT_CONTENT.visibility.topbar),
      nav: cleanBoolean(base.visibility?.nav, DEFAULT_CONTENT.visibility.nav),
      topbarCta: cleanBoolean(base.visibility?.topbarCta, DEFAULT_CONTENT.visibility.topbarCta),
      hero: cleanBoolean(base.visibility?.hero, DEFAULT_CONTENT.visibility.hero),
      heroEyebrow: cleanBoolean(base.visibility?.heroEyebrow, DEFAULT_CONTENT.visibility.heroEyebrow),
      heroSubtitle: cleanBoolean(base.visibility?.heroSubtitle, DEFAULT_CONTENT.visibility.heroSubtitle),
      heroPrimaryCta: cleanBoolean(
        base.visibility?.heroPrimaryCta,
        DEFAULT_CONTENT.visibility.heroPrimaryCta
      ),
      heroSecondaryCta: cleanBoolean(
        base.visibility?.heroSecondaryCta,
        DEFAULT_CONTENT.visibility.heroSecondaryCta
      ),
      heroHighlights: cleanBoolean(
        base.visibility?.heroHighlights,
        DEFAULT_CONTENT.visibility.heroHighlights
      ),
      heroPanel: cleanBoolean(base.visibility?.heroPanel, DEFAULT_CONTENT.visibility.heroPanel),
      heroPanelKicker: cleanBoolean(
        base.visibility?.heroPanelKicker,
        DEFAULT_CONTENT.visibility.heroPanelKicker
      ),
      heroPanelStats: cleanBoolean(
        base.visibility?.heroPanelStats,
        DEFAULT_CONTENT.visibility.heroPanelStats
      ),
      trustBand: cleanBoolean(base.visibility?.trustBand, DEFAULT_CONTENT.visibility.trustBand),
      about: cleanBoolean(base.visibility?.about, DEFAULT_CONTENT.visibility.about),
      aboutText: cleanBoolean(base.visibility?.aboutText, DEFAULT_CONTENT.visibility.aboutText),
      aboutCards: cleanBoolean(base.visibility?.aboutCards, DEFAULT_CONTENT.visibility.aboutCards),
      services: cleanBoolean(base.visibility?.services, DEFAULT_CONTENT.visibility.services),
      process: cleanBoolean(base.visibility?.process, DEFAULT_CONTENT.visibility.process),
      gallery: cleanBoolean(base.visibility?.gallery, DEFAULT_CONTENT.visibility.gallery),
      contact: cleanBoolean(base.visibility?.contact, DEFAULT_CONTENT.visibility.contact),
      contactPhone: cleanBoolean(
        base.visibility?.contactPhone,
        DEFAULT_CONTENT.visibility.contactPhone
      ),
      contactEmail: cleanBoolean(
        base.visibility?.contactEmail,
        DEFAULT_CONTENT.visibility.contactEmail
      ),
      footer: cleanBoolean(base.visibility?.footer, DEFAULT_CONTENT.visibility.footer),
      backToTop: cleanBoolean(base.visibility?.backToTop, DEFAULT_CONTENT.visibility.backToTop),
      mobileCta: cleanBoolean(base.visibility?.mobileCta, DEFAULT_CONTENT.visibility.mobileCta),
      mobilePhone: cleanBoolean(
        base.visibility?.mobilePhone,
        DEFAULT_CONTENT.visibility.mobilePhone
      ),
      mobileEmail: cleanBoolean(
        base.visibility?.mobileEmail,
        DEFAULT_CONTENT.visibility.mobileEmail
      )
    },
    hero: {
      eyebrow: mergeText(base.hero?.eyebrow, DEFAULT_CONTENT.hero.eyebrow, 80),
      title: mergeText(base.hero?.title, DEFAULT_CONTENT.hero.title, 90),
      subtitle: mergeText(base.hero?.subtitle, DEFAULT_CONTENT.hero.subtitle, 220),
      primaryCta: mergeText(base.hero?.primaryCta, DEFAULT_CONTENT.hero.primaryCta, 50),
      secondaryCta: mergeText(base.hero?.secondaryCta, DEFAULT_CONTENT.hero.secondaryCta, 50),
      panelKicker: mergeText(base.hero?.panelKicker, DEFAULT_CONTENT.hero.panelKicker, 60),
      panelTitle: mergeText(base.hero?.panelTitle, DEFAULT_CONTENT.hero.panelTitle, 90),
      highlights: Array.isArray(base.hero?.highlights)
        ? cleanTextArray(base.hero.highlights, 8, 90)
        : DEFAULT_CONTENT.hero.highlights,
      stats: Array.isArray(base.hero?.stats)
        ? base.hero.stats.map(cleanHeroStat).filter(Boolean).slice(0, 6)
        : DEFAULT_CONTENT.hero.stats
    },
    trustBand: {
      items: Array.isArray(base.trustBand?.items)
        ? base.trustBand.items.map(cleanTrustItem).filter(Boolean).slice(0, 6)
        : DEFAULT_CONTENT.trustBand.items
    },
    about: mergeText(base.about, DEFAULT_CONTENT.about, 1000),
    aboutSection: {
      kicker: mergeText(base.aboutSection?.kicker, DEFAULT_CONTENT.aboutSection.kicker, 60),
      title: mergeText(base.aboutSection?.title, DEFAULT_CONTENT.aboutSection.title, 110),
      cards: Array.isArray(base.aboutSection?.cards)
        ? base.aboutSection.cards.map(cleanAboutCard).filter(Boolean).slice(0, 8)
        : DEFAULT_CONTENT.aboutSection.cards
    },
    servicesSection: {
      kicker: mergeText(base.servicesSection?.kicker, DEFAULT_CONTENT.servicesSection.kicker, 60),
      title: mergeText(base.servicesSection?.title, DEFAULT_CONTENT.servicesSection.title, 110)
    },
    services: Array.isArray(base.services)
      ? base.services.map(cleanService).filter(Boolean).slice(0, 12)
      : DEFAULT_CONTENT.services,
    processSection: {
      kicker: mergeText(base.processSection?.kicker, DEFAULT_CONTENT.processSection.kicker, 60),
      title: mergeText(base.processSection?.title, DEFAULT_CONTENT.processSection.title, 110),
      steps: Array.isArray(base.processSection?.steps)
        ? base.processSection.steps.map(cleanProcessStep).filter(Boolean).slice(0, 8)
        : DEFAULT_CONTENT.processSection.steps
    },
    gallerySection: {
      kicker: mergeText(base.gallerySection?.kicker, DEFAULT_CONTENT.gallerySection.kicker, 60),
      title: mergeText(base.gallerySection?.title, DEFAULT_CONTENT.gallerySection.title, 110)
    },
    contactSection: {
      kicker: mergeText(base.contactSection?.kicker, DEFAULT_CONTENT.contactSection.kicker, 60),
      title: mergeText(base.contactSection?.title, DEFAULT_CONTENT.contactSection.title, 110),
      message: contactMessage
    },
    cta: contactMessage,
    gallery: Array.isArray(base.gallery)
      ? base.gallery.map(cleanGalleryItem).filter(Boolean)
      : []
  };

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
    const mergedContactSection = {
      ...(current.contactSection || {}),
      ...(incoming.contactSection || {})
    };

    const updated = {
      ...current,
      ...incoming,
      meta: {
        ...(current.meta || {}),
        ...(incoming.meta || {})
      },
      labels: {
        ...(current.labels || {}),
        ...(incoming.labels || {})
      },
      visibility: {
        ...(current.visibility || {}),
        ...(incoming.visibility || {})
      },
      hero: {
        ...(current.hero || {}),
        ...(incoming.hero || {})
      },
      trustBand: {
        ...(current.trustBand || {}),
        ...(incoming.trustBand || {})
      },
      aboutSection: {
        ...(current.aboutSection || {}),
        ...(incoming.aboutSection || {})
      },
      servicesSection: {
        ...(current.servicesSection || {}),
        ...(incoming.servicesSection || {})
      },
      processSection: {
        ...(current.processSection || {}),
        ...(incoming.processSection || {})
      },
      gallerySection: {
        ...(current.gallerySection || {}),
        ...(incoming.gallerySection || {})
      },
      contactSection: mergedContactSection
    };

    if (typeof incoming.cta === "string" && !incoming.contactSection?.message) {
      updated.contactSection.message = incoming.cta;
    }

    if (typeof incoming.contactSection?.message === "string") {
      updated.cta = incoming.contactSection.message;
    } else if (typeof incoming.cta === "string") {
      updated.cta = incoming.cta;
    } else if (typeof updated.contactSection?.message === "string") {
      updated.cta = updated.contactSection.message;
    } else {
      updated.cta = current.cta;
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
    const alt = cleanText(req.body.alt, 140) || "Photo réalisation";
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
