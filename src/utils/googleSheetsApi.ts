import { google } from 'googleapis';

interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

// Criar cliente autenticado usando googleapis
const createAuthenticatedClient = (serviceAccountEmail: string, privateKey: string) => {
  try {
    console.log('Criando cliente autenticado para:', serviceAccountEmail);
    
    // Limpar a chave privada removendo caracteres de escape
    const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    const auth = new google.auth.JWT({
      email: serviceAccountEmail,
      key: cleanPrivateKey,
      scopes: ['https://www.googleapis.com/auth/spreadsheets']
    });

    return google.sheets({ version: 'v4', auth });
  } catch (error) {
    console.error('Erro ao criar cliente autenticado:', error);
    throw new Error('Erro na autenticação: Verifique as credenciais da conta de serviço');
  }
};

// Função para configurar as abas da planilha
export const setupSheetsStructure = async (
  spreadsheetId: string,
  serviceAccountEmail: string,
  privateKey: string
): Promise<boolean> => {
  try {
    console.log('Configurando estrutura da planilha:', spreadsheetId);
    
    const sheets = createAuthenticatedClient(serviceAccountEmail, privateKey);

    // Primeiro, verificar se as abas já existem
    const spreadsheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: spreadsheetId
    });

    const existingSheets = spreadsheetInfo.data.sheets?.map(sheet => sheet.properties?.title) || [];
    console.log('Abas existentes:', existingSheets);
    
    const requests = [];

    // Criar aba "Tarefas" se não existir
    if (!existingSheets.includes('Tarefas')) {
      console.log('Criando aba Tarefas...');
      requests.push({
        addSheet: {
          properties: {
            title: 'Tarefas'
          }
        }
      });
    }

    // Criar aba "Usuários" se não existir
    if (!existingSheets.includes('Usuários')) {
      console.log('Criando aba Usuários...');
      requests.push({
        addSheet: {
          properties: {
            title: 'Usuários'
          }
        }
      });
    }

    // Executar requests se houver
    if (requests.length > 0) {
      await sheets.spreadsheets.batchUpdate({
        spreadsheetId: spreadsheetId,
        requestBody: { requests }
      });
      console.log('Abas criadas com sucesso');
    }

    // Configurar headers da aba "Tarefas"
    const taskHeaders = [
      'ID', 'Título', 'Descrição', 'Tipo', 'Prioridade', 'Status',
      'Data Agendada', 'Data Conclusão', 'Categoria', 'Tempo Estimado',
      'Criado Em', 'Atualizado Em', 'Usuário ID'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Tarefas!A1:M1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [taskHeaders]
      }
    });

    console.log('Headers da aba Tarefas configurados');

    // Configurar headers da aba "Usuários"
    const userHeaders = [
      'ID', 'Nome', 'Email', 'Papel', 'Criado Em', 'Último Login'
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: 'Usuários!A1:F1',
      valueInputOption: 'RAW',
      requestBody: {
        values: [userHeaders]
      }
    });

    console.log('Headers da aba Usuários configurados');
    console.log('Configuração da planilha concluída com sucesso!');
    
    return true;
  } catch (error) {
    console.error('Erro ao configurar estrutura das abas:', error);
    throw error;
  }
};

// Função para buscar dados da planilha
export const fetchSheetData = async (
  spreadsheetId: string,
  serviceAccountEmail: string,
  privateKey: string,
  range: string
): Promise<any[][]> => {
  try {
    console.log('Buscando dados da planilha:', range);
    
    const sheets = createAuthenticatedClient(serviceAccountEmail, privateKey);
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: spreadsheetId,
      range: range
    });

    const values = response.data.values || [];
    console.log('Dados obtidos:', values.length, 'linhas');
    
    return values;
  } catch (error) {
    console.error('Erro ao buscar dados:', error);
    throw error;
  }
};

// Função para adicionar dados à planilha
export const appendSheetData = async (
  spreadsheetId: string,
  serviceAccountEmail: string,
  privateKey: string,
  range: string,
  values: any[][]
): Promise<void> => {
  try {
    console.log('Adicionando dados à planilha:', range);
    
    const sheets = createAuthenticatedClient(serviceAccountEmail, privateKey);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: values
      }
    });

    console.log('Dados adicionados com sucesso');
  } catch (error) {
    console.error('Erro ao adicionar dados:', error);
    throw error;
  }
};

// Função para atualizar dados da planilha
export const updateSheetData = async (
  spreadsheetId: string,
  serviceAccountEmail: string,
  privateKey: string,
  range: string,
  values: any[][]
): Promise<void> => {
  try {
    console.log('Atualizando dados da planilha:', range);
    
    const sheets = createAuthenticatedClient(serviceAccountEmail, privateKey);
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: spreadsheetId,
      range: range,
      valueInputOption: 'RAW',
      requestBody: {
        values: values
      }
    });

    console.log('Dados atualizados com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    throw error;
  }
};
