import toast from 'react-hot-toast';
import type { AxiosError } from 'axios';

/** Toast styling to match app UI: dark panels, primary blue border, Anton font */
const TOAST_STYLE = {
  background: '#202253',
  color: '#fff',
  border: '2px solid #0967BC',
  borderRadius: '12px',
  padding: '12px 16px',
  fontFamily: 'Anton, sans-serif',
  fontSize: '14px',
  textTransform: 'uppercase' as const,
  letterSpacing: '0.02em',
} as const;

const TOAST_OPTIONS = {
  duration: 4000,
  style: TOAST_STYLE,
  className: 'font-anton',
};

/** Error toast with accent color for icon area */
const ERROR_STYLE = {
  ...TOAST_STYLE,
  borderColor: '#FD8BBA',
  boxShadow: '0 0 12px rgba(253, 139, 186, 0.2)',
};

/**
 * Get a user-friendly error message from an unknown error (e.g. Axios response).
 */
export function getErrorMessage(err: unknown, fallback: string): string {
  if (err && typeof err === 'object' && 'response' in err) {
    const res = (err as AxiosError<{ error?: string; message?: string }>).response;
    const data = res?.data;
    if (data?.error && typeof data.error === 'string') return data.error;
    if (data?.message && typeof data.message === 'string') return data.message;
  }
  if (err instanceof Error && err.message) return err.message;
  return fallback;
}

/**
 * Show an error toast that matches the app UI. Optionally pass the error to use API message or log.
 */
export function toastError(messageOrError: string | unknown, err?: unknown): void {
  const message =
    typeof messageOrError === 'string'
      ? messageOrError
      : getErrorMessage(messageOrError, 'Something went wrong. Please try again.');
  if (err !== undefined && err !== messageOrError && typeof console !== 'undefined') {
    console.error(message, err);
  }
  toast.error(message, {
    ...TOAST_OPTIONS,
    style: ERROR_STYLE,
  });
}

/**
 * Show a success toast that matches the app UI.
 */
export function toastSuccess(message: string): void {
  toast.success(message, {
    ...TOAST_OPTIONS,
    style: { ...TOAST_STYLE, borderColor: '#2D57DE' },
  });
}

export { toast };
