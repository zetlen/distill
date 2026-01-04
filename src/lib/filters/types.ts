import type {FileVersions} from '../diff/parser.js'

/**
 * Result of applying a filter to file versions.
 * Contains the diff text and the artifacts from both sides.
 */
export interface FilterResult {
  diffText: string
  left: {
    artifact: string
  }
  right: {
    artifact: string
  }
}

/**
 * Base interface for filter configuration.
 * Each filter type extends this with its own discriminant tag and properties.
 * This base does not include a 'type' property - that's added by each filter.
 */
export interface BaseFilterConfig {
  /**
   * Optional name of the definition, for reuse. Names must be unique.
   * To use a definition by name, provide its name instead of the inline
   * definition object.
   */
  name?: string
}

/**
 * Generic filter interface for backwards compatibility.
 * @deprecated Use specific filter config types (JqFilterConfig, RegexFilterConfig, etc.)
 */
export interface Filter {
  args: string[]
  type: string
}

/**
 * Interface that filter implementations must satisfy.
 * Each filter takes file versions and its specific config, returning a FilterResult.
 */
export interface FilterApplier<TConfig extends BaseFilterConfig> {
  /**
   * Apply the filter to file versions.
   * @param versions - The old and new content of a file
   * @param config - Filter-specific configuration
   * @param filePath - Optional file path for language detection (used by tsq)
   * @returns FilterResult if there's a meaningful diff, null otherwise
   */
  apply(versions: FileVersions, config: TConfig, filePath?: string): Promise<FilterResult | null>
}
