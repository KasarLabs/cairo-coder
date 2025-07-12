import * as fs from 'node:fs';
import * as path from 'node:path';
import { axGlobals } from '@ax-llm/ax';
import { trace } from '@opentelemetry/api';
import {
  defaultResource,
  resourceFromAttributes,
} from '@opentelemetry/resources';
import {
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from '@opentelemetry/semantic-conventions';
import {
  BasicTracerProvider,
  BatchSpanProcessor,
  type SpanProcessor,
  type ReadableSpan,
  type SpanExporter,
} from '@opentelemetry/sdk-trace-base';
import { initializeOTEL } from 'langsmith/experimental/otel/setup';
import { LangSmithOTLPTraceExporter } from 'langsmith/experimental/otel/exporter';
import { logger } from '../utils';
import { ExportResult } from '@opentelemetry/core';

/**
 * Tracing Configuration
 *
 * This module provides OpenTelemetry-based tracing for the Cairo Coder agents,
 * with optional LangSmith integration for LLM observability.
 *
 * Features:
 * - OpenTelemetry Integration: Standard OTEL-based tracing for all operations, allowing detailed monitoring of spans and traces.
 * - LangSmith Support: Automatic integration when `LANGSMITH_API_KEY` is set, providing LLM-specific visualization and analysis.
 * - File Export: All traces can be exported to `traces.json` in JSON Lines format for local debugging and analysis (intended only for development, not production use).
 * - Streaming Aggregation: Combines multiple streaming response chunks into a single completion attribute for clearer trace visualization.
 * - Operation Filtering: Automatically excludes embedding operations from LangSmith exports to reduce noise and focus on relevant traces.
 *
 * Configuration:
 * Environment Variables:
 * - `LANGSMITH_ENDPOINT`: Sets the LangSmith endpoint URL.
 * - `LANGSMITH_API_KEY`: Enables LangSmith integration for advanced LLM observability and debugging.
 * - `LOG_LEVEL`: (Optional) Sets the logging level (default: debug) for tracer-related logs.
 *
 * Usage:
 * The tracing system is automatically initialized when the LLM router is created. No manual calls are needed:
 *
 * ```typescript
 * import { getAxRouter } from './config/llm';
 *
 * // Tracing is initialized automatically inside getAxRouter
 * const router = getAxRouter();
 * ```
 *
 * Debugging:
 * All traces are always written to `traces.json` in JSON Lines format for easy local inspection:
 *
 * ```bash
 * # View recent traces
 * tail -f traces.json | jq .
 *
 * # Filter by specific operation name (e.g., chat operations)
 * grep "gen_ai.chat" traces.json | jq .
 * ```
 *
 * Trace Attributes:
 * Common attributes included in exported traces for better analysis:
 * - `gen_ai.operation.name`: Indicates the type of LLM operation (e.g., 'chat', 'embeddings').
 * - `gen_ai.completion`: Aggregated completion text from responses, especially useful for streaming calls.
 * - `gen_ai.prompt`: The input prompt sent to the LLM.
 * - `gen_ai.usage.*`: Token usage metrics, including input, output, and total tokens.
 *
 * Notes:
 * - File export is always enabled for debugging but should be disabled in production if not needed.
 * - LangSmith integration filters out embeddings to keep traces focused on core operations.
 */

/**
 * Configuration for file-based span export
 */
interface FileExporterConfig {
  filePath: string;
  append?: boolean;
}

/**
 * Configuration for LangSmith tracing integration
 */
interface LangSmithConfig {
  apiKey: string;
  url?: string;
}

/**
 * Default LangSmith OTEL endpoint
 */
const DEFAULT_LANGSMITH_URL = 'https://api.smith.langchain.com/otel/v1/traces';

/**
 * Transforms streaming response chunks into a single completion attribute
 * for better visualization in LangSmith UI. This processes gen_ai.choice events,
 * aggregates their content, and removes individual choice events to reduce noise.
 */
function transformStreamingSpan(span: ReadableSpan): ReadableSpan {
  if (!span.events) return span;

  let fullCompletionContent = '';
  const otherEvents = [];

  for (const event of span.events) {
    // Check if the event is a choice event from a streaming response
    if (
      event.name === 'gen_ai.choice' &&
      typeof event.attributes?.message === 'string'
    ) {
      try {
        // The 'message' attribute is a stringified JSON
        const messageData = JSON.parse(event.attributes.message as string);
        if (typeof messageData.content === 'string') {
          fullCompletionContent += messageData.content;
        }
      } catch (e) {
        logger.error(
          'Failed to parse message attribute in gen_ai.choice event:',
          e,
        );
        otherEvents.push(event);
      }
    } else {
      // Keep all other events (system/user messages, usage, etc.)
      otherEvents.push(event);
    }
  }

  // Add aggregated content to span attributes
  if (fullCompletionContent) {
    span.attributes['gen_ai.completion'] = fullCompletionContent;
    // Replace noisy choice events with cleaned list
    (span as any).events = otherEvents;
  }

  return span;
}

/**
 * Exports OpenTelemetry spans to a JSON Lines file for debugging and analysis.
 * This exporter is intended only for development and debugging purposes,
 * not for production environments where it may impact performance.
 */
class FileSpanExporter implements SpanExporter {
  private readonly filePath: string;
  private writeStream: fs.WriteStream;

  constructor(config: FileExporterConfig) {
    this.filePath = config.filePath;

    // Ensure directory exists
    const dir = path.dirname(this.filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    // Create write stream
    this.writeStream = fs.createWriteStream(this.filePath, {
      flags: config.append !== false ? 'a' : 'w',
    });
  }

  export(
    spans: ReadableSpan[],
    resultCallback: (result: ExportResult) => void,
  ): void {
    try {
      for (const span of spans) {
        const spanData = this.serializeSpan(span);
        // Write as JSON Lines format (one JSON object per line)
        this.writeStream.write(`${JSON.stringify(spanData)}\n`);
      }

      resultCallback({ code: 0 }); // Success
    } catch (error) {
      logger.error('Failed to export spans to file:', error);
      resultCallback({ code: 1, error: error as Error });
    }
  }

  async shutdown(): Promise<void> {
    return new Promise((resolve) => {
      this.writeStream.end(() => {
        resolve();
      });
    });
  }

  private serializeSpan(span: ReadableSpan): Record<string, any> {
    return {
      traceId: span.spanContext().traceId,
      spanId: span.spanContext().spanId,
      parentSpanId: span.parentSpanContext?.spanId || null,
      name: span.name,
      kind: span.kind,
      startTime: span.startTime,
      endTime: span.endTime,
      attributes: span.attributes,
      events: span.events,
      status: span.status,
      resource: span.resource.attributes,
      instrumentationScope: {
        name: span.instrumentationScope.name,
        version: span.instrumentationScope.version,
      },
    };
  }
}

/**
 * Span processor that filters out specific operations (e.g., embeddings)
 * to reduce noise in tracing output before exporting.
 */
class FilteringSpanProcessor extends BatchSpanProcessor {
  private readonly filterOperations: string[];

  constructor(exporter: any, filterOperations: string[] = ['embeddings']) {
    super(exporter);
    this.filterOperations = filterOperations;
  }

  onEnd(span: ReadableSpan): void {
    const operation = span.attributes['gen_ai.operation.name'];

    // Skip exporting filtered operations
    if (operation && this.filterOperations.includes(operation as string)) {
      return;
    }

    super.onEnd(span);
  }
}

/**
 * Service metadata for tracing
 */
const SERVICE_INFO = {
  name: 'cairo-coder',
  version: '0.0.0',
};

/**
 * Default trace file path
 */
const DEFAULT_TRACE_FILE = './traces.json';

/**
 * Operations to filter from LangSmith traces
 */
const FILTERED_OPERATIONS = ['embeddings'];

/**
 * Initializes OpenTelemetry tracing with optional LangSmith integration.
 *
 * This sets up:
 * - File-based export for all traces (debugging only).
 * - LangSmith export if API key is provided, with filtering for noise reduction.
 * - Integration with ax-llm for tracing LLM calls.
 *
 * Tracing is non-blocking; errors are logged but do not halt execution.
 */
export function initializeTracer(enableFileExport: boolean = false): void {
  try {
    const spanProcessors: SpanProcessor[] = [];

    // Configure LangSmith integration if API key is available
    const langsmithApiKey = process.env.LANGSMITH_API_KEY;
    if (!langsmithApiKey) {
      logger.warn('LANGSMITH_API_KEY not set - LangSmith tracing disabled');
    } else {
      logger.info('Initializing LangSmith tracing integration');

      const langsmithExporter = new LangSmithOTLPTraceExporter({
        transformExportedSpan: transformStreamingSpan,
      });

      // Use filtering processor to exclude embedding operations
      const langsmithProcessor = new FilteringSpanProcessor(
        langsmithExporter,
        FILTERED_OPERATIONS,
      );

      spanProcessors.push(langsmithProcessor);
    }

    if (enableFileExport) {
      // Always enable file export for debugging
      const fileExporter = new FileSpanExporter({
        filePath: DEFAULT_TRACE_FILE,
        append: true,
      });
      const fileProcessor = new BatchSpanProcessor(fileExporter);
      spanProcessors.push(fileProcessor);
    }

    const resource = defaultResource().merge(
      resourceFromAttributes({
        [ATTR_SERVICE_NAME]: SERVICE_INFO.name,
        [ATTR_SERVICE_VERSION]: SERVICE_INFO.version,
      }),
    );

    const tracerProvider = new BasicTracerProvider({
      spanProcessors,
      resource,
    });

    // Register with OpenTelemetry
    initializeOTEL({ globalTracerProvider: tracerProvider });
    trace.setGlobalTracerProvider(tracerProvider);

    // Configure ax-llm to use our tracer
    axGlobals.tracer = trace.getTracer('global-ax-tracer');

    logger.info('Tracing initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize tracing:', error);
    // Don't throw - tracing should not break the application
  }
}
