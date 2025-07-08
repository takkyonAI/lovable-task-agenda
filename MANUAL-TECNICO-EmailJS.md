# 🔧 Manual Técnico - Integração EmailJS

## 📚 Arquitetura da Solução

### Visão Geral da Integração
A integração EmailJS foi implementada para resolver o problema de envio de credenciais temporárias para novos usuários criados pelos administradores. A solução garante que:

1. **Não interfere** na sessão do administrador logado
2. **Trata conflitos** de usuários órfãos no banco
3. **Envia emails** automaticamente via EmailJS
4. **Fornece fallback** em caso de falha no envio

## 🏗️ Estrutura de Arquivos

```
src/
├── constants/
│   └── app.ts                    # Configurações EmailJS
├── hooks/
│   └── useSupabaseAuth.tsx       # Lógica principal de criação
├── utils/
│   └── inputValidation.ts        # Validação e geração de senhas
└── components/
    └── UserManagement.tsx        # Interface de criação
```

## 🔧 Implementação Detalhada

### 1. Configurações (constants/app.ts)

```typescript
// Configurações do EmailJS
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_hmmn1zm',    // Serviço Gmail configurado
  TEMPLATE_ID: 'template_2qhsrkf',  // Template personalizado
  PUBLIC_KEY: 'I6gkd8EbGFtQiA1y7'  // Chave pública da conta
};

// Configurações de senha segura
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true, 
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  TEMP_PASSWORD_LENGTH: 16,  // Senhas temporárias mais longas
};
```

### 2. Lógica Principal (useSupabaseAuth.tsx)

#### Inicialização do EmailJS
```typescript
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG } from '../constants/app';

// Inicializar EmailJS na importação
emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
```

#### Função createUser - Fluxo Completo
```typescript
const createUser = async (userData: { name: string; email: string; role: User['role'] }): Promise<boolean> => {
  try {
    // 1. PROTEÇÃO DE SESSÃO
    setIsCreatingUser(true);  // Flag para ignorar mudanças de auth state
    
    // 2. VALIDAÇÕES DE INPUT
    if (!validateEmail(userData.email) || !validateName(userData.name)) {
      return false;
    }

    // 3. GERAÇÃO DE SENHA SEGURA
    const securePassword = generateSecurePassword();

    // 4. BACKUP DA SESSÃO ATUAL
    const currentSession = session;
    const currentUserData = currentUser;

    // 5. CRIAÇÃO NO SUPABASE AUTH
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: sanitizeInput(userData.email),
      password: securePassword,
      options: {
        emailRedirectTo: `${window.location.origin}/`,
        data: { full_name: sanitizeInput(userData.name) }
      }
    });

    // 6. RESTAURAÇÃO IMEDIATA DA SESSÃO
    if (currentSession && currentSession.user) {
      await supabase.auth.setSession({
        access_token: currentSession.access_token,
        refresh_token: currentSession.refresh_token
      });
      setCurrentUser(currentUserData);
      setSession(currentSession);
      setAuthUser(currentSession.user);
    }

    // 7. TRATAMENTO DE CONFLITOS DE PERFIL
    const { data: existingProfile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', authData.user.id)
      .single();

    if (existingProfile) {
      // Atualizar perfil existente
      await supabase.from('user_profiles').update({...}).eq('user_id', authData.user.id);
    } else {
      // Criar novo perfil
      await supabase.from('user_profiles').insert({...});
    }

    // 8. ENVIO DE EMAIL VIA EMAILJS
    await sendWelcomeEmail(userData, securePassword);

    return true;
  } finally {
    // 9. LIMPEZA DO FLAG DE PROTEÇÃO
    setIsCreatingUser(false);
  }
};
```

### 3. Envio de Email (Implementação Detalhada)

```typescript
const sendWelcomeEmail = async (userData, securePassword) => {
  try {
    // Verificações de segurança
    console.log('🚀 Iniciando processo de envio de email...');
    
    if (!EMAILJS_CONFIG.SERVICE_ID || !EMAILJS_CONFIG.TEMPLATE_ID || !EMAILJS_CONFIG.PUBLIC_KEY) {
      throw new Error('Configurações do EmailJS incompletas');
    }

    // Reinicialização por segurança
    emailjs.init(EMAILJS_CONFIG.PUBLIC_KEY);
    
    // Parâmetros do template
    const templateParams = {
      app_name: APP_NAME,
      user_name: userData.name,
      user_email: userData.email,
      email: userData.email,  // Duplicado para compatibilidade
      temp_password: securePassword,
      user_role: userData.role,
      app_url: window.location.origin
    };

    // Envio com timeout
    const emailPromise = emailjs.send(
      EMAILJS_CONFIG.SERVICE_ID,
      EMAILJS_CONFIG.TEMPLATE_ID,
      templateParams,
      EMAILJS_CONFIG.PUBLIC_KEY
    );

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Timeout ao enviar email')), 30000);
    });

    const response = await Promise.race([emailPromise, timeoutPromise]);
    
    console.log('✅ Email enviado com sucesso!', response);
    
  } catch (emailError) {
    console.error('❌ Erro ao enviar email:', emailError);
    
    // Fallback: mostrar senha no toast
    toast({
      title: "Usuário Criado - Email Falhou",
      description: `Senha temporária: ${securePassword}`,
      variant: "default"
    });
  }
};
```

