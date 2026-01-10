# Distill Naming & Configuration Proposal

**Status**: FOUNDER DECISION - FINAL
**Date**: 2026-01-10

---

## Final Decision

| Aspect           | Decision                        |
| ---------------- | ------------------------------- |
| **Product Name** | **distill** (keeping original)  |
| **Package Name** | `@distill/cli` or `distill-cli` |
| **Config File**  | `distill.yml`                   |

---

## Configuration Model

### Three Core Concepts

| Concept     | Purpose                           | Contains                    |
| ----------- | --------------------------------- | --------------------------- |
| **Concern** | Area of governance interest       | Signals                     |
| **Signal**  | What to detect and how to respond | Watch + Report + Notify     |
| **Notify**  | Who to tell and how               | Channel → Target dictionary |

### Signal Components

| Component  | Purpose                                                |
| ---------- | ------------------------------------------------------ |
| **watch**  | File patterns + extraction type + type-specific config |
| **report** | Output format (type + template)                        |
| **notify** | Notification channels (dictionary)                     |

---

## Configuration Schema

````yaml
# distill.yml

concerns:
  security:
    signals:
      # Signal 1: Runtime dependencies
      - watch:
          include: 'package.json' # string or array
          type: jq
          query: '.dependencies'
        report:
          type: handlebars
          template: |
            # Runtime Dependency Changed

            Review for security and compatibility.

            ```diff
            {{diffText}}
            ```
        notify:
          slack: '#security-alerts'
          github: '@security-team'

      # Signal 2: Docker base image
      - watch:
          include: 'Dockerfile'
          type: regex
          pattern: '^FROM (?<base_image>.+)$'
        report:
          type: handlebars
          template: |
            # Docker Base Image Changed

            Verify compatibility and security.
        notify:
          github: '@platform-team'

  api-contracts:
    signals:
      - watch:
          include: 'src/api/**/*.ts'
          type: tsq
          query: '(interface_declaration) @iface'
        report:
          type: handlebars
          template: 'API interface changed in {{filePath}}'
        notify:
          slack: '#api-consumers'
          email: 'api-changes@company.com'

# Reusable definitions
defined:
  watches:
    runtime-deps:
      include: 'package.json'
      type: jq
      query: '.dependencies'

    typescript-interfaces:
      include: 'src/**/*.ts'
      type: tsq
      query: '(interface_declaration) @iface'

  reports:
    security-review:
      type: handlebars
      template: |
        # Security Review Required

        {{diffText}}

  signals:
    dep-security-check:
      watch:
        use: '#defined/watches/runtime-deps'
      report:
        use: '#defined/reports/security-review'
      notify:
        slack: '#security'
````

---

## Watch Types

Each watch type has its own configuration properties:

### jq (JSON processing)

```yaml
watch:
  include: 'package.json'
  type: jq
  query: '.dependencies'
```

### regex (Pattern matching)

```yaml
watch:
  include: 'Dockerfile'
  type: regex
  pattern: '^FROM (?<base_image>.+)$'
  flags: 'gm' # optional
```

### tsq (Tree-sitter queries)

```yaml
watch:
  include: 'src/**/*.ts'
  type: tsq
  query: '(function_declaration name: (identifier) @fn)'
  capture: fn # optional
```

### ast-grep (AST pattern matching)

```yaml
watch:
  include: 'src/**/*.ts'
  type: ast-grep
  language: typescript
  pattern: 'function $NAME($$$PARAMS) { $$$BODY }'
  # OR with context/selector:
  pattern:
    context: 'class C { static override args = $ARGS }'
    selector: public_field_definition
```

### xpath (XML/HTML queries)

```yaml
watch:
  include: 'pom.xml'
  type: xpath
  expression: '//dependency/version'
  namespaces:
    m: 'http://maven.apache.org/POM/4.0.0'
```

---

## Include Patterns

The `include` property accepts a string or array:

```yaml
# Single pattern
watch:
  include: 'package.json'
  type: jq
  query: '.dependencies'

# Multiple patterns
watch:
  include:
    - 'package.json'
    - 'package-lock.json'
    - 'yarn.lock'
  type: jq
  query: '.dependencies'
```

---

## Report Types

Currently supported:

- `handlebars` - Handlebars template engine

Future types may include:

- `json` - Structured JSON output
- `sarif` - Static Analysis Results Interchange Format
- `junit` - JUnit XML format for CI integration

````yaml
report:
  type: handlebars
  template: |
    # {{concern}} Alert

    File: {{filePath}}

    ```diff
    {{diffText}}
    ```
````

---

## Notify Channels

Dictionary of channel type to target:

```yaml
notify:
  slack: '#channel-name'
  github: '@team-name'
  email: 'team@company.com'
  webhook: 'https://hooks.example.com/notify'
  jira: 'PROJECT-123'
```

Each channel type has its own target format. Extensible by adding new channel handlers.

---

## Terminology Mapping

| Old (tiltshift) | New (distill) | Notes                       |
| --------------- | ------------- | --------------------------- |
| Subject         | **Concern**   | Area of governance          |
| Projection      | **Signal**    | Complete detection unit     |
| Focus           | **Watch**     | File pattern + extraction   |
| Viewer          | **Report**    | Output formatting           |
| Stakeholder     | **Notify**    | Channel → target dictionary |

---

## CLI Examples

```bash
# Analyze current changes
distill diff

# Analyze staged changes
distill diff --staged

# Compare commits
distill diff HEAD~1 HEAD

# Analyze a PR
distill pr 123

# JSON output for CI
distill diff --json
```

---

## Implementation Tasks

1. **Rename config file**: `tiltshift.yml` → `distill.yml`
2. **Rename schema**: `tiltshift-schema.json` → `distill-schema.json`
3. **Update types in `config.ts`**:
   - `Subject` → `Concern`
   - `Projection` → `Signal`
   - `FocusConfig` → `WatchConfig`
   - Add `include` to watch configs
   - `Viewer` → `Report` (with `type` field)
   - Stakeholder embedded in notify dictionary
4. **Update processing pipeline**:
   - `processProjection` → `processSignal`
   - Handle array `include` patterns
5. **Update package.json**: name back to `@distill/cli`
6. **Regenerate schema**: `npm run generate-schema`
7. **Update tests and fixtures**

---

## Approved By

- [x] Founder (final decision)
- [x] Ruthless PM Agent (endorsed simplification)
- [x] Principal Engineer Agent (endorsed 3-concept model)
- [x] Performance Monarch Agent (endorsed architectural simplification)
- [x] Claude

**Decision Date**: 2026-01-10
**Status**: Ready for implementation
