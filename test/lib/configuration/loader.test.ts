import {expect} from 'chai'
import {dirname, resolve} from 'node:path'
import {fileURLToPath} from 'node:url'

import {Projection} from '../../../src/lib/configuration/config.js'
import {loadConfig} from '../../../src/lib/configuration/loader.js'

const __dirname = dirname(fileURLToPath(import.meta.url))

describe('configuration/loader', () => {
  it('loads a YAML config file', async () => {
    const configPath = resolve(__dirname, '../../fixtures/test-config.yml')
    const config = await loadConfig(configPath)

    expect(config).to.have.property('subjects')
    expect(config.subjects).to.be.an('object')
    expect(config.subjects['test-subject']).to.exist
  })

  it('parses nested projection structures', async () => {
    const configPath = resolve(__dirname, '../../fixtures/test-config.yml')
    const config = await loadConfig(configPath)

    const subject = config.subjects['test-subject']
    expect(subject.projections).to.be.an('array').with.lengthOf(1)

    // Cast to Projection since we know the test fixture uses inline projections
    const projection = subject.projections[0] as Projection
    expect(projection).to.have.property('include', 'package.json')
    expect(projection).to.have.property('focuses').that.is.an('array').with.lengthOf(1)
    expect(projection.focuses[0]).to.deep.include({query: '.dependencies', type: 'jq'})

    expect(projection).to.have.property('viewers').that.is.an('array').with.lengthOf(1)
    expect(projection.viewers[0]).to.have.property('template').that.includes('Test Report')
  })
})
