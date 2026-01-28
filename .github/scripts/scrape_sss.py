#!/usr/bin/env python3
"""
Scraper SSS avec interception DWR - Python + Playwright
Extrait les vrais IDs depuis les réponses serveur DWR
"""

from playwright.sync_api import sync_playwright
import os
import sys
import re
import json
import codecs
import unicodedata
from datetime import datetime
from supabase import create_client, Client


def decode_unicode_escapes(text):
    """
    Décode les séquences d'échappement Unicode dans une chaîne.
    Gère TOUS les formats possibles:
      - \\u00F6 (double backslash)
      - \u00F6 (simple backslash)
      - /u00F6 (forward slash - format SSS)
      - &#xE9; (HTML hex entity)
      - &#233; (HTML decimal entity)
    Exemples:
      - "Z/u00fcRICH" -> "ZÜRICH"
      - "St-L\\u00E9gier" -> "St-Légier"
      - "SLRG H\\u00f6NGG" -> "SLRG Högg"
    """
    if not text:
        return text

    # Protection contre les inputs trop longs (1MB max)
    if len(text) > 1_000_000:
        return text

    try:
        result = text

        # 1. Remplacer les séquences Unicode avec backslash ou slash
        # Pattern: 1-4 / ou \ suivi de u et 4 chiffres hex (limité pour éviter ReDoS)
        def replace_unicode(match):
            try:
                code_point = int(match.group(1), 16)
                return chr(code_point)
            except (ValueError, OverflowError):
                return match.group(0)  # Retourner l'original si erreur

        # Gérer \\u, \u, /u, //u etc. - Pattern limité à 1-4 répétitions
        result = re.sub(r'[/\\]{1,4}u([0-9a-fA-F]{4})', replace_unicode, result)

        # 2. Gérer les entités HTML hex (&#xE9;) - limité à 6 hex digits
        def replace_html_hex(match):
            try:
                code_point = int(match.group(1), 16)
                if code_point > 0x10FFFF:  # Invalid Unicode
                    return match.group(0)
                return chr(code_point)
            except (ValueError, OverflowError):
                return match.group(0)
        result = re.sub(r'&#x([0-9a-fA-F]{1,6});', replace_html_hex, result)

        # 3. Gérer les entités HTML décimales (&#233;) - limité à 7 digits
        def replace_html_dec(match):
            try:
                code_point = int(match.group(1))
                if code_point > 0x10FFFF:  # Invalid Unicode
                    return match.group(0)
                return chr(code_point)
            except (ValueError, OverflowError):
                return match.group(0)
        result = re.sub(r'&#(\d{1,7});', replace_html_dec, result)

        # 4. Normaliser les caractères Unicode (NFD -> NFC)
        # Convertit les caractères décomposés en composés (e + accent -> é)
        result = unicodedata.normalize('NFC', result)

        return result
    except Exception as e:
        print(f"   ⚠️ Erreur décodage Unicode: {type(e).__name__}")
        return text


def clean_text(text):
    """
    Nettoie une chaîne de texte:
    - Décode les séquences Unicode
    - Supprime les espaces en trop
    - Supprime les caractères de contrôle
    """
    if not text:
        return text

    # Décoder les séquences Unicode
    text = decode_unicode_escapes(text)

    # Supprimer les espaces multiples
    text = re.sub(r'\s+', ' ', text)

    # Supprimer les espaces au début et à la fin
    text = text.strip()

    return text

