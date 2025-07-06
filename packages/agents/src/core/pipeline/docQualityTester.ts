import { BaseChatModel } from '@langchain/core/language_models/chat_models';
import { AxMultiServiceRouter } from '@ax-llm/ax';
import { Document } from '@langchain/core/documents';
import { RagPipeline } from './ragPipeline';
import {
  DocTestSet,
  TestCase,
  TestResults,
  TestCaseResult,
  QualityReport,
  RagSearchConfig,
  RagInput,
  TestCaseMetrics,
  QualityMetrics,
  DocumentationRecommendation,
  DocumentSource,
} from '../../types';
import { logger } from '../../utils';
import {
  BaseMessage,
  HumanMessage,
  SystemMessage,
} from '@langchain/core/messages';

/**
 * DocQualityTester - Tests documentation quality by running queries through the RAG pipeline
 * and evaluating the results to provide quality metrics and recommendations
 */
export class DocQualityTester {
  private pipeline: RagPipeline;
  private evaluationLLM: BaseChatModel;
  private config: RagSearchConfig;

  constructor(
    axRouter: AxMultiServiceRouter,
    evaluationLLM: BaseChatModel,
    config: RagSearchConfig,
  ) {
    this.pipeline = new RagPipeline(axRouter, config);
    this.evaluationLLM = evaluationLLM;
    this.config = config;
  }

