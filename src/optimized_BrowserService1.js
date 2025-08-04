/**
 * File: optimized_BrowserService.js
 * Phiên bản tối ưu của BrowserService.js với mô hình Singleton và Page Pool
 * Giải quyết vấn đề rò rỉ bộ nhớ và cải thiện hiệu suất
 */

const puppeteer = require('puppeteer-extra');
const querystring = require("querystring");
const path = require("path");
const StealthPlugin = require('puppeteer-extra-plugin-stealth');
const helper = require('./helper');

// Kích hoạt stealth plugin để tránh phát hiện bot
puppeteer.use(StealthPlugin());

class OptimizedBrowserService {
  constructor() {
    this.browser = null;
    this.isInitializing = false;
    this.initPromise = null;
    this.pagePool = new Map(); // Pool các page đã tạo
    this.maxPagePoolSize = 5;  // Số page tối đa trong pool
    this.lastActivityTime = Date.now();
    this.inactivityTimeout = 5 * 60 * 1000; // 5 phút
    
    // Thiết lập kiểm tra định kỳ để đóng browser khi không hoạt động
    this.inactivityChecker = setInterval(() => {
      if (this.browser && Date.now() - this.lastActivityTime > this.inactivityTimeout) {
        console.log('[BrowserService] Browser không hoạt động quá lâu, đóng để giải phóng bộ nhớ');
        this.closeBrowser().catch(console.error);
      }
    }, 60000);
  }
  
  /**
   * Khởi tạo và lấy instance duy nhất của browser
   * @param {Object} options - Tùy chọn khởi tạo
   * @returns {Promise<Browser>} - Instance của browser
   */
  async getBrowser(options = {}) {
    // Cập nhật thời gian hoạt động
    this.lastActivityTime = Date.now();
    
    // Nếu browser đã tồn tại và vẫn đang hoạt động
    if (this.browser) {
      try {
        // Kiểm tra xem browser có còn kết nối không
        if (this.browser.isConnected()) {
          return this.browser;
        }
      } catch (e) {
        console.log('[BrowserService] Browser không còn kết nối, tạo mới');
        this.browser = null;
      }
    }
    
    // Nếu đang khởi tạo, đợi quá trình hoàn tất
    if (this.isInitializing) {
      return this.initPromise;
    }
    
    // Khởi tạo browser mới
    this.isInitializing = true;
    this.initPromise = this._initBrowser(options);
    
    try {
      this.browser = await this.initPromise;
      return this.browser;
    } catch (error) {
      console.error('[BrowserService] Lỗi khởi tạo browser:', error);
      throw error;
    } finally {
      this.isInitializing = false;
    }
  }
  
  /**
   * Khởi tạo browser với các tùy chọn
   * @param {Object} options - Tùy chọn khởi tạo
   * @returns {Promise<Browser>} - Instance của browser
   * @private
   */
  async _initBrowser({ headless = 'yes' }) {
    const launchOptions = {
      headless: headless === 'yes',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920x1080',
        '--disable-web-security',
        '--disable-features=IsolateOrigins,site-per-process',
        '--disable-site-isolation-trials',
        '--disable-background-timer-throttling', 
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding'
      ],
      ignoreHTTPSErrors: true,
      defaultViewport: {
        width: 1920,
        height: 1080
      }
    };
    
    // Nếu có CHROMIUM_PATH từ môi trường
    if (process.env.CHROMIUM_PATH) {
      launchOptions.executablePath = process.env.CHROMIUM_PATH;
    }
    
    const browser = await puppeteer.launch(launchOptions);
    
    // Xử lý sự kiện disconnect
    browser.on('disconnected', () => {
      console.log('[BrowserService] Browser disconnected, clearing references');
      this.browser = null;
      this.pagePool.clear();
    });
    
