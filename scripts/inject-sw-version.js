// Script post-build: injecte un timestamp dans service-worker.js
// pour forcer la mise a jour du cache sur chaque deploiement.
import { readFileSync, writeFileSync, existsSync } from 'fs';

const swPath = 'dist/service-worker.js';

if (existsSync(swPath)) {
  const content = readFileSync(swPath, 'utf-8');
  const updated = content.replace('__BUILD_TIMESTAMP__', Date.now().toString());
  writeFileSync(swPath, updated);
  console.log(`SW version injectee: probain-${Date.now()}`);
} else {
  console.warn('service-worker.js non trouve dans dist/');
}