  /**
   * Test a set of queries against specific documentation sources
   * @param testSet Test set configuration with queries and expected results
   * @param options Optional configuration options including:
   *   - showDetailedOutput: Whether to show detailed PASS/FAIL output for each test (default: true)
   *   - thresholds: Customized thresholds for determining pass/fail status
   * @returns Test results with quality metrics
   */
  async testDocQuality(
    testSet: DocTestSet,
    focus: string,
    options: {
      showDetailedOutput?: boolean;
      thresholds?: {
        isAnswered?: boolean;
        clarityScore?: number;
        sourceAlignment?: number;
        contentSatisfaction?: number;
      };
    } = {},
  ): Promise<TestResults> {
    const showDetailedOutput =
      options.showDetailedOutput !== undefined
        ? options.showDetailedOutput
        : true;
    const thresholds = {
      isAnswered: true,
      clarityScore: 0.7,
      sourceAlignment: 0.7,
      contentSatisfaction: 0.7,
      ...options.thresholds,
    };

    logger.info(`Starting documentation quality test for ${focus}`, {
      version: testSet.version,
      testCases: testSet.testCases.length,
    });

    try {
      // Execute each test case
      const casePromises = testSet.testCases.map((testCase) =>
        this.executeTestCase(testCase),
      );

      const caseResults = await Promise.all(casePromises);

      // Aggregate metrics
      const metrics = this.calculateAggregateMetrics(caseResults, testSet);

      const results: TestResults = {
        focus,
        version: testSet.version,
        executedAt: new Date(),
        metrics,
        caseResults,
      };

      // Generate detailed test results with PASS/FAIL status if requested
      if (showDetailedOutput) {
        this.printDetailedTestResults(results, thresholds);
      }

      logger.info(`Completed documentation quality test for ${focus}`, {
        overallScore: metrics.overall.avgClarityScore.toFixed(2),
      });

      return results;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error in documentation quality test: ${errorMessage}`);
      if (error instanceof Error && error.stack) {
        logger.error('Stack trace:', error.stack);
      }
      throw error;
    }
  }

  /**
   * Generate a comprehensive report with recommendations based on test results
   * @param results Test results to analyze
   * @returns Quality report with recommendations
   */
  async generateReport(results: TestResults): Promise<QualityReport> {
    logger.info(`Generating quality report for ${results.focus}`, {
      testCases: results.caseResults.length,
    });

    try {
      // Generate recommendations based on test results
      const recommendations = await this.generateRecommendations(results);

      // Generate summary using LLM
      const summary = await this.generateSummary(results, recommendations);

      return {
        results,
        summary,
        recommendations,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error generating quality report: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Compare results between different documentation versions
   * @param baseline Previous test results
   * @param current Current test results
   * @returns Comparison report highlighting improvements and regressions
   */
  async compareResults(
    baseline: TestResults,
    current: TestResults,
  ): Promise<QualityReport> {
    logger.info(`Comparing results between versions`, {
      source: current.focus,
      baselineVersion: baseline.version,
      currentVersion: current.version,
    });

    try {
      // Calculate improvements and regressions
      const improvements: string[] = [];
      const regressions: string[] = [];

      const overallDiff = {
        percentAnswered:
          current.metrics.overall.percentAnswered -
          baseline.metrics.overall.percentAnswered,
        clarityScore:
          current.metrics.overall.avgClarityScore -
          baseline.metrics.overall.avgClarityScore,
        sourceAlignment:
          current.metrics.overall.avgSourceAlignment -
          baseline.metrics.overall.avgSourceAlignment,
        contentSatisfaction:
          current.metrics.overall.avgContentSatisfaction &&
          baseline.metrics.overall.avgContentSatisfaction
            ? current.metrics.overall.avgContentSatisfaction -
              baseline.metrics.overall.avgContentSatisfaction
            : undefined,
      };

      if (overallDiff.percentAnswered > 0.05) {
        improvements.push(
          `Percentage of answered questions improved by ${(overallDiff.percentAnswered * 100).toFixed(1)}%`,
        );
      } else if (overallDiff.percentAnswered < -0.05) {
        regressions.push(
          `Percentage of answered questions decreased by ${(Math.abs(overallDiff.percentAnswered) * 100).toFixed(1)}%`,
        );
      }

      if (overallDiff.clarityScore > 0.05) {
        improvements.push(
          `Answer clarity improved by ${(overallDiff.clarityScore * 100).toFixed(1)}%`,
        );
      } else if (overallDiff.clarityScore < -0.05) {
        regressions.push(
          `Answer clarity decreased by ${(Math.abs(overallDiff.clarityScore) * 100).toFixed(1)}%`,
        );
      }

      if (overallDiff.sourceAlignment > 0.05) {
        improvements.push(
          `Source alignment improved by ${(overallDiff.sourceAlignment * 100).toFixed(1)}%`,
        );
      } else if (overallDiff.sourceAlignment < -0.05) {
        regressions.push(
          `Source alignment decreased by ${(Math.abs(overallDiff.sourceAlignment) * 100).toFixed(1)}%`,
        );
      }

      if (overallDiff.contentSatisfaction !== undefined) {
        if (overallDiff.contentSatisfaction > 0.05) {
          improvements.push(
            `Content satisfaction improved by ${(overallDiff.contentSatisfaction * 100).toFixed(1)}%`,
          );
        } else if (overallDiff.contentSatisfaction < -0.05) {
          regressions.push(
            `Content satisfaction decreased by ${(Math.abs(overallDiff.contentSatisfaction) * 100).toFixed(1)}%`,
          );
        }
      }

      // Generate recommendations based on comparison
      const recommendations = await this.generateComparisonRecommendations(
        baseline,
        current,
        improvements,
        regressions,
      );

      // Generate summary
      const summary = await this.generateComparisonSummary(
        baseline,
        current,
        improvements,
        regressions,
      );

      return {
        results: current,
        summary,
        recommendations,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      logger.error(`Error comparing results: ${errorMessage}`);
      throw error;
    }
  }

  /**
   * Execute a single test case
   * @param testCase Test case to execute
   * @param source Documentation source to test against
   * @returns Results for this test case
   */
  private async executeTestCase(testCase: TestCase): Promise<TestCaseResult> {
    logger.info(`Executing test case: "${testCase.query}"`, {
      type: testCase.type,
      difficulty: testCase.difficulty,
    });

    try {
      // Prepare input for RAG pipeline
      const config_sources = this.config.sources;
      const input: RagInput = {
        query: testCase.query,
        chatHistory: [
          new HumanMessage(
            `You are a helpful assistant. Answer the question "${testCase.query}" based on the following context`,
          ),
        ],
        sources: config_sources,
      };

      // Custom execution to capture intermediates
      const processedQuery =
        await this.pipeline['queryProcessor'].process(input);
      const retrieved = await this.pipeline['documentRetriever'].retrieve(
        processedQuery,
        input.sources,
      );

      let answer = '';
      const stream = await this.pipeline['answerGenerator'].generate(
        input,
        retrieved,
      );
      for await (const event of stream) {
        if (event.event === 'on_llm_stream') {
          const content =
            event.data?.output?.generations?.[0]?.[0]?.message?.content || '';
          if (content) {
            answer += content;
          }
        } else if (event.event === 'on_llm_end') {
          const content =
            event.data?.output?.generations?.[0]?.[0]?.message?.content || '';
          if (content) {
            answer += content;
          }
        }
      }

      // Calculate metrics
      const metrics = await this.calculateMetrics(
        testCase,
        retrieved.documents,
        answer,
      );

      // Generate recommendations specific to this test case
      const recommendations = await this.generateTestCaseRecommendations(
        testCase,
        retrieved.documents,
        answer,
        metrics,
      );

      return {
        query: testCase.query,
        retrievedDocuments: retrieved.documents,
        answer,
        metrics,
        recommendations,
      };
    } catch (error) {
      logger.error(`Error executing test case "${testCase.query}": ${error}`);
      throw error;
    }
  }

  /**
   * Calculate metrics for a test case using a single LLM call
   * @param testCase The test case being evaluated
   * @param documents Retrieved documents
   * @param answer Generated answer
   * @returns Metrics for this test case
   */
  private async calculateMetrics(
    testCase: TestCase,
    documents: Document[],
    answer: string,
  ): Promise<TestCaseMetrics> {
    try {
      logger.debug(`Calculating metrics for query: "${testCase.query}"`);

      // Prepare relevant context for LLM evaluation
      const context = documents
        .map((doc) => doc.pageContent)
        .join('\n\n')
        .substring(0, 4000);

      // Create prompt for LLM to evaluate all criteria
      let prompt = `
You are an expert at evaluating AI chatbot answers. Evaluate the answer to the following question:

QUESTION: ${testCase.query}

RETRIEVED CONTEXT (used to generate the answer):
${context}

ANSWER:
${answer}

EXPECTED TOPICS: ${testCase.expectedTopics.join(', ')}
`;

      // Add expected content if it exists
      if (testCase.expectedContent) {
        prompt += `
EXPECTED CONTENT: The answer should contain the following info: ${testCase.expectedContent}
`;
      }

      prompt += `
Please evaluate the answer on these criteria:

1. IS_ANSWERED: Does the answer actually address the question asked? (True/False)
2. CLARITY_SCORE: How clear and understandable is the answer? (Score from 0 to 1, where 0 is completely unclear and 1 is perfectly clear)
3. SOURCE_ALIGNMENT: How well does the answer align with information from the retrieved context? This metric rates whether the answer can be derived from the retrieved context only. (Score from 0 to 1, where 0 means no alignment with context and 1 means perfect alignment)
`;

      // Add content satisfaction evaluation if expected content exists
      if (testCase.expectedContent) {
        prompt += `
4. CONTENT_SATISFACTION: How well does the answer satisfy the EXPECTED CONTENT criteria? (Score from 0 to 1, where 0 means it doesn't satisfy any criteria and 1 means it fully satisfies all criteria)
5. CONTENT_FEEDBACK: Brief feedback on how well the answer meets the expected content criteria, highlighting any gaps or strengths.
`;
      }

      prompt += `
If the answer does NOT address the question (IS_ANSWERED = false), provide a brief explanation of why the answer is insufficient in the "notAnsweredReason" field.

Return ONLY a JSON object with your evaluation, no other text:
{
  "isAnswered": true/false,
  "notAnsweredReason": "Only include if isAnswered is false - brief explanation of why",
  "clarityScore": 0.0-1.0,
  "sourceAlignment": 0.0-1.0${testCase.expectedContent ? ',\n  "contentSatisfaction": 0.0-1.0,\n  "contentFeedback": "Brief assessment of how well expected content criteria are met"' : ''}
}
`;

      // Call LLM for evaluation
      const result = await this.evaluationLLM.invoke([
        new SystemMessage(
          'You are an expert evaluator. Return only the JSON object with your evaluation, no explanation.',
        ),
        new HumanMessage(prompt),
      ]);

      const response = result.content.toString().trim();

      // Extract JSON (in case the LLM added other text)
      let jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      let jsonStr;

      if (jsonMatch && jsonMatch[1]) {
        // Extract the content inside the code block
        jsonStr = jsonMatch[1];
      } else {
        // Fallback to looking for JSON object directly
        jsonMatch = response.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) {
          logger.warn(`Could not extract JSON from LLM response: ${response}`);
          return {
            isAnswered: false,
            notAnsweredReason: 'Failed to parse LLM evaluation response',
            clarityScore: 0.5,
            sourceAlignment: 0.5,
          };
        }
        jsonStr = jsonMatch[1];
      }

      try {
        const metrics = JSON.parse(jsonStr) as TestCaseMetrics;

        // Validate and sanitize metrics
        const isAnswered =
          typeof metrics.isAnswered === 'boolean' ? metrics.isAnswered : false;
        const notAnsweredReason =
          !isAnswered && metrics.notAnsweredReason
            ? metrics.notAnsweredReason
            : undefined;
        const clarityScore = this.validateScore(metrics.clarityScore);
        const sourceAlignment = this.validateScore(metrics.sourceAlignment);

        // Add content satisfaction metrics if they exist
        const contentSatisfaction =
          metrics.contentSatisfaction !== undefined
            ? this.validateScore(metrics.contentSatisfaction)
            : undefined;
        const contentFeedback = metrics.contentFeedback;

        logger.debug(`Metrics for "${testCase.query}":`, {
          isAnswered,
          notAnsweredReason,
          clarityScore,
          sourceAlignment,
          contentSatisfaction,
          contentFeedback,
        });

        return {
          isAnswered,
          notAnsweredReason,
          clarityScore,
          sourceAlignment,
          contentSatisfaction,
          contentFeedback,
        };
      } catch (parseError) {
        logger.error(
          `Error parsing metrics JSON: ${parseError} for jsonStr: ${jsonStr}`,
        );
        logger.debug(`Raw LLM response: ${response}`);
        return {
          isAnswered: false,
          notAnsweredReason: 'Failed to parse LLM evaluation response',
          clarityScore: 0.5,
          sourceAlignment: 0.5,
        };
      }
    } catch (error) {
      logger.error(`Error calculating metrics: ${error}`);
      return {
        isAnswered: false,
        notAnsweredReason: 'Error occurred during evaluation',
        clarityScore: 0,
        sourceAlignment: 0,
      };
    }
  }

  /**
   * Validate a score is within 0-1 range
   * @param score The score to validate
   * @returns A valid score between 0 and 1
   */
  private validateScore(score: any): number {
    if (typeof score !== 'number' || isNaN(score)) {
      return 0.5;
    }

    return Math.max(0, Math.min(1, score));
  }

  /**
   * Calculate aggregate metrics from all test case results
   * @param caseResults Results from all test cases
   * @param testSet Original test set
   * @returns Aggregated metrics
   */
  private calculateAggregateMetrics(
    caseResults: TestCaseResult[],
    testSet: DocTestSet,
  ): TestResults['metrics'] {
    // Calculate overall metrics
    const overall = this.calculateOverallMetrics(caseResults);

    // Group by type
    const byType: Record<string, TestCaseResult[]> = {};
    testSet.testCases.forEach((testCase, index) => {
      if (!byType[testCase.type]) {
        byType[testCase.type] = [];
      }
      byType[testCase.type].push(caseResults[index]);
    });

    // Group by difficulty
    const byDifficulty: Record<string, TestCaseResult[]> = {};
    testSet.testCases.forEach((testCase, index) => {
      if (!byDifficulty[testCase.difficulty]) {
        byDifficulty[testCase.difficulty] = [];
      }
      byDifficulty[testCase.difficulty].push(caseResults[index]);
    });

    // Group by tag (if tags exist)
    const byTag: Record<string, TestCaseResult[]> = {};
    testSet.testCases.forEach((testCase, index) => {
      testCase.tags?.forEach((tag) => {
        if (!byTag[tag] || !Array.isArray(byTag[tag])) {
          byTag[tag] = [];
        }
        byTag[tag].push(caseResults[index]);
      });
    });

    // Calculate metrics for each group
    const byTypeMetrics: Record<string, QualityMetrics> = {};
    Object.entries(byType).forEach(([type, results]) => {
      byTypeMetrics[type] = this.calculateOverallMetrics(results);
    });

    const byDifficultyMetrics: Record<string, QualityMetrics> = {};
    Object.entries(byDifficulty).forEach(([difficulty, results]) => {
      byDifficultyMetrics[difficulty] = this.calculateOverallMetrics(results);
    });

    const byTagMetrics: Record<string, QualityMetrics> = {};
    Object.entries(byTag).forEach(([tag, results]) => {
      byTagMetrics[tag] = this.calculateOverallMetrics(results);
    });

    return {
      overall,
      byType: byTypeMetrics,
      byDifficulty: byDifficultyMetrics,
      byTag: Object.keys(byTag).length > 0 ? byTagMetrics : undefined,
    };
  }

  /**
   * Calculate overall metrics from a list of test case results
   * @param results Test case results
   * @returns Overall quality metrics
   */
  private calculateOverallMetrics(results: TestCaseResult[]): QualityMetrics {
    if (results.length === 0) {
      return {
        percentAnswered: 0,
        avgClarityScore: 0,
        avgSourceAlignment: 0,
      };
    }

    // Calculate averages
    const answeredCount = results.filter(
      (result) => result.metrics.isAnswered,
    ).length;
    const percentAnswered = answeredCount / results.length;

    const avgClarityScore =
      results.reduce((sum, result) => sum + result.metrics.clarityScore, 0) /
      results.length;

    const avgSourceAlignment =
      results.reduce((sum, result) => sum + result.metrics.sourceAlignment, 0) /
      results.length;

    // Calculate content satisfaction average only for cases that have it
    const casesWithContentSatisfaction = results.filter(
      (result) => result.metrics.contentSatisfaction !== undefined,
    );

    const avgContentSatisfaction =
      casesWithContentSatisfaction.length > 0
        ? casesWithContentSatisfaction.reduce(
            (sum, result) => sum + (result.metrics.contentSatisfaction || 0),
            0,
          ) / casesWithContentSatisfaction.length
        : undefined;

    return {
      percentAnswered,
      avgClarityScore,
      avgSourceAlignment,
      avgContentSatisfaction,
    };
  }

  /**
   * Generate recommendations for improving documentation
   * @param results Test results
   * @returns List of recommendations
   */
  private async generateRecommendations(
    results: TestResults,
  ): Promise<DocumentationRecommendation[]> {
    logger.debug('Generating recommendations from test results');

    try {
      // Find test cases with poor metrics
      const poorAnswerCases = results.caseResults.filter(
        (result) =>
          !result.metrics.isAnswered ||
          result.metrics.clarityScore < 0.7 ||
          result.metrics.sourceAlignment < 0.7 ||
          (result.metrics.contentSatisfaction !== undefined &&
            result.metrics.contentSatisfaction < 0.7),
      );

      if (poorAnswerCases.length === 0) {
        return [];
      }

      // Generate recommendations using LLM
      const recommendations = await this.generateContentRecommendations(
        results.focus,
        poorAnswerCases,
      );

      return recommendations;
    } catch (error) {
      logger.error(`Error generating recommendations: ${error}`);
      return [];
    }
  }

  /**
   * Generate content recommendations for documentation
   * @param source Documentation source
   * @param poorCases Test cases with poor metrics
   * @returns Content recommendations
   */
  private async generateContentRecommendations(
    source: string,
    poorCases: TestCaseResult[],
  ): Promise<DocumentationRecommendation[]> {
    if (poorCases.length === 0) {
      return [];
    }

    try {
      // Prepare input for LLM
      const caseSummaries = poorCases
        .map((result) => {
          return `
Query: ${result.query}
Answer: ${result.answer.substring(0, 200)}...
Retrieved Context: ${
            result.retrievedDocuments.length > 0
              ? result.retrievedDocuments
                  .slice(0, 2)
                  .map((doc) => `- ${doc.pageContent.substring(0, 100)}...`)
                  .join('\n')
              : 'None'
          }
Metrics:
- Is Answered: ${result.metrics.isAnswered}${!result.metrics.isAnswered && result.metrics.notAnsweredReason ? ` (Reason: ${result.metrics.notAnsweredReason})` : ''}
- Clarity Score: ${result.metrics.clarityScore.toFixed(2)}
- Source Alignment: ${result.metrics.sourceAlignment.toFixed(2)}
${result.metrics.contentSatisfaction !== undefined ? `- Content Satisfaction: ${result.metrics.contentSatisfaction.toFixed(2)}` : ''}
${result.metrics.contentFeedback ? `- Content Feedback: ${result.metrics.contentFeedback}` : ''}
`;
        })
        .join('\n---\n');

      const prompt = `
You are an expert documentation analyst. You need to provide recommendations to improve the ${source} documentation based on the following test cases that had issues with their answers:

${caseSummaries}

Provide 3-5 specific recommendations to improve the documentation. For each recommendation:
1. Clearly describe the issue
2. Suggest how to fix it
3. Rate priority as high, medium, or low
4. Identify affected topics

Format as JSON with the following structure (output ONLY valid JSON):
[
  {
    "type": "content|structure|terminology|examples",
    "priority": "high|medium|low",
    "description": "Description of the issue and recommendation",
    "examples": ["Example 1", "Example 2"],
    "affectedTopics": ["Topic1", "Topic2"]
  },
  ...
]
`;

      const result = await this.evaluationLLM.invoke([
        new SystemMessage(
          'You are an expert documentation analyst. Provide recommendations in valid JSON format only.',
        ),
        new HumanMessage(prompt),
      ]);

      const response = result.content.toString().trim();

      // Extract JSON (in case the LLM added other text)
      let jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      let jsonStr;

      if (jsonMatch && jsonMatch[1]) {
        // Extract the content inside the code block
        jsonStr = jsonMatch[1];
      } else {
        // Fallback to looking for JSON object directly
        jsonMatch = response.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) {
          logger.warn(`Could not extract JSON from LLM response: ${response}`);
          return [];
        }
        jsonStr = jsonMatch[1];
      }

      try {
        const recommendations = JSON.parse(
          jsonStr,
        ) as DocumentationRecommendation[];
        return recommendations;
      } catch (parseError) {
        logger.error(`Error parsing recommendations JSON: ${parseError}`);
        logger.debug(`Raw response: ${response}`);
        return [
          {
            type: 'content',
            priority: 'medium',
            description: `Unable to parse specific recommendations, but the ${source} documentation has issues with answer quality`,
            affectedTopics: poorCases.slice(0, 3).map((c) => c.query),
          },
        ];
      }
    } catch (error) {
      logger.error(`Error generating content recommendations: ${error}`);
      return [
        {
          type: 'content',
          priority: 'medium',
          description: `Error generating recommendations for ${source} documentation`,
          affectedTopics: [],
        },
      ];
    }
  }

  /**
   * Generate recommendations for a specific test case
   * @param testCase Test case
   * @param documents Retrieved documents
   * @param answer Generated answer
   * @param metrics Test case metrics
   * @returns Recommendations for this test case
   */
  private async generateTestCaseRecommendations(
    testCase: TestCase,
    documents: Document[],
    answer: string,
    metrics: TestCaseMetrics,
  ): Promise<string[]> {
    if (
      metrics.isAnswered &&
      metrics.clarityScore > 0.7 &&
      metrics.sourceAlignment > 0.7 &&
      (metrics.contentSatisfaction === undefined ||
        metrics.contentSatisfaction > 0.7)
    ) {
      // No significant issues found
      return [];
    }

    try {
      let prompt = `
You are an expert documentation analyst. Based on the following information, provide 1-3 specific recommendations to improve how the documentation answers this query:

Query: ${testCase.query}
Expected Topics: ${testCase.expectedTopics.join(', ')}
${testCase.expectedContent ? `Expected Content: The answer should ${testCase.expectedContent}` : ''}
Retrieved Document Count: ${documents.length}
Answer Metrics:
- Is Answered: ${metrics.isAnswered}${!metrics.isAnswered && metrics.notAnsweredReason ? ` (Reason: ${metrics.notAnsweredReason})` : ''}
- Clarity Score: ${metrics.clarityScore.toFixed(2)}
- Source Alignment: ${metrics.sourceAlignment.toFixed(2)}
${metrics.contentSatisfaction !== undefined ? `- Content Satisfaction: ${metrics.contentSatisfaction.toFixed(2)}` : ''}
${metrics.contentFeedback ? `- Content Feedback: ${metrics.contentFeedback}` : ''}
Answer Preview: ${answer.substring(0, 200)}...

Provide specific, actionable recommendations for improving the documentation to better address this query.
`;

      const result = await this.evaluationLLM.invoke([
        new SystemMessage(
          'You are an expert documentation analyst. Provide concise, actionable recommendations.',
        ),
        new HumanMessage(prompt),
      ]);

      const response = result.content.toString();

      // Extract recommendations (either as a list or separate paragraphs)
      const recommendations = response
        .split(/\n+/)
        .filter(
          (line) =>
            line.trim().length > 0 &&
            (line.trim().startsWith('-') ||
              line.trim().startsWith('*') ||
              /^\d+\./.test(line.trim())),
        )
        .map((line) =>
          line
            .trim()
            .replace(/^[-*]\s+/, '')
            .replace(/^\d+\.\s+/, ''),
        );

      return recommendations.length > 0
        ? recommendations
        : [response.substring(0, 200)]; // Use the beginning of the response if no list found
    } catch (error) {
      logger.error(`Error generating test case recommendations: ${error}`);
      return [];
    }
  }

  /**
   * Generate recommendations based on comparison between baseline and current results
   * @param baseline Baseline test results
   * @param current Current test results
   * @param improvements Identified improvements
   * @param regressions Identified regressions
   * @returns Recommendations based on comparison
   */
  private async generateComparisonRecommendations(
    baseline: TestResults,
    current: TestResults,
    improvements: string[],
    regressions: string[],
  ): Promise<DocumentationRecommendation[]> {
    if (regressions.length === 0) {
      return [];
    }

    try {
      // Find the most regressed cases
      const regressionCases: Array<{
        query: string;
        baselineMetrics: any;
        currentMetrics: any;
        difference: number;
      }> = [];

      // Compare each test case
      current.caseResults.forEach((currentResult) => {
        const baselineResult = baseline.caseResults.find(
          (r) => r.query === currentResult.query,
        );

        if (!baselineResult) return;

        // Calculate an overall regression score
        const wasAnswered = baselineResult.metrics.isAnswered ? 1 : 0;
        const isAnswered = currentResult.metrics.isAnswered ? 1 : 0;
        const answerDiff = isAnswered - wasAnswered;

        const clarityDiff =
          currentResult.metrics.clarityScore -
          baselineResult.metrics.clarityScore;

        const alignmentDiff =
          currentResult.metrics.sourceAlignment -
          baselineResult.metrics.sourceAlignment;

        // Calculate content satisfaction diff if available
        const contentSatisfactionDiff =
          currentResult.metrics.contentSatisfaction !== undefined &&
          baselineResult.metrics.contentSatisfaction !== undefined
            ? currentResult.metrics.contentSatisfaction -
              baselineResult.metrics.contentSatisfaction
            : 0;

        // Weight being answered most heavily, then include content satisfaction if available
        const overallDiff =
          (answerDiff * 2 +
            clarityDiff +
            alignmentDiff +
            contentSatisfactionDiff) /
          (currentResult.metrics.contentSatisfaction !== undefined ? 5 : 4);

        if (overallDiff < -0.1) {
          regressionCases.push({
            query: currentResult.query,
            baselineMetrics: baselineResult.metrics,
            currentMetrics: currentResult.metrics,
            difference: overallDiff,
          });
        }
      });

      // Sort by regression severity
      regressionCases.sort((a, b) => a.difference - b.difference);

      // Generate recommendations for top regressions
      const prompt = `
You are an expert documentation analyst. You need to provide recommendations based on the comparison between baseline and current documentation performance:

Source: ${current.focus}
Baseline Version: ${baseline.version}
Current Version: ${current.version}

Improvements:
${improvements.length > 0 ? improvements.join('\n') : 'None'}

Regressions:
${regressions.join('\n')}

Top Regression Cases:
${JSON.stringify(regressionCases.slice(0, 3), null, 2)}

Provide 2-3 specific recommendations to address the regressions. For each recommendation:
1. Clearly describe the regression issue
2. Suggest how to fix it
3. Rate priority as high, medium, or low based on severity

Format as JSON with the following structure (output ONLY valid JSON):
[
  {
    "type": "content|structure|terminology|examples",
    "priority": "high|medium|low",
    "description": "Description of the regression issue and recommendation",
    "examples": ["Example 1", "Example 2"],
    "affectedTopics": ["Topic1", "Topic2"]
  },
  ...
]
`;

      const result = await this.evaluationLLM.invoke([
        new SystemMessage(
          'You are an expert documentation analyst. Provide recommendations in valid JSON format only.',
        ),
        new HumanMessage(prompt),
      ]);

      const response = result.content.toString().trim();

      // Extract JSON (in case the LLM added other text)
      let jsonMatch = response.match(/```json\n([\s\S]*?)\n```/);
      let jsonStr;

      if (jsonMatch && jsonMatch[1]) {
        // Extract the content inside the code block
        jsonStr = jsonMatch[1];
      } else {
        // Fallback to looking for JSON object directly
        jsonMatch = response.match(/(\{[\s\S]*\})/);
        if (!jsonMatch) {
          logger.warn(`Could not extract JSON from LLM response: ${response}`);
          return [];
        }
        jsonStr = jsonMatch[1];
      }

      try {
        const recommendations = JSON.parse(
          jsonStr,
        ) as DocumentationRecommendation[];
        return recommendations;
      } catch (parseError) {
        logger.error(
          `Error parsing comparison recommendations JSON: ${parseError}`,
        );
        return [
          {
            type: 'content',
            priority: 'high',
            description: `The ${current.focus} documentation has regressed since ${baseline.version}. Address the identified regressions.`,
            affectedTopics: regressionCases.slice(0, 3).map((c) => c.query),
          },
        ];
      }
    } catch (error) {
      logger.error(`Error generating comparison recommendations: ${error}`);
      return [];
    }
  }

  /**
   * Generate summary from test results
   * @param results Test results
   * @param recommendations Generated recommendations
   * @returns Summary text
   */
  private async generateSummary(
    results: TestResults,
    recommendations: DocumentationRecommendation[],
  ): Promise<string> {
    try {
      const highPriorityCount = recommendations.filter(
        (r) => r.priority === 'high',
      ).length;
      const mediumPriorityCount = recommendations.filter(
        (r) => r.priority === 'medium',
      ).length;
      const lowPriorityCount = recommendations.filter(
        (r) => r.priority === 'low',
      ).length;

      let prompt = `
Summarize the documentation quality test results for ${results.focus} (version ${results.version}):

Test Cases: ${results.caseResults.length}
Overall Metrics:
- Percentage Answered: ${(results.metrics.overall.percentAnswered * 100).toFixed(2)}%
- Clarity Score: ${results.metrics.overall.avgClarityScore.toFixed(2)}
- Source Alignment: ${results.metrics.overall.avgSourceAlignment.toFixed(2)}
`;

      if (results.metrics.overall.avgContentSatisfaction !== undefined) {
        prompt += `- Content Satisfaction: ${results.metrics.overall.avgContentSatisfaction.toFixed(2)}\n`;
      }

      prompt += `
Recommendations:
- High Priority: ${highPriorityCount}
- Medium Priority: ${mediumPriorityCount}
- Low Priority: ${lowPriorityCount}

Provide a concise 2-3 paragraph summary of the test results, highlighting strengths, weaknesses, and the most important recommendations. Be constructive and actionable.
`;

      const result = await this.evaluationLLM.invoke([
        new SystemMessage(
          'You are an expert documentation analyst. Provide a concise, constructive summary.',
        ),
        new HumanMessage(prompt),
      ]);

      return result.content.toString();
    } catch (error) {
      logger.error(`Error generating summary: ${error}`);
      let summaryText = `Documentation quality test results for ${results.focus} (version ${results.version}) show that ${(results.metrics.overall.percentAnswered * 100).toFixed(2)}% of questions were answered with an average clarity score of ${results.metrics.overall.avgClarityScore.toFixed(2)} and source alignment of ${results.metrics.overall.avgSourceAlignment.toFixed(2)}.`;

      if (results.metrics.overall.avgContentSatisfaction !== undefined) {
        summaryText += ` Content satisfaction score is ${results.metrics.overall.avgContentSatisfaction.toFixed(2)}.`;
      }

      summaryText += ` ${recommendations.length} recommendations were generated to improve documentation quality.`;

      return summaryText;
    }
  }

  /**
   * Generate summary comparing baseline and current results
   * @param baseline Baseline test results
   * @param current Current test results
   * @param improvements Identified improvements
   * @param regressions Identified regressions
   * @returns Comparison summary
   */
  private async generateComparisonSummary(
    baseline: TestResults,
    current: TestResults,
    improvements: string[],
    regressions: string[],
  ): Promise<string> {
    try {
      let prompt = `
Summarize the comparison between baseline and current documentation test results:

Source: ${current.focus}
Baseline Version: ${baseline.version}
Current Version: ${current.version}

Baseline Metrics:
- Percentage Answered: ${(baseline.metrics.overall.percentAnswered * 100).toFixed(2)}%
- Clarity Score: ${baseline.metrics.overall.avgClarityScore.toFixed(2)}
- Source Alignment: ${baseline.metrics.overall.avgSourceAlignment.toFixed(2)}
`;

      if (baseline.metrics.overall.avgContentSatisfaction !== undefined) {
        prompt += `- Content Satisfaction: ${baseline.metrics.overall.avgContentSatisfaction.toFixed(2)}\n`;
      }

      prompt += `
Current Metrics:
- Percentage Answered: ${(current.metrics.overall.percentAnswered * 100).toFixed(2)}%
- Clarity Score: ${current.metrics.overall.avgClarityScore.toFixed(2)}
- Source Alignment: ${current.metrics.overall.avgSourceAlignment.toFixed(2)}
`;

      if (current.metrics.overall.avgContentSatisfaction !== undefined) {
        prompt += `- Content Satisfaction: ${current.metrics.overall.avgContentSatisfaction.toFixed(2)}\n`;
      }

      prompt += `
Improvements:
${improvements.length > 0 ? improvements.join('\n') : 'None'}

Regressions:
${regressions.length > 0 ? regressions.join('\n') : 'None'}

Provide a concise 2-3 paragraph summary comparing the baseline and current versions, highlighting key changes, improvements, and areas that need attention. Be constructive and actionable.
`;

      const result = await this.evaluationLLM.invoke([
        new SystemMessage(
          'You are an expert documentation analyst. Provide a concise, constructive comparison summary.',
        ),
        new HumanMessage(prompt),
      ]);

      return result.content.toString();
    } catch (error) {
      logger.error(`Error generating comparison summary: ${error}`);
      let comparisonText = `Comparison between ${baseline.version} and ${current.version} of ${current.focus} documentation shows ${improvements.length} improvements and ${regressions.length} regressions. The percentage of answered questions changed from ${(baseline.metrics.overall.percentAnswered * 100).toFixed(2)}% to ${(current.metrics.overall.percentAnswered * 100).toFixed(2)}%, clarity score from ${baseline.metrics.overall.avgClarityScore.toFixed(2)} to ${current.metrics.overall.avgClarityScore.toFixed(2)}, and source alignment from ${baseline.metrics.overall.avgSourceAlignment.toFixed(2)} to ${current.metrics.overall.avgSourceAlignment.toFixed(2)}.`;

      if (
        baseline.metrics.overall.avgContentSatisfaction !== undefined &&
        current.metrics.overall.avgContentSatisfaction !== undefined
      ) {
        comparisonText += ` Content satisfaction changed from ${baseline.metrics.overall.avgContentSatisfaction.toFixed(2)} to ${current.metrics.overall.avgContentSatisfaction.toFixed(2)}.`;
      }

      return comparisonText;
    }
  }

  /**
   * Determine if a test case passed based on the given thresholds
   * @param metrics Test case metrics
   * @param thresholds Thresholds for determining pass/fail
   * @returns Whether the test case passed
   */
  private testCasePassed(
    metrics: TestCaseMetrics,
    thresholds: {
      isAnswered: boolean;
      clarityScore: number;
      sourceAlignment: number;
      contentSatisfaction: number;
    },
  ): boolean {
    // If isAnswered is required but the question wasn't answered, fail
    if (thresholds.isAnswered && !metrics.isAnswered) {
      return false;
    }

    // Check clarity and source alignment
    if (
      metrics.clarityScore < thresholds.clarityScore ||
      metrics.sourceAlignment < thresholds.sourceAlignment
    ) {
      return false;
    }

    // Check content satisfaction if it exists
    if (
      metrics.contentSatisfaction !== undefined &&
      metrics.contentSatisfaction < thresholds.contentSatisfaction
    ) {
      return false;
    }

    return true;
  }

  /**
   * Print detailed test results with PASS/FAIL status for each test case
   * @param results Test results
   * @param thresholds Thresholds for determining pass/fail
   */
  private printDetailedTestResults(
    results: TestResults,
    thresholds: {
      isAnswered: boolean;
      clarityScore: number;
      sourceAlignment: number;
      contentSatisfaction: number;
    },
  ): void {
    // ANSI color codes for terminal output
    const GREEN = '\x1b[32m';
    const RED = '\x1b[31m';
    const YELLOW = '\x1b[33m';
    const RESET = '\x1b[0m';
    const BOLD = '\x1b[1m';

    console.log(
      `\n${BOLD}Test Results for ${results.focus} (${results.version})${RESET}\n`,
    );
    console.log(`${BOLD}Overall Metrics:${RESET}`);
    console.log(
      `- Percentage Answered: ${results.metrics.overall.percentAnswered * 100}%`,
    );
    console.log(
      `- Avg Clarity Score: ${results.metrics.overall.avgClarityScore.toFixed(2)}`,
    );
    console.log(
      `- Avg Source Alignment: ${results.metrics.overall.avgSourceAlignment.toFixed(2)}`,
    );
    if (results.metrics.overall.avgContentSatisfaction !== undefined) {
      console.log(
        `- Avg Content Satisfaction: ${results.metrics.overall.avgContentSatisfaction.toFixed(2)}`,
      );
    }

    const passedCount = results.caseResults.filter((result) =>
      this.testCasePassed(result.metrics, thresholds),
    ).length;
    const failedCount = results.caseResults.length - passedCount;

    console.log(
      `\n${BOLD}Summary:${RESET} ${GREEN}${passedCount} passed${RESET}, ${failedCount > 0 ? `${RED}${failedCount} failed${RESET}` : `${failedCount} failed`}`,
    );

    console.log(`\n${BOLD}Individual Test Results:${RESET}`);
    results.caseResults.forEach((result, index) => {
      const passed = this.testCasePassed(result.metrics, thresholds);
      const status = passed ? `${GREEN}PASSED${RESET}` : `${RED}FAILED${RESET}`;

      console.log(`\n${index + 1}. ${status} - ${BOLD}${result.query}${RESET}`);

      // Display metrics
      console.log(
        `   Is Answered: ${result.metrics.isAnswered ? `${GREEN}Yes${RESET}` : `${RED}No${RESET}${result.metrics.notAnsweredReason ? ` (${result.metrics.notAnsweredReason})` : ''}`}`,
      );

      const clarityColor =
        result.metrics.clarityScore >= thresholds.clarityScore
          ? GREEN
          : result.metrics.clarityScore >= thresholds.clarityScore * 0.8
            ? YELLOW
            : RED;
      console.log(
        `   Clarity: ${clarityColor}${result.metrics.clarityScore.toFixed(2)}${RESET}`,
      );

      const alignmentColor =
        result.metrics.sourceAlignment >= thresholds.sourceAlignment
          ? GREEN
          : result.metrics.sourceAlignment >= thresholds.sourceAlignment * 0.8
            ? YELLOW
            : RED;
      console.log(
        `   Source Alignment: ${alignmentColor}${result.metrics.sourceAlignment.toFixed(2)}${RESET}`,
      );

      if (result.metrics.contentSatisfaction !== undefined) {
        const contentColor =
          result.metrics.contentSatisfaction >= thresholds.contentSatisfaction
            ? GREEN
            : result.metrics.contentSatisfaction >=
                thresholds.contentSatisfaction * 0.8
              ? YELLOW
              : RED;
        console.log(
          `   Content Satisfaction: ${contentColor}${result.metrics.contentSatisfaction.toFixed(2)}${RESET}`,
        );

        if (result.metrics.contentFeedback) {
          console.log(`   Content Feedback: ${result.metrics.contentFeedback}`);
        }
      }

      // If failed, show recommendations
      if (
        !passed &&
        result.recommendations &&
        result.recommendations.length > 0
      ) {
        console.log(`   ${YELLOW}Recommendations:${RESET}`);
        result.recommendations.forEach((rec, i) => {
          console.log(`   ${i + 1}. ${rec}`);
        });
        // Show what the answer was
        console.log(` ${YELLOW}Answer:${RESET} ${result.answer}`);
        // Show the title of the sources used
        console.log(
          ` ${YELLOW}Sources:${RESET} ${result.retrievedDocuments.map((s) => s.metadata.title).join(', ')}`,
        );
      }
    });

    console.log(
      `\n${BOLD}Test Completion Time:${RESET} ${new Date().toISOString()}`,
    );
  }
}
