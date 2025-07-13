// 🔧 CORREÇÃO DE CSP PARA WEBSOCKET SUPABASE
// Execute no console se houver problemas de CSP com WebSocket

(function() {
  console.log('🔧 Iniciando correção de CSP para WebSocket Supabase...');
  
  // Verificar se há meta CSP
  const cspMeta = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
  if (cspMeta) {
    console.log('📋 CSP encontrado:', cspMeta.content);
    
    // Adicionar wss: ao connect-src se não estiver presente
    if (!cspMeta.content.includes('wss:')) {
      const newCSP = cspMeta.content.replace(
        /connect-src ([^;]+)/,
        'connect-src $1 wss://*.supabase.co'
      );
      cspMeta.content = newCSP;
      console.log('✅ CSP atualizado com wss://*.supabase.co');
    }
  } else {
    console.log('ℹ️ Nenhuma meta CSP encontrada no HTML');
  }
  
  // Verificar se o WebSocket está funcionando
  const testWebSocket = () => {
    try {
      const ws = new WebSocket('wss://olhdcicquehastcwvieu.supabase.co/realtime/v1/websocket?apikey=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9saGRjaWNxdWVoYXN0Y3d2aWV1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc2NzI5MDksImV4cCI6MjA2MzI0ODkwOX0.hRmOjxiNQ_p5HFeFjpboHW6jV-Dkki2NWfmL6GyUcBU&eventsPerSecond=10&vsn=1.0.0');
      
      ws.onopen = () => {
        console.log('✅ WebSocket conectado com sucesso!');
        ws.close();
      };
      
      ws.onerror = (error) => {
        console.error('❌ Erro no WebSocket:', error);
      };
      
      ws.onclose = (event) => {
        console.log('🔌 WebSocket fechado:', event.code, event.reason);
      };
      
      // Fechar após 5 segundos se não conectar
      setTimeout(() => {
        if (ws.readyState === WebSocket.CONNECTING) {
          ws.close();
          console.log('⏱️ Timeout na conexão WebSocket');
        }
      }, 5000);
      
    } catch (error) {
      console.error('❌ Erro ao criar WebSocket:', error);
    }
  };
  
  // Testar WebSocket
  testWebSocket();
  
  // Adicionar função global para re-testar
  window.testSupabaseWebSocket = testWebSocket;
  console.log('💡 Para testar novamente, digite: testSupabaseWebSocket()');
  
  // Verificar se há erros de CSP no console
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0] && typeof args[0] === 'string' && args[0].includes('Content Security Policy')) {
      console.log('🚨 CSP ERROR DETECTED:', ...args);
      
      if (args[0].includes('connect-src')) {
        console.log('💡 SOLUÇÃO: Adicione wss://*.supabase.co ao connect-src da CSP');
      }
    }
    originalError.apply(console, args);
  };
  
  console.log('✅ Correção de CSP configurada');
})(); 