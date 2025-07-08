# 📧 Sistema EmailJS - Gerenciador de Tarefas Rockfeller Navegantes

## 📋 Visão Geral

Este sistema utiliza **EmailJS** para envio automático de emails de boas-vindas quando novos usuários são criados pelos administradores. O sistema envia as credenciais temporárias diretamente para o email do novo usuário.

## ⚙️ Configuração Atual

### Credenciais EmailJS
- **Service ID**: `service_hmmn1zm`
- **Template ID**: `template_2qhsrkf`
- **Public Key**: `I6gkd8EbGFtQiA1y7`
- **Email Remetente**: `navegantes@rockfellerbrasil.com.br`

### Template de Email
O template inclui as seguintes variáveis dinâmicas:
- `{{app_name}}` - Nome da aplicação
- `{{user_name}}` - Nome do usuário criado
- `{{user_email}}` - Email do usuário
- `{{temp_password}}` - Senha temporária gerada
- `{{user_role}}` - Papel/função do usuário
- `{{app_url}}` - URL da aplicação

## 🔧 Como Funciona

### 1. Processo de Criação de Usuário
1. **Administrador acessa** "Gerenciar Usuários"
2. **Clica em** "Novo Usuário"
3. **Preenche os dados**: Nome, Email, Papel
4. **Sistema gera** senha temporária segura
5. **Cria usuário** no Supabase Auth
6. **Cria perfil** na tabela user_profiles
7. **Envia email** via EmailJS com credenciais

### 2. Fluxo de Segurança
- ✅ **Preserva sessão** do administrador durante criação
- ✅ **Verifica conflitos** de usuários órfãos
- ✅ **Gera senhas seguras** (16 caracteres)
- ✅ **Marca usuário** para trocar senha no primeiro login
- ✅ **Logs detalhados** para debugging

### 3. Tratamento de Erros
- ❌ **Email falha**: Mostra senha no toast de fallback
- ❌ **Usuário existe**: Atualiza perfil existente
- ❌ **Rede indisponível**: Timeout de 30 segundos
- ❌ **Credenciais inválidas**: Log detalhado do erro

## 📱 Manual de Uso para Administradores

### Criando um Novo Usuário

1. **Faça login** como Administrador
2. **Navegue** para "Gerenciar Usuários" (ícone de usuários na lateral)
3. **Clique** no botão **"+ Novo Usuário"**
4. **Preencha o formulário**:
   - **Nome**: Nome completo do usuário
   - **Email**: Email válido (será usado para login)
   - **Papel**: Selecione o nível de acesso
5. **Clique** em **"Criar Usuário"**

### Papéis Disponíveis
- **Admin**: Acesso total ao sistema
- **Franqueado**: Gerencia sua unidade
- **Supervisor ADM**: Supervisiona processos administrativos
- **Coordenador**: Coordena equipes e projetos
- **Assessora ADM**: Suporte administrativo
- **Professor**: Acesso acadêmico
- **Vendedor**: Foco em vendas e leads

### O que Acontece Após Criação
1. **Email automático** é enviado para o usuário
2. **Senha temporária** é gerada (16 caracteres)
3. **Usuário deve trocar** a senha no primeiro login
4. **Administrador** permanece logado normalmente

## 🚨 Troubleshooting

### Email Não Foi Enviado
1. **Verifique** o console do navegador (F12)
2. **Procure por erros** relacionados ao EmailJS
3. **Confirme** se as credenciais estão corretas
4. **Teste** a conectividade com a internet

### Usuário Já Existe
- Sistema **atualiza automaticamente** o perfil existente
- **Não há duplicação** de usuários
- **Email ainda é enviado** com nova senha

### Problemas de Login do Novo Usuário
1. **Verifique** se o email foi entregue (spam/lixo)
2. **Confirme** se a senha foi copiada corretamente
3. **Teste** fazer login na aplicação
4. **Usuário deve** trocar senha no primeiro acesso

## 🔐 Segurança

### Geração de Senhas
- **16 caracteres** aleatórios
- **Inclui**: letras maiúsculas, minúsculas, números, símbolos
- **Única** para cada usuário
- **Criptografada** no banco de dados

### Proteção de Sessão
- **Sessão do admin** é preservada durante criação
- **Restauração automática** após operação
- **Isolamento** de contextos de usuário

### Primeiras Senhas
- **Obrigatória troca** no primeiro login
- **Flag** `first_login_completed: false`
- **Interface especial** para mudança inicial

## 📋 Logs e Monitoramento

### Console Logs Disponíveis
```javascript
// Processo de criação
🚀 Iniciando processo de envio de email...
📧 Verificando EmailJS...
🔄 Reinicializando EmailJS...

// Perfil de usuário
🔄 Atualizando perfil existente para user_id: xxx
✨ Criando novo perfil para user_id: xxx

// Sucesso
✅ Email enviado com sucesso!
📊 Status da resposta: 200
📝 Texto da resposta: OK

// Erros
❌ Erro ao enviar email: [detalhes]
🌐 Problema de rede detectado
⏱️ Timeout detectado
```

## 🔧 Manutenção

### Atualização de Credenciais
Se precisar alterar as credenciais do EmailJS:

1. **Edite** `src/constants/app.ts`
2. **Atualize** as constantes:
   ```typescript
   export const EMAILJS_CONFIG = {
     SERVICE_ID: 'novo_service_id',
     TEMPLATE_ID: 'novo_template_id', 
     PUBLIC_KEY: 'nova_public_key'
   };
   ```

### Modificação do Template
Para alterar o template de email:

1. **Acesse** [EmailJS Dashboard](https://dashboard.emailjs.com)
2. **Edite** o template `template_2qhsrkf`
3. **Mantenha** as variáveis: `{{user_name}}`, `{{user_email}}`, `{{temp_password}}`, etc.

## 📞 Suporte

Para problemas técnicos:
1. **Verifique** os logs do console
2. **Teste** com usuário diferente
3. **Confirme** credenciais do EmailJS
4. **Verifique** conectividade de rede

---

**Sistema desenvolvido para Rockfeller Navegantes - 2025** 