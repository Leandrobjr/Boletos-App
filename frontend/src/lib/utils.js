import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes CSS do Tailwind de forma eficiente, eliminando conflitos
 * @param {string[]} inputs - Classes CSS a serem combinadas
 * @returns {string} - String de classes CSS combinadas e otimizadas
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

/**
 * Converte string de valor em reais (pt-BR) para número (padrão americano)
 * Ex: '1.234,56' => 1234.56
 * @param {string|number} valor
 * @returns {number}
 */
export function parseValorBRL(valor) {
  if (typeof valor === 'number') return valor;
  if (!valor) return 0;
  return parseFloat(valor.replace(/\./g, '').replace(',', '.'));
}
