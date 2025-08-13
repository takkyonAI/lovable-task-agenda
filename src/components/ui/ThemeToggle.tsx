import React from 'react';
import { Moon, Sun } from 'lucide-react';
import { Button } from './button';
import { useTheme } from '../../contexts/ThemeContext';
import { cn } from '../../lib/utils';

interface ThemeToggleProps {
  className?: string;
  variant?: 'default' | 'outline' | 'ghost';
  size?: 'default' | 'sm' | 'lg' | 'icon';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({ 
  className, 
  variant = 'outline',
  size = 'icon'
}) => {
  const { theme, toggleTheme } = useTheme();

  return (
    <Button
      variant={variant}
      size={size}
      onClick={toggleTheme}
      className={cn(
        "transition-all duration-200 hover:scale-105 text-foreground dark:text-white",
        className
      )}
      title={`Alternar para ${theme === 'dark' ? 'modo claro' : 'modo escuro'}`}
    >
      {theme === 'dark' ? (
        <Sun className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
      ) : (
        <Moon className="h-4 w-4 transition-transform duration-200 hover:rotate-90" />
      )}
      <span className="sr-only">
        {theme === 'dark' ? 'Alternar para modo claro' : 'Alternar para modo escuro'}
      </span>
    </Button>
  );
}; 