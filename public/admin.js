const contentForm = document.getElementById("contentForm");
const uploadBtn = document.getElementById("uploadBtn");
const photoInput = document.getElementById("photoInput");
const altInput = document.getElementById("altInput");
const statusEl = document.getElementById("status");
const galleryAdmin = document.getElementById("galleryAdmin");

const fields = {
  businessName: document.getElementById("businessName"),
  phone: document.getElementById("phone"),
  email: document.getElementById("email"),
  navAbout: document.getElementById("navAbout"),
  navServices: document.getElementById("navServices"),
  navGallery: document.getElementById("navGallery"),
  navContact: document.getElementById("navContact"),
  topbarCtaLabel: document.getElementById("topbarCtaLabel"),
  backToTopLabel: document.getElementById("backToTopLabel"),
  mobilePhoneLabel: document.getElementById("mobilePhoneLabel"),
  mobileEmailLabel: document.getElementById("mobileEmailLabel"),
  heroEyebrow: document.getElementById("heroEyebrow"),
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  heroPrimaryCta: document.getElementById("heroPrimaryCta"),
  heroSecondaryCta: document.getElementById("heroSecondaryCta"),
  heroPanelKicker: document.getElementById("heroPanelKicker"),
  heroPanelTitle: document.getElementById("heroPanelTitle"),
  heroHighlightsText: document.getElementById("heroHighlightsText"),
  heroStatsText: document.getElementById("heroStatsText"),
  trustItemsText: document.getElementById("trustItemsText"),
  aboutKicker: document.getElementById("aboutKicker"),
  aboutTitle: document.getElementById("aboutTitle"),
  aboutText: document.getElementById("aboutText"),
  aboutCardsText: document.getElementById("aboutCardsText"),
  servicesKicker: document.getElementById("servicesKicker"),
  servicesTitle: document.getElementById("servicesTitle"),
  servicesText: document.getElementById("servicesText"),
  processKicker: document.getElementById("processKicker"),
  processTitle: document.getElementById("processTitle"),
  processStepsText: document.getElementById("processStepsText"),
  galleryKicker: document.getElementById("galleryKicker"),
  galleryTitle: document.getElementById("galleryTitle"),
  contactKicker: document.getElementById("contactKicker"),
  contactTitle: document.getElementById("contactTitle"),
  contactMessage: document.getElementById("contactMessage")
};

const visibilityFields = {
  topbar: document.getElementById("visTopbar"),
  nav: document.getElementById("visNav"),
  topbarCta: document.getElementById("visTopbarCta"),
  hero: document.getElementById("visHero"),
  heroEyebrow: document.getElementById("visHeroEyebrow"),
  heroSubtitle: document.getElementById("visHeroSubtitle"),
  heroPrimaryCta: document.getElementById("visHeroPrimaryCta"),
  heroSecondaryCta: document.getElementById("visHeroSecondaryCta"),
  heroHighlights: document.getElementById("visHeroHighlights"),
  heroPanel: document.getElementById("visHeroPanel"),
  heroPanelKicker: document.getElementById("visHeroPanelKicker"),
  heroPanelStats: document.getElementById("visHeroPanelStats"),
  trustBand: document.getElementById("visTrustBand"),
  about: document.getElementById("visAbout"),
  aboutText: document.getElementById("visAboutText"),
  aboutCards: document.getElementById("visAboutCards"),
  services: document.getElementById("visServices"),
  process: document.getElementById("visProcess"),
  gallery: document.getElementById("visGallery"),
  contact: document.getElementById("visContact"),
  contactPhone: document.getElementById("visContactPhone"),
  contactEmail: document.getElementById("visContactEmail"),
  footer: document.getElementById("visFooter"),
  backToTop: document.getElementById("visBackToTop"),
  mobileCta: document.getElementById("visMobileCta"),
  mobilePhone: document.getElementById("visMobilePhone"),
  mobileEmail: document.getElementById("visMobileEmail")
};

let contentState = null;

function setStatus(message, isError = false) {
  statusEl.textContent = message;
  statusEl.style.color = isError ? "#b02020" : "#4f5b66";
}

async function apiFetch(url, options = {}) {
  const response = await fetch(url, options);
  if (response.status === 401) {
    throw new Error("Acces refuse. Rechargez la page admin et reconnectez-vous.");
  }
  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.error || "Erreur API");
  }
  return response.json();
}

