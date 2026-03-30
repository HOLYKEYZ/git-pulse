import { configureToTestEnvironment } from '@vitest/plugin-jest';

export default configureToTestEnvironment({
  // Use jsdom environment for UI components
  testEnvironment: 'jsdom',
});import { defineConfig } from 'vitest'

defineConfig({
  testEnvironment: 'jsdom',
})