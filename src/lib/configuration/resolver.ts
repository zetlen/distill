import type {DefinedBlock, FocusConfig, FocusRef, Projection, ProjectionRef, Viewer, ViewerRef} from './config.js'

/**
 * Type guard to check if an object is a UseReference.
 */
export function isUseReference(obj: unknown): obj is {use: string} {
  return typeof obj === 'object' && obj !== null && 'use' in obj && typeof (obj as {use: unknown}).use === 'string'
}

/**
 * Parsed reference information from a use string.
 */
export interface ParsedReference {
  name: string
  type: 'focuses' | 'projections' | 'viewers'
}

/**
 * Parse a use reference string into its components.
 * Expected format: "#defined/<type>/<name>"
 *
 * @throws Error if the reference format is invalid
 */
export function parseUseReference(use: string): ParsedReference {
  const match = use.match(/^#defined\/(projections|focuses|viewers)\/(.+)$/)
  if (!match) {
    throw new Error(
      `Invalid reference format: "${use}". Expected "#defined/<type>/<name>" where type is projections, focuses, or viewers.`,
    )
  }

  return {
    name: match[2],
    type: match[1] as ParsedReference['type'],
  }
}

/**
 * Resolve a projection reference to an actual Projection.
 *
 * @throws Error if the reference cannot be resolved
 */
export function resolveProjection(ref: ProjectionRef, defined?: DefinedBlock): Projection {
  if (!isUseReference(ref)) {
    return ref
  }

  const parsed = parseUseReference(ref.use)
  if (parsed.type !== 'projections') {
    throw new Error(`Expected a projection reference, got "${parsed.type}" in "${ref.use}"`)
  }

  const projection = defined?.projections?.[parsed.name]
  if (!projection) {
    throw new Error(`Projection "${parsed.name}" not found in defined.projections`)
  }

  return projection
}

/**
 * Resolve a focus reference to an actual FocusConfig.
 *
 * @throws Error if the reference cannot be resolved
 */
export function resolveFocus(ref: FocusRef, defined?: DefinedBlock): FocusConfig {
  if (!isUseReference(ref)) {
    return ref
  }

  const parsed = parseUseReference(ref.use)
  if (parsed.type !== 'focuses') {
    throw new Error(`Expected a focus reference, got "${parsed.type}" in "${ref.use}"`)
  }

  const focus = defined?.focuses?.[parsed.name]
  if (!focus) {
    throw new Error(`Focus "${parsed.name}" not found in defined.focuses`)
  }

  return focus
}

/**
 * Resolve a viewer reference to an actual Viewer.
 *
 * @throws Error if the reference cannot be resolved
 */
export function resolveViewer(ref: ViewerRef, defined?: DefinedBlock): Viewer {
  if (!isUseReference(ref)) {
    return ref
  }

  const parsed = parseUseReference(ref.use)
  if (parsed.type !== 'viewers') {
    throw new Error(`Expected a viewer reference, got "${parsed.type}" in "${ref.use}"`)
  }

  const viewer = defined?.viewers?.[parsed.name]
  if (!viewer) {
    throw new Error(`Viewer "${parsed.name}" not found in defined.viewers`)
  }

  return viewer
}

/**
 * Resolve all focus references in an array.
 */
export function resolveFocuses(refs: FocusRef[], defined?: DefinedBlock): FocusConfig[] {
  return refs.map((ref) => resolveFocus(ref, defined))
}

/**
 * Resolve all viewer references in an array.
 */
export function resolveViewers(refs: ViewerRef[], defined?: DefinedBlock): Viewer[] {
  return refs.map((ref) => resolveViewer(ref, defined))
}
