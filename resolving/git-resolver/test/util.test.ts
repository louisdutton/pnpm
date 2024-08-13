import { AssertionError } from 'assert'
import { isSsh, retry, isSha } from '../src/util'

describe('retry()', () => {
  test('Throws if no retries are specified', () => {
    expect(() => retry(() => {
      throw new Error()
    }, 0)).toThrow(AssertionError)
  })

  test('Defaults number of retries to 1 if not provided', () => {
    const fn = jest.fn()
      .mockImplementationOnce(() => {
        throw new Error()
      })
      .mockReturnValueOnce('ok')
    expect(retry(fn)).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(2)
  })

  test('Throws if all retries are exhausted', () => {
    expect(() => retry(() => {
      throw new Error()
    }, 2)).toThrow(Error)
  })

  test.each([1, 2, 3])('Returns target value after exactly %s of 10 attempts', (attempt) => {
    let count = 0
    const fn = jest.fn(() => {
      if (count === attempt - 1) {
        return 'ok'
      } else {
        count++
        throw new Error()
      }
    })
    expect(retry(fn, 10)).toBe('ok')
    expect(fn).toHaveBeenCalledTimes(attempt)
  })
})

describe('isSsh()', () => {
  test.each([
    { input: 'git+ssh://test.com', output: true },
    { input: 'ssh://test.com', output: true },
    { input: 'git@test.com', output: true },
    { input: 'https://git@test.com', output: false },
    { input: 'git+ftp://test.com', output: false },
    { input: 'ss://test.com', output: false },
  ])('Returns $output for $input', ({ input, output }) => {
    expect(isSsh(input)).toBe(output)
  })
})

describe('isSha()', () => {
  test.each([
    // pass
    { name: '40-character alphanumeric', input: '0'.repeat(20) + 'a'.repeat(20), output: true },
    { name: '40-character alpha', input: 'a'.repeat(40), output: true },
    { name: '40-character numeric', input: '0'.repeat(40), output: true },
    { name: '7-character alphanumeric', input: 'a'.repeat(3) + '0'.repeat(4), output: true },
    { name: '7-character alpha', input: 'a'.repeat(7), output: true },
    { name: '7-character numeric', input: '0'.repeat(7), output: true },
    { name: 'between 7 and 40 characters', input: '0'.repeat(20), output: true },
    // fail
    { name: 'greater than 40 characters', input: '0'.repeat(41), output: false },
    { name: 'less than 7 characters', input: '0'.repeat(6), output: false },
    { name: 'at least 1 non-alphanumeric character', input: '0'.repeat(6) + '#', output: false },
  ])('Returns $output for $name', ({ input, output }) => {
    expect(isSha(input)).toBe(output)
  })
})
