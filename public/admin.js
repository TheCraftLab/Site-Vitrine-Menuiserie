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
  heroTitle: document.getElementById("heroTitle"),
  heroSubtitle: document.getElementById("heroSubtitle"),
  aboutText: document.getElementById("aboutText"),
  servicesText: document.getElementById("servicesText"),
  ctaText: document.getElementById("ctaText")
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

function renderForm(content) {
  fields.businessName.value = content.meta.businessName || "";
  fields.phone.value = content.meta.phone || "";
  fields.email.value = content.meta.email || "";
  fields.heroTitle.value = content.hero.title || "";
  fields.heroSubtitle.value = content.hero.subtitle || "";
  fields.aboutText.value = content.about || "";
  fields.ctaText.value = content.cta || "";

  fields.servicesText.value = (content.services || [])
    .map((service) => `${service.title}|${service.description}`)
    .join("\n");
}

function renderGallery(content) {
  galleryAdmin.innerHTML = "";
  if (!content.gallery || !content.gallery.length) {
    galleryAdmin.textContent = "Aucune photo pour le moment.";
    return;
  }

  content.gallery.forEach((item) => {
    const filename = item.url.split("/").pop();
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

    const small = document.createElement("small");
    small.textContent = filename;

    const button = document.createElement("button");
    button.type = "button";
    button.className = "delete-btn";
    button.dataset.file = filename;
    button.textContent = "Supprimer";

    meta.appendChild(strong);
    meta.appendChild(small);
    meta.appendChild(button);
    card.appendChild(image);
    card.appendChild(meta);
    galleryAdmin.appendChild(card);
  });
}

function parseServices(value) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [title, ...rest] = line.split("|");
      return {
        title: (title || "").trim(),
        description: rest.join("|").trim()
      };
    })
    .filter((item) => item.title || item.description);
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

  const payload = {
    meta: {
      businessName: fields.businessName.value,
      phone: fields.phone.value,
      email: fields.email.value
    },
    hero: {
      title: fields.heroTitle.value,
      subtitle: fields.heroSubtitle.value
    },
    about: fields.aboutText.value,
    cta: fields.ctaText.value,
    services: parseServices(fields.servicesText.value)
  };

  try {
    contentState = await apiFetch("/api/content", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    renderGallery(contentState);
    setStatus("Textes enregistres.");
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
      formData.append("alt", altBase || file.name);
      await apiFetch("/api/upload", {
        method: "POST",
        body: formData
      });
    }
    photoInput.value = "";
    altInput.value = "";
    await loadContent();
    setStatus("Photos uploadées.");
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
