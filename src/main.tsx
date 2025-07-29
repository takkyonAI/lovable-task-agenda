import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

/* 
 * ⚠️  ATENÇÃO - STRICTMODE REMOVIDO ⚠️ 
 * 
 * React.StrictMode foi REMOVIDO para evitar:
 * - Dupla renderização em desenvolvimento
 * - Erros de removeChild no console
 * - Loops infinitos de useEffect
 * 
 * NÃO REATIVAR sem resolver os problemas de:
 * - useEffect com dependências inadequadas
 * - Componentes que não suportam dupla renderização
 * 
 * Histórico:
 * - Removido StrictMode: 28/01/2025
 * - Motivo: Erros de produção e console limpo
 */

ReactDOM.createRoot(document.getElementById('root')!).render(
  <App />
)