# Configuration Supabase (depuis GitHub Secrets)
SUPABASE_URL = os.environ.get('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.environ.get('SUPABASE_SERVICE_KEY')


def extract_field_from_block(block, field_name):
    """
    Extrait la valeur d'un champ depuis un bloc DWR.
    Retourne None si le champ n'existe pas ou est vide.
    """
    # Pattern pour extraire value: "..." ou value: '...'
    pattern = rf'"{field_name}"[^}}]*?value:\s*"([^"]*)"'
    match = re.search(pattern, block)
    if match:
        value = match.group(1).strip()
        return value if value else None
    return None


def extract_date_from_block(block, field_name):
    """
    Extrait une date depuis un bloc DWR.
    Gère le format: new Date(year, month, day)
    Retourne une chaîne au format DD.MM.YYYY ou None.
    """
    # Pattern pour new Date(year, month, day)
    pattern = rf'"{field_name}"[^}}]*?new\s*Date\s*\(\s*(\d{{4}})\s*,\s*(\d{{1,2}})\s*,\s*(\d{{1,2}})\s*\)'
    match = re.search(pattern, block)
    if match:
        year, month, day = match.groups()
        # Attention: mois JavaScript = 0-indexed, donc on ajoute 1
        return f"{int(day):02d}.{int(month)+1:02d}.{year}"
    return None


def extract_number_from_block(block, field_name):
    """
    Extrait un nombre depuis un bloc DWR.
    Retourne None si le champ n'existe pas.
    """
    pattern = rf'"{field_name}"[^}}]*?value:\s*(\d+)'
    match = re.search(pattern, block)
    if match:
        return int(match.group(1))
    return None


def parse_dwr_response(response_text):
    """
    Parse la réponse DWR pour extraire les formations.
    NOUVELLE APPROCHE: Extrait par BLOC pour éviter les décalages de données.
    Chaque formation est extraite avec toutes ses données ensemble.
    """
    formations = []

    try:
        # Trouver tous les blocs de formation
        # Chaque formation commence par "key: new nice2.entity.PrimaryKey('XXXXX')"
        # On split la réponse par ce pattern pour obtenir des blocs individuels

        # D'abord, trouver toutes les positions des keys
        key_pattern = r"key:\s*new\s+nice2\.entity\.PrimaryKey\(['\"](\d+)['\"]\)"
        key_matches = list(re.finditer(key_pattern, response_text))

        if not key_matches:
            print("   ⚠️ Aucune formation trouvée dans la réponse DWR")
            return []

        print(f"   🔍 {len(key_matches)} formations détectées")

        # Pour chaque key, extraire le bloc de données correspondant
        for i, match in enumerate(key_matches):
            key = match.group(1)

            # Définir les limites du bloc: de cette key jusqu'à la prochaine (ou fin)
            start_pos = match.start()
            if i + 1 < len(key_matches):
                end_pos = key_matches[i + 1].start()
            else:
                end_pos = len(response_text)

            # Extraire le bloc de cette formation
            block = response_text[start_pos:end_pos]

            # Extraire chaque champ depuis CE bloc spécifique
            titre_raw = extract_field_from_block(block, "relEvent_category")
            lieu_raw = extract_field_from_block(block, "geoloc_city")
            organisateur_raw = extract_field_from_block(block, "company_c")

            # Nettoyer les textes (décoder Unicode)
            titre = clean_text(titre_raw)
            lieu = clean_text(lieu_raw)  # Peut être None si pas de lieu
            organisateur = clean_text(organisateur_raw)

            # Extraire les dates depuis ce bloc
            debut = extract_date_from_block(block, "first_course_date")
            fin = extract_date_from_block(block, "last_course_date")

            # Extraire les places depuis ce bloc
            max_p = extract_number_from_block(block, "participation_max")
            reg = extract_number_from_block(block, "registration")

            # Calculer la disponibilité
            places = None
            places_color = 'gray'
            places_status = 'Inconnu'

            if max_p is not None and reg is not None:
                available = max_p - reg
                if available <= 0:
                    places = 'Complet'
                    places_color = 'red'
                    places_status = 'Complet'
                elif available <= 3:
                    places = f'{available} places'
                    places_color = 'orange'
                    places_status = 'Peu de places'
                else:
                    places = f'{available} places'
                    places_color = 'green'
                    places_status = 'Places disponibles'

            # Construire l'objet formation
            # On ne met PAS de valeurs par défaut inventées - si c'est vide, c'est None
            formation = {
                'url': f'https://formation.sss.ch/Calendrier-des-Cours#detail&key={key}',
                'titre': titre,
                'lieu': lieu,  # Peut être None - c'est OK
                'organisateur': organisateur,
                'debut': debut,
                'fin': fin,
                'places': places,
                'places_color': places_color,
                'places_status': places_status,
                'key': key,
                'abbreviation': key,
                'scraped_at': datetime.utcnow().isoformat(),
            }

            # N'ajouter que si on a au moins un titre et un organisateur
            if titre and organisateur:
                formations.append(formation)
            else:
                print(f"   ⚠️ Formation key={key} ignorée (titre ou organisateur manquant)")

        # Statistiques
        with_lieu = sum(1 for f in formations if f.get('lieu'))
        with_dates = sum(1 for f in formations if f.get('debut'))
        print(f"   📊 Formations valides: {len(formations)}")
        print(f"   📍 Avec lieu: {with_lieu} ({with_lieu*100//max(len(formations),1)}%)")
        print(f"   📅 Avec dates: {with_dates} ({with_dates*100//max(len(formations),1)}%)")

        return formations

    except Exception as e:
        print(f"⚠️ Erreur parsing DWR: {e}")
        import traceback
        traceback.print_exc()
        return []


def scrape_sss_formations():
    """
    Scrape toutes les formations SSS en interceptant les réponses DWR.
    Retourne une liste de dictionnaires avec les vrais IDs.
    """
    all_formations = []
    dwr_responses = []

    def capture_dwr_response(response):
        """Intercepte les réponses DWR"""
        try:
            if 'search.dwr' in response.url and response.status == 200:
                text = response.text()
                if 'PrimaryKey' in text:
                    dwr_responses.append(text)
                    print(f"   📡 Réponse DWR interceptée ({len(text)} caractères)")
        except Exception as e:
            print(f"   ⚠️ Erreur capture DWR: {e}")

    print("🚀 Démarrage du scraper SSS avec interception DWR")

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        context = browser.new_context(
            user_agent='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        )
        page = context.new_page()

        # Intercepter les réponses
        page.on('response', capture_dwr_response)

        print("🌐 Chargement de la page SSS...")
        page.goto('https://formation.sss.ch/Calendrier-des-Cours', wait_until='load', timeout=60000)
        # Attendre que DWR charge les données (5 secondes suffisent)
        page.wait_for_timeout(5000)

        # Parser la première page de résultats
        if dwr_responses:
            formations = parse_dwr_response(dwr_responses[-1])
            all_formations.extend(formations)
            print(f"   ✅ Page 1: {len(formations)} formations extraites")
        else:
            print("   ⚠️ Aucune réponse DWR interceptée sur la première page")

        # Pagination : cliquer sur "suivant" jusqu'à la fin
        page_num = 1
        max_pages = 100

        while page_num < max_pages:
            # Chercher le bouton suivant
            next_btn = page.query_selector('.x-tbar-page-next:not(.x-item-disabled)')

            if not next_btn:
                # Essayer avec un sélecteur plus générique
                next_btn = page.query_selector('button:has-text("›")')

            if not next_btn or not next_btn.is_visible():
                print("🏁 Fin de la pagination")
                break

            # Vider les réponses précédentes
            dwr_responses.clear()

            # Cliquer
            try:
                next_btn.click()
                # Attendre que la nouvelle page de résultats se charge (pas besoin de networkidle)
                page.wait_for_timeout(3000)
            except Exception as e:
                print(f"   ⚠️ Erreur clic pagination: {e}")
                break

            page_num += 1

            # Parser les nouveaux résultats
            if dwr_responses:
                formations = parse_dwr_response(dwr_responses[-1])
                all_formations.extend(formations)
                print(f"   ✅ Page {page_num}: {len(formations)} formations extraites")
            else:
                print(f"   ⚠️ Page {page_num}: Aucune réponse DWR")
                # Continuer quand même, peut-être que la prochaine page fonctionnera

        browser.close()

    print(f"\n📊 Total formations scrapées: {len(all_formations)}")

    # Statistiques détaillées
    if all_formations:
        with_keys = sum(1 for f in all_formations if f.get('key'))
        with_valid_urls = sum(1 for f in all_formations if '#detail&key=' in f.get('url', '') and f.get('key', '').isdigit())
        with_lieux = sum(1 for f in all_formations if f.get('lieu'))

        # Vérifier les problèmes d'encodage Unicode
        unicode_issues = []
        for f in all_formations:
            for field in ['titre', 'lieu', 'organisateur']:
                value = f.get(field, '')
                if value and (r'\u' in value or '/u' in value or '&#' in value):
                    unicode_issues.append(f"{field}: {value[:50]}")

        percentage = (with_keys / len(all_formations) * 100) if all_formations else 0
        url_percentage = (with_valid_urls / len(all_formations) * 100) if all_formations else 0

        print(f"\n📊 Statistiques d'extraction:")
        print(f"   Total formations: {len(all_formations)}")
        print(f"   Avec keys valides: {with_keys} ({percentage:.1f}%)")
        print(f"   Avec URLs spécifiques valides: {with_valid_urls} ({url_percentage:.1f}%)")
        print(f"   Avec lieu défini: {with_lieux}")

        if unicode_issues:
            print(f"\n⚠️ {len(unicode_issues)} problèmes d'encodage Unicode détectés:")
            for issue in unicode_issues[:5]:  # Afficher max 5 exemples
                print(f"   - {issue}")
        else:
            print(f"\n✅ Aucun problème d'encodage Unicode détecté")

        # Afficher un échantillon
        if all_formations:
            print(f"\n📝 Exemple de formation:")
            sample = all_formations[0]
            print(f"   Key: {sample.get('key')}")
            print(f"   Titre: {sample.get('titre')}")
            print(f"   Lieu: {sample.get('lieu')}")
            print(f"   Dates: {sample.get('debut')} → {sample.get('fin')}")
            print(f"   Places: {sample.get('places')}")
            print(f"   URL: {sample.get('url')}")

    return all_formations


def save_to_supabase(formations):
    """
    Sauvegarde les formations dans Supabase avec logique d'upsert intelligente.
    Utilise maintenant 'key' comme identifiant unique au lieu de (titre, debut, lieu).
    """
    if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
        print("❌ Variables d'environnement Supabase manquantes")
        sys.exit(1)

    print("\n💾 Connexion à Supabase...")
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

    # Étape 1: Marquer toutes les formations existantes comme inactives
    print("🔄 Marquage des formations existantes comme inactives...")
    supabase.table('sss_formations_cache').update({'active': False}).eq('active', True).execute()

    print(f"📤 Traitement de {len(formations)} formations...")

    # Étape 2: Pour chaque formation, upsert basé sur la key
    nouvelles = 0
    reactives = 0

    for formation in formations:
        # Filtrer les formations sans données essentielles
        if not formation.get('titre'):
            continue

        # Créer une copie sans le champ 'key' (colonne n'existe pas dans Supabase)
        formation_data = {k: v for k, v in formation.items() if k != 'key'}

        # Vérifier si la formation existe (par titre + debut + lieu - contrainte UNIQUE)
        existing = supabase.table('sss_formations_cache')\
            .select('id')\
            .eq('titre', formation_data['titre'])\
            .eq('debut', formation_data['debut'])\
            .eq('lieu', formation_data['lieu'])\
            .execute()

        if existing.data and len(existing.data) > 0:
            # Formation existe déjà -> la réactiver et mettre à jour
            formation_id = existing.data[0]['id']
            formation_data['active'] = True
            supabase.table('sss_formations_cache')\
                .update(formation_data)\
                .eq('id', formation_id)\
                .execute()
            reactives += 1
        else:
            # Nouvelle formation -> l'insérer
            formation_data['active'] = True
            supabase.table('sss_formations_cache').insert(formation_data).execute()
            nouvelles += 1

    print(f"✅ Données sauvegardées dans Supabase!")
    print(f"   📊 {nouvelles} nouvelles formations ajoutées")
    print(f"   🔄 {reactives} formations réactivées")
    print(f"   📉 {len(formations) - nouvelles - reactives} formations inchangées")


if __name__ == '__main__':
    try:
        formations = scrape_sss_formations()

        if len(formations) == 0:
            print(f"⚠️ Aucune formation trouvée - probablement une erreur de scraping")
            sys.exit(1)

        save_to_supabase(formations)
        print("\n🎉 Scraping terminé avec succès!")
        print(f"   📍 {sum(1 for f in formations if '#detail&key=' in f.get('url', ''))} URLs avec keys extraits")

    except Exception as e:
        print(f"\n❌ Erreur fatale: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
