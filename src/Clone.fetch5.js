/**
 * File: optimized_Clone.fetch4.js
 * Phiên bản tối ưu của Clone.fetch4.js
 * Giải quyết vấn đề rò rỉ bộ nhớ và cải thiện hiệu suất
 */

const fs = require('fs');
const path = require("path");
const helper = require('./helper');
const { 
  delay, 
  getString, 
  parserProxyString, 
  clearCacheForFile, 
  getRandomInt,
  getTime,
  checkCookieLive
} = helper;
const request = require("request");

// Tránh require lặp đi lặp lại
const config_file = path.resolve('./data/config.v5.json');
clearCacheForFile(config_file);

// Singleton pattern cho BrowserService với cơ chế giải phóng
let browserServiceInstance = null;
let browserInstanceCache = new Map();

// Hàm lấy browser service với cache và giới hạn số lượng instance
const getBrowserService = async () => {
  if (!browserServiceInstance) {
    const BrowserService = require("./optimized_BrowserService");
    browserServiceInstance = BrowserService;
  }
  return browserServiceInstance;
};

// Cache và giải phóng browser instance 
const getBrowserInstance = async (userAgent, options = { initSign: true, headless: "yes" }) => {
  const cacheKey = `${userAgent}_${options.headless}_${options.initSign}`;
  
  if (!browserInstanceCache.has(cacheKey)) {
    // Giới hạn số lượng instance tối đa
    if (browserInstanceCache.size >= 2) {
      // Đóng và giải phóng instance cũ nhất
      const oldestKey = Array.from(browserInstanceCache.keys())[0];
      const oldInstance = browserInstanceCache.get(oldestKey);
      try {
        if (oldInstance && typeof oldInstance.close === 'function') {
          await oldInstance.close();
        }
      } catch (e) {}
      browserInstanceCache.delete(oldestKey);
    }
    
    const BrowserService = await getBrowserService();
    const instance = await BrowserService.getInstance(userAgent, options);
    browserInstanceCache.set(cacheKey, instance);
  }
  
  return browserInstanceCache.get(cacheKey);
};

// Giải phóng tất cả browser instance
const releaseAllBrowserInstances = async () => {
  for (const [key, instance] of browserInstanceCache.entries()) {
    try {
      if (instance && typeof instance.close === 'function') {
        await instance.close();
      }
    } catch (e) {}
  }
  browserInstanceCache.clear();
  browserServiceInstance = null;
};

// Cấu hình hệ điều hành và UserAgent
const os = require("os");
const os_type = os.type();

const getSystemConfig = () => {
  let os_ver = "";
  let browser_platform = "";
  
  switch (os_type) {
    case "Linux": {
      os_ver = "X11; Ubuntu; Linux x86_64";
      browser_platform = encodeURIComponent("Linux x86_64");
      break;
    } 
    case "Windows_NT": {
      os_ver = "Windows NT 10.0; Win64; x64";
      browser_platform = "Win32";
      break;
    } 
    case "Darwin": {
      os_ver = "Macintosh; Intel Mac OS X 10_15_7";
      browser_platform = "MacIntel";
      break;
    } 
    default: {
      os_ver = "X11; Ubuntu; Linux x86_64";
      browser_platform = encodeURIComponent("Linux x86_64");
    }
  }
  
  return {
    os_ver,
    browser_platform,
    userAgentDefault: `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`,
  };
};

// Cache config hệ thống để tránh tính toán lặp đi lặp lại
const sysConfig = getSystemConfig();
const userAgentDefault = sysConfig.userAgentDefault;
const appVersionDefault = userAgentDefault.replace("Mozilla/", "");
const browser_platform = sysConfig.browser_platform;

/**
 * Class Clone tối ưu hóa để giảm sử dụng bộ nhớ
 */
