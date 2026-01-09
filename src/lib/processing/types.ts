export type ContentProvider = (ref: string, path: string) => Promise<null | string>

/** Context values for a single subject, populated by UpdateSubjectContextViewers */
export type SubjectContextValues = Record<string, boolean | number | string>

/** Map of subject IDs to their accumulated context values */
export type SubjectContext = Record<string, SubjectContextValues>

export interface ProcessingContext {
  contentProvider: ContentProvider
  refs: {base: string; head: string}
  subjects: SubjectContext
}

// Legacy aliases for backwards compatibility
/** @deprecated Use SubjectContextValues instead */
export type ConcernContextValues = SubjectContextValues

/** @deprecated Use SubjectContext instead */
export type ConcernContext = SubjectContext
