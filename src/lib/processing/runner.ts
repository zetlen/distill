import {minimatch} from 'minimatch'

import type {
  DefinedBlock,
  FocusConfig,
  Projection,
  TiltshiftConfig,
  UpdateSubjectContextViewer,
  Viewer,
} from '../configuration/config.js'
import type {File, FileVersions} from '../diff/parser.js'
import type {ReportOutput} from '../viewers/index.js'
import type {ProcessingContext, SubjectContext} from './types.js'

import {resolveFocus, resolveProjection, resolveViewer} from '../configuration/resolver.js'
import {applyFilter, type FilterResult} from '../focuses/index.js'
import {
  executeReportViewer,
  executeUpdateSubjectContextViewer,
  isReportViewer,
  isUpdateSubjectContextViewer,
} from '../viewers/index.js'

/** Result of processing files through all subjects */
export interface ProcessingResult {
  reports: ReportOutput[]
  subjects: SubjectContext
}

export async function processFiles(
  files: File[],
  config: TiltshiftConfig,
  context: ProcessingContext,
): Promise<ProcessingResult> {
  const reports: ReportOutput[] = []

  for (const file of files) {
    for (const [subjectId, subject] of Object.entries(config.subjects)) {
      for (const projectionRef of subject.projections) {
        // eslint-disable-next-line no-await-in-loop
        const projectionReports = await processProjection({
          context,
          defined: config.defined,
          file,
          projectionRef,
          subjectId,
        })
        reports.push(...projectionReports)
      }
    }
  }

  return {reports, subjects: context.subjects}
}

/** Options for processing a projection against a file */
interface ProcessProjectionOptions {
  context: ProcessingContext
  defined?: DefinedBlock
  file: File
  projectionRef: Projection | {use: string}
  subjectId: string
}

async function processProjection(options: ProcessProjectionOptions): Promise<ReportOutput[]> {
  const {context, defined, file, projectionRef, subjectId} = options
  const filePath = file.newPath || file.oldPath

  // Resolve the projection reference
  const projection = resolveProjection(projectionRef, defined)

  if (!minimatch(filePath, projection.include)) {
    return []
  }

  const versions = await getFileVersions(file, context)
  const reports: ReportOutput[] = []

  // Resolve all focuses
  const focuses: FocusConfig[] = projection.focuses.map((ref) => resolveFocus(ref, defined))

  // Apply focuses - all must pass
  let focusResult: FilterResult | null = null
  for (const focus of focuses) {
    // eslint-disable-next-line no-await-in-loop
    focusResult = await applyFilter(focus, versions, filePath)
    if (!focusResult) {
      return reports
    }
  }

  // Execute viewers if we have a focus result
  if (focusResult) {
    // Resolve all viewers
    const viewers: Viewer[] = projection.viewers.map((ref) => resolveViewer(ref, defined))

    processViewers({
      context,
      filePath,
      focusResult,
      reports,
      subjectId,
      viewers,
    })
  }

  return reports
}

/** Options for processing viewers from a triggered projection */
interface ProcessViewersOptions {
  context: ProcessingContext
  filePath: string
  focusResult: FilterResult
  reports: ReportOutput[]
  subjectId: string
  viewers: Viewer[]
}

function processViewers(options: ProcessViewersOptions): void {
  const {context, filePath, focusResult, reports, subjectId, viewers} = options

  for (const viewer of viewers) {
    if (isReportViewer(viewer)) {
      const report = executeReportViewer(viewer, focusResult, {filePath})
      reports.push(report)
    } else if (isUpdateSubjectContextViewer(viewer)) {
      applySubjectContextUpdates({context, filePath, focusResult, subjectId, viewer})
    }
  }
}

/** Options for applying subject context updates */
interface ApplySubjectContextUpdatesOptions {
  context: ProcessingContext
  filePath: string
  focusResult: FilterResult
  subjectId: string
  viewer: UpdateSubjectContextViewer
}

function applySubjectContextUpdates(options: ApplySubjectContextUpdatesOptions): void {
  const {context, filePath, focusResult, subjectId, viewer} = options

  const updates = executeUpdateSubjectContextViewer(viewer, focusResult, {filePath})

  if (!context.subjects[subjectId]) {
    context.subjects[subjectId] = {}
  }

  context.subjects[subjectId] = {...context.subjects[subjectId], ...updates}
}

/**
 * Get the old and new content of a file using the content provider.
 */
async function getFileVersions(file: File, context: ProcessingContext): Promise<FileVersions> {
  let oldContent: null | string = null
  let newContent: null | string = null

  // Get old content if file existed before (not an add)
  if (file.type !== 'add') {
    oldContent = await context.contentProvider(context.refs.base, file.oldPath)
  }

  // Get new content if file exists after (not a delete)
  if (file.type !== 'delete') {
    newContent = await context.contentProvider(context.refs.head, file.newPath)
  }

  return {newContent, oldContent}
}
