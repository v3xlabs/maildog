/// <reference types="vite/client" />

interface ImportMetaEnvironment {
    readonly VITE_API_URL?: string;
}

interface ImportMeta {
    readonly env: ImportMetaEnvironment;
}
