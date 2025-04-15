// import fs from 'fs';
// import path from 'path';
// import { Command } from 'commander';
// import { BaseChatModel } from '@langchain/core/language_models/chat_models';
// import { OpenAIEmbeddings } from '@langchain/openai';
// import { DocumentSource, RagSearchConfig } from './core/types';
// import { DocQualityTester } from './pipeline/docQualityTester';
// import {
//   AvailableAgents,
//   getAgentConfig,
//   LLMConfig,
// } from './config/agentConfigs';
// import logger from './utils/logger';
// import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
// import { VectorStore } from './db/vectorStore';
// import { getGeminiApiKey, getOpenaiApiKey, getVectorDbConfig } from './config';
// import { Embeddings } from '@langchain/core/embeddings';

// const program = new Command();

// // Initialize the program
// program
//   .name('test-doc-quality')
//   .description('Test documentation quality using the Starknet Agent')
//   .version('1.0.0');

// program
//   .command('test')
//   .description('Run documentation quality tests')
//   .requiredOption(
//     '-s, --source <source>',
//     'Documentation source to test (e.g., starknet_docs)',
//   )
//   .requiredOption('-t, --test-file <file>', 'Path to test file (JSON)')
//   .option('-o, --output <file>', 'Path to output file (JSON)')
//   .option(
//     '-m, --model <model>',
//     'LLM model to use for testing',
//     'Claude 3.5 Sonnet',
//   )
//   .option(
//     '-e, --eval-model <model>',
//     'LLM model to use for evaluation (defaults to same as model)',
//   )
//   .option(
//     '--no-detailed-output',
//     'Disable detailed test output with PASS/FAIL status',
//   )
//   .option(
//     '--thresholds <json>',
//     'Custom thresholds for determining pass/fail status (JSON string)',
//   )
//   .action(async (options) => {
//     try {
//       // Validate source
//       const source = options.source as DocumentSource;
//       const focus = source as string;

//       // Load test file
//       const testFilePath = path.resolve(process.cwd(), options.testFile);
//       if (!fs.existsSync(testFilePath)) {
//         logger.error(`Test file not found: ${testFilePath}`);
//         process.exit(1);
//       }

//       const testFileContent = fs.readFileSync(testFilePath, 'utf-8');
//       const testSet = JSON.parse(testFileContent);

//       const geminiApiKey = getGeminiApiKey();
//       const openaiApiKey = getOpenaiApiKey();

//       // Initialize models and embeddings
//       const defaultLLM = new ChatGoogleGenerativeAI({
//         temperature: 0.7,
//         apiKey: geminiApiKey,
//         modelName: 'gemini-2.0-flash',
//       });

//       const llmConfig = {
//         defaultLLM: defaultLLM as unknown as BaseChatModel,
//         fastLLM: defaultLLM as unknown as BaseChatModel,
//         evaluationLLM: defaultLLM as unknown as BaseChatModel,
//       };

//       const embeddings = new OpenAIEmbeddings({
//         openAIApiKey: openaiApiKey,
//         modelName: 'text-embedding-3-large',
//         dimensions: 2048,
//       }) as unknown as Embeddings;

//       // Initialize vector store
//       const dbConfig = getVectorDbConfig();
//       const vectorStore = await VectorStore.getInstance(dbConfig, embeddings);

//       const source_to_agent_name: Record<
//         DocumentSource | 'starknet_ecosystem',
//         AvailableAgents
//       > = {
//         [DocumentSource.CAIRO_BOOK]: 'cairoBook',
//         [DocumentSource.STARKNET_DOCS]: 'starknetDocs',
//         starknet_ecosystem: 'starknetEcosystem',
//         [DocumentSource.STARKNET_FOUNDRY]: 'starknetFoundry',
//         [DocumentSource.CAIRO_BY_EXAMPLE]: 'cairoByExample',
//         [DocumentSource.OPENZEPPELIN_DOCS]: 'openZeppelinDocs',
//       };
//       // Get agent configuration
//       const agentConfig = getAgentConfig(
//         source_to_agent_name[source],
//         vectorStore,
//       );
//       if (!agentConfig) {
//         logger.error(`Agent configuration not found for source: ${source}`);
//         process.exit(1);
//       }

