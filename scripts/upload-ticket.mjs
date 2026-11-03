import { readFile } from 'node:fs/promises';

const [person, category, filePath, ...labelParts] = process.argv.slice(2);
const filename = labelParts.join(' ') || filePath?.split(/[\\/]/).pop() || 'ulaznica.pdf';
const api = (process.env.API_BASE || '').replace(/\/$/, '');
const token = process.env.ADMIN_TOKEN;
if (!api || !token || !['Juraj', 'Buco'].includes(person) || !['flight', 'train', 'match'].includes(category) || !filePath) {
  console.error('Upotreba: API_BASE=https://... ADMIN_TOKEN=... node scripts/upload-ticket.mjs Juraj train ./ticket.pdf "Naziv ulaznice.pdf"');
  process.exit(2);
}
const bytes = await readFile(filePath);
if (bytes.length > 5 * 1024 * 1024 || bytes.subarray(0, 4).toString() !== '%PDF') {
  console.error('Datoteka mora biti PDF i ne smije biti veća od 5 MB.');
  process.exit(2);
}
const response = await fetch(`${api}/api/admin/tickets`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ person, category, filename, base64: bytes.toString('base64') })
});
const result = await response.json().catch(() => ({}));
if (!response.ok) {
  console.error(`Upload nije uspio (${response.status}): ${result.error || 'Nepoznata pogreška'}`);
  process.exit(1);
}
console.log(`Uspješno učitano: ${person} / ${category} / ${filename}`);
