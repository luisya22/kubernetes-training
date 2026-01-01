module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/__tests__/**/*.tsx', '**/?(*.)+(spec|test).ts', '**/?(*.)+(spec|test).tsx'],
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.test.{ts,tsx}'
  ],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react'
      }
    }]
  },
  transformIgnorePatterns: [
    'node_modules/(?!(@kubernetes|jsonpath-plus)/)',
  ],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': '<rootDir>/src/__mocks__/styleMock.js',
    '^react-syntax-highlighter$': '<rootDir>/src/__mocks__/react-syntax-highlighter.tsx',
    '^react-syntax-highlighter/(.*)$': '<rootDir>/src/__mocks__/react-syntax-highlighter.tsx',
    '^@kubernetes/client-node$': '<rootDir>/src/services/__mocks__/@kubernetes/client-node.ts'
  },
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
};
