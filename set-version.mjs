// set-version.mjs

// On utilise 'import' au lieu de 'require'
import { execSync } from 'child_process';

try {
  const version = execSync('git describe --tags --always').toString().trim();
  // process.env est un objet global, on peut le modifier directement
  process.env.NEXT_PUBLIC_APP_VERSION = version;
  console.log(`✓ App version set to: ${version}`); // Log pour confirmer
} catch (error) {
  // En cas d'erreur (ex: pas dans un dépôt git), on met une valeur par défaut
  process.env.NEXT_PUBLIC_APP_VERSION = 'local';
  console.log(`✓ App version set to: local`);
}
