# WeddingWeb — Priscilla & Olivier

Application complète Next.js + React + TypeScript + Supabase.

## Installation
1. Installe Node.js LTS.
2. Décompresse ce ZIP.
3. Ouvre Terminal dans ce dossier.
4. Exécute `npm install`.
5. Crée/ouvre ton projet Supabase.
6. Dans Supabase > SQL Editor, exécute `supabase/schema.sql`.
7. Dans Supabase > Authentication > Users, crée ton compte administrateur.
8. Copie `.env.example` en `.env.local` et ajoute ton Project URL et ta clé anon.
9. Exécute `npm run dev`.
10. Ouvre `http://localhost:3000`.

Pages :
- `/` site invité
- `/rsvp` RSVP
- `/photos` téléversement de photos
- `/admin` administration

IMPORTANT : ce projet n'est plus un simple fichier `public/index.html`. Une vraie application Next.js doit être lancée avec `npm run dev`. C'est ce qui permet au RSVP, à Supabase, aux photos et à l'administration de fonctionner.

## Mise en ligne
Tu peux ensuite mettre ce dossier sur GitHub et le déployer sur Vercel. Configure les mêmes variables `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY` dans l'hébergement.