//       // Create RAG config
//       const ragConfig: RagSearchConfig = {
//         ...agentConfig,
//         vectorStore,
//         sources: agentConfig.sources,
//       };

//       // Initialize DocQualityTester
//       const tester = new DocQualityTester(llmConfig, embeddings, ragConfig);

//       // Parse thresholds if provided
//       let thresholds = undefined;
//       if (options.thresholds) {
//         try {
//           thresholds = JSON.parse(options.thresholds);
//         } catch (e) {
//           logger.error(`Error parsing thresholds JSON: ${e}`);
//           process.exit(1);
//         }
//       }

//       // Run tests with detailed output options
//       logger.info(`Starting documentation quality tests for focus ${focus}`);
//       const results = await tester.testDocQuality(testSet, focus, {
//         showDetailedOutput: options.detailedOutput,
//         thresholds,
//       });

//       // Generate report
//       const report = await tester.generateReport(results);

//       // Output results
//       if (options.output) {
//         const outputPath = path.resolve(process.cwd(), options.output);
//         fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
//         logger.info(`Report saved to ${outputPath}`);
//       } else {
//         console.log('\nDocumentation Quality Report');
//         console.log('===========================\n');
//         console.log(`Focus: ${report.results.focus}`);
//         console.log(`Version: ${report.results.version}`);
//         console.log(`Test Cases: ${report.results.caseResults.length}`);
//         console.log('\nSummary:');
//         console.log(report.summary);

//         console.log('\nKey Metrics:');
//         console.log(
//           `- Relevance Score: ${report.results.metrics.overall.percentAnswered.toFixed(2)}`,
//         );
//         console.log(
//           `- Coverage Score: ${report.results.metrics.overall.avgClarityScore.toFixed(2)}`,
//         );
//         console.log(
//           `- Answer Completeness: ${report.results.metrics.overall.avgSourceAlignment.toFixed(2)}`,
//         );

//         console.log('\nTop Recommendations:');
//         const highPriorityRecs = report.recommendations.filter(
//           (r) => r.priority === 'high',
//         );
//         highPriorityRecs.forEach((rec, i) => {
//           console.log(`${i + 1}. ${rec.description}`);
//         });

//         console.log(
//           '\nFor full report, use the --output option to save to file.',
//         );
//       }
//     } catch (error) {
//       logger.error('Error running documentation quality tests:', error);
//       process.exit(1);
//     }
//   });

// program
//   .command('compare')
//   .description('Compare documentation quality between versions')
//   .requiredOption('-s, --source <source>', 'Documentation source to test')
//   .requiredOption(
//     '-b, --baseline <file>',
//     'Path to baseline results file (JSON)',
//   )
//   .requiredOption('-c, --current <file>', 'Path to current results file (JSON)')
//   .option('-o, --output <file>', 'Path to output file (JSON)')
//   .option(
//     '-m, --model <model>',
//     'LLM model to use for comparison',
//     'Claude 3.5 Sonnet',
//   )
//   .action(async (options) => {
//     try {
//       // Validate source
//       const focus = options.source as DocumentSource;

//       // Load result files
//       const baselinePath = path.resolve(process.cwd(), options.baseline);
//       const currentPath = path.resolve(process.cwd(), options.current);

//       if (!fs.existsSync(baselinePath)) {
//         logger.error(`Baseline file not found: ${baselinePath}`);
//         process.exit(1);
//       }

//       if (!fs.existsSync(currentPath)) {
//         logger.error(`Current file not found: ${currentPath}`);
//         process.exit(1);
//       }

//       const baselineContent = fs.readFileSync(baselinePath, 'utf-8');
//       const currentContent = fs.readFileSync(currentPath, 'utf-8');

//       const baseline = JSON.parse(baselineContent);
//       const current = JSON.parse(currentContent);

//       const geminiApiKey = getGeminiApiKey();
//       const openaiApiKey = getOpenaiApiKey();

//       // Initialize models and embeddings
//       const defaultLLM = new ChatGoogleGenerativeAI({
//         temperature: 0.7,
//         apiKey: geminiApiKey,
//         modelName: 'gemini-2.0-flash',
//       });