class OptimizedClone {
  constructor({ cookie_string, task_id, room_id, proxy, proxy_list }) {
    this.task_id = task_id;
    this.cookie_string = cookie_string;
    this.username = getString(cookie_string, 'username=', ';');
    this.session_id = getString(cookie_string, 'sessionid=', ';');
    this.room_id = room_id;
    this.proxy = proxy;
    this.proxy_list = proxy_list;
    this.failTime = 0;
    this.status = "running";
    this.browser_platform = browser_platform;
    
    // Device ID từ cookie hoặc random nếu không có
    let random_de = getRandomInt(187248723442, 934782374123);  
    this.device_id = getString(cookie_string, ';wid=', ';') || ("7284943" + random_de);
    
    this.is_first = true;
    this.status_viewer = -1; // 3 - no login, 1 viewed, 2 - error, 4 - 403
    this.endpoint = "";
    this.imfetch_time = 0;
    this.delay_all_time = 8000;
    this.delay_10_time = 45000;
    this.delay = this.delay_all_time;
    this.url = "";
    this.is_10_time = true;
    
    // Cache cho HTTP request - với kích thước giới hạn
    this._requestCache = new Map();
    this._maxCacheSize = 20; // Giảm kích thước cache
    
    // Khởi tạo biến theo cách tránh undefined
    this.cursor = '';
    this.internal_ext = '';
    this.history_comment_cursor = 0;
    this.last_rtt = -1;
    
    // Khởi tạo timer để dọn dẹp cache định kỳ
    this._setupCleanupTimer();
  }
  
  /**
   * Thiết lập timer định kỳ dọn dẹp bộ nhớ
   */
  _setupCleanupTimer() {
    // Giải phóng timer cũ nếu có
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
    }
    
