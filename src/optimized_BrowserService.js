/**
 * File: optimized_BrowserService.js
 * Phiên bản tối ưu của BrowserService.js
 * Giải quyết vấn đề rò rỉ bộ nhớ và cải thiện hiệu suất
 */

const puppeteer = require('puppeteer-extra');
const querystring = require("querystring");
const path = require("path");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const fs = require('fs');
const os = require("os");

// Nạp plugin Stealth một lần duy nhất
puppeteer.use(StealthPlugin());

// Thiết lập User Agent mặc định
const userAgentDefault = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

// Helper
const delay = (time) => new Promise((r) => setTimeout(r, time));

// Nạp cấu hình
let { executablePath, headless } = require(path.resolve("./data/accounts.json"));

// Xác định hệ điều hành
let os_type = os.type();
switch (os_type) {
  case "Linux": {
    // Xử lý đặc biệt cho Linux
    break;
  } 
  case "Windows_NT": {
    break;
  } 
  case "Darwin": {
    break;
  } 
  default: {
  }
}

const { getString, strData } = require("./helper");

/**
 * Quản lý cache và tài nguyên
 */
class ResourceManager {
  constructor() {
    this.pageCache = new Map();
    this.lastUsed = new Map();
    this.maxCacheSize = 5; // Giới hạn số lượng trang trong cache
  }

  addPage(id, page) {
    this.pageCache.set(id, page);
    this.lastUsed.set(id, Date.now());
    
    // Nếu cache quá lớn, xóa các trang cũ nhất
    if (this.pageCache.size > this.maxCacheSize) {
      this.cleanOldPages();
    }
  }

  getPage(id) {
    if (this.pageCache.has(id)) {
      this.lastUsed.set(id, Date.now());
      return this.pageCache.get(id);
    }
    return null;
  }

  updateLastUsed(id) {
    if (this.lastUsed.has(id)) {
      this.lastUsed.set(id, Date.now());
    }
  }

  async cleanOldPages() {
    if (this.pageCache.size <= this.maxCacheSize) return;

    // Sắp xếp các trang theo thời gian sử dụng
    const entries = [...this.lastUsed.entries()]
      .sort((a, b) => a[1] - b[1]);
    
    // Xóa các trang cũ nhất
    const pagesToRemove = entries.slice(0, entries.length - this.maxCacheSize);
    
    for (const [id] of pagesToRemove) {
      try {
        const page = this.pageCache.get(id);
        if (page && !page.isClosed()) {
          await page.close();
        }
        this.pageCache.delete(id);
        this.lastUsed.delete(id);
        console.log(`[ResourceManager] Đóng trang cũ ${id} để giảm bộ nhớ`);
      } catch (err) {
        console.error(`[ResourceManager] Lỗi khi đóng trang ${id}:`, err.message);
      }
    }
  }

  async cleanAll() {
    const ids = [...this.pageCache.keys()];
    for (const id of ids) {
      try {
        const page = this.pageCache.get(id);
        if (page && !page.isClosed()) {
          await page.close();
        }
        this.pageCache.delete(id);
        this.lastUsed.delete(id);
      } catch (err) {
        console.error(`[ResourceManager] Lỗi khi dọn dẹp trang ${id}:`, err.message);
      }
    }
  }
}

/**
 * Phiên bản tối ưu của BrowserService
 * - Sử dụng Singleton tối ưu
 * - Quản lý tài nguyên hiệu quả
 * - Xử lý lỗi tốt hơn
 */
class OptimizedBrowserService {
  static isInitialized;
  static instance;
  static initStatus;
  static resourceManager = new ResourceManager();
  
  constructor({ userAgent, proxy, getNewCookie, modeInstance, profile_name, initSign, cookies, headless }) {
    this.getNewCookie = getNewCookie;
    this.modeInstance = modeInstance;
    this.reTryInitFetch = 0;
    this.reTryInitSign = 0;
    this.reTryInitTemp = 0;
    this.reTryInitUpdate = 0;
    this.cookies = cookies;
    this.reTryInit = 0;
    this.userAgent = userAgent;
    this.proxy = proxy;
    this.page = null;
    this.browser = null;
    this.pageFetch = null;
    this.totalDone = 0;
    this.profile_name = profile_name;
    this.totalAttendanced = 0;
    this.initSign = initSign;
    this.initTemp = "pending";
    this.headless = headless;
    this.id = Date.now();
    
    // Theo dõi tất cả các trang đã mở
    this.activePages = new Set();
    
    // Quản lý thời gian sử dụng tài nguyên
    this.lastCleanup = Date.now();
    this.CLEANUP_INTERVAL = 5 * 60 * 1000; // 5 phút
  }

