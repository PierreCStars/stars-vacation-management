interface ErrorLogEntry {
  digest: string;
  message: string;
  stack?: string;
  url?: string;
  timestamp: string;
  userAgent?: string;
  userId?: string;
  sessionId?: string;
}

class ErrorLogger {
  private errors: Map<string, ErrorLogEntry> = new Map();

  logError(error: Error, context?: {
    url?: string;
    userId?: string;
    sessionId?: string;
    userAgent?: string;
  }) {
    const digest = (error as any)?.digest || this.generateDigest();
    const entry: ErrorLogEntry = {
      digest,
      message: error.message,
      stack: error.stack,
      url: context?.url,
      timestamp: new Date().toISOString(),
      userAgent: context?.userAgent,
      userId: context?.userId,
      sessionId: context?.sessionId,
    };

    this.errors.set(digest, entry);
    
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('🚨 Error Logged:', {
        digest,
        message: error.message,
        stack: error.stack,
        url: context?.url,
        timestamp: entry.timestamp
      });
    }

    // In production, you might want to send this to an external service
    if (process.env.NODE_ENV === 'production') {
      console.error('Production Error:', JSON.stringify(entry, null, 2));
    }

    return digest;
  }

  getError(digest: string): ErrorLogEntry | undefined {
    return this.errors.get(digest);
  }

  getAllErrors(): ErrorLogEntry[] {
    return Array.from(this.errors.values());
  }

  private generateDigest(): string {
    return Math.random().toString(36).substring(2, 15);
  }
}

export const errorLogger = new ErrorLogger();







