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
