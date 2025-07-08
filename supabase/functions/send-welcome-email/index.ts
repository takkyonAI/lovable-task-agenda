import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { Resend } from "https://esm.sh/resend@2.0.0"

interface EmailRequest {
  userName: string;
  userEmail: string;
  tempPassword: string;
  userRole: string;
  appUrl: string;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY')
    if (!resendApiKey) {
      throw new Error('RESEND_API_KEY is not set')
    }

    const resend = new Resend(resendApiKey)
    
    const { userName, userEmail, tempPassword, userRole, appUrl }: EmailRequest = await req.json()

    // Validar parâmetros obrigatórios
    if (!userName || !userEmail || !tempPassword || !userRole || !appUrl) {
      return new Response(
        JSON.stringify({ error: 'Missing required parameters' }),
        { 
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    // Mapear nome do role para exibição
    const roleDisplayNames: { [key: string]: string } = {
      'admin': 'Administrador',
      'franqueado': 'Franqueado',
      'vendedor': 'Vendedor',
      'professor': 'Professor',
      'coordenador': 'Coordenador',
      'assessora_adm': 'Assessora ADM',
      'supervisor_adm': 'Supervisor ADM'
    }

    const roleDisplay = roleDisplayNames[userRole] || userRole

    // Criar o template de email
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Bem-vindo ao Gerenciador de Tarefas Rockfeller Navegantes</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
          }
          .container {
            background-color: white;
            border-radius: 8px;
            padding: 30px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
          }
          .header {
            text-align: center;
            margin-bottom: 30px;
          }
          .logo {
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            width: 60px;
            height: 60px;
            border-radius: 12px;
            display: inline-flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 20px;
          }
          .logo-text {
            color: white;
            font-size: 24px;
            font-weight: bold;
          }
          .title {
            color: #1e293b;
            font-size: 24px;
            margin: 0 0 10px 0;
          }
          .subtitle {
            color: #64748b;
            font-size: 16px;
            margin: 0;
          }
          .credentials {
            background-color: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .credentials h3 {
            color: #1e293b;
            margin: 0 0 15px 0;
          }
          .credential-item {
            margin: 10px 0;
            padding: 10px;
            background-color: white;
            border-radius: 4px;
            border-left: 4px solid #3b82f6;
          }
          .credential-label {
            font-weight: 600;
            color: #374151;
          }
          .credential-value {
            font-family: Monaco, Consolas, 'Courier New', monospace;
            background-color: #f3f4f6;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 14px;
          }
          .instructions {
            background-color: #fef3c7;
            border: 1px solid #fbbf24;
            border-radius: 6px;
            padding: 20px;
            margin: 20px 0;
          }
          .instructions h3 {
            color: #92400e;
            margin: 0 0 15px 0;
          }
          .step {
            margin: 10px 0;
            padding-left: 20px;
            position: relative;
          }
          .step::before {
            content: counter(step-counter);
            counter-increment: step-counter;
            position: absolute;
            left: 0;
            top: 0;
            background-color: #3b82f6;
            color: white;
            width: 18px;
            height: 18px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            font-weight: bold;
          }
          .instructions ol {
            counter-reset: step-counter;
            padding-left: 0;
          }
          .warning {
            background-color: #fef2f2;
            border: 1px solid #fecaca;
            border-radius: 6px;
            padding: 15px;
            margin: 20px 0;
          }
          .warning-title {
            color: #dc2626;
            font-weight: 600;
            margin-bottom: 5px;
          }
          .warning-text {
            color: #b91c1c;
            margin: 0;
          }
          .btn {
            display: inline-block;
            background: linear-gradient(135deg, #3b82f6, #06b6d4);
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            color: #6b7280;
            font-size: 14px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <div class="logo">
              <span class="logo-text">GTR</span>
            </div>
            <h1 class="title">Bem-vindo ao Gerenciador de Tarefas Rockfeller Navegantes</h1>
            <p class="subtitle">Sua conta foi criada com sucesso!</p>
          </div>

          <p>Olá <strong>${userName}</strong>,</p>
          
          <p>Seja bem-vindo ao <strong>Gerenciador de Tarefas Rockfeller Navegantes</strong>! Sua conta foi criada com sucesso e você já pode começar a usar o sistema.</p>

          <div class="credentials">
            <h3>📋 Dados de Acesso</h3>
            <div class="credential-item">
              <div class="credential-label">📧 Email/Login:</div>
              <div class="credential-value">${userEmail}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">🔑 Senha Temporária:</div>
              <div class="credential-value">${tempPassword}</div>
            </div>
            <div class="credential-item">
              <div class="credential-label">👤 Sua Função:</div>
              <div class="credential-value">${roleDisplay}</div>
            </div>
          </div>

          <a href="${appUrl}" class="btn">🔗 Acessar o Sistema</a>

          <div class="instructions">
            <h3>🚀 Como fazer seu primeiro acesso:</h3>
            <ol>
              <li class="step">Clique no botão "Acessar o Sistema" acima ou acesse: <strong>${appUrl}</strong></li>
              <li class="step">Faça login com o email e senha temporária fornecidos</li>
              <li class="step">Você será automaticamente redirecionado para criar uma nova senha pessoal</li>
              <li class="step">Defina uma senha segura de sua escolha</li>
              <li class="step">Após confirmar a nova senha, você terá acesso completo ao sistema</li>
            </ol>
          </div>

          <div class="warning">
            <div class="warning-title">⚠️ IMPORTANTE - Segurança</div>
            <p class="warning-text">
              Por razões de segurança, você <strong>DEVE alterar sua senha temporária</strong> no primeiro acesso. 
              O sistema não permitirá que você continue sem criar uma nova senha pessoal.
            </p>
          </div>

          <div class="footer">
            <p>Dúvidas ou problemas para acessar? Entre em contato conosco.</p>
            <p><strong>Equipe Gerenciador de Tarefas Rockfeller Navegantes</strong></p>
          </div>
        </div>
      </body>
      </html>
    `

    // Enviar email
    const { data, error } = await resend.emails.send({
      from: 'Rockfeller Navegantes <navegantes@rockfellerbrasil.com.br>',
      to: [userEmail],
      subject: 'Bem-vindo ao Gerenciador de Tarefas Rockfeller Navegantes',
      html: emailHtml,
      text: `
        Olá ${userName},

        Seja bem-vindo ao Gerenciador de Tarefas Rockfeller Navegantes!

        Dados de Acesso:
        Email: ${userEmail}
        Senha Temporária: ${tempPassword}
        Função: ${roleDisplay}

        Acesse: ${appUrl}

        PRIMEIRO ACESSO:
        1. Acesse o sistema com os dados fornecidos
        2. Você será solicitado a criar uma nova senha pessoal
        3. Após definir sua senha, terá acesso completo ao sistema

        IMPORTANTE: Por segurança, você DEVE alterar sua senha temporária no primeiro acesso.

        Atenciosamente,
        Equipe Gerenciador de Tarefas Rockfeller Navegantes
      `
    })

    if (error) {
      console.error('Erro ao enviar email:', error)
      return new Response(
        JSON.stringify({ error: 'Failed to send email', details: error }),
        { 
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Email sent successfully',
        emailId: data?.id
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )

  } catch (error) {
    console.error('Error in send-welcome-email function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
}) 