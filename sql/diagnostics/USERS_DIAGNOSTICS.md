# Diagnósticos de Usuários

Este arquivo consolida consultas SQL úteis para investigar problemas de usuários.

## Maria Thereza Kauss — Diagnóstico Real
(Conteúdo original de diagnose-maria-real-issue.sql; versão completa em `sql/_archive/diagnose-maria-real-issue.sql`)

Passos abrangentes:
1) Verificar existência em auth.users e public.user_profiles (por UUID)
2) Comparar e-mails, confirmar status e conferir formato do hash de senha
3) Simular condições de login (email confirmado, ban, deleted, senha)
4) Verificar políticas RLS em user_profiles
5) Ações: confirmar e-mail, resetar senha, forçar first_login_completed

Snippet de referência:
```sql
-- Exemplo: verificar em auth.users
SELECT au.id, au.email, au.email_confirmed_at, au.last_sign_in_at
FROM auth.users au
WHERE au.id = '<UUID_AQUI>';

-- Exemplo: verificar em user_profiles
SELECT up.user_id, up.email, up.name, up.role, up.is_active
FROM public.user_profiles up
WHERE up.user_id = '<UUID_AQUI>';
```

## Encontrar UUID (Maria Thereza)
(Conteúdo original de encontrar-maria-thereza-uuid.sql; versão completa em `sql/_archive/encontrar-maria-thereza-uuid.sql`)

Dicas:
- Busque por e-mail/nome em perfis e auth
- Verifique usuários órfãos (profile sem auth) e desconectados (auth sem profile)
- Confirme se o UUID antigo existe em alguma tabela

Snippet de referência:
```sql
-- Buscar em user_profiles
SELECT up.user_id, up.name, up.email
FROM public.user_profiles up
WHERE up.email ILIKE '%thereza%' OR up.name ILIKE '%kauss%';

-- Buscar em auth.users
SELECT au.id, au.email, au.raw_user_meta_data->>'full_name'
FROM auth.users au
WHERE au.email ILIKE '%thereza%' OR au.raw_user_meta_data->>'full_name' ILIKE '%kauss%';
```