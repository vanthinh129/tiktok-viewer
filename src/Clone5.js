const path = require("path")
const { delay, getString, parserProxyString, sendMessageTele, sendMessageTele403,log_403, logs_die, changeIp, changeProxyIp, clearCacheForFile, getRandomInt } = require("./helper")
const helper = require('./helper')
let config_file = path.resolve('./data/config.v5.json');
clearCacheForFile(config_file)

const BrowserService = require("./BrowserService")
const { del } = require("request")
const request = require("request")
const os = require("os")
let os_type = os.type();
let browser_platform = ""

let os_ver = ""
    switch (os_type) {
        case "Linux": {
            os_ver =    "X11; Ubuntu; Linux x86_64"
            browser_platform = encodeURIComponent("Linux x86_64");
            break;
        } 
        case "Windows_NT": {
            os_ver =    "Windows NT 10.0; Win64; x64"
            browser_platform = "Win32"
            break;
        } 
        case "Darwin": {
            os_ver =  "Macintosh; Intel Mac OS X 10_15_7"
            browser_platform = "MacIntel"
            break;

        } 
        default: {
            os_ver =  "X11; Ubuntu; Linux x86_64"
            browser_platform = encodeURIComponent("Linux x86_64");
        }
    }

const userAgentDefault = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36`
const appVersionDefault = userAgentDefault.replace("Mozilla/", "")
// console.log("os_type",os_type)

// console.log("userAgentDefault",userAgentDefault)

// console.log("browser_platform",browser_platform)

class Clone {
  constructor({ cookie_string, task_id, room_id,proxy, proxy_list }) {
    this.task_id = task_id;
    this.cookie_string = cookie_string
    this.room_id = room_id;
    this.proxy = proxy;
    this.proxy_list =proxy_list
    this.failTime = 0;
    this.status = "running"
    let random_de = getRandomInt(187248723442,934782374123)  
    this.device_id=  "7284943"+random_de;
    this.is_first = true;
    this.status_viewer = -1;//3 - no login, 1 viewed, 2 - error,4 - 403
    //3: {"data":{"message":"User doesn't login","prompts":"Please login first"},"extra":{"now":1743480930942},"status_code":20003}
    //2: {"data":{"prompts":""},"extra":{"now":1743480931056},"status_code":4003182}
    //1: {"data":{"AnchorABMap":{},"adjust_display_order":1,"admin_ec_show_p
    //4 - 403
    //5 {"data":{"message":"room has finished","prompts":"This LIVE video has ended"},"extra":{"finished_perception_msg":"","now":1744095998625,"punish_info":null},"status_code":30003}

  }
  async run(){
    // let r_leave = await this.callApi({type: "leave"})
    // await delay(1000)

    // let r_enter = await this.callApi({type: "enter"});
    // console.log(r_enter.body)
    let is_run = true;
    while(is_run){
        await this.fetch();
        await delay(800)
    }
  }
  async callApi({ type }) {
    let { cookie_string, room_id, msToken: cmsToken, session_id: csession_id, timeout ,device_id } = this
    timeout = timeout || 30000
    var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
    let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
    this.session_id = session_id;
        if (session_id == "") {
            session_id = "h"
        }
    try {
        if (session_id == "") {
          throw new Error( "Cookie no session id callApi")
        }

        let url = "";

        let br = await BrowserService.getInstance(userAgentDefault,{ initSign:true})

        // device_id = 7368406746468058640;
        let _bodyJson = null;
        switch (type) {
            case "leave":
                url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`
                _bodyJson = {reason: 0, room_id: room_id}
              break;
            case "enter":
                 url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`
                _bodyJson = {enter_source: "others-others", room_id: room_id}
                break;

           }
  
           let target_url = ""
     
      
           let  { url: targetUrl, xbogus, _signature, bodyEncoded} = await br.buildUrlPageSign({url,  bodyJson: _bodyJson})
            target_url = targetUrl
        if(!_signature){
            return ""
        }
        var options = {
        proxy:  parserProxyString(this.proxy),
        'method': 'POST',
        'url':  target_url,
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
            'sec-ch-ua': '"Google Chrome";v="125", "Chromium";v="125", "Not?A_Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'x-secsdk-csrf-token': 'DOWNGRADE'
        },
        body: bodyEncoded,
        isRetry: false
        };
        // console.log(options)
        let data_page = {}
        switch (type) {
            case "leave":
                data_page = await this.makeRequest(options);
              break;
            case "enter":
                data_page = await this.makeRequest(options);
                break;
            default:
                data_page = await this.makeRequest(options);
        }
        if(data_page.status == 403){
          throw new Error( "Request failed with status code 403")
       }
        if(data_page.error && data_page.error != "Request timeout"){
          console.log(data_page.error)
      }
        if(data_page.body) {
            let code = data_page.bodyJson.status_code;
            let message = ""
            try{
                message = (data_page.bodyJson|| {}).data.message;
            }catch(e){}
            let result = { is_403: false, is_dead: message === "User doesn't login" || code === 20003 ? true: false, data: data_page.body}
            return result

        }
          let result = { is_403: false, data: data_page.body}
        return result

    } catch (error) {
        console.log("error call api",this.session_id, error.message)
        let result =  { is_403: error.message == "Request failed with status code 403" ? true: false, error:error.message}

        return result
    }

}
async makeRequestNew(options) {
    let that = this;
    // console.log(options)
    // process.exit(1)
  let { url, headers, method, proxy, retryCount, body, timeout, retryTime, proxy_list, form, preCheckRetry, name, retryAfter } = options;
  method = method || "get";
  retryTime = retryTime || 0;
  retryAfter = retryAfter || 1000;
  let isGetBody = true;
  if (options.hasOwnProperty("isGetBody")) {
    isGetBody = options.isGetBody;
  }
  let isRetry = true;
  if (options.hasOwnProperty("isRetry")) {
    isRetry = options.isRetry;
  }
  let retry = retryCount || 0;

  let head = await new Promise(r => {
    const reqOptions = {
      url,
      method: method.toUpperCase(),
      headers,
      timeout: timeout || 10000
    };
    if (body) reqOptions.body = body;
    if (form) reqOptions.form = form;

    if (proxy) {
      let proxystr = "";
      if (typeof proxy == "string") {
        proxystr = proxy;
        if (!proxy.includes("https") && !proxy.includes("http")) {
          let { protocol, host, port, username, password } = helper.parserProxyString(proxy);
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
        }
      } else {
        let { protocol, host, port, username, password } = proxy;
        proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
      }
      reqOptions.proxy = proxystr;
    }

    let done = false;
    // console.log(reqOptions)
    const req = request(reqOptions, (error, response, body) => {
      if (!done) {
        if (response && response.statusCode == 403) {
            that.status_viewer = 4;
        }
        console.log('body')
        console.log(helper.getTime(),"done")
        done = true;
        return r({ error, body, headers: response ? response.headers : {}, status: response ? response.statusCode : null });
      }
    });
    req.on('response', res => {
        if (res && res.statusCode == 403) {
            that.status_viewer = 4;
        }
      if (that.is_first && res.statusCode != 403) {
        let body = '';
        res.on('data', chunk => {
          body += chunk;

          if (body.includes('"status_code":20003')) {
            that.status_viewer = 3;
          } else if (body.includes('"status_code":4003182')) {
            that.status_viewer = 2;
          } else if (body.includes('AnchorABMap')) {
            that.status_viewer = 1;
          } else if (body.includes('"status_code":30003')) {
            that.status_viewer = 5;
          }

          if (that.status_viewer != -1) {
            console.log(helper.getTime(), "destroy", reqOptions.proxy, res.statusCode);
            done = true;
            res.destroy(); // dừng stream

            return r({
              error: null,
              body, // trả về dữ liệu đã đọc được đến lúc này
              headers: res.headers,
              status: res.statusCode
            });
          }
        });

        res.on('error', err => {
          return r({ error: err, body: null, headers: {}, status: null });
        });

      } else {
        console.log(helper.getTime(), "destroy", reqOptions.proxy, res.statusCode);
        done = true;
        res.destroy();
        return r({
          error: null,
          body: "ok",
          headers: res.headers,
          status: res.statusCode
        });
      }
    });

    // req.on('data', res => {
    //   console.log(helper.getTime(),"data started");
    //   res.abort(); // huỷ nhận dữ liệu từ server
    //   done = true;
    //   return r({ error: "Request aborted after send", body: "", headers: {}, status: null });
    // });
    req.on('socket', socket => {
      socket.on('connect', () => {
        console.log("cancel")
        setTimeout(() => {
          if (!done) {
            req.abort();
            done = true;
            return r({ error: "Request aborted after send", body: "", headers: {}, status: null });
          }
        }, 20);
      });
    });
    req.on('error', err => {
      console.log("Error or aborted:", err.message);
    });

    setTimeout(() => {
      if (!done) {
        done = true;

        console.log("cancel timeout", proxy)
        return r({ error: "Request timeout", body: "", headers: {}, status: null });
      }
    }, timeout || 10000);
  });
  // console.log("head",head)
  let isRetryPreCheck = false;
  if (typeof preCheckRetry === "function") {
    try {
      isRetryPreCheck = await preCheckRetry(head.body || "", head);
    } catch (e) {
      console.log("err pre", e);
    }
  }

  let bodyJson = {};
  try { bodyJson = JSON.parse(head.body); } catch (e) { }
  head.bodyJson = bodyJson;

  if (isRetryPreCheck || head.error || (!head.body && isGetBody)) {
    if (retry < retryTime && isRetry) {
      if (proxy_list && proxy_list.length > 0) {
        options.proxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
      }
      retry++;
      options.retryCount = retry;
      await helper.delay(retryAfter || 1000);
      console.log("get again")
      return await this.makeRequestNew(options);
    }
    return head;
  }
  // console.log("done")
  return head;
}
async makeRequest(options) {
    let that = this;
    const { exec } = require('child_process');
    const { promisify } = require('util');
    const fs = require('fs');
    const path = require('path');
    const os = require('os');
    
    let { url, headers, method, proxy, retryCount, body, timeout, retryTime, 
         proxy_list, form, preCheckRetry, name, retryAfter } = options;
    
    method = method || "get";
    retryTime = retryTime || 2;
    retryAfter = retryAfter || 1000;
    timeout = timeout || 10000;
    
    let isGetBody = options.hasOwnProperty("isGetBody") ? options.isGetBody : true;
    let isRetry = options.hasOwnProperty("isRetry") ? options.isRetry : true;
    let retry = retryCount || 0;

    // Tạo file tạm để lưu response body và headers
    const tmpDir = os.tmpdir();
    const bodyFile = path.join(tmpDir, `curl_body_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.txt`);

    try {
      // Xây dựng lệnh curl trực tiếp
      let curlCommand = `curl "${url}"`;
      
      // Thêm method nếu không phải GET
      if (method.toUpperCase() !== 'GET') {
        curlCommand += ` -X ${method.toUpperCase()}`;
      }
      
      // Thêm timeout
      curlCommand += ` -m ${Math.ceil(timeout / 1000)}`;
      
      // Loại bỏ proxy từ chuỗi cookie trước khi thêm headers
      if (headers && headers.Cookie && typeof headers.Cookie === 'string') {
        // Loại bỏ thông tin proxy từ cookie
        headers.Cookie = headers.Cookie.replace(/proxy=([^;]+);?/g, '');
      }
      
      // Thêm headers
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          if (value) {
            // Xử lý đặc biệt cho header sec-ch-ua và các header tương tự có nhiều dấu nháy kép
            if (key.toLowerCase() === 'sec-ch-ua' || value.includes('"')) {
              // Escape tất cả dấu nháy kép bằng cách thay bằng \"
              const escapedValue = value.replace(/"/g, '\\"');
              curlCommand += ` -H "${key}: ${escapedValue}"`;
            } else {
              curlCommand += ` -H "${key}: ${value}"`;
            }
          }
        });
      }

      // Xử lý proxy
      let proxyStr = null;
      if (proxy) {
        let proxyUrl = "";
        if (typeof proxy === "string") {
          // Nếu proxy là string trực tiếp
          if (proxy.includes("http://") || proxy.includes("https://")) {
            proxyUrl = proxy;
          } else {
            // Nếu proxy có định dạng khác, parse nó
            try {
              let parsedProxy = helper.parserProxyString(proxy);
              if (parsedProxy) {
                const { protocol = "http", host, port, username, password } = parsedProxy;
                proxyUrl = `${protocol}://`;
                if (username && password) {
                  proxyUrl += `${username}:${password}@`;
                }
                proxyUrl += `${host}:${port}`;
              }
            } catch (e) {
              console.error("Error parsing proxy string:", e);
              // Nếu không thể parse, sử dụng trực tiếp
              proxyUrl = `http://${proxy}`;
            }
          }
        } else if (typeof proxy === 'object') {
          // Nếu proxy là object
          const { protocol = "http", host, port, username, password } = proxy;
          proxyUrl = `${protocol}://`;
          if (username && password) {
            proxyUrl += `${username}:${password}@`;
          }
          proxyUrl += `${host}:${port}`;
        }
        
        if (proxyUrl) {
          curlCommand += ` -x "${proxyUrl}"`;
        }
      }

      // Thêm body hoặc form data
      if (body) {
        // Escape ký tự đặc biệt trong body
        const escapedBody = body.replace(/'/g, "'\\''");
        curlCommand += ` -d '${escapedBody}'`;
      } else if (form) {
        const formData = Object.entries(form)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        curlCommand += ` -d '${formData}'`;
      }

      // Thêm các options curl cần thiết
      curlCommand += ` -s -o "${bodyFile}" -w "%{http_code}"`;
      
      // Debug command (comment sau khi xác nhận lệnh hoạt động)
      // console.log("Executing curl command:", curlCommand);
      
      // Thực thi curl command
      const execAsync = promisify(exec);
      const { stdout, stderr } = await execAsync(curlCommand, { timeout: timeout + 1000 })
        .catch(error => {
          console.error("Curl execution error:", error.message);
          return { stdout: '', stderr: error.message };
        });
      
      // Parse status code từ curl output
      const statusCode = parseInt(stdout) || null;
      
      // Kiểm tra trạng thái
      if (statusCode === 403) {
        that.status_viewer = 4;
      }
      
      // Đọc body từ file
      let bodyContent = '';
      try {
        if (fs.existsSync(bodyFile)) {
          bodyContent = fs.readFileSync(bodyFile, 'utf8');
          // console.log("Response body:", bodyContent.substring(0, 200) + (bodyContent.length > 200 ? '...' : ''));
        } else {
          console.error("Body file not found:", bodyFile);
        }
      } catch (readError) {
        console.error("Error reading body file:", readError);
      }
      
      // Kiểm tra response body để xác định trạng thái
      if (bodyContent) {
        if (bodyContent.includes('"status_code":20003')) {
          that.status_viewer = 3; // logout
        } else if (bodyContent.includes('"status_code":4003182')) {
          that.status_viewer = 2;
        } else if (bodyContent.includes('AnchorABMap')) {
          that.status_viewer = 1; // good
        } else if (bodyContent.includes('"status_code":30003')) {
          that.status_viewer = 5; // finish
        }
      } else {
        that.status_viewer = 6; // Không có body
      }
      
      // Xóa file tạm
      try {
        if (fs.existsSync(bodyFile)) {
          fs.unlinkSync(bodyFile);
        }
      } catch (unlinkError) {
        console.error("Error removing temp file:", unlinkError);
      }
      
      // Đóng gói kết quả
      const head = {
        error: stderr ? stderr : null,
        body: bodyContent,
        headers: {},  // Không có headers chi tiết với cách này
        status: statusCode
      };
      
      // Parse body thành JSON nếu có thể
      let bodyJson = {};
      try {
        if (bodyContent) {
          bodyJson = JSON.parse(bodyContent);
        }
      } catch (e) {
        // Không cần log lỗi parse JSON nếu body không phải JSON
      }
      
      head.bodyJson = bodyJson;
      
      // Kiểm tra điều kiện retry
      let isRetryPreCheck = false;
      if (typeof preCheckRetry === "function") {
        try {
          isRetryPreCheck = await preCheckRetry(head.body || "", head);
        } catch (e) {
          console.error("Error in preCheckRetry:", e.message);
        }
      }
      
      if (isRetryPreCheck || head.error || (!head.body && isGetBody)) {
        if (retry < retryTime && isRetry) {
          // Chọn proxy mới nếu có
          if (proxy_list && proxy_list.length > 0) {
            options.proxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
          }
          retry++;
          options.retryCount = retry;
          await helper.delay(retryAfter);
          return await this.makeRequest(options);
        }
      }
      
      return head;
      
    } catch (error) {
      console.error("Fatal error in makeRequest:", error.message);
      
      // Xóa files tạm trong trường hợp lỗi
      try {
        if (fs.existsSync(bodyFile)) {
          fs.unlinkSync(bodyFile);
        }
      } catch (unlinkError) {}
      
      // Thử lại nếu cần
      if (retry < retryTime && isRetry) {
        if (proxy_list && proxy_list.length > 0) {
          options.proxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
        }
        retry++;
        options.retryCount = retry;
        await helper.delay(retryAfter);
        return await this.makeRequest(options);
      }
      
      return {
        error: error.message,
        body: "",
        headers: {},
        status: null,
        bodyJson: {}
      };
    }
  }
