/**
 * Type-only union that works with isolatedDeclarations/erasableSyntaxOnly.
 * Prefer this over `enum` in libraries/Vue + vue-tsc projects.
 */
export type VokabelnStatus = 'NICHT_GELERNT' | 'FALSCH' | 'RICHTIG'

/**
 * Runtime-safe constants (values) to use in code.
 * Example: VOKABELN_STATUS.RICHTIG
 */
export const VOKABELN_STATUS = {
  NICHT_GELERNT: 'NICHT_GELERNT',
  FALSCH: 'FALSCH',
  RICHTIG: 'RICHTIG',
} as const
