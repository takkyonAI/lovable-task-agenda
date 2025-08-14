
# Documentação Técnica - Gerenciador de Tarefas Rockfeller Navegantes

## Visão Geral do Projeto

Este é um sistema de gerenciamento de tarefas desenvolvido especificamente para a Rockfeller Navegantes, com hierarquia organizacional bem definida e controle de acesso baseado em papéis (RBAC).

## Tecnologias Utilizadas

### Frontend
- **React 18** - Biblioteca principal para interface do usuário
- **TypeScript** - Tipagem estática para maior segurança no desenvolvimento
- **Vite** - Build tool e servidor de desenvolvimento
- **Tailwind CSS** - Framework CSS para estilização
- **Shadcn/UI** - Biblioteca de componentes UI
- **React Hook Form** - Gerenciamento de formulários
- **React Router DOM** - Roteamento da aplicação
- **Lucide React** - Biblioteca de ícones

### Backend
- **Supabase** - Backend as a Service (BaaS)
  - PostgreSQL Database
  - Authentication
  - Row Level Security (RLS)
  - Real-time subscriptions
  - Edge Functions

### Gerenciamento de Estado
- **React Query (@tanstack/react-query)** - Cache e sincronização de dados
- **React Hooks** - Estado local dos componentes

## Arquitetura do Sistema

### Estrutura de Pastas

```
src/
├── components/           # Componentes reutilizáveis
│   ├── ui/              # Componentes base (shadcn/ui)
│   ├── task/            # Componentes específicos de tarefas
│   ├── LoginForm.tsx    # Formulário de login
│   ├── UserManagement.tsx # Gerenciamento de usuários
│   ├── TaskManager.tsx  # Gerenciador principal de tarefas
│   └── ...
├── hooks/               # Custom hooks
│   ├── useSupabaseAuth.tsx
│   ├── useTaskManager.ts
│   └── useUserProfiles.ts
├── integrations/        # Integrações externas
│   └── supabase/        # Configuração do Supabase
├── pages/               # Páginas da aplicação
├── types/               # Definições de tipos TypeScript
├── utils/               # Funções utilitárias
└── lib/                 # Bibliotecas e configurações
```

## Estrutura do Banco de Dados

### Tabela: user_profiles
Armazena informações dos usuários e seus papéis na organização.

```sql
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN (
    'admin', 'franqueado', 'vendedor', 
    'professor', 'coordenador', 'assessora_adm', 'supervisor_adm'
  )),
  is_active BOOLEAN DEFAULT true,
  password_hash TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  last_login TIMESTAMP WITH TIME ZONE
);
```

### Tabela: tasks
Armazena todas as tarefas do sistema com suporte a múltiplos usuários atribuídos.

```sql
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'pendente' CHECK (status IN (
    'pendente', 'em_andamento', 'concluida', 'cancelada'
  )),
  priority TEXT DEFAULT 'media' CHECK (priority IN (
    'baixa', 'media', 'urgente'
  )),
  due_date TIMESTAMP,
  assigned_users UUID[] DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);
```

## Hierarquia de Papéis e Permissões

### 1. Admin
- **Maior nível de acesso**
- Pode ver e gerenciar todos os usuários e tarefas
- Pode criar, editar e excluir qualquer tarefa
- Acesso completo ao sistema

### 2. Franqueado
- **Segundo maior nível de acesso**
- Mesmas permissões do Admin
- Pode gerenciar todos os usuários e tarefas

### 3. Coordenador
- Pode ver usuários: coordenador, professor, supervisor_adm, assessora_adm
- Pode gerenciar tarefas criadas por ou atribuídas aos papéis acima
- Não pode excluir tarefas

### 4. Supervisor ADM
- Mesmas permissões do Coordenador
- Foco em supervisão administrativa

### 5. Assessora ADM
- Pode ver e gerenciar suas próprias tarefas
- Acesso limitado baseado em atribuição

### 6. Professor
- Pode ver e gerenciar suas próprias tarefas
- Acesso educacional específico

### 7. Vendedor
- **Menor nível de acesso**
- Pode apenas ver e gerenciar suas próprias tarefas

## Row Level Security (RLS) Policies

### User Profiles
```sql
-- Usuários podem ver seus próprios perfis
CREATE POLICY "Usuários podem ver seus próprios perfis" 
  ON user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

-- Admins e franqueados podem ver todos os perfis
CREATE POLICY "Admins e franqueados podem ver todos os perfis" 
  ON user_profiles FOR SELECT 
  USING (get_current_user_role() IN ('admin', 'franqueado'));
```

### Tasks
```sql
-- Política complexa baseada na hierarquia organizacional
CREATE POLICY "Usuários podem ver tarefas pela hierarquia" 
  ON tasks FOR SELECT 
  USING (
    auth.uid() = created_by OR
    auth.uid() = ANY(assigned_users) OR
    EXISTS (SELECT 1 FROM user_profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('admin', 'franqueado'))
    -- ... mais condições baseadas na hierarquia
  );
```

## Funcionalidades Principais

### 1. Autenticação
- Login/Logout seguro via Supabase Auth
- Sessão persistente
- Redirecionamento automático baseado no estado de autenticação

