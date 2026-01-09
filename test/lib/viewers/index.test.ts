import {expect} from 'chai'

import {FilterResult} from '../../../src/lib/focuses/types.js'
import {
  executeReportViewer,
  executeUpdateSubjectContextViewer,
  ReportViewer,
  UpdateSubjectContextViewer,
} from '../../../src/lib/viewers/index.js'

describe('Viewers', () => {
  describe('executeReportViewer', () => {
    it('populates metadata correctly', () => {
      const viewer: ReportViewer = {
        template: 'Found issue in {{filePath}}',
      }

      const filterResult: FilterResult = {
        diffText: 'some diff',
        left: {artifact: 'left'},
        right: {artifact: 'right'},
      }

      const context = {filePath: 'src/main.ts'}

      const output = executeReportViewer(viewer, filterResult, context)

      expect(output.content).to.equal('Found issue in src/main.ts')
      expect(output.metadata).to.deep.include({
        diffText: 'some diff',
        fileName: 'src/main.ts',
        message: 'Found issue in src/main.ts',
      })
    })

    it('extracts line range from diff', () => {
      const viewer: ReportViewer = {
        template: 'Issue',
      }

      const diffText = `--- a.ts
+++ b.ts
@@ -10,1 +20,5 @@
 context
+new line
 context`

      const filterResult: FilterResult = {
        diffText,
        left: {artifact: 'left'},
        lineRange: {end: 24, start: 20},
        right: {artifact: 'right'},
      }

      const context = {filePath: 'src/main.ts'}

      const output = executeReportViewer(viewer, filterResult, context)

      expect(output.metadata?.lineRange).to.deep.equal({
        end: 24,
        start: 20,
      })
    })
  })

  describe('executeUpdateSubjectContextViewer', () => {
    it('evaluates templates in values', () => {
      const viewer: UpdateSubjectContextViewer = {
        set: {
          flag: 'true',
          message: 'Found {{filePath}}',
        },
      }

      const filterResult: FilterResult = {
        diffText: 'diff',
        left: {artifact: 'left'},
        right: {artifact: 'right'},
      }

      const context = {filePath: 'src/config.ts'}

      const updates = executeUpdateSubjectContextViewer(viewer, filterResult, context)

      expect(updates).to.deep.equal({
        flag: 'true',
        message: 'Found src/config.ts',
      })
    })
  })
})
