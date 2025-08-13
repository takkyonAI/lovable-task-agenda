# 🔍 DEBUG: Problema de Criação de Tarefas - Usuária Vanessa

## 🚨 Problema Reportado
**Usuária:** Vanessa (assessora_adm)  
**Problema:** Não consegue criar tarefas  
**Data:** 07/01/2025  

## 🔧 Debugs Implementados

### 1. Logs Adicionados no Frontend
Adicionei logs detalhados na função `createTask` em `src/hooks/useTaskManager.ts`:

```javascript
// 🔍 DEBUG: Log inicial para debugging de Vanessa (assessora_adm)
console.log('🔍 DEBUG createTask - Starting task creation for user:', {
  user_id: currentUser?.user_id,
  user_name: currentUser?.name,
  user_role: currentUser?.role,
  user_email: currentUser?.email,
  task_title: newTask.title
});

// 🔍 DEBUG: Log dos dados que serão inseridos
console.log('🔍 DEBUG createTask - Insert data:', insertData);

// 🔍 DEBUG: Verificar sessão do Supabase
const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
console.log('🔍 DEBUG createTask - Current session:', {
  session_user_id: sessionData?.session?.user?.id,
  session_email: sessionData?.session?.user?.email,
  session_error: sessionError
});
```

### 2. Detecção de Erros RLS
Adicionei detecção específica para erros de políticas RLS:

```javascript
// 🔍 DEBUG: Erro específico para política RLS
if (error.code === '42501' || error.message.includes('policy')) {
  console.error('🔍 DEBUG createTask - RLS Policy error detected for user:', {
    user_role: currentUser.role,
    user_id: currentUser.user_id,
    error_message: error.message
  });
}
```

## 🧪 Como Testar

### Passos para Vanessa:

1. **Abrir o Console do Navegador:**
   - Pressione `F12` ou `Ctrl+Shift+I` (Windows/Linux)
   - Vá para a aba "Console"

2. **Tentar Criar uma Tarefa:**
   - Clique em "Nova Tarefa"
   - Preencha os campos:
     - Título: "Teste Debug Vanessa"
     - Descrição: "Teste para debugging"
     - Status: "Pendente"
     - Prioridade: "Média"
   - Clique em "Criar Tarefa"

3. **Verificar os Logs:**
   - No console, procure por logs que começam com `🔍 DEBUG createTask`
   - Copie TODOS os logs e me envie

### Logs Esperados:

#### ✅ Se funcionou:
```
🔍 DEBUG createTask - Starting task creation for user: {user_id: "xxx", user_name: "Vanessa", user_role: "assessora_adm", ...}
🔍 DEBUG createTask - Insert data: {title: "Teste Debug Vanessa", status: "pendente", ...}
🔍 DEBUG createTask - Current session: {session_user_id: "xxx", session_email: "vanessa@...", ...}
🔍 DEBUG createTask - Task created successfully: {task_id: "xxx", task_title: "Teste Debug Vanessa", ...}
```

#### ❌ Se falhou:
```
🔍 DEBUG createTask - Starting task creation for user: {user_id: "xxx", user_name: "Vanessa", user_role: "assessora_adm", ...}
🔍 DEBUG createTask - Insert data: {title: "Teste Debug Vanessa", status: "pendente", ...}
🔍 DEBUG createTask - Current session: {session_user_id: "xxx", session_email: "vanessa@...", ...}
🔍 DEBUG createTask - Database error: {error_message: "...", error_details: "...", error_code: "...", ...}
🔍 DEBUG createTask - RLS Policy error detected for user: {user_role: "assessora_adm", error_message: "..."}
```

## 🔍 Possíveis Causas

### 1. **Problema de Políticas RLS**
- A política INSERT pode estar bloqueando assessora_adm
- Verificar se `auth.uid() = created_by` está funcionando

### 2. **Problema de Sessão**
- Sessão pode estar expirada ou inválida
- Verificar se `session_user_id` corresponde ao `user_id` do perfil

### 3. **Problema de Dados**
- Algum campo obrigatório pode estar faltando
- Verificar se `currentUser.user_id` está definido

### 4. **Problema de Permissões**
- Pode haver uma restrição específica para assessora_adm
- Verificar se o perfil está ativo e correto

## 🔧 Soluções Prováveis

### Se for RLS Policy:
```sql
-- Verificar políticas atuais
SELECT policyname, cmd FROM pg_policies WHERE tablename = 'tasks';

-- Recriar política INSERT se necessário
CREATE POLICY "tasks_insert_policy" 
  ON public.tasks FOR INSERT 
  WITH CHECK (auth.uid() = created_by);
```

### Se for Sessão:
```javascript
// Forçar refresh da sessão
await supabase.auth.refreshSession();
```

### Se for Perfil:
```sql
-- Verificar se perfil da Vanessa está correto
SELECT * FROM user_profiles WHERE email = 'vanessa@email.com';
```

## 📋 Checklist de Verificação

- [ ] Vanessa consegue fazer login normalmente
- [ ] Vanessa consegue ver tarefas existentes
- [ ] Vanessa consegue editar tarefas existentes
- [ ] O console mostra os logs de debug
- [ ] A sessão está válida
- [ ] O perfil está ativo
- [ ] As políticas RLS estão corretas

## 📞 Próximos Passos

1. **Vanessa executar o teste** e copiar os logs
2. **Analisar os logs** para identificar o ponto exato do erro
3. **Aplicar a correção** específica baseada no erro encontrado
4. **Remover os logs de debug** após resolver o problema

---

**Status:** 🔄 Em Debug  
**Última Atualização:** 07/01/2025  
**Responsável:** Desenvolvedor Principal 