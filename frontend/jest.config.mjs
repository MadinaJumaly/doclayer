import nextJest from 'next/jest.js';

// next/jest reuses Next's compiler, so JSX and the "@/..." import alias work in tests.
const createJestConfig = nextJest({ dir: './' });

export default createJestConfig({
	testEnvironment: 'jsdom',
	setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
	moduleNameMapper: { '^@/(.*)$': '<rootDir>/src/$1' },
});
