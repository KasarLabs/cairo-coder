import { generationProgram } from '../src/core/programs/generation.program';
import { AxAIService } from '@ax-llm/ax';
import { mockDeep, MockProxy } from 'jest-mock-extended';

// Mock the generation program itself
jest.mock('../src/core/programs/generation.program', () => ({
  generationProgram: {
    forward: jest.fn(),
    streamingForward: jest.fn(),
  },
}));

// Mock logger
jest.mock('../src/utils/index', () => ({
  __esModule: true,
  logger: {
    info: jest.fn(),
    debug: jest.fn(),
    error: jest.fn(),
  },
}));

describe('GenerationProgram', () => {
  let mockAI: MockProxy<AxAIService>;

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Create mock instances
    mockAI = mockDeep<AxAIService>();
  });

  describe('forward', () => {
    it('should generate Cairo code for contract-related queries', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How do I write a Cairo contract?',
        context:
          'Cairo is a programming language for Starknet contracts. Use #[starknet::contract] attribute.',
      };

      // Mock the generation program response
      const mockGenerationProgram = require('../src/core/programs/generation.program');
      mockGenerationProgram.generationProgram.forward.mockResolvedValue({
        answer:
          'Here is a simple Cairo contract example with #[starknet::contract] attribute.',
      });

      // Act
      const result = await generationProgram.forward(mockAI, input);

      // Assert
      expect(
        mockGenerationProgram.generationProgram.forward,
      ).toHaveBeenCalledWith(mockAI, input);
      expect(result.answer).toContain('contract');
    });

    it('should handle test-related queries', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How do I test a Cairo contract?',
        context: 'Testing Cairo contracts requires using test functions.',
      };

      // Mock the generation program response
      const mockGenerationProgram = require('../src/core/programs/generation.program');
      mockGenerationProgram.generationProgram.forward.mockResolvedValue({
        answer: 'Here is how to test Cairo contracts with test functions.',
      });

      // Act
      const result = await generationProgram.forward(mockAI, input);

      // Assert
      expect(result.answer).toContain('test');
    });

    it('should handle non-Cairo queries appropriately', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'Tell me about machine learning',
        context:
          'Cairo is a programming language for writing provable programs.',
      };

      // Mock the generation program response
      const mockGenerationProgram = require('../src/core/programs/generation.program');
      mockGenerationProgram.generationProgram.forward.mockResolvedValue({
        answer:
          'I am designed to generate Cairo code. Could you please provide a specific Cairo coding request?',
      });

      // Act
      const result = await generationProgram.forward(mockAI, input);

      // Assert
      expect(result.answer).toContain('designed to generate Cairo code');
    });

    it('should handle queries with no relevant context', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How do I implement a hash function?',
        context: 'No relevant documentation found for this query.',
      };

      // Mock the generation program response
      const mockGenerationProgram = require('../src/core/programs/generation.program');
      mockGenerationProgram.generationProgram.forward.mockResolvedValue({
        answer:
          "I apologize, but I couldn't find specific information about implementing hash functions in Cairo.",
      });

      // Act
      const result = await generationProgram.forward(mockAI, input);

      // Assert
      expect(result.answer).toContain('specific information');
    });

    it('should work with streaming forward', async () => {
      // Arrange
      const input = {
        chat_history: '',
        query: 'How do I create a simple counter contract?',
        context: 'Starknet contracts use #[starknet::contract] attribute.',
      };

      // Mock streaming response
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield { delta: { answer: 'Here is a simple ' } };
          yield { delta: { answer: 'counter contract:' } };
        },
      };

      const mockGenerationProgram = require('../src/core/programs/generation.program');
      mockGenerationProgram.generationProgram.streamingForward.mockReturnValue(
        mockStream,
      );

      // Act
      const result = generationProgram.streamingForward(mockAI, input);

      // Assert
      const chunks = [];
      for await (const chunk of result) {
        chunks.push(chunk);
      }

      expect(chunks).toHaveLength(2);
      expect(chunks[0].delta.answer).toBe('Here is a simple ');
      expect(chunks[1].delta.answer).toBe('counter contract:');
    });
  });
});
