import { Container, ServerContext } from '../../src/types/context';
import { Express } from 'express';
import { WebSocketServer } from 'ws';
import { ServerConfig } from '../../src/config/server';

describe('Container', () => {
  // Clear the Container instance before each test
  beforeEach(() => {
    // Access the private static instance property using type assertion
    (Container as any).instance = undefined;
  });

  it('should be a singleton', () => {
    // Get two instances and check they are the same object
    const instance1 = Container.getInstance();
    const instance2 = Container.getInstance();

    expect(instance1).toBe(instance2);
  });

  it('should set and get context', () => {
    // Arrange
    const container = Container.getInstance();
    const mockConfig: ServerConfig = {
      port: 3000,
      models: {
        defaultLLM: {} as any,
        fastLLM: {} as any,
        embeddings: {} as any,
      },
      cors: {
        origin: '*',
      },
    };

    const partialContext: Partial<ServerContext> = {
      config: mockConfig,
    };

    // Act
    container.setContext(partialContext);
    const context = container.getContext();

    // Assert
    expect(context.config).toBe(mockConfig);
  });

  it('should merge partial context with existing context', () => {
    // Arrange
    const container = Container.getInstance();
    const initialConfig: ServerConfig = {
      port: 3000,
      models: {
        defaultLLM: {} as any,
        fastLLM: {} as any,
        embeddings: {} as any,
      },
      cors: {
        origin: '*',
      },
    };

    // Set initial context
    container.setContext({ config: initialConfig });

    // Create mock Express app
    const mockApp = {} as Express;

    // Act - add app to context
    container.setContext({ app: mockApp });
    const context = container.getContext();

    // Assert - should have both config and app
    expect(context.config).toBe(initialConfig);
    expect(context.app).toBe(mockApp);
  });

  it('should initialize with empty context', () => {
    // Arrange & Act
    const container = Container.getInstance();
    const context = container.getContext();

    // Assert
    expect(context).toEqual({});
  });
});