//       const llmConfig = {
//         defaultLLM: defaultLLM as unknown as BaseChatModel,
//         fastLLM: defaultLLM as unknown as BaseChatModel,
//         evaluationLLM: defaultLLM as unknown as BaseChatModel,
//       };

//       const embeddings = new OpenAIEmbeddings({
//         openAIApiKey: openaiApiKey,
//         modelName: 'text-embedding-3-large',
//         dimensions: 2048,
//       }) as unknown as Embeddings;

//       // Initialize vector store
//       const dbConfig = getVectorDbConfig();
//       const vectorStore = await VectorStore.getInstance(dbConfig, embeddings);

//       const focus_to_agent_name: Record<
//         DocumentSource | 'starknet_ecosystem',
//         AvailableAgents
//       > = {
//         [DocumentSource.CAIRO_BOOK]: 'cairoBook',
//         [DocumentSource.STARKNET_DOCS]: 'starknetDocs',
//         starknet_ecosystem: 'starknetEcosystem',
//         [DocumentSource.STARKNET_FOUNDRY]: 'starknetFoundry',
//         [DocumentSource.CAIRO_BY_EXAMPLE]: 'cairoByExample',
//         [DocumentSource.OPENZEPPELIN_DOCS]: 'openZeppelinDocs',
//       };
//       // Get agent configuration
//       const agentConfig = getAgentConfig(
//         focus_to_agent_name[focus],
//         vectorStore,
//       );
//       if (!agentConfig) {
//         logger.error(`Agent configuration not found for focus: ${focus}`);
//         process.exit(1);
//       }

//       // Initialize DocQualityTester
//       const tester = new DocQualityTester(llmConfig, embeddings, {
//         ...agentConfig,
//         vectorStore: {} as any, // Not needed for comparison
//         sources: agentConfig.sources,
//       });

//       // Compare results
//       logger.info(`Comparing documentation quality for ${focus}`);
//       const report = await tester.compareResults(
//         baseline.results,
//         current.results,
//       );

//       // Output comparison
//       if (options.output) {
//         const outputPath = path.resolve(process.cwd(), options.output);
//         fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
//         logger.info(`Comparison report saved to ${outputPath}`);
//       } else {
//         console.log('\nDocumentation Quality Comparison Report');
//         console.log('=====================================\n');
//         console.log(`Focus: ${report.results.focus}`);
//         console.log(`Baseline Version: ${baseline.results.version}`);
//         console.log(`Current Version: ${current.results.version}`);

//         console.log('\nSummary:');
//         console.log(report.summary);

//         console.log('\nMetric Changes:');
//         const baselineMetrics = baseline.results.metrics.overall;
//         const currentMetrics = report.results.metrics.overall;

//         console.log(
//           `- Relevance Score: ${baselineMetrics.percentAnswered.toFixed(2)} → ${currentMetrics.percentAnswered.toFixed(2)} (${baselineMetrics.percentAnswered > currentMetrics.percentAnswered ? '↓' : '↑'})`,
//         );
//         console.log(
//           `- Coverage Score: ${baselineMetrics.avgClarityScore.toFixed(2)} → ${currentMetrics.avgClarityScore.toFixed(2)} (${baselineMetrics.avgClarityScore > currentMetrics.avgClarityScore ? '↓' : '↑'})`,
//         );
//         console.log(
//           `- Answer Completeness: ${baselineMetrics.avgSourceAlignment.toFixed(2)} → ${currentMetrics.avgSourceAlignment.toFixed(2)} (${baselineMetrics.avgSourceAlignment > currentMetrics.avgSourceAlignment ? '↓' : '↑'})`,
//         );

//         if (report.recommendations.length > 0) {
//           console.log('\nRecommendations:');
//           report.recommendations.forEach((rec, i) => {
//             console.log(
//               `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`,
//             );
//           });
//         }

//         console.log(
//           '\nFor full comparison report, use the --output option to save to file.',
//         );
//       }
//     } catch (error) {
//       logger.error('Error comparing documentation quality results:', error);
//       process.exit(1);
//     }
//   });

// program.parse();