    // Tạo timer mới chạy mỗi 2 phút
    this._cleanupTimer = setInterval(() => {
      this._cleanupRequestCache();
    }, 120000);
  }
  
  /**
   * Khởi động quá trình fetch dữ liệu TikTok Live
   */
  async run() {
    this.status = "running";
    try {
      let is_join = await this.runJoin();
      if (is_join) {
        this.status = "running";
        await this.runFetchs();
        return true;
      } else {
        this.status = "end";
        return false;
      }
    } catch (err) {
      console.error(`[${getTime()}] Error in run for ${this.username}:`, err.message);
      this.status = "end";
      return false;
    }
  }
  
  /**
   * Hủy và giải phóng tài nguyên
   */
  async cancel() {
    this.status = "end";
    
    // Giải phóng timer
    if (this._cleanupTimer) {
      clearInterval(this._cleanupTimer);
      this._cleanupTimer = null;
    }
    
    // Xóa cache
    if (this._requestCache) {
      this._requestCache.clear();
      this._requestCache = null;
    }
    
    // Giải phóng bộ nhớ tham chiếu lớn
    this.cookie_string = null;
    this.proxy = null;
    this.proxy_list = null;
    
    // Giải phóng bộ nhớ
    for (const key of Object.keys(this)) {
      if (typeof this[key] === 'object' && this[key] !== null) {
        this[key] = null;
      }
    }
    
    // Force GC nếu có thể
    if (global.gc) {
      try {
        global.gc();
      } catch (e) {}
    }
  }
  
  /**
   * Tạm dừng kết nối
   */
  async pause() {
    this.status = "pause";
  }
  
  /**
   * Khôi phục kết nối sau khi tạm dừng
   */
  async resume() {
    this.status = "running";
  }
  
  /**
   * Kiểm tra và thực hiện kết nối ban đầu
   */
  async runJoin() {
    try {
      // Kiểm tra tình trạng cookie trước khi kết nối
      let cookie_status = await checkCookieLive({ 
        username: this.username, 
        cookie_string: this.cookie_string, 
        proxy: this.proxy, 
        proxy_list: this.proxy_list 
      }); 
      
      if (!cookie_status.status || !cookie_status.live) {
        console.log(getTime(), this.username, `Cookie die`);
        this.status_viewer = 3;
        return false;
      }
      
      // Gọi API enter để tham gia vào phòng live
      let res1 = await this.callApi({ type: "enter" });
      let is_good = false;
      
      if (res1 && res1.body && res1.body.includes('user_side_title')) {
        is_good = true;
      }
      
      if ([-1, 1].includes(this.status_viewer) && is_good) {
        return true;
      } else {
        console.log(getTime(), this.username, "enter", this.status_viewer, is_good);
        return false;
      }
    } catch (err) {
      console.error(`[${getTime()}] Error joining room for ${this.username}:`, err.message);
      return false;
    }
  }
  
  /**
   * Thực hiện các lệnh fetch liên tục để duy trì kết nối
   */
  async runFetchs() {
    let is_run = true;
    this.setCursor = true;
    
    // Memory usage monitoring
    let lastMemCheck = Date.now();
    const MEMORY_CHECK_INTERVAL = 300000; // 5 phút
    
    while (is_run) {
      try {
        if (this.status === "running") {
          // Kiểm tra và giải phóng bộ nhớ định kỳ
          if (Date.now() - lastMemCheck > MEMORY_CHECK_INTERVAL) {
            this._cleanupRequestCache();
            lastMemCheck = Date.now();
          }
          
          let r_enter = await this.fetch();
          if (r_enter.is_403) {
            is_run = false;
            this.status_viewer = 4;
          }
          
          await delay(this.delay);
          this.imfetch_time++;
        } else if (this.status === "pause") {
          await delay(1000);
        } else if (this.status === "resume") {
          this.status = "running";
          await delay(1000);
        } else if (this.status === "end") {
          is_run = false;
        }
      } catch (err) {
        console.error(`[${getTime()}] Error in fetch loop for ${this.username}:`, err.message);
        
        // Nếu lỗi nhiều lần liên tiếp, thoát khỏi vòng lặp
        this.failTime++;
        if (this.failTime > 5) {
          is_run = false;
        }
        
        await delay(3000); // Đợi một chút trước khi thử lại
      }
    }
    
    // Dọn dẹp sau khi kết thúc vòng lặp
    this._cleanupRequestCache();
  }
  
  /**
   * Gọi API TikTok
   */
  async callApi({ type }) {
    const { cookie_string, room_id, msToken: cmsToken, session_id: csession_id, timeout } = this;
    const requestTimeout = timeout || 30000;
    
    // Parse các thông tin cần thiết từ cookie
    const msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
    const session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
    this.tt_csrf_token = getString(cookie_string.replace(/ /g,'') + ';', 'tt_csrf_token=', ';');
    this.s_v_web_id = getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
    this.session_id = session_id;
    
    // Thông số cấu hình
    const device_type = "web_h264";
    const screen_height = 982;
    const screen_width = 1512;
    
    try {
      if (!session_id) {
        throw new Error("Cookie no session id");
      }
      
      let url = "";
      let _bodyJson = null;
      
      // Sử dụng browser instance được cache
      const br = await getBrowserInstance(userAgentDefault, {
        initSign: true, 
        headless: "yes"
      });
      
      // Verify FP từ cookie
      const verifyFp = getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
      
      // Cấu hình request dựa trên loại hành động
      switch (type) {
        case "leave":
          url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${this.device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`;
          _bodyJson = { reason: 0, room_id: room_id };
          break;
          
        case "enter":
          url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${this.device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=0&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=${screen_height}&screen_width=${screen_width}&tz_name=Asia%2FBangkok&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`;
          _bodyJson = { enter_source: "others-others", room_id: room_id };
          break;
          
        case "name":
          url = `https://www.tiktok.com/api/update/profile/?WebIdLastTime=&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${this.device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&odinId=${this.userId}&os=mac&priority_region=&referer=&region=VN&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${this.s_v_web_id}&webcast_language=vi-VN&msToken=${msToken}`;
          _bodyJson = {
            'nickname': this.name,
            'tt_csrf_token': this.tt_csrf_token
          };
          break;
      }
      
      // Ký URL và body request với browser service
      const { url: targetUrl, bodyEncoded } = await br.buildUrlPageFull({
        url,  
        bodyJson: _bodyJson, 
        msToken
      });
      
      // Cấu hình HTTP request
      const options = {
        proxy: parserProxyString(this.proxy),
        'method': 'POST',
        'url': targetUrl,
        'headers': {
          'Accept': '*/*',
          'Accept-Language': 'en-US,en;q=0.9',
          'Connection': 'keep-alive',
          'Cookie': cookie_string,
          'Origin': 'https://www.tiktok.com',
          'Referer': 'https://www.tiktok.com',
          'Sec-Fetch-Dest': 'empty',
          'Sec-Fetch-Mode': 'cors',
          'Sec-Fetch-Site': 'same-origin',
          'User-Agent': userAgentDefault,
          'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
          'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="24"',
          'sec-ch-ua-mobile': '?0',
          'sec-ch-ua-platform': '"macOS"',
          'x-secsdk-csrf-token': 'DOWNGRADE'
        },
        body: bodyEncoded,
        isRetry: false,
        timeout: requestTimeout
      };
      
      // Thực hiện request
      const data_page = await this.makeRequest(options);
      if (data_page.status == 403) {
        throw new Error("Request failed with status code 403");
      }
      
      if (data_page.error && data_page.error != "Request timeout") {
        console.log(data_page.error);
      }
      
      // Xử lý response
      if (data_page.body) {
        const code = data_page.bodyJson?.status_code;
        const message = data_page.bodyJson?.data?.message;
        
        return { 
          is_403: false, 
          is_dead: message === "User doesn't login" || code === 20003, 
          body: data_page.body 
        };
      }
      
      return { is_403: false, body: data_page.body };
      
    } catch (error) {
      console.log("error call api", this.session_id, error.message);
      return { 
        is_403: error.message == "Request failed with status code 403", 
        error: error.message 
      };
    }
  }
  
  /**
   * Thực hiện HTTP request với retry logic và caching
   */
  async makeRequest(options) {
    const that = this;
    
    // Destructure options
    let {
      url, 
      headers, 
      method, 
      proxy, 
      retryCount, 
      body, 
      timeout, 
      retryTime, 
      proxy_list, 
      form, 
      preCheckRetry, 
      retryAfter
    } = options;
    
    // Kiểm tra URL hợp lệ
    if (!url || (url.includes("X-Gnarly") === false && url.includes("webcast") === true)) {
      return { error: "None sign", body: "", headers: {}, status: null };
    }
    
    // Thiết lập giá trị mặc định
    method = method || "get";
    retryTime = retryTime || 2;
    retryAfter = retryAfter || 1000;
    let isGetBody = options.hasOwnProperty("isGetBody") ? options.isGetBody : true;
    let isRetry = options.hasOwnProperty("isRetry") ? options.isRetry : true;
    let retry = retryCount || 0;
    
    // Cache key cho request này
    const cacheKey = `${method}:${url.substring(0, 100)}:${body ? body.substring(0, 50) : ''}`;
    
    // Kiểm tra cache
    if (this._requestCache && this._requestCache.has(cacheKey) && retry === 0) {
      const cachedResponse = this._requestCache.get(cacheKey);
      if (Date.now() - cachedResponse.timestamp < 5000) { // Cache trong 5 giây
        return cachedResponse.data;
      }
    }
    
    // Tạo promise để xử lý request
    const head = await new Promise(r => {
      const reqOptions = {
        url,
        method: method.toUpperCase(),
        headers: headers,
        body,
        timeout: timeout || 30000
      };
      
      if (body) reqOptions.body = body;
      if (form) reqOptions.form = form;
      
      let done = false;
      
      // Timeout handler
      const timeoutId = setTimeout(() => {
        if (!done) {
          done = true;
          return r({ error: "Request timeout", body: "", headers: {}, status: null });
        }
      }, timeout || 30000);
      
      // Xử lý proxy
      if (proxy) {
        let proxystr = "";
        if (typeof proxy == "string") {
          proxystr = proxy;
          if (!proxy.includes("https") && !proxy.includes("http")) {
            const parsedProxy = parserProxyString(proxy);
            proxystr = `${parsedProxy.protocol || "http"}://${parsedProxy.username && parsedProxy.password ? `${parsedProxy.username}:${parsedProxy.password}@` : ''}${parsedProxy.host}:${parsedProxy.port}`;
          }
        } else {
          const { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
        }
        reqOptions.proxy = proxystr;
      }
      
      // Thực hiện request
      const req = request(reqOptions, (error, response, body) => {
        // Hủy timeout để tránh memory leak
        clearTimeout(timeoutId);
        
        if (!body) {
          that.status_viewer = 6;
        }
        
        // Kiểm tra trạng thái response
        if (response && response.statusCode == 403) {
          that.status_viewer = 4;
        } else if (url.includes("webcast/room/enter")) {
          if (body && body.includes('"status_code":20003')) {
            that.status_viewer = 3; // logout
          } else if (body && body.includes('"status_code":4003182')) {
            that.status_viewer = 2;
          } else if (body && body.includes('AnchorABMap')) {
            that.status_viewer = 1; // good
          } else if (body && body.includes('"status_code":30003')) {
            that.status_viewer = 5; //finish
          }
        }
        
        // Trả về kết quả
        if (!done) {
          done = true;
          
          // Giảm kích thước dữ liệu lưu trữ
          const headers = response ? {
            'set-cookie': response.headers['set-cookie']
          } : {};
          
          return r({
            error, 
            body: body ? body.toString("utf8") : "", 
            headers, 
            status: response ? response.statusCode : null 
          });
        }
      });
      
      // Đảm bảo request được hủy đúng cách nếu timeout
      req.on('error', (err) => {
        if (!done) {
          done = true;
          clearTimeout(timeoutId);
          return r({ error: err.message, body: "", headers: {}, status: null });
        }
      });
    });
    
    // Kiểm tra nếu cần retry
    let isRetryPreCheck = false;
    if (typeof preCheckRetry === 'function') {
      try {
        isRetryPreCheck = await preCheckRetry(head.body || "", head);
      } catch (e) {
        console.log("err pre", e);
      }
    }
    
    // Parse JSON body nếu có thể
    let bodyJson = null;
    try { 
      if (head.body) {
        bodyJson = JSON.parse(head.body);
      } 
    } catch (e) {}
    
    head.bodyJson = bodyJson;
    
    // Retry logic
    if (isRetryPreCheck || head.error || (!head.body && isGetBody)) {
      if (retry < retryTime && isRetry) {
        if (proxy_list && proxy_list.length > 0) {
          options.proxy = proxy_list[Math.floor((Math.random() * proxy_list.length))];
        }
        retry++;
        options.retryCount = retry;
        await delay(retryAfter || 1000);
        return this.makeRequest(options);
      }
      return head;
    }
    
    // Cache kết quả thành công - giảm dữ liệu lưu trữ
    if (!head.error && this._requestCache) {
      // Giảm kích thước dữ liệu lưu trong cache
      const minimalHead = {
        body: head.body,
        bodyJson: head.bodyJson,
        headers: head.headers,
        status: head.status
      };
      
      this._requestCache.set(cacheKey, {
        timestamp: Date.now(),
        data: minimalHead
      });
      
      // Kiểm tra và làm sạch cache nếu quá lớn
      if (this._requestCache.size > this._maxCacheSize) {
        this._cleanupRequestCache();
      }
    }
    
    return head;
  }
  
  /**
   * Làm sạch cache request để tránh rò rỉ bộ nhớ
   */
  _cleanupRequestCache() {
    if (!this._requestCache || this._requestCache.size === 0) {
      return;
    }
    
    // Chỉ giữ lại 5 requests gần nhất - giảm xuống từ 10
    if (this._requestCache.size > 5) {
      const keysToDelete = Array.from(this._requestCache.entries())
        .sort((a, b) => a[1].timestamp - b[1].timestamp)
        .slice(0, this._requestCache.size - 5)
        .map(entry => entry[0]);
        
      keysToDelete.forEach(key => this._requestCache.delete(key));
    }
    
    // Thử chạy GC nếu có thể
    if (global.gc) {
      try {
        global.gc();
      } catch (e) {}
    }
  }
  
  /**
   * Encode URL components theo chuẩn RFC3986
   */
  encodeRFC3986URIComponent(str) {
    return encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }
  
  /**
   * Thực hiện fetch dữ liệu từ TikTok Live
   */
  fetch() {
    return new Promise(async r => {
      let start = Date.now();
      let done = false;
      
      try {
        // Parse thông tin từ cookie
        const { cookie_string, msToken: cmsToken, session_id: csession_id } = this;
        const msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
        const session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', ';sessionid=', ';') ||
          getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
        
        this.session_id = session_id;
        
        if (!session_id) {
          throw new Error("Cookie no session id");
        }
        
        // Sử dụng browser instance được cache
        const br = await getBrowserInstance(userAgentDefault, { initSign: true, headless: "yes" });
        
        // Cấu hình các params cho fetch
        let history_comment_cursor = this.history_comment_cursor || 0;
        let cursor = this.cursor || '';
        let internal_ext = this.internal_ext || '';
        
        // Xây dựng endpoint URL
        let endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${encodeURI(appVersionDefault)}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=${this.last_rtt}&internal_ext=${(internal_ext).replaceAll("|","%7C")}&cursor=${cursor}&history_comment_cursor=${history_comment_cursor}&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`;
        
        if (!internal_ext) {
          endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${encodeURI(appVersionDefault)}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=-1&internal_ext=0&cursor=0&history_comment_cursor=0&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`;
        }
        
        // Điều chỉnh endpoint và delay dựa trên số lần fetch
        if (this.imfetch_time >= 11) {
          endpoint = this.endpoint;
          this.delay = getRandomInt(30, 45) * 1000;
        } else {
          this.endpoint = endpoint;
          this.delay = this.delay_all_time;
        }
        
        // Route API
        const route = 'https://webcast.tiktok.com/webcast/im/fetch/';
        
        // Ký URL với browser service
        const { url: targetUrl } = await br.buildUrlPageFull({
          url: `${route}?${endpoint}`, 
          msToken
        });
        
        // Cấu hình request
        const options = {
          proxy_list: this.proxy_list,
          proxy: parserProxyString(this.proxy),
          'method': 'GET',
          timeout: 30000,
          'url': targetUrl,
          'headers': {
            'Accept': '*/*',
            'Accept-Language': 'en-US,en;q=0.9',
            'Connection': 'keep-alive',
            'Cookie': cookie_string,
            "priority": "u=1, i",
            'Origin': 'https://www.tiktok.com',
            'Referer': 'https://www.tiktok.com',
            'Sec-Fetch-Dest': 'empty',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Site': 'same-origin',
            'User-Agent': userAgentDefault,
            'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            "dnt": "1",
            'x-secsdk-csrf-token': 'DOWNGRADE'
          },
          isRetry: true,
          retryTime: 2,
          preCheckRetry: (body) => {
            return !body || !body.includes(`wrss`);
          }
        };
        
        // Ghi nhận thời gian bắt đầu fetch
        this.last_time = Date.now();
        
        // Thực hiện request
        const data_page = await this.makeRequest(options);
        
        // Cập nhật cookie nếu cần
        if (data_page.headers && data_page.headers['set-cookie'] && data_page.headers['set-cookie'].length) {
          const msTokenCookie = data_page.headers['set-cookie'].find(c => c.includes('msToken='));
          if (msTokenCookie) {
            const msToken = getString(msTokenCookie, 'msToken=', ';');
            if (msToken) {
              this.cookie_string = cookie_string.replace(/msToken=[^;]+/g, `msToken=${msToken}`);
            }
          }
        }
        
        // Cập nhật RTT
        this.last_rtt = Date.now() - this.last_time;
        
        // Helpers để xử lý response
        const Wrss = (data) => {
          const match = data.match(/wrss(.*?):/) || [];
          const w = match[1] || "";
          return w.slice(2, 45);
        };
        
        const getData = (split, current, is_last_time) => {
          split = split || [];
          current = current || split.length - 1;
          
          if (is_last_time) current = 0;
          if (current == -1) return "";
          if (split[current].includes("fetch_time")) return split[current];
          
          return getData(split, current - 1, current - 1 == 0);
        };
        
        const getHistoryComment = (split) => {
          let history_comment = "";
          
          for (let i = 0; i < split.length; i++) {
            if (split[i].includes("ws_proxy")) {
              history_comment = split[i].slice(-19);
              break;
            }
          }
          
          return history_comment.replace(/\D/g, "");
        };
        
        // Xử lý response và trả kết quả
        if (!done) {
          done = true;
          
          // Xử lý lỗi nếu có
          if (data_page.error) {
            console.log("error fetch", this.session_id, data_page.error);
          }
          
          if (data_page.status == 403) {
            console.log("fetch 403", this.session_id);
            throw new Error("Request failed with status code 403");
          }
          
          // Xử lý dữ liệu response thành công
          if (data_page.body && data_page.body.length) {
            const split = data_page.body.split('\n');
            const wrss = Wrss(data_page.body);
            
            if (wrss) {
              this.wrss = wrss.replace(":", "");
            }
            
            const str = getData(split);
            let ext = getString(str, 'fetch_time').replace('0\x01:&', '').replace(/\x01/g, "").replace(":\t", "");
            const cursor = getString(ext, 'next_cursor:', '|').replace('\x01:&', '');
            
            if (!this.history_comment_cursor) {
              this.history_comment_cursor = getHistoryComment(split);
            }
            
            if (this.setCursor) {
              ext = ext.replace(/:3$/, "");
              ext = ext.endsWith("00") ? ext.replace(/0$/, "") : ext;
              this.internal_ext = 'fetch_time' + ext;
              this.cursor = cursor;
            }
          }
          
          const result = { 
            is_403: data_page.status == 403, 
            is_fetch: true, 
            process_time: Date.now() - start
          };
          
          return r(result);
        }
        
      } catch (error) {
        console.log("error fetch:", error.message);
        
        if (error.message == "Request failed with status code 403") {
          this.internal_ext = "";
          this.cursor = "";
          this.last_time = 0;
        }
        
        if (!done) {
          done = true;
          return r({ 
            is_403: error.message == "Request failed with status code 403", 
            is_fetch: false, 
            error: error.message, 
            process_time: Date.now() - start
          });
        }
      }
    });
  }
}

// Giải phóng tài nguyên toàn cục khi thoát
process.on('exit', async () => {
  try {
    await releaseAllBrowserInstances();
  } catch (e) {}
});

// Xử lý sự kiện kết thúc không mong muốn
process.on('SIGINT', async () => {
  try {
    await releaseAllBrowserInstances();
  } catch (e) {}
  process.exit(0);
});

process.on('SIGTERM', async () => {
  try {
    await releaseAllBrowserInstances();
  } catch (e) {}
  process.exit(0);
});

module.exports = OptimizedClone;