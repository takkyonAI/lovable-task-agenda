# Documentação do Projeto

Este documento consolida as principais informações, guias e decisões técnicas em um único local.

## Sumário
- Visão Geral
- Guia de Deploy e Ambiente
- Tema (Light/Dark) e Tokens
- UI/UX (Header, KPIs, Listagens, Modais)
- Gestão de Usuários
- Regras de Contagem (KPIs)
- Atualização em Tempo Real
- Checklists de QA
- Changelog

## Visão Geral
Sistema de controle de tarefas (Daily Control - Navegantes) com suporte a light/dark mode, gestão de usuários e KPIs. O objetivo desta consolidação é reduzir a fragmentação de arquivos e facilitar a manutenção.

## Guia de Deploy e Ambiente
- Netlify (build padrão)
- Variáveis de ambiente conforme `docs/TECHNICAL_DOCUMENTATION.md`

## Tema (Light/Dark) e Tokens
- Provider: `src/contexts/ThemeContext.tsx`
- Toggle: `src/components/ui/ThemeToggle.tsx`
- Tokens: `src/index.css` (HSL) + `tailwind.config.ts`
- Estratégia: substituir classes hardcoded por tokens (bg-card, border-border, text-foreground etc.)

## UI/UX
### Header
- Título “Daily Control - Navegantes” movido para a barra azul (logo -> título).
- “Navegantes” sem bold; nome do usuário ao lado do toggle de tema.
- Logo ampliada 100% sem aumentar a altura da barra.

### KPIs
- Total e Concluídas: consideram apenas o mês vigente.
- Pendentes e Atrasadas: cumulativas.
- Light: cartões com gradiente; Dark: cartões slate, sem gradiente.

### Modais e Listagens
- `TaskDetailsModal`: tema por tokens; atualização em tempo real do status.
- `CreateTaskDialog` e `UserManagement`: adaptados ao light mode; dark preservado.

## Gestão de Usuários
- Ações com botões sólidos no light e translúcidos no dark.
- Documentos antigos consolidados aqui e arquivados em `_archive/`.

## Regras de Contagem (KPIs)
- `getFilterCount('all')` = total do mês vigente (due_date entre monthStart e monthEnd).
- Concluídas do mês: filtragem por due_date do mês vigente (ajustável para completed_at).
- Atrasadas: due_date < now e status != concluída/cancelada.

## Atualização em Tempo Real
- Update otimista em `updateTaskStatus` (lista atualizada antes do backend).
- Modal sincroniza o `selectedTask.status` para atualizar o botão imediatamente.

## Checklists de QA
- Alternância de tema sem recarregar.
- KPIs mostram valores corretos do mês.
- Ao clicar em “Iniciar/Concluir/Cancelar”, botão muda imediatamente.
- Botão “Sair” apenas na barra azul.

## Changelog (últimas mudanças)
- Header consolidado; remoção de títulos duplicados.
- KPIs mês vigente (Total/Concluídas).
- Light/Dark unificado via tokens.
- Atualização otimista do status.
 - Fix: Filtro de usuários não é mais resetado ao clicar nos indicadores (Pendentes/Concluídas/Atrasadas/Total). O usuário selecionado permanece até que "Todos os usuários" seja escolhido manualmente.
   - Arquivos: `src/components/TaskManager.tsx` (não reseta `selectedUser` em `handleStatsClick`), `src/hooks/useTaskManager.ts` (não zera `selectedUser` em `clearAdvancedFilters`).
   - Commit: 42a8be1