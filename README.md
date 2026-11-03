# SUNDERLAND 2026

Privatna hrvatska travel web-aplikacija za putovanje 5.–6. 11. 2026. Frontend je Vite + React, a zaštićeni API radi kao **Cloudflare Pages Function na istoj domeni**. Metapodaci su u D1, PDF ulaznice u privatnom R2 bucketu.

## Lokalno pokretanje

```powershell
npm install
npm run dev
npm test
npm run build
```

## Cloudflare Pages – obavezna konfiguracija

1. GitHub repozitorij ostaje povezan s Cloudflare Pages projektom. Build command: `npm run build`; output directory: `dist`.
2. U Pages projektu otvori **Settings → Functions → D1 database bindings** i dodaj binding `DB` na bazu `sunderland-db`.
3. U **R2 bucket bindings** dodaj binding `BUCKET` na privatni bucket `sunderland-tickets`. Ne uključuj Public Development URL ni public access.
4. U **Settings → Variables and Secrets** dodaj:
   - `ALLOWED_ORIGIN` = točna javna adresa Pages web-stranice, npr. `https://sunderland-2026.pages.dev`
   - `TICKET_PIN_HASH` = PBKDF2 hash PIN-a u formatu opisanom niže (kao Secret)
   - `ADMIN_TOKEN_HASH` = SHA-256 hash zasebnog, dugog administratorskog tokena (kao Secret)
5. Za D1 primijeni SQL migracije iz `worker/migrations/0001_init.sql` i `worker/migrations/0002_ticket_indexes.sql` putem Cloudflare D1 konzole ili Wrangler CLI-ja. Ako je baza već inicijalizirana, provjeri postoje li tablice i indeksi prije ponovnog izvršavanja.
6. Nakon svakog ažuriranja provjeri `https://TVOJA-PAGES-ADRESA/api/health` – treba vratiti `{"ok":true,"service":"sunderland-2026"}`.

**Važno:** više se ne koristi zaseban `workers.dev` API niti varijabla `VITE_API_BASE`. Frontend i API su na istoj domeni. To uklanja problem third-party kolačića.

## Sigurno generiranje tajni (lokalno na Windowsu)

Nemoj slati PIN ili administratorski token u chat i nemoj ih spremati u GitHub.

Za PIN pokreni PowerShell iz korijena projekta. Ova naredba generira slučajnu sol i PBKDF2-SHA256 hash (310.000 iteracija):

```powershell
node --input-type=module -e "import {pbkdf2Sync,randomBytes} from 'node:crypto'; const pin=process.argv[1]; const salt=randomBytes(16); const hash=pbkdf2Sync(pin,salt,310000,32,'sha256'); console.log('pbkdf2-sha256$310000$'+salt.toString('hex')+'$'+hash.toString('hex'))" "TVOJ_PIN"
```

Za administratorski token generiraj zasebnu nasumičnu vrijednost i spremi je u password manager. Hashiraj token:

```powershell
node -e "const c=require('crypto'); process.stdout.write(c.createHash('sha256').update(process.argv[1]).digest('hex'))" "TVOJ_DUGI_ADMIN_TOKEN"
```

U Cloudflare spremi hash kao Secret, a stvarni admin token koristi samo lokalno za učitavanje PDF-ova.

## Učitavanje PDF ulaznica

PDF-ovi se **ne spremaju u GitHub**, `public/` ni frontend bundle. Nakon konfiguracije Pages bindinga i tajni koristi administratorsku skriptu s lokalnog računala:

```powershell
$env:API_BASE="https://TVOJA-PAGES-ADRESA"
$env:ADMIN_TOKEN="TVOJ_ADMIN_TOKEN"
node scripts/upload-ticket.mjs Juraj train "C:\putanja\Juraj-Edinburgh-Newcastle.pdf" "Edinburgh Gateway – Newcastle.pdf"
node scripts/upload-ticket.mjs Juraj train "C:\putanja\Juraj-Newcastle-Sunderland.pdf" "Newcastle – Sunderland.pdf"
node scripts/upload-ticket.mjs Buco train "C:\putanja\Buco-Edinburgh-Newcastle.pdf" "Edinburgh Gateway – Newcastle.pdf"
node scripts/upload-ticket.mjs Buco train "C:\putanja\Buco-Newcastle-Sunderland.pdf" "Newcastle – Sunderland.pdf"
```

Za utakmicu koristi kategoriju `match`, a za buduće avionske karte `flight`. Maksimalna veličina PDF-a je 5 MB.

## Sigurnosne značajke i provjere

- PDF objekti pohranjuju se u privatni R2; API ih vraća samo nakon provjere aktivne sesije.
- PIN se provjerava PBKDF2-SHA256 derivacijom sa slučajnom soli, ne običnim SHA-256 hashom.
- Sesijski kolačić je `HttpOnly`, `Secure`, `SameSite=Strict`; API i stranica su isti origin.
- Sesija istječe nakon 15 minuta neaktivnosti; gumb zaključavanja opoziva sesiju na serveru.
- Pet neuspješnih pokušaja s iste IP adrese aktivira blokadu od 15 minuta.
- Administratorski token je odvojen od PIN-a; API provjerava njegov hash.
- Promjena `TICKET_PIN_HASH` automatski poništava stare sesije pri sljedećem API zahtjevu.

Prije učitavanja stvarnih ulaznica obavezno testirati u produkcijskom pregledniku: ispravan i pogrešan PIN, pet pogrešnih pokušaja, izričito zaključavanje, istek nakon 15 minuta, direktan `/api/tickets/ID` bez kolačića, admin upload i brisanje te ponašanje na mobitelu. ZIP ne sadrži stvarne PDF ulaznice niti tajne. Sama izgradnja koda nije zamjena za produkcijski sigurnosni test.
