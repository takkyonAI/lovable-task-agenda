#!/bin/bash

echo "🚀 Deploy Simples - Removendo Popups"

# Ir para main
git checkout main
git add .
git commit -m "🚫 REMOVE TODOS POPUPS - Deploy Final"
git push origin main

# Build
npm install
npm run build

# Deploy para gh-pages
git checkout gh-pages
rm -rf assets *.html *.js *.css *.png *.svg *.txt CNAME 2>/dev/null || true
cp -r dist/* .
echo "tarefas.rockfellernavegantes.com.br" > CNAME

# Commit e push
git add .
git commit -m "🚫 DEPLOY SEM POPUPS - $(date)"
git push --force origin gh-pages

# Voltar para main
git checkout main

echo "✅ Deploy concluído! Aguarde 2-3 minutos para propagação."
echo "🌐 Site: https://tarefas.rockfellernavegantes.com.br" 