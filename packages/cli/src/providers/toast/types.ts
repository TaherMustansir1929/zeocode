export type ToastVariant = "success" | "error" | "info";

export interface ToastOptions {
  duration?: number;
  message: string;
  variant?: ToastVariant;
}

export const DEFAULT_DURATION = 3000;
