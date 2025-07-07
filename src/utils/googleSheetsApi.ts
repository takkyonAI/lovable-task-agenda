
interface GoogleSheetsConfig {
  spreadsheetId: string;
  serviceAccountEmail: string;
  privateKey: string;
}

// Função para criar JWT token manualmente (compatível com navegador)
const createJWTToken = async (serviceAccountEmail: string, privateKey: string): Promise<string> => {
  try {
    console.log('Criando JWT token para:', serviceAccountEmail);
    
    // Header do JWT
    const header = {
      alg: 'RS256',
      typ: 'JWT'
    };

    // Payload do JWT
    const now = Math.floor(Date.now() / 1000);
    const payload = {
      iss: serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/spreadsheets',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now
    };

    // Codificar header e payload em base64
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

    // Criar a mensagem para assinar
    const message = `${encodedHeader}.${encodedPayload}`;

    // Limpar a chave privada
    const cleanPrivateKey = privateKey.replace(/\\n/g, '\n');
    
    // Importar a chave privada
    const keyData = cleanPrivateKey
      .replace('-----BEGIN PRIVATE KEY-----', '')
      .replace('-----END PRIVATE KEY-----', '')
      .replace(/\s/g, '');
    
    const binaryKey = atob(keyData);
    const keyBytes = new Uint8Array(binaryKey.length);
    for (let i = 0; i < binaryKey.length; i++) {
      keyBytes[i] = binaryKey.charCodeAt(i);
    }

    // Importar a chave para usar com WebCrypto API
    const cryptoKey = await crypto.subtle.importKey(
      'pkcs8',
      keyBytes,
      {
        name: 'RSASSA-PKCS1-v1_5',
        hash: 'SHA-256'
      },
      false,
      ['sign']
    );

    // Assinar a mensagem
    const signature = await crypto.subtle.sign(
      'RSASSA-PKCS1-v1_5',
      cryptoKey,
      new TextEncoder().encode(message)
    );

    // Codificar a assinatura em base64
    const signatureArray = new Uint8Array(signature);
    const signatureBase64 = btoa(String.fromCharCode(...signatureArray))
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');

    return `${message}.${signatureBase64}`;
  } catch (error) {
    console.error('Erro ao criar JWT token:', error);
    throw new Error('Erro na criação do token JWT');
  }
};

// Função para obter access token
const getAccessToken = async (serviceAccountEmail: string, privateKey: string): Promise<string> => {
  try {
    const jwtToken = await createJWTToken(serviceAccountEmail, privateKey);
    
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwtToken
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro na resposta do OAuth:', errorText);
      throw new Error(`Erro na autenticação: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erro ao obter access token:', error);
    throw error;
  }
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

// Função para configurar as abas da planilha
export const setupSheetsStructure = async (
  spreadsheetId: string,
  serviceAccountEmail: string,
  privateKey: string
): Promise<boolean> => {
  try {
    console.log('Configurando estrutura da planilha:', spreadsheetId);
    
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);

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
  serviceAccountEmail: string,
  privateKey: string,
  range: string
): Promise<any[][]> => {
  try {
    console.log('Buscando dados da planilha:', range);
    
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
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
  serviceAccountEmail: string,
  privateKey: string,
  range: string,
  values: any[][]
): Promise<void> => {
  try {
    console.log('Adicionando dados à planilha:', range);
    
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
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
  serviceAccountEmail: string,
  privateKey: string,
  range: string,
  values: any[][]
): Promise<void> => {
  try {
    console.log('Atualizando dados da planilha:', range);
    
    const accessToken = await getAccessToken(serviceAccountEmail, privateKey);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${range}?valueInputOption=RAW`;
    
    await makeSheetRequest(url, 'PUT', accessToken, { values });
    console.log('Dados atualizados com sucesso');
  } catch (error) {
    console.error('Erro ao atualizar dados:', error);
    throw error;
  }
};
