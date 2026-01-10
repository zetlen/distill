export type ContentProvider = (ref: string, path: string) => Promise<null | string>

/** Context values for a single concern, populated during processing */
export type ConcernContextValues = Record<string, boolean | number | string>

/** Map of concern IDs to their accumulated context values */
export type ConcernContext = Record<string, ConcernContextValues>

export interface ProcessingContext {
  concerns: ConcernContext
  contentProvider: ContentProvider
  refs: {base: string; head: string}
}
