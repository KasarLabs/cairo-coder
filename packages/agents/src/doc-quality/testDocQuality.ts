import fs from 'fs';
import path from 'path';
import { Command } from 'commander';
import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { OpenAIEmbeddings } from '@langchain/openai';
import { DocumentSource, RagSearchConfig } from '../types';
import { DocQualityTester } from '../core/pipeline/docQualityTester';
import { getAgentConfig } from '../config/agent';
import { logger } from '../utils';
import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { VectorStore } from '../db/postgresVectorStore';
import {
  getGeminiApiKey,
  getOpenaiApiKey,
  getVectorDbConfig,
} from '../config/settings';
import { Embeddings } from '@langchain/core/embeddings';
import { LLMConfig } from '../types';

const program = new Command();

// Initialize the program
program
  .name('test-doc-quality')
  .description('Test documentation quality using the Starknet Agent')
  .version('1.0.0');

program
  .command('test')
  .description('Run documentation quality tests')
  .requiredOption(
    '-s, --source <source>',
    'Documentation source to test (e.g., starknet_docs)',
  )
  .requiredOption('-t, --test-file <file>', 'Path to test file (JSON)')
  .option('-o, --output <file>', 'Path to output file (JSON)')
  .option(
    '-m, --model <model>',
    'LLM model to use for testing',
    'Claude 3.5 Sonnet',
  )
  .option(
    '-e, --eval-model <model>',
    'LLM model to use for evaluation (defaults to same as model)',
  )
  .option(
    '--no-detailed-output',
    'Disable detailed test output with PASS/FAIL status',
  )
  .option(
    '--thresholds <json>',
    'Custom thresholds for determining pass/fail status (JSON string)',
  )
  .action(async (options) => {
    try {
      // Validate source
      const source = options.source as DocumentSource;
      const focus = source as string;

      // Load test file
      const testFilePath = path.resolve(process.cwd(), options.testFile);
      if (!fs.existsSync(testFilePath)) {
        logger.error(`Test file not found: ${testFilePath}`);
        process.exit(1);
      }

      const testFileContent = fs.readFileSync(testFilePath, 'utf-8');
      const testSet = JSON.parse(testFileContent);

      const geminiApiKey = getGeminiApiKey();
      const openaiApiKey = getOpenaiApiKey();

      // Initialize models and embeddings
      const defaultLLM = new ChatGoogleGenerativeAI({
        temperature: 0.7,
        apiKey: geminiApiKey,
        modelName: 'gemini-2.0-flash',
      });

      const llmConfig: LLMConfig = {
        defaultLLM: defaultLLM as unknown as BaseChatModel,
        fastLLM: defaultLLM as unknown as BaseChatModel,
      };

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: openaiApiKey,
        modelName: 'text-embedding-3-large',
        dimensions: 1536,
      }) as unknown as Embeddings;

      // Initialize vector store
      const dbConfig = getVectorDbConfig();
      const vectorStore = await VectorStore.getInstance(dbConfig, embeddings);

      // Get agent configuration
      const agentConfig = getAgentConfig(vectorStore);
      if (!agentConfig) {
        logger.error(`Agent configuration not found for source: ${source}`);
        process.exit(1);
      }

      // Create RAG config
      const ragConfig: RagSearchConfig = {
        ...agentConfig,
        vectorStore,
        sources: agentConfig.sources,
      };

      // Initialize DocQualityTester
      const tester = new DocQualityTester(llmConfig, embeddings, ragConfig);

      // Parse thresholds if provided
      let thresholds = undefined;
      if (options.thresholds) {
        try {
          thresholds = JSON.parse(options.thresholds);
        } catch (e) {
          logger.error(`Error parsing thresholds JSON: ${e}`);
          process.exit(1);
        }
      }

      // Run tests with detailed output options
      logger.info(`Starting documentation quality tests for focus ${focus}`);
      const results = await tester.testDocQuality(testSet, focus, {
        showDetailedOutput: options.detailedOutput,
        thresholds,
      });

      // Generate report
      const report = await tester.generateReport(results);

      // Output results
      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
        logger.info(`Report saved to ${outputPath}`);
      } else {
        console.log('\nDocumentation Quality Report');
        console.log('===========================\n');
        console.log(`Focus: ${report.results.focus}`);
        console.log(`Version: ${report.results.version}`);
        console.log(`Test Cases: ${report.results.caseResults.length}`);
        console.log('\nSummary:');
        console.log(report.summary);

        console.log('\nKey Metrics:');
        console.log(
          `- Relevance Score: ${report.results.metrics.overall.percentAnswered.toFixed(2)}`,
        );
        console.log(
          `- Coverage Score: ${report.results.metrics.overall.avgClarityScore.toFixed(2)}`,
        );
        console.log(
          `- Answer Completeness: ${report.results.metrics.overall.avgSourceAlignment.toFixed(2)}`,
        );

        console.log('\nTop Recommendations:');
        const highPriorityRecs = report.recommendations.filter(
          (r) => r.priority === 'high',
        );
        highPriorityRecs.forEach((rec, i) => {
          console.log(`${i + 1}. ${rec.description}`);
        });

        console.log(
          '\nFor full report, use the --output option to save to file.',
        );
      }
    } catch (error) {
      logger.error('Error running documentation quality tests:', error);
      process.exit(1);
    }
  });

