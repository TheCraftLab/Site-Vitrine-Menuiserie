async function loadContent() {
  const response = await fetch("/api/content");
  if (!response.ok) {
    throw new Error("Impossible de charger les contenus");
  }
  return response.json();
}

function renderServices(services) {
  const container = document.getElementById("servicesList");
  container.innerHTML = "";

  services.forEach((service) => {
    const article = document.createElement("article");
    article.className = "card";
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

  gallery.forEach((item) => {
    const figure = document.createElement("figure");
    figure.className = "gallery-item";
    const image = document.createElement("img");
    image.src = item.url;
    image.alt = item.alt;
    image.loading = "lazy";
    const caption = document.createElement("figcaption");
    caption.textContent = item.alt;
    figure.appendChild(image);
    figure.appendChild(caption);
    container.appendChild(figure);
  });
}

function renderContent(content) {
  document.getElementById("businessName").textContent = content.meta.businessName;
  document.getElementById("footerBusinessName").textContent = content.meta.businessName;
  document.getElementById("heroTitle").textContent = content.hero.title;
  document.getElementById("heroSubtitle").textContent = content.hero.subtitle;
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

  renderServices(content.services || []);
  renderGallery(content.gallery || []);
}

async function init() {
  try {
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
