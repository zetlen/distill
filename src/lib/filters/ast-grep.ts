import {parseAsync} from '@ast-grep/napi'

import type {FileVersions} from '../diff/parser.js'
import type {FilterApplier, FilterResult} from './types.js'

import {createDiffText} from './utils.js'

/**
 * Configuration for the ast-grep filter.
 * Extracts AST nodes from source code using ast-grep's pattern syntax.
 * Patterns look like actual code with metavariables ($VAR) for wildcards.
 *
 * @example
 * ```yaml
 * # Find all console.log calls
 * filters:
 *   - type: ast-grep
 *     pattern: "console.log($$$ARGS)"
 *     language: javascript
 * ```
 *
 * @example
 * ```yaml
 * # Find function declarations (language inferred from file extension)
 * filters:
 *   - type: ast-grep
 *     pattern: "function $NAME($$$PARAMS) { $$$BODY }"
 * ```
 *
 * @example
 * ```yaml
 * # Find Python class definitions
 * filters:
 *   - type: ast-grep
 *     pattern: "class $NAME:"
 *     language: python
 * ```
 *
 * @example
 * ```yaml
 * # Find Go struct definitions with selector for precise matching
 * filters:
 *   - type: ast-grep
 *     pattern: "type $NAME struct { $$$FIELDS }"
 *     language: go
 *     selector: type_declaration
 * ```
 */
export type AstGrepFilterConfig = {
  language: string
  pattern: {
    context: string
    selector: string
  }
  /**
   * Discriminant tag identifying this as an ast-grep filter.
   */
  type: 'ast-grep'
}

/**
 * ast-grep filter for extracting AST nodes using pattern matching.
 */
export const astGrepFilter: FilterApplier<AstGrepFilterConfig> = {
  async apply(versions: FileVersions, config: AstGrepFilterConfig): Promise<FilterResult | null> {
    const {language, pattern} = config

    // Determine language
    if (!language) {
      throw new Error(
        'ast-grep filter requires a language (either from file extension or as "language" config property)',
      )
    }

    const extractNodes = async (content: null | string): Promise<string> => {
      if (!content) return ''

      const ast = await parseAsync(language, content)
      const root = ast.root()
      const matching = root
        .findAll({rule: {pattern}})
        .map((n) => n.text())
        .join('\n\n')

      return matching
    }

    // If both are null, nothing to filter
    if (versions.oldContent === null && versions.newContent === null) {
      return null
    }

    const [leftArtifact, rightArtifact] = await Promise.all([
      extractNodes(versions.oldContent),
      extractNodes(versions.newContent),
    ])

    // If artifacts are the same, no meaningful diff after filtering
    if (leftArtifact === rightArtifact) {
      return null
    }

    const diffText = await createDiffText(leftArtifact, rightArtifact)

    return {
      diffText,
      left: {artifact: leftArtifact},
      right: {artifact: rightArtifact},
    }
  },
}
