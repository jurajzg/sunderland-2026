# SUNDERLAND 2026

Privatna, hrvatska travel web-aplikacija za putovanje 5.–6. 11. 2026.
Frontend: Vite + React. Backend: Cloudflare Worker + D1 + R2.
Namjerno nema stvarnih ulaznica, PIN-a ni tajni.

## Lokalno pokretanje (Windows)

Potrebni su Node.js LTS i npm.

```powershell
npm install
npm run dev
```

Otvori adresu koju Vite ispiše (obično http://localhost:5173).

## Testovi

```powershell
npm test
```

Ovi testovi provjeravaju osnovne funkcije i prikaz. Sigurnosni testovi backend-a zahtijevaju lokalni Cloudflare Wrangler i konfiguriranu testnu bazu/R2.

## Cloudflare lokalni backend

```powershell
npm install
npx wrangler d1 migrations apply sunderland-db --local
npx wrangler dev
```

Frontend je zasebno na Vite dev serveru. Za povezivanje lokalnog frontenda s Workerom postavi `VITE_API_BASE=http://127.0.0.1:8787` u `.env.local`.

## Cloudflare produkcija

1. Kreiraj D1 bazu `sunderland-db`.
2. Kreiraj privatni R2 bucket `sunderland-tickets`.
3. Postavi Worker secrets: `TICKET_PIN_HASH`, `ADMIN_TOKEN_HASH`, `SESSION_SECRET`.
4. Poveži D1 i R2 bindinge prema `wrangler.toml`.
5. Primijeni migracije: `npx wrangler d1 migrations apply sunderland-db --remote`.
6. Deploy: `npx wrangler deploy`.
7. Frontend deployaj na Cloudflare Pages i postavi `VITE_API_BASE` na Worker URL.

**Važno:** Ovo je početni projekt koji se mora lokalno testirati i dovršiti prije objave. Ne stavljati stvarne PDF ulaznice dok produkcijski testovi ne prođu. Nemoj koristiti kratki ili predvidljivi PIN. Preporuka: najmanje 8 nasumičnih znamenki.

## Sigurnosni model

- Javni PIN služi samo za čitanje ulaznica.
- Administracija koristi zaseban tajni token (ne isti PIN).
- PDF-ovi su u privatnom R2 bucketu i poslužuju se samo nakon provjere sesije.
- Sesije se čuvaju u D1; zaključavanje opoziva samo trenutačnu sesiju.
- 15 minuta neaktivnosti; promjena PIN hash konfiguracije opoziva stare sesije.
- Rate limiting je po IP-u u D1, s atomskim UPSERT brojačem.
- Cloudflare Worker koristi `CF-Connecting-IP`; ne vjeruje `X-Forwarded-For`.
- Prije javne objave treba dodati/konfigurirati Cloudflare Turnstile ili drugi anti-bot sloj ako prijetnje to opravdavaju.

Za početnu verziju administratorski endpointi zahtijevaju `Authorization: Bearer <ADMIN_TOKEN>` i hash tokena uspoređuje se na serveru. Admin token nikada ne smije biti u frontend kodu.
