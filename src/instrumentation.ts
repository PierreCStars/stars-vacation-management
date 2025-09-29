export async function register() {
  if (process.env.NEXT_RUNTIME === 'nodejs') {
    process.on('unhandledRejection', (reason, promise) => {
      const errorInfo = {
        type: 'unhandledRejection',
        reason: reason instanceof Error ? reason.message : String(reason),
        stack: reason instanceof Error ? reason.stack : undefined,
        promise: promise.toString(),
        timestamp: new Date().toISOString(),
        digest: Math.random().toString(36).substring(2, 15)
      };
      
      console.error('🚨 Unhandled Promise Rejection:', errorInfo);
      
      // In production, you might want to send this to an external service
      if (process.env.NODE_ENV === 'production') {
        console.error('Production Unhandled Rejection:', JSON.stringify(errorInfo, null, 2));
      }
    });

    process.on('uncaughtException', (err) => {
      const errorInfo = {
        type: 'uncaughtException',
        message: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString(),
        digest: Math.random().toString(36).substring(2, 15)
      };
      
      console.error('🚨 Uncaught Exception:', errorInfo);
      
      // In production, we might want to exit gracefully
      if (process.env.NODE_ENV === 'production') {
        console.error('Exiting due to uncaught exception');
        process.exit(1);
      }
    });

    process.on('warning', (warning) => {
      console.warn('⚠️ Node.js Warning:', {
        name: warning.name,
        message: warning.message,
        stack: warning.stack,
        timestamp: new Date().toISOString()
      });
    });

    // Add a global error handler for async operations
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Check if this looks like a Next.js error
      const message = args[0];
      if (typeof message === 'string' && message.includes('digest')) {
        console.log('🔍 Detected Next.js error with digest:', args);
      }
      originalConsoleError.apply(console, args);
    };
  }
}