program
  .command('compare')
  .description('Compare documentation quality between versions')
  .requiredOption('-s, --source <source>', 'Documentation source to test')
  .requiredOption(
    '-b, --baseline <file>',
    'Path to baseline results file (JSON)',
  )
  .requiredOption('-c, --current <file>', 'Path to current results file (JSON)')
  .option('-o, --output <file>', 'Path to output file (JSON)')
  .option(
    '-m, --model <model>',
    'LLM model to use for comparison',
    'Claude 3.5 Sonnet',
  )
  .action(async (options) => {
    try {
      // Validate source
      const focus = options.source as DocumentSource;

      // Load result files
      const baselinePath = path.resolve(process.cwd(), options.baseline);
      const currentPath = path.resolve(process.cwd(), options.current);

      if (!fs.existsSync(baselinePath)) {
        logger.error(`Baseline file not found: ${baselinePath}`);
        process.exit(1);
      }

      if (!fs.existsSync(currentPath)) {
        logger.error(`Current file not found: ${currentPath}`);
        process.exit(1);
      }

      const baselineContent = fs.readFileSync(baselinePath, 'utf-8');
      const currentContent = fs.readFileSync(currentPath, 'utf-8');

      const baseline = JSON.parse(baselineContent);
      const current = JSON.parse(currentContent);

      const geminiApiKey = getGeminiApiKey();
      const openaiApiKey = getOpenaiApiKey();

      // Initialize models and embeddings
      const defaultLLM = new ChatGoogleGenerativeAI({
        temperature: 0.7,
        apiKey: geminiApiKey,
        modelName: 'gemini-2.0-flash',
      });

      const llmConfig: LLMConfig = {
        defaultLLM: defaultLLM as unknown as BaseChatModel,
        fastLLM: defaultLLM as unknown as BaseChatModel,
      };

      const embeddings = new OpenAIEmbeddings({
        openAIApiKey: openaiApiKey,
        modelName: 'text-embedding-3-large',
        dimensions: 1536,
      }) as unknown as Embeddings;

      // Initialize vector store
      const dbConfig = getVectorDbConfig();
      const vectorStore = await VectorStore.getInstance(dbConfig, embeddings);

      // Get agent configuration
      const agentConfig = getAgentConfig(vectorStore);
      if (!agentConfig) {
        logger.error(`Agent configuration not found for source: ${focus}`);
        process.exit(1);
      }

      // Create RAG config
      const ragConfig: RagSearchConfig = {
        ...agentConfig,
        vectorStore,
        sources: agentConfig.sources,
      };

      // Initialize DocQualityTester
      const tester = new DocQualityTester(llmConfig, embeddings, ragConfig);

      // Run comparison
      const comparisonReport = await tester.compareResults(baseline, current);

      // Output results
      if (options.output) {
        const outputPath = path.resolve(process.cwd(), options.output);
        fs.writeFileSync(outputPath, JSON.stringify(comparisonReport, null, 2));
        logger.info(`Comparison report saved to ${outputPath}`);
      } else {
        console.log('\nDocumentation Quality Comparison');
        console.log('==============================\n');
        console.log(`Focus: ${current.focus}`);
        console.log(`Baseline Version: ${baseline.version}`);
        console.log(`Current Version: ${current.version}`);
        console.log('\nComparison Summary:');
        console.log(comparisonReport.summary);

        // Display recommendations
        console.log('\nRecommendations:');
        comparisonReport.recommendations.forEach((rec, i) => {
          console.log(
            `${i + 1}. [${rec.priority.toUpperCase()}] ${rec.description}`,
          );
        });

        console.log(
          '\nFor full report, use the --output option to save to file.',
        );
      }
    } catch (error) {
      logger.error('Error comparing documentation quality:', error);
      process.exit(1);
    }
  });

program.parse(process.argv);
