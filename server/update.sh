#!/bin/bash
wget -q https://raw.githubusercontent.com/audreybousquet-a11y/ai-reporting-zen/main/server/aria/aria.py -O /home/ubuntu/aria/app/aria.py
sudo systemctl restart aria_streamlit
echo "OK"
