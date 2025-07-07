
interface GoogleSheetsConfig {
  spreadsheetId: string;
  clientId: string;
}

interface GoogleAuthResponse {
  access_token: string;
  expires_in: number;
  scope: string;
  token_type: string;
}

// Configuração dos escopos necessários
const SCOPES = [
  'https://www.googleapis.com/auth/spreadsheets',
  'https://www.googleapis.com/auth/drive.file'
].join(' ');

// Função para inicializar o Google Identity Services
export const initGoogleAuth = (clientId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window.google === 'undefined') {
      console.error('Google Identity Services não carregado');
      resolve(false);
      return;
    }

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: () => {} // Callback vazio, usaremos OAuth separadamente
      });
      
      console.log('Google Identity Services inicializado com sucesso');
      resolve(true);
    } catch (error) {
      console.error('Erro ao inicializar Google Identity Services:', error);
      resolve(false);
    }
  });
};

// Função para obter token OAuth 2.0
export const getOAuthToken = (clientId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window.google === 'undefined') {
      reject(new Error('Google Identity Services não disponível'));
      return;
    }

    try {
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        callback: (response: GoogleAuthResponse) => {
          if (response.access_token) {
            // Armazenar token com timestamp de expiração
            const expiresAt = Date.now() + (response.expires_in * 1000);
            localStorage.setItem('google_access_token', response.access_token);
            localStorage.setItem('google_token_expires_at', expiresAt.toString());
            
            console.log('Token OAuth obtido com sucesso');
            resolve(response.access_token);
          } else {
            reject(new Error('Falha ao obter token de acesso'));
          }
        },
        error_callback: (error: any) => {
          console.error('Erro na autenticação OAuth:', error);
          reject(new Error(`Erro OAuth: ${error.type || 'Erro desconhecido'}`));
        }
      });

      tokenClient.requestAccessToken();
    } catch (error) {
      console.error('Erro ao inicializar cliente OAuth:', error);
      reject(error);
    }
  });
};

// Função para verificar se o token é válido
export const isTokenValid = (): boolean => {
  const token = localStorage.getItem('google_access_token');
  const expiresAt = localStorage.getItem('google_token_expires_at');
  
  if (!token || !expiresAt) {
    return false;
  }
  
  return Date.now() < parseInt(expiresAt);
};

// Função para obter token válido (renovar se necessário)
export const getValidToken = async (clientId: string): Promise<string> => {
  if (isTokenValid()) {
    return localStorage.getItem('google_access_token')!;
  }
  
  console.log('Token expirado, renovando...');
  return await getOAuthToken(clientId);
};

// Função para fazer requisições à API do Google Sheets
const makeSheetRequest = async (
  url: string,
  method: string,
  accessToken: string,
  body?: any
): Promise<any> => {
  try {
    const options: RequestInit = {
      method,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
    }

    const response = await fetch(url, options);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na requisição:', errorText);
      throw new Error(`Erro na API: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error('Erro na requisição para Sheets API:', error);
    throw error;
  }
};

// Função para listar planilhas do usuário
export const listUserSpreadsheets = async (clientId: string): Promise<any[]> => {
  try {
    const accessToken = await getValidToken(clientId);
    const url = "https://www.googleapis.com/drive/v3/files?q=mimeType='application/vnd.google-apps.spreadsheet'&fields=files(id,name,modifiedTime)";
    
    const response = await makeSheetRequest(url, 'GET', accessToken);
    return response.files || [];
  } catch (error) {
    console.error('Erro ao listar planilhas:', error);
    throw error;
  }
};

// Função para configurar as abas da planilha
export const setupSheetsStructure = async (
  spreadsheetId: string,
  clientId: string
): Promise<boolean> => {
  try {
    console.log('Configurando estrutura da planilha:', spreadsheetId);
    
    const accessToken = await getValidToken(clientId);

    // Verificar abas existentes
    const spreadsheetUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`;
    const spreadsheetInfo = await makeSheetRequest(spreadsheetUrl, 'GET', accessToken);

    const existingSheets = spreadsheetInfo.sheets?.map((sheet: any) => sheet.properties?.title) || [];
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
      const batchUpdateUrl = `${spreadsheetUrl}:batchUpdate`;
      await makeSheetRequest(batchUpdateUrl, 'POST', accessToken, { requests });
      console.log('Abas criadas com sucesso');
    }

    // Configurar headers da aba "Tarefas"
    const taskHeaders = [
      'ID', 'Título', 'Descrição', 'Tipo', 'Prioridade', 'Status',
      'Data Agendada', 'Data Conclusão', 'Categoria', 'Tempo Estimado',
      'Criado Em', 'Atualizado Em', 'Usuário ID'
    ];

    const taskHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tarefas!A1:M1?valueInputOption=RAW`;
    await makeSheetRequest(taskHeadersUrl, 'PUT', accessToken, {
      values: [taskHeaders]
    });

    console.log('Headers da aba Tarefas configurados');

    // Configurar headers da aba "Usuários"
    const userHeaders = [
      'ID', 'Nome', 'Email', 'Papel', 'Criado Em', 'Último Login'
    ];

    const userHeadersUrl = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Usuários!A1:F1?valueInputOption=RAW`;
    await makeSheetRequest(userHeadersUrl, 'PUT', accessToken, {
      values: [userHeaders]
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
  clientId: string,
  range: string
): Promise<any[][]> => {
  try {
    console.log('Buscando dados da planilha:', range);
    
    const accessToken = await getValidToken(clientId);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}`;
    
    const response = await makeSheetRequest(url, 'GET', accessToken);
    const values = response.values || [];
    
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
  clientId: string,
  range: string,
  values: any[][]
): Promise<void> => {
  try {
    console.log('Adicionando dados à planilha:', range);
    
    const accessToken = await getValidToken(clientId);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}:append?valueInputOption=RAW`;
    
    await makeSheetRequest(url, 'POST', accessToken, { values });
    console.log('Dados adicionados com sucesso');
  } catch (error) {
    console.error('Erro ao adicionar dados:', error);
    throw error;
  }
};

// Função para atualizar dados da planilha
export const updateSheetData = async (
  spreadsheetId: string,
  clientId: string,
  range: string,
  values: any[][]
): Promise<void> => {
  try {
    console.log('Atualizando dados da planilha:', range);
    
    const accessToken = await getValidToken(clientId);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
    
    await makeSheetRequest(url, 'PUT', accessToken, { values });
    console.log('Dados atualizados com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    throw error;
  }
};

// Função para desconectar (limpar tokens)
export const disconnectGoogle = (): void => {
  localStorage.removeItem('google_access_token');
  localStorage.removeItem('google_token_expires_at');
  console.log('Usuário desconectado do Google');
};