async makeRequest1 (options) {
    let that = this;
    
    let {url, headers, method, proxy,retryCount, body, timeout, retryTime, proxy_list, form, preCheckRetry, name, retryAfter} = options
    method = method || "get"
    retryTime = retryTime || 2;
    retryAfter =retryAfter || 1000
    let isGetBody = true;
    if(options.hasOwnProperty("isGetBody")) {
      isGetBody = options.isGetBody
    }
    let isRetry = true;
    if(options.hasOwnProperty("isRetry")) {
      isRetry = options.isRetry
    }
    let retry = retryCount || 0;
    let head = await  new Promise(r => {
      const options = {
        url,
        method: method.toUpperCase(),
        headers: headers,
        body,
        timeout: timeout  || 10000
      }
      if(body) options.body = body;
      if(form) options.form = form;
      let done = false;
      setTimeout(()=>{
        if(!done){
          done = true;
          return  r({error:"Request timeout", body: "", headers:  {}, status:  null })
        }
      },timeout  || 10000)

      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
          if(!proxy.includes("https" || !proxy.includes("http"))){
            let { protocol, host, port, username, password } = helper.parserProxyString(proxy);
            proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
          }
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
      }
      request(options,(error, response, body) => {
        if(!body){
          that.status_viewer = 6
        }
            if (response && response.statusCode == 403) {
                that.status_viewer = 4;
            }else 
            if (body && body.includes('"status_code":20003')) {
                that.status_viewer = 3; // logout
              } else if (body && body.includes('"status_code":4003182')) {
                that.status_viewer = 2;
              } else if (body && body.includes('AnchorABMap')) {
                that.status_viewer = 1; // good
            } else if (body && body.includes('"status_code":30003')) {
                that.status_viewer = 5; //finish
              }
          if(!done){
            done = true;
            return  r({error, body, headers: response ? response.headers : {}, status: response ?response.statusCode : null })
          }
      })
    })
    let isRetryPreCheck =false
    if( "function" ==  typeof preCheckRetry) 
      {
        try {
          isRetryPreCheck = await preCheckRetry(head.body || "", head)
          isRetryPreCheck 
        } catch(e){
          console.log("err pre", e)
        }
      }

      let bodyJson = {};
      try { bodyJson= JSON.parse(head.body)} catch(e){}
      head.bodyJson = bodyJson
    if(isRetryPreCheck || head.error || (!head.body && isGetBody) ) {
      if(retry < retryTime && isRetry){
        // console.log("retry request:",name)
        if(proxy_list && proxy_list.length > 0){
          options.proxy = proxy_list[Math.floor((Math.random() * proxy_list.length))]
        }
        retry++
        options.retryCount = retry
        await helper.delay(retryAfter || 1000)
        return await this.makeRequest(options)
      }
      return head
  
    }

    return head
  }
