# Modifications mariage 2027 — mise en service

Cette branche est une proposition **non déployée**. Fusionner après vérification.

## 1. Supabase — étape OBLIGATOIRE en premier
Dans Supabase > SQL Editor, exécuter **une seule fois** le contenu de `supabase/migrate-2026-11-rsvp-extras.sql`.

Cette migration ajoute uniquement :
- `guests.is_child` et `guests.child_age` (âge au 17 juillet 2027, 0 à 17 ans)
- `families.song_suggestion`, `message_to_couple`, `shared_memory`
- `photos.notification_sent_at`

Les RSVP et les photos existants ne sont pas effacés. Les enfants existants doivent ensuite être marqués « Enfant » dans l'administration. Aucun prix n'est calculé : les tranches de prix de l'Estérel ne sont pas encore précisées.

## 2. Vercel — notifications (environnement Production)
Déjà configurées pour les envois menu : `RESEND_API_KEY`, `EMAIL_FROM` et `NEXT_PUBLIC_SITE_URL`.

Ajouter :
- `ADMIN_NOTIFY_EMAILS` : une ou deux adresses séparées par une virgule, par exemple vos deux adresses personnelles. Si absent, utilise `ADMIN_EMAILS` comme destinataire.
- SMS facultatifs (service **Twilio**, potentiellement payant) : `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM` et `ADMIN_NOTIFY_PHONES` (numéros internationaux précédés de +1, séparés par des virgules).

Ne jamais mettre de clés dans le code ni de préfixe `NEXT_PUBLIC_` sur les secrets. Tant que Twilio n'est pas configuré, les SMS restent désactivés. Les alertes n'incluent pas d'allergies ou autres réponses privées, seulement une invitation à consulter l'administration.

## 3. Vérifications avant fusion
1. Vérifier que le décompte cible le samedi 17 juillet 2027 à **16 h (Québec)**.
2. Dans Admin > Familles, marquer un invité test comme enfant, puis ouvrir son RSVP : âge demandé uniquement s'il vient.
3. Tester les trois questions facultatives (chanson, petit mot, anecdote), et modifier le RSVP pour vérifier que les réponses sont conservées.
4. Consulter le tableau « Tableau des réponses », filtrer par enfants et allergies, exporter le CSV dans Excel.
5. Ajouter une photo test. Vérifier l'alerte email (ou SMS si configuré) et la modération nom/description, puis approuver.
6. Vérifier la légende au survol sur ordinateur et la légende visible sous la photo sur mobile.
7. Examiner l'arrière-plan botanique sur écran d'ordinateur et sur téléphone.

## 4. Notes
- L'arrière-plan est une **illustration de remplacement assortie au style boho**, et non une copie exacte de l'invitation imprimée. Remplacer `public/images/rsvp-botanical.svg` si le vrai fond sans texte devient disponible.
- Ne pas utiliser le bouton d'envoi collectif du menu pour les tests de notifications.
- Les notifications RSVP sont envoyées à chaque sauvegarde (même une modification).
- La livraison réelle des emails/SMS et le bon fonctionnement de Supabase doivent être testés avant de fusionner.
