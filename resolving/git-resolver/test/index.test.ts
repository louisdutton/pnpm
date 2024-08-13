/// <reference path="../../../__typings__/index.d.ts"/>
import path from 'path'
import { createGitResolver } from '../src'
import isWindows from 'is-windows'
import { getCommitFromRef, git } from '../src/git'

const resolveFromGit = createGitResolver({})

test('with commit', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zkochan/is-negative#163360a8d3ae6bee9524541043197ff356f8ed99' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/163360a8d3ae6bee9524541043197ff356f8ed99',
    normalizedPref: 'github:zkochan/is-negative#163360a8d3ae6bee9524541043197ff356f8ed99',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/163360a8d3ae6bee9524541043197ff356f8ed99',
    },
    resolvedVia: 'git-repository',
  })
})

test('with no commit', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zkochan/is-negative' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/1d7e288222b53a0cab90a331f1865220ec29560c',
    normalizedPref: 'github:zkochan/is-negative',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/1d7e288222b53a0cab90a331f1865220ec29560c',
    },
    resolvedVia: 'git-repository',
  })
})

test('with no commit, when main branch is not master', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zoli-forks/cmd-shim' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zoli-forks/cmd-shim/tar.gz/a00a83a1593edb6e395d3ce41f2ef70edf7e2cf5',
    normalizedPref: 'github:zoli-forks/cmd-shim',
    resolution: {
      tarball: 'https://codeload.github.com/zoli-forks/cmd-shim/tar.gz/a00a83a1593edb6e395d3ce41f2ef70edf7e2cf5',
    },
    resolvedVia: 'git-repository',
  })
})

test('with partial commit', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zoli-forks/cmd-shim#a00a83a' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zoli-forks/cmd-shim/tar.gz/a00a83a',
    normalizedPref: 'github:zoli-forks/cmd-shim#a00a83a',
    resolution: {
      tarball: 'https://codeload.github.com/zoli-forks/cmd-shim/tar.gz/a00a83a',
    },
    resolvedVia: 'git-repository',
  })
})

test('with branch', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zkochan/is-negative#canary' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/4c39fbc124cd4944ee51cb082ad49320fab58121',
    normalizedPref: 'github:zkochan/is-negative#canary',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/4c39fbc124cd4944ee51cb082ad49320fab58121',
    },
    resolvedVia: 'git-repository',
  })
})

test('with branch relative to refs', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zkochan/is-negative#heads/canary' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/4c39fbc124cd4944ee51cb082ad49320fab58121',
    normalizedPref: 'github:zkochan/is-negative#heads/canary',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/4c39fbc124cd4944ee51cb082ad49320fab58121',
    },
    resolvedVia: 'git-repository',
  })
})

test('with tag', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zkochan/is-negative#2.0.1' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    normalizedPref: 'github:zkochan/is-negative#2.0.1',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    },
    resolvedVia: 'git-repository',
  })
})

test.skip('with tag (v-prefixed tag)', async () => {
  const resolveResult = await resolveFromGit({ pref: 'andreineculau/npm-publish-git#v0.0.7' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/andreineculau/npm-publish-git/tar.gz/a2f8d94562884e9529cb12c0818312ac87ab7f0b',
    normalizedPref: 'github:andreineculau/npm-publish-git#v0.0.7',
    resolution: {
      tarball: 'https://codeload.github.com/andreineculau/npm-publish-git/tar.gz/a2f8d94562884e9529cb12c0818312ac87ab7f0b',
    },
    resolvedVia: 'git-repository',
  })
})

test('with strict semver', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zkochan/is-negative#semver:1.0.0' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/163360a8d3ae6bee9524541043197ff356f8ed99',
    normalizedPref: 'github:zkochan/is-negative#semver:1.0.0',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/163360a8d3ae6bee9524541043197ff356f8ed99',
    },
    resolvedVia: 'git-repository',
  })
})

test.skip('with strict semver (v-prefixed tag)', async () => {
  const resolveResult = await resolveFromGit({ pref: 'andreineculau/npm-publish-git#semver:v0.0.7' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/andreineculau/npm-publish-git/tar.gz/a2f8d94562884e9529cb12c0818312ac87ab7f0b',
    normalizedPref: 'github:andreineculau/npm-publish-git#semver:v0.0.7',
    resolution: {
      tarball: 'https://codeload.github.com/andreineculau/npm-publish-git/tar.gz/a2f8d94562884e9529cb12c0818312ac87ab7f0b',
    },
    resolvedVia: 'git-repository',
  })
})

