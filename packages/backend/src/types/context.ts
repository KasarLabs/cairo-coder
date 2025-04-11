import { ModelConfig } from '../lib/modelProviderService';
import { Express } from 'express';
import { WebSocketServer } from 'ws';
import { ServerConfig } from '../config/server';

export interface ServerContext {
  config: ServerConfig;
  app?: Express;
  wss?: WebSocketServer;
}

export class Container {
  private static instance: Container;
  private context: ServerContext;

  private constructor() {
    this.context = {} as ServerContext;
  }

  public static getInstance(): Container {
    if (!Container.instance) {
      Container.instance = new Container();
    }
    return Container.instance;
  }

  public setContext(context: Partial<ServerContext>) {
    this.context = { ...this.context, ...context };
  }

  public getContext(): ServerContext {
    return this.context;
  }
}
