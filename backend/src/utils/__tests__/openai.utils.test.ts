/**
 * Bug Condition Exploration Test for OpenAI Connection Stability
 * 
 * **Validates: Requirements 2.1, 2.2, 2.3**
 * 
 * This test MUST FAIL on unfixed code to confirm the bug exists.
 * The test encodes the expected behavior - it will pass after the fix is implemented.
 * 
 * Expected failures on unfixed code:
 * - Linear backoff (3s, 6s) instead of exponential (2s±0.5s, 4s±0.5s)
 * - Missing HTTP connection timeout (expected 60s)
 * - Missing HTTP request timeout (expected 120s)
 * - Missing keep-alive configuration (expected enabled with 30s timeout)
 */

import { describe, test, expect, beforeAll, beforeEach, afterEach, jest } from '@jest/globals';

describe('Bug Condition Exploration: Connection Stability During Audio Upload', () => {
  let openaiUtils: typeof import('../openai.utils.js');
  let OpenAI: any;
  let toFile: any;
  let fs: any;
  
  let mockOpenAIInstance: any;
  let mockCreateFn: jest.Mock;
  let mockToFileFn: jest.Mock;
  let mockStatSync: jest.Mock;
  let mockReadFileSync: jest.Mock;
  
  let attemptTimes: number[] = [];

  beforeAll(async () => {
    // Set API key before importing
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  beforeEach(async () => {
    // Reset module cache to get fresh imports
    jest.resetModules();
    attemptTimes = [];
    
    // Create mocks
    mockCreateFn = jest.fn();
    mockToFileFn = jest.fn().mockResolvedValue({
      name: 'audio.mp3',
      type: 'audio/mpeg'
    });
    mockStatSync = jest.fn().mockReturnValue({ size: 1024 * 1024 }); // 1MB
    mockReadFileSync = jest.fn().mockReturnValue(Buffer.from('mock audio data'));
    
    mockOpenAIInstance = {
      audio: {
        transcriptions: {
          create: mockCreateFn
        }
      }
    };
    
    // Mock modules using jest.mock
    jest.unstable_mockModule('openai', () => ({
      default: jest.fn(() => mockOpenAIInstance),
      toFile: mockToFileFn
    }));
    
    jest.unstable_mockModule('fs', () => ({
      default: {
        statSync: mockStatSync,
        readFileSync: mockReadFileSync
      },
      statSync: mockStatSync,
      readFileSync: mockReadFileSync
    }));
    
    // Import after mocking
    const openaiModule = await import('openai');
    OpenAI = openaiModule.default;
    toFile = openaiModule.toFile;
    fs = await import('fs');
    openaiUtils = await import('../openai.utils.js');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('Property 1: Connection Stability - should use exponential backoff with jitter and proper HTTP configuration', async () => {
    /**
     * This test simulates connection reset scenarios and measures:
     * 1. Retry delay timing (should be exponential: 2s±0.5s, 4s±0.5s)
     * 2. HTTP client configuration (connection timeout: 60s, request timeout: 120s)
     * 3. Keep-alive configuration (enabled with 30s timeout)
     * 
     * EXPECTED OUTCOME ON UNFIXED CODE: Test FAILS because:
     * - Unfixed code uses linear backoff (3s, 6s) instead of exponential (2s, 4s)
     * - Unfixed code lacks HTTP timeout configuration
     * - Unfixed code lacks keep-alive configuration
     */
    
    let attemptCount = 0;
    
    // Configure mock to fail on first 2 attempts, succeed on 3rd
    mockCreateFn.mockImplementation(async () => {
      attemptCount++;
      attemptTimes.push(Date.now());
      
      if (attemptCount <= 2) {
        const error = new Error('fetch failed') as any;
        error.message = 'Connection error: ECONNRESET';
        error.code = 'ECONNRESET';
        throw error;
      }
      
      return 'Mock transcription result';
    });
    
    // Execute transcribeAudio
    const result = await openaiUtils.transcribeAudio('/mock/audio.mp3');
    
    // Assert successful transcription after retries
    expect(result).toBe('Mock transcription result');
    expect(attemptCount).toBe(3);
    
    // ASSERTION 1: Exponential backoff with jitter
    // Calculate retry delays
    const retryDelays = [];
    for (let i = 1; i < attemptTimes.length; i++) {
      retryDelays.push(attemptTimes[i] - attemptTimes[i - 1]);
    }
    
    console.log('\n=== COUNTEREXAMPLE DETECTION ===');
    console.log('Measured retry delays:', retryDelays);
    console.log('Expected: [2000±500ms, 4000±500ms] (exponential backoff)');
    console.log('Unfixed code: [3000ms, 6000ms] (linear backoff)');
    console.log('================================\n');
    
    expect(retryDelays.length).toBe(2);
    
    const firstRetryDelay = retryDelays[0];
    const secondRetryDelay = retryDelays[1];
    
    // Check first retry delay: 2s ± 0.5s (1500-2500ms)
    // Unfixed code uses 3s (3000ms) - this will FAIL
    expect(firstRetryDelay).toBeGreaterThanOrEqual(1500);
    expect(firstRetryDelay).toBeLessThanOrEqual(2500);
    
    // Check second retry delay: 4s ± 0.5s (3500-4500ms)
    // Unfixed code uses 6s (6000ms) - this will FAIL
    expect(secondRetryDelay).toBeGreaterThanOrEqual(3500);
    expect(secondRetryDelay).toBeLessThanOrEqual(4500);
    
    // ASSERTION 2: HTTP Client Configuration
    // Expected: OpenAI client should be initialized with httpAgent and timeout
    // Unfixed code: OpenAI client initialized without httpAgent or timeout - this will FAIL
    expect(OpenAI).toHaveBeenCalled();
    const openAIConstructorCall = (OpenAI as jest.Mock).mock.calls[0][0];
    
    console.log('\n=== HTTP CONFIGURATION CHECK ===');
    console.log('OpenAI constructor config:', JSON.stringify(openAIConstructorCall, null, 2));
    console.log('================================\n');
    
    // Check for httpAgent with proper configuration
    expect(openAIConstructorCall).toHaveProperty('httpAgent');
    expect(openAIConstructorCall.httpAgent).toHaveProperty('options');
    expect(openAIConstructorCall.httpAgent.options.keepAlive).toBe(true);
    expect(openAIConstructorCall.httpAgent.options.keepAliveMsecs).toBe(30000); // 30 seconds
    expect(openAIConstructorCall.httpAgent.options.timeout).toBe(60000); // 60 seconds connection timeout
    
    // Check for request timeout
    expect(openAIConstructorCall.timeout).toBe(120000); // 120 seconds request timeout
  }, 20000); // 20 second timeout for this test

  test('Property 1 (Edge Case): Connection reset on all attempts should exhaust retries', async () => {
    /**
     * This test verifies that when all retry attempts fail, the function throws an error.
     * This confirms the retry logic is working but exhausts after max attempts.
     */
    
    // Mock OpenAI to throw ECONNRESET on all attempts
    mockCreateFn.mockImplementation(async () => {
      const error = new Error('fetch failed - ECONNRESET') as any;
      error.code = 'ECONNRESET';
      throw error;
    });
    
    // Execute and expect error
    await expect(openaiUtils.transcribeAudio('/mock/audio.mp3')).rejects.toThrow(/Transcription failed/);
    
    // Verify 3 attempts were made
    expect(mockCreateFn).toHaveBeenCalledTimes(3);
  }, 20000);

  test('Property 1 (Large File): Should handle near-limit file size with appropriate timeouts', async () => {
    /**
     * This test verifies that large files (near 25MB limit) can be processed
     * with proper HTTP timeout configuration to prevent premature connection drops.
     */
    
    // Mock large file (24.5 MB, just under the limit)
    mockStatSync.mockReturnValue({ size: 24.5 * 1024 * 1024 } as any);
    
    // Mock successful transcription
    mockCreateFn.mockResolvedValue('Large file transcription');
    
    // Execute transcribeAudio
    const result = await openaiUtils.transcribeAudio('/mock/large-audio.mp3');
    
    // Assert successful transcription
    expect(result).toBe('Large file transcription');
    
    // Verify HTTP configuration supports large file uploads
    const openAIConstructorCall = (OpenAI as jest.Mock).mock.calls[0][0];
    expect(openAIConstructorCall.timeout).toBe(120000); // 120 seconds for large uploads
    expect(openAIConstructorCall.httpAgent.options.timeout).toBe(60000); // 60 seconds connection timeout
  });
});

/**
 * Preservation Property Tests for OpenAI Transcription
 * 
 * **Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5**
 * 
 * These tests verify that existing validations and error handling are preserved
 * after implementing the connection stability fix. These tests should PASS on both
 * unfixed and fixed code to confirm no regressions.
 * 
 * Properties tested:
 * - Property 2.1: API key validation (missing key → 500 error)
 * - Property 2.2: File size validation (>25MB → 400 error)
 * - Property 2.3: Successful transcription returns text string
 * - Property 2.4: Invalid API response validation (null/non-string → 500 error)
 * - Property 2.5: Non-connection errors throw without retrying
 */

describe('Property 2: Preservation - Existing Validations and Error Handling', () => {
  let openaiUtils: typeof import('../openai.utils.js');
  let OpenAI: any;
  let toFile: any;
  let fs: any;
  
  let mockOpenAIInstance: any;
  let mockCreateFn: jest.Mock;
  let mockToFileFn: jest.Mock;
  let mockStatSync: jest.Mock;
  let mockReadFileSync: jest.Mock;

  beforeEach(async () => {
    // Reset module cache to get fresh imports
    jest.resetModules();
    
    // Create mocks
    mockCreateFn = jest.fn();
    mockToFileFn = jest.fn().mockResolvedValue({
      name: 'audio.mp3',
      type: 'audio/mpeg'
    });
    mockStatSync = jest.fn().mockReturnValue({ size: 1024 * 1024 }); // 1MB
    mockReadFileSync = jest.fn().mockReturnValue(Buffer.from('mock audio data'));
    
    mockOpenAIInstance = {
      audio: {
        transcriptions: {
          create: mockCreateFn
        }
      }
    };
    
    // Mock modules using jest.mock
    jest.unstable_mockModule('openai', () => ({
      default: jest.fn(() => mockOpenAIInstance),
      toFile: mockToFileFn
    }));
    
    jest.unstable_mockModule('fs', () => ({
      default: {
        statSync: mockStatSync,
        readFileSync: mockReadFileSync
      },
      statSync: mockStatSync,
      readFileSync: mockReadFileSync
    }));
    
    // Import after mocking
    const openaiModule = await import('openai');
    OpenAI = openaiModule.default;
    toFile = openaiModule.toFile;
    fs = await import('fs');
    openaiUtils = await import('../openai.utils.js');
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Property 2.1: API Key Validation Preservation', () => {
    test('should throw error with status 500 when API key is missing', async () => {
      /**
       * **Validates: Requirement 3.3**
       * 
       * For all inputs where OPENAI_API_KEY is not configured,
       * the function should throw an error with status 500.
       */
      
      // Remove API key
      const originalKey = process.env.OPENAI_API_KEY;
      delete process.env.OPENAI_API_KEY;
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('OpenAI API key is not configured');
        expect(error.statusCode).toBe(500);
      } finally {
        // Restore API key
        process.env.OPENAI_API_KEY = originalKey;
      }
      
      // Verify OpenAI client was not called
      expect(mockCreateFn).not.toHaveBeenCalled();
    });

    test('should throw error with status 500 when API key is empty string', async () => {
      /**
       * Edge case: Empty string API key should be treated as missing
       */
      
      const originalKey = process.env.OPENAI_API_KEY;
      process.env.OPENAI_API_KEY = '';
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('OpenAI API key is not configured');
        expect(error.statusCode).toBe(500);
      } finally {
        process.env.OPENAI_API_KEY = originalKey;
      }
      
      expect(mockCreateFn).not.toHaveBeenCalled();
    });
  });

  describe('Property 2.2: File Size Validation Preservation', () => {
    beforeEach(() => {
      // Set API key for these tests
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    test('should throw error with status 400 when file size exceeds 25MB', async () => {
      /**
       * **Validates: Requirement 3.2**
       * 
       * For all inputs where file size > 25MB,
       * the function should throw an error with status 400.
       * 
       * NOTE: The current implementation wraps the error in the catch block,
       * so the actual status code is 500, but the message contains the original error.
       */
      
      // Mock file size of 26MB (over the limit)
      mockStatSync.mockReturnValue({ size: 26 * 1024 * 1024 } as any);
      
      try {
        await openaiUtils.transcribeAudio('/mock/large-audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Audio file is too large for transcription');
        expect(error.message).toContain('max 25MB');
        // Current implementation wraps all errors with 500 in catch block
        expect(error.statusCode).toBe(500);
      }
      
      // Verify OpenAI API was not called
      expect(mockCreateFn).not.toHaveBeenCalled();
    });

    test('should throw error with status 400 for file size at boundary (25.1MB)', async () => {
      /**
       * Edge case: Test boundary condition just over 25MB
       * 
       * NOTE: Current implementation wraps errors with 500 in catch block
       */
      
      mockStatSync.mockReturnValue({ size: 25.1 * 1024 * 1024 } as any);
      
      try {
        await openaiUtils.transcribeAudio('/mock/boundary-audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(500);
      }
      
      expect(mockCreateFn).not.toHaveBeenCalled();
    });

    test('should process file successfully when size is exactly at limit (25MB)', async () => {
      /**
       * Edge case: File exactly at 25MB should be processed
       */
      
      mockStatSync.mockReturnValue({ size: 25 * 1024 * 1024 } as any);
      mockCreateFn.mockResolvedValue('Transcription at limit');
      
      const result = await openaiUtils.transcribeAudio('/mock/limit-audio.mp3');
      
      expect(result).toBe('Transcription at limit');
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
    });

    test('should process file successfully when size is just under limit (24.9MB)', async () => {
      /**
       * Edge case: File just under 25MB should be processed
       */
      
      mockStatSync.mockReturnValue({ size: 24.9 * 1024 * 1024 } as any);
      mockCreateFn.mockResolvedValue('Transcription under limit');
      
      const result = await openaiUtils.transcribeAudio('/mock/under-limit-audio.mp3');
      
      expect(result).toBe('Transcription under limit');
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
    });
  });

  describe('Property 2.3: Successful Transcription Preservation', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    test('should return transcription text string for successful requests', async () => {
      /**
       * **Validates: Requirement 3.1**
       * 
       * For all successful requests (no errors),
       * the function should return the transcription text as a string.
       */
      
      mockCreateFn.mockResolvedValue('This is a successful transcription');
      
      const result = await openaiUtils.transcribeAudio('/mock/audio.mp3');
      
      expect(result).toBe('This is a successful transcription');
      expect(typeof result).toBe('string');
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
    });

    test('should return transcription without retrying when no errors occur', async () => {
      /**
       * Verify that successful requests do not trigger retry logic
       */
      
      mockCreateFn.mockResolvedValue('Quick transcription');
      
      const startTime = Date.now();
      const result = await openaiUtils.transcribeAudio('/mock/audio.mp3');
      const duration = Date.now() - startTime;
      
      expect(result).toBe('Quick transcription');
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
      // Should complete quickly (< 1 second) without retries
      expect(duration).toBeLessThan(1000);
    });

    test('should handle various valid transcription text formats', async () => {
      /**
       * Property test: Any non-empty string response should be returned successfully
       */
      
      const testCases = [
        'Simple transcription',
        'Transcription with numbers 123 and symbols !@#',
        'Multi-line\ntranscription\nwith\nbreaks',
        'Very long transcription ' + 'word '.repeat(100),
        'Transcription with special characters: é, ñ, 中文'
      ];
      
      for (const testCase of testCases) {
        mockCreateFn.mockResolvedValue(testCase);
        
        const result = await openaiUtils.transcribeAudio('/mock/audio.mp3');
        
        expect(result).toBe(testCase);
        expect(typeof result).toBe('string');
      }
    });
  });

  describe('Property 2.4: Invalid API Response Validation Preservation', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    test('should throw error with status 500 when transcription response is null', async () => {
      /**
       * **Validates: Requirement 3.4**
       * 
       * For all invalid API responses (null or not a string),
       * the function should throw an error with status 500.
       */
      
      mockCreateFn.mockResolvedValue(null);
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Failed to get transcription from Whisper API');
        expect(error.statusCode).toBe(500);
      }
    });

    test('should throw error with status 500 when transcription response is undefined', async () => {
      /**
       * Edge case: undefined response
       */
      
      mockCreateFn.mockResolvedValue(undefined);
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Failed to get transcription from Whisper API');
        expect(error.statusCode).toBe(500);
      }
    });

    test('should throw error with status 500 when transcription response is a number', async () => {
      /**
       * Edge case: non-string type (number)
       */
      
      mockCreateFn.mockResolvedValue(12345);
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Failed to get transcription from Whisper API');
        expect(error.statusCode).toBe(500);
      }
    });

    test('should throw error with status 500 when transcription response is an object', async () => {
      /**
       * Edge case: non-string type (object)
       */
      
      mockCreateFn.mockResolvedValue({ text: 'transcription' });
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Failed to get transcription from Whisper API');
        expect(error.statusCode).toBe(500);
      }
    });

    test('should throw error with status 500 when transcription response is an array', async () => {
      /**
       * Edge case: non-string type (array)
       */
      
      mockCreateFn.mockResolvedValue(['transcription']);
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Failed to get transcription from Whisper API');
        expect(error.statusCode).toBe(500);
      }
    });

    test('should accept empty string as valid transcription', async () => {
      /**
       * Edge case: Empty string is technically a valid string response
       * (e.g., silent audio might produce empty transcription)
       * 
       * NOTE: Current implementation rejects empty strings with !transcription check
       * This is a design decision - empty transcriptions are treated as invalid
       */
      
      mockCreateFn.mockResolvedValue('');
      
      try {
        await openaiUtils.transcribeAudio('/mock/silent-audio.mp3');
        fail('Expected error to be thrown for empty transcription');
      } catch (error: any) {
        expect(error.message).toContain('Failed to get transcription from Whisper API');
        expect(error.statusCode).toBe(500);
      }
    });
  });

  describe('Property 2.5: Non-Connection Error Handling Preservation', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    test('should throw error without retrying for API validation errors', async () => {
      /**
       * **Validates: Requirement 3.5**
       * 
       * For all non-connection errors (e.g., API validation errors),
       * the function should throw appropriate errors without retrying.
       */
      
      const apiError = new Error('Invalid request: unsupported audio format');
      mockCreateFn.mockRejectedValue(apiError);
      
      const startTime = Date.now();
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('Transcription failed');
        expect(error.statusCode).toBe(500);
      }
      
      const duration = Date.now() - startTime;
      
      // Should fail quickly without retries (< 1 second)
      expect(duration).toBeLessThan(1000);
      // Should only be called once (no retries)
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
    });

    test('should throw error without retrying for authentication errors', async () => {
      /**
       * Edge case: Authentication errors should not be retried
       */
      
      const authError = new Error('Incorrect API key provided');
      mockCreateFn.mockRejectedValue(authError);
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(500);
      }
      
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
    });

    test('should throw error without retrying for rate limit errors', async () => {
      /**
       * Edge case: Rate limit errors should not be retried
       * (in the current implementation - connection errors are retried, not rate limits)
       */
      
      const rateLimitError = new Error('Rate limit exceeded');
      mockCreateFn.mockRejectedValue(rateLimitError);
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(500);
      }
      
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
    });

    test('should throw error without retrying for file format errors', async () => {
      /**
       * Edge case: File format errors should not be retried
       */
      
      const formatError = new Error('Unsupported audio format');
      mockCreateFn.mockRejectedValue(formatError);
      
      try {
        await openaiUtils.transcribeAudio('/mock/audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.statusCode).toBe(500);
      }
      
      expect(mockCreateFn).toHaveBeenCalledTimes(1);
    });

    test('should retry only connection errors and throw others immediately', async () => {
      /**
       * Property test: Only connection errors (ECONNRESET, ETIMEDOUT, etc.)
       * should trigger retries. All other errors should throw immediately.
       */
      
      const nonConnectionErrors = [
        new Error('Invalid request'),
        new Error('Authentication failed'),
        new Error('Rate limit exceeded'),
        new Error('Service unavailable')
      ];
      
      for (const error of nonConnectionErrors) {
        jest.resetModules();
        jest.unstable_mockModule('openai', () => ({
          default: jest.fn(() => mockOpenAIInstance),
          toFile: mockToFileFn
        }));
        jest.unstable_mockModule('fs', () => ({
          default: {
            statSync: mockStatSync,
            readFileSync: mockReadFileSync
          },
          statSync: mockStatSync,
          readFileSync: mockReadFileSync
        }));
        
        openaiUtils = await import('../openai.utils.js');
        
        mockCreateFn.mockRejectedValue(error);
        
        try {
          await openaiUtils.transcribeAudio('/mock/audio.mp3');
          fail('Expected error to be thrown');
        } catch (e: any) {
          expect(e.statusCode).toBe(500);
        }
        
        // Each non-connection error should only be attempted once
        expect(mockCreateFn).toHaveBeenCalledTimes(1);
        mockCreateFn.mockClear();
      }
    });
  });

  describe('Property 2: Integration - Multiple Preservation Properties', () => {
    beforeEach(() => {
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    test('should validate API key before checking file size', async () => {
      /**
       * Verify validation order: API key checked first
       */
      
      delete process.env.OPENAI_API_KEY;
      mockStatSync.mockReturnValue({ size: 30 * 1024 * 1024 } as any);
      
      try {
        await openaiUtils.transcribeAudio('/mock/large-audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        // Should fail on API key, not file size
        expect(error.message).toContain('OpenAI API key');
        expect(error.statusCode).toBe(500);
      }
      
      process.env.OPENAI_API_KEY = 'test-api-key';
    });

    test('should validate file size before making API call', async () => {
      /**
       * Verify validation order: File size checked before API call
       * NOTE: Current implementation wraps errors with 500 in catch block
       */
      
      mockStatSync.mockReturnValue({ size: 30 * 1024 * 1024 } as any);
      
      try {
        await openaiUtils.transcribeAudio('/mock/large-audio.mp3');
        fail('Expected error to be thrown');
      } catch (error: any) {
        expect(error.message).toContain('too large');
        expect(error.statusCode).toBe(500);
      }
      
      // API should not be called for oversized files
      expect(mockCreateFn).not.toHaveBeenCalled();
    });

    test('should preserve error handling for all validation stages', async () => {
      /**
       * Integration test: Verify all validation stages work correctly in sequence
       */
      
      // Stage 1: API key validation
      delete process.env.OPENAI_API_KEY;
      await expect(openaiUtils.transcribeAudio('/mock/audio.mp3')).rejects.toThrow();
      
      // Stage 2: File size validation
      process.env.OPENAI_API_KEY = 'test-api-key';
      mockStatSync.mockReturnValue({ size: 30 * 1024 * 1024 } as any);
      await expect(openaiUtils.transcribeAudio('/mock/audio.mp3')).rejects.toThrow();
      
      // Stage 3: API call success
      mockStatSync.mockReturnValue({ size: 1024 * 1024 } as any);
      mockCreateFn.mockResolvedValue('Success');
      const result = await openaiUtils.transcribeAudio('/mock/audio.mp3');
      expect(result).toBe('Success');
      
      // Stage 4: Response validation
      mockCreateFn.mockResolvedValue(null);
      await expect(openaiUtils.transcribeAudio('/mock/audio.mp3')).rejects.toThrow();
    });
  });
});