test('with range semver', async () => {
  const resolveResult = await resolveFromGit({ pref: 'zkochan/is-negative#semver:^1.0.0' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/9a89df745b2ec20ae7445d3d9853ceaeef5b0b72',
    normalizedPref: 'github:zkochan/is-negative#semver:^1.0.0',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/9a89df745b2ec20ae7445d3d9853ceaeef5b0b72',
    },
    resolvedVia: 'git-repository',
  })
})

test.skip('with range semver (v-prefixed tag)', async () => {
  const resolveResult = await resolveFromGit({ pref: 'andreineculau/npm-publish-git#semver:<=v0.0.7' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/andreineculau/npm-publish-git/tar.gz/a2f8d94562884e9529cb12c0818312ac87ab7f0b',
    normalizedPref: 'github:andreineculau/npm-publish-git#semver:<=v0.0.7',
    resolution: {
      tarball: 'https://codeload.github.com/andreineculau/npm-publish-git/tar.gz/a2f8d94562884e9529cb12c0818312ac87ab7f0b',
    },
    resolvedVia: 'git-repository',
  })
})

test('with sub folder', async () => {
  const resolveResult = await resolveFromGit({ pref: 'github:RexSkz/test-git-subfolder-fetch.git#path:/packages/simple-react-app' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/RexSkz/test-git-subfolder-fetch/tar.gz/2b42a57a945f19f8ffab8ecbd2021fdc2c58ee22#path:/packages/simple-react-app',
    normalizedPref: 'github:RexSkz/test-git-subfolder-fetch#path:/packages/simple-react-app',
    resolution: {
      tarball: 'https://codeload.github.com/RexSkz/test-git-subfolder-fetch/tar.gz/2b42a57a945f19f8ffab8ecbd2021fdc2c58ee22',
      path: '/packages/simple-react-app',
    },
    resolvedVia: 'git-repository',
  })
})

test('with both sub folder and branch', async () => {
  const resolveResult = await resolveFromGit({ pref: 'github:RexSkz/test-git-subfolder-fetch.git#beta&path:/packages/simple-react-app' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/RexSkz/test-git-subfolder-fetch/tar.gz/777e8a3e78cc89bbf41fb3fd9f6cf922d5463313#path:/packages/simple-react-app',
    normalizedPref: 'github:RexSkz/test-git-subfolder-fetch#beta&path:/packages/simple-react-app',
    resolution: {
      tarball: 'https://codeload.github.com/RexSkz/test-git-subfolder-fetch/tar.gz/777e8a3e78cc89bbf41fb3fd9f6cf922d5463313',
      path: '/packages/simple-react-app',
    },
    resolvedVia: 'git-repository',
  })
})

test('fails when ref not found', async () => {
  await expect(
    resolveFromGit({ pref: 'zkochan/is-negative#bad-ref' })
  ).rejects.toThrow(/Could not resolve bad-ref to a commit of (https|git):\/\/github.com\/zkochan\/is-negative.git./)
})

test('fails when semver ref not found', async () => {
  await expect(
    resolveFromGit({ pref: 'zkochan/is-negative#semver:^100.0.0' })
  ).rejects.toThrow(/Could not resolve \^100.0.0 to a commit of (https|git):\/\/github.com\/zkochan\/is-negative.git. Available versions are: 1.0.0, 1.0.1, 2.0.0, 2.0.1, 2.0.2, 2.1.0/)
})

test('with commit from non-github repo', async () => {
  // TODO: make it pass on Windows
  if (isWindows()) {
    return
  }
  const localPath = process.cwd()
  const resolveResult = await resolveFromGit({ pref: `git+file://${localPath}#988c61e11dc8d9ca0b5580cb15291951812549dc` })
  expect(resolveResult).toStrictEqual({
    id: `git+file://${localPath}#988c61e11dc8d9ca0b5580cb15291951812549dc`,
    normalizedPref: `git+file://${localPath}#988c61e11dc8d9ca0b5580cb15291951812549dc`,
    resolution: {
      commit: '988c61e11dc8d9ca0b5580cb15291951812549dc',
      repo: `file://${localPath}`,
      type: 'git',
    },
    resolvedVia: 'git-repository',
  })
})

