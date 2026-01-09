import type {AstGrepFilterConfig} from '../focuses/ast-grep.js'
import type {JqFilterConfig} from '../focuses/jq.js'
import type {RegexFilterConfig} from '../focuses/regex.js'
import type {TsqFilterConfig} from '../focuses/tsq.js'
import type {XPathFilterConfig} from '../focuses/xpath.js'

// Re-export focus config types for convenience
export type {AstGrepFilterConfig} from '../focuses/ast-grep.js'
export type {JqFilterConfig} from '../focuses/jq.js'
export type {RegexFilterConfig} from '../focuses/regex.js'
export type {TsqFilterConfig} from '../focuses/tsq.js'
/**
 * Re-export FocusResult from focuses module for backwards compatibility.
 */
export type {FilterResult} from '../focuses/types.js'

export type {XPathFilterConfig} from '../focuses/xpath.js'

// =============================================================================
// FOCUS CONFIGURATION (formerly "Filter")
// A focus extracts and transforms content from file versions for comparison.
// =============================================================================

/**
 * Union type of all supported focus configurations.
 * Each focus type has its own specific properties with the 'type' field as discriminant.
 *
 * @example AstGrepFilterConfig - For ast-grep pattern matching
 * @example JqFilterConfig - For JSON processing with jq
 * @example RegexFilterConfig - For regex pattern matching
 * @example XPathFilterConfig - For XML/HTML XPath queries
 * @example TsqFilterConfig - For tree-sitter AST queries
 */
export type FocusConfig = AstGrepFilterConfig | JqFilterConfig | RegexFilterConfig | TsqFilterConfig | XPathFilterConfig

/**
 * All supported focus type names.
 */
export type FocusType = FocusConfig['type']

/**
 * @deprecated Use FocusConfig instead
 */
export type FilterConfig = FocusConfig

/**
 * @deprecated Use FocusType instead
 */
export type FilterType = FocusType

// =============================================================================
// VIEWER CONFIGURATION (formerly "Action")
// A viewer processes the results of a focus comparison.
// =============================================================================

/**
 * A "report" viewer produces a text report about the change.
 * It can be routed many places, including to stdout or an API call
 * (for example, a GitHub comment).
 */
export interface ReportViewer {
  /**
   * Handlebars template for the comment to produce. Accepts markdown,
   * and receives a FocusResult as its evaluation context.
   */
  template: string
  /**
   * Discriminant for tagged union. Implied when 'template' is present.
   */
  type?: 'report'
}

/**
 * A "run" viewer runs an arbitrary command that receives details about the
 * change as environment variables.
 */
export interface RunViewer {
  /**
   * If the command requires arguments, they can be evaluated here as Handlebars
   * templates which receive a FocusResult as evaluation context.
   */
  args: string[]
  /**
   * Path to the command. Can be a string or an array of strings which will be
   * evaluated as arguments to produce the command path.
   */
  command: string | string[]
  /**
   * If the default environment variables don't suffice, you can define new ones
   * as Handlebars templates which receive a FocusResult as evaluation context.
   */
  env: Record<string, string>
  /**
   * Discriminant for tagged union. Implied when 'command' is present.
   */
  type?: 'run'
}

/**
 * A viewer that updates the shared context of the subjects attached to the projection.
 */
export interface UpdateSubjectContextViewer {
  /**
   * Key-value pairs to set in the subject context.
   * Values can be Handlebars templates which receive a FocusResult as evaluation context.
   */
  set: Record<string, string>
  /**
   * Discriminant for tagged union. Implied when 'set' is present.
   */
  type?: 'set'
}

/**
 * Union type of all supported viewers.
 * Viewers can be discriminated by:
 * - 'template' property -> ReportViewer
 * - 'command' property -> RunViewer
 * - 'set' property -> UpdateSubjectContextViewer
 */
export type Viewer = ReportViewer | RunViewer | UpdateSubjectContextViewer

/**
 * @deprecated Use ReportViewer instead
 */
export type ReportAction = ReportViewer

/**
 * @deprecated Use RunViewer instead
 */
export type RunAction = RunViewer

/**
 * @deprecated Use UpdateSubjectContextViewer instead
 */
export type UpdateConcernContextAction = UpdateSubjectContextViewer

/**
 * @deprecated Use Viewer instead
 */
export type Action = Viewer