  /**
   * Lấy instance duy nhất của BrowserService
   */
  static async getInstance(userAgent, options) {
    try {
      // Đảm bảo chỉ có một quy trình khởi tạo tại một thời điểm
      while (OptimizedBrowserService.initStatus == "processing") {
        await delay(100);
      }
      
      options = options || {};
      
      if (!OptimizedBrowserService.isInitialized) {
        OptimizedBrowserService.initStatus = "processing";
        OptimizedBrowserService.isInitialized = false;
        OptimizedBrowserService.instance = new OptimizedBrowserService({
          userAgent: userAgent || userAgentDefault,
          modeInstance: "single",
          profile_name: options.profile_name || "xbogus",
          ...options
        });
        
        await OptimizedBrowserService.instance.init("single");
        
        // Thiết lập kiểm tra tài nguyên định kỳ
        OptimizedBrowserService.startResourceMonitor();
      }
      
      return OptimizedBrowserService.instance;
    } catch (e) {
      console.log("[BrowserService] get Instance error:", e);
      return false;
    }
  }

  /**
   * Thiết lập hệ thống giám sát tài nguyên
   */
  static startResourceMonitor() {
    if (OptimizedBrowserService.resourceMonitor) return;
    
    OptimizedBrowserService.resourceMonitor = setInterval(async () => {
      try {
        if (!OptimizedBrowserService.instance) return;
        
        const instance = OptimizedBrowserService.instance;
        const now = Date.now();
        
        // Kiểm tra và đóng các trang không sử dụng
        if (now - instance.lastCleanup > instance.CLEANUP_INTERVAL) {
          await instance.cleanupUnusedPages();
          instance.lastCleanup = now;
        }
      } catch (err) {
        console.error("[ResourceMonitor] Error:", err);
      }
    }, 60000); // Kiểm tra mỗi phút
  }

  /**
   * Cập nhật instance trình duyệt
   */
  static async updateInstance() {
    try {
      OptimizedBrowserService.initStatus = "processing";
      
      let success = await OptimizedBrowserService.instance.initPageUpdate();
      if (success) {
        OptimizedBrowserService.instance.page = OptimizedBrowserService.instance.page_temp;
        OptimizedBrowserService.instance.page_temp = null;
        
        // Đóng tất cả các trang không sử dụng
        setTimeout(async () => {
          try {
            const pages = await OptimizedBrowserService.instance.browser.pages();
            for (const page of pages) {
              if (!(page._idPage == OptimizedBrowserService.instance.page._idPage)) {
                await page.close();
              }
            }
          } catch (e) {
            console.error("[updateInstance] Error closing pages:", e);
          }
        }, 1000);
      }

      OptimizedBrowserService.initStatus = "inited";
      return true;
    } catch (e) {
      console.log("[BrowserService] get updateInstance error:", e);
      OptimizedBrowserService.initStatus = "inited"; // Reset trạng thái ngay cả khi lỗi
      return false;
    }
  }

  /**
   * Tạo instance mới
   */
  static async newInstance(userAgent, options) {
    try {
      options = options || {};
      let { cookies, profile_name } = options;

      let newInstance = new OptimizedBrowserService({
        userAgent: userAgent || userAgentDefault,
        modeInstance: "multi",
        profile_name: profile_name,
        ...options
      });
      
      await newInstance.init("multi");
      await newInstance.initPageFetch({ cookies });

      return newInstance;
    } catch (e) {
      console.log("[BrowserService] Error newInstance", e);
      return false;
    }
  }

  /**
   * Xóa instance và giải phóng tài nguyên
   */
  static async deleteInstance() {
    try {
      if (OptimizedBrowserService.instance) {
        const ins = OptimizedBrowserService.instance;
        
        // Đóng tất cả các trang trước khi đóng trình duyệt
        if (ins.browser) {
          try {
            const pages = await ins.browser.pages();
            for (const page of pages) {
              if (!page.isClosed()) {
                await page.close();
              }
            }
          } catch (err) {
            console.error("[deleteInstance] Error closing pages:", err);
          }
          
          // Đóng trình duyệt
          await ins.browser.close();
        }
        
        // Dọn dẹp tài nguyên
        await OptimizedBrowserService.resourceManager.cleanAll();
        
        // Xóa instance
        OptimizedBrowserService.isInitialized = false;
        OptimizedBrowserService.instance = null;
        
        // Dừng monitor
        if (OptimizedBrowserService.resourceMonitor) {
          clearInterval(OptimizedBrowserService.resourceMonitor);
          OptimizedBrowserService.resourceMonitor = null;
        }
        
        return true;
      }
      return true;
    } catch (e) {
      console.log("[BrowserService] deleteInstance error:", e);
      return false;
    }
  }