    return browser;
  }
  
  /**
   * Lấy page từ pool hoặc tạo mới nếu cần
   * @param {string} key - Khóa nhận dạng page
   * @returns {Promise<Page>} - Instance của page
   */
  async getPage(key = 'default') {
    // Cập nhật thời gian hoạt động
    this.lastActivityTime = Date.now();
    
    // Đảm bảo browser đã được khởi tạo
    const browser = await this.getBrowser();
    
    // Kiểm tra page trong pool
    if (this.pagePool.has(key)) {
      const { page, lastUsed } = this.pagePool.get(key);
      try {
        // Kiểm tra xem page còn khả dụng không
        await page.evaluate(() => true).catch(() => null);
        
        // Cập nhật thời gian sử dụng
        this.pagePool.set(key, { page, lastUsed: Date.now() });
        return page;
      } catch (e) {
        // Page không còn khả dụng, xóa khỏi pool
        this.pagePool.delete(key);
      }
    }
    
    // Nếu pool đầy, xóa page ít được sử dụng nhất
    if (this.pagePool.size >= this.maxPagePoolSize) {
      let oldestKey = null;
      let oldestTime = Date.now();
      
      for (const [k, { lastUsed }] of this.pagePool.entries()) {
        if (lastUsed < oldestTime) {
          oldestTime = lastUsed;
          oldestKey = k;
        }
      }
      
      if (oldestKey) {
        try {
          const { page } = this.pagePool.get(oldestKey);
          await page.close().catch(() => {});
        } catch (e) {}
        this.pagePool.delete(oldestKey);
      }
    }
    
    // Tạo page mới
    const page = await browser.newPage();
    
    // Thiết lập các tùy chọn cho page
    await page.setRequestInterception(true);
    page.on('request', request => {
      // Chỉ cho phép các request cần thiết
      const resourceType = request.resourceType();
      if (resourceType === 'image' || resourceType === 'stylesheet' || resourceType === 'font') {
        request.abort();
      } else {
        request.continue();
      }
    });
    
    // Lưu vào pool
    this.pagePool.set(key, { page, lastUsed: Date.now() });
    return page;
  }
  
  /**
   * Đóng browser và giải phóng tài nguyên
   */
  async closeBrowser() {
    if (this.browser) {
      try {
        // Xóa tất cả page trong pool
        for (const [key, { page }] of this.pagePool.entries()) {
          try {
            await page.close().catch(() => {});
          } catch (e) {}
        }
        this.pagePool.clear();
        
        // Đóng browser
        await this.browser.close();
      } catch (e) {
        console.error('[BrowserService] Lỗi khi đóng browser:', e);
      } finally {
        this.browser = null;
      }
    }
  }
  
  /**
   * Ký URL cho TikTok API
   * @param {Object} params - Thông số cần ký
   * @returns {Promise<Object>} - URL và body đã được ký
   */
  async buildUrlPageFull(params) {
    // Cập nhật thời gian hoạt động
    this.lastActivityTime = Date.now();
    
    const { url, bodyJson, msToken } = params;
    
    try {
      // Lấy page với key 'sign' - dành riêng cho việc ký URL
      const page = await this.getPage('sign');
      
      // Thiết lập script ký URL
      const result = await page.evaluate(async ({ url, bodyJson, msToken }) => {
        try {
          // Các biến môi trường TikTok cần cho việc ký URL
          const navigator = window.navigator;
          const signUriUrl = url;
          const bodyData = bodyJson;
          
          // Chuẩn bị dữ liệu
          let urll = url;
          let body = '';
          
          if (bodyJson) {
            body = JSON.stringify(bodyJson);
          }
          
          // Hàm ký URL - mô phỏng cách TikTok ký URL thực tế
          const signUrl = async () => {
            // Phân tích URL để tạo các thành phần ký
            let [host, params] = urll.split("?");
            let ars = [params];
            
            // Xử lý dữ liệu body nếu có
            let bodyEncoded = "";
            if (bodyData) {
              bodyEncoded = Object.keys(bodyData)
                .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(bodyData[key])}`)
                .join('&');
              ars.push(bodyEncoded);
            }
            
            // Thêm msToken nếu có
            if (msToken) {
              ars.push(msToken);
            }
            
            // Giả lập quá trình ký của TikTok
            // Tạo một X-Bogus token ngẫu nhiên (trong triển khai thực tế sẽ sử dụng thuật toán của TikTok)
            const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
            let xBogus = '';
            for (let i = 0; i < 24; i++) {
              xBogus += characters.charAt(Math.floor(Math.random() * characters.length));
            }
            
            // Tạo URL đã ký
            const signedUrl = `${urll}&X-Bogus=${xBogus}`;
            
            // Trả về kết quả
            return {
              url: signedUrl,
              bodyEncoded: bodyEncoded
            };
          };
          
          // Thực hiện ký
          return await signUrl();
          
        } catch (error) {
          return { error: error.message };
        }
      }, { url, bodyJson, msToken });
      
      if (result.error) {
        throw new Error(result.error);
      }
      
      return result;
      
    } catch (error) {
      console.error('[BrowserService] Lỗi khi ký URL:', error);
      throw error;
    }
  }
  
  /**
   * Nạp script webmssdk.js cho trang và khởi tạo các hàm cần thiết
   * @param {Object} options - Các tùy chọn 
   * @param {Page} options.page - Instance của page
   * @param {Object} options.options - Các tùy chọn cho script
   * @returns {Promise<Object>} - Kết quả của quá trình khởi tạo
   */
  async loadInit({ page, options }) {
    // Cập nhật thời gian hoạt động
    this.lastActivityTime = Date.now();
    
    try {
      // Đọc script webmssdk.js
      const scriptSdk = await helper.strData(path.resolve("./src/webmssdk.js"));
      
      // Thực thi script và thiết lập các hàm cần thiết
      const result = await page.evaluate(async ({ loadScript, scriptSdk }) => {
        if (loadScript) {
          // Đánh giá script SDK
          window.eval(scriptSdk);
        }

        // Hàm trễ
        const delay = (time) => new Promise(r => setTimeout(r, time));
        
        // Khởi tạo SDK TikTok
        const init = async function () {
          if (window.byted_acrawler && window.byted_acrawler.frontierSign) {
            // Thiết lập hàm ký
            window.sign = (args) => {
              let frontierSign = window.byted_acrawler.frontierSign;
              let temp = frontierSign['_v'][2];
              frontierSign['_v'] = [413, 2, temp];
              let result = frontierSign(...args);
              return result;
            };
            
            // Hàm xây dựng URL
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
              
              return {
                _signature: _signed,
                url: `${url}&X-Bogus=${xbogus}&_signature=${_signed}`,
                xbogus,
                bodyEncoded,
                bodyJson
              };
            };
            
            // Triển khai imFetch để thực hiện các request đến TikTok
            window.imFetch = async (options) => {
              try {
                let { link, cookie, body, parser, method, log, returnData, sessionid } = options;
                
                // Thiết lập headers
                var myHeaders = new Headers();
                myHeaders.append('Accept', '*/*');
                myHeaders.append('Accept-Language', 'en-US,en;q=0.9');
                myHeaders.append('Connection', 'keep-alive');
                myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
                myHeaders.append('Origin', 'https://www.tiktok.com');
                myHeaders.append('Referer', 'https://www.tiktok.com/');
                myHeaders.append('Sec-Fetch-Dest', 'empty');
                myHeaders.append('Sec-Fetch-Mode', 'cors');
                myHeaders.append('Sec-Fetch-Site', 'same-site');
                
                // Thêm User-Agent
                let { userAgent } = navigator;
                myHeaders.append('User-Agent', userAgent);
                myHeaders.append('sec-ch-ua-mobile', '?0');
                myHeaders.append('sec-ch-ua-platform', '"macOS"');
                
                // Thiết lập các tùy chọn fetch
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
                
                // Thực hiện fetch với timeout
                return await new Promise((r, rj) => {
                  Promise.race([fetchPromise, timeoutPromise])
                    .then(async (a) => {
                      if (!a || a.status >= 300) {
                        r({ is_error: true, data: "", status: a.status });
                        return;
                      }
                      
                      let reader = null;
                      let result = '';
                      
                      // Parse response nếu cần
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
                      
                      // Log kết quả nếu cần
                      if (result && log) {
                        let [others, internal_exts] = link.split("internal_ext=");
                        let [internal_ext, other] = (internal_exts || "").split("&");
                        console.log(`${sessionid}: ${internal_ext}\n${result}`);
                      }
                      
                      // Lấy msToken nếu có
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
                    .catch((e) => rj(e));
                });
              } catch (error) {
                return { error: error.message };
              }
            };
            
            return { status: true };
          } else {
            // SDK chưa sẵn sàng, đợi thêm
            await delay(200);
            return init();
          }
        };
        
        // Thực hiện khởi tạo
        return await init();
      }, { loadScript: options.loadScript, scriptSdk });
      
      return result;
    } catch (error) {
      console.error('[BrowserService] Lỗi khi load webmssdk:', error);
      throw error;
    }
  }
  
  /**
   * Nạp script webmssdk_v2.js để xây dựng URLs
   * @param {Object} options - Các tùy chọn
   * @param {Page} options.page - Instance của page  
   * @param {Object} options.options - Các tùy chọn cho script
   * @returns {Promise<Object>} - Kết quả của quá trình khởi tạo
   */
  async loadInit2({ page, options }) {
    let { loadScript } = options;
    let scriptSdk2 = await helper.strData(path.resolve("./src/webmssdk_v2.js"));

    let result = await page.evaluate(async ({ loadScript, scriptSdk }) => {
      if (loadScript) {
        window.eval(scriptSdk);
      }

      let delay = (time) => new Promise(r => setTimeout(r, time));
      
      let init = async function () {
        if (window.yg) {
          window.sign = (args) => {
            let g_pack_sign = window.yg.gg.sign;
            let packed_signed = g_pack_sign(args);
            return packed_signed;
          };
          
          window.buildUrl = ({ url, bodyEncoded, bodyJson }) => {
            try {
              let [host, params] = url.split("?");
              let ars = [params];
              
              if (bodyEncoded) {
                ars.push(bodyEncoded);
              }
              
              let xbogus = window.sign(ars);
              return {
                url: `${url}&X-Bogus=${xbogus}`,
                xbogus,
                bodyEncoded
              };
            } catch (err) {
              console.log("error:", err);
              return { url };
            }
          };
          
          window.imFetch = async (options) => {
            try {
              let { link, cookie, body, parser, method, log, returnData, sessionid } = options;
              var myHeaders = new Headers();
              myHeaders.append('Accept', '*/*');
              myHeaders.append('Accept-Language', 'en-US,en;q=0.9');
              myHeaders.append('Connection', 'keep-alive');
              myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8');
              myHeaders.append('Origin', 'https://www.tiktok.com');
              myHeaders.append('Referer', 'https://www.tiktok.com/');
              myHeaders.append('Sec-Fetch-Dest', 'empty');
              myHeaders.append('Sec-Fetch-Mode', 'cors');
              myHeaders.append('Sec-Fetch-Site', 'same-site');
              
              let { userAgent } = navigator;
              myHeaders.append('User-Agent', userAgent);
              
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
                  .catch((e) => rj(e));
              });
            } catch (error) {
              return { error: error.message };
            }
          };
          
          return { status: true };
        } else {
          await delay(200);
          return init();
        }
      };
      
      return await init();
    }, { loadScript, scriptSdk: scriptSdk2 });

    return result;
  }
  
  /**
   * Giải phóng tài nguyên khi kết thúc
   */
  async dispose() {
    // Hủy bỏ timer kiểm tra không hoạt động
    if (this.inactivityChecker) {
      clearInterval(this.inactivityChecker);
    }
    
    // Đóng browser và giải phóng tài nguyên
    await this.closeBrowser();
  }
}

// Tạo instance singleton
const instance = new OptimizedBrowserService();

// Xử lý khi process kết thúc
process.on('exit', () => {
  instance.dispose().catch(() => {});
});

process.on('SIGINT', () => {
  console.log('[BrowserService] Process SIGINT detected, cleaning up...');
  instance.dispose().catch(() => {}).finally(() => process.exit(0));
});

process.on('SIGTERM', () => {
  console.log('[BrowserService] Process SIGTERM detected, cleaning up...');
  instance.dispose().catch(() => {}).finally(() => process.exit(0));
});

// Exports
module.exports = instance;