encodeRFC3986URIComponent(str) {
    return encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
  }
fetch() {
    return new Promise(async r=>{
        let start = Date.now()
        let done = false;
        let isFetch = false;
        let isApi = false
        let { timeout } =  { timeout: 30000}
        let { cookie_string, video_id, msToken: cmsToken, session_id: csession_id } = this
        var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
        let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', ';sessionid=', ';')||
        getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
        this.session_id = session_id;
        if (session_id == "") {
          throw new Error( "Cookie no session id fetch")
        }
        try {

            // setTimeout(()=>{
            //     if(!done){
            //         done = true;
            //         let result = { error: "Timeout "+timeout ,is_403: false, is_fetch:isFetch, is_api: isApi ? {} : false, process_time: Date.now() - start, start}
            //         return r(result)
            //     }
            // },timeout)
           
            let br = await BrowserService.getInstance(userAgentDefault, {initSign: true, headless: "yes"})

            let appVersion = this.encodeRFC3986URIComponent(appVersionDefault)

            isFetch = true
            let history_comment_cursor =  this.internal_ext ? "0": ""
            let cursor = this.cursor || ''
            let internal_ext = ''
            internal_ext = this.internal_ext || ''
            let fetch_rule = this.internal_ext ? 2: 1
            let last_rtt = this.last_time ? Date.now()- this.last_time : 0;
            this.last_time = Date.now()
            let endpoint = ``
            endpoint = `aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${appVersion}&cookie_enabled=true&cursor=${cursor}&debug=false&device_id=&device_platform=web&did_rule=3&fetch_rule=${fetch_rule}&history_comment_count=0&history_comment_cursor=${history_comment_cursor}&host=https%3A%2F%2Fwebcast.tiktok.com&identity=audience&internal_ext=${this.encodeRFC3986URIComponent(internal_ext)}&last_rtt=${last_rtt}&live_id=12&resp_content_type=protobuf&room_id=${this.room_id}&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&version_code=270000&msToken=${msToken}`
            let url = "";
 
            let route = 'https://webcast.tiktok.com/webcast/im/fetch/'
            let  { url: targetUrl, xbogus, _signature} = await br.buildUrlPageSign({url: `${route}?${endpoint}`})
              
               url = targetUrl


               var options = {
                proxy_list: this.proxy_list,
                proxy:  parserProxyString(this.proxy),
                'method': 'GET',
                timeout,
                'url':  url,
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
                    'sec-ch-ua': '"Google Chrome";v="134", "Chromium";v="134", "Not?A_Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'x-secsdk-csrf-token': 'DOWNGRADE'
                },
                isRetry: true,
                retryTime: 2,
                preCheckRetry: (body, jsonBody)=>{
                  if (!body||!body.includes(`wrss`)) {
                    // console.log("retry request")
                    return true;   
                  }
                }
                };
             
                let data_page = await helper.makeRequest(options);
              if(data_page.error){
                // console.log(data_page.error)
              }
            function getData(split, current){
              split = split || []
              current = current || split.length-1;
              if(current == -1) return ""
              if(split[current].includes("fetch_time")) return split[current]
              if(current == 1) {
                if(split[current].includes("fetch_time")) return split[current]
                return ""
              }
              return getData(split, current -1)
            }
            function getWrss(split, current){
              split = split || []
              current = current || split.length-1;
              if(current == -1) return ""
              if(split[current].includes("wrss")) {
                return helper.getString(split[current], "+", "RLwss")
              }
              if(current == 1) {
                if(split[0].includes("wrss")) {
                  return helper.getString(split[0], "+", "RLwss")
                } 
                return ""
              }
              return getWrss(split, current -1)
            }
             if(!done){
                done = true;
                if(data_page.status == 403){
                   throw new Error( "Request failed with status code 403")
                }
                if ( data_page.body && data_page.body.length) {
                    let split = data_page.body.split('\n')
                    let wrss = getWrss(split)
                    wrss= wrss.replace(":", "")
                    if(wrss){
                      this.wrss= wrss
                    }
                    let str = getData(split)
                    let ext = getString(str, 'fetch_time').replace('0\x01:&', '').replace(/\x01/g, "")
                    let cursor = getString(ext, 'next_cursor:', '|').replace('\x01:&', '')
                    if(this.setCursor){
                      this.internal_ext = 'fetch_time' + ext
                      this.cursor = cursor
                    }
      
                    // console.log(this.session_id, "wrss:", this.wrss)
                  }
                  if(false){
                    this.internal_ext = ""
                    this.cursor = ""
                    if(!is_last_time) {
                        this.last_time = 0
                    }
                  }
                  let result = { is_403: data_page.status == 403,is_fetch: true, process_time: Date.now() - start, start};
                  this.fetch_403 = data_page.status == 403
                return r(result)
            }


        } catch (error) {
            if(error.message == "Request failed with status code 403" ){
                this.internal_ext = ""
                this.cursor = ""
                this.last_time = 0

            }
            // console.log("error call fetch",this.session_id, error.message)

            this.url = ""
            let result =  { is_403: error.message == "Request failed with status code 403" ? true: false, is_fetch: true, error: error.message, process_time: Date.now() - start, start}
            this.fetch_403 = error.message == "Request failed with status code 403" ? true: false

            return r(result)
        }

    })
 }

}

module.exports = Clone
