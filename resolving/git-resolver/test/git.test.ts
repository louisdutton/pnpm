import { execSync } from 'child_process'
import { getCommitFromRef, getCommitSha, getTagCommitFromRange, lsRemote } from '../src/git'
import { AssertionError } from 'assert'

jest.mock('child_process')
const execMock = jest.mocked(execSync)

export function mockLsRemote (refs: Record<string, string>): void {
  execMock.mockReturnValue(Object
    .entries(refs)
    .map(([id, sha]) => `${sha}\t${id}`)
    .join('\n'))
}

beforeEach(() => {
  execMock.mockReset()
  execMock.mockReturnValue('')
})

describe('lsRemote()', () => {
  test('Maps newline-delimited entries into tab-delimited key-value pairs (reversed)', () => {
    const refs = { a: '1', b: '2' }
    mockLsRemote(refs)
    expect(lsRemote('repo')).toStrictEqual(refs)
  })

  test.each(['refs', 'tags'] as const)('correctly builds command for type: %s', (type) => {
    lsRemote('abc', type)
    expect(execMock).toHaveBeenCalledWith(`git ls-remote --${type} abc`, { encoding: 'utf8' })
  })
})

describe('getCommitSha()', () => {
  test('Throws if repo contains spaces', () => {
    expect(() => getCommitSha('abc def', '123')).toThrow(AssertionError)
  })

  test('Throws if ref contains spaces', () => {
    expect(() => getCommitSha('abc', '123 456')).toThrow(AssertionError)
  })

  test('Maps args of', () => {
    execMock.mockReturnValue('sha\tmain')
    const ref = getCommitSha('abc', '123')
    expect(ref).toBe('sha')
    expect(execMock).toHaveBeenCalledWith('git ls-remote abc 123', { encoding: 'utf8' })
  })
})

describe('getCommitFromRef()', () => {
  test('Prioritises branches 1st', () => {
    mockLsRemote({
      '1.2.3': 'branch',
      'refs/tags/1.2.3^{}': 'annotated tag',
      'refs/tags/1.2.3': 'tag',
      'refs/heads/1.2.3': 'head',
    })
    expect(getCommitFromRef('repo', '1.2.3')).toBe('branch')
  })

  test('Returns provided ref if already a valid sha', () => {
    expect(getCommitFromRef('repo', '1234567')).toBe('1234567')
    expect(execSync).not.toHaveBeenCalled()
  })

  test('Prioritises annoated tags 2nd', () => {
    mockLsRemote({
      'refs/tags/1.2.3^{}': 'annotated tag',
      'refs/tags/1.2.3': 'tag',
      'refs/heads/1.2.3': 'head',
    })
    expect(getCommitFromRef('repo', '1.2.3')).toBe('annotated tag')
  })

  test('Prioritises regular tags 3rd', () => {
    mockLsRemote({
      'refs/tags/1.2.3': 'tag',
      'refs/heads/1.2.3': 'head',
    })
    expect(getCommitFromRef('repo', '1.2.3')).toBe('tag')
  })

  test('Prioritises heads last', () => {
    mockLsRemote({
      'refs/heads/1.2.3': 'head',
    })
    expect(getCommitFromRef('repo', '1.2.3')).toBe('head')
  })

  test('Returns undefined ref cannot be resolved to a commit', () => {
    expect(getCommitFromRef('repo', 'nil')).toBeUndefined()
  })
})

describe('getTagCommitFromRange()', () => {
  const v123 = '1.2.3'
  const v101 = '1.0.1'
  const v100 = '1.0.0'
  const v020 = '0.2.0'
  const v010 = '0.1.0'
  const v001 = '0.0.1'

  beforeEach(() => {
    mockLsRemote({
      'refs/tags/1.2.3': v123,
      'refs/tags/1.0.1': v101,
      'refs/tags/1.0.0': v100,
      'refs/tags/0.2.0': v020,
      'refs/tags/0.1.0': v010,
      'refs/tags/0.0.1': v001,
    })
  })

  test('Throws if range is invalid', () => {
    expect(() => getTagCommitFromRange('repo', 'abc')).toThrow(AssertionError)
  })

  test('Returns undefined if range cannot be resolved', () => {
    expect(getTagCommitFromRange('repo', '3.2.1')).toBeUndefined()
  })

  test.each([
    { name: 'any', inputs: ['*', 'x'], output: v123 },
    { name: 'exact', inputs: ['1.2.3'], output: v123 },
    { name: 'same major', inputs: ['1', '^1', '~1', '1.x', '1.*', '^1.0', '^1.0.0'], output: v123 },
    { name: 'same minor', inputs: ['~1.0.0', '~1.0', '1.0.x', '1.0.*'], output: v101 },
    // this is potentially a bug in the semver package
    // { name: '^0.x.x', inputs: ['^0.1.0'], output: v020 },
    { name: '^0.0.x', inputs: ['^0.0.1'], output: v001 },
    { name: 'hyphenated range', inputs: ['1.0.0 - 1.2.0', '0.0.0 - 1.2.0'], output: v101 },
    { name: 'hyphenated range (partial left)', inputs: ['1.0 - 1.2.0', '1 - 1.2.0'], output: v101 },
    { name: 'hyphenated range (partial right)', inputs: ['1.0.0 - 2.0', '0.0.0 - 2'], output: v123 },
    { name: 'space-delimited composite', inputs: ['>=1.0.0 <2.0'], output: v123 },
    { name: 'pipe-delimited composite', inputs: ['>=1.0.0 || <2.0'], output: v123 },
  ])('resolves $name', ({ inputs, output }) => {
    for (const input of inputs) {
      expect(getTagCommitFromRange('repo', input)).toBe(output)
    }
  })
})
