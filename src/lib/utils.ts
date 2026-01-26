import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Utility function to merge class names conditionally and handle Tailwind CSS conflicts.
 *
 * @param inputs - An array of class names or conditional class name objects.
 * @returns A single string with merged class names.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
