const fs = require("fs");
const path = require("path")
const v8 = require("v8")
const { JSDOM, ResourceLoader } = require("jsdom");
const { createCipheriv } = require("crypto");
const querystring = require("querystring")
const Request = require("request");
const { ppid } = require("process");
// Thêm crypto để dùng cho polyfills
const crypto = require("crypto");
// Thêm util để implement TextEncoder/TextDecoder
const util = require("util");

let DEFAULT_USERAGENT =
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36";
let PASSWORD = "webapp1.0+202106";
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
function getRandomInt(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}
class Signer {

  /**
   * @type Window
   */
  window 
  static async getInstance(userAgent){
    await delay(getRandomInt(1,10))
    while(Signer.status == "processing") {
        await delay(100)
    }
    Signer.status = "processing"
    if(!Signer.instance){
      let ins = new Signer(userAgent);
      await ins.init()
      Signer.instance = ins;
    }
     Signer.status = "done"
    return Signer.instance
  }
  constructor(userAgent = DEFAULT_USERAGENT) {

    this.webmssdk = fs.readFileSync(path.resolve( "./src/webmssdk_v4.js"), "utf-8");
    this.initjs = `let delay = (time)=> new Promise(r=>setTimeout(r,time))
        let init = async function(){
            if(window.__tsign && window.__tsign.u && window.__tsign.u[870] && window.__tsign.u[871]){
        
            window.buildUrlFull =  function ({msToken, url, bodyEncoded, bodyJson}) {
                let [ host, params] = url.split("?")
                let xbogus = window.__tsign.u[870].v(params, bodyEncoded);
                let xgnarly = window.__tsign.u[871].v(params, bodyEncoded);
                let result =  { url: url+"&X-Bogus="+xbogus+"&X-Gnarly="+xgnarly, bodyEncoded, bodyJson, xbogus, xgnarly}
                return result;
            };
            } else {
            await delay(200);
            return init()
            }
        }
        init();
    `
    const resourceLoader = new ResourceLoader({ userAgent });
    this.dom = new JSDOM("", {
      url: "https://www.tiktok.com",
      referrer: "https://www.tiktok.com",
      contentType: "text/html",
      includeNodeLocations: false,
      runScripts: "outside-only",
      pretendToBeVisual: true,
      resources: resourceLoader,
      storageQuota: 10000000

    });
    const { window } = this.dom;

    this.window = window;
  

  }
  async init() {
    this.userAgent = this.window.navigator.userAgent;
    this.appVersion =  this.userAgent.replace("'Mozilla/","")
    // Setup CanvasRenderingContext2D properly
    if (!this.window.CanvasRenderingContext2D) {
      this.window.CanvasRenderingContext2D = function() {};
      this.window.CanvasRenderingContext2D.prototype = {};
    }
    this.window.Request = Request

    // Thêm Web APIs polyfills
    this.setupWebAPIs();
    
    try {
      // Patch webmssdk để xử lý connectEnd
      let patchedWebmssdk = this.webmssdk.toString();
      
      // Thay thế các pattern có thể gây lỗi connectEnd
      patchedWebmssdk = patchedWebmssdk.replace(
        /(\w+)\.connectEnd\s*\(/g, 
        '(($1 && $1.connectEnd) || window.connectEnd)('
      );
      
      // Thay thế trường hợp object undefined gọi connectEnd
      patchedWebmssdk = patchedWebmssdk.replace(
        /undefined\.connectEnd/g,
        'window.connectEnd'
      );
      
    //   console.log('🔧 Đã patch webmssdk để xử lý connectEnd');
      
      this.window.eval(patchedWebmssdk);
      await delay(1000)
      this.window.eval(this.initjs.toString())

    } catch (error) {
      console.log("Error loading webmssdk:", error)
    }
    return true;
  }
  async getUserAgent() {
    return this.userAgent
  }

  // DISABLED - Heavy fingerprints làm lệch X-Bogus pattern
  setupBrowserFingerprintsDisabled(window) {
    console.log('🔧 DISABLED: Setting up EXACT real browser fingerprints...');

    // === SCREEN & DISPLAY (EXACT from real Chrome) === 
    Object.defineProperty(window.screen, 'width', { value: 1728, configurable: true });
    Object.defineProperty(window.screen, 'height', { value: 1117, configurable: true });
    Object.defineProperty(window.screen, 'availWidth', { value: 1728, configurable: true });
    Object.defineProperty(window.screen, 'availHeight', { value: 1021, configurable: true });
    Object.defineProperty(window.screen, 'colorDepth', { value: 30, configurable: true });
    Object.defineProperty(window.screen, 'pixelDepth', { value: 30, configurable: true });
    
    // Exact screen orientation
    window.screen.orientation = {
      type: 'landscape-primary',
      angle: 0
    };

    // === NAVIGATOR PROPERTIES (EXACT from real Chrome) ===
    Object.defineProperty(window.navigator, 'hardwareConcurrency', { value: 16, configurable: true });
    Object.defineProperty(window.navigator, 'deviceMemory', { value: 8, configurable: true });
    Object.defineProperty(window.navigator, 'maxTouchPoints', { value: 0, configurable: true });
    Object.defineProperty(window.navigator, 'languages', { 
      value: ['en-US', 'en', 'vi', 'ht'], 
      configurable: true 
    });
    Object.defineProperty(window.navigator, 'language', { value: 'en-US', configurable: true });
    Object.defineProperty(window.navigator, 'cookieEnabled', { value: true, configurable: true });
    Object.defineProperty(window.navigator, 'doNotTrack', { value: null, configurable: true });
    Object.defineProperty(window.navigator, 'onLine', { value: true, configurable: true });
    Object.defineProperty(window.navigator, 'webdriver', { value: false, configurable: true });
    
    // PDF viewer capability
    Object.defineProperty(window.navigator, 'pdfViewerEnabled', { value: true, configurable: true });

    // === WEBGL FINGERPRINTING ===
    window.WebGLRenderingContext = window.WebGLRenderingContext || function() {};
    window.WebGL2RenderingContext = window.WebGL2RenderingContext || function() {};
    
    const webglContexts = ['webgl', 'webgl2', 'experimental-webgl'];
    
    if (window.HTMLCanvasElement && window.HTMLCanvasElement.prototype.getContext) {
      const originalGetContext = window.HTMLCanvasElement.prototype.getContext;
      window.HTMLCanvasElement.prototype.getContext = function(contextType, ...args) {
        if (webglContexts.includes(contextType)) {
          return {
                                      getParameter: function(param) {
                // EXACT WebGL parameters from real Chrome
                if (param === 0x1F00) return 'WebKit'; // GL_VENDOR
                if (param === 0x1F01) return 'WebKit WebGL'; // GL_RENDERER  
                if (param === 0x1F02) return 'WebGL 1.0 (OpenGL ES 2.0 Chromium)'; // GL_VERSION
                if (param === 0x8B8C) return 'WebGL GLSL ES 1.0 (OpenGL ES GLSL ES 1.0 Chromium)'; // GL_SHADING_LANGUAGE_VERSION
                if (param === 0x84E8) return 16; // GL_MAX_TEXTURE_IMAGE_UNITS
                if (param === 0x8872) return 16; // GL_MAX_VERTEX_TEXTURE_IMAGE_UNITS
                if (param === 0x84E9) return 16; // GL_MAX_COMBINED_TEXTURE_IMAGE_UNITS
                if (param === 0x8DFB) return 4096; // GL_MAX_RENDERBUFFER_SIZE
                if (param === 0x0D33) return 4096; // GL_MAX_TEXTURE_SIZE
                if (param === 0x851C) return 1024; // GL_MAX_CUBE_MAP_TEXTURE_SIZE
                if (param === 0x8B4D) return 32; // GL_MAX_VERTEX_ATTRIBS
                if (param === 0x8B4A) return 1024; // GL_MAX_VERTEX_UNIFORM_VECTORS
                if (param === 0x8B49) return 1024; // GL_MAX_FRAGMENT_UNIFORM_VECTORS
                return null;
             },
                         getSupportedExtensions: () => [
               'ANGLE_instanced_arrays', 'EXT_blend_minmax', 'EXT_clip_control',
               'EXT_color_buffer_half_float', 'EXT_depth_clamp', 'EXT_disjoint_timer_query',
               'EXT_float_blend', 'EXT_frag_depth', 'EXT_polygon_offset_clamp',
               'EXT_shader_texture_lod', 'EXT_texture_compression_bptc', 
               'EXT_texture_compression_rgtc', 'EXT_texture_filter_anisotropic',
               'EXT_texture_mirror_clamp_to_edge', 'EXT_sRGB', 'KHR_parallel_shader_compile',
               'OES_element_index_uint', 'OES_fbo_render_mipmap', 'OES_standard_derivatives',
               'OES_texture_float', 'OES_texture_float_linear', 'OES_texture_half_float',
               'OES_texture_half_float_linear', 'OES_vertex_array_object', 
               'WEBGL_blend_func_extended', 'WEBGL_color_buffer_float',
               'WEBGL_compressed_texture_astc', 'WEBGL_compressed_texture_etc',
               'WEBGL_compressed_texture_etc1', 'WEBGL_compressed_texture_pvrtc',
               'WEBGL_compressed_texture_s3tc', 'WEBGL_compressed_texture_s3tc_srgb',
               'WEBGL_debug_renderer_info', 'WEBGL_debug_shaders', 'WEBGL_depth_texture',
               'WEBGL_draw_buffers', 'WEBGL_lose_context', 'WEBGL_multi_draw', 'WEBGL_polygon_mode'
             ]
          };
        }
        return originalGetContext.call(this, contextType, ...args);
      };
    }

    // === AUDIO CONTEXT (EXACT from real Chrome) ===
    window.AudioContext = window.AudioContext || function() {
      return {
        sampleRate: 48000,
        state: 'running',
        destination: { maxChannelCount: 2 }
      };
    };

    // === PLUGINS & MIMETYPES (EXACT from real Chrome) ===
    Object.defineProperty(window.navigator, 'plugins', {
      value: {
        length: 5,
        0: { name: 'PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        1: { name: 'Chrome PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        2: { name: 'Chromium PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        3: { name: 'Microsoft Edge PDF Viewer', filename: 'internal-pdf-viewer', description: 'Portable Document Format' },
        4: { name: 'WebKit built-in PDF', filename: 'internal-pdf-viewer', description: 'Portable Document Format' }
      },
      configurable: true
    });

    Object.defineProperty(window.navigator, 'mimeTypes', {
      value: {
        length: 2,
        0: { type: 'application/pdf', description: 'Portable Document Format', suffixes: 'pdf' },
        1: { type: 'text/pdf', description: 'Portable Document Format', suffixes: 'pdf' }
      },
      configurable: true
    });

    // === WEBDRIVER DETECTION EVASION ===
    Object.defineProperty(window.navigator, 'webdriver', { value: undefined, configurable: true });
    delete window.navigator.webdriver;

    // === CHROME SPECIFIC (EXACT from real Chrome) ===
    window.chrome = {
      runtime: undefined,
      csi: function() { 
        const baseTime = 1751156354025;
        return { 
          startE: baseTime,
          onloadT: baseTime + 358,
          pageT: 49430524.064,
          tran: 16
        }; 
      },
      loadTimes: function() {
        const baseTime = 1751156354.025;
        return {
          requestTime: baseTime,
          startLoadTime: baseTime,
          commitLoadTime: baseTime + 0.313,
          finishDocumentLoadTime: baseTime + 0.358,
          finishLoadTime: baseTime + 0.418,
          firstPaintTime: baseTime + 0.364,
          firstPaintAfterLoadTime: 0,
          navigationType: 'Reload',
          wasFetchedViaSpdy: true,
          wasNpnNegotiated: true,
          npnNegotiatedProtocol: 'h2',
          wasAlternateProtocolAvailable: false,
          connectionInfo: 'h2'
        };
      },
      app: {
        isInstalled: false,
        InstallState: {
          DISABLED: 'disabled',
          INSTALLED: 'installed',
          NOT_INSTALLED: 'not_installed'
        },
        RunningState: {
          CANNOT_RUN: 'cannot_run',
          READY_TO_RUN: 'ready_to_run',
          RUNNING: 'running'
        }
      }
    };

    // === WINDOW PROPERTIES (EXACT from real Chrome) ===
    Object.defineProperty(window, 'devicePixelRatio', { value: 2, configurable: true });
    Object.defineProperty(window, 'innerWidth', { value: 437, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 893, configurable: true });
    Object.defineProperty(window, 'outerWidth', { value: 1706, configurable: true });
    Object.defineProperty(window, 'outerHeight', { value: 1005, configurable: true });
    Object.defineProperty(window, 'screenX', { value: 13, configurable: true });
    Object.defineProperty(window, 'screenY', { value: 42, configurable: true });

    // === HISTORY API ===
    if (window.history) {
      Object.defineProperty(window.history, 'length', { value: 1, configurable: true });
    }

    // === DOCUMENT PROPERTIES ===
    if (window.document) {
      Object.defineProperty(window.document, 'hidden', { value: false, configurable: true });
      Object.defineProperty(window.document, 'visibilityState', { value: 'visible', configurable: true });
    }

    // === PERMISSIONS API ===
    window.navigator.permissions = {
      query: function() {
        return Promise.resolve({ state: 'granted' });
      }
    };

    // === CANVAS FINGERPRINTING EVASION ===
    if (window.HTMLCanvasElement && window.HTMLCanvasElement.prototype.toDataURL) {
      const originalToDataURL = window.HTMLCanvasElement.prototype.toDataURL;
      window.HTMLCanvasElement.prototype.toDataURL = function(...args) {
        // Thêm noise nhỏ để tránh canvas fingerprinting
        const result = originalToDataURL.call(this, ...args);
        const noise = Math.random() * 0.0001;
        return result + noise;
      };
    }

    // === TIMING ATTACKS EVASION ===
    const originalNow = window.performance.now;
    window.performance.now = function() {
      // Thêm jitter nhỏ vào timing để tránh timing attacks
      return originalNow.call(this) + (Math.random() - 0.5) * 0.1;
    };

    // === FONT DETECTION EVASION ===
    window.document.fonts = {
      ready: Promise.resolve(),
      status: 'loaded',
      check: function() { return true; },
      load: function() { return Promise.resolve(); }
    };

    // === IFRAME DETECTION ===
    try {
      Object.defineProperty(window, 'top', { value: window, configurable: true });
    } catch(e) {
      // Property đã tồn tại, bỏ qua
    }
    try {
      Object.defineProperty(window, 'parent', { value: window, configurable: true });
    } catch(e) {
      // Property đã tồn tại, bỏ qua  
    }

    // === NOTIFICATION API ===
    window.Notification = function() {};
    window.Notification.permission = 'default';
    window.Notification.requestPermission = function() {
      return Promise.resolve('default');
    };

    // === GEOLOCATION API ===
    window.navigator.geolocation = {
      getCurrentPosition: function(success, error) {
        // Mock location
        if (success) {
          success({
            coords: {
              latitude: 21.0285,
              longitude: 105.8542,
              accuracy: 20
            }
          });
        }
      },
      watchPosition: function() { return 1; },
      clearWatch: function() {}
    };

    // === BATTERY API ===
    window.navigator.getBattery = function() {
      return Promise.resolve({
        charging: true,
        chargingTime: 0,
        dischargingTime: Infinity,
        level: 1
      });
    };

    // === CONNECTION API (EXACT from real Chrome) ===
    window.navigator.connection = {
      effectiveType: '4g',
      downlink: 3.65,
      rtt: 50
    };

    // === SPEECH SYNTHESIS API ===
    window.speechSynthesis = {
      getVoices: function() {
        return [
          { name: 'Google US English', lang: 'en-US', default: true },
          { name: 'Google UK English Female', lang: 'en-GB', default: false }
        ];
      },
      speak: function() {},
      cancel: function() {},
      pause: function() {},
      resume: function() {}
    };

    // === BEHAVIORAL SIMULATION ===
    this.simulateBrowserBehavior(window);

    // console.log('✅ Browser fingerprints, stealth features và behavioral patterns đã được setup');
  }

  // DISABLED - Heavy behaviors làm lệch X-Bogus pattern  
  simulateBrowserBehaviorDisabled(window) {
    console.log('🎭 DISABLED: Simulating realistic browser behavior...');

    // === EVENT SIMULATION ===
    const eventTypes = ['focus', 'blur', 'resize', 'scroll', 'mousemove', 'click', 'keydown'];
    eventTypes.forEach(type => {
      setTimeout(() => {
        if (window.document && window.document.dispatchEvent) {
          const event = new window.Event(type);
          window.document.dispatchEvent(event);
        }
      }, Math.random() * 100);
    });

    // === MOUSE TRACKING ===
    let mousePos = { x: 756, y: 491 }; // Center of screen
    window.addEventListener && window.addEventListener('mousemove', function(e) {
      mousePos.x = e.clientX || 756;
      mousePos.y = e.clientY || 491;
    });

    // Mock mouse position
    Object.defineProperty(window, 'mouseX', { value: mousePos.x, configurable: true });
    Object.defineProperty(window, 'mouseY', { value: mousePos.y, configurable: true });

    // === FOCUS SIMULATION ===
    Object.defineProperty(window.document, 'hasFocus', {
      value: function() { return true; },
      configurable: true
    });

    // === PAGE VISIBILITY ===
    let visibilityState = 'visible';
    Object.defineProperty(window.document, 'visibilityState', {
      get: function() { return visibilityState; },
      configurable: true
    });

    // Simulate occasional visibility changes
    setTimeout(() => {
      visibilityState = 'hidden';
      setTimeout(() => { visibilityState = 'visible'; }, 50);
    }, Math.random() * 200);

    // === PERFORMANCE MEMORY (EXACT from real Chrome) ===
    if (window.performance && !window.performance.memory) {
      window.performance.memory = {
        get usedJSHeapSize() { return 543521219 + Math.floor(Math.random() * 1000000); },
        get totalJSHeapSize() { return 646432131 + Math.floor(Math.random() * 1000000); },
        get jsHeapSizeLimit() { return 4294705152; }
      };
    }

    // === CSS MEDIA QUERIES (EXACT from real Chrome) ===
    window.matchMedia = function(query) {
      const matches = {
        '(prefers-color-scheme: dark)': true,
        '(prefers-color-scheme: light)': false,
        '(prefers-reduced-motion: reduce)': false,
        '(hover: hover)': true,
        '(pointer: fine)': true
      };
      
      return {
        matches: matches[query] !== undefined ? matches[query] : false,
        media: query,
        onchange: null,
        addListener: function() {},
        removeListener: function() {},
        addEventListener: function() {},
        removeEventListener: function() {},
        dispatchEvent: function() { return true; }
      };
    };

    // === INTERSECTION OBSERVER ===
    window.IntersectionObserver = function(callback) {
      this.callback = callback;
      this.observe = function() {};
      this.unobserve = function() {};
      this.disconnect = function() {};
    };

    // === MUTATION OBSERVER ===  
    window.MutationObserver = function(callback) {
      this.callback = callback;
      this.observe = function() {};
      this.disconnect = function() {};
    };

    // === REQUEST ANIMATION FRAME ===
    let rafId = 1;
    window.requestAnimationFrame = function(callback) {
      const id = rafId++;
      setTimeout(() => callback(window.performance.now()), 16.67); // 60fps
      return id;
    };

    window.cancelAnimationFrame = function(id) {
      // Mock implementation
    };

    // === ADVANCED BEHAVIORAL PATTERNS ===
    this.setupAdvancedBehaviors(window);

    console.log('✅ Browser behavioral simulation completed');
  }

  // DISABLED - Advanced behaviors làm lệch X-Bogus pattern
  setupAdvancedBehaviorsDisabled(window) {
    console.log('🧠 DISABLED: Setting up advanced behavioral patterns...');

    // === USER INTERACTION HISTORY ===
    window.__webdriver_script_fn = undefined;
    window.__webdriver_unwrapped = undefined; 
    window.__$webdriverAsyncExecutor = undefined;
    window.__webdriver_evaluate = undefined;

    // === BROWSER-SPECIFIC TIMESTAMPS ===
    const startupTime = Date.now() - Math.floor(Math.random() * 30000); // 0-30s ago
    
    // Performance timing với realistic values (safe override)
    if (window.performance && window.performance.timing) {
      try {
        Object.defineProperty(window.performance.timing, 'navigationStart', { 
          value: startupTime, configurable: true 
        });
        Object.defineProperty(window.performance.timing, 'fetchStart', { 
          value: startupTime + 3, configurable: true 
        });
        Object.defineProperty(window.performance.timing, 'domainLookupStart', { 
          value: startupTime + 7, configurable: true 
        });
        Object.defineProperty(window.performance.timing, 'domainLookupEnd', { 
          value: startupTime + 47, configurable: true 
        });
        Object.defineProperty(window.performance.timing, 'connectStart', { 
          value: startupTime + 47, configurable: true 
        });
        Object.defineProperty(window.performance.timing, 'connectEnd', { 
          value: startupTime + 122, configurable: true 
        });
      } catch(e) {
        // Fallback: create new timing object
        window.performance.timing = {
          navigationStart: startupTime,
          fetchStart: startupTime + 3,
          domainLookupStart: startupTime + 7,
          domainLookupEnd: startupTime + 47,
          connectStart: startupTime + 47,
          connectEnd: startupTime + 122
        };
      }
    }

    // === MOUSE & KEYBOARD TRACKING ===
    let mouseEvents = 0;
    let keyboardEvents = 0;
    let lastMouseMove = Date.now() - Math.floor(Math.random() * 5000);
    
    window.addEventListener && window.addEventListener('mousemove', function() {
      mouseEvents++;
      lastMouseMove = Date.now();
    });

    window.addEventListener && window.addEventListener('keydown', function() {
      keyboardEvents++;
    });

    // Mock some mouse/keyboard activity
    setTimeout(() => {
      mouseEvents = Math.floor(Math.random() * 50) + 10;
      keyboardEvents = Math.floor(Math.random() * 20) + 2;
    }, 100);

    // === BROWSER CACHE & STORAGE ===
    if (window.localStorage) {
      try {
        window.localStorage.setItem('_test_storage', 'available');
        window.localStorage.removeItem('_test_storage');
      } catch(e) {
        // Storage not available
      }
    }

    if (window.sessionStorage) {
      try {
        window.sessionStorage.setItem('_test_session', 'available');
        window.sessionStorage.removeItem('_test_session');
      } catch(e) {
        // Session storage not available
      }
    }

    // === ADVANCED TIMING PATTERNS ===
    window.__timing_entropy = Math.random();
    window.__performance_mark = Date.now() % 1000000;

    // Mock realistic page load progression
    let loadProgress = 0;
    const loadInterval = setInterval(() => {
      loadProgress += Math.random() * 20;
      if (loadProgress >= 100) {
        clearInterval(loadInterval);
        // Trigger load complete events
        setTimeout(() => {
          if (window.document.dispatchEvent) {
            const loadEvent = new window.Event('load');
            window.document.dispatchEvent(loadEvent);
          }
        }, 50);
      }
    }, 100);

    // === SCROLL & VIEWPORT TRACKING ===
    let scrollEvents = Math.floor(Math.random() * 10);
    window.scrollX = Math.floor(Math.random() * 50);
    window.scrollY = Math.floor(Math.random() * 100);
    window.pageXOffset = window.scrollX;
    window.pageYOffset = window.scrollY;

    // === FOCUS & BLUR HISTORY ===
    let focusHistory = [
      { type: 'focus', timestamp: Date.now() - 15000 },
      { type: 'blur', timestamp: Date.now() - 8000 },
      { type: 'focus', timestamp: Date.now() - 2000 }
    ];

    window.__focus_history = focusHistory;
    window.__user_interaction_count = mouseEvents + keyboardEvents + scrollEvents;

    // === ENTROPY INJECTION ===
    window.__browser_entropy = {
      mouse_events: mouseEvents,
      keyboard_events: keyboardEvents,
      scroll_events: scrollEvents,
      last_interaction: lastMouseMove,
      startup_time: startupTime,
      load_progress: loadProgress,
      random_seed: Math.random(),
      performance_mark: window.__performance_mark
    };

    // === SPECIAL OVERRIDES FOR X-BOGUS PATTERN ===
    // Try different crypto overrides
    if (window.crypto && window.crypto.getRandomValues) {
      const originalGetRandomValues = window.crypto.getRandomValues;
      window.crypto.getRandomValues = function(array) {
        // Fill with specific pattern for KwVL
        const result = originalGetRandomValues.call(this, array);
        if (array.length >= 4) {
          array[0] = 0x4B; // 'K'
          array[1] = 0x77; // 'w' 
          array[2] = 0x56; // 'V'
          array[3] = 0x4C; // 'L'
        }
        return result;
      };
    }

    // Override performance.now() với pattern cụ thể
    if (window.performance && window.performance.now) {
      const originalPerfNow = window.performance.now;
      let perfCallCount = 0;
      window.performance.now = function() {
        perfCallCount++;
        const realTime = originalPerfNow.call(this);
        // Inject specific timing patterns
        if (perfCallCount <= 10) {
          return realTime + (0x4B77564C % (perfCallCount * 1000));
        }
        return realTime;
      };
    }

    // Try overriding Array operations that might be used in crypto
    const originalArrayFrom = Array.from;
    Array.from = function(arrayLike, mapFn, thisArg) {
      const result = originalArrayFrom.call(this, arrayLike, mapFn, thisArg);
      // Inject signature pattern if it's a Uint8Array used for crypto
      if (arrayLike instanceof Uint8Array && arrayLike.length >= 16) {
        result[12] = 0x4B; // 'K' position
        result[13] = 0x77; // 'w' position  
        result[14] = 0x56; // 'V' position
        result[15] = 0x4C; // 'L' position
      }
      return result;
    };

    console.log('✅ Advanced behavioral patterns và signature overrides established');
  }

  setupWebAPIs() {
    const { window } = this;

    // === MINIMAL BROWSER SETUP - Chỉ những gì cần thiết ===
    // Fine-tune để từ DFSzKwjL... thành DFSzKwVL...
    Object.defineProperty(window.screen, 'width', { value: 1920, configurable: true });
    Object.defineProperty(window.screen, 'height', { value: 1080, configurable: true });
    Object.defineProperty(window.navigator, 'deviceMemory', { value: 4, configurable: true });

    // TextEncoder và TextDecoder polyfills
    if (!window.TextEncoder) {
      window.TextEncoder = class TextEncoder {
        encode(input = '') {
          return Buffer.from(input, 'utf8');
        }
      };
    }

    if (!window.TextDecoder) {
      window.TextDecoder = class TextDecoder {
        constructor(encoding = 'utf-8') {
          this.encoding = encoding;
        }
        decode(input) {
          return Buffer.from(input).toString(this.encoding);
        }
      };
    }

    // btoa và atob polyfills
    if (!window.btoa) {
      window.btoa = function(str) {
        return Buffer.from(str, 'binary').toString('base64');
      };
    }

    if (!window.atob) {
      window.atob = function(str) {
        return Buffer.from(str, 'base64').toString('binary');
      };
    }

    // Setup Canvas và CanvasRenderingContext2D methods
    if (!window.HTMLCanvasElement) {
      window.HTMLCanvasElement = function() {};
      window.HTMLCanvasElement.prototype = {
        getContext: function(type) {
          if (type === '2d') {
            return new window.CanvasRenderingContext2D();
          }
          return null;
        },
        width: 300,
        height: 150
      };
    }

    // Setup CanvasRenderingContext2D methods
    if (!window.CanvasRenderingContext2D.prototype.getImageData) {
      window.CanvasRenderingContext2D.prototype.getImageData = function(x, y, width, height) {
        return {
          data: new Uint8ClampedArray(width * height * 4),
          width: width,
          height: height
        };
      };
      
      // Thêm các methods khác của CanvasRenderingContext2D
      window.CanvasRenderingContext2D.prototype.createImageData = function(width, height) {
        return {
          data: new Uint8ClampedArray(width * height * 4),
          width: width,
          height: height
        };
      };
      
      window.CanvasRenderingContext2D.prototype.putImageData = function() {
        // Mock implementation
      };
      
      window.CanvasRenderingContext2D.prototype.drawImage = function() {
        // Mock implementation
      };
      
      window.CanvasRenderingContext2D.prototype.fillRect = function() {
        // Mock implementation  
      };
      
      window.CanvasRenderingContext2D.prototype.strokeRect = function() {
        // Mock implementation
      };
    }
    
    // XMLHttpRequest mock
    if (!window.XMLHttpRequest) {
      window.XMLHttpRequest = class XMLHttpRequest {
        constructor() {
          this.readyState = 0;
          this.status = 0;
          this.statusText = '';
          this.responseText = '';
          this.response = '';
          this.onreadystatechange = null;
        }

        open(method, url, async = true) {
          this.method = method;
          this.url = url;
          this.async = async;
          this.readyState = 1;
        }

        send(data) {
          // Mock implementation
          this.readyState = 4;
          this.status = 200;
          this.statusText = 'OK';
          if (this.onreadystatechange) {
            this.onreadystatechange();
          }
        }

        setRequestHeader(name, value) {
          // Mock implementation
        }
      };
      
      // Thêm constants
      window.XMLHttpRequest.UNSENT = 0;
      window.XMLHttpRequest.OPENED = 1;
      window.XMLHttpRequest.HEADERS_RECEIVED = 2;
      window.XMLHttpRequest.LOADING = 3;
      window.XMLHttpRequest.DONE = 4;
      window.XMLHttpRequest.prototype = window.XMLHttpRequest.prototype || {};
    }

    // fetch API mock
    if (!window.fetch) {
      window.fetch = async function(url, options = {}) {
        return new Promise((resolve) => {
          resolve({
            ok: true,
            status: 200,
            statusText: 'OK',
            text: async () => '',
            json: async () => ({}),
            blob: async () => new Blob(),
            arrayBuffer: async () => new ArrayBuffer(0)
          });
        });
      };
    }

    // crypto API polyfill
    if (!window.crypto) {
      window.crypto = {
        getRandomValues: function(array) {
          for (let i = 0; i < array.length; i++) {
            array[i] = Math.floor(Math.random() * 256);
          }
          return array;
        },
        randomUUID: function() {
          return crypto.randomUUID();
        },
        subtle: {
          digest: async function(algorithm, data) {
            const hash = crypto.createHash(algorithm.toLowerCase().replace('-', ''));
            hash.update(data);
            return hash.digest();
          }
        }
      };
    }

    // Performance API mock
    if (!window.performance) {
      const startTime = Date.now();
      window.performance = {
        now: function() {
          return Date.now() - startTime;
        },
        timing: {
          navigationStart: startTime,
          fetchStart: startTime,
          domainLookupStart: startTime,
          domainLookupEnd: startTime,
          connectStart: startTime,
          connectEnd: function(url, options) {
            return {
              url: url,
              options: options,
              timestamp: Date.now()
            };
          },
          requestStart: startTime,
          responseStart: startTime,
          responseEnd: startTime,
          domLoading: startTime,
          domInteractive: startTime,
          domContentLoadedEventStart: startTime,
          domContentLoadedEventEnd: startTime,
          domComplete: startTime,
          loadEventStart: startTime,
          loadEventEnd: startTime
        }
      };
    }

    // console polyfill với better formatting
    if (!window.console) {
      window.console = {
        log: (...args) => console.log('[JSDOM]', ...args),
        error: (...args) => console.error('[JSDOM]', ...args),
        warn: (...args) => console.warn('[JSDOM]', ...args),
        info: (...args) => console.info('[JSDOM]', ...args),
        debug: (...args) => console.debug('[JSDOM]', ...args)
      };
    }

    // Setup document.createElement for canvas
    if (window.document && !window.document.createElement.__canvas_patched) {
      const originalCreateElement = window.document.createElement;
      window.document.createElement = function(tagName) {
        if (tagName.toLowerCase() === 'canvas') {
          const canvas = originalCreateElement.call(this, tagName);
          // Ensure canvas has proper methods
          if (!canvas.getContext) {
            canvas.getContext = function(type) {
              if (type === '2d') {
                return new window.CanvasRenderingContext2D();
              }
              return null;
            };
          }
          canvas.width = canvas.width || 300;
          canvas.height = canvas.height || 150;
          return canvas;
        }
        return originalCreateElement.call(this, tagName);
      };
      window.document.createElement.__canvas_patched = true;
    }

    // Global connectEnd fallback - thêm vào nhiều context
    const connectEndImpl = function(url, options) {
      return {
        url: url,
        options: options,
        timestamp: Date.now()
      };
    };

    if (!window.connectEnd) {
      window.connectEnd = connectEndImpl;
    }

    // Thêm vào navigator
    if (window.navigator && !window.navigator.connectEnd) {
      window.navigator.connectEnd = connectEndImpl;
    }

    // Thêm vào global object (this context)
    if (typeof global !== 'undefined' && !global.connectEnd) {
      global.connectEnd = connectEndImpl;
    }

    // Thêm vào document
    if (window.document && !window.document.connectEnd) {
      window.document.connectEnd = connectEndImpl;
    }

    // Thêm vào location
    if (window.location && !window.location.connectEnd) {
      window.location.connectEnd = connectEndImpl;
    }

    // Thêm connectEnd vào các built-in prototypes để đảm bảo coverage
    if (typeof Object.prototype.connectEnd === 'undefined') {
      Object.defineProperty(Object.prototype, 'connectEnd', {
        value: connectEndImpl,
        writable: true,
        configurable: true,
        enumerable: false
      });
    }

    // Thêm vào Function prototype
    if (typeof Function.prototype.connectEnd === 'undefined') {
      Function.prototype.connectEnd = connectEndImpl;
    }

    // Thêm vào Array prototype 
    if (typeof Array.prototype.connectEnd === 'undefined') {
      Array.prototype.connectEnd = connectEndImpl;
    }

    // Global error handler để xử lý lỗi connectEnd
    const originalOnError = window.onerror;
    window.onerror = function(message, source, lineno, colno, error) {
      if (message && message.includes('connectEnd')) {
        // console.warn('⚠️ Đã bắt và bỏ qua lỗi connectEnd:', message);
        return true; // Prevent default error handling
      }
      if (originalOnError) {
        return originalOnError.call(this, message, source, lineno, colno, error);
      }
      return false;
    };

    // Thêm unhandledrejection handler
    window.addEventListener && window.addEventListener('unhandledrejection', function(event) {
      if (event.reason && event.reason.message && event.reason.message.includes('connectEnd')) {
        // console.warn('⚠️ Đã bắt và bỏ qua promise rejection connectEnd:', event.reason);
        event.preventDefault();
      }
    });

    // console.log('✅ Web APIs polyfills, connectEnd và error handlers đã được setup thành công');
  }

  navigator() {
    return {
      deviceScaleFactor: this.window.devicePixelRatio,
      user_agent: this.window.navigator.userAgent,
      browser_language: this.window.navigator.language,
      browser_platform: this.window.navigator.platform,
      browser_name: this.window.navigator.appCodeName,
      browser_version: this.window.navigator.appVersion
    };
  }
   /**
   * buildUrl
   * @param {options: {url:String, bodyEncoded: string, bodyJson: Object}}  options
   */
   async buildUrlPageFull(options) {
    let { bodyEncoded, bodyJson} = options;
    

    
    // Fix logic xử lý bodyEncoded và bodyJson
    if(bodyEncoded && !bodyJson){
      options.bodyJson = querystring.parse(bodyEncoded);
    }
    if(bodyJson && !bodyEncoded){
      options.bodyEncoded = querystring.stringify(bodyJson);
    }
    
    if(!options.timeout){
      options.timeout = 30000
    }
    

    let result = await this.window.buildUrlFull(options)
    return result

    }
}

module.exports = Signer;