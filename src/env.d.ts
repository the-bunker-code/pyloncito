/// <reference types="astro/client" />

declare const __APP_VERSION__: string;

interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
