import { cva, cx, type VariantProps } from "class-variance-authority";
import { type ClassValue } from "class-variance-authority/types";
import { twMerge } from "tailwind-merge";

export type ExtractBaseVariantConfig<
  T extends ReturnType<typeof cva>,
  K = VariantProps<T>,
> = {
  [P in keyof K]: NonNullable<K[P]> extends string
    ? Record<NonNullable<K[P]>, ClassValue>
    : NonNullable<K[P]> extends boolean
      ? Record<"true", ClassValue>
      : never;
};

export const cn = (...arguments_: ClassValue[]) => twMerge(cx(...arguments_));
