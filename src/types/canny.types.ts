declare global {
  interface Window {
    Canny?: (method: string, options: Record<string, unknown>, callback?: () => void) => void;
  }
}

export {};
