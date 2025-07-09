import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'text';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'full' 
}) => {
  const sizeClasses = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-lg'
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base'
  };

  // Usando logo da pasta public (mais confiável)
  const rockfellerLogoUrl = '/rockfeller-logo.png';
  console.log('🏢 Logo da Rockfeller URL:', rockfellerLogoUrl);
  console.log('🔄 Componente Logo carregado em:', new Date().toLocaleTimeString());

  // ✅ LOGO REAL DA ROCKFELLER IMPLEMENTADA! [PUBLIC FOLDER]
  if (variant === 'icon' || variant === 'full') {
    return (
      <div className={`${sizeClasses[size]} ${className}`} data-logo="rockfeller-public">
        <img 
          src={rockfellerLogoUrl} 
          alt="Rockfeller Logo" 
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error('❌ Erro ao carregar logo da Rockfeller:', e);
            console.log('🔧 Aplicando fallback...');
            // Fallback para o design anterior se a imagem não carregar
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg border border-blue-500/20">
                <div class="text-white font-bold tracking-tight">
                  <span class="text-yellow-300 text-lg">R</span>
                  <span class="text-white text-sm">F</span>
                </div>
              </div>
            `;
          }}
          onLoad={() => {
            console.log('✅ Logo da Rockfeller carregada com sucesso!');
          }}
        />
      </div>
    );
  }

  if (variant === 'text') {
    return (
      <div className={`${textSizeClasses[size]} font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400 ${className}`}>
        ROCKFELLER
      </div>
    );
  }

  return (
    <div className={`flex items-center space-x-2 ${className}`} data-logo="rockfeller-full-public">
      <div className={`${sizeClasses[size]}`}>
        <img 
          src={rockfellerLogoUrl} 
          alt="Rockfeller Logo" 
          className="w-full h-full object-contain"
          onError={(e) => {
            console.error('❌ Erro ao carregar logo da Rockfeller:', e);
            console.log('🔧 Aplicando fallback...');
            // Fallback para o design anterior se a imagem não carregar
            (e.target as HTMLImageElement).style.display = 'none';
            (e.target as HTMLImageElement).parentElement!.innerHTML = `
              <div class="w-full h-full bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 rounded-xl flex items-center justify-center shadow-lg border border-blue-500/20">
                <div class="text-white font-bold tracking-tight">
                  <span class="text-yellow-300 text-lg">R</span>
                  <span class="text-white text-sm">F</span>
                </div>
              </div>
            `;
          }}
          onLoad={() => {
            console.log('✅ Logo da Rockfeller carregada com sucesso!');
          }}
        />
      </div>
      <div className={`${textSizeClasses[size]} font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400`}>
        ROCKFELLER
      </div>
    </div>
  );
};

export default Logo; 