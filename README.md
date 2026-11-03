# SUNDERLAND 2026

Privatna hrvatska travel web-aplikacija za putovanje 5.–6. 11. 2026. Frontend je Vite + React, a stranica se objavljuje putem Cloudflare Pages.

## Ulaznice

PDF ulaznice nalaze se u `public/tickets/` i prikazuju se na stranicama Letovi, Vlakovi i Utakmica. Trenutačno su dodane četiri željezničke karte za Jurja i Bucu. PDF-ovi za letove i utakmicu mogu se dodati naknadno u istu mapu, uz ažuriranje popisa u `src/ui/App.jsx`.

**Važno:** ulaznice su javne. Svatko tko zna ili pronađe izravnu adresu PDF-a može ga otvoriti. Nemojte u ovu mapu stavljati dokumente koje želite zaštititi.

## Lokalno pokretanje

```powershell
npm install
npm run dev
npm test
npm run build
```

## Cloudflare Pages

- GitHub repozitorij: `jurajzg/sunderland-2026`
- Production branch: `main`
- Build command: `npm run build`
- Build output directory: `dist`

Za ovu pojednostavljenu verziju nisu potrebni Cloudflare Worker, Pages Functions, D1, R2 ni tajne/varijable za PIN. PDF-ovi iz `public/tickets/` automatski se kopiraju u `dist/tickets/` pri izgradnji.

## Dodavanje novih PDF-ova

1. Stavite PDF u `public/tickets/`.
2. Dodajte osobu, naziv i URL u `PUBLIC_TICKETS` u `src/ui/App.jsx` pod odgovarajuću kategoriju (`flight`, `train` ili `match`).
3. Commitajte promjene na radnu granu i provjerite deploy preview prije spajanja s `main`.


## Javne PDF ulaznice

Željezničke i utakmične PDF ulaznice nalaze se u `public/tickets/` i dostupne su bez PIN-a. Svatko tko zna ili pronađe URL može ih otvoriti. Za utakmicu su dodane datoteke `Sunderland-Dinamo-Juraj.pdf` i `Sunderland-Dinamo-Buco.pdf`. Vrijeme početka na ulaznicama je 21:00 po lokalnom vremenu u Sunderlandu; prikaz na web-stranici usklađen je s ulaznicama.
