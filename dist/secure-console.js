(function() {
  // Intercept fetch calls for room passwords
  const originalFetch = window.fetch;
  window.fetch = async function(resource, init) {
    let url = typeof resource === 'string' ? resource : (resource instanceof URL ? resource.toString() : (resource && resource.url));
    if (url && url.includes('/api/token')) {
      try {
        const urlObj = new URL(url, window.location.origin);
        const room = urlObj.searchParams.get('room');
        if (room) {
          const password = sessionStorage.getItem('room_pwd_' + room);
          if (password) {
            urlObj.searchParams.set('password', password);
            url = urlObj.toString();
            if (typeof resource === 'string') {
              resource = url;
            } else if (resource instanceof URL) {
              resource = urlObj;
            } else if (resource && typeof resource === 'object') {
              resource.url = url;
            }
          }
        }
      } catch (e) {
        console.error('Error intercepting token password:', e);
      }
    }
    return originalFetch(resource, init);
  };

  const originalLog = console.log;
  const originalWarn = console.warn;
  const originalInfo = console.info;
  const originalError = console.error;
  const originalDebug = console.debug;

  // Match JWT patterns (LiveKit token is a JWT)
  const jwtRegex = /\bey[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\b/g;
  
  // Match query parameter access_token=... or token=...
  const tokenRegex = /([?&](?:access_)?token=)[a-zA-Z0-9_\-\.\~\+]+/gi;

  function sanitize(arg) {
    if (typeof arg === 'string') {
      if (arg.includes('Fetching token') || arg.includes('Token fetched successfully')) {
        return '[REDACTED_LOG]';
      }
      return arg.replace(jwtRegex, '[REDACTED_JWT]').replace(tokenRegex, '$1[REDACTED_TOKEN]');
    }
    if (arg && typeof arg === 'object') {
      try {
        const str = JSON.stringify(arg);
        if (jwtRegex.test(str) || tokenRegex.test(str)) {
          return JSON.parse(str.replace(jwtRegex, '[REDACTED_JWT]').replace(tokenRegex, '$1[REDACTED_TOKEN]'));
        }
      } catch (e) {
        return '[SECURE_OBJECT]';
      }
    }
    return arg;
  }

  function sanitizeArgs(args) {
    return Array.from(args).map(sanitize);
  }

  console.log = function() {
    const argsStr = Array.from(arguments).join(' ');
    if (argsStr.includes('Fetching token') || argsStr.includes('Token fetched successfully')) {
      return; // Silence this completely
    }
    originalLog.apply(console, sanitizeArgs(arguments));
  };
  console.warn = function() { originalWarn.apply(console, sanitizeArgs(arguments)); };
  console.info = function() { originalInfo.apply(console, sanitizeArgs(arguments)); };
  console.error = function() { originalError.apply(console, sanitizeArgs(arguments)); };
  console.debug = function() { originalDebug.apply(console, sanitizeArgs(arguments)); };
})();
