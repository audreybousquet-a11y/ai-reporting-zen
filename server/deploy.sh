#!/bin/bash
BASE=https://raw.githubusercontent.com/audreybousquet-a11y/ai-reporting-zen/main/server/aria
FILES="aria.py sql_ai.py db.py mcd.py persistence.py viz.py ui_aide.py ui_dashboards.py ui_emails.py ui_historique.py ui_parametres.py ui_recette.py style_dark.css style_light.css style_deytime.css"
mkdir -p /home/ubuntu/aria/app
for f in $FILES; do
  wget -q $BASE/$f -O /home/ubuntu/aria/app/$f && echo "OK: $f"
done
wget -q https://raw.githubusercontent.com/audreybousquet-a11y/ai-reporting-zen/main/server/aria/requirements.txt -O /home/ubuntu/aria/app/requirements.txt
cd /home/ubuntu/aria/app && /home/ubuntu/aria/venv/bin/pip install -r requirements.txt -q && echo "Deps OK"
