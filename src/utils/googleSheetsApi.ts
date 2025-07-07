
interface JWTHeader {
  alg: string;
  typ: string;
}

interface JWTPayload {
  iss: string;
  scope: string;
  aud: string;
  iat: number;
  exp: number;
}

// Função para codificar em Base64URL
const base64UrlEncode = (str: string): string => {
  return btoa(str)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
};

// Função para criar JWT token
const createJWTToken = async (serviceAccountEmail: string, privateKey: string): Promise<string> => {
  const header: JWTHeader = {
    alg: 'RS256',
    typ: 'JWT'
  };

  const now = Math.floor(Date.now() / 1000);
  const payload: JWTPayload = {
    iss: serviceAccountEmail,
    scope: 'https://www.googleapis.com/auth/spreadsheets',
    aud: 'https://oauth2.googleapis.com/token',
    iat: now,
    exp: now + 3600
  };

  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const unsignedToken = `${encodedHeader}.${encodedPayload}`;

  // Importar chave privada para assinatura
  const keyData = privateKey.replace(/\\n/g, '\n');
  const cryptoKey = await crypto.subtle.importKey(
    'pkcs8',
    new TextEncoder().encode(keyData),
    {
      name: 'RSASSA-PKCS1-v1_5',
      hash: 'SHA-256'
    },
    false,
    ['sign']
  );

  const signature = await crypto.subtle.sign(
    'RSASSA-PKCS1-v1_5',
    cryptoKey,
    new TextEncoder().encode(unsignedToken)
  );

  const encodedSignature = base64UrlEncode(
    String.fromCharCode(...new Uint8Array(signature))
  );

  return `${unsignedToken}.${encodedSignature}`;
};

// Função para obter access token
export const getAccessToken = async (serviceAccountEmail: string, privateKey: string): Promise<string> => {
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
      throw new Error(`Erro na autenticação: ${response.status}`);
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error('Erro ao obter access token:', error);
    throw error;
  }
};

// Função para fazer requisições autenticadas para Google Sheets API
export const makeAuthenticatedRequest = async (
  url: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<any> => {
  const response = await fetch(url, {
    ...options,
    headers: {
      ...options.headers,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error ${response.status}: ${errorText}`);
  }

  return response.json();
};

// Função para configurar as abas da planilha
export const setupSheetsStructure = async (
  spreadsheetId: string,
  accessToken: string
): Promise<boolean> => {
  try {
    // Primeiro, verificar se as abas já existem
    const spreadsheetInfo = await makeAuthenticatedRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}`,
      accessToken
    );

    const existingSheets = spreadsheetInfo.sheets.map((sheet: any) => sheet.properties.title);
    
    const requests = [];

    // Criar aba "Tarefas" se não existir
    if (!existingSheets.includes('Tarefas')) {
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
      await makeAuthenticatedRequest(
        `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}:batchUpdate`,
        accessToken,
        {
          method: 'POST',
          body: JSON.stringify({ requests })
        }
      );
    }

    // Configurar headers da aba "Tarefas"
    const taskHeaders = [
      'ID', 'Título', 'Descrição', 'Tipo', 'Prioridade', 'Status',
      'Data Agendada', 'Data Conclusão', 'Categoria', 'Tempo Estimado',
      'Criado Em', 'Atualizado Em', 'Usuário ID'
    ];

    await makeAuthenticatedRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Tarefas!A1:M1`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [taskHeaders]
        })
      }
    );

    // Configurar headers da aba "Usuários"
    const userHeaders = [
      'ID', 'Nome', 'Email', 'Papel', 'Criado Em', 'Último Login'
    ];

    await makeAuthenticatedRequest(
      `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Usuários!A1:F1`,
      accessToken,
      {
        method: 'PUT',
        body: JSON.stringify({
          values: [userHeaders]
        })
      }
    );

    return true;
  } catch (error) {
    console.error('Erro ao configurar estrutura das abas:', error);
    throw error;
  }
};
