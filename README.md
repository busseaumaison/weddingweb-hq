# WeddingWeb V2 — Priscilla & Olivier

Cette version ajoute le RSVP familial par code, le site FR/EN et le système de menu différé.

## Nouveautés
- bouton FR / EN sur le site invité;
- code unique par famille;
- aucun +1 libre;
- liste des personnes pré-invitées seulement;
- présent / absent par personne;
- allergies/intolérances séparées des aversions;
- au moins un courriel par famille, plusieurs permis;
- menu fermé tant que tu ne l'ouvres pas;
- ajout des choix de menu dans l'admin plus tard;
- courriel d'avis de menu en FR ou EN via Resend;
- choix de repas par personne présente;
- gestion des familles, invités, courriels et photos dans l'admin.

## SI TU AS DÉJÀ INSTALLÉ LA V1
Dans Supabase > SQL Editor, exécute **supabase/migrate-v1-to-v2.sql**.

N'exécute pas `schema-v2-fresh.sql` sur ton projet actuel.

La migration renomme l'ancienne table `guests` en `guests_v1_backup`, donc elle ne détruit pas tes anciennes données de test.

## Variables .env.local
Ta V2 a besoin d'une clé serveur supplémentaire :

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_xxxxx
SUPABASE_SERVICE_ROLE_KEY=xxxxx
ADMIN_EMAILS=ton-adresse@email.com
NEXT_PUBLIC_SITE_URL=http://localhost:3000
RESEND_API_KEY=
EMAIL_FROM=Priscilla & Olivier <mariage@ton-domaine.ca>
```

### Service role
Dans Supabase, trouve la clé `service_role` / secret dans les paramètres API du projet.

**Ne partage jamais cette clé et ne la mets jamais dans une variable `NEXT_PUBLIC_...`.**

## Lancer
```bash
npm install
npm run dev
```

Pages :
- `/` site invité
- `/rsvp` RSVP familial
- `/menu` menu (fermé par défaut)
- `/photos` photos
- `/admin` administration

## Créer une famille
Dans Admin > Familles & RSVP :
1. crée `Famille Tremblay`;
2. le système génère un code comme `PO-7K3M9Q`;
3. ajoute chaque personne réellement invitée;
4. ajoute un ou plusieurs courriels si tu les connais déjà.

La famille utilise ensuite ce même code dans `/rsvp`.

## Menu plus tard
Quand l'Estérel t'aura remis le menu :
1. Admin > Menu;
2. ajoute chaque choix en français et en anglais;
3. clique `Ouvrir le menu`;
4. teste `/menu` avec une famille test;
5. configure Resend;
6. clique `Envoyer l'avis par courriel`.

Le système envoie seulement aux familles qui ont terminé leur RSVP et qui ont au moins une personne présente.

## Resend
L'envoi utilise l'API Resend côté serveur. Pour un vrai envoi :
- crée une clé API Resend;
- vérifie idéalement ton domaine;
- remplis `RESEND_API_KEY` et `EMAIL_FROM`;
- après le déploiement, change `NEXT_PUBLIC_SITE_URL` pour l'URL publique.

## Sécurité
Les tables familles/invités/courriels ne sont pas lisibles avec la clé publique. Les routes Next.js valident le code de la famille puis utilisent la clé serveur. Supabase RLS reste activé. L'administration est limitée à Supabase Auth et, si `ADMIN_EMAILS` est rempli, seulement à l'adresse indiquée.
