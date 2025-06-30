# Logging Policy

This document outlines the logging standards and policies for the 3D Building Designer application.

## Overview

The application uses a centralized logging utility (`src/utils/logger.ts`) that automatically adjusts logging behavior based on the environment (development vs production).

## Logging Levels

- **Debug**: Detailed information for debugging (development only)
- **Info**: General information about application flow
- **Warn**: Warning conditions that should be monitored
- **Error**: Error conditions that need immediate attention
- **None**: Disable all logging

## Environment Behavior

### Development Mode (`npm run dev`)
- **Level**: `debug` (all logs shown)
- **Console**: Enabled
- **Persistence**: Disabled

### Production Mode (`npm run build`)
- **Level**: `warn` (only warnings and errors)
- **Console**: Disabled
- **Persistence**: Disabled (could be enabled for error tracking)

### Test Mode (`npm run test`)
- **Level**: `debug`
- **Console**: Mocked (no actual output)
- **Persistence**: Disabled

## Usage Guidelines

### Import and Use
```typescript
import { logger } from '../utils/logger';

// Debug information (development only)
logger.debug('Service initialized', { serviceType: 'BuildingService' });

// General information
logger.info('User action completed', { action: 'buildingCreated', id: building.id });

// Warnings (shown in production)
logger.warn('Feature deprecated', { feature: 'oldMethod', replacement: 'newMethod' });

// Errors (always shown)
logger.error('Failed to load resource', { resource: 'model.3dm', error: error.message });
```

### When to Use Each Level

#### Debug (`logger.debug`)
- Service initialization details
- State changes during development
- Performance measurements
- Detailed flow tracking
- Temporary debugging information

#### Info (`logger.info`)
- User actions completed
- Major state transitions
- Configuration changes
- System status updates

#### Warn (`logger.warn`)
- Deprecated feature usage
- Non-critical errors with fallbacks
- Performance concerns
- Configuration issues with defaults
- Feature limitations reached

#### Error (`logger.error`)
- Failed operations
- Network failures
- File loading errors
- Critical system failures
- Unhandled exceptions

## What NOT to Log

### Avoid in Production
- Sensitive user data
- Authentication tokens
- Detailed internal state
- High-frequency events (mouse movements, frame updates)
- Large data objects

### Performance Considerations
- Avoid logging in animation loops
- Don't log every iteration of loops
- Use appropriate log levels to reduce noise
- Consider performance impact of data serialization

## Migration from console.*

### Replace Patterns
```typescript
// OLD: Direct console usage
console.log('User clicked building', building);
console.error('Failed to load', error);

// NEW: Using logger
logger.info('User clicked building', { buildingId: building.id });
logger.error('Failed to load resource', { error: error.message });
```

### Special Cases
```typescript
// OLD: Development-only logs
if (import.meta.env.DEV) {
  console.log('Debug info');
}

// NEW: Use debug level (automatically filtered)
logger.debug('Debug info');
```

## Configuration

The logger can be reconfigured at runtime:

```typescript
import { logger } from '../utils/logger';

// Enable more verbose logging
logger.configure({
  level: 'debug',
  enableConsole: true
});

// Production error tracking
logger.configure({
  level: 'error',
  enablePersistence: true,
  maxLogEntries: 5000
});
```

## Error Reporting

In production, errors should be captured and potentially sent to monitoring services:

```typescript
logger.error('Critical system failure', {
  error: error.message,
  stack: error.stack,
  userId: user.id,
  timestamp: new Date().toISOString()
});

// Get log buffer for error reporting
const recentLogs = logger.getLogBuffer();
```

## Best Practices

1. **Use structured logging**: Pass objects instead of string concatenation
2. **Include context**: Add relevant IDs, states, and metadata
3. **Be concise**: Clear, actionable messages
4. **Avoid logging secrets**: Never log passwords, tokens, or sensitive data
5. **Use appropriate levels**: Match the severity to the log level
6. **Test log output**: Verify logs provide useful information without noise

## Compliance

- All production builds should have minimal console output
- Sensitive information must never be logged
- Log levels should be appropriate for the target environment
- Performance impact should be considered for all logging calls