function toLinePairs(items = [], keys = ["title", "description"]) {
  return (items || [])
    .map((item) => keys.map((key) => (item?.[key] || "").trim()).join("|"))
    .join("\n");
}

function parseLinePairs(value, keys = ["title", "description"]) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const chunks = line.split("|");
      const object = {};
      keys.forEach((key, index) => {
        if (index === keys.length - 1) {
          object[key] = chunks.slice(index).join("|").trim();
        } else {
          object[key] = (chunks[index] || "").trim();
        }
      });
      return object;
    });
}

function parseSimpleLines(value, maxItems = 8) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, maxItems);
}

function renderForm(content) {
  const labels = content.labels || {};
  const visibility = content.visibility || {};
  const hero = content.hero || {};
  const trustBand = content.trustBand || {};
  const aboutSection = content.aboutSection || {};
  const servicesSection = content.servicesSection || {};
  const processSection = content.processSection || {};
  const gallerySection = content.gallerySection || {};
  const contactSection = content.contactSection || {};

  fields.businessName.value = content.meta?.businessName || "";
  fields.phone.value = content.meta?.phone || "";
  fields.email.value = content.meta?.email || "";

  fields.navAbout.value = labels.navAbout || "";
  fields.navServices.value = labels.navServices || "";
  fields.navGallery.value = labels.navGallery || "";
  fields.navContact.value = labels.navContact || "";
  fields.topbarCtaLabel.value = labels.topbarCta || "";
  fields.backToTopLabel.value = labels.backToTop || "";
  fields.mobilePhoneLabel.value = labels.mobilePhone || "";
  fields.mobileEmailLabel.value = labels.mobileEmail || "";

  fields.heroEyebrow.value = hero.eyebrow || "";
  fields.heroTitle.value = hero.title || "";
  fields.heroSubtitle.value = hero.subtitle || "";
  fields.heroPrimaryCta.value = hero.primaryCta || "";
  fields.heroSecondaryCta.value = hero.secondaryCta || "";
  fields.heroPanelKicker.value = hero.panelKicker || "";
  fields.heroPanelTitle.value = hero.panelTitle || "";
  fields.heroHighlightsText.value = (hero.highlights || []).join("\n");
  fields.heroStatsText.value = toLinePairs(hero.stats || [], ["value", "label"]);

  fields.trustItemsText.value = toLinePairs(trustBand.items || [], ["title", "text"]);

  fields.aboutKicker.value = aboutSection.kicker || "";
  fields.aboutTitle.value = aboutSection.title || "";
  fields.aboutText.value = content.about || "";
  fields.aboutCardsText.value = toLinePairs(aboutSection.cards || [], ["title", "description"]);

  fields.servicesKicker.value = servicesSection.kicker || "";
  fields.servicesTitle.value = servicesSection.title || "";
  fields.servicesText.value = toLinePairs(content.services || [], ["title", "description"]);

  fields.processKicker.value = processSection.kicker || "";
  fields.processTitle.value = processSection.title || "";
  fields.processStepsText.value = toLinePairs(processSection.steps || [], ["number", "title", "description"]);

  fields.galleryKicker.value = gallerySection.kicker || "";
  fields.galleryTitle.value = gallerySection.title || "";

  fields.contactKicker.value = contactSection.kicker || "";
  fields.contactTitle.value = contactSection.title || "";
  fields.contactMessage.value = contactSection.message || content.cta || "";

  Object.entries(visibilityFields).forEach(([key, checkbox]) => {
    if (!checkbox) return;
    checkbox.checked = visibility[key] !== false;
  });
}

function renderGallery(content) {
  galleryAdmin.innerHTML = "";
  if (!content.gallery || !content.gallery.length) {
    galleryAdmin.textContent = "Aucune photo pour le moment.";
    return;
  }

  content.gallery.forEach((item) => {
    const card = document.createElement("article");
    card.className = "item";

    const image = document.createElement("img");
    image.src = item.url;
    image.alt = item.alt;
    image.loading = "lazy";

    const meta = document.createElement("div");
    meta.className = "meta";

    const strong = document.createElement("strong");
    strong.textContent = item.alt;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "delete-btn";
    button.dataset.file = item.url.split("/").pop();
    button.textContent = "Supprimer";

    meta.appendChild(strong);
    meta.appendChild(button);
    card.appendChild(image);
    card.appendChild(meta);
    galleryAdmin.appendChild(card);
  });
}

