async function loadContent() {
  const response = await fetch("/api/content");
  if (!response.ok) {
    throw new Error("Impossible de charger les contenus");
  }
  return response.json();
}

let revealObserver = null;
const lightbox = document.getElementById("lightbox");
const lightboxImage = document.getElementById("lightboxImage");
const lightboxClose = document.getElementById("lightboxClose");

function openLightbox(src, alt) {
  if (!lightbox || !lightboxImage) return;
  lightboxImage.src = src;
  lightboxImage.alt = alt || "Photo";
  lightbox.hidden = false;
  lightbox.removeAttribute("hidden");
  lightbox.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => lightbox.classList.add("is-open"));
  document.body.classList.add("no-scroll");
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.hidden = true;
  lightbox.setAttribute("hidden", "");
  lightboxImage.src = "";
  document.body.classList.remove("no-scroll");
}

function setupLightbox() {
  const gallery = document.getElementById("galleryList");
  if (!gallery || !lightbox || !lightboxClose) return;

  gallery.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof Element)) return;

    const clickedImage =
      target instanceof HTMLImageElement
        ? target
        : target.closest(".gallery-item")?.querySelector("img");

    if (!clickedImage) return;
    openLightbox(clickedImage.currentSrc || clickedImage.src, clickedImage.alt);
  });

  lightboxClose.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !lightbox.hidden) {
      closeLightbox();
    }
  });
}

function ensureRevealObserver() {
  if (revealObserver || !("IntersectionObserver" in window)) return;
  revealObserver = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        revealObserver.unobserve(entry.target);
      });
    },
    { threshold: 0.15, rootMargin: "0px 0px -6% 0px" }
  );
}

function registerReveals(scope = document) {
  const elements = scope.querySelectorAll(".reveal");
  if (!elements.length) return;

  if (!("IntersectionObserver" in window)) {
    elements.forEach((element) => element.classList.add("is-visible"));
    return;
  }

  ensureRevealObserver();
  elements.forEach((element) => {
    if (element.dataset.revealBound === "1") return;
    element.dataset.revealBound = "1";
    revealObserver.observe(element);
  });
}

function setText(id, value) {
  const element = document.getElementById(id);
  if (!element) return;
  element.textContent = value;
}

function setVisible(id, isVisible) {
  const element = document.getElementById(id);
  if (!element) return;
  element.classList.toggle("is-hidden", !isVisible);
}

function isVisible(visibility, key, fallback = true) {
  const value = visibility?.[key];
  return typeof value === "boolean" ? value : fallback;
}

function setLinkHref(id, href) {
  const link = document.getElementById(id);
  if (!link) return;
  link.href = href;
}

