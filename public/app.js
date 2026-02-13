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
  lightbox.setAttribute("aria-hidden", "false");
  requestAnimationFrame(() => lightbox.classList.add("is-open"));
  document.body.classList.add("no-scroll");
}

function closeLightbox() {
  if (!lightbox || !lightboxImage) return;
  lightbox.classList.remove("is-open");
  lightbox.setAttribute("aria-hidden", "true");
  lightbox.hidden = true;
  lightboxImage.src = "";
  document.body.classList.remove("no-scroll");
}

function setupLightbox() {
  const gallery = document.getElementById("galleryList");
  if (!gallery || !lightbox || !lightboxClose) return;

  gallery.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLImageElement)) return;
    openLightbox(target.src, target.alt);
  });

  lightboxClose.addEventListener("click", () => {
    closeLightbox();
  });

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
    { threshold: 0.2, rootMargin: "0px 0px -6% 0px" }
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

function renderServices(services) {
  const container = document.getElementById("servicesList");
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

function renderGallery(gallery) {
  const container = document.getElementById("galleryList");
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

function renderHeroHighlights(highlights) {
  const list = document.getElementById("heroHighlightsList");
  list.innerHTML = "";

  (highlights || []).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.appendChild(li);
  });
}

function renderAboutCards(cards) {
  const container = document.getElementById("aboutCardsList");
  container.innerHTML = "";

  (cards || []).forEach((card, index) => {
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

function renderContent(content) {
  document.getElementById("heroEyebrow").textContent = content.hero.eyebrow;
  document.getElementById("businessName").textContent = content.meta.businessName;
  document.getElementById("footerBusinessName").textContent = content.meta.businessName;
  document.getElementById("heroTitle").textContent = content.hero.title;
  document.getElementById("heroSubtitle").textContent = content.hero.subtitle;
  document.getElementById("heroPrimaryCta").textContent = content.hero.primaryCta;
  document.getElementById("heroSecondaryCta").textContent = content.hero.secondaryCta;
  document.getElementById("heroPanelTitle").textContent = content.hero.panelTitle;
  document.getElementById("aboutKicker").textContent = content.aboutSection.kicker;
  document.getElementById("aboutTitle").textContent = content.aboutSection.title;
  document.getElementById("aboutText").textContent = content.about;
  document.getElementById("ctaText").textContent = content.cta;

  const phone = content.meta.phone || "";
  const email = content.meta.email || "";

  const phoneLink = document.getElementById("phoneLink");
  phoneLink.href = phone ? `tel:${phone.replace(/\s+/g, "")}` : "#";
  phoneLink.textContent = phone || "Telephone a renseigner";

  const emailLink = document.getElementById("emailLink");
  emailLink.href = email ? `mailto:${email}` : "#";
  emailLink.textContent = email || "Email a renseigner";

  renderHeroHighlights(content.hero.highlights || []);
  renderAboutCards(content.aboutSection.cards || []);
  renderServices(content.services || []);
  renderGallery(content.gallery || []);
  registerReveals(document);
}

async function init() {
  try {
    setupLightbox();
    registerReveals(document);
    const content = await loadContent();
    renderContent(content);
    document.getElementById("year").textContent = new Date().getFullYear();
  } catch (error) {
    const about = document.getElementById("aboutText");
    about.textContent = "Le site est en cours de configuration.";
    console.error(error);
  }
}

init();
