// import express, { Router } from 'express';
// import logger from '../utils/logger';
// import {
//   getAvailableChatModelProviders,
//   getAvailableEmbeddingModelProviders,
// } from '../lib/providers';

// const router: Router = express.Router();

// router.get('/', async (req, res) => {
//   try {
//     const [chatModelProviders, embeddingModelProviders] = await Promise.all([
//       getAvailableChatModelProviders(),
//       getAvailableEmbeddingModelProviders(),
//     ]);

//     const formattedChatProviders = Object.keys(chatModelProviders).reduce(
//       (acc, provider) => {
//         acc[provider] = Object.keys(chatModelProviders[provider]).reduce(
//           (modelAcc, model) => {
//             modelAcc[model] = {};
//             return modelAcc;
//           },
//           {},
//         );
//         return acc;
//       },
//       {},
//     );

//     const formattedEmbeddingProviders = Object.keys(
//       embeddingModelProviders,
//     ).reduce((acc, provider) => {
//       acc[provider] = Object.keys(embeddingModelProviders[provider]).reduce(
//         (modelAcc, model) => {
//           modelAcc[model] = {};
//           return modelAcc;
//         },
//         {},
//       );
//       return acc;
//     }, {});

//     res.status(200).json({
//       chatModelProviders: formattedChatProviders,
//       embeddingModelProviders: formattedEmbeddingProviders,
//     });
//   } catch (err) {
//     res.status(500).json({ message: 'An error has occurred.' });
//     logger.error(err.message);
//   }
// });

// export default router;