### 2. Gerenciamento de Tarefas
- **Criação**: Formulário completo com título, descrição, prioridade, prazo
- **Atribuição**: Múltiplos usuários podem ser atribuídos a uma tarefa
- **Estados**: Pendente, Em Andamento, Concluída, Cancelada
- **Prioridades**: Baixa, Média, Urgente
- **Filtros**: Por data (hoje, semana, mês), usuário, nível de acesso
- **Real-time**: Atualizações em tempo real via Supabase subscriptions

### 3. Filtros Avançados
- **Filtro por Usuário**: Disponível para admin, franqueado, supervisor, coordenador
- **Filtro por Nível de Acesso**: Filtra tarefas por papel organizacional
- **Filtros Temporais**: Hoje, Esta Semana, Este Mês, Todas

### 4. Interface Responsiva
- Design adaptável para desktop e mobile
- Tema escuro com gradientes
- Componentes acessíveis (shadcn/ui)

## Implementações Técnicas Específicas

### Custom Hooks

#### useSupabaseAuth
```typescript
// Gerencia autenticação e permissões
const { currentUser, logout, canAccessUserManagement } = useSupabaseAuth();
```

#### useTaskManager
```typescript
// Gerencia todas as operações de tarefas
const {
  tasks,
  filteredTasks,
  createTask,
  updateTaskStatus,
  deleteTask,
  canEditTask
} = useTaskManager();
```

### Real-time Updates
```typescript
// Subscription para atualizações em tempo real
const channel = supabase
  .channel('tasks-changes')
  .on('postgres_changes', {
    event: '*',
    schema: 'public',
    table: 'tasks'
  }, (payload) => {
    // Atualiza UI automaticamente
  })
  .subscribe();
```

### Gerenciamento de Estado
- Estados locais com useState para UI
- React Query para cache de dados do servidor
- Optimistic updates para melhor UX

### Nota de Correção (2025-08-14)
- Preservação do filtro de usuário ao interagir com indicadores de status/KPIs.
  - Antes: ao clicar em "Pendentes/Concluídas/Atrasadas/Total", o filtro de usuário era resetado para "Todos".
  - Depois: o `selectedUser` é mantido; apenas nível de acesso, prioridade e filtro temporal/status são ajustados conforme o indicador.
  - Implementação: `TaskManager.tsx` (ajuste em `handleStatsClick`) e `useTaskManager.ts` (ajuste em `clearAdvancedFilters`). Commit `42a8be1`.

## Segurança

### Row Level Security
- Todas as tabelas principais têm RLS habilitado
- Políticas baseadas na hierarquia organizacional
- Função `get_current_user_role()` para evitar recursão

### Validação de Dados
- Validação no frontend com React Hook Form
- Constraints no banco de dados
- TypeScript para tipagem estática

### Autenticação
- JWT tokens gerenciados pelo Supabase
- Sessões persistentes com localStorage
- Auto-refresh de tokens

## Migrações do Banco de Dados

As migrações estão organizadas cronologicamente em:
```
supabase/migrations/
├── 20250707195221-*.sql  # Estrutura inicial
├── 20250707201621-*.sql  # User profiles e RLS
├── 20250707205009-*.sql  # Correções de RLS
└── 20250707231237-*.sql  # Tabela de tasks final
```

## Configuração de Desenvolvimento

### Variáveis de Ambiente
```typescript
// src/integrations/supabase/client.ts
const SUPABASE_URL = "https://olhdcicquehastcwvieu.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIs...";
```

### Scripts NPM
```json
{
  "dev": "vite",
  "build": "tsc && vite build",
  "preview": "vite preview"
}
```

## Deploy e Produção

### Build
```bash
npm run build
```

### Configuração Supabase
1. Row Level Security habilitado
2. Políticas de segurança configuradas
3. Triggers para atualização automática de timestamps
4. Função para criação automática de perfis de usuário

## Considerações de Performance

### Otimizações Implementadas
- React Query para cache inteligente
- Real-time subscriptions apenas quando necessário
- Lazy loading de componentes
- Otimistic updates para melhor UX
- Índices no banco de dados para consultas frequentes

### Monitoramento
- Console logs para debugging
- Error boundaries (a implementar)
- Performance metrics via React DevTools

## Roadmap e Melhorias Futuras

### Funcionalidades Planejadas
- [ ] Notificações push
- [ ] Comentários em tarefas
- [ ] Anexos de arquivos
- [ ] Relatórios e dashboards
- [ ] API REST para integrações externas

### Refatorações Necessárias
- [ ] Dividir useTaskManager em hooks menores
- [ ] Implementar Error Boundaries
- [ ] Adicionar testes unitários
- [ ] Implementar cache avançado

## Contribuição

### Padrões de Código
- TypeScript obrigatório
- ESLint configurado
- Prettier para formatação
- Commits semânticos recomendados

### Estrutura de Branches
- `main` - Produção
- `develop` - Desenvolvimento
- `feature/*` - Novas funcionalidades
- `fix/*` - Correções

Este documento deve ser atualizado conforme o projeto evolui.
