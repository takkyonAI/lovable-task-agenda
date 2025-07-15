# 💡 EXEMPLOS DE CÓDIGO SEGURO vs PROBLEMÁTICO

## 🎯 **GUIDE DE REFERÊNCIA RÁPIDA**

Este arquivo contém exemplos práticos baseados nos problemas reais que causaram o "piscar" na interface. Use como referência para futuras implementações.

---

## ⏱️ **TIMERS E INTERVALS**

### ❌ **PROBLEMÁTICO - Causa Piscar**
```javascript
// PROBLEMA 1: Interval muito frequente
useEffect(() => {
  const interval = setInterval(() => {
    loadTasks(); // Re-render da lista completa
    checkNotifications(); // Queries ao banco
    updateUI(); // State updates
  }, 30000); // 30 segundos - MUITO FREQUENTE
  
  return () => clearInterval(interval);
}, [user, filters]); // Dependências instáveis

// PROBLEMA 2: Múltiplos timers simultâneos
useEffect(() => {
  const timer1 = setInterval(loadTasks, 30000);
  const timer2 = setInterval(checkNotifications, 60000);
  const timer3 = setTimeout(fallbackRefresh, 300000);
  
  // Cleanup inadequado - timers podem sobrepor
  return () => {
    clearInterval(timer1);
    clearInterval(timer2);
    clearTimeout(timer3);
  };
}, [dependencies_that_change_often]);

// PROBLEMA 3: Timer recursivo instável
const setupRefresh = useCallback(() => {
  const timer = setTimeout(() => {
    doSomething();
    setupRefresh(); // Recursão pode criar loops
  }, interval);
}, [interval, doSomething]); // Dependências que mudam
```

### ✅ **SEGURO - Estável**
```javascript
// SOLUÇÃO 1: Timer único com intervalo adequado
useEffect(() => {
  const timer = setTimeout(() => {
    loadTasks(); // Operação simples
    scheduleNext(); // Reagenda explicitamente
  }, 60000); // MÍNIMO 1 minuto
  
  return () => clearTimeout(timer);
}, []); // SEM dependências ou dependências estáveis

// SOLUÇÃO 2: Timer com cleanup adequado
const timerRef = useRef(null);

const setupSafeRefresh = useCallback(() => {
  // Sempre limpar timer anterior
  if (timerRef.current) {
    clearTimeout(timerRef.current);
  }
  
  timerRef.current = setTimeout(() => {
    if (document.hasFocus()) { // Só se usuário ativo
      loadTasks();
    }
    setupSafeRefresh(); // Reagenda
  }, 60000);
}, []); // Dependências vazias - estável

// SOLUÇÃO 3: Conditional timing
useEffect(() => {
  if (!user?.id) return; // Guard clause
  
  const timer = setTimeout(() => {
    // Lógica simples
    refreshData();
  }, Math.max(60000, preferredInterval)); // Força mínimo
  
  return () => clearTimeout(timer);
}, [user?.id]); // Dependência que muda raramente
```

---

## 🔔 **NOTIFICAÇÕES E TOASTS**

### ❌ **PROBLEMÁTICO - Causa Spam Visual**
```javascript
// PROBLEMA 1: Toast a cada mudança
useEffect(() => {
  const channel = supabase.channel('tasks')
    .on('postgres_changes', {}, (payload) => {
      toast({
        title: "Atualização!",
        description: `Tarefa ${payload.new.title} foi modificada`
      }); // Toast a CADA mudança no banco
    });
}, []);

// PROBLEMA 2: Notificações sem throttling
const checkTasks = async () => {
  const tasks = await getTasks();
  tasks.forEach(task => {
    if (task.isOverdue) {
      toast({ // Múltiplos toasts simultâneos
        title: "Tarefa Vencida",
        description: task.title,
        variant: "destructive"
      });
    }
  });
};

// PROBLEMA 3: Estado de notificação instável
const [notifications, setNotifications] = useState([]);
useEffect(() => {
  // Adiciona notificação a cada check
  setNotifications(prev => [...prev, newNotification]);
}, [someDependency]); // Executa frequentemente
```

