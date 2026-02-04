-- Migration: Supprimer la table push_subscriptions (inutilisee)
-- La table a ete creee dans 20260204200000 mais n'est jamais lue ni ecrite.
-- L'approche actuelle utilise include_aliases (external_id) via setonesignalplayerid://
-- sans stocker les player IDs en BDD.

DROP TABLE IF EXISTS push_subscriptions CASCADE;
