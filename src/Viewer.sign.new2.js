const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require("path");
const helper = require('./helper');
const { delay, getString, parserProxyString, sendMessageTele, sendMessageTele403, log_403, logs_die, changeIp, changeProxyIp, clearCacheForFile, getRandomInt } = require("./helper");
const request = require("request");
const { signreq } = require("./sign_request");
const querystring = require('querystring');
const RabbitMQ = require(path.resolve("RabbitMQ.lib"));
const os = require("os");

// Xác định OS và browser platform
let os_type = os.type();
let browser_platform = "";
let os_ver = "";
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

const userAgentDefault = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`;
const appVersionDefault = userAgentDefault.replace("Mozilla/", "");

console.log("userAgentDefault", userAgentDefault);

// Dữ liệu chung
const data = {};
let data_local = {};
let list_403_total = [];
let list_die_total = [];
let is_running = true;
let intervalcheck;

// Class duy nhất cho cả viewer và logic clone
class GroupView {
    constructor({cookie_string, task_id, room_id, proxy, proxy_list, server_site} = {}) {
        if (cookie_string) {
            this.task_id = task_id;
            this.cookie_string = cookie_string;
            this.username = helper.getString(cookie_string, 'username=', ';');
            this.session_id = helper.getString(cookie_string, 'sessionid=', ';');
            this.room_id = room_id;
            this.proxy = proxy;
            this.proxy_list = proxy_list;
            this.failTime = 0;
            this.status = "running";
            this.browser_platform = browser_platform;
            let random_de = getRandomInt(187248723442, 934782374123);  
            this.device_id = "7284943" + random_de;
            this.device_id = helper.getString(cookie_string, ';wid=', ';');
            this.is_first = true;
            this.status_viewer = -1; // 3 - no login, 1 viewed, 2 - error, 4 - 403
            this.endpoint = "";
            this.imfetch_time = 0;
            this.delay_all_time = 8000;
            this.delay_10_time = 45000;
            this.delay = this.delay_all_time;
            this.url = "";
            this.is_10_time = true;
            this.server_site = server_site || "tt2";
        }
    }

    // =========== PHƯƠNG THỨC QUẢN LÝ TRẠNG THÁI CLONE ===========
    async run() {
        this.status = "running";
        let is_join = await this.runJoin();
        if(is_join) {
            this.status = "running";
            this.runFetchs();
            return true;
        } else {
            this.status = "end";
            return false;
        }
    }

    async cancel() {
        this.status = "end";
    }

    async pause() {
        this.status = "pause";
    }

    async resume() {
        this.status = "running";
    }

    async runJoin() {
        let cookie_status = await helper.checkCookieLive({ 
            username: this.username, 
            cookie_string: this.cookie_string, 
            proxy: this.proxy, 
            proxy_list: this.proxy_list 
        }); 

        if(!cookie_status.status || !cookie_status.live) {
            console.log(helper.getTime(), this.username, `Cookie die`);
            this.status_viewer = 3;
            return false;
        }

        let res1 = await this.callApi({ type: "enter" });
        let is_good = false;
        if(res1 && res1.body && res1.body.includes('user_side_title')) {
            is_good = true;
        }

        if ([-1, 1].includes(this.status_viewer) && is_good) {
            return true;
        } else {
            console.log(helper.getTime(), this.username, "enter", this.status_viewer, is_good);
            return false;
        }
    }

    async runFetchs() {
        let is_run = true;
        this.setCursor = true;
        while(is_run) {
            if(this.status == "running") {
                let r_enter = await this.fetch();
                if(r_enter.is_403) {
                    is_run = false;
                    this.status_viewer = 4;
                }
                await delay(this.delay);
                this.imfetch_time++;
            } else if(this.status == "pause") {
                await delay(1000);
            } else if(this.status == "resume") {
                this.status = "running";
                await delay(1000);
            } else if(this.status == "end") {
                is_run = false;
            }
        }
    }

    // =========== PHƯƠNG THỨC XỬ LÝ API ===========
    async callApi({ type }) {
        let { cookie_string, room_id, msToken: cmsToken, session_id: csession_id, timeout, device_id } = this;
        timeout = timeout || 30000;
        var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
        let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
        this.tt_csrf_token = getString(cookie_string.replace(/ /g,'') + ';', 'tt_csrf_token=', ';');
        this.s_v_web_id = getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
        this.session_id = session_id;
        let device_type = "web_h264";
        let screen_height = 982;
        let screen_width = 1512;

        try {
            if (session_id == "") {
                throw new Error("Cookie no session id");
            }

            let url = "";
            let verifyFp = getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
            let _bodyJson = null;

            switch (type) {
                case "leave":
                    url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`;
                    _bodyJson = {reason: 0, room_id: room_id};
                    break;
                case "enter":
                    url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=0&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=${screen_height}&screen_width=${screen_width}&tz_name=Asia%2FBangkok&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`;
                    _bodyJson = {enter_source: "others-others", room_id: room_id};
                    break;
                case "name":
                    url = `https://www.tiktok.com/api/update/profile/?WebIdLastTime=&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&odinId=${this.userId}&os=mac&priority_region=&referer=&region=VN&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${this.s_v_web_id}&webcast_language=vi-VN&msToken=${msToken}`;
                    _bodyJson = {
                        'nickname': this.name,
                        'tt_csrf_token': this.tt_csrf_token
                    };
                    break;
            }

            let bodyEncoded = querystring.stringify(_bodyJson);
            let {url: targetUrl} = await signreq({url, body: _bodyJson, msToken, userAgent: userAgentDefault});
            let is_retry = false;
            if(is_retry) {
                await delay(500);
                return await this.callApi({type});
            }

            let target_url = targetUrl;
            var options = {
                proxy: parserProxyString(this.proxy),
                'method': 'POST',
                'url': target_url,
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
                isRetry: false
            };

            let data_page = await this.makeRequest(options);
            if(data_page.status == 403) {
                throw new Error("Request failed with status code 403");
            }
            if(data_page.error && data_page.error != "Request timeout") {
                console.log(data_page.error);
            }
            if(data_page.body) {
                let code = data_page.bodyJson.status_code;
                let message = (data_page.bodyJson || {}).data && (data_page.bodyJson || {}).data.message;
                let result = {
                    is_403: false,
                    is_dead: message === "User doesn't login" || code === 20003 ? true : false,
                    body: data_page.body
                };
                return result;
            }
            let result = { is_403: false, data: data_page.body, body: data_page.body };
            return result;
        } catch (error) {
            console.log("error call api", this.session_id, error.message);
            let result = {
                is_403: error.message == "Request failed with status code 403" ? true: false,
                error: error.message
            };
            return result;
        }
    }

    async makeRequest(options) {
        let that = this;
        
        let {url, headers, method, proxy, retryCount, body, timeout, retryTime, proxy_list, form, preCheckRetry, name, retryAfter} = options;
        if(!url.includes("X-Gnarly")) {
            return {error: "None sign" + that.proxy, body: "", headers: {}, status: null};
        }
        
        method = method || "get";
        retryTime = retryTime || 2;
        retryAfter = retryAfter || 1000;
        let isGetBody = true;
        if(options.hasOwnProperty("isGetBody")) {
            isGetBody = options.isGetBody;
        }
        let isRetry = true;
        if(options.hasOwnProperty("isRetry")) {
            isRetry = options.isRetry;
        }
        let retry = retryCount || 0;
        
        let head = await new Promise(r => {
            const requestOpts = {
                url,
                method: method.toUpperCase(),
                headers: headers,
                body,
                timeout: timeout || 30000
            };
            
            if(body) requestOpts.body = body;
            if(form) requestOpts.form = form;
            
            let done = false;
            setTimeout(() => {
                if(!done) {
                    done = true;
                    return r({error: "Request timeout " + that.proxy, body: "", headers: {}, status: null});
                }
            }, timeout || 30000);

            if(proxy) {
                let proxystr = "";
                if(typeof proxy == "string") {
                    proxystr = proxy;
                    if(!proxy.includes("https") && !proxy.includes("http")) {
                        let { protocol, host, port, username, password } = helper.parserProxyString(proxy);
                        proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
                    }
                } else {
                    let { protocol, host, port, username, password } = proxy;
                    proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
                }
                requestOpts.proxy = proxystr;
            }
            
            request(requestOpts, (error, response, body) => {
                if(!body) {
                    that.status_viewer = 6;
                }
                if(response && response.statusCode == 403) {
                    that.status_viewer = 4;
                } else if(url.includes("webcast/room/enter")) {
                    if(body && body.includes('"status_code":20003')) {
                        that.status_viewer = 3; // logout
                    } else if(body && body.includes('"status_code":4003182')) {
                        that.status_viewer = 2;
                    } else if(body && body.includes('AnchorABMap')) {
                        that.status_viewer = 1; // good
                    } else if(body && body.includes('"status_code":30003')) {
                        that.status_viewer = 5; // finish
                    }
                }
                
                if(!done) {
                    done = true;
                    return r({
                        error,
                        body: body ? body.toString("utf8"): "",
                        bodyBinary: body,
                        headers: response ? response.headers : {},
                        status: response ? response.statusCode : null
                    });
                }
            });
        });
        
        let isRetryPreCheck = false;
        if(typeof preCheckRetry === "function") {
            try {
                isRetryPreCheck = await preCheckRetry(head.body || "", head);
            } catch(e) {
                console.log("err pre", e);
            }
        }

        let bodyJson = {};
        try {
            bodyJson = JSON.parse(head.body);
        } catch(e) {}
        
        head.bodyJson = bodyJson;
        
        if(isRetryPreCheck || head.error || (!head.body && isGetBody)) {
            if(retry < retryTime && isRetry) {
                if(proxy_list && proxy_list.length > 0) {
                    options.proxy = proxy_list[Math.floor((Math.random() * proxy_list.length))];
                }
                retry++;
                options.retryCount = retry;
                await helper.delay(retryAfter || 1000);
                return await this.makeRequest(options);
            }
            return head;
        }
        return head;
    }

    encodeRFC3986URIComponent(str) {
        return encodeURIComponent(str).replace(
            /[!'()*]/g,
            (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
        );
    }

    async send403Rabbit(proxy) {
        try {
            let rabbitService = await RabbitMQ.getInstance({
                url: "amqp://bupmat:bupmat@185.190.140.88:5672/" + this.server_site + "?heartbeat=60"
            });
            if(proxy) {
                let message = {
                    "action": "update_account_403_fetch",
                    "proxy": proxy,
                    time_now: Date.now()
                };
                await rabbitService.sendMessage("rabbit_cron", message);
            }
        } catch(error) {
            console.log("error handleSendRabbit", error);
        }
    }

    fetch() {
        return new Promise(async r => {
            let start = Date.now();
            let done = false;
            let isFetch = false;
            let isApi = false;
            let { timeout } = { timeout: 30000 };
            let { cookie_string, video_id, msToken: cmsToken, session_id: csession_id } = this;
            var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
            let session_id = csession_id || 
                            getString(cookie_string.replace(/ /g,'') + ';', ';sessionid=', ';') ||
                            getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
            this.session_id = session_id;
            
            if(session_id == "") {
                throw new Error("Cookie no session id");
            }
            
            try {
                let appVersion = encodeURI(appVersionDefault);
                isFetch = true;
                let history_comment_cursor = this.history_comment_cursor || 0;
                let cursor = this.cursor || '';
                let internal_ext = this.internal_ext || '';
                let fetch_rule = this.internal_ext ? 2 : 1;
                fetch_rule = 1;
                
                let endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=${this.last_rtt}&internal_ext=${(internal_ext).replaceAll("|","%7C")}&cursor=${cursor}&history_comment_cursor=${history_comment_cursor}&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`;
                let url = "";
                
                if(!internal_ext) {
                    endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=-1&internal_ext=0&cursor=0&history_comment_cursor=0&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`;
                }
                
                if(this.imfetch_time >= 11) {
                    endpoint = this.endpoint;
                    this.delay = getRandomInt(30,45)*1000;
                } else {
                    this.endpoint = endpoint;
                    this.delay = this.delay_all_time;
                }
                
                let route = 'https://webcast.tiktok.com/webcast/im/fetch/';
                let {url: targetUrl} = await signreq({
                    url: `${route}?${endpoint}`,
                    msToken,
                    userAgent: userAgentDefault
                });
                
                let is_retry = false;
                if(is_retry) {
                    await delay(500);
                    return r(await this.fetch());
                }
                
                url = targetUrl;
                var options = {
                    proxy_list: this.proxy_list,
                    proxy: parserProxyString(this.proxy),
                    'method': 'GET',
                    timeout,
                    'url': url,
                    'headers': {
                        'Accept': '*/*',
                        'Accept-Language': 'en-US,en;q=0.9',
                        'Connection': 'keep-alive',
                        'Cookie': cookie_string,
                        "priority": "u=1, i",
                        "b": cookie_string,
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
                    preCheckRetry: (body, jsonBody) => {
                        if(!body || !body.includes(`wrss`)) {
                            return true;   
                        }
                    }
                };
                
                this.last_time = Date.now();
                let data_page = await this.makeRequest(options);
                
                if(data_page.body) {
                    let hex = data_page.bodyBinary.toString('hex');
                    let idHexServer = helper.getString(hex, "a181", "6720") ||
                                    helper.getString(hex, "b181", "6720") ||
                                    helper.getString(hex, "c181", "6720");
                    if(!this.idHexServer) {
                        this.idHexServer = idHexServer;
                    }
                }
                
                let that = this;
                function updateCookie() {
                    if(data_page.headers && data_page.headers['set-cookie'] && data_page.headers['set-cookie'].length) {
                        let new_cookie = data_page.headers['set-cookie'].map(i => {
                            let msToken = getString(i, 'msToken=', ';');
                            if(msToken) {
                                that.cookie_string = cookie_string.replace(/msToken=[^;]+/g, `msToken=${msToken}`);
                                return `msToken=${msToken}`;
                            }
                        });
                    }
                }
                updateCookie();
                
                this.last_rtt = Date.now() - this.last_time;
                
                function Wrss(data) {
                    let [t, w] = data.match(/wrss(.*?):/) || [];
                    w = w || "";
                    return w.slice(2,45);
                }
                
                function getData(split, current, is_last_time) {
                    split = split || [];
                    current = current || split.length - 1;
                
                    if(is_last_time) current = 0;
                
                    while(current >= 0) {
                        if(split[current].includes("fetch_time")) {
                            return split[current];
                        }
                        current--;
                    }
                
                    return "";
                }
                
                function getHistoryComment(split) {
                    let history_comment = "";
                    for(let i = 0; i < split.length; i++) {
                        if(split[i].includes("ws_proxy")) {
                            history_comment = split[i].slice(-19);
                        }
                    }
                    history_comment = history_comment.replace(/\D/g, "");
                    return history_comment;
                }
                
                if(!done) {
                    done = true;
                    if(data_page.error) {
                        console.log("error fetch", this.session_id, data_page.error, this.proxy);
                    }
                    if(data_page.status == 403) {
                        console.log("fetch 403", this.session_id, this.proxy);
                        this.send403Rabbit(this.proxy);
                        throw new Error("Request failed with status code 403");
                    }
                    
                    if(data_page.body && data_page.body.length) {
                        let split = data_page.body.split('\n');
                        let wrss = Wrss(data_page.body);
                        
                        wrss = wrss.replace(":", "");
                        if(wrss) {
                            this.wrss = wrss;
                        }
                        
                        let str = getData(split);
                        let ext = getString(str, 'fetch_time').replace('0\x01:&', '').replace(/\x01/g, "").replace(":\t", "");
                        let cursor = getString(ext, 'next_cursor:', '|').replace('\x01:&', '');
                        
                        if(!this.history_comment_cursor) {
                            this.history_comment_cursor = getHistoryComment(split);
                        }
                        
                        if(this.setCursor) {
                            ext = ext.replace(/:3$/, "");
                            ext = ext.endsWith("00") ? ext.replace(/0$/, "") : ext;
                            this.internal_ext = 'fetch_time' + ext;
                            this.cursor = cursor;
                        }
                    }
                    
                    let result = {
                        is_403: data_page.status == 403,
                        is_fetch: true,
                        process_time: Date.now() - start,
                        start
                    };
                    this.fetch_403 = data_page.status == 403;
                    return r(result);
                }
            } catch(error) {
                console.log("error", error);
                if(error.message == "Request failed with status code 403") {
                    this.internal_ext = "";
                    this.cursor = "";
                    this.last_time = 0;
                }
                
                this.url = "";
                let result = {
                    is_403: error.message == "Request failed with status code 403" ? true : false,
                    is_fetch: true,
                    error: error.message,
                    process_time: Date.now() - start,
                    start
                };
                this.fetch_403 = error.message == "Request failed with status code 403" ? true : false;
                
                return r(result);
            }
        });
    }

    // =========== PHƯƠNG THỨC QUẢN LÝ GROUP VIEWER ===========
    static setdatelocal(key, value) {
        data_local[key] = value;
    }
    
    static getdatelocal(key) {
        return data_local[key];
    }
    
    static async checkViewer403() {
        while(is_running) {
            await helper.delay(20000);
            try {
                let total = 0;
                let fetch_403 = 0;
                let list_403 = [];
                let list_die = [];
                
                for(let i in data) {
                    let sockets = data[i].sockets;
                    sockets.forEach(item => {
                        total++;
                        if(item.status_viewer == 4 && !list_403_total.includes(item.session_id)) {
                            list_403.push(item.session_id);
                            list_403_total.push(item.session_id);
                            fetch_403++;
                        }
                        if(item.status_viewer == 3 && !list_die_total.includes(item.session_id)) {
                            list_die.push(item.session_id);
                            list_die_total.push(item.session_id);
                        }
                    });
                }
                
                if(list_403.length > 0) {
                    console.log("list_403", list_403.length);
                    await GroupView.send403Rabbit(list_403,"update_account_403");
                }
                
                if(list_die.length > 0) {
                    console.log("list_die", list_die.length);
                    await GroupView.send403Rabbit(list_die,"update_account_die");
                }
            } catch(e) {
                console.log("checkViewer403 error", e);
            }
        }
    }
    
    static async removeViewer(socket) {
        // Phương thức để xóa viewer khỏi danh sách
    }
    
    static startProxyGroupViewers({accounts, task_id, proxy, room_id, ex_wrss}) {
        try {
            accounts.forEach(async (i, index) => {
                let p = helper.getString(i+";", "proxy=",";");
                if(p && proxy) {
                    i = i.replace("proxy="+p,"");
                    i += ";proxy="+proxy;
                }
                let proxy_list = [p];
                let viewer = new GroupView({
                    cookie_string: i, 
                    room_id, 
                    proxy: proxy || p, 
                    proxy_list, 
                    server_site: data_local.server_site
                });
                viewer.run();
                data[task_id].sockets = [...data[task_id].sockets, viewer];
            });
        } catch(e) {
            console.log("startProxyGroupViewers error", e, (new Date().toLocaleString()));
        }
        GroupView.checkViewer403();
    }
    
    static async startViewers({accounts, task_id, proxy, room_id, ex_wrss, tokens}) {
        try {
            console.log("Start task_id:", task_id, " room:", room_id, " accounts:", accounts.length);
            data[task_id] = { sockets: []};
            let grouped_proxy = accounts.reduce((pre, cur) => {
                let p = helper.getString(cur+";", "proxy=",";");
                return {...pre, [p]: pre[p] ? [...pre[p], cur]: [cur]};
            }, {});
            
            for(let i in grouped_proxy) {
                GroupView.startProxyGroupViewers({
                    accounts: grouped_proxy[i],
                    task_id,
                    proxy,
                    room_id
                });
            }
        } catch(e) {
            console.log("startViewers error", e, (new Date().toLocaleString()));
        }
    }
    
    static async updateProxy({data_proxy}) {
        try {
            for(let task_id in data) {
                if(data[task_id]) {
                    let sockets = data[task_id].sockets;
                    for(let i = 0; i < sockets.length; i++) {
                        if(sockets[i].status == "running") {
                            let p = helper.getString(sockets[i].cookie_string+";", "proxy=",";");
                            if(p && data_proxy[p]) {
                                sockets[i].proxy = data_proxy[p];
                                sockets[i].proxy_list = [data_proxy[p]];
                            }
                        }
                    }
                }
            }
        } catch(e) {
            console.log("updateProxy error", e, (new Date().toLocaleString()));
        }
    }
    
    static async stopViewers({ task_id }) {
        is_running = false;
        console.log("Stop -- task_id:", task_id);
        try {
            if(data[task_id]) {
                for(let i = 0; i < data[task_id].sockets.length; i++) {
                    data[task_id].sockets[i].cancel();
                }
                data[task_id].sockets = [];
            }
        } catch(e) {
            console.log("stopViewers error", e, (new Date().toLocaleString()));
        }
    }
    
    static async send403Rabbit(list_403, action = "update_account_403") {
        try {
            let rabbitService = await RabbitMQ.getInstance({
                url: "amqp://bupmat:bupmat@185.190.140.88:5672/" + data_local.server_site + "?heartbeat=60"
            });
            if(list_403.length) {
                let message = {
                    "action": action, 
                    "accounts": list_403, 
                    time_now: Date.now()
                };
                await rabbitService.sendMessage("rabbit_cron", message);
            }
        } catch(error) {
            console.log("error handleSendRabbit", error);
        }
    }
}

GroupView.data = data;
module.exports = GroupView;