  /**
   * Khởi tạo trình duyệt
   */
  async init(modeInstance) {
    return new Promise(async (resolve, reject) => {
      try {
        if (modeInstance == "update" || !OptimizedBrowserService.isInitialized || modeInstance != "single") {
          // Cấu hình kích thước cửa sổ
          var window_size = {
            width: 320,
            height: 400
          };
          
          // Cấu hình headless
          let _headless = this.headless || headless;
          
          // Thiết lập tham số cho trình duyệt
          let params = {
            args: [
              '--lang=en-US',
              '--no-sandbox',
              '--disable-setuid-sandbox',
              "--no-first-run",
              '--disable-dev-shm-usage',
              '--disable-session-crashed-bubble',
              `--window-size=${window_size.width},${window_size.height+150}`,
              `--window-position=0,0`,
              // Tối ưu bộ nhớ
              '--disable-extensions',
              '--disable-component-extensions-with-background-pages',
              '--disable-default-apps',
              '--mute-audio',
              '--no-default-browser-check',
              '--disable-background-timer-throttling',
              '--disable-backgrounding-occluded-windows',
              '--disable-renderer-backgrounding',
              // Giảm sử dụng GPU
              '--disable-gpu',
              '--disable-gpu-sandbox',
              '--disable-software-rasterizer',
            ],
            executablePath: executablePath,
            headless: _headless && _headless == "no" ? false : "new",
            protocolTimeout: 30000, // Giảm timeout so với phiên bản cũ
            env: {
              DISPLAY: ":10.0"
            },
            ignoreDefaultArgs: ['--disable-extensions'],
          };
          
          // Điều chỉnh cho Linux
          if (os_type == "Linux") {
            delete params.executablePath;
          }
          
          // Thiết lập proxy nếu có
          if (this.proxy) {
            let { protocol, host, port, username, password } = this.proxy;
            params.args.push(`--proxy-server=${host}:${port}`);
            if (username && password) {
              params.args.push(`--proxy-auth=${username}:${password}`);
            }
          }
          
          // Khởi chạy trình duyệt với các tham số tối ưu
          this.browser = await puppeteer.launch(params);
          
          // Đánh dấu đã khởi tạo xong
          if (modeInstance == "single") {
            OptimizedBrowserService.isInitialized = true;
            if (!this.initSign) {
              OptimizedBrowserService.initStatus = "inited";
            }
          }
          
          // Khởi tạo trang sign nếu cần
          if (this.initSign) {
            let { cookies } = this;
            await this.initPageSign({ cookies });
            if (modeInstance == "single") {
              OptimizedBrowserService.initStatus = "inited";
            }
          }
          
          return resolve();
        }
      } catch (error) {
        console.log("[BrowserService] Error init browser", error);
        
        if (this.reTryInit <= 3) {
          await delay(1000);
          this.reTryInit++;
          return await this.init(modeInstance);
        } else {
          OptimizedBrowserService.initStatus = "inited"; // Reset trạng thái để tránh deadlock
          throw new Error("Init max retry");
        }
      }
    });
  }

  /**
   * Tạo chữ ký cho request
   */
  async sign(array) {
    if (!this.page) throw new Error("Page sign not found");
    
    try {
      return await this.page.evaluate((args) => {
        return window.sign(args);
      }, array);
    } catch (error) {
      console.log("[BrowserService] Error sign", error);
      return "";
    }
  }

  /**
   * Khởi tạo trang để tạo chữ ký
   */
  async initPageSign(options) {
    if (this.page) return;
    
    try {
      options = options || {};
      
      if (!this.browser) {
        throw new Error("Browser is not initialized");
      }
      
      // Sử dụng trang đã có hoặc tạo mới
      let pages = await this.browser.pages();
      this.page = pages && pages.length ? pages[0] : await this.browser.newPage();
      this.activePages.add(this.page);
      
      // Xác thực proxy nếu cần
      if (this.proxy) {
        let { protocol, host, port, username, password } = this.proxy;
        if (username && password) {
          await this.page.authenticate({ username, password });
        }
      }
      
      // Thiết lập User-Agent
      let { userAgent: userAgentInit, cookies } = options;
      await this.page.setUserAgent(userAgentInit || this.userAgent);
      
      // Thiết lập kích thước viewport
      var window_size = { width: 320, height: 400 };
      await this.page.setViewport({ width: window_size.width, height: window_size.height, deviceScaleFactor: 0.5 });
      
      // Đánh giá thông tin trình duyệt
      let { userAgent, appVersion, navigator } = await this.page.evaluate(() => {
        let navigator = window.navigator;
        let { appVersion, userAgent } = navigator;
        return { appVersion, userAgent, navigator };
      });
      
      // Lưu thông tin
      this.appVersion = appVersion;
      this.navigator = navigator;
      this.userAgent = userAgent;
      
      // Thiết lập cookies nếu có
      if (cookies && cookies.length) {
        await this.page.setCookie(...cookies);
      }
      
      // Mở trang và thiết lập môi trường
      await this.page.goto(`https://webcast.tiktok.com/setting`);
      await delay(200);
      
      // Cài đặt script webmssdk_v2.js để tạo chữ ký
      await this.loadInit2({ page: this.page, options: { loadScript: true } });
      
      console.log("[BrowserService] Init sign success");
    } catch (error) {
      console.log("[BrowserService] Error init page sign:", error);
      
      if (this.reTryInitSign <= 3) {
        await delay(1000);
        this.reTryInitSign++;
        return await this.initPageSign(options);
      } else {
        throw new Error("Init page sign max retry");
      }
    }
  }

