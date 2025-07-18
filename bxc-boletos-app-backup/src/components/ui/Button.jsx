import React from 'react';
import PropTypes from 'prop-types';
import { colors } from '../../styles/colors';

/**
 * Componente de botão reutilizável seguindo o guia de identidade visual do BoletoXCrypto
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
    fontWeight: 600,
    borderRadius: '16px',
    transition: 'all 0.2s ease-in-out',
    cursor: disabled ? 'not-allowed' : 'pointer',
    width: fullWidth ? '100%' : 'auto',
    opacity: disabled ? 0.7 : 1,
    boxShadow: '0 2px 5px rgba(0, 0, 0, 0.1)',
  };

  // Estilos de tamanho
  const sizeStyles = {
    sm: {
      padding: '10px 18px',
      fontSize: '0.875rem',
      gap: '6px',
    },
    md: {
      padding: '14px 24px',
      fontSize: '1rem',
      gap: '8px',
    },
    lg: {
      padding: '18px 28px',
      fontSize: '1.125rem',
      gap: '10px',
    }
  };

  // Estilos de variante
  const variantStyles = {
    primary: {
      backgroundColor: disabled ? colors.gray[400] : colors.primary.main,
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
    blue: {
      backgroundColor: disabled ? colors.gray[400] : colors.status.locked,
      color: colors.white,
      border: 'none',
      ':hover': {
        backgroundColor: '#1976d2', // azul mais escuro
      },
      ':active': {
        backgroundColor: '#115293',
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
  variant: PropTypes.oneOf(['primary', 'secondary', 'tertiary', 'danger', 'success', 'bitcoin', 'blue']),
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
