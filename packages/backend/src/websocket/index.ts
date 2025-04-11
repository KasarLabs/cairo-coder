// import { Server } from 'http';
// import { WebSocketServer } from 'ws';
// import { handleConnection } from './connectionManager';
// import logger from '../utils/logger';
// import { Container } from '../types/context';

// export function initializeWebSocket(server: Server, container: Container) {
//   const context = container.getContext();
//   const wss: WebSocketServer = new WebSocketServer({ server });

//   wss.on('connection', (ws, request) =>
//     handleConnection(ws, request, container),
//   );

//   logger.info(`WebSocket server initialized on port ${context.config.port}`);

//   return wss;
// }