function renderHeroHighlights(highlights = []) {
  const list = document.getElementById("heroHighlightsList");
  if (!list) return;
  list.innerHTML = "";

  highlights.forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function renderHeroStats(stats = []) {
  const container = document.getElementById("heroStatsList");
  if (!container) return;
  container.innerHTML = "";

  stats.forEach((item) => {
    const article = document.createElement("article");
    const strong = document.createElement("strong");
    strong.textContent = item.value || "";
    const span = document.createElement("span");
    span.textContent = item.label || "";
    article.appendChild(strong);
    article.appendChild(span);
    container.appendChild(article);
  });
}

function renderTrustItems(items = []) {
  const container = document.getElementById("trustItemsList");
  if (!container) return;
  container.innerHTML = "";

  items.forEach((item, index) => {
    const article = document.createElement("article");
    article.className = "trust-item reveal is-stagger";
    article.style.setProperty("--i", String(index));

    const title = document.createElement("h3");
    title.textContent = item.title || "";

    const text = document.createElement("p");
    text.textContent = item.text || "";

    article.appendChild(title);
    article.appendChild(text);
    container.appendChild(article);
  });
}

function renderAboutCards(cards = []) {
  const container = document.getElementById("aboutCardsList");
  if (!container) return;
  container.innerHTML = "";

  cards.forEach((card, index) => {
    const article = document.createElement("article");
    article.className = "reveal is-stagger";
    article.style.setProperty("--i", String(index));

    const title = document.createElement("h3");
    title.textContent = card.title;

    const description = document.createElement("p");
    description.textContent = card.description;

    article.appendChild(title);
    article.appendChild(description);
    container.appendChild(article);
  });
}

function renderServices(services = []) {
  const container = document.getElementById("servicesList");
  if (!container) return;
  container.innerHTML = "";

  services.forEach((service, index) => {
    const article = document.createElement("article");
    article.className = "card reveal is-stagger";
    article.style.setProperty("--i", String(index));

    const title = document.createElement("h3");
    title.textContent = service.title;

    const description = document.createElement("p");
    description.textContent = service.description;

    article.appendChild(title);
    article.appendChild(description);
    container.appendChild(article);
  });
}

function renderProcess(steps = []) {
  const container = document.getElementById("processList");
  if (!container) return;
  container.innerHTML = "";

  steps.forEach((step, index) => {
    const article = document.createElement("article");
    article.className = "process-item reveal is-stagger";
    article.style.setProperty("--i", String(index));

    const number = document.createElement("span");
    number.textContent = step.number || String(index + 1).padStart(2, "0");

    const title = document.createElement("h3");
    title.textContent = step.title || "";

    const description = document.createElement("p");
    description.textContent = step.description || "";

    article.appendChild(number);
    article.appendChild(title);
    article.appendChild(description);
    container.appendChild(article);
  });
}

function renderGallery(gallery = []) {
  const container = document.getElementById("galleryList");
  if (!container) return;
  container.innerHTML = "";

  if (!gallery.length) {
    const empty = document.createElement("p");
    empty.className = "empty-gallery";
    empty.textContent = "Ajoutez des photos depuis la page admin.";
    container.appendChild(empty);
    return;
  }

  gallery.forEach((item, index) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-item reveal is-stagger";
    figure.style.setProperty("--i", String(index));

    const image = document.createElement("img");
    image.src = item.url;
    image.alt = item.alt;
    image.loading = "lazy";

    figure.appendChild(image);
    container.appendChild(figure);
  });
}

function applyContactLinks(phone = "", email = "") {
  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : "#contact";
  const emailHref = email ? `mailto:${email}` : "#contact";

  setLinkHref("phoneLink", phoneHref);
  setText("phoneLink", phone || "Telephone a renseigner");

  setLinkHref("emailLink", emailHref);
  setText("emailLink", email || "Email a renseigner");

  setLinkHref("mobilePhoneLink", phoneHref);
  setLinkHref("mobileEmailLink", emailHref);
}

function applyVisibility(visibility = {}) {
  setVisible("topbarWrap", isVisible(visibility, "topbar", true));
  setVisible("mainNav", isVisible(visibility, "nav", true));
  setVisible("topbarCtaLink", isVisible(visibility, "topbarCta", true));

  setVisible("heroSection", isVisible(visibility, "hero", true));
  setVisible("heroEyebrow", isVisible(visibility, "heroEyebrow", true));
  setVisible("heroSubtitle", isVisible(visibility, "heroSubtitle", true));
  setVisible("heroPrimaryCta", isVisible(visibility, "heroPrimaryCta", true));
  setVisible("heroSecondaryCta", isVisible(visibility, "heroSecondaryCta", true));
  setVisible("heroHighlightsList", isVisible(visibility, "heroHighlights", true));
  setVisible("heroPanel", isVisible(visibility, "heroPanel", true));
  setVisible("heroPanelKicker", isVisible(visibility, "heroPanelKicker", true));
  setVisible("heroStatsList", isVisible(visibility, "heroPanelStats", true));

  setVisible("trustBandSection", isVisible(visibility, "trustBand", true));

  setVisible("a-propos", isVisible(visibility, "about", true));
  setVisible("aboutText", isVisible(visibility, "aboutText", true));
  setVisible("aboutCardsList", isVisible(visibility, "aboutCards", true));

  setVisible("services", isVisible(visibility, "services", true));
  setVisible("process", isVisible(visibility, "process", true));
  setVisible("realisations", isVisible(visibility, "gallery", true));
  setVisible("contact", isVisible(visibility, "contact", true));

  setVisible("phoneLink", isVisible(visibility, "contactPhone", true));
  setVisible("emailLink", isVisible(visibility, "contactEmail", true));

  setVisible("footerSection", isVisible(visibility, "footer", true));
  setVisible("backToTopLink", isVisible(visibility, "backToTop", true));

  setVisible("mobileCta", isVisible(visibility, "mobileCta", true));
  setVisible("mobilePhoneLink", isVisible(visibility, "mobilePhone", true));
  setVisible("mobileEmailLink", isVisible(visibility, "mobileEmail", true));

  setVisible("navAbout", isVisible(visibility, "about", true));
  setVisible("navServices", isVisible(visibility, "services", true));
  setVisible("navGallery", isVisible(visibility, "gallery", true));
  setVisible("navContact", isVisible(visibility, "contact", true));
}

