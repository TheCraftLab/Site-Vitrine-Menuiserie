# Site vitrine menuiserie (HTML/CSS/JS + admin)

Ce projet fournit:

- une page vitrine one-page (`/`)
- une page admin simple (`/admin.html`) pour modifier textes et photos
- une stack Docker compatible Portainer pour Raspberry Pi

## 1) Lancer en local

Prerequis:

- Node.js 20+

Commandes:

```bash
npm install
ADMIN_TOKEN=mon-token-securise npm start
```

Ensuite:

- Site public: `http://localhost:3000`
- Admin: `http://localhost:3000/admin.html`

## 2) Lancer avec Docker Compose

```bash
cp .env.example .env
# modifier ADMIN_TOKEN dans .env
docker compose up -d --build
```

Ensuite:

- Site public: `http://localhost:8080`
- Admin: `http://localhost:8080/admin.html`

## 3) Deploiement Portainer (Stack depuis Git)

1. Pousser ce dossier sur ton repo Git.
2. Dans Portainer: `Stacks` -> `Add stack` -> `Repository`.
3. Renseigner:
   - repository URL Git
   - chemin compose: `docker-compose.yml`
   - variables d'environnement:
     - `ADMIN_TOKEN` (obligatoire, token fort)
     - `TZ` (ex: `Europe/Paris`)
4. Deploy stack.

La stack expose le site sur le port `8080` du Raspberry Pi.

## 4) Stockage des donnees

Les donnees sont persistées dans le volume Docker `vitrine_data`:

- `/data/content.json` (textes)
- `/data/uploads/` (photos)

## 5) API utile

- `GET /api/content` -> lire le contenu public
- `PUT /api/content` -> modifier les textes (header `x-admin-token`)
- `POST /api/upload` -> uploader une image (champ form-data `photo`, header `x-admin-token`)
- `DELETE /api/upload/:filename` -> supprimer une image (header `x-admin-token`)

## 6) Git: demarrage rapide

```bash
git init
git add .
git commit -m "Initial: site vitrine one-page + admin + stack portainer"
```