  /**
   * Cập nhật trang trình duyệt
   */
  async initPageUpdate(options) {
    if (!this.page) return;
    
    try {
      options = options || {};
      
      if (!this.browser) {
        throw new Error("Browser is not initialized");
      }
      
      // Tạo trang mới để thay thế
      this.page_temp = await this.browser.newPage();
      this.activePages.add(this.page_temp);
      
      // Xác thực proxy nếu cần
      if (this.proxy) {
        let { protocol, host, port, username, password } = this.proxy;
        if (username && password) {
          await this.page_temp.authenticate({ username, password });
        }
      }
      
      // Thiết lập User-Agent
      let { userAgent: userAgentInit, cookies } = options;
      await this.page_temp.setUserAgent(userAgentInit || this.userAgent);
      
      // Cấu hình viewport
      var window_size = { width: 320, height: 400 };
      await this.page_temp.setViewport({ width: window_size.width, height: window_size.height, deviceScaleFactor: 0.5 });
      
      // Đánh giá thông tin trình duyệt
      let { userAgent, appVersion, navigator } = await this.page_temp.evaluate(() => {
        let navigator = window.navigator;
        let { appVersion, userAgent } = navigator;
        return { appVersion, userAgent, navigator };
      });
      
      // Cập nhật thông tin
      this.appVersion = appVersion;
      this.navigator = navigator;
      this.userAgent = userAgent;
      
      // Thiết lập cookies nếu có
      if (cookies && cookies.length) {
        await this.page_temp.setCookie(...cookies);
      }
      
      // Mở trang và thiết lập môi trường
      await this.page_temp.goto(`https://webcast.tiktok.com/setting`);
      await delay(200);
      
      // Nạp script cho tạo chữ ký
      await this.loadInit2({ page: this.page_temp, options: { loadScript: true } });
      
      // Reset số lần thử lại và lưu ID trang
      this.reTryInitUpdate = 0;
      this.page_temp._idPage = Date.now();
      
      return true;
    } catch (error) {
      console.log("[BrowserService] Error init page_temp:", error);
      
      if (this.reTryInitUpdate <= 3) {
        await delay(1000);
        this.reTryInitUpdate++;
        return await this.initPageUpdate(options);
      } else {
        throw new Error("Init page_temp max retry");
      }
    }
  }

  /**
   * Khởi tạo trang để fetch data
   */
  async initPageFetch(options) {
    try {
      options = options || {};
      
      if (!this.browser) {
        throw new Error("Browser is not initialized");
      }
      
      // Lấy các trang hiện có hoặc tạo mới
      let { cookies, userAgent: userAgentInit } = options;
      let pages = await this.browser.pages();
      
      if (this.modeInstance == "multi") {
        this.pageFetch = pages && pages.length ? pages[0] : await this.browser.newPage();
      } else {
        this.pageFetch = await this.browser.newPage();
      }
      
      this.activePages.add(this.pageFetch);
      
      // Xác thực proxy nếu cần
      if (this.proxy) {
        let { protocol, host, port, username, password } = this.proxy;
        if (username && password) {
          await this.pageFetch.authenticate({ username, password });
        }
      }
      
      // Thiết lập User-Agent
      await this.pageFetch.setUserAgent(userAgentInit || this.userAgent);
      
      // Cấu hình viewport
      var window_size = { width: 320, height: 400 };
      await this.pageFetch.setViewport({ width: window_size.width, height: window_size.height, deviceScaleFactor: 0.5 });
      
      // Thiết lập cookies
      if (this.getNewCookie) {
        await this.getNewCookie();
      } else if (cookies && cookies.length) {
        await this.pageFetch.setCookie(...cookies);
      }
      
      // Mở trang cài đặt
      await this.pageFetch.goto(`https://webcast.tiktok.com/setting`);
      
      // Tối ưu bộ nhớ
      await this.pageFetch.reload({ waitUntil: 'networkidle2' });
      await this.pageFetch.setCacheEnabled(false);
      await delay(200);
      
      // Nạp script cho fetch
      await this.loadInit({ page: this.pageFetch, options: { loadScript: true } });
      
      console.log("[BrowserService] Init page fetch success");
    } catch (error) {
      console.log("[BrowserService] Error init page fetch:", error);
      
      if (this.reTryInitFetch <= 5) { // Giảm từ 20 xuống 5 lần thử lại
        this.reTryInitFetch++;
        await delay(2000);
        return await this.initPageFetch(options);
      } else {
        throw new Error("Init page fetch max retry");
      }
    }
  }

