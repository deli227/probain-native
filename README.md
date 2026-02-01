# Pro Bain Connect

Plateforme de mise en relation pour la securite aquatique en Suisse. Application PWA deployee via Vercel, distribuee sur Google Play et iOS via Despia.

## Stack

- React 18.3, TypeScript 5.5, Vite 5.4
- Shadcn/UI, Tailwind CSS 3.4, Radix UI
- TanStack Query 5 + persistence localStorage
- Supabase (PostgreSQL, Auth, Storage, Real-time)

## Commandes

```bash
npm run dev          # Serveur dev (port 8080)
npm run build        # Build production
npm run test         # Tests unitaires (Vitest)
npx playwright test  # Tests E2E (Playwright)
```

## Documentation

| Document | Contenu |
|----------|---------|
| [CLAUDE.md](CLAUDE.md) | Architecture, composants, hooks, patterns, bugs resolus |
| [project-context.md](project-context.md) | Regles de developpement, conventions, securite |
| [docs/despia.md](docs/despia.md) | Framework natif iOS/Android (Despia) |
| [docs/data-models.md](docs/data-models.md) | Schema base de donnees Supabase |

## Production

https://www.probain.ch
