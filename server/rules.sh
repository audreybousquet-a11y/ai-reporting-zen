#!/bin/bash
BASE=https://raw.githubusercontent.com/audreybousquet-a11y/ai-reporting-zen/main/server/aria/rules
mkdir -p /home/ubuntu/aria/app/rules
wget -q $BASE/base.md -O /home/ubuntu/aria/app/rules/base.md && echo "OK base.md"
wget -q $BASE/deytime.md -O /home/ubuntu/aria/app/rules/deytime.md && echo "OK deytime.md"
wget -q $BASE/SOURCE.md -O /home/ubuntu/aria/app/rules/SOURCE.md && echo "OK SOURCE.md"
sudo systemctl restart aria_streamlit && echo "Service redemarré"
