# tiltshift

Process code changes with semantic rules

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/tiltshift.svg)](https://npmjs.org/package/tiltshift)
[![Downloads/week](https://img.shields.io/npm/dw/tiltshift.svg)](https://npmjs.org/package/tiltshift)

<!-- toc -->

- [tiltshift](#tiltshift)
- [Usage](#usage)
- [Configuration](#configuration)
- [Commands](#commands)
<!-- tocstop -->

# Usage

<!-- usage -->

```sh-session
$ npm install -g @tiltshift/cli
$ tiltshift COMMAND
running command...
$ tiltshift (--version)
@tiltshift/cli/2.0.0 linux-x64 node-v24.12.0
$ tiltshift --help [COMMAND]
USAGE
  $ tiltshift COMMAND
...
```

<!-- usagestop -->

# Configuration

`tiltshift` is configured via a `tiltshift.yml` file in your repository root. You define **subjects** (areas of interest) containing **projections** that match files and apply **focuses** (filters) and **viewers** (output actions).

## Subjects and Stakeholders

**Subjects** represent areas of interest (e.g., "security", "ui-consistency") with associated **stakeholders** (teams or individuals). Each subject contains **projections** that define what files to watch and how to process them.

```yaml
subjects:
  security:
    stakeholders:
      - name: Security Team
        contactMethod: github-reviewer-request
        description: Reviews security-sensitive changes

    projections:
      - include: 'src/auth/**/*.ts'
        focuses:
          - type: regex
            pattern: 'password|secret'
        viewers:
          - template: 'Potential secret exposure in {{filePath}}'
          # Update the shared context for this subject
          - set:
              hasSecrets: 'true'

  ui-consistency:
    stakeholders:
      - name: Design System Team
        contactMethod: github-comment-mention

    projections:
      - include: 'src/components/**/*.tsx'
        focuses:
          - type: ast-grep
            language: tsx
            pattern:
              context: 'style={{...}}'
              selector: 'jsx_attribute'
        viewers:
          - template: 'Avoid inline styles in {{filePath}}. Use standard classes.'
```

## Reusable Definitions

You can define reusable projections, focuses, and viewers in a `defined` block and reference them throughout your configuration:

```yaml
defined:
  focuses:
    jq-deps:
      type: jq
      query: '.dependencies'
  viewers:
    deps-report:
      template: |
        Dependencies changed in {{filePath}}

subjects:
  dependencies:
    stakeholders:
      - name: Dev Team
        contactMethod: github-comment-mention
    projections:
      - include: 'package.json'
        focuses:
          - use: '#defined/focuses/jq-deps'
        viewers:
          - use: '#defined/viewers/deps-report'
```

# Commands

<!-- commands -->

- [`tiltshift diff [BASE] [HEAD]`](#tiltshift-diff-base-head)
- [`tiltshift help [COMMAND]`](#tiltshift-help-command)
- [`tiltshift pr [PR]`](#tiltshift-pr-pr)

## `tiltshift diff [BASE] [HEAD]`

Annotate a git diff with semantic analysis based on configured rules.

```
USAGE
  $ tiltshift diff [BASE] [HEAD] [--json] [-c <value>] [-r <value>] [-s]

ARGUMENTS
  [BASE]  Base commit-ish (e.g., HEAD~1, main). Defaults based on working tree state.
  [HEAD]  Head commit-ish (e.g., HEAD, feat/foo, . for working directory). Defaults to "."

FLAGS
  -c, --config=<value>  Path to the tiltshift configuration file (default: tiltshift.yml in repo root)
  -r, --repo=<value>    Path to git repository
  -s, --staged          Only check staged changes (when comparing with working directory)

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Annotate a git diff with semantic analysis based on configured rules.

  When no arguments are provided, defaults are chosen based on the working tree state:
  - If there are unstaged changes, compares HEAD to the working directory
  - If there are only staged changes, use --staged to check them

  When using --json, a "lineRange" field is included. Note that this range refers to the line numbers within the
  *filtered artifact* (the code snippet shown in the report), NOT the original source file.

EXAMPLES
  $ tiltshift diff                  # auto-detect changes

  $ tiltshift diff --staged         # check staged changes only

  $ tiltshift diff HEAD~1 HEAD

  $ tiltshift diff main feat/foo

  $ tiltshift diff HEAD .           # compare HEAD to working directory

  $ tiltshift diff main HEAD --repo ../other-project
```

_See code: [src/commands/diff.ts](https://github.com/zetlen/tiltshift/blob/v2.0.0/src/commands/diff.ts)_

## `tiltshift help [COMMAND]`

Display help for tiltshift.

```
USAGE
  $ tiltshift help [COMMAND...] [-n]

ARGUMENTS
  [COMMAND...]  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for tiltshift.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.36/src/commands/help.ts)_

## `tiltshift pr [PR]`

Annotate a GitHub Pull Request.

```
USAGE
  $ tiltshift pr [PR] [--json] [-c <value>] [-r <value>]

ARGUMENTS
  [PR]  PR number or URL (optional: detects PR for current branch if omitted)

FLAGS
  -c, --config=<value>  Path to the tiltshift configuration file (default: tiltshift.yml in repo root)
  -r, --repo=<value>    GitHub repository (owner/repo). Required if not running in a git repo.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Annotate a GitHub Pull Request.

  When no argument is provided, detects the PR associated with the current branch.
  Requires GITHUB_TOKEN environment variable for authentication.

EXAMPLES
  $ tiltshift pr                                # auto-detect PR for current branch

  $ tiltshift pr 123                            # PR number (uses detected remote)

  $ tiltshift pr https://github.com/owner/repo/pull/123

  $ tiltshift pr 123 --repo owner/repo
```

_See code: [src/commands/pr.ts](https://github.com/zetlen/tiltshift/blob/v2.0.0/src/commands/pr.ts)_

<!-- commandsstop -->
