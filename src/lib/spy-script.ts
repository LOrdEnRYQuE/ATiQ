/**
 * Spy Script - Runtime Error Detection System
 * Injects into preview iframe to capture runtime errors and report them to parent window
 */

export interface SpyScriptConfig {
  enableConsoleCapture?: boolean
  enableNetworkErrorCapture?: boolean
  enablePerformanceMonitoring?: boolean
}

export const generateSpyScript = (config: SpyScriptConfig = {}): string => {
  const {
    enableConsoleCapture = true,
    enableNetworkErrorCapture = true,
    enablePerformanceMonitoring = false
  } = config

  return `
(function() {
  'use strict';
  
  // Prevent multiple injections
  if (window.__ATIQ_SPY_INSTALLED__) return;
  window.__ATIQ_SPY_INSTALLED__ = true;
  
  // Error reporting function
  function reportError(type, payload) {
    try {
      window.parent.postMessage({
        type: 'ATIQ_PREVIEW_ERROR',
        payload: {
          type: type,
          timestamp: Date.now(),
          url: window.location.href,
          userAgent: navigator.userAgent,
          ...payload
        }
      }, '*');
    } catch (e) {
      // Fallback: try to log to console
      console.error('[ATIQ Spy] Failed to report error:', e);
    }
  }
  
  // Enhanced JavaScript error handler
  window.onerror = function(message, source, lineno, colno, error) {
    reportError('javascript', {
      message: String(message),
      source: source || 'unknown',
      line: lineno,
      column: colno,
      stack: error ? error.stack : '',
      severity: 'error'
    });
    
    // Don't prevent default error handling
    return false;
  };
  
  // Unhandled Promise Rejection handler
  window.onunhandledrejection = function(event) {
    reportError('promise', {
      message: 'Unhandled Promise Rejection: ' + String(event.reason),
      reason: String(event.reason),
      stack: event.reason && event.reason.stack ? event.reason.stack : '',
      severity: 'error'
    });
  };
  
  ${enableConsoleCapture ? `
  // Console error capture
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  console.error = function(...args) {
    reportError('console', {
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      args: args.map(arg => String(arg)),
      severity: 'error'
    });
    
    // Call original console.error
    return originalConsoleError.apply(console, args);
  };
  
  console.warn = function(...args) {
    reportError('console', {
      message: args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' '),
      args: args.map(arg => String(arg)),
      severity: 'warning'
    });
    
    // Call original console.warn
    return originalConsoleWarn.apply(console, args);
  };
  ` : ''}
  
  ${enableNetworkErrorCapture ? `
  // Network error capture
  const originalFetch = window.fetch;
  window.fetch = function(...args) {
    return originalFetch.apply(this, args)
      .catch(error => {
        reportError('network', {
          message: 'Network request failed: ' + error.message,
          url: args[0],
          method: args[1] ? args[1].method || 'GET' : 'GET',
          stack: error.stack || '',
          severity: 'error'
        });
        throw error;
      });
  };
  
  // XMLHttpRequest error capture
  const originalXHROpen = XMLHttpRequest.prototype.open;
  const originalXHRSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._atiqMethod = method;
    this._atiqUrl = url;
    return originalXHROpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('error', function() {
      reportError('network', {
        message: 'XMLHttpRequest failed',
        method: this._atiqMethod || 'GET',
        url: this._atiqUrl || 'unknown',
        status: this.status,
        statusText: this.statusText,
        severity: 'error'
      });
    });
    
    return originalXHRSend.apply(this, args);
  };
  ` : ''}
  
  ${enablePerformanceMonitoring ? `
  // Performance monitoring
  if (window.performance && window.performance.timing) {
    window.addEventListener('load', function() {
      setTimeout(function() {
        const timing = window.performance.timing;
        const loadTime = timing.loadEventEnd - timing.navigationStart;
        
        if (loadTime > 5000) { // Report slow loads
          reportError('performance', {
            message: 'Slow page load detected',
            loadTime: loadTime,
            domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
            severity: 'warning'
          });
        }
      }, 1000);
    });
  }
  ` : ''}
  
  // React Error Boundary helper
  window.__ATIQ_CAPTURE_REACT_ERROR = function(error, errorInfo) {
    reportError('react', {
      message: 'React Error Boundary caught an error',
      error: error.toString(),
      stack: error.stack || '',
      componentStack: errorInfo.componentStack || '',
      severity: 'error'
    });
  };
  
  // Vue Error Handler helper
  window.__ATIQ_CAPTURE_VUE_ERROR = function(err, vm, info) {
    reportError('vue', {
      message: 'Vue error handler caught an error',
      error: err.toString(),
      stack: err.stack || '',
      info: info,
      severity: 'error'
    });
  };
  
  // Health check - tell parent we're alive
  reportError('system', {
    message: 'ATIQ Spy Script initialized successfully',
    severity: 'info'
  });
  
})();
`
}

/**
 * Injects spy script into HTML content
 */
export const injectSpyScript = (html: string, config?: SpyScriptConfig): string => {
  const spyScript = generateSpyScript(config)
  
  // Try to inject after <head> or at the beginning of <body>
  const headMatch = html.match(/<head[^>]*>/i)
  if (headMatch) {
    const insertIndex = html.indexOf(headMatch[0]) + headMatch[0].length
    return html.slice(0, insertIndex) + 
           `\n<script>${spyScript}</script>\n` + 
           html.slice(insertIndex)
  }
  
  // Fallback: inject at the beginning of the file
  return `<script>${spyScript}</script>\n${html}`
}

/**
 * Validates if spy script is already injected
 */
export const hasSpyScript = (html: string): boolean => {
  return html.includes('__ATIQ_SPY_INSTALLED__') || 
         html.includes('ATIQ_PREVIEW_ERROR')
}
