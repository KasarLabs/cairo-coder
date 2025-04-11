// import { EventEmitter, WebSocket } from 'ws';
// import { BaseMessage, AIMessage, HumanMessage } from '@langchain/core/messages';
// import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
// import type { Embeddings } from '@langchain/core/embeddings';
// import logger from '../utils/logger';
// import crypto from 'crypto';
// import {
//   VectorStoreConfig,
//   getVectorDbConfig,
// } from '@starknet-agent/agents/config';
// import { HandlerOptions, SearchHandler } from '../types/types';
// import {
//   LLMConfig,
//   VectorStore,
//   RagAgentFactory,
//   AvailableAgents,
// } from '@starknet-agent/agents/index';

// type Message = {
//   messageId: string;
//   chatId: string;
//   content: string;
// };

// export type WSMessage = {
//   message: Message;
//   copilot: boolean;
//   type: string;
//   focusMode: string;
//   history: Array<[string, string]>;
// };

// const searchDatabases: Record<string, () => VectorStoreConfig> = {
//   cairoBookSearch: getVectorDbConfig,
//   starknetDocsSearch: getVectorDbConfig,
//   starknetEcosystemSearch: getVectorDbConfig,
//   docChatMode: getVectorDbConfig,
//   succintCairoBookSearch: getVectorDbConfig, // TODO: legacy, remove after migration
//   starknetFoundrySearch: getVectorDbConfig,
//   cairoByExampleSearch: getVectorDbConfig,
//   openZeppelinDocsSearch: getVectorDbConfig,
// };

// const handleEmitterEvents = (
//   emitter: EventEmitter,
//   ws: WebSocket,
//   messageId: string,
//   chatId: string,
// ) => {
//   let recievedMessage = '';
//   let sources = [];

//   emitter.on('data', (data) => {
//     const parsedData = JSON.parse(data);
//     if (parsedData.type === 'response') {
//       ws.send(
//         JSON.stringify({
//           type: 'message',
//           data: parsedData.data,
//           messageId: messageId,
//         }),
//       );
//       recievedMessage += parsedData.data;
//     } else if (parsedData.type === 'sources') {
//       ws.send(
//         JSON.stringify({
//           type: 'sources',
//           data: parsedData.data,
//           messageId: messageId,
//         }),
//       );
//       sources = parsedData.data;
//     }
//   });
//   emitter.on('end', () => {
//     ws.send(JSON.stringify({ type: 'messageEnd', messageId: messageId }));
//   });
//   emitter.on('error', (data) => {
//     const parsedData = JSON.parse(data);
//     ws.send(
//       JSON.stringify({
//         type: 'error',
//         data: parsedData.data,
//         key: 'CHAIN_ERROR',
//       }),
//     );
//   });
// };

// // Remove the searchHandlers mapping and replace with a function that creates handlers on demand
// const getSearchHandler = (focusMode: string): SearchHandler => {
//   // Map focus modes to agent names
//   const agentMapping: Record<string, AvailableAgents> = {
//     // cairoBookSearch: 'cairoBook',
//     // docChatMode: 'docChatMode',
//     // succintCairoBookSearch: 'docChatMode', // TODO: legacy, remove after migration
//     // starknetDocsSearch: 'starknetDocs',
//     // starknetEcosystemSearch: 'starknetEcosystem',
//     // starknetFoundrySearch: 'starknetFoundry',
//     // cairoByExampleSearch: 'cairoByExample',
//     // openZeppelinDocsSearch: 'openZeppelinDocs',
//   };

//   const agentName = agentMapping[focusMode];
//   if (!agentName) {
//     throw new Error(`Invalid focus mode: ${focusMode}`);
//   }

//   return (
//     message: string,
//     history: BaseMessage[],
//     llm: LLMConfig,
//     embeddings: Embeddings,
//     options: HandlerOptions,
//   ) => {
//     if (!options.vectorStore) {
//       throw new Error('Vector store is required');
//     }
//     return RagAgentFactory.createAgent(
//       agentName,
//       message,
//       history,
//       llm,
//       embeddings,
//       options.vectorStore,
//     );
//   };
// };

// export const handleMessage = async (
//   message: string,
//   ws: WebSocket,
//   llmConfig: LLMConfig,
//   embeddings: Embeddings,
// ) => {
//   try {
//     const parsedWSMessage = JSON.parse(message) as WSMessage;
//     const parsedMessage = parsedWSMessage.message;

//     const id = crypto.randomBytes(7).toString('hex');

//     if (!parsedMessage.content)
//       return ws.send(
//         JSON.stringify({
//           type: 'error',
//           data: 'Invalid message format',
//           key: 'INVALID_FORMAT',
//         }),
//       );

//     const history: BaseMessage[] = parsedWSMessage.history.map((msg) => {
//       if (msg[0] === 'human') {
//         return new HumanMessage({
//           content: msg[1],
//         });
//       } else {
//         return new AIMessage({
//           content: msg[1],
//         });
//       }
//     });

//     if (parsedWSMessage.type === 'message') {
//       try {
//         const handler = getSearchHandler(parsedWSMessage.focusMode);
//         const dbConfigGetter = searchDatabases[parsedWSMessage.focusMode];

//         if (dbConfigGetter) {
//           const dbConfig = dbConfigGetter();
//           try {
//             const vectorStore = await VectorStore.getInstance(
//               dbConfig,
//               embeddings,
//             );
//             logger.info('VectorStore initialized successfully');
//             const emitter = handler(
//               parsedMessage.content,
//               history,
//               llmConfig,
//               embeddings,
//               { vectorStore },
//             );

//             handleEmitterEvents(emitter, ws, id, parsedMessage.chatId);
//           } catch (error) {
//             logger.error('Failed to initialize VectorStore:', error);
//             ws.send(
//               JSON.stringify({
//                 type: 'error',
//                 data: 'Failed to initialize VectorStore',
//                 key: 'VECTOR_STORE_ERROR',
//               }),
//             );
//             return; // Stop execution if there's an error
//           }
//         } else {
//           ws.send(
//             JSON.stringify({
//               type: 'error',
//               data: 'Invalid focus mode',
//               key: 'INVALID_FOCUS_MODE',
//             }),
//           );
//         }
//       } catch (error) {
//         ws.send(
//           JSON.stringify({
//             type: 'error',
//             data: error.message,
//             key: 'INVALID_FOCUS_MODE',
//           }),
//         );
//       }
//     }
//   } catch (err) {
//     ws.send(
//       JSON.stringify({
//         type: 'error',
//         data: 'Invalid message format',
//         key: 'INVALID_FORMAT',
//       }),
//     );
//     logger.error(`Failed to handle message: ${err}`);
//   }
// };
