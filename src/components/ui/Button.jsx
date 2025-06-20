import React from 'react';
import PropTypes from 'prop-types';
import { colors } from '../../styles/colors';

/**
 * Componente de botão reutilizável seguindo o guia de identidade visual do BoletoXCrypto
 * 
 * @param {Object} props - Propriedades do componente
 * @param {string} props.variant - Variante do botão: 'primary', 'secondary', 'tertiary', 'danger', 'success'
 * @param {string} props.size - Tamanho do botão: 'sm', 'md', 'lg'
 * @param {boolean} props.fullWidth - Se o botão deve ocupar toda a largura disponível
 * @param {boolean} props.disabled - Se o botão está desabilitado
 * @param {React.ReactNode} props.children - Conteúdo do botão
 * @param {Function} props.onClick - Função a ser executada no clique
 * @param {string} props.type - Tipo do botão: 'button', 'submit', 'reset'
 * @param {React.ReactNode} props.leftIcon - Ícone à esquerda do texto
 * @param {React.ReactNode} props.rightIcon - Ícone à direita do texto
 */
const Button = ({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  children,
  onClick,
  type = 'button',
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => {
  // Estilos base
  const baseStyle = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: 500,
    borderRadius: '8px',
    transition: 'all 0.2s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.7 : 1,
  };

  // Estilos de tamanho
  const sizeStyles = {
    sm: {
      padding: '6px 12px',
      fontSize: '0.875rem',
      gap: '4px',
    },
    md: {
      padding: '8px 16px',
      fontSize: '1rem',
      gap: '6px',
    },
    lg: {
      padding: '10px 20px',
      fontSize: '1.125rem',
      gap: '8px',
    }
  };

  // Estilos de variante
  const variantStyles = {
    primary: {
      backgroundColor: disabled ? colors.gray[400] : colors.primary,
      color: colors.white,
      border: 'none',
      ':hover': {
        backgroundColor: colors.green[700],
      },
      ':active': {
        backgroundColor: colors.green[800],
      }
    },
    secondary: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: `1px solid ${colors.primary}`,
      ':hover': {
        backgroundColor: colors.green[50],
      },
      ':active': {
        backgroundColor: colors.green[100],
      }
    },
    tertiary: {
      backgroundColor: 'transparent',
      color: colors.primary,
      border: 'none',
      ':hover': {
        backgroundColor: colors.green[50],
      },
      ':active': {
        backgroundColor: colors.green[100],
      }
    },
    danger: {
      backgroundColor: disabled ? colors.gray[400] : colors.feedback.error,
      color: colors.white,
      border: 'none',
      ':hover': {
        backgroundColor: '#d32f2f',
      },
      ':active': {
        backgroundColor: '#c62828',
      }
    },
    success: {
      backgroundColor: disabled ? colors.gray[400] : colors.feedback.success,
      color: colors.white,
      border: 'none',
      ':hover': {
        backgroundColor: '#388e3c',
      },
      ':active': {
        backgroundColor: '#2e7d32',
      }
    },
    bitcoin: {
      backgroundColor: disabled ? colors.gray[400] : colors.secondary,
      color: colors.white,
      border: 'none',
      ':hover': {
        backgroundColor: colors.bitcoin[800],
      },
      ':active': {
        backgroundColor: colors.bitcoin[700],
      }
    },
  };

  // Combinando os estilos
  const buttonStyle = {
    ...baseStyle,
    ...sizeStyles[size],
    ...variantStyles[variant],
  };

  // Eventos de hover e active
  const handleMouseOver = (e) => {
    if (!disabled && variantStyles[variant][':hover']) {
      e.currentTarget.style.backgroundColor = variantStyles[variant][':hover'].backgroundColor;
    }
  };

  const handleMouseOut = (e) => {
    if (!disabled) {
      e.currentTarget.style.backgroundColor = variantStyles[variant].backgroundColor;
    }
  };

  const handleMouseDown = (e) => {
    if (!disabled && variantStyles[variant][':active']) {
      e.currentTarget.style.backgroundColor = variantStyles[variant][':active'].backgroundColor;
    }
  };

  const handleMouseUp = (e) => {
    if (!disabled && variantStyles[variant][':hover']) {
      e.currentTarget.style.backgroundColor = variantStyles[variant][':hover'].backgroundColor;
    }
  };

  return (
    <button
      type={type}
      onClick={disabled ? undefined : onClick}
      style={buttonStyle}
      className={className}
      disabled={disabled}
      onMouseOver={handleMouseOver}
      onMouseOut={handleMouseOut}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      {...props}
    >
      {leftIcon && <span className="button-icon-left">{leftIcon}</span>}
      {children}
      {rightIcon && <span className="button-icon-right">{rightIcon}</span>}
    </button>
  );
};

Button.propTypes = {
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'danger', 'success', 'bitcoin']),
  size: PropTypes.oneOf(['sm', 'md', 'lg']),
  fullWidth: PropTypes.bool,
  disabled: PropTypes.bool,
  children: PropTypes.node.isRequired,
  onClick: PropTypes.func,
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  leftIcon: PropTypes.node,
  rightIcon: PropTypes.node,
  className: PropTypes.string,
};

export default Button;
