import React from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Save, Key, Loader2, AlertCircle } from 'lucide-react';
import UserSelector from '../UserSelector';
import { EditTask } from '@/types/task';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface EditTaskDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  editTask: EditTask;
  onTaskChange: (task: EditTask) => void;
  onSaveTask: () => Promise<void>;
  isSaving?: boolean;
}

const EditTaskDialog: React.FC<EditTaskDialogProps> = ({
  isOpen,
  onOpenChange,
  editTask,
  onTaskChange,
  onSaveTask,
  isSaving = false
}) => {
  /**
   * 🔒 HOOK DE AUTENTICAÇÃO - Verificação de permissões
   * 
   * Este hook fornece acesso ao contexto de autenticação e
   * funções de verificação de permissões do usuário atual.
   * 
   * FUNÇÕES UTILIZADAS:
   * - canEditTaskDueDate(): Verifica se usuário pode editar datas de prazo
   * 
   * REGRAS DE PERMISSÃO:
   * - Admin: ✅ Pode editar datas de prazo
   * - Franqueado: ✅ Pode editar datas de prazo
   * - Supervisor ADM: ✅ Pode editar datas de prazo
   * - Outros níveis: ❌ Não podem editar datas de prazo
   */
  const { canEditTaskDueDate } = useSupabaseAuth();

  /**
   * Extrai a parte da data de uma string para uso em input type="date"
   * 
   * Esta função foi otimizada durante a correção de timezone em 08/01/2025
   * para lidar com diferentes formatos de data que podem vir do banco.
   * 
   * @param dateString - String de data em vários formatos possíveis
   * @returns String no formato YYYY-MM-DD para input type="date"
   */
  const extractDateForInput = (dateString: string): string => {
    if (!dateString) return '';
    
    // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
    if (dateString.includes(' ')) {
      return dateString.split(' ')[0];
    }
    
    // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Se já está no formato de data (YYYY-MM-DD)
    return dateString;
  };

  /**
   * Extrai a parte da hora de uma string para uso em input type="time"
   * 
   * @param dateString - String de data/hora em vários formatos possíveis
   * @returns String no formato HH:MM para input type="time"
   */
  const extractTimeForInput = (dateString: string): string => {
    if (!dateString) return '09:00';
    
    let timePart = '';
    
    // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
    if (dateString.includes(' ')) {
      timePart = dateString.split(' ')[1];
    }
    
    // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
    if (dateString.includes('T')) {
      timePart = dateString.split('T')[1];
    }
    
    // Extrair apenas HH:MM
    if (timePart && timePart.includes(':')) {
      const timeParts = timePart.split(':');
      return `${timeParts[0]}:${timeParts[1]}`;
    }
    
    return '09:00';
  };

  /**
   * Extrai a parte da data para operações internas
   * 
   * Similar ao extractDateForInput, mas também gera data atual se não fornecida.
   * Usa Date local para evitar problemas de timezone na geração da data atual.
   * 
   * @param dateString - String de data ou vazia
   * @returns String no formato YYYY-MM-DD
   */
  const extractDatePart = (dateString: string): string => {
    if (!dateString) {
      // Usar Date local em vez de UTC para evitar problemas de fuso horário
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // Se contém espaço (formato: "YYYY-MM-DD HH:MM:SS")
    if (dateString.includes(' ')) {
      return dateString.split(' ')[0];
    }
    
    // Se contém T (formato ISO: "YYYY-MM-DDTHH:MM:SS")
    if (dateString.includes('T')) {
      return dateString.split('T')[0];
    }
    
    // Se já está no formato de data (YYYY-MM-DD)
    return dateString;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-800 border-slate-700 max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-white">Editar Tarefa</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="editTaskTitle" className="text-slate-300">Título</Label>
            <Input
              id="editTaskTitle"
              value={editTask.title}
              onChange={(e) => onTaskChange({ ...editTask, title: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Título da tarefa"
            />
          </div>
          
          <div>
            <Label htmlFor="editTaskDescription" className="text-slate-300">Descrição</Label>
            <Textarea
              id="editTaskDescription"
              value={editTask.description}
              onChange={(e) => onTaskChange({ ...editTask, description: e.target.value })}
              className="bg-slate-700/50 border-slate-600 text-white"
              placeholder="Descrição da tarefa"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editTaskStatus" className="text-slate-300">Status</Label>
              <Select value={editTask.status} onValueChange={(value: any) => onTaskChange({ ...editTask, status: value })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="pendente">Pendente</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="concluida">Concluída</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="editTaskPriority" className="text-slate-300">Prioridade</Label>
              <Select value={editTask.priority} onValueChange={(value: any) => onTaskChange({ ...editTask, priority: value })}>
                <SelectTrigger className="bg-slate-700/50 border-slate-600">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-slate-800 border-slate-700">
                  <SelectItem value="baixa">Baixa</SelectItem>
                  <SelectItem value="media">Média</SelectItem>
                  <SelectItem value="urgente">Urgente</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="editTaskDueDate" className="text-slate-300">Data de Vencimento</Label>
              {/* 
               * CAMPO DE DATA - Controle de permissao implementado
               * 
               * COMPORTAMENTO:
               * - Usuarios autorizados: Campo habilitado e funcional
               * - Usuarios nao autorizados: Campo desabilitado e visualmente diferente
               * 
               * ESTILOS CONDICIONAIS:
               * - Normal: bg-slate-700/50 border-slate-600 text-white
               * - Desabilitado: + opacity-50 cursor-not-allowed
               * 
               * SEGURANCA:
               * - disabled={!canEditTaskDueDate} - Bloqueia interacao
               * - onChange so executa se campo estiver habilitado
               */}
              <Input
                id="editTaskDueDate"
                type="date"
                value={extractDateForInput(editTask.due_date)}
                onChange={(e) => {
                  const dateValue = e.target.value;
                  const timeValue = editTask.due_time || '09:00';
                  
                  if (dateValue) {
                    // Combina data e hora mantendo formato local
                    // Formato: "YYYY-MM-DD HH:MM:SS" (será convertido para timezone no useTaskManager)
                    const localDateTime = `${dateValue} ${timeValue}:00`;
                    onTaskChange({ ...editTask, due_date: localDateTime });
                  } else {
                    onTaskChange({ ...editTask, due_date: '' });
                  }
                }}
                className={`bg-slate-700/50 border-slate-600 text-white ${!canEditTaskDueDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canEditTaskDueDate}
              />
            </div>
            
            <div>
              <Label htmlFor="editTaskDueTime" className="text-slate-300">Horário</Label>
              {/* 
               * CAMPO DE HORA - Controle de permissao implementado
               * 
               * COMPORTAMENTO:
               * - Usuarios autorizados: Campo habilitado e funcional
               * - Usuarios nao autorizados: Campo desabilitado e visualmente diferente
               * 
               * ESTILOS CONDICIONAIS:
               * - Normal: bg-slate-700/50 border-slate-600 text-white
               * - Desabilitado: + opacity-50 cursor-not-allowed
               * 
               * SEGURANCA:
               * - disabled={!canEditTaskDueDate} - Bloqueia interacao
               * - onChange so executa se campo estiver habilitado
               */}
              <Input
                id="editTaskDueTime"
                type="time"
                value={extractTimeForInput(editTask.due_date)}
                onChange={(e) => {
                  const timeValue = e.target.value;
                  const dateValue = extractDatePart(editTask.due_date);
                  
                  // Combina data e hora mantendo formato local
                  // Formato: "YYYY-MM-DD HH:MM:SS" (será convertido para timezone no useTaskManager)
                  const localDateTime = `${dateValue} ${timeValue}:00`;
                  onTaskChange({ ...editTask, due_time: timeValue, due_date: localDateTime });
                }}
                className={`bg-slate-700/50 border-slate-600 text-white ${!canEditTaskDueDate ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!canEditTaskDueDate}
              />
            </div>
          </div>

          {/* 
           * MENSAGEM DE RESTRICAO - Exibida apenas para usuarios sem permissao
           * 
           * PROPOSITO:
           * - Informar claramente ao usuario sobre a restricao
           * - Explicar o que fazer para obter permissao
           * - Manter transparencia sobre as regras do sistema
           * 
           * ESTILO:
           * - Cor ambar para destacar a mensagem
           * - Icone de alerta para chamar atencao
           * - Fundo semi-transparente para nao ser intrusivo
           * 
           * VISIBILIDADE:
           * - So aparece quando !canEditTaskDueDate
           * - Usuarios autorizados nao veem esta mensagem
           */}
          {!canEditTaskDueDate && (
            <Alert className="border-amber-500/50 bg-amber-500/10">
              <AlertCircle className="h-4 w-4 text-amber-500" />
              <AlertDescription className="text-amber-400">
                Você não tem acesso à essa função. Fale com sua supervisora para alterar a data de prazo.
              </AlertDescription>
            </Alert>
          )}

          <div>
            <Label className="text-slate-300">Atribuir Usuários</Label>
            <UserSelector
              selectedUsers={editTask.assigned_users}
              onUsersChange={(users) => onTaskChange({ ...editTask, assigned_users: users })}
              placeholder="Buscar usuários para atribuir..."
            />
          </div>

          {/* Privacy Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg border border-slate-600">
            <div className="flex items-center space-x-2">
              <Key className="w-4 h-4 text-amber-400" />
              <div>
                <Label className="text-slate-300 font-medium">Tarefa Privada</Label>
                <p className="text-xs text-slate-400">Visível apenas para criador, atribuídos e admin/franqueados</p>
              </div>
            </div>
            <Switch
              checked={editTask.is_private}
              onCheckedChange={(checked) => onTaskChange({ ...editTask, is_private: checked })}
              className="data-[state=checked]:bg-amber-500"
            />
          </div>
          
          <div className="flex space-x-2">
            <Button 
              onClick={onSaveTask}
              className="flex-1 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700"
              disabled={isSaving}
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
            
            <Button 
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="border-slate-600 text-slate-300 hover:bg-slate-700"
              disabled={isSaving}
            >
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default EditTaskDialog; 