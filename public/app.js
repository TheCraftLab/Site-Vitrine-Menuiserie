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

function applyContactLinks(phone = "", email = "") {
  const phoneHref = phone ? `tel:${phone.replace(/\s+/g, "")}` : "#";
  const emailHref = email ? `mailto:${email}` : "#";

  const phoneLink = document.getElementById("phoneLink");
  if (phoneLink) {
    phoneLink.href = phoneHref;
    phoneLink.textContent = phone || "Telephone a renseigner";
  }

  const emailLink = document.getElementById("emailLink");
  if (emailLink) {
    emailLink.href = emailHref;
    emailLink.textContent = email || "Email a renseigner";
  }

  const mobilePhoneLink = document.getElementById("mobilePhoneLink");
  if (mobilePhoneLink) {
    mobilePhoneLink.href = phoneHref;
    mobilePhoneLink.textContent = phone ? "Appeler" : "Devis";
  }

  const mobileEmailLink = document.getElementById("mobileEmailLink");
  if (mobileEmailLink) {
    mobileEmailLink.href = emailHref;
    mobileEmailLink.textContent = email ? "Email" : "Contact";
  }
}

function setText(id, value) {
  const node = document.getElementById(id);
  if (node) node.textContent = value;
}

function renderContent(content) {
  const safeContent = content || {};
  const hero = safeContent.hero || {};
  const aboutSection = safeContent.aboutSection || {};
  const meta = safeContent.meta || {};

  setText("heroEyebrow", hero.eyebrow || "");
  setText("businessName", meta.businessName || "");
  setText("footerBusinessName", meta.businessName || "");
  setText("heroTitle", hero.title || "");
  setText("heroSubtitle", hero.subtitle || "");
  setText("heroPrimaryCta", hero.primaryCta || "Demander un devis");
  setText("heroSecondaryCta", hero.secondaryCta || "Voir les realisations");
  setText("heroPanelTitle", hero.panelTitle || "");
  setText("aboutKicker", aboutSection.kicker || "");
  setText("aboutTitle", aboutSection.title || "");
  setText("aboutText", safeContent.about || "");
  setText("ctaText", safeContent.cta || "");

  const primaryCta = document.getElementById("heroPrimaryCta");
  if (primaryCta) primaryCta.href = "#contact";

  const secondaryCta = document.getElementById("heroSecondaryCta");
  if (secondaryCta) secondaryCta.href = "#realisations";

  applyContactLinks(meta.phone || "", meta.email || "");
  renderHeroHighlights(hero.highlights || []);
  renderAboutCards(aboutSection.cards || []);
  renderServices(safeContent.services || []);
  renderGallery(safeContent.gallery || []);
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
