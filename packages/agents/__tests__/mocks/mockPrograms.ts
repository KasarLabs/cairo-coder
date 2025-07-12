import { AxGen } from '@ax-llm/ax';

// Mock retrieval program
export const mockRetrievalProgram: AxGen<any, any> = {
  forward: jest.fn().mockResolvedValue({
    search_terms: ['test', 'mock'],
    resources: ['cairo_book'],
  }),
  streamingForward: jest.fn(),
  setExamples: jest.fn(),
} as any;

// Mock generation program
export const mockGenerationProgram: AxGen<any, any> = {
  forward: jest.fn().mockResolvedValue({
    answer: 'Test answer',
  }),
  streamingForward: jest.fn().mockImplementation(async function* () {
    yield { delta: { answer: 'Test ' } };
    yield { delta: { answer: 'answer' } };
  }),
  setExamples: jest.fn(),
} as any;
