
const path = require("path")
const { delay, getString, parserProxyString, sendMessageTele, sendMessageTele403,log_403, logs_die, changeIp, changeProxyIp, clearCacheForFile, getRandomInt } = require("./helper")
const helper = require('./helper')
const BrowserService = require("./BrowserService");
const querystring = require('querystring');
const Signer = require("./signer.js");
const os = require("os");
const { verify } = require("crypto");
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
console.log("os_type",os_type)

console.log("userAgentDefault",userAgentDefault)

console.log("browser_platform",browser_platform)

class Clone {
  constructor({ cookie_string, task_id, room_id,proxy, proxy_list }) {
    this.task_id = task_id;
    this.cookie_string = cookie_string
    this.room_id = room_id;
    this.proxy = proxy;
    this.proxy_list =proxy_list
    this.failTime = 0;
    this.status = "running"
    this.is_cookie_live = true;
    this.browser_platform =browser_platform
    let random_de = getRandomInt(187248723442,934782374123)  
    // this.device_id=  "7284943"+random_de;

  }
  async run(){
    // let r_leave = await this.callApi({type: "leave"})
    // await delay(1000)

    // let r_enter = await this.callApi({type: "enter"});
    // console.log(r_enter.body)
    let is_run = true;
    while(is_run){
      let random_de = getRandomInt(187248723442,934782374123)  
      // this.device_id=  "7284943"+random_de;
          let r_enter = await this.callApi({type: "enter"});
        
         console.log(r_enter.body.length)
        await delay(170*1000)
    }
  }
  async sign(options) {
    let { url , bodyEncoded, bodyJson, msToken} = options
    if(msToken){
      url = `${url}&msToken=${msToken}`
    }
    const is_sign_browser = true
    let signer = is_sign_browser ? await BrowserService.getInstance(userAgentDefault, {initSign: true, headless: "yes"}) : await Signer.getInstance(userAgentDefault)
    let { url: targetUrl, xbogus, _signature} = await signer.buildUrlPageFull({url, bodyEncoded, bodyJson, msToken})
    // console.log("targetUrl", targetUrl)
    return { targetUrl, xbogus, _signature }
    
}
  async runFetchs(){
    // let r_leave = await this.callApi({type: "leave"})
    // await delay(1000)

    // let r_enter = await this.callApi({type: "enter"});
    // console.log(r_enter.body)
    let is_run = true;
    this.setCursor = true;
    while(is_run){
          let r_enter = await this.fetch({type: "enter"});
          if(r_enter.is_403) is_run = false;
        //  console.log(r_enter.body)
        await delay(1000)
    }
  }
  async callApi({ type }) {
    let { cookie_string, room_id, msToken: cmsToken, session_id: csession_id, timeout  } = this
    cookie_string = cookie_string.replace(/ /g,'')
    timeout = timeout || 30000
    var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
    let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
    this.tt_csrf_token =  getString(cookie_string.replace(/ /g,'') + ';', 'tt_csrf_token=', ';');
    this.s_v_web_id =  getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
    this.session_id = session_id;
    this.username = getString(cookie_string + ';', 'username=', ';') || this.session_id;
    let verifyFp = getString(cookie_string.replace(/ /g,'') + ';', 'verifyFp=', ';') || getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';')
    this.device_id = getString(cookie_string + ';', 'device_id=', ';') || getString(cookie_string + ';', ';wid=', ';') || this.device_id
    // this.device_id = "7534355"+getRandomInt(187248723442,934782374123)//7534355227077674503
    let device_id = this.device_id
    // console.log("device_id",device_id)
    // process.exit(1)
    try {
        if (session_id == "") {
          throw new Error( "Cookie no session id")
        }

        let url = "";

        // let br = await BrowserService.getInstance(userAgentDefault, {initSign: true, headless: "yes"})
        let device_type = "web_h265"
        let screen_height = 982
        let screen_width = 1512
        // device_id = 7368406746468058640;
        let _bodyJson = null;
        switch (type) {
            case "leave":
                url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi-VN&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=vi-VN&msToken=${msToken}`
                url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=VN&referer=&region=VN&root_referer=&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`
                _bodyJson = {reason: 0, room_id: room_id}
              break;
            case "enter":
                 url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi&app_name=tiktok_web&browser_language=vi-VN&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=vi-VN`

                 url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=VN&referer=&region=VN&root_referer=&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`
                //  url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=0&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=${screen_height}&screen_width=${screen_width}&tz_name=Asia%2FBangkok&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`
                _bodyJson = {enter_source: "others-others", room_id: room_id}
                break;

           
           case "name":
            url = `https://www.tiktok.com/api/update/profile/?WebIdLastTime=&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&odinId=${this.userId}&os=mac&priority_region=&referer=&region=VN&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${this.s_v_web_id}&webcast_language=vi-VN&msToken=${msToken}`
           _bodyJson =  {
            'nickname': this.name,
            'tt_csrf_token': this.tt_csrf_token
          }
           break;

      }
           let target_url = ""
          //  let bodyEncoded = JSON.stringify(_bodyJson);//querystring.stringify(_bodyJson);
      
          //  let  { url: targetUrl, xbogus, _signature, bodyEncoded} = await br.buildUrlPageFull({url,  bodyJson: _bodyJson, msToken})
          // let  { url: targetUrl, xbogus, _signature} = await signer.buildUrlPageFull({url,  bodyJson: _bodyJson,bodyEncoded:bodyEncoded, msToken})
          let bodyEncoded = querystring.stringify(_bodyJson);
            let {targetUrl} = await this.sign({url, bodyEncoded: bodyEncoded, msToken});
            
            target_url = targetUrl
            // console.log("target_url",target_url,"bodyEncoded",bodyEncoded)
            let s_sdk_crypt_sdk = getString(cookie_string, 'crypt_sdk_b64=', ';');
            let s_sdk_sign_data_key = getString(cookie_string, 'sign_data_key_b64=', ';');
            let data_gen = helper.genheaderenter({
                s_sdk_crypt_sdk,
                s_sdk_sign_data_key,
                path: '/webcast/room/enter/'
            })
            // process.exit(1)
        var options = {
        proxy:  parserProxyString(this.proxy),
        'method': 'POST',
        'url':  target_url,
        'headers': {
            'Accept': '*/*',
            'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7',
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
            'x-secsdk-csrf-token': 'DOWNGRADE',
        },
        body: bodyEncoded,
        isRetry: false
        };
        if(data_gen && data_gen["tt-ticket-guard-client-data"] && data_gen["tt-ticket-guard-public-key"]){
          options.headers["tt-ticket-guard-client-data"] = data_gen["tt-ticket-guard-client-data"]
          options.headers["tt-ticket-guard-iteration-version"] = 0
          options.headers["tt-ticket-guard-public-key"] = data_gen["tt-ticket-guard-public-key"]
          options.headers["tt-ticket-guard-version"] = 2
          options.headers["tt-ticket-guard-web-version"] = 1
        }
     
        let data_page = await helper.makeRequest(options);
        // process.exit(1)
        if(data_page.status == 403){
          throw new Error( "Request failed with status code 403")
       }
        if(data_page.error && data_page.error != "Request timeout"){
          console.log(data_page.error)
      }
        if(data_page.body) {
            let code = data_page.bodyJson.status_code;
            let message = (data_page.bodyJson|| {}).data.message;
            let result = { is_403: false, is_dead: message === "User doesn't login" || code === 20003 ? true: false, body: data_page.body}
            return result

        }
          let result = { is_403: false, data: data_page.body,body: data_page.body}
        return result

    } catch (error) {
        console.log("error call api",this.session_id, error.message)
        let result =  { is_403: error.message == "Request failed with status code 403" ? true: false, error:error.message}

        return result
    }

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
          throw new Error( "Cookie no session id")
        }
        try {

            // setTimeout(()=>{
            //     if(!done){
            //         done = true;
            //         let result = { error: "Timeout "+timeout ,is_403: false, is_fetch:isFetch, is_api: isApi ? {} : false, process_time: Date.now() - start, start}
            //         return r(result)
            //     }
            // },timeout)
           
            // let br = await BrowserService.getInstance(userAgentDefault, {initSign: true, headless: "yes"})
            let appVersion = encodeURI(appVersionDefault)

            isFetch = true
            let history_comment_cursor =  this.history_comment_cursor || 0
            let cursor = this.cursor || ''
            let internal_ext = ''
            internal_ext = this.internal_ext || ''
            let fetch_rule = this.internal_ext ? 2: 1
            fetch_rule =1;
            let endpoint = ``
            // endpoint = `version_code=180800&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi-VN&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${appVersion}&cookie_enabled=true&cursor=${cursor}&debug=false&device_id=&device_platform=web&did_rule=3&sup_ws_ds_opt=1&fetch_rule=${fetch_rule}&history_comment_count=0&history_comment_cursor=${history_comment_cursor}&host=https%3A%2F%2Fwebcast.tiktok.com&identity=audience&internal_ext=${encodeURIComponent(internal_ext)}&last_rtt=${last_rtt}&live_id=12&resp_content_type=protobuf&room_id=${this.room_id}&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&version_code=270000&msToken=${msToken}`

            endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=${this.last_rtt }&internal_ext=${(internal_ext).replaceAll("|","%7C")}&cursor=${cursor}&history_comment_cursor=${history_comment_cursor}&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`
            let url = "";
            if(!internal_ext) {



               
                endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=-1&internal_ext=0&cursor=0&history_comment_cursor=0&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`
            }


 
            let route = 'https://webcast.tiktok.com/webcast/im/fetch/'
            // let  { url: targetUrl, xbogus, _signature} = await br.buildUrlPageFull({url: `${route}?${endpoint}`, msToken})
            // let  { url: targetUrl, xbogus, _signature} = await signer.buildUrlPageFull({url: `${route}?${endpoint}`, msToken})
            let { targetUrl} = await this.sign({
              url: `${route}?${endpoint}`,
              msToken,
          });

               url = targetUrl

              // console.log("url",url)
               var options = {
                proxy_list: this.proxy_list,
                proxy:  parserProxyString(this.proxy),
                'method': 'GET',
                timeout,
                'url':  url,
                'headers': {
                    'Accept': '*/*',
                    'Accept-Language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7',
                    'Connection': 'keep-alive',
                    'Cookie': cookie_string,
                    "priority":"u=1, i",
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
                preCheckRetry: (body, jsonBody)=>{
                  if (!body||!body.includes(`wrss`)) {
                    // console.log("retry request")
                    return true;   
                  }
                }
                };
                // console.log("fetch",this.last_rtt ,url )
                this.last_time = Date.now()

                let data_page = await helper.makeRequest(options);
                // options = {
                //   url,
                //   useragent: userAgentDefault,
                //   proxyUrl: this.proxy,
                //   cookie_string: cookie_string,
                // }
                // let data_page = await helper.requestCURL(options);

                function getIdHexServer(hex){
                    let [ data,...others ] = hex.split("181");
                    let temp = others[0].slice(17);
                    let part = temp.slice(0, 2)
                    return   { idHexServer: others[0].slice(0, 17), part}

                }
                if(data_page.body){
                  let hex = data_page.bodyBinary.toString('hex');
                  let {idHexServer , part}= getIdHexServer(hex)
                  if(!this.idHexServer){
                    this.idHexServer = idHexServer
                    this.part = part
                  }
                
                }

                let that = this;
                function updateCookie(){
                  if(data_page.headers && data_page.headers['set-cookie']&& data_page.headers['set-cookie'].length){
                    let new_cookie = data_page.headers['set-cookie'].map(i=>{
                      let msToken = getString(i, 'msToken=', ';') 
                      if(msToken){
                        that.cookie_string = cookie_string.replace(/msToken=[^;]+/g, `msToken=${msToken}`)
                        return `msToken=${msToken}`
                      }
                    })
                 
                  }
                } 
                updateCookie()

                this.last_rtt = Date.now() - this.last_time
              // await br.initCookiesPageSign({cookies: helper.parserCookieString(cookie_string)})
            // let result = await br.fetchPageSign({
            //   // link: `${route}?${endpoint}&X-Bogus=${this.xbogusFetch.xbogus}`,
            //   link: `${url}`,
            //   cookie: cookie_string,
            //   // device_id: this.device_id,
            //   parser: true,
            //   returnData: true,
            // })
            // let data_page = { body: result.result}
              if(data_page.error){
                // console.log(data_page.error)
              }
          function Wrss (data){
            let [ t , w] = data.match(/wrss(.*?):/) || [ ]
            w = w || ""
            return w.slice(2,45)
          }
            function getData(split, current, is_last_time){
              split = split || []
              
              current = current || split.length-1;
              if(is_last_time)  current = 0
              if(current == -1) return ""
              if(split[current].includes("fetch_time")) return split[current]
              // if(current == 1) {
              //   if(split[current].includes("fetch_time")) return split[current]
              // }
              return getData(split, current -1, current- 1 == 0)
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
            function getHistoryComment(split){
              let history_comment = ""
              for(let i = 0; i < split.length; i++){
                if(split[i].includes("ws_proxy")) {
                  history_comment = split[i].slice(-19);
                }
              }
              history_comment = history_comment.replace(/\D/g, "");
              return history_comment
            }
             if(!done){
                done = true;
                if(data_page.error){
                  console.log("error fetch",this.session_id, data_page.error)
                }
                if(data_page.status == 403){
                  console.log("fetch 403",this.session_id)

                   throw new Error( "Request failed with status code 403")
                }

                if ( data_page.body && data_page.body.length) {
                    let split = data_page.body.split('\n')
                    let wrss = Wrss(data_page.body)

                    wrss= wrss.replace(":", "")
                    if(wrss){
                      this.wrss= wrss
                    }
                    let str = getData(split)
                    let ext = getString(str, 'fetch_time').replace('0\x01:&', '').replace(/\x01/g, "").replace(":\t", "")
                    let cursor  = getString(ext, 'next_cursor:', '|').replace('\x01:&', '')
                    if(! this.history_comment_cursor){
                      this.history_comment_cursor = getHistoryComment(split)
                    }
                    if(this.setCursor){
                      ext = ext.replace(/:3$/, "");
                      ext = ext.endsWith("00") ? ext.replace(/0$/, "") : ext
                      this.internal_ext = 'fetch_time' + ext
                      this.cursor = cursor
                    }
                    // this.cursor = cursor
                    // console.log("ext",this.session_id,ext)
      
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
          console.log("error",error)
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

  async checkCookieLive () {
    let { cookie_string, room_id, msToken: cmsToken, session_id: csession_id, timeout  } = this
    timeout = timeout || 30000
    var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
    let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
    this.tt_csrf_token =  getString(cookie_string.replace(/ /g,'') + ';', 'tt_csrf_token=', ';');
    this.s_v_web_id =  getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
    this.session_id = session_id;
    let verifyFp = getString(cookie_string.replace(/ /g,'') + ';', 'verifyFp=', ';') || getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';')
    this.device_id = getString(cookie_string + ';', 'device_id=', ';') || this.device_id
    let device_id = this.device_id
    let username =getString(cookie_string + ';', 'username=', ';') 
    const options = {
      retryTime: 3,

      url: `https://www.tiktok.com/passport/web/account/info/?aid=1459&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${appVersionDefault}6&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=&device_platform=web_pc&focus_state=true&from_page=user&history_len=5&is_fullscreen=false&is_page_visible=true&odinId=&os=mac&priority_region=VN&referer=https://www.tiktok.com/live&region=VN&root_referer=https://www.tiktok.com/live&screen_height=1117&screen_width=1728&tz_name=Asia/Saigon&user_is_login=true&verifyFp=${verifyFp}&webcast_language=en`,
      method: 'GET',
      headers: {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        cookie: cookie_string
      },
        preCheckRetry: (body, json)=>{
            return !body.includes(username);

        },
        proxy_list: this.proxy_list,
        proxy:  parserProxyString(this.proxy),
    }
    let res = await helper.makeRequest(options)
    let { body, bodyJson, status, headers, error} = res;
    if(!body) {
      return {status:false}
    }else if(body.includes(username)) {
      this.is_cookie_live = true
      return {status:true, live:true,body}
    }else{
      this.is_cookie_live = false
      return {status:true, live:false, body}
    }
  }

}

module.exports = Clone