// TODO: make it pass on CI servers
test.skip('with commit from non-github repo with no commit', async () => {
  const localPath = path.resolve('..', '..')
  const hash = git('rev-parse origin/master').trim()
  const resolveResult = await resolveFromGit({ pref: `git+file://${localPath}` })
  expect(resolveResult).toStrictEqual({
    id: `git+file://${localPath}#${hash}`,
    normalizedPref: `git+file://${localPath}`,
    resolution: {
      commit: hash,
      repo: `file://${localPath}`,
      type: 'git',
    },
    resolvedVia: 'git-repository',
  })
})

test('bitbucket with commit', async () => {
  // TODO: make it pass on Windows
  if (isWindows()) {
    return
  }
  const resolveResult = await resolveFromGit({ pref: 'bitbucket:pnpmjs/git-resolver#988c61e11dc8d9ca0b5580cb15291951812549dc' })
  expect(resolveResult).toStrictEqual({
    id: 'https://bitbucket.org/pnpmjs/git-resolver/get/988c61e11dc8d9ca0b5580cb15291951812549dc.tar.gz',
    normalizedPref: 'bitbucket:pnpmjs/git-resolver#988c61e11dc8d9ca0b5580cb15291951812549dc',
    resolution: {
      tarball: 'https://bitbucket.org/pnpmjs/git-resolver/get/988c61e11dc8d9ca0b5580cb15291951812549dc.tar.gz',
    },
    resolvedVia: 'git-repository',
  })
})

test('bitbucket with no commit', async () => {
  const resolveResult = await resolveFromGit({ pref: 'bitbucket:pnpmjs/git-resolver' })
  const hash = getCommitFromRef('https://bitbucket.org/pnpmjs/git-resolver.git', 'master')
  expect(resolveResult).toStrictEqual({
    id: `https://bitbucket.org/pnpmjs/git-resolver/get/${hash}.tar.gz`,
    normalizedPref: 'bitbucket:pnpmjs/git-resolver',
    resolution: {
      tarball: `https://bitbucket.org/pnpmjs/git-resolver/get/${hash}.tar.gz`,
    },
    resolvedVia: 'git-repository',
  })
})

test('bitbucket with branch', async () => {
  const resolveResult = await resolveFromGit({ pref: 'bitbucket:pnpmjs/git-resolver#master' })
  const hash = getCommitFromRef('https://bitbucket.org/pnpmjs/git-resolver.git', 'master')
  expect(resolveResult).toStrictEqual({
    id: `https://bitbucket.org/pnpmjs/git-resolver/get/${hash}.tar.gz`,
    normalizedPref: 'bitbucket:pnpmjs/git-resolver#master',
    resolution: {
      tarball: `https://bitbucket.org/pnpmjs/git-resolver/get/${hash}.tar.gz`,
    },
    resolvedVia: 'git-repository',
  })
})

test('bitbucket with tag', async () => {
  const resolveResult = await resolveFromGit({ pref: 'bitbucket:pnpmjs/git-resolver#0.3.4' })
  expect(resolveResult).toStrictEqual({
    id: 'https://bitbucket.org/pnpmjs/git-resolver/get/87cf6a67064d2ce56e8cd20624769a5512b83ff9.tar.gz',
    normalizedPref: 'bitbucket:pnpmjs/git-resolver#0.3.4',
    resolution: {
      tarball: 'https://bitbucket.org/pnpmjs/git-resolver/get/87cf6a67064d2ce56e8cd20624769a5512b83ff9.tar.gz',
    },
    resolvedVia: 'git-repository',
  })
})

test('gitlab with colon in the URL', async () => {
  const resolveResult = await resolveFromGit({
    pref: 'ssh://git@gitlab:pnpm/git-resolver#988c61e11dc8d9ca0b5580cb15291951812549dc',
  })
  expect(resolveResult).toStrictEqual({
    id: 'git+ssh://git@gitlab/pnpm/git-resolver#988c61e11dc8d9ca0b5580cb15291951812549dc',
    normalizedPref:
      'ssh://git@gitlab:pnpm/git-resolver#988c61e11dc8d9ca0b5580cb15291951812549dc',
    resolution: {
      commit: '988c61e11dc8d9ca0b5580cb15291951812549dc',
      repo: 'ssh://git@gitlab/pnpm/git-resolver',
      type: 'git',
    },
    resolvedVia: 'git-repository',
  })
})

