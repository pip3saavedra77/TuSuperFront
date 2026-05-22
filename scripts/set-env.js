/**
 * Genera environment.prod.ts antes del build en Render.
 * Uso: API_URL=https://tu-api.onrender.com node scripts/set-env.js
 */
const fs = require('node:fs');
const path = require('node:path');

const apiUrl = process.env.API_URL?.trim();

if (!apiUrl) {
  console.error('ERROR: Define la variable API_URL con la URL del backend en Render.');
  process.exit(1);
}

const target = path.join(__dirname, '..', 'src', 'environments', 'environment.prod.ts');
const contents = `export const environment = {
  production: true,
  apiUrl: '${apiUrl.replace(/'/g, "\\'")}',
};
`;

fs.writeFileSync(target, contents, 'utf8');
console.log(`environment.prod.ts generado con apiUrl=${apiUrl}`);
