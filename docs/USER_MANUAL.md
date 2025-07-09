
# Manual do Usuário - Gerenciador de Tarefas Rockfeller Navegantes

## Índice
1. [Acesso ao Sistema](#acesso-ao-sistema)
2. [Interface Principal](#interface-principal)
3. [Gerenciamento de Tarefas](#gerenciamento-de-tarefas)
4. [Filtros e Buscas](#filtros-e-buscas)
5. [Gerenciamento de Usuários](#gerenciamento-de-usuários)
6. [Permissões por Cargo](#permissões-por-cargo)
7. [Dicas e Boas Práticas](#dicas-e-boas-práticas)
8. [Solução de Problemas](#solução-de-problemas)

---

## Acesso ao Sistema

### Login
1. Acesse a aplicação através do link fornecido
2. Insira seu **email** e **senha**
3. Clique em **"Entrar"**
4. Se não tiver conta, clique em **"Criar nova conta"**

### Primeiro Acesso
- Usuários novos são criados com perfil **Vendedor** por padrão
- Um administrador deve alterar seu cargo conforme necessário
- Guarde bem suas credenciais de acesso

---

## Interface Principal

### Cabeçalho
- **Nome do usuário** e **cargo atual** são exibidos no canto superior
- Botão **"Sair"** para fazer logout seguro

### Navegação por Abas
A interface possui duas abas principais:

#### 🗓️ Tarefas
- Visualização e gerenciamento de todas as suas tarefas
- Disponível para **todos os usuários**

#### 👥 Usuários  
- Gerenciamento de usuários do sistema
- Disponível para: **Todos os usuários autenticados**

---

## Gerenciamento de Tarefas

### Visualizando Tarefas

Cada tarefa exibe:
- **Título** e **descrição**
- **Status**: Pendente, Em Andamento, Concluída, Cancelada
- **Prioridade**: Baixa (azul), Média (laranja), Urgente (vermelho)
- **Data de vencimento** (se definida)
- **Usuários atribuídos**
- **Criado por** (autor da tarefa)

### Criando Nova Tarefa

1. Clique no botão **"+ Nova Tarefa"**
2. Preencha os campos obrigatórios:
   - **Título**: Nome da tarefa
   - **Descrição**: Detalhes do que deve ser feito
   - **Status**: Estado inicial (normalmente "Pendente")
   - **Prioridade**: Baixa, Média ou Urgente
3. Campos opcionais:
   - **Data de vencimento**: Quando deve ser concluída
   - **Horário**: Hora específica (padrão: 09:00)
   - **Usuários atribuídos**: Quem deve executar a tarefa
4. Clique em **"Criar Tarefa"**

### Editando Status de Tarefas

Para alterar o status de uma tarefa:
1. Clique no **botão de status** (colorido) da tarefa
2. Selecione o novo status:
   - **Pendente** (amarelo): Ainda não iniciada
   - **Em Andamento** (azul): Sendo executada
   - **Concluída** (verde): Finalizada com sucesso
   - **Cancelada** (vermelho): Não será executada

### Excluindo Tarefas

**⚠️ Atenção**: Apenas usuários com permissão podem excluir tarefas
- Clique no **X** no canto da tarefa
- Confirme a exclusão
- **Esta ação não pode ser desfeita**

---

## Filtros e Buscas

### Filtros Temporais
Use os botões no topo para filtrar por período:
- **Todas**: Mostra todas as tarefas
- **Hoje**: Tarefas com vencimento hoje
- **Esta Semana**: Tarefas da semana atual  
- **Este Mês**: Tarefas do mês atual

### Filtros Avançados
*Disponível para todos os usuários autenticados*

#### Filtrar por Usuário
- Selecione um usuário específico para ver apenas suas tarefas
- Útil para supervisão e acompanhamento

#### Filtrar por Nível de Acesso
- Filtre tarefas por cargo/função:
  - Administrador
  - Franqueado  
  - Coordenador
  - Supervisor ADM
  - Assessora ADM
  - Assessora
  - Estagiário
  - Professor
  - Vendedor

#### Limpando Filtros
- Clique em **"Limpar"** para remover todos os filtros avançados

---

## Gerenciamento de Usuários

*Esta seção é visível apenas para Admin, Franqueado, Coordenador e Supervisor ADM*

### Visualizando Usuários
- Lista todos os usuários que você tem permissão para ver
- Exibe: Nome, Email, Cargo, Status (Ativo/Inativo)

### Editando Usuários
1. Clique no usuário desejado
2. Altere as informações necessárias:
   - **Nome**
   - **Email** 
   - **Cargo**
   - **Status** (Ativo/Inativo)
3. Salve as alterações

### Criando Novos Usuários
1. Clique em **"Adicionar Usuário"**
2. Preencha todos os campos obrigatórios
3. Defina o cargo apropriado
4. Salve o novo usuário

---

## Permissões por Cargo

### 👑 Administrador
- **Acesso total** ao sistema
- Pode ver e gerenciar **todos os usuários**
- Pode criar, editar e **excluir qualquer tarefa**
- Acesso aos **filtros avançados**

### 🏢 Franqueado  
- **Mesmas permissões do Administrador**
- Acesso completo ao sistema
- Pode gerenciar todos os usuários e tarefas

### 📋 Coordenador
- Pode ver usuários: Coordenador, Professor, Supervisor ADM, Assessora ADM
- Pode gerenciar tarefas relacionadas a esses cargos
- **Não pode excluir tarefas**
- Acesso aos filtros avançados

### 📊 Supervisor ADM
- **Mesmas permissões do Coordenador**
- Foco em supervisão administrativa
- Acesso aos filtros avançados

### 📝 Assessora ADM
- Pode ver e gerenciar **apenas suas próprias tarefas**
- Pode ver tarefas onde foi atribuída
- Sem acesso ao gerenciamento de usuários

### 🎓 Professor
- Pode ver e gerenciar **apenas suas próprias tarefas**
- Pode ver tarefas onde foi atribuído
- Sem acesso ao gerenciamento de usuários

### 💼 Vendedor
- **Menor nível de acesso**
- Pode ver e gerenciar **apenas suas próprias tarefas**
- Sem acesso ao gerenciamento de usuários
- Sem filtros avançados

---

## Dicas e Boas Práticas

### ✅ Organizando Tarefas
- Use **títulos descritivos** e claros
- Sempre preencha a **descrição** com detalhes importantes
- Defina **prazos realistas** 
- Atribua a **prioridade correta**:
  - **Urgente**: Precisa ser feito hoje
  - **Média**: Importante, mas não urgente
  - **Baixa**: Pode ser feito quando houver tempo

### ✅ Atribuição de Usuários
- Atribua tarefas às **pessoas certas** para cada função
- Evite atribuir muitas tarefas para uma pessoa só
- Considere a **carga de trabalho** atual de cada usuário

### ✅ Acompanhamento
- **Atualize o status** das tarefas regularmente
- Use os **filtros temporais** para priorizar o trabalho
- Supervisores devem usar **filtros avançados** para acompanhar equipes

### ✅ Comunicação
- Use a **descrição** para passar informações importantes
- Mantenha as informações **atualizadas**
- Coordenadores devem **revisar regularmente** as tarefas da equipe

---

## Solução de Problemas

### 🔐 Problemas de Login
**Sintoma**: Não consegue entrar no sistema
**Soluções**:
1. Verifique se email e senha estão corretos
2. Certifique-se de que sua conta está **ativa**
3. Contate um administrador se necessário

### 👀 Não Vejo Minhas Tarefas
**Possíveis Causas**:
- Filtros aplicados (verifique se não está filtrando por período específico)
- Tarefas não foram atribuídas a você
- Você não tem permissão para ver certas tarefas

**Soluções**:
1. Clique em **"Todas"** para remover filtros temporais
2. Limpe os filtros avançados se visíveis
3. Contate quem criou a tarefa para verificar a atribuição

### 🚫 Não Consigo Editar/Excluir Tarefas
**Causa**: Permissões insuficientes
**Explicação**: 
- Você só pode editar tarefas **criadas por você** ou **atribuídas a você**
- Apenas Admin, Franqueado, Coordenador e Supervisor ADM podem **excluir tarefas**

### 📱 Problemas de Interface
**Sintoma**: Tela não carrega corretamente
**Soluções**:
1. Atualize a página (F5 ou Ctrl+R)
2. Limpe o cache do navegador
3. Tente usar outro navegador
4. Verifique sua conexão com a internet

### ⚡ Tarefas Não Aparecem em Tempo Real
**Sintoma**: Mudanças de outros usuários não aparecem automaticamente
**Soluções**:
1. Aguarde alguns segundos (atualizações são quase instantâneas)
2. Atualize a página manualmente se necessário
3. Verifique sua conexão com a internet

---

## Contato e Suporte

Para problemas não cobertos neste manual:

1. **Verifique suas permissões** - Muitos problemas são relacionados a acesso
2. **Contate seu supervisor direto** para questões de atribuição de tarefas
3. **Contate o Administrador** para problemas técnicos ou de acesso ao sistema
4. **Documente o problema** - Anote o que estava fazendo quando o erro ocorreu

---

## Atualizações do Sistema

Este sistema é atualizado automaticamente. Principais funcionalidades:
- ✅ Atualizações em tempo real
- ✅ Backup automático dos dados
- ✅ Interface responsiva (funciona em celular e computador)
- ✅ Segurança avançada com controle de acesso

**Versão do Manual**: 1.0 - Janeiro 2025

---

*Este manual deve ser consultado sempre que houver dúvidas sobre o uso do sistema. Mantenha-o sempre acessível para consulta rápida.*
