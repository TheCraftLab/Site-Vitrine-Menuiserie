# Site vitrine menuiserie (HTML/CSS/JS + admin)

Ce projet fournit:

- une page vitrine one-page (`/`)
- une page admin cachee pour modifier textes et photos
- une stack Docker compatible Portainer pour Raspberry Pi

## 1) Lancer en local

Prerequis:

- Node.js 20+

Commandes:

```bash
npm install
ADMIN_PATH=atelier-admin ADMIN_USERNAME=admin ADMIN_PASSWORD=motdepassefort npm start
```

Ensuite:

- Site public: `http://localhost:3000`
- Admin: `http://localhost:3000/<ADMIN_PATH>/`
- Exemple: `http://localhost:3000/atelier-admin/`

## 2) Lancer avec Docker Compose

```bash
cp .env.example .env
# modifier PUBLIC_PORT / ADMIN_PATH / ADMIN_USERNAME / ADMIN_PASSWORD dans .env
docker compose up -d --build
```

Ensuite:

- Site public: `http://localhost:<PUBLIC_PORT>`
- Admin: `http://localhost:<PUBLIC_PORT>/<ADMIN_PATH>/`
- Exemple avec `PUBLIC_PORT=80`: `http://localhost`

## 3) Deploiement Portainer (Stack depuis Git)

1. Pousser ce dossier sur ton repo Git.
2. Dans Portainer: `Stacks` -> `Add stack` -> `Repository`.
3. Renseigner:
   - repository URL Git
   - chemin compose: `docker-compose.yml`
   - variables d'environnement:
     - `PUBLIC_PORT` (port public, ex: `80`)
     - `ADMIN_PATH` (chemin cache, ex: `atelier-admin`)
     - `ADMIN_USERNAME` (identifiant admin)
     - `ADMIN_PASSWORD` (mot de passe fort)
     - `TZ` (ex: `Europe/Paris`)
4. Deploy stack.

La stack expose le site sur le port `PUBLIC_PORT` du Raspberry Pi.

## 3.1) Livebox (acces externe sans 443)

Si tu veux garder le port `443` libre, tu peux publier le site sur `80`:

- Protocole: `TCP`
- Port externe: `80`
- IP interne: `192.168.1.32`
- Port interne: `80` (ou la valeur de `PUBLIC_PORT`)

Ton site sera accessible via:

- `http://IP_PUBLIQUE`

## 4) Stockage des donnees

Les donnees sont persistées dans le volume Docker `vitrine_data`:

- `/data/content.json` (textes)
- `/data/uploads/` (photos)

## 5) API utile

- `GET /api/content` -> lire le contenu public
- `PUT /api/content` -> modifier les textes (auth HTTP Basic admin)
- `POST /api/upload` -> uploader une image (champ form-data `photo`, auth HTTP Basic admin)
- `DELETE /api/upload/:filename` -> supprimer une image (auth HTTP Basic admin)

## 6) Git: demarrage rapide

```bash
git init
git add .
git commit -m "Initial: site vitrine one-page + admin + stack portainer"
```
