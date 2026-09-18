import type nl from './nl';

/**
 * Widen literal string types to `string` while preserving the nested key
 * structure. The Dutch dictionary (declared `as const`) defines the required
 * shape; every other locale must provide the same keys but may use different
 * text. This gives us "all locales are structurally complete" as a compile-time
 * guarantee without freezing the copy to Dutch literals.
 */
export type Widen<T> = {
  [K in keyof T]: T[K] extends string ? string : Widen<T[K]>;
};

export type AppMessages = Widen<typeof nl>;