## 🛡️ Proteções Implementadas

### 1. Proteção de Sessão do Administrador
```typescript
// Estado para controlar criação de usuário
const [isCreatingUser, setIsCreatingUser] = useState(false);

// Listener de auth state que ignora mudanças durante criação
useEffect(() => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      // IGNORAR mudanças durante criação de usuário
      if (isCreatingUser) {
        console.log('Ignorando mudança de estado durante criação de usuário');
        return;
      }
      // ... resto da lógica
    }
  );
}, [isCreatingUser]);
```

### 2. Tratamento de Usuários Órfãos
```typescript
// Verificar perfil existente ANTES de criar
const { data: existingProfile } = await supabase
  .from('user_profiles')
  .select('*')
  .eq('user_id', authData.user.id)
  .single();

if (existingProfile) {
  // ATUALIZAR perfil existente (evita conflito de chave)
  const { error } = await supabase
    .from('user_profiles')
    .update({ /* dados atualizados */ })
    .eq('user_id', authData.user.id);
} else {
  // CRIAR novo perfil
  const { error } = await supabase
    .from('user_profiles')
    .insert({ /* novos dados */ });
}
```

### 3. Geração de Senhas Seguras
```typescript
// utils/inputValidation.ts
export const generateSecurePassword = (): string => {
  const length = PASSWORD_CONFIG.TEMP_PASSWORD_LENGTH; // 16 chars
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  
  return password;
};
```

## 🔍 Sistema de Logs e Debug

### Logs Implementados
```typescript
// Logs de processo
console.log('🚀 Iniciando processo de envio de email...');
console.log('📧 Verificando EmailJS...', { /* objetos de debug */ });
console.log('🔄 Reinicializando EmailJS...');

// Logs de dados
console.log('📝 Parâmetros do template:', {
  app_name: templateParams.app_name,
  user_name: templateParams.user_name,
  temp_password: '***' + templateParams.temp_password.slice(-4), // Mascarar senha
});

// Logs de resultado
console.log('✅ Email enviado com sucesso!', response);
console.log('📊 Status da resposta:', response.status);

// Logs de erro
console.error('❌ Erro ao enviar email:', emailError);
console.error('🔍 Detalhes completos do erro:', {
  message: emailError?.message,
  status: emailError?.status,
  // ... outros detalhes
});
```

### Debugging por Tipo de Erro
```typescript
// Diagnóstico automático de problemas
if (emailError?.message?.includes('network')) {
  console.error('🌐 Problema de rede detectado');
} else if (emailError?.message?.includes('timeout')) {
  console.error('⏱️ Timeout detectado');
} else if (emailError?.status === 422) {
  console.error('📧 Problema com parâmetros do template');
} else if (emailError?.status === 400) {
  console.error('🔑 Problema com credenciais ou configuração');
}
```

## 🧪 Testing e Validação

### Cenários de Teste Implementados

1. **Criação Normal**
   - ✅ Usuário novo
   - ✅ Email válido
   - ✅ Dados corretos

2. **Conflitos de Usuário**
   - ✅ Usuário já existe em auth.users
   - ✅ Perfil órfão em user_profiles
   - ✅ Conflito de chave duplicada

3. **Falhas de Email**
   - ✅ Credenciais inválidas
   - ✅ Timeout de rede
   - ✅ Template não encontrado

4. **Proteção de Sessão**
   - ✅ Admin permanece logado
   - ✅ Contexto não é alterado
   - ✅ Estado é restaurado

## 🔄 Migração e Limpeza

### SQL para Limpeza de Usuários Órfãos
```sql
-- Limpeza de usuários órfãos em auth.users
DELETE FROM auth.users 
WHERE id IN (
  SELECT au.id 
  FROM auth.users au 
  LEFT JOIN public.user_profiles up ON au.id = up.user_id 
  WHERE up.user_id IS NULL
);

-- Limpeza de perfis órfãos em user_profiles
DELETE FROM public.user_profiles 
WHERE user_id IN (
  SELECT up.user_id 
  FROM public.user_profiles up 
  LEFT JOIN auth.users au ON up.user_id = au.id 
  WHERE au.id IS NULL
);
```

## 📈 Monitoramento e Métricas

### Indicadores de Sucesso
- **Taxa de sucesso** de criação de usuários
- **Taxa de entrega** de emails
- **Tempo de resposta** do EmailJS
- **Erros** de timeout ou rede

### Logs para Análise
```typescript
// Métricas que podem ser coletadas
- Tempo total de criação de usuário
- Status de resposta do EmailJS
- Tipos de erro mais comuns
- Taxa de fallback (senha no toast)
```

## 🔧 Manutenção e Atualizações

### Pontos de Atenção
1. **Credenciais EmailJS** podem expirar
2. **Templates** podem ser modificados
3. **Rate limits** do EmailJS
4. **Logs** devem ser monitorados

### Procedimentos de Atualização
1. **Backup** das configurações atuais
2. **Teste** em ambiente de desenvolvimento
3. **Deploy** gradual com rollback disponível
4. **Monitoramento** pós-deploy

---

**Documentação técnica - Sistema EmailJS**  
**Rockfeller Navegantes - 2025** 