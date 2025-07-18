# 🛠️ GUIA DE MANUTENÇÃO DO CÓDIGO

## 📋 **INFORMAÇÕES GERAIS**

- **Data da última grande correção**: 15/01/2025
- **Problema resolvido**: Piscar de tela e re-renders excessivos
- **Status atual**: ✅ Estável e funcionando
- **Próxima revisão**: Apenas se problemas retornarem

## 🎯 **ARQUIVOS CRÍTICOS E SUAS MODIFICAÇÕES**

### 1. **`src/hooks/useNotifications.ts`** - COMPLETAMENTE DESATIVADO

#### **Status**: 🚫 Sistema temporariamente desativado

#### **Funções principais desativadas**:
```javascript
// ❌ DESATIVADAS - Não executam nenhuma lógica
const checkOverdueTasks = async () => { return; }
const checkPendingTasks = async () => { return; }
const addNotification = () => { return ''; }
const sendNativeNotification = () => { return null; }
```

#### **useEffects removidos**:
- ❌ Verificações periódicas (setInterval de 30 minutos)
- ❌ Real-time subscription (supabase.channel)
- ❌ Solicitação automática de permissão

#### **Como reativar com segurança**:
```javascript
// ✅ EXEMPLO SEGURO para futuras reativações
useEffect(() => {
  if (!currentUser) return;
  
  // Polling seguro com intervalo MÍNIMO de 5 minutos
  const safeTimer = setTimeout(() => {
    // Verificar apenas se usuário está ativo
    if (document.hasFocus()) {
      checkCriticalTasksOnly(); // Função simplificada
    }
    scheduleNextCheck(); // Reagendar explicitamente
  }, 300000); // 5 minutos MÍNIMO
  
  return () => clearTimeout(safeTimer);
}, [currentUser.id]); // Dependência estável
```

### 2. **`src/hooks/useTaskManager.ts`** - SISTEMA SIMPLIFICADO

#### **Status**: ✅ Funcionando com sistema simplificado

#### **Mudanças principais**:
- **setupFallbackRefresh** → **setupSimpleRefresh** (5min → 1min)
- **Real-time complexo** → **Polling simples**
- **Múltiplos timers** → **Timer único**

#### **Função crítica atual**:
```javascript
const setupSimpleRefresh = useCallback(() => {
  if (refreshIntervalRef.current) {
    clearTimeout(refreshIntervalRef.current); // Cleanup obrigatório
  }
  
  refreshIntervalRef.current = setTimeout(() => {
    console.log('🔄 Verificação tarefas (1 minuto)...');
    loadTasks(); // Simples e direto
    setupSimpleRefresh(); // Reagenda próximo ciclo
  }, 60000); // 1 minuto conforme especificado
}, []); // Dependências VAZIAS para estabilidade
```

#### **useEffect principal simplificado**:
```javascript
useEffect(() => {
  loadTasks();           // Carregamento inicial
  setupSimpleRefresh();  // Inicia polling de 1 minuto
  
  return () => {
    // Cleanup simples e seguro
    if (refreshIntervalRef.current) {
      clearTimeout(refreshIntervalRef.current);
    }
  };
}, [currentUser, setupSimpleRefresh]); // Dependências mínimas
```

#### **Código removido (causava problemas)**:
```javascript
// ❌ REMOVIDO - Causava re-renders excessivos
const handleTaskInsert = useCallback((newTaskData) => {
  // Lógica complexa de inserção + toast
}, [formatTaskFromDB, currentUser, showTaskChangeNotification]);

const handleTaskUpdate = useCallback((updatedTaskData) => {
  // Lógica complexa de update + toast  
}, [formatTaskFromDB, currentUser, showTaskChangeNotification]);

// ❌ REMOVIDO - Real-time subscription complexo
const channel = supabase.channel(`tasks_optimized_${Date.now()}`)
  .on('postgres_changes', { event: 'INSERT' }, handleTaskInsert)
  .on('postgres_changes', { event: 'UPDATE' }, handleTaskUpdate)
  .on('postgres_changes', { event: 'DELETE' }, handleTaskDelete)
  .subscribe((status) => {
    // Lógica de reconnect que causava instabilidade
  });
```

## ⚠️ **REGRAS CRÍTICAS PARA FUTURAS MODIFICAÇÕES**

### **1. Intervalos e Timers**
```javascript
// ❌ NUNCA FAZER - Causa piscar
setInterval(() => {
  updateSomething();
}, intervalo_menor_que_60_segundos);

// ✅ SEMPRE FAZER - Seguro
setTimeout(() => {
  updateSomething();
  scheduleNext(); // Reagendar explicitamente
}, 60000); // Mínimo 1 minuto
```

