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

// Função para detectar a origem atual com mais precisão
const getCurrentOrigin = (): string => {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return 'http://localhost:5173';
};

// Função para obter todas as possíveis origens que podem ser necessárias
export const getAllPossibleOrigins = (): string[] => {
  const currentOrigin = getCurrentOrigin();
  
  // Origens fixas para evitar problemas de conexão
  const fixedOrigins = [
    'https://lovableproject.com',
    'https://*.lovableproject.com',
    'http://localhost:5173',
    'http://localhost:3000'
  ];
  
  const origins = [currentOrigin, ...fixedOrigins];
  
  // Remover duplicatas e origens inválidas
  return origins.filter((origin, index, self) => 
    self.indexOf(origin) === index && origin !== 'N/A'
  );
};

// Função para inicializar o Google Identity Services
export const initGoogleAuth = (clientId: string): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window.google === 'undefined') {
      console.error('Google Identity Services não carregado');
      resolve(false);
      return;
    }

    try {
      const currentOrigin = getCurrentOrigin();
      console.log('Inicializando Google Auth com origem:', currentOrigin);
      console.log('Client ID:', clientId);
      
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

// Função para obter token OAuth 2.0 com detecção precisa de origem
export const getOAuthToken = (clientId: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    if (typeof window.google === 'undefined') {
      reject(new Error('Google Identity Services não disponível'));
      return;
    }

    try {
      const currentOrigin = getCurrentOrigin();
      const allOrigins = getAllPossibleOrigins();
      
      console.log('=== CONFIGURAÇÃO OAUTH DETALHADA ===');
      console.log('Client ID:', clientId);
      console.log('Origem detectada:', currentOrigin);
      console.log('Todas as origens recomendadas:', allOrigins);
      console.log('Escopos:', SCOPES);
      console.log('Modo UX: popup');
      console.log('=====================================');
      
      const tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: clientId,
        scope: SCOPES,
        ux_mode: 'popup',
        callback: (response: GoogleAuthResponse) => {
          console.log('=== RESPOSTA OAUTH ===');
          console.log('Resposta completa:', response);
          console.log('Token presente:', !!response.access_token);
          console.log('====================');
          
          if (response.access_token) {
            const expiresAt = Date.now() + (response.expires_in * 1000);
            localStorage.setItem('google_access_token', response.access_token);
            localStorage.setItem('google_token_expires_at', expiresAt.toString());
            
            console.log('✅ Token OAuth obtido e armazenado com sucesso');
            resolve(response.access_token);
          } else {
            console.error('❌ Resposta OAuth sem access_token:', response);
            reject(new Error('Falha ao obter token de acesso'));
          }
        },
        error_callback: (error: any) => {
          console.error('=== ERRO OAUTH DETALHADO ===');
          console.error('Erro completo:', error);
          console.error('Tipo do erro:', error.type);
          console.error('============================');
          
          let errorMessage = 'Erro na autenticação OAuth';
          
          if (error.type === 'redirect_uri_mismatch') {
            const originsText = allOrigins.map(origin => `   ${origin}`).join('\n');
            
            // Mostrar alerta imediatamente com a origem atual
            alert(`🚨 CONFIGURAÇÃO OAUTH NECESSÁRIA 🚨

ORIGEM ATUAL: ${currentOrigin}

PASSOS OBRIGATÓRIOS:
1. Acesse: console.cloud.google.com
2. APIs & Services → Credentials  
3. Edite o Client ID: ${clientId}
4. Em "Authorized JavaScript origins" adicione TODAS estas origens:
${originsText}
5. REMOVA TODAS as "Authorized redirect URIs"
6. Salve e aguarde 5-10 minutos

❌ ERRO: A origem ${currentOrigin} não está autorizada no Google Cloud Console.

Após configurar, limpe o cache do navegador e tente novamente.`);

            errorMessage = `ERRO DE CONFIGURAÇÃO OAUTH - redirect_uri_mismatch

ORIGEM ATUAL: ${currentOrigin}

SOLUÇÃO OBRIGATÓRIA - Configure no Google Cloud Console:
1. Acesse: console.cloud.google.com
2. APIs & Services → Credentials  
3. Edite o Client ID: ${clientId}
4. Em "Authorized JavaScript origins" adicione TODAS estas origens:
${originsText}
5. REMOVA COMPLETAMENTE "Authorized redirect URIs"
6. Salve e aguarde 5-10 minutos para propagação

A origem atual ${currentOrigin} NÃO está autorizada.`;
          } else if (error.type === 'org_internal') {
            errorMessage = `ERRO DE ACESSO RESTRITO - org_internal

O aplicativo está configurado como INTERNO, permitindo apenas usuários da organização.

SOLUÇÕES - Configure no Google Cloud Console:

OPÇÃO 1 - Tornar Público (Recomendado):
1. Acesse: console.cloud.google.com
2. APIs & Services → OAuth consent screen
3. Mude de "Internal" para "External"
4. Complete a configuração (pode precisar verificação)

OPÇÃO 2 - Adicionar Usuários de Teste:
1. Mantenha como "Internal"
2. Na seção "Test users" adicione os emails autorizados
3. Adicione: wadepvenga@gmail.com

OPÇÃO 3 - Use a conta da organização:
1. Faça logout da conta atual
2. Login com: contato@takkyon.com`;
          } else if (error.type === 'popup_closed') {
            errorMessage = 'Popup de autenticação foi fechado. Tente novamente e complete o processo de login.';
          }
          
          reject(new Error(errorMessage));
        }
      });

      console.log('🚀 Iniciando solicitação de token OAuth...');
      console.log('🔍 Origem que será verificada pelo Google:', currentOrigin);
      console.log('📋 Configure TODAS estas origens no Google Cloud Console:', allOrigins);
      tokenClient.requestAccessToken({
        prompt: 'consent'
      });
    } catch (error) {
      console.error('❌ Erro ao inicializar cliente OAuth:', error);
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
