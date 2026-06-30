/// <reference types="@solidjs/start/env" />

interface ImportMetaEnv {
  readonly VITE_API_BASE: string;
  readonly VITE_USE_MOCK: string;
  readonly VITE_NOINDEX: string;
  readonly VITE_SITE_NAME: string;
  readonly VITE_SITE_ORIGIN: string;
  readonly VITE_GA4_ID: string;
  readonly VITE_GOOGLE_ADS_ID: string;
  readonly VITE_GOOGLE_ADS_CONVERSION_LABEL: string;
  readonly VITE_CONTACT_EMAIL: string;
  readonly VITE_CONTACT_PHONE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
