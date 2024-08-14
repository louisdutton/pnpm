import { fetch } from '@pnpm/fetch'
import { execSync } from 'child_process'
import { createGitResolver } from '../src'

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
    const sha = '2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5'

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
    mockInaccessibleViaFetch()
    const sha = 'a'.repeat(40)
    mockExecSync.mockReturnValue(`${sha}\trefs/heads/master`)

    const resolveResult = await resolveFromGit({ pref: 'git+https://github.com/foo/bar.git' })
    expect(mockExecSync).toHaveBeenCalledWith('git+ssh://git@github.com/foo/bar.git')
    expect(resolveResult).toStrictEqual({
      id: 'git+ssh://git@github.com/foo/bar.git#0000000000000000000000000000000000000000',
      normalizedPref: 'github:foo/bar',
      resolution: {
        commit: '0000000000000000000000000000000000000000',
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
    mockExecSync.mockReturnValue(`${sha}\trefs/heads/master`)

    const resolveResult = await resolveFromGit({ pref: `git+https://${token}:x-oauth-basic@github.com/foo/bar.git` })
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining(`https://${token}:x-oauth-basic@github.com/foo/bar.git`))
    expect(resolveResult).toStrictEqual({
      id: `git+https://${sha}:x-oauth-basic@github.com/foo/bar.git#${sha}`,
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
    mockExecSync.mockReturnValue('\
ed3de20970d980cf21a07fd8b8732c70d5182303\trefs/tags/v0.0.38\n\
cba04669e621b85fbdb33371604de1a2898e68e9\trefs/tags/v0.0.39\
')

    const resolveResult = await resolveFromGit({ pref })
    expect(mockExecSync).toHaveBeenCalledWith(expect.stringContaining('ssh://git@example.com/org/repo.git'))
    expect(resolveResult).toStrictEqual({
      id: 'git+ssh://git@example.com/org/repo.git#cba04669e621b85fbdb33371604de1a2898e68e9',
      normalizedPref: 'git+ssh://git@example.com/org/repo.git#semver:~0.0.38',
      resolution: {
        commit: 'cba04669e621b85fbdb33371604de1a2898e68e9',
        repo: 'ssh://git@example.com/org/repo.git',
        type: 'git',
      },
      resolvedVia: 'git-repository',
    })
  })
})