  /**
   * Nạp script webmssdk.js cho trang và khởi tạo các hàm cần thiết
   */
  async loadInit({ page, options }) {
    let { loadScript } = options;
    let scriptSdk = await strData(path.resolve("./src/webmssdk.js"));
    
    let result = await page.evaluate(async ({ loadScript, scriptSdk }) => {
      if (loadScript) {
        window.eval(scriptSdk);
      }

      let delay = (time) => new Promise(r => setTimeout(r, time));
      
      let init = async function () {
        if (window.byted_acrawler && window.byted_acrawler.frontierSign) {
          window.sign = (args) => {
            let frontierSign = window.byted_acrawler.frontierSign;
            let temp = frontierSign['_v'][2];
            frontierSign['_v'] = [413, 2, temp];
            let result = frontierSign(...args);
            return result;
          };
          
          window.buildUrl = ({ url, bodyEncoded, bodyJson }) => {
            let [host, params] = url.split("?");
            let ars = [params];
            if (bodyEncoded) {
              ars.push(bodyEncoded);
            }
            let xbogus = window.sign(ars);
            let new_url = `${url}&X-Bogus=${xbogus}`;
            let sign_params = { url: new_url };
            if (bodyJson) {
              sign_params.bodyVal2str = true;
              sign_params.body = bodyJson;
            }
            let ars_signature = [sign_params, undefined, "forreal"];
            let _signed = window.getSignature(...ars_signature);
            let result = { _signature: _signed, url: `${url}&X-Bogus=${xbogus}&_signature=${_signed}`, xbogus, bodyEncoded, bodyJson };
            return result;
          };
        } else {
          await delay(200);
          return init();
        }
      };
      
      await init();
      
      // Triển khai hàm imFetch tối ưu hóa
      window.imFetch = async (options) => {
        try {
          let { link, cookie, body, parser, method, log, returnData, sessionid } = options;
          var myHeaders = new Headers();
          myHeaders.append('Accept', '*/*');
          myHeaders.append('Accept-Language', 'en-US,en;q=0.9');
          myHeaders.append('Connection', 'keep-alive');
          myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
          myHeaders.append('Cookie', cookie);
          myHeaders.append('DNT', '1');
          myHeaders.append('Origin', 'https://www.tiktok.com');
          myHeaders.append('Referer', 'https://www.tiktok.com/');
          myHeaders.append('Sec-Fetch-Dest', 'empty');
          myHeaders.append('Sec-Fetch-Mode', 'cors');
          myHeaders.append('Sec-Fetch-Site', 'same-site');
          
          let { userAgent } = navigator;
          myHeaders.append('User-Agent', userAgent);
          myHeaders.append('sec-ch-ua-mobile', '?0');
          myHeaders.append('sec-ch-ua-platform', '"macOS"');
          
          let ops = {
            headers: myHeaders,
            referrer: 'https://www.tiktok.com/',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          };
          
          if (body) ops.body = body;
          if (method) ops.method = method;
          
          // Timeout cho fetch
          const fetchPromise = fetch(link, ops);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Fetch timeout')), 15000);
          });
          
          return await new Promise((r, rj) => {
            Promise.race([fetchPromise, timeoutPromise])
              .then(async (a) => {
                if (!a || a.status >= 300) {
                  r({ is_error: true, data: "", status: a.status });
                  return;
                }
                
                let reader = null;
                let result = '';
                
                if (parser) {
                  if (a.body) {
                    reader = await a.body.getReader();
                  }
                  
                  if (reader) {
                    let read = await reader.read();
                    if (read && read.value && read.value.length) {
                      result = read.value.reduce(
                        (pre, cur) => pre + String.fromCharCode(cur),
                        ''
                      );
                    }
                  }
                }
                
                if (result && log) {
                  let [others, internal_exts] = link.split("internal_ext=");
                  let [internal_ext, other] = (internal_exts || "").split("&");
                  console.log(`${sessionid}: ${internal_ext}\n${result}`);
                }
                
                let msToken = a.headers.get("x-ms-token");
                r({
                  is_error: false,
                  data: returnData ? result : "",
                  status: a.status,
                  msToken,
                  dataLength: result ? result.length : 0,
                  result
                });
              })
              .catch((e) => {
                console.error("Fetch error:", e.message);
                rj(e);
              });
          });
        } catch (error) {
          console.log("error imfetch", error);
          return { is_error: true, error: error.stack, status: -1, msToken: "" };
        }
      };
    }, { loadScript, scriptSdk });
  }

  /**
   * Nạp script webmssdk_v2.js để xây dựng URLs
   */
  async loadInit2({ page, options }) {
    let { loadScript } = options;
    let scriptSdk2 = await strData(path.resolve("./src/webmssdk_v2.js"));

    let result = await page.evaluate(async ({ loadScript, scriptSdk }) => {
      if (loadScript) {
        window.eval(scriptSdk);
      }

      let delay = (time) => new Promise(r => setTimeout(r, time));
      
      let init = async function () {
        if (window.yg) {
          window.buildUrlFull = function ({ msToken, url, bodyEncoded, bodyJson }) {
            let f = yg[37];
            let path = f(url, bodyEncoded, msToken);
            let result = { url: path, bodyEncoded, bodyJson };
            return result;
          };
        } else {
          await delay(200);
          return init();
        }
      };
      
      await init();
      
      // Triển khai hàm imFetch tối ưu hóa
      window.imFetch = async (options) => {
        try {
          let { link, cookie, body, parser, method, log, returnData, sessionid } = options;
          var myHeaders = new Headers();
          myHeaders.append('Accept', '*/*');
          myHeaders.append('Accept-Language', 'en-US,en;q=0.9');
          myHeaders.append('Connection', 'keep-alive');
          myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
          myHeaders.append('Cookie', cookie);
          myHeaders.append('DNT', '1');
          myHeaders.append('Origin', 'https://www.tiktok.com');
          myHeaders.append('Referer', 'https://www.tiktok.com/');
          myHeaders.append('Sec-Fetch-Dest', 'empty');
          myHeaders.append('Sec-Fetch-Mode', 'cors');
          myHeaders.append('Sec-Fetch-Site', 'same-site');
          
          let { userAgent } = navigator;
          myHeaders.append('User-Agent', userAgent);
          myHeaders.append('sec-ch-ua-mobile', '?0');
          myHeaders.append('sec-ch-ua-platform', '"macOS"');
          
          let ops = {
            headers: myHeaders,
            referrer: 'https://www.tiktok.com/',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          };
          
          if (body) ops.body = body;
          if (method) ops.method = method;
          
          // Timeout cho fetch
          const fetchPromise = fetch(link, ops);
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('Fetch timeout')), 15000);
          });
          
          return await new Promise((r, rj) => {
            Promise.race([fetchPromise, timeoutPromise])
              .then(async (a) => {
                if (!a || a.status >= 300) {
                  r({ is_error: true, data: "", status: a.status });
                  return;
                }
                
                let reader = null;
                let result = '';
                
                if (parser) {
                  if (a.body) {
                    reader = await a.body.getReader();
                  }
                  
                  if (reader) {
                    let read = await reader.read();
                    if (read && read.value && read.value.length) {
                      result = read.value.reduce(
                        (pre, cur) => pre + String.fromCharCode(cur),
                        ''
                      );
                    }
                  }
                }
                
                if (result && log) {
                  let [others, internal_exts] = link.split("internal_ext=");
                  let [internal_ext, other] = (internal_exts || "").split("&");
                  console.log(`${sessionid}: ${internal_ext}\n${result}`);
                }
                
                let msToken = a.headers.get("x-ms-token");
                r({
                  is_error: false,
                  data: returnData ? result : "",
                  status: a.status,
                  msToken,
                  dataLength: result ? result.length : 0,
                  result
                });
              })
              .catch((e) => {
                console.error("Fetch error:", e.message);
                rj(e);
              });
          });
        } catch (error) {
          console.log("error imfetch", error);
          return { is_error: true, error: error.stack, status: -1, msToken: "" };
        }
      };
    }, { loadScript, scriptSdk: scriptSdk2 });
  }

  /**
   * Khởi tạo trang tạm thời
   */
  async initPageTemp(options) {
    try {
      if (this.pageTemp || this.initTemp == "processing" || this.initTemp == "success" || this.isClosed) {
        return;
      }
      
      options = options || {};
      
      if (!this.browser) {
        throw new Error("Browser is not initialized");
      }
      
      this.initTemp = "processing";
      let { cookies, userAgent: userAgentInit } = options;
      this.pageTemp = await this.browser.newPage();
      this.activePages.add(this.pageTemp);
      
      // Xác thực proxy nếu cần
      if (this.proxy) {
        let { protocol, host, port, username, password } = this.proxy;
        if (username && password) {
          await this.pageTemp.authenticate({ username, password });
        }
      }
      
      // Thiết lập User-Agent
      await this.pageTemp.setUserAgent(userAgentInit || this.userAgent);
      
      // Cấu hình viewport
      var window_size = { width: 320, height: 400 };
      await this.pageTemp.setViewport({ width: window_size.width, height: window_size.height, deviceScaleFactor: 0.5 });
      
      // Thiết lập cookies nếu có
      if (cookies && cookies.length) {
        await this.pageTemp.setCookie(...cookies);
      }
      
      // Mở trang và nạp scripts
      await this.pageTemp.goto(`https://webcast.tiktok.com/setting`);
      await this.pageTemp.reload({ waitUntil: 'networkidle2' });
      await this.pageTemp.setCacheEnabled(false);
      await delay(200);
      await this.loadInit({ page: this.pageTemp, options: { loadScript: true } });
      
      this.initTemp = "success";
    } catch (error) {
      console.log("[BrowserService] Error init page temp:", error);
      
      if (this.reTryInitTemp <= 3) { // Giảm từ 20 xuống 3 lần thử lại
        this.reTryInitTemp++;
        await delay(2000);
        return await this.initPageTemp(options);
      } else {
        this.initTemp = "pending";
      }
    }
  }

  /**
   * Lấy cookie mới từ trang TikTok
   */
  async getNewCookie() {
    try {
      if (!this.pageFetch) return;
      
      // Thiết lập cookies nếu có
      if (this.cookies && this.cookies.length) {
        await this.pageFetch.setCookie(...this.cookies);
      }
      
      // Truy cập trang TikTok để lấy cookies mới
      await this.pageFetch.goto("https://www.tiktok.com/explore");
      await delay(1000);
      
      // Lưu cookies mới
      this.cookies = await this.pageFetch.cookies();
      await delay(200);
      
      // Lấy device_id từ trang
      let innerHtml = await this.pageFetch.evaluate(() => {
        let result = "";
        let tag = document.querySelector("#SIGI_STATE");
        if (tag) result = tag.innerHTML;
        return result;
      });
      
      let device_id = getString(innerHtml || "", `wid":"`, `"`);
      this.pageFetch.device_id = device_id;
    } catch (error) {
      console.error("[BrowserService] Error getting new cookie:", error);
    }
  }

  /**
   * Thực hiện fetch từ trang
   */
  async fetch(options) {
    try {
      if (this.isClosed) return { is_error: false, status: 2000, data: "" };
      
      let page = this.pageFetch;
      if (!page) throw new Error(`Page fetch not found`);
      
      // Thiết lập timeout mặc định
      if (!options.timeout) {
        options.timeout = 15000; // Giảm từ 30s xuống 15s
      }
      
      // Thực hiện fetch thông qua trang
      let result = await page.evaluate((args) => {
        return window.imFetch(args);
      }, options);
      
      return result;
    } catch (error) {
      console.log("[BrowserService] Error page fetch", error);
      return { is_error: true, status: -1, data: "", error: error };
    }
  }

  /**
   * Fetch từ trang sign
   */
  async fetchPageSign(options) {
    try {
      if (this.isClosed) return { is_error: false, status: 2000, data: "" };
      
      let page = this.page;
      if (!page) throw new Error(`Page fetch not found`);
      
      let result = await page.evaluate((args) => {
        return window.imFetch(args);
      }, options);
      
      return result;
    } catch (error) {
      console.log("[BrowserService] Error page fetch", error);
      return { is_error: true, status: -1, data: "", error: error };
    }
  }

  /**
   * Khởi tạo cookies cho trang fetch
   */
  async initCookies(options) {
    try {
      let { cookies } = options;
      let page = this.pageFetch;
      
      // Không có trang, ném lỗi
      if (!page) throw new Error(`Page fetch not found`);
      
      // Xóa cookies hiện tại
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
      
      // Thiết lập cookies mới
      await this.pageFetch.setCookie(...cookies);
      return true;
    } catch (error) {
      console.log("[BrowserService] Error init cookies", error);
      return false;
    }
  }

  /**
   * Khởi tạo cookies cho trang sign
   */
  async initCookiesPageSign(options) {
    try {
      let { cookies } = options;
      let page = this.page;
      
      // Không có trang, ném lỗi
      if (!page) throw new Error(`Page fetch not found`);
      
      // Xóa cookies hiện tại
      const client = await page.target().createCDPSession();
      await client.send('Network.clearBrowserCookies');
      
      // Thiết lập cookies mới
      await this.page.setCookie(...cookies);
      return true;
    } catch (error) {
      console.log("[BrowserService] Error init cookies", error);
      return false;
    }
  }

  /**
   * Thiết lập proxy cho trang
   */
  async setProxy(proxy) {
    try {
      this.proxy = proxy || this.proxy;
      let page = this.pageFetch;
      
      // Không có trang, ném lỗi
      if (!page) throw new Error(`Page fetch not found`);
      
      // Thiết lập request interception
      await page.setRequestInterception(true);
      let { protocol, host, port, username, password } = this.proxy;
      this.proxyServer = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
      
      // Chặn và thêm proxy vào các requests
      page.on('request', (request) => {
        request.continue({ proxy: this.proxyServer });
      });
      
      return true;
    } catch (error) {
      console.error("[BrowserService] Error setting proxy:", error);
      return false;
    }
  }

  /**
   * Xóa proxy
   */
  async clearProxy() {
    try {
      let page = this.pageFetch;
      
      // Không có trang, ném lỗi
      if (!page) throw new Error(`Page fetch not found`);
      
      // Tắt request interception
      if (!page.isClosed()) {
        await page.setRequestInterception(false);
        await page.setExtraHTTPHeaders({ 'Proxy-Authorization': "" });
      }
      
      this.proxyServer = "";
      return true;
    } catch (error) {
      console.error("[BrowserService] Error clearing proxy:", error);
      return false;
    }
  }

  /**
   * Đánh dấu số trang đã tham dự
   */
  setAttendanced(total) {
    this.totalAttendanced = total;
  }

  /**
   * Đánh dấu một tác vụ đã hoàn thành
   */
  async done() {
    this.totalDone++;
    
    // Đóng trình duyệt nếu đã hoàn thành tất cả tác vụ
    if (this.totalAttendanced && this.totalDone == this.totalAttendanced && this.browser) {
      // Đóng trình duyệt
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * Tạo chữ ký từ trang fetch
   */
  async signPage(array) {
    if (!this.pageFetch) throw new Error("Page Fetch not found");
    
    try {
      return await this.pageFetch.evaluate((args) => {
        return window.sign(args);
      }, array);
    } catch (error) {
      console.log("[BrowserService] Error sign", error);
      return "";
    }
  }

  /**
   * Xây dựng URL có chữ ký từ trang fetch
   */
  async buildUrlPage(options) {
    if (!this.pageFetch) throw new Error("Page Fetch not found");
    return await this.buildUrl({ page: this.pageFetch, options });
  }

  /**
   * Xây dựng URL có chữ ký từ trang sign
   */
  async buildUrlPageSign(options) {
    if (!this.page) throw new Error("Page Fetch not found");
    return await this.buildUrl({ page: this.page, options });
  }

  /**
   * Xây dựng URL đầy đủ từ trang sign
   */
  async buildUrlPageFull(options) {
    if (!this.page) throw new Error("Page Fetch not found");
    return await this.buildUrlFull({ page: this.page, options });
  }

  /**
   * Xây dựng URL có chữ ký
   */
  async buildUrl({ page, options }) {
    let { url, bodyEncoded, bodyJson } = options;
    
    // Chuyển đổi giữa bodyEncoded và bodyJson
    if (bodyEncoded && !bodyJson) {
      options.bodyJson = querystring.encode(bodyEncoded);
    }
    if (bodyJson && !bodyEncoded) {
      options.bodyEncoded = querystring.stringify(bodyJson);
    }
    
    // Không có trang, ném lỗi
    if (!page) throw new Error("Page Fetch not found");
    
    // Thiết lập timeout mặc định
    if (!options.timeout) {
      options.timeout = 15000; // Giảm từ 30s xuống 15s
    }
    
    try {
      return await page.evaluate((args) => {
        return window.buildUrl(args);
      }, options);
    } catch (error) {
      console.log("[BrowserService] Error buildUrlPage", error);
      return "";
    }
  }

  /**
   * Xây dựng URL đầy đủ
   */
  async buildUrlFull({ page, options }) {
    let { url, bodyEncoded, bodyJson } = options;
    
    // Chuyển đổi giữa bodyEncoded và bodyJson
    if (bodyEncoded && !bodyJson) {
      options.bodyJson = querystring.encode(bodyEncoded);
    }
    if (bodyJson && !bodyEncoded) {
      options.bodyEncoded = querystring.stringify(bodyJson);
    }
    
    // Không có trang, ném lỗi
    if (!page) throw new Error("Page Fetch not found");
    
    // Thiết lập timeout mặc định
    if (!options.timeout) {
      options.timeout = 15000; // Giảm từ 30s xuống 15s
    }
    
    try {
      return await page.evaluate((args) => {
        return window.buildUrlFull(args);
      }, options);
    } catch (error) {
      console.log("[BrowserService] Error buildUrlPage", error);
      return "";
    }
  }

  /**
   * Dọn dẹp các trang không sử dụng
   */
  async cleanupUnusedPages() {
    try {
      if (!this.browser) return;
      
      const now = Date.now();
      const UNUSED_THRESHOLD = 5 * 60 * 1000; // 5 phút
      
      // Lấy tất cả các trang đang mở
      const allPages = await this.browser.pages();
      
      console.log(`[BrowserService] Checking unused pages: total ${allPages.length} pages`);
      
      // Không đóng trang chính
      const criticalPages = new Set();
      if (this.page) criticalPages.add(this.page);
      if (this.pageFetch) criticalPages.add(this.pageFetch);
      
      let closedCount = 0;
      
      // Duyệt và đóng các trang không sử dụng
      for (const page of allPages) {
        // Bỏ qua trang đã đóng
        if (page.isClosed()) continue;
        
        // Không đóng các trang quan trọng
        if (criticalPages.has(page)) continue;
        
        // Đóng trang và đánh dấu đã đóng
        try {
          await page.close();
          this.activePages.delete(page);
          closedCount++;
        } catch (err) {
          console.error("[BrowserService] Error closing page:", err.message);
        }
      }
      
      if (closedCount > 0) {
        console.log(`[BrowserService] Closed ${closedCount} unused pages`);
      }
      
      // Force GC nếu có thể
      if (global.gc) {
        try {
          global.gc();
        } catch (e) {}
      }
    } catch (err) {
      console.error("[BrowserService] Error in cleanupUnusedPages:", err);
    }
  }
}

module.exports = OptimizedBrowserService;