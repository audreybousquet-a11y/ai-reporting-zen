#!/bin/bash
BASE=https://raw.githubusercontent.com/audreybousquet-a11y/ai-reporting-zen/main/server/aria
wget --no-cache -q $BASE/aria.py -O /home/ubuntu/aria/app/aria.py
wget --no-cache -q $BASE/logo-aria.png -O /home/ubuntu/aria/app/logo-aria.png
sudo systemctl restart aria_streamlit
echo "OK"
