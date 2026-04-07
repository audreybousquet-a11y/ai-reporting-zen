"""
persistence.py — I/O JSON (charger/sauvegarder)
Imports stdlib seulement : os, json
"""

import os
import json

# ─── CONSTANTES ───────────────────────────────────────────────────────────────

DATA_SOURCES_FILE = "data_sources.json"
SOURCES_FOLDER = "data_sources_files"
os.makedirs(SOURCES_FOLDER, exist_ok=True)

# ─── SOURCES ──────────────────────────────────────────────────────────────────

def charger_sources():
    if not os.path.exists(DATA_SOURCES_FILE):
        return []
    with open(DATA_SOURCES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

# ─── FAVORIS ──────────────────────────────────────────────────────────────────

def get_favoris_file(source_label):
    safe = source_label.replace(" ", "_").replace(".xlsx", "").replace(".xls", "")
    return f"favoris_{safe}.json"

def charger_favoris(source_label):
    path = get_favoris_file(source_label)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def sauvegarder_favoris(source_label, favoris):
    path = get_favoris_file(source_label)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(favoris, f, ensure_ascii=False, indent=2)

# ─── DASHBOARDS ───────────────────────────────────────────────────────────────

def get_dashboards_file(source_label):
    safe = source_label.replace(" ", "_").replace(".xlsx", "").replace(".xls", "")
    return f"dashboards_{safe}.json"

def charger_dashboards(source_label):
    path = get_dashboards_file(source_label)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return []

def sauvegarder_dashboards(source_label, dashboards):
    path = get_dashboards_file(source_label)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(dashboards, f, ensure_ascii=False, indent=2)

# ─── CONFIG EMAIL / SMTP ──────────────────────────────────────────────────────

EMAIL_CONFIG_FILE = "email_config.json"

def charger_email_config() -> dict:
    if not os.path.exists(EMAIL_CONFIG_FILE):
        return {}
    with open(EMAIL_CONFIG_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def sauvegarder_email_config(config: dict):
    with open(EMAIL_CONFIG_FILE, "w", encoding="utf-8") as f:
        json.dump(config, f, ensure_ascii=False, indent=2)

EMAIL_MODELES_FILE = "email_modeles.json"

def charger_email_modeles() -> dict:
    if not os.path.exists(EMAIL_MODELES_FILE):
        return {}
    with open(EMAIL_MODELES_FILE, "r", encoding="utf-8") as f:
        return json.load(f)

def sauvegarder_email_modeles(data: dict):
    with open(EMAIL_MODELES_FILE, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

# ─── MCD ──────────────────────────────────────────────────────────────────────

def get_mcd_file(source_label):
    safe = source_label.replace(" ", "_").replace(".xlsx", "").replace(".xls", "")
    return f"mcd_{safe}.json"

def charger_mcd(source_label):
    path = get_mcd_file(source_label)
    if os.path.exists(path):
        with open(path, "r", encoding="utf-8") as f:
            return json.load(f)
    return None

def sauvegarder_mcd(source_label, mcd):
    path = get_mcd_file(source_label)
    with open(path, "w", encoding="utf-8") as f:
        json.dump(mcd, f, ensure_ascii=False, indent=2)