function buildVisibilityPayload() {
  const visibility = {};
  Object.entries(visibilityFields).forEach(([key, checkbox]) => {
    visibility[key] = Boolean(checkbox?.checked);
  });
  return visibility;
}

async function loadContent() {
  const response = await fetch("/api/content");
  if (!response.ok) {
    throw new Error("Impossible de charger le contenu");
  }
  contentState = await response.json();
  renderForm(contentState);
  renderGallery(contentState);
}

contentForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  if (!contentState) return;

  const contactMessage = fields.contactMessage.value;

  const payload = {
    meta: {
      businessName: fields.businessName.value,
      phone: fields.phone.value,
      email: fields.email.value
    },
    labels: {
      navAbout: fields.navAbout.value,
      navServices: fields.navServices.value,
      navGallery: fields.navGallery.value,
      navContact: fields.navContact.value,
      topbarCta: fields.topbarCtaLabel.value,
      backToTop: fields.backToTopLabel.value,
      mobilePhone: fields.mobilePhoneLabel.value,
      mobileEmail: fields.mobileEmailLabel.value
    },
    visibility: buildVisibilityPayload(),
    hero: {
      eyebrow: fields.heroEyebrow.value,
      title: fields.heroTitle.value,
      subtitle: fields.heroSubtitle.value,
      primaryCta: fields.heroPrimaryCta.value,
      secondaryCta: fields.heroSecondaryCta.value,
      panelKicker: fields.heroPanelKicker.value,
      panelTitle: fields.heroPanelTitle.value,
      highlights: parseSimpleLines(fields.heroHighlightsText.value, 8),
      stats: parseLinePairs(fields.heroStatsText.value, ["value", "label"]).slice(0, 6)
    },
    trustBand: {
      items: parseLinePairs(fields.trustItemsText.value, ["title", "text"]).slice(0, 6)
    },
    aboutSection: {
      kicker: fields.aboutKicker.value,
      title: fields.aboutTitle.value,
      cards: parseLinePairs(fields.aboutCardsText.value, ["title", "description"]).slice(0, 8)
    },
    about: fields.aboutText.value,
    servicesSection: {
      kicker: fields.servicesKicker.value,
      title: fields.servicesTitle.value
    },
    services: parseLinePairs(fields.servicesText.value, ["title", "description"]).slice(0, 12),
    processSection: {
      kicker: fields.processKicker.value,
      title: fields.processTitle.value,
      steps: parseLinePairs(fields.processStepsText.value, ["number", "title", "description"]).slice(0, 8)
    },
    gallerySection: {
      kicker: fields.galleryKicker.value,
      title: fields.galleryTitle.value
    },
    contactSection: {
      kicker: fields.contactKicker.value,
      title: fields.contactTitle.value,
      message: contactMessage
    },
    cta: contactMessage
  };

  try {
    contentState = await apiFetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    renderGallery(contentState);
    setStatus("Contenu enregistre.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

uploadBtn.addEventListener("click", async () => {
  const files = Array.from(photoInput.files || []);
  if (!files.length) {
    setStatus("Selectionnez au moins une photo.", true);
    return;
  }

  const altBase = altInput.value.trim();

  try {
    for (const file of files) {
      const formData = new FormData();
      formData.append("photo", file);
      formData.append("alt", altBase);
      await apiFetch("/api/upload", {
        method: "POST",
        body: formData
      });
    }
    photoInput.value = "";
    altInput.value = "";
    await loadContent();
    setStatus("Photos uploadees.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

galleryAdmin.addEventListener("click", async (event) => {
  const target = event.target;
  if (!(target instanceof HTMLButtonElement)) return;
  if (!target.matches(".delete-btn")) return;

  const filename = target.dataset.file;
  if (!filename) return;

  try {
    await apiFetch(`/api/upload/${encodeURIComponent(filename)}`, {
      method: "DELETE"
    });
    await loadContent();
    setStatus("Photo supprimee.");
  } catch (error) {
    setStatus(error.message, true);
  }
});

async function init() {
  try {
    await loadContent();
    setStatus("Contenu charge.");
  } catch (error) {
    setStatus(error.message, true);
  }
}

init();
