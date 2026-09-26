#!/bin/bash
# Авто-пуш: add + commit + pull --rebase + push
# Использование: ./push.sh "сообщение коммита"

if [ -z "$1" ]; then
  echo "❌ Укажи сообщение коммита: ./push.sh \"my message\""
  exit 1
fi

git add .
git commit -m "$1"
git pull --rebase
git push