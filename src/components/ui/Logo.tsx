import React from 'react';

interface LogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'full' | 'icon' | 'text';
}

const Logo: React.FC<LogoProps> = ({ 
  className = '', 
  size = 'md', 
  variant = 'full' 
}) => {
  // Tamanhos aumentados em 200% + novo tamanho xs
  const sizeClasses = {
    xs: 'w-12 h-12 text-xs',    // novo tamanho extra pequeno
    sm: 'w-16 h-16 text-sm',    // era w-8 h-8
    md: 'w-24 h-24 text-base',  // era w-12 h-12
    lg: 'w-32 h-32 text-lg'     // era w-16 h-16
  };

  const textSizeClasses = {
    xs: 'text-xs',   // novo tamanho extra pequeno
    sm: 'text-sm',   // era text-xs
    md: 'text-lg',   // era text-sm
    lg: 'text-xl'    // era text-base
  };

  // Usando logo da pasta public (mais confiável)
  const rockfellerLogoUrl = '/rockfeller-logo.png';
  console.log('🏢 Logo da Rockfeller URL (200% maior):', rockfellerLogoUrl);
  console.log('🔄 Componente Logo carregado em:', new Date().toLocaleTimeString());

  // ✅ LOGO REAL DA ROCKFELLER IMPLEMENTADA! [200% MAIOR]
  if (variant === 'icon' || variant === 'full') {
    return (
      <div className={`${sizeClasses[size]} ${className}`} data-logo="rockfeller-public-200">
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
                  <span class="text-yellow-300 text-2xl">R</span>
                  <span class="text-white text-lg">F</span>
                </div>
              </div>
            `;
          }}
          onLoad={() => {
            console.log('✅ Logo da Rockfeller carregada com sucesso! (200% maior)');
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
    <div className={`flex items-center space-x-3 ${className}`} data-logo="rockfeller-full-public-200">
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
                  <span class="text-yellow-300 text-2xl">R</span>
                  <span class="text-white text-lg">F</span>
                </div>
              </div>
            `;
          }}
          onLoad={() => {
            console.log('✅ Logo da Rockfeller carregada com sucesso! (200% maior)');
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