### ✅ **SEGURO - Controlado**
```javascript
// SOLUÇÃO 1: Throttling de notificações
const lastNotificationTime = useRef({});

const showThrottledToast = useCallback((id, message) => {
  const now = Date.now();
  const lastTime = lastNotificationTime.current[id] || 0;
  
  // Só mostra se passou 5 minutos da última
  if (now - lastTime > 300000) {
    toast({ title: message });
    lastNotificationTime.current[id] = now;
  }
}, []);

// SOLUÇÃO 2: Notificações agrupadas
const pendingNotifications = useRef([]);

const addNotificationToQueue = (notification) => {
  pendingNotifications.current.push(notification);
  
  // Debounce - processa em lote após 5 segundos
  setTimeout(() => {
    if (pendingNotifications.current.length > 0) {
      showGroupedNotification(pendingNotifications.current);
      pendingNotifications.current = [];
    }
  }, 5000);
};

// SOLUÇÃO 3: Notificações condicionais
const showNotificationIfRelevant = (task, user) => {
  // Só notifica se relevante para o usuário
  if (!task.assigned_users.includes(user.id)) return;
  
  // Só notifica mudanças importantes
  if (task.status === 'completed' || task.status === 'overdue') {
    // Toast único e relevante
    toast({
      title: `Tarefa ${task.status}`,
      description: task.title,
      duration: 3000 // Auto-dismiss
    });
  }
};
```

---

## 🔄 **REAL-TIME SUBSCRIPTIONS**

### ❌ **PROBLEMÁTICO - Causa Re-renders Excessivos**
```javascript
// PROBLEMA 1: Subscription sem filtros
useEffect(() => {
  const channel = supabase.channel('all-changes')
    .on('postgres_changes', {
      event: '*', // TODAS as mudanças
      schema: 'public',
      table: 'tasks'
    }, (payload) => {
      // Re-carrega TUDO a cada mudança
      loadAllTasks();
      showNotification(payload);
      updateLastModified(Date.now());
    });
    
  return () => supabase.removeChannel(channel);
}, [user, filters, settings]); // Dependências instáveis

// PROBLEMA 2: State update direto
const handleRealTimeUpdate = (payload) => {
  // Re-render completo da lista
  setTasks([...allTasks, payload.new]);
  
  // State update cascata
  setLastUpdate(Date.now());
  setIsLoading(false);
  setError(null);
};

// PROBLEMA 3: Subscription sem cleanup
useEffect(() => {
  const subscription = supabase.channel('updates')
    .on('postgres_changes', {}, handleUpdate)
    .subscribe();
    
  // FALTANDO CLEANUP - memory leak
}, []);
```

### ✅ **SEGURO - Controlado e Filtrado**
```javascript
// SOLUÇÃO 1: Subscription com filtros específicos
useEffect(() => {
  if (!user?.id) return;
  
  const channel = supabase.channel(`user-tasks-${user.id}`)
    .on('postgres_changes', {
      event: 'UPDATE',
      schema: 'public', 
      table: 'tasks',
      filter: `assigned_users.cs.{${user.id}}` // Só tarefas do usuário
    }, debounce((payload) => {
      // Update específico, não reload completo
      updateSingleTask(payload.new);
    }, 2000)); // Debounce de 2 segundos
    
  channel.subscribe();
  
  return () => {
    supabase.removeChannel(channel);
  };
}, [user?.id]); // Dependência estável

// SOLUÇÃO 2: Update otimizado
const updateSingleTask = useCallback((updatedTask) => {
  setTasks(prevTasks => 
    prevTasks.map(task => 
      task.id === updatedTask.id 
        ? { ...task, ...updatedTask } // Merge parcial
        : task // Mantém referência original
    )
  );
}, []);

// SOLUÇÃO 3: Circuit breaker para fallback
const subscriptionErrors = useRef(0);

const setupRealtimeWithFallback = () => {
  try {
    const channel = supabase.channel('safe-updates')
      .on('postgres_changes', {}, (payload) => {
        subscriptionErrors.current = 0; // Reset counter
        handleSafeUpdate(payload);
      })
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          subscriptionErrors.current++;
          
          // Se muitos erros, fallback para polling
          if (subscriptionErrors.current > 3) {
            console.log('Fallback para polling devido a erros');
            setupPollingFallback();
          }
        }
      });
      
  } catch (error) {
    console.error('Real-time failed, usando polling');
    setupPollingFallback();
  }
};
```

---

## 📊 **STATE MANAGEMENT**

### ❌ **PROBLEMÁTICO - Causa Re-renders Desnecessários**
```javascript
// PROBLEMA 1: Estado derivado desnecessário
const [tasks, setTasks] = useState([]);
const [filteredTasks, setFilteredTasks] = useState([]);
const [taskCount, setTaskCount] = useState(0);
const [overdueTasks, setOverdueTasks] = useState([]);

useEffect(() => {
  // Re-calcula tudo a cada mudança
  const filtered = tasks.filter(filterFn);
  const overdue = tasks.filter(isOverdue);
  
  setFilteredTasks(filtered);
  setTaskCount(tasks.length);
  setOverdueTasks(overdue);
}, [tasks]); // Cascata de re-renders

// PROBLEMA 2: Estado não normalizado
const [userTasks, setUserTasks] = useState({
  user1: [...tasks],
  user2: [...tasks],
  user3: [...tasks]
}); // Dados duplicados

// PROBLEMA 3: Updates frequentes de loading
const [isLoading, setIsLoading] = useState(false);
useEffect(() => {
  setIsLoading(true);
  fetchData().then(() => {
    setIsLoading(false); // Re-render
  });
}, [dependency_that_changes_often]);
```

