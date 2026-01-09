import Handlebars from 'handlebars'

import type {ReportViewer, RunViewer, UpdateSubjectContextViewer, Viewer} from '../configuration/config.js'
import type {FilterResult} from '../focuses/index.js'

// Re-export viewer types for convenience
export type {ReportViewer, RunViewer, UpdateSubjectContextViewer, Viewer} from '../configuration/config.js'

export interface ReportMetadata {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context?: Record<string, any>[]
  diffText: string
  fileName: string
  lineRange?: {end: number; start: number}
  message: string
}

export interface ReportOutput {
  content: string
  metadata?: ReportMetadata
}

/**
 * Execute a report viewer by rendering the template with the filter result.
 * Diff text and artifacts are marked as safe strings to avoid HTML escaping.
 */
export function executeReportViewer(
  viewer: ReportViewer,
  filterResult: FilterResult,
  context: {filePath: string},
): ReportOutput {
  const template = Handlebars.compile(viewer.template)
  // Mark diff text and artifacts as safe to prevent HTML escaping
  const content = template({
    diffText: new Handlebars.SafeString(filterResult.diffText),
    filePath: context.filePath,
    left: {artifact: new Handlebars.SafeString(filterResult.left.artifact)},
    right: {artifact: new Handlebars.SafeString(filterResult.right.artifact)},
  })

  // Basic metadata population.
  const metadata: ReportMetadata = {
    diffText: filterResult.diffText,
    fileName: context.filePath,
    message: content, // Use the rendered content as the default message
    ...(filterResult.lineRange ? {lineRange: filterResult.lineRange} : {}),
    ...(filterResult.context ? {context: filterResult.context} : {}),
  }

  return {
    content,
    metadata,
  }
}

/**
 * Execute an update subject context viewer.
 * Returns the updates to be applied to the subject context.
 */
export function executeUpdateSubjectContextViewer(
  viewer: UpdateSubjectContextViewer,
  filterResult: FilterResult,
  context: {filePath: string},
): Record<string, string> {
  const updates: Record<string, string> = {}
  for (const [key, valueTemplate] of Object.entries(viewer.set)) {
    const template = Handlebars.compile(valueTemplate)
    updates[key] = template({
      diffText: new Handlebars.SafeString(filterResult.diffText),
      filePath: context.filePath,
      left: {artifact: new Handlebars.SafeString(filterResult.left.artifact)},
      right: {artifact: new Handlebars.SafeString(filterResult.right.artifact)},
    })
  }

  return updates
}

/**
 * Type guard for report viewers. Checks for the 'template' property which is unique to ReportViewer.
 */
export function isReportViewer(viewer: Viewer): viewer is ReportViewer {
  return 'template' in viewer
}

/**
 * Type guard for run viewers. Checks for the 'command' property which is unique to RunViewer.
 */
export function isRunViewer(viewer: Viewer): viewer is RunViewer {
  return 'command' in viewer
}

/**
 * Type guard for update subject context viewers. Checks for the 'set' property.
 */
export function isUpdateSubjectContextViewer(viewer: Viewer): viewer is UpdateSubjectContextViewer {
  return 'set' in viewer
}
