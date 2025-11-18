/**
 * Test setup file
 * Runs before all tests
 */

// Set test environment variables
process.env.DATABASE_URL = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test_db'
process.env.NODE_ENV = 'test'