### ✅ **SEGURO - Otimizado**
```javascript
// SOLUÇÃO 1: useMemo para valores derivados
const [tasks, setTasks] = useState([]);

const filteredTasks = useMemo(() => 
  tasks.filter(task => 
    // Critérios de filtro
    task.status === activeFilter
  ), [tasks, activeFilter]
);

const taskStats = useMemo(() => ({
  total: tasks.length,
  overdue: tasks.filter(isOverdue).length,
  completed: tasks.filter(isCompleted).length
}), [tasks]);

// SOLUÇÃO 2: Estado normalizado
const [taskEntities, setTaskEntities] = useState({});
const [taskIds, setTaskIds] = useState([]);

const normalizeTaskUpdate = (task) => {
  setTaskEntities(prev => ({
    ...prev,
    [task.id]: task
  }));
  
  // Só adiciona ID se é nova tarefa
  if (!taskIds.includes(task.id)) {
    setTaskIds(prev => [...prev, task.id]);
  }
};

// SOLUÇÃO 3: Loading states consolidados
const [loading, setLoading] = useState({
  tasks: false,
  users: false,
  notifications: false
});

const setLoadingState = useCallback((key, value) => {
  setLoading(prev => ({
    ...prev,
    [key]: value
  }));
}, []);
```

---

## 🔍 **DEBUGGING E MONITORING**

### ✅ **Como Detectar Problemas**
```javascript
// 1. Performance monitoring
useEffect(() => {
  const startTime = performance.now();
  
  return () => {
    const endTime = performance.now();
    if (endTime - startTime > 100) {
      console.warn(`useEffect lento: ${endTime - startTime}ms`);
    }
  };
});

// 2. Re-render tracking
const renderCount = useRef(0);
useEffect(() => {
  renderCount.current++;
  if (renderCount.current > 10) {
    console.warn('Componente re-renderizando excessivamente');
  }
});

// 3. Memory leak detection
const activeTimers = useRef(new Set());

const createSafeTimer = (callback, delay) => {
  const timer = setTimeout(() => {
    callback();
    activeTimers.current.delete(timer);
  }, delay);
  
  activeTimers.current.add(timer);
  return timer;
};

// Cleanup global
window.addEventListener('beforeunload', () => {
  activeTimers.current.forEach(timer => clearTimeout(timer));
});
```

### ✅ **Logging Estruturado**
```javascript
// Sistema de log que não causa re-renders
const logger = {
  performance: (operation, duration) => {
    if (duration > 100) {
      console.warn(`🐌 ${operation}: ${duration}ms`);
    }
  },
  
  rerender: (component, reason) => {
    console.log(`🔄 ${component} re-rendered: ${reason}`);
  },
  
  network: (endpoint, duration, cached = false) => {
    const icon = cached ? '💾' : '🌐';
    console.log(`${icon} ${endpoint}: ${duration}ms`);
  }
};

// Uso
const MyComponent = () => {
  const renderStart = performance.now();
  
  useEffect(() => {
    const renderTime = performance.now() - renderStart;
    logger.performance('MyComponent render', renderTime);
  });
  
  // ... resto do componente
};
```

---

## 🎯 **CHECKLIST DE REVISÃO DE CÓDIGO**

### **Antes de cada commit, verificar**:

#### ⏱️ **Timers**:
- [ ] Intervalo ≥ 1 minuto (60000ms)
- [ ] Cleanup adequado (clearTimeout/clearInterval)
- [ ] Dependências estáveis ou vazias
- [ ] Guard clauses para condições de erro

#### 🔔 **Notificações**:
- [ ] Throttling/debouncing implementado
- [ ] Relevância para o usuário verificada
- [ ] Limite de notificações simultâneas
- [ ] Auto-dismiss configurado

#### 🔄 **Real-time**:
- [ ] Filtros específicos (não *) 
- [ ] Debounce de ≥ 2 segundos
- [ ] Cleanup de subscriptions
- [ ] Fallback para polling

#### 📊 **State**:
- [ ] useMemo para valores derivados
- [ ] Estado mínimo e normalizado
- [ ] Batch updates quando possível
- [ ] Loading states consolidados

#### 🧪 **Testes**:
- [ ] Interface estável por 5+ minutos
- [ ] Console sem logs excessivos (< 10/min)
- [ ] Network requests controlados
- [ ] Performance tab sem spikes

---

**LEMBRETE**: Sempre priorizar ESTABILIDADE sobre PERFORMANCE. É melhor ter atualizações mais lentas que uma interface que pisca. 