### **2. Dependencies em useEffect**
```javascript
// ❌ EVITAR - Dependências instáveis
useEffect(() => {
  // código
}, [user, filters, currentState]); // Mudam frequentemente

// ✅ PREFERIR - Dependências estáveis  
useEffect(() => {
  // código
}, [user.id]); // Só muda em login/logout

// ✅ IDEAL - Sem dependências
useEffect(() => {
  // código
}, []); // Executa apenas no mount
```

### **3. Real-time Subscriptions**
```javascript
// ❌ EVITAR - Subscription sem controle
supabase.channel('updates')
  .on('postgres_changes', {}, (payload) => {
    setState(payload.new); // Re-render direto
    toast("Update!"); // Toast a cada mudança
  });

// ✅ IMPLEMENTAR - Subscription controlada
supabase.channel('controlled-updates')
  .on('postgres_changes', {}, debounce((payload) => {
    // Update específico sem re-render completo
    updateSpecificItem(payload.new);
    // Toast limitado ou removido
  }, 5000)); // Debounce obrigatório
```

### **4. State Updates**
```javascript
// ❌ EVITAR - Updates que causam re-render de lista completa
setTasks([...newData]); // Re-render de toda a lista

// ✅ PREFERIR - Updates específicos
setTasks(prev => prev.map(task => 
  task.id === updatedTask.id ? updatedTask : task
)); // Update apenas do item modificado
```

## 🔍 **SINAIS DE ALERTA (PISCAR VOLTANDO)**

### **No DevTools Console**:
- Logs excessivos (> 10 por segundo)
- Erros de cleanup de timers
- "Maximum update depth exceeded"

### **No Network Tab**:
- Requests muito frequentes (< 30 segundos)
- WebSocket connections instáveis
- Requests duplicados simultâneos

### **No React DevTools**:
- Re-renders constantes de componentes
- Componentes re-mounting frequentemente
- State updates em loop

### **Visual**:
- Interface "piscando" ou tremulando
- Loading states intermitentes
- Notificações excessivas

## 🧪 **PROTOCOLO DE TESTE ANTES DE DEPLOY**

### **1. Teste Local**:
```bash
# Terminal 1 - Dev server
npm run dev

# Terminal 2 - Monitorar logs
tail -f browser-console.log

# Verificar:
# - Máximo 1 request por minuto
# - Sem loops infinitos no console
# - Interface estável por 5+ minutos
```

### **2. Teste de Performance**:
- Abrir DevTools → Performance
- Gravar por 2 minutos
- Verificar se não há:
  - Spikes de CPU constantes
  - Memory leaks
  - Timer excessivos

### **3. Teste de Estabilidade**:
- Deixar aplicação aberta por 30 minutos
- Verificar:
  - Interface não pisca
  - Console sem erros
  - Network requests controlados

## 📦 **PROCESSO DE DEPLOY SEGURO**

### **1. Pre-deploy Checklist**:
- [ ] Teste local funcionando
- [ ] Console sem erros
- [ ] Performance estável
- [ ] Código comentado adequadamente
- [ ] Backup do estado atual

### **2. Deploy Steps**:
```bash
# 1. Build local
npm run build

# 2. Test build
npm run preview

# 3. Commit com mensagem descritiva
git add .
git commit -m "FEAT: Descrição detalhada da mudança + impacto"

# 4. Deploy
git push
./deploy.sh
```

### **3. Post-deploy Monitoring**:
- Aguardar 2-3 minutos para propagação
- Testar em produção por 10 minutos
- Monitorar logs de erro
- Verificar métricas de performance

## 🔄 **ROLLBACK PROCEDURES**

### **Em caso de problema após deploy**:
```bash
# 1. Identificar último commit estável
git log --oneline -10

# 2. Rollback para commit específico
git reset --hard a840aad  # Hash do último commit estável

# 3. Force push (cuidado!)
git push --force

# 4. Deploy automático deve atualizar em 2-3 min
```

### **Commits estáveis conhecidos**:
- `a840aad` - Correção piscar implementada (15/01/2025)
- `c1fb36c` - Notificações 30min funcionando (14/01/2025)

## 📚 **DOCUMENTAÇÃO DE REFERÊNCIA**

- **Problema original**: `CORRECAO_PISCAR_DEPLOYADO.md`
- **Documentação técnica**: `DOCUMENTACAO_COMPLETA_CORRECAO_PISCAR.md`
- **Este guia**: `GUIA_MANUTENCAO_CODIGO.md`

## 🎯 **CONTATOS E RESPONSABILIDADES**

- **Correção implementada por**: AI Assistant (Claude)
- **Data**: 15/01/2025
- **Validação do usuário**: ✅ Confirmada funcionando
- **Documentação**: ✅ Completa

---

**LEMBRETE IMPORTANTE**: Este sistema foi simplificado para resolver um problema crítico. Qualquer otimização futura deve ser implementada GRADUALMENTE e com TESTES EXTENSIVOS para não reintroduzir o problema de piscar. 