// =============================================================================
// REFERENCE SYSTEM
// Allows reusing defined projections, focuses, and viewers via references.
// =============================================================================

/**
 * A reference to a defined item in the `defined` block.
 * Format: "#defined/<type>/<name>" where type is projections, focuses, or viewers.
 */
export interface UseReference {
  use: string
}

/**
 * Either an inline item or a reference to a defined item.
 */
export type FocusRef = FocusConfig | UseReference
export type ViewerRef = UseReference | Viewer

// =============================================================================
// PROJECTION (formerly "Check" + file pattern from "Checkset")
// A projection is a self-contained rule: file pattern + focuses + viewers.
// =============================================================================

/**
 * A projection defines a file pattern, focuses to apply, and viewers to execute.
 * This combines what was previously split between FileCheckset and Check.
 */
export interface Projection {
  /**
   * Focuses to apply to the file content.
   * Each focus processes the file and produces artifacts for comparison.
   * If all focuses produce a meaningful diff, the viewers are triggered.
   * Can be inline configurations or references to defined focuses.
   */
  focuses: FocusRef[]
  /**
   * Glob pattern for files to which this projection applies.
   * Uses minimatch syntax for pattern matching.
   */
  include: string
  /**
   * Viewers to run when the projection is triggered.
   * Will run once per file that matches the projection's focuses.
   * Can be inline configurations or references to defined viewers.
   */
  viewers: ViewerRef[]
}

/**
 * Either an inline projection or a reference to a defined projection.
 */
export type ProjectionRef = Projection | UseReference

// =============================================================================
// SUBJECT (formerly "Concern")
// A subject represents an area of interest with stakeholders and projections.
// =============================================================================

/**
 * A stakeholder interested in a set of subjects.
 */
export interface Stakeholder {
  /**
   * How to contact the stakeholder.
   * Examples: "github-comment-mention", "github-reviewer-request", "github-assign", "webhook".
   */
  contactMethod: string
  /**
   * A description of the stakeholder's role or interest.
   */
  description?: string
  /**
   * The name of the stakeholder (e.g. a team or person).
   */
  name: string
}

/**
 * A subject represents a specific area of interest or domain in the project.
 * Projections are attached to subjects to define what to monitor.
 */
export interface Subject {
  /**
   * Projections attached to this subject.
   * Can be inline definitions or references to defined projections.
   */
  projections: ProjectionRef[]
  /**
   * List of stakeholders associated with this subject.
   */
  stakeholders: Stakeholder[]
}

/**
 * @deprecated Use Subject instead
 */
export type Concern = Subject

// =============================================================================
// DEFINED BLOCK
// Reusable definitions that can be referenced throughout the configuration.
// =============================================================================

/**
 * Block of reusable definitions that can be referenced via UseReference.
 */
export interface DefinedBlock {
  /**
   * Reusable focus configurations.
   * Reference with: { use: "#defined/focuses/<name>" }
   */
  focuses?: Record<string, FocusConfig>
  /**
   * Reusable projection configurations.
   * Reference with: { use: "#defined/projections/<name>" }
   */
  projections?: Record<string, Projection>
  /**
   * Reusable viewer configurations.
   * Reference with: { use: "#defined/viewers/<name>" }
   */
  viewers?: Record<string, Viewer>
}

// =============================================================================
// ROOT CONFIGURATION
// =============================================================================

/**
 * Root configuration interface for tiltshift.yml files.
 * Subjects contain projections that define how to process git diffs.
 */
export interface TiltshiftConfig {
  /**
   * Reusable definitions that can be referenced throughout the configuration.
   */
  defined?: DefinedBlock
  /**
   * Dictionary of subjects defined in the project.
   * Keys are subject IDs.
   */
  subjects: Record<string, Subject>
}

// =============================================================================
// LEGACY TYPES (deprecated, for migration support)
// =============================================================================

/**
 * @deprecated Checksets are no longer used. Use Projection instead.
 */
export interface Check {
  actions: Action[]
  filters: FilterConfig[]
}

/**
 * @deprecated Checksets are no longer used. Use subjects with projections instead.
 */
export interface FileCheckset {
  checks: Check[]
  concerns?: string[]
  include: string
}

/**
 * @deprecated Use TiltshiftConfig instead
 */
export interface DistillConfig {
  checksets: FileCheckset[]
  concerns?: Record<string, Concern>
}
