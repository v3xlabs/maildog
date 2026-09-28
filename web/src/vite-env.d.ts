/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL?: string;
  readonly VITE_INSTANCE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module "~icons/*" {
  import type { JSX } from "@solidjs/web";
  import type { Component } from "solid-js";

  const component: Component<JSX.SvgSVGAttributes<SVGSVGElement>>;

  // eslint-disable-next-line import/no-default-export -- unplugin-icons modules are consumed as default imports
  export default component;
}
