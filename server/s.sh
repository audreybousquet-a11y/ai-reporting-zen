#!/bin/bash
BASE=https://raw.githubusercontent.com/audreybousquet-a11y/ai-reporting-zen/main/server/templates
wget -q $BASE/login.html -O /home/ubuntu/aria/templates/login.html
wget -q $BASE/home.html -O /home/ubuntu/aria/templates/home.html
echo "OK"