function renderContent(content) {
  const safeContent = content || {};
  const meta = safeContent.meta || {};
  const labels = safeContent.labels || {};
  const hero = safeContent.hero || {};
  const aboutSection = safeContent.aboutSection || {};
  const servicesSection = safeContent.servicesSection || {};
  const processSection = safeContent.processSection || {};
  const gallerySection = safeContent.gallerySection || {};
  const contactSection = safeContent.contactSection || {};

  setText("businessName", meta.businessName || "");
  setText("footerBusinessName", meta.businessName || "");

  setText("navAbout", labels.navAbout || "Atelier");
  setText("navServices", labels.navServices || "Prestations");
  setText("navGallery", labels.navGallery || "Realisations");
  setText("navContact", labels.navContact || "Contact");

  setText("topbarCtaLink", labels.topbarCta || hero.primaryCta || "Demander un devis");
  setLinkHref("topbarCtaLink", "#contact");

  setText("backToTopLink", labels.backToTop || "Retour en haut");
  setLinkHref("backToTopLink", "#accueil");

  setText("mobilePhoneLink", labels.mobilePhone || "Appeler");
  setText("mobileEmailLink", labels.mobileEmail || "Email");

  setText("heroEyebrow", hero.eyebrow || "");
  setText("heroTitle", hero.title || "");
  setText("heroSubtitle", hero.subtitle || "");
  setText("heroPrimaryCta", hero.primaryCta || "Demander un devis");
  setText("heroSecondaryCta", hero.secondaryCta || "Voir les realisations");
  setText("heroPanelKicker", hero.panelKicker || "");
  setText("heroPanelTitle", hero.panelTitle || "");

  setText("aboutKicker", aboutSection.kicker || "");
  setText("aboutTitle", aboutSection.title || "");
  setText("aboutText", safeContent.about || "");

  setText("servicesKicker", servicesSection.kicker || "");
  setText("servicesTitle", servicesSection.title || "");

  setText("processKicker", processSection.kicker || "");
  setText("processTitle", processSection.title || "");

  setText("galleryKicker", gallerySection.kicker || "");
  setText("galleryTitle", gallerySection.title || "");

  setText("contactKicker", contactSection.kicker || "");
  setText("contactTitle", contactSection.title || "");
  setText("ctaText", contactSection.message || safeContent.cta || "");

  setLinkHref("heroPrimaryCta", "#contact");
  setLinkHref("heroSecondaryCta", "#realisations");

  applyContactLinks(meta.phone || "", meta.email || "");

  renderHeroHighlights(hero.highlights || []);
  renderHeroStats(hero.stats || []);
  renderTrustItems(safeContent.trustBand?.items || []);
  renderAboutCards(aboutSection.cards || []);
  renderServices(safeContent.services || []);
  renderProcess(processSection.steps || []);
  renderGallery(safeContent.gallery || []);

  applyVisibility(safeContent.visibility || {});
  registerReveals(document);
}

async function init() {
  try {
    setupLightbox();
    registerReveals(document);
    const content = await loadContent();
    renderContent(content);
    setText("year", String(new Date().getFullYear()));
  } catch (error) {
    setText("aboutText", "Le site est en cours de configuration.");
    console.error(error);
  }
}

init();
