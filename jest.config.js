/* eslint-disable strict */
module.exports = {
  roots: ['<rootDir>/test'],
  testMatch: ['**/?*.test.(unit|system).+(ts|tsx)'],
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest'
  }
};
