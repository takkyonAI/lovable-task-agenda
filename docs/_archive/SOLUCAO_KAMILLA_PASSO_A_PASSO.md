# 🚨 SOLUÇÃO IMEDIATA: Kamilla Pedroso não está sendo filtrada

**Data:** 28 de Janeiro de 2025  
**Problema:** Desativação da usuária Kamilla não está funcionando nos filtros  
**Status:** 🔧 REQUER AÇÃO IMEDIATA NO BANCO DE DADOS

---

## 🎯 **DIAGNÓSTICO DO PROBLEMA**

### **❌ O que está acontecendo:**
1. **Frontend:** Botão "Desativar" foi clicado
2. **Banco:** Campo `is_active` foi alterado para `false`
3. **Filtros:** Kamilla ainda aparece nos filtros de colaboradores
4. **Causa:** Função RPC `get_visible_users_for_role` não está filtrando usuários inativos

### **✅ O que já foi corrigido:**
- Frontend implementado corretamente
- Função `toggleUserStatus` funcionando
- Interface atualizando corretamente
- **PROBLEMA:** Função RPC do banco não foi aplicada

---

## 🔧 **SOLUÇÃO IMEDIATA (5 MINUTOS)**

### **PASSO 1: Acessar Supabase SQL Editor**
1. Ir para [supabase.com](https://supabase.com)
2. Acessar seu projeto
3. Clicar em "SQL Editor" no menu lateral

### **PASSO 2: Executar Script de Correção**
```sql
-- 🚨 CORREÇÃO IMEDIATA PARA KAMILLA
-- Copiar e colar este código no SQL Editor

-- 1. Verificar status atual da Kamilla
SELECT 
    'KAMILLA_STATUS' as verificacao,
    name,
    email,
    is_active,
    CASE 
        WHEN is_active = false THEN '✅ DESATIVADA'
        ELSE '❌ AINDA ATIVA'
    END as status
FROM public.user_profiles 
WHERE name ILIKE '%kamilla%' OR email ILIKE '%kamilla%';

-- 2. FORÇAR desativação (se necessário)
UPDATE public.user_profiles 
SET is_active = false 
WHERE name ILIKE '%kamilla%' OR email ILIKE '%kamilla%';

-- 3. RECRIAR função RPC com filtro correto
DROP FUNCTION IF EXISTS public.get_visible_users_for_role(TEXT);

CREATE OR REPLACE FUNCTION public.get_visible_users_for_role(user_role TEXT)
RETURNS TABLE(user_id UUID, name TEXT, email TEXT, role TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- ✅ RETORNAR APENAS USUÁRIOS ATIVOS
  RETURN QUERY 
  SELECT up.user_id, up.name, up.email, up.role
  FROM public.user_profiles up 
  WHERE up.is_active = true  -- 🔒 FILTRO CRÍTICO
  ORDER BY up.name;
END;
$$;

-- 4. Garantir permissões
GRANT EXECUTE ON FUNCTION public.get_visible_users_for_role(TEXT) TO authenticated;

-- 5. Testar se funcionou
SELECT 
    'TESTE_FINAL' as verificacao,
    CASE 
        WHEN COUNT(*) = 0 THEN '✅ SUCESSO: Kamilla não aparece mais nos filtros'
        ELSE '❌ PROBLEMA: Kamilla ainda aparece nos filtros'
    END as resultado
FROM public.get_visible_users_for_role('admin') gv
JOIN public.user_profiles up ON gv.user_id = up.user_id
WHERE gv.name ILIKE '%kamilla%' OR gv.email ILIKE '%kamilla%';
```

### **PASSO 3: Executar e Verificar**
1. Clicar em "Run" no SQL Editor
2. Verificar se todas as queries executaram com sucesso
3. Confirmar que a última query retorna "✅ SUCESSO"

---

## 🧪 **TESTE NO FRONTEND**

### **PASSO 4: Atualizar Navegador**
1. **F5** ou **Ctrl+F5** para forçar refresh
2. Limpar cache se necessário
3. Fazer logout e login novamente

### **PASSO 5: Verificar Funcionamento**
1. **Painel de Usuários:**
   - Kamilla deve aparecer com badge "Inativo"
   - Botão deve ser verde "Ativar"
   - Fundo deve ser vermelho claro

2. **Filtros de Colaboradores:**
   - Kamilla NÃO deve aparecer nos filtros
   - Apenas usuários ativos devem ser visíveis

3. **Atribuição de Tarefas:**
   - Kamilla não deve aparecer na lista de usuários para atribuir

---

## 🔍 **VERIFICAÇÃO TÉCNICA**

### **Se ainda não funcionar, verificar:**

#### **1. Função RPC no Banco:**
```sql
-- Verificar se a função foi criada corretamente
SELECT routine_definition 
FROM information_schema.routines 
WHERE routine_name = 'get_visible_users_for_role';
```

#### **2. Status da Kamilla:**
```sql
-- Confirmar que está desativada
SELECT name, is_active 
FROM public.user_profiles 
WHERE name ILIKE '%kamilla%';
```

#### **3. Teste da Função:**
```sql
-- Verificar se retorna apenas usuários ativos
SELECT COUNT(*) as total_ativos 
FROM public.get_visible_users_for_role('admin');
```

---

## 🚀 **SCRIPT COMPLETO DE CORREÇÃO**

Se o script simples não funcionar, execute o script completo:

```sql
-- Executar no SQL Editor
\i fix-user-deactivation-system.sql
```

---

## 📋 **CHECKLIST DE VERIFICAÇÃO**

### **✅ Após correção:**
- [ ] Kamilla aparece como "Inativo" no painel de usuários
- [ ] Botão mudou para verde "Ativar"
- [ ] Kamilla NÃO aparece nos filtros de colaboradores
- [ ] Função RPC retorna apenas usuários ativos
- [ ] Filtros de tarefas funcionam corretamente

### **❌ Se algo falhar:**
- [ ] Verificar logs do SQL Editor
- [ ] Confirmar permissões da função RPC
- [ ] Verificar se há cache no navegador
- [ ] Executar script completo de correção

---

## 🆘 **SUPORTE TÉCNICO**

### **Se o problema persistir:**
1. **Verificar logs:** Console do navegador + SQL Editor
2. **Confirmar permissões:** Usuário deve ter acesso ao banco
3. **Reset completo:** Executar script completo de correção
4. **Contato:** Equipe de desenvolvimento Rockfeller

---

## 📝 **NOTAS IMPORTANTES**

### **Por que isso aconteceu:**
- ✅ **Frontend:** Implementado corretamente
- ✅ **Banco:** Dados sendo salvos corretamente
- ❌ **Função RPC:** Não foi aplicada no banco
- ❌ **Filtros:** Ainda usando versão antiga da função

### **Solução:**
- **Aplicar função RPC corrigida no banco**
- **Forçar refresh dos dados**
- **Verificar funcionamento dos filtros**

---

**⏰ Tempo estimado:** 5-10 minutos  
**🔄 Status:** Aguardando aplicação no banco  
**👤 Responsável:** Administrador do sistema 