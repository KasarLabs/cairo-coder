// import { WebSocket } from 'ws';
// import { handleMessage } from './messageHandler';
// import type { IncomingMessage } from 'http';
// import logger from '../utils/logger';
// import { Container } from '../types/context';
// import { BaseChatModel } from '@langchain/core/language_models/chat_models';
// import { LLMConfig } from '@starknet-agent/agents/index';

// export const handleConnection = async (
//   ws: WebSocket,
//   request: IncomingMessage,
//   container: Container,
// ) => {
//   try {
//     const context = container.getContext();
//     const { defaultLLM, fastLLM, embeddings } = context.config.models;

//     if (!defaultLLM || !embeddings) {
//       logger.error('Invalid LLM or embeddings model configuration');
//       ws.send(
//         JSON.stringify({
//           type: 'error',
//           data: 'Invalid LLM or embeddings model configuration',
//           key: 'INVALID_MODEL_CONFIG',
//         }),
//       );
//       ws.close();
//       return;
//     }

//     const llmConfig: LLMConfig = {
//       defaultLLM,
//       fastLLM,
//     };

//     ws.on(
//       'message',
//       async (message) =>
//         await handleMessage(message.toString(), ws, llmConfig, embeddings),
//     );

//     ws.on('close', () => logger.debug('Connection closed'));
//   } catch (err) {
//     ws.send(
//       JSON.stringify({
//         type: 'error',
//         data: 'Internal server error.',
//         key: 'INTERNAL_SERVER_ERROR',
//       }),
//     );
//     ws.close();
//     logger.error(err);
//   }
// };
