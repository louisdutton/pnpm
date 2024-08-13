import { fetch } from '@pnpm/fetch'
import { execSync } from 'child_process'
import { createGitResolver } from '../src'
import { mockLsRemote } from './git.test'

jest.mock('child_process', () => ({
  execSync: jest.fn(() => ''),
}))

const mockExecSync = jest.mocked(execSync)

function mockInaccessibleViaFetch (): void {
  jest.mocked(fetch).mockImplementation(async () => {
    throw new Error()
  })
}

function mockInaccessibleViaGit (): void {
  mockExecSync.mockImplementation(() => {
    throw new Error()
  })
}

const resolveFromGit = createGitResolver({})

describe('https', () => {
  test('with commit hash', async () => {
    mockInaccessibleViaFetch()
    mockInaccessibleViaGit()
    const sha = 'abc'

    const resolveResult = await resolveFromGit({ pref: `fake/private-repo#${sha}` })
    expect(resolveResult).toStrictEqual({
      id: `git+ssh://git@github.com/fake/private-repo.git#${sha}`,
      normalizedPref: `github:fake/private-repo#${sha}`,
      resolution: {
        commit: sha,
        repo: 'git+ssh://git@github.com/fake/private-repo.git',
        type: 'git',
      },
      resolvedVia: 'git-repository',
    })
  })

  test('https protocol without auth token', async () => {
    const sha = 'a'.repeat(40)
    mockInaccessibleViaFetch()
    mockLsRemote({ 'refs/heads/master': sha })

    const resolveResult = await resolveFromGit({ pref: 'git+https://github.com/foo/bar.git' })
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('git+ssh://git@github.com/foo/bar.git'), { encoding: 'utf8' })
    expect(resolveResult).toStrictEqual({
      id: `git+ssh://git@github.com/foo/bar.git#${sha}`,
      normalizedPref: 'github:foo/bar',
      resolution: {
        commit: sha,
        repo: 'git+ssh://git@github.com/foo/bar.git',
        type: 'git',
      },
      resolvedVia: 'git-repository',
    })
  })

  test('HTTPS protocol and an auth token', async () => {
    const sha = '0'.repeat(40)
    const token = 'abc'
    mockInaccessibleViaFetch()
    mockLsRemote({ 'refs/heads/master': sha })

    const resolveResult = await resolveFromGit({ pref: `git+https://${token}:x-oauth-basic@github.com/foo/bar.git` })
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`https://${token}:x-oauth-basic@github.com/foo/bar.git`), { encoding: 'utf8' })
    expect(resolveResult).toStrictEqual({
      id: `git+https://${token}:x-oauth-basic@github.com/foo/bar.git#${sha}`,
      normalizedPref: 'github:foo/bar',
      resolution: {
        commit: sha,
        repo: `https://${token}:x-oauth-basic@github.com/foo/bar.git`,
        type: 'git',
      },
      resolvedVia: 'git-repository',
    })
  })
})

describe('ssh', () => {
  test.each([
    ['range semver', 'git+ssh://git@example.com/org/repo.git#semver:~0.0.38'],
    ['range semver and SCP-like URL', 'git+ssh://git@example.com:org/repo.git#semver:~0.0.38'],
  ])('with %s', async (_, pref) => {
    const v0038 = 'a'
    const v0039 = 'b'

    mockLsRemote({
      'refs/tags/v0.0.38': v0038,
      'refs/tags/v0.0.39': v0039,
    })

    const resolveResult = await resolveFromGit({ pref })
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('ssh://git@example.com/org/repo.git'), { encoding: 'utf8' })
    expect(resolveResult).toStrictEqual({
      id: `git+ssh://git@example.com/org/repo.git#${v0039}`,
      normalizedPref: 'git+ssh://git@example.com/org/repo.git#semver:~0.0.38',
      resolution: {
        commit: v0039,
        repo: 'ssh://git@example.com/org/repo.git',
        type: 'git',
      },
      resolvedVia: 'git-repository',
    })
  })
})
