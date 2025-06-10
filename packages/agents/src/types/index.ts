import { BaseMessage } from '@langchain/core/messages';
import { Document } from '@langchain/core/documents';
import { VectorStore } from '../db/postgresVectorStore';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';

export type AvailableAgents = 'cairoCoder';

export interface LLMConfig {
  defaultLLM: BaseChatModel;
  fastLLM?: BaseChatModel;
}

export interface VectorStoreConfig {
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_ROOT_DB: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: string;
}

export interface Config {
  GENERAL: {
    PORT: number;
    SIMILARITY_MEASURE: string;
  };
  VECTOR_DB: VectorStoreConfig;
  API_KEYS: {
    OPENAI: string;
    GROQ: string;
    ANTHROPIC: string;
    DEEPSEEK: string;
    GEMINI: string;
  };
  HOSTED_MODE?: {
    DEFAULT_CHAT_PROVIDER: string;
    DEFAULT_CHAT_MODEL: string;
    DEFAULT_FAST_CHAT_PROVIDER: string;
    DEFAULT_FAST_CHAT_MODEL: string;
    DEFAULT_EMBEDDING_PROVIDER: string;
    DEFAULT_EMBEDDING_MODEL: string;
  };
  VERSIONS: {
    STARKNET_FOUNDRY: string;
    SCARB: string;
  };
}

export type RecursivePartial<T> = {
  [P in keyof T]?: RecursivePartial<T[P]>;
};

export interface AgentPrompts {
  searchRetrieverPrompt: string;
  searchResponsePrompt: string;
  noSourceFoundPrompt?: string;
}

export interface AgentConfig {
  name: string;
  prompts: AgentPrompts;
  vectorStore: VectorStore;
  preprocessDocs?: (docs: Document[]) => Promise<Document[]>;
}

export interface ProcessedQuery {
  original: string;
  transformed: string | string[]; // Single query or list of search terms
  isContractRelated?: boolean;
  isTestRelated?: boolean;
  resources?: DocumentSource[];
}

export interface RetrievedDocuments {
  documents: Document<BookChunk>[];
  processedQuery: ProcessedQuery;
}

export interface RagInput {
  query: string;
  chatHistory: BaseMessage[];
  sources: DocumentSource | DocumentSource[];
}

export interface StreamHandler {
  emitSources(docs: Document[]): void;
  emitResponse(chunk: BaseMessage): void;
  emitEnd(): void;
  emitError(error: string): void;
}

export interface RagSearchConfig extends AgentConfig {
  contractTemplate?: string;
  testTemplate?: string;
  maxSourceCount?: number;
  similarityThreshold?: number;
  sources?: DocumentSource | DocumentSource[];
}

export enum DocumentSource {
  CAIRO_BOOK = 'cairo_book',
  STARKNET_DOCS = 'starknet_docs',
  STARKNET_FOUNDRY = 'starknet_foundry',
  CAIRO_BY_EXAMPLE = 'cairo_by_example',
  OPENZEPPELIN_DOCS = 'openzeppelin_docs',
  CORELIB_DOCS = 'corelib_docs',
}

export type BookChunk = {
  name: string;
  title: string;
  chunkNumber: number;
  contentHash: string;
  uniqueId: string;
  sourceLink: string;
  source: DocumentSource;
};

export interface ParsedSection {
  title: string;
  content: string;
  anchor?: string; // Optional custom anchor
}

// Documentation Quality Testing Types
export interface DocTestSet {
  version: string;
  testCases: TestCase[]; // Collection of test cases
  metadata?: {
    // Optional metadata
    owner: string;
    repository: string;
    commitHash?: string;
  };
}

export interface TestCase {
  query: string; // User query to test
  expectedTopics: string[]; // Key topics that should be covered
  expectedContent?: string; // Free text area for detailed content expectations
  groundTruth?: string; // Optional reference answer
  type: 'factual' | 'procedural' | 'conceptual'; // Query type
  difficulty: 'basic' | 'intermediate' | 'advanced';
  tags: string[]; // Custom tags for categorization
}

export interface TestResults {
  focus: string;
  version: string;
  executedAt: Date;
  metrics: {
    overall: QualityMetrics;
    byType: Record<string, QualityMetrics>;
    byDifficulty: Record<string, QualityMetrics>;
    byTag?: Record<string, QualityMetrics>;
  };
  caseResults: TestCaseResult[];
}

export interface TestCaseResult {
  query: string;
  retrievedDocuments: Document<BookChunk>[];
  answer: string;
  metrics: TestCaseMetrics;
  recommendations?: string[];
}

export interface TestCaseMetrics {
  isAnswered: boolean; // Whether the question is answered
  notAnsweredReason?: string; // Explanation when question is not answered
  clarityScore: number; // 0-1 score of answer clarity
  sourceAlignment: number; // 0-1 score of alignment with retrieved context
  contentSatisfaction?: number; // 0-1 score of how well the answer satisfies expectedContent
  contentFeedback?: string; // Feedback on how well expectedContent criteria are met
}

export interface QualityMetrics {
  percentAnswered: number; // Percentage of questions answered
  avgClarityScore: number; // Average clarity score
  avgSourceAlignment: number; // Average source alignment score
  avgContentSatisfaction?: number; // Average content satisfaction score (when expectedContent is provided)
}

export interface QualityReport {
  results: TestResults;
  summary: string;
  recommendations: DocumentationRecommendation[];
}

export interface DocumentationRecommendation {
  type: 'content' | 'structure' | 'terminology' | 'examples';
  priority: 'high' | 'medium' | 'low';
  description: string;
  examples?: string[];
  affectedTopics: string[];
}
