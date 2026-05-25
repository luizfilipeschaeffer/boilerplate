import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import { trace, context, SpanStatusCode } from "@opentelemetry/api";

let sdk: NodeSDK | null = null;

export type OtelSetupOptions = {
  serviceName: string;
  endpoint?: string;
  enabled?: boolean;
};

export function setupOtel(opts: OtelSetupOptions): NodeSDK | null {
  if (opts.enabled === false) return null;
  if (sdk) return sdk;

  const endpoint = opts.endpoint ?? process.env.OTEL_EXPORTER_OTLP_ENDPOINT;

  sdk = new NodeSDK({
    serviceName: opts.serviceName,
    traceExporter: endpoint
      ? new OTLPTraceExporter({ url: `${endpoint}/v1/traces` })
      : undefined,
    instrumentations: [getNodeAutoInstrumentations()],
  });

  sdk.start();
  return sdk;
}

export async function shutdownOtel(): Promise<void> {
  await sdk?.shutdown();
  sdk = null;
}

export function getTracer(name: string) {
  return trace.getTracer(name);
}

export async function withSpan<T>(
  name: string,
  fn: () => Promise<T>,
  attributes?: Record<string, string>,
): Promise<T> {
  const tracer = getTracer("boilerplate");
  return tracer.startActiveSpan(name, async (span) => {
    if (attributes) span.setAttributes(attributes);
    try {
      const result = await fn();
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (err) {
      span.setStatus({ code: SpanStatusCode.ERROR, message: (err as Error).message });
      throw err;
    } finally {
      span.end();
    }
  });
}

export function injectTraceContext(): { traceId?: string; spanId?: string } {
  const span = trace.getSpan(context.active());
  if (!span) return {};
  const ctx = span.spanContext();
  return { traceId: ctx.traceId, spanId: ctx.spanId };
}
