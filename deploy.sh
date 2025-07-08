#!/bin/bash

echo "🚀 Iniciando deploy para GitHub Pages..."

# Verificar se estamos na branch main
current_branch=$(git branch --show-current)
if [ "$current_branch" != "main" ]; then
    echo "❌ Erro: Execute este script na branch main"
    exit 1
fi

# Fazer build
echo "🔨 Fazendo build..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Erro no build"
    exit 1
fi

# Copiar build para temp
echo "📦 Preparando arquivos..."
cp -r dist /tmp/gh-pages-build

# Trocar para branch gh-pages
echo "🔄 Trocando para branch gh-pages..."
git checkout gh-pages

# Limpar arquivos antigos e copiar novos
echo "🧹 Atualizando arquivos..."
rm -rf assets index.html favicon.ico placeholder.svg robots.txt .vite node_modules dist
cp -r /tmp/gh-pages-build/* .
rm -rf /tmp/gh-pages-build

# Fazer commit e push
echo "📤 Fazendo deploy..."
git add -A
git commit -m "deploy: update GitHub Pages - $(date)"
git push origin gh-pages

# Voltar para main
git checkout main

echo "✅ Deploy concluído!"
echo "🌐 Seu site estará disponível em: https://tarefas.rockfellernavegantes.com.br"
echo "⏰ Aguarde alguns minutos para propagação"
