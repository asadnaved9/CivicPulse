export interface LogContext {
  traceId?: string;
  layer: 'entry' | 'business' | 'environment' | 'instrumentation';
  component: string;
  [key: string]: any;
}

export const diagnosticLogger = {
  info: (message: string, context: LogContext) => {
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'INFO',
      message,
      ...context
    };
    console.log(JSON.stringify(payload));
  },
  warn: (message: string, context: LogContext) => {
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'WARN',
      message,
      ...context
    };
    console.warn(JSON.stringify(payload));
  },
  error: (message: string, error: unknown, context: LogContext) => {
    const errorDetails = error instanceof Error 
      ? { name: error.name, message: error.message, stack: error.stack } 
      : { raw: error };
    const payload = {
      timestamp: new Date().toISOString(),
      level: 'ERROR',
      message,
      error: errorDetails,
      ...context
    };
    console.error(JSON.stringify(payload));
  },
};
