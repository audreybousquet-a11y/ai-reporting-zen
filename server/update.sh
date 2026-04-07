#!/bin/bash
BASE=https://raw.githubusercontent.com/audreybousquet-a11y/ai-reporting-zen/main/server/aria
wget --no-cache -q $BASE/aria.py -O /home/ubuntu/aria/app/aria.py
sudo systemctl restart aria_streamlit
echo "OK"
