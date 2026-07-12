(function() {
  // Intercept fetch calls for room passwords
  const originalFetch = window.fetch;
  window.fetch = async function(resource, init) {
    let url = typeof resource === 'string' ? resource : (resource instanceof URL ? resource.toString() : (resource && resource.url));
    if (url && url.includes('/api/')) {
      try {
        const urlObj = new URL(url, window.location.origin);
        let room = urlObj.searchParams.get('room');

        // Check if room name is in the JSON request body (e.g. for POST /api/messages)
        if (!room && init && init.body && typeof init.body === 'string') {
          try {
            const bodyObj = JSON.parse(init.body);
            room = bodyObj.room;
          } catch (e) {}
        }

        if (room) {
          const password = sessionStorage.getItem('room_pwd_' + room);
          if (password) {
            // Also append query parameter to /api/token for compatibility
            if (url.includes('/api/token')) {
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

            // Securely pass room password in X-Room-Password HTTP header
            init = init || {};
            init.headers = init.headers || {};
            if (init.headers instanceof Headers) {
              init.headers.set('X-Room-Password', password);
            } else {
              init.headers['X-Room-Password'] = password;
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
