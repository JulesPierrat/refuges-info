/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute origin of the refuges.info API in production (e.g. https://www.refuges.info). */
  readonly VITE_API_BASE?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
