import { ServerContext } from '../types';

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
