# Welcome to your Lovable project

## Project info

**URL**: https://lovable.dev/projects/b03e3751-8e15-4a2f-acb9-a23104279212

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/b03e3751-8e15-4a2f-acb9-a23104279212) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

### 🚀 Método Recomendado - GitHub Pages (FUNCIONANDO)

Para deployar mudanças que REALMENTE aparecem no site, use o **método comprovado**:

📖 **[GUIA COMPLETO DE DEPLOY](./GUIA_DEPLOY_CORRETO.md)** ← **LEIA ESTE ARQUIVO!**

**Resumo do processo:**
```bash
# 1. Limpar arquivos antigos (OBRIGATÓRIO)
rm -rf dist assets && rm index.html

# 2. Criar HTML limpo sem referências hardcoded
cat > index.html << 'EOF'
[...HTML limpo...]
EOF

# 3. Build e deploy forçado
npm run build && cp -r dist/* . && git add . && git commit -m "DEPLOY FORÇADO: [mudança] (rebuild completo)" && git push origin main
```

### 📱 Método Alternativo - Lovable

Para mudanças simples, você também pode abrir [Lovable](https://lovable.dev/projects/b03e3751-8e15-4a2f-acb9-a23104279212) e clicar em Share → Publish.

### ⚠️ IMPORTANTE
- **Se mudanças não aparecem**: Use sempre o método GitHub Pages acima
- **Cache do navegador**: Force refresh com `Ctrl+Shift+R` (Windows) ou `Cmd+Shift+R` (Mac)  
- **Aguarde**: 1-2 minutos para o GitHub Pages processar

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)
# Cache Clear - Fri Jul 18 15:40:15 -03 2025
