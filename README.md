# Roulette Française POC

Prototype complet backend + frontend pour une roulette française en temps réel.

## Prérequis
- Node.js 18+
- Docker + Docker Compose

## Lancer avec Docker Compose
```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend: http://localhost:4000
- MongoDB: localhost:27017

## Lancer en local (sans Docker)
### MongoDB
```bash
docker run --rm -p 27017:27017 --name roulette-mongo mongo:7
```

### Backend
```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Bot exemple
```bash
cd backend
npm install
node scripts/botExample.js
```

Variables utiles:
- `BOT_API_URL` (ex: http://localhost:4000/api)
- `BOT_LOGIN`

## Exemples curl
Login:
```bash
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"login":"alice","friendlyName":"Alice"}'
```

Join table:
```bash
curl -X POST http://localhost:4000/api/tables/join \
  -H "Authorization: Bearer <TOKEN>"
```

State:
```bash
curl http://localhost:4000/api/state \
  -H "Authorization: Bearer <TOKEN>"
```

Place bet:
```bash
curl -X POST http://localhost:4000/api/placeBet \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"betType":"straight","selection":{"number":17},"amount":50}'
```

History:
```bash
curl http://localhost:4000/api/history?limit=5 \
  -H "Authorization: Bearer <TOKEN>"
```