test('gitlab with commit', async () => {
  const resolveResult = await resolveFromGit({
    pref: 'gitlab:pnpm/git-resolver#988c61e11dc8d9ca0b5580cb15291951812549dc',
  })
  expect(resolveResult).toStrictEqual({
    id: 'https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=988c61e11dc8d9ca0b5580cb15291951812549dc',
    normalizedPref:
      'gitlab:pnpm/git-resolver#988c61e11dc8d9ca0b5580cb15291951812549dc',
    resolution: {
      tarball:
        'https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=988c61e11dc8d9ca0b5580cb15291951812549dc',
    },
    resolvedVia: 'git-repository',
  })
})

test('gitlab with no commit', async () => {
  const resolveResult = await resolveFromGit({
    pref: 'gitlab:pnpm/git-resolver',
  })
  const hash = getCommitFromRef('https://gitlab.com/pnpm/git-resolver.git', 'master')
  expect(resolveResult).toStrictEqual({
    id: `https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=${hash}`,
    normalizedPref: 'gitlab:pnpm/git-resolver',
    resolution: {
      tarball: `https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=${hash}`,
    },
    resolvedVia: 'git-repository',
  })
})

test('gitlab with branch', async () => {
  const resolveResult = await resolveFromGit({
    pref: 'gitlab:pnpm/git-resolver#master',
  })
  const hash = getCommitFromRef('https://gitlab.com/pnpm/git-resolver.git', 'master')
  expect(resolveResult).toStrictEqual({
    id: `https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=${hash}`,
    normalizedPref: 'gitlab:pnpm/git-resolver#master',
    resolution: {
      tarball: `https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=${hash}`,
    },
    resolvedVia: 'git-repository',
  })
})

test('gitlab with tag', async () => {
  const resolveResult = await resolveFromGit({
    pref: 'gitlab:pnpm/git-resolver#0.3.4',
  })
  expect(resolveResult).toStrictEqual({
    id: 'https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=87cf6a67064d2ce56e8cd20624769a5512b83ff9',
    normalizedPref: 'gitlab:pnpm/git-resolver#0.3.4',
    resolution: {
      tarball:
        'https://gitlab.com/api/v4/projects/pnpm%2Fgit-resolver/repository/archive.tar.gz?sha=87cf6a67064d2ce56e8cd20624769a5512b83ff9',
    },
    resolvedVia: 'git-repository',
  })
})

test('normalizes full url', async () => {
  const resolveResult = await resolveFromGit({ pref: 'git+ssh://git@github.com:zkochan/is-negative.git#2.0.1' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    normalizedPref: 'github:zkochan/is-negative#2.0.1',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    },
    resolvedVia: 'git-repository',
  })
})

test('normalizes full url with port', async () => {
  const resolveResult = await resolveFromGit({ pref: 'git+ssh://git@github.com:22:zkochan/is-negative.git#2.0.1' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    normalizedPref: 'github:zkochan/is-negative#2.0.1',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    },
    resolvedVia: 'git-repository',
  })
})

test('normalizes full url (alternative form)', async () => {
  const resolveResult = await resolveFromGit({ pref: 'git+ssh://git@github.com/zkochan/is-negative.git#2.0.1' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    normalizedPref: 'github:zkochan/is-negative#2.0.1',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    },
    resolvedVia: 'git-repository',
  })
})

test('normalizes full url (alternative form 2)', async () => {
  const resolveResult = await resolveFromGit({ pref: 'https://github.com/zkochan/is-negative.git#2.0.1' })
  expect(resolveResult).toStrictEqual({
    id: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    normalizedPref: 'github:zkochan/is-negative#2.0.1',
    resolution: {
      tarball: 'https://codeload.github.com/zkochan/is-negative/tar.gz/2fa0531ab04e300a24ef4fd7fb3a280eccb7ccc5',
    },
    resolvedVia: 'git-repository',
  })
})
