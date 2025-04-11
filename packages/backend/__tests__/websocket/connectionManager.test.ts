import { WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { mock, mockReset } from 'jest-mock-extended';
import { Container } from '../../src/types/context';
import { handleConnection } from '../../src/websocket/connectionManager';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { Embeddings } from '@langchain/core/embeddings';

// Mock the dependencies
jest.mock('../../src/websocket/messageHandler', () => ({
  handleMessage: jest.fn(),
}));

jest.mock('../../src/utils/logger', () => ({
  debug: jest.fn(),
  error: jest.fn(),
}));

describe('ConnectionManager', () => {
  const mockWs = mock<WebSocket>();
  const mockRequest = mock<IncomingMessage>();
  const mockContainer = mock<Container>();

  beforeEach(() => {
    mockReset(mockWs);
    mockReset(mockRequest);
    mockReset(mockContainer);

    // Set up the container with the necessary context
    mockContainer.getContext.mockReturnValue({
      config: {
        models: {
          defaultLLM: mock<BaseChatModel>(),
          embeddings: mock<Embeddings>(),
          fastLLM: mock<BaseChatModel>(),
        },
      },
    } as any);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set up message and close event listeners when connection is established', async () => {
    // Act
    await handleConnection(mockWs, mockRequest, mockContainer);

    // Assert
    expect(mockWs.on).toHaveBeenCalledTimes(2);
    expect(mockWs.on).toHaveBeenCalledWith('message', expect.any(Function));
    expect(mockWs.on).toHaveBeenCalledWith('close', expect.any(Function));
  });

  it('should close the connection if LLM or embeddings configuration is missing', async () => {
    // Arrange
    mockContainer.getContext.mockReturnValue({
      config: {
        models: {
          // Missing defaultLLM and embeddings
        },
      },
    } as any);

    // Act
    await handleConnection(mockWs, mockRequest, mockContainer);

    // Assert
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('Invalid LLM or embeddings model configuration'),
    );
    expect(mockWs.close).toHaveBeenCalled();
  });

  it('should handle errors and close the connection', async () => {
    // Arrange
    mockContainer.getContext.mockImplementation(() => {
      throw new Error('Test error');
    });

    // Act
    await handleConnection(mockWs, mockRequest, mockContainer);

    // Assert
    expect(mockWs.send).toHaveBeenCalledWith(
      expect.stringContaining('Internal server error'),
    );
    expect(mockWs.close).toHaveBeenCalled();
  });
});
