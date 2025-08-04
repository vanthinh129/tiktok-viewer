
var axios = require('axios')
var tunnel = require('tunnel')
var request = require('request')
const path = require("path")
const { delay, getString, parserProxyString, sendMessageTele, sendMessageTele403, changeIp, getRandomInt } = require("./helper")
const helper = require('./helper')
const TiktokSocket = require("./tiktok.socket.auto")
// const TiktokSocket = require("./TiktokSocket")
const BrowserService = require("./BrowserService")
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

const userAgentDefault = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36`
const appVersionDefault = userAgentDefault.replace("Mozilla/", "")
class Group {
    constructor({ proxyServer, number_id, server_ip, timestamp, proxy_data, server_site }) {
        this.accounts = [];
        this.rooms = {};
        this.proxyServer = proxyServer
        this.number_id = number_id;
        this.server_ip = server_ip;
        this.timestamp = timestamp;
        this.proxy_data = proxy_data;
        this.server_site = server_site;
        this.time_id = 0;

    }

    static async init({ accounts, task_id, video_id, proxyServer, number_id, server_ip, timestamp, proxy_data, server_site ,proxy_pup }) {

        let group = new Group({ proxyServer, number_id, server_ip, timestamp, proxy_data, server_site });
        await group.addAccounts({ accounts, task_id, video_id, proxyServer, proxy_pup })



        return group;
    }
    genuaMAC(){
        var ua = `Mozilla/5.0 (Macintosh; Intel Mac OS X ${this.getRandomInt (10, 17)}_${this.getRandomInt (0, 3)}_${this.getRandomInt (0, 3)}) AppleWebKit/${this.getRandomInt (500, 600)}.1.${this.getRandomInt (1, 15)} (KHTML, like Gecko) Version/${this.getRandomInt (15, 17)}.${this.getRandomInt (0, 3)} Safari/${this.getRandomInt (500, 600)}.1.${this.getRandomInt (1, 15)}`
        return ua
    }
    getRandomInt (min, max){
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min); 
    }
    encodeRFC3986URIComponent(str) {
        return encodeURIComponent(str).replace(
          /[!'()*]/g,
          (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
        );
      }
      async callApi({ clone , type}) {
          let { cookie_string, video_id, msToken: cmsToken, session_id: csession_id, proxyServer } = clone
          let timeout = 60000
          var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
          let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', ';sessionid=', ';');
          clone.session_id = session_id;
          let device_id = clone.device_id
          try {

              let appVersion = this.encodeRFC3986URIComponent(appVersionDefault)
  
              let xbogusFetch = ""
              let url = "";
              let endpoint = "";
              let req_body= "";
              let route = ''
              let is_sign = false;
              let br = null;
          
                  br = await BrowserService.getInstance(userAgentDefault,{ initSign:true})
     
              let random_de = getRandomInt(187248723442,934782374123)  
              if(!clone.device_id){
                  clone.device_id=  "7284943"+random_de;
              }
              let device_id =  clone.device_id
              let _bodyJson = null;
              
              switch (type) {
                  case "leave":
                      url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`
                      _bodyJson = {reason: 0, room_id: video_id}
                    is_sign = true;
                    break;
                  case "enter":
                       url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`
                      _bodyJson = {enter_source: "others-others", room_id: video_id}
                      break;
                 }
        
                 let target_url = ""
              
            
                 let  { url: targetUrl, xbogus, _signature, bodyEncoded} = await br.buildUrlPageSign({url,  bodyJson: _bodyJson, userAgent: userAgentDefault})
                 if(!targetUrl) {
                      let result = { error: "Không có sign", clone}
                      return result
                 }
  
                  target_url = targetUrl
              var options = {
                timeout,
              proxy:  helper.parserProxyString(proxyServer),
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
                  'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
                  'sec-ch-ua-mobile': '?0',
                  'sec-ch-ua-platform': '"macOS"',
                  'x-secsdk-csrf-token': 'DOWNGRADE'
              },
              body: bodyEncoded,
              isRetry: false
              };
           
              let data_page = await helper.makeRequest(options);
              if(data_page.status == 403){
                console.log(clone. session_id, "enter 403")
                  let result = { is_403: true, clone}
                  return result
              }
              if(data_page.body) {
              
                  let code = data_page.bodyJson.status_code;
                  let message = (data_page.bodyJson|| {}).data.message;
                  let result = { is_403: false, clone, is_dead: message === "User doesn't login" || code === 20003 ? true: false, is_end: message === "room has finished" || code === 30003}
                  return result
      
              }
                let result = { is_403: false, clone, data: data_page.body}
              return result
  
          } catch (error) {
              console.log("error call api", error.message)
              let result =  { is_403: error.message == "Request failed with status code 403" ? true: false, clone, error:error.message}
  
              return result
          }
  
      }
    async addAccounts({ accounts, task_id, video_id, proxyServer, proxy_pup }) {
        let that = this;
        this.rooms[task_id] = "running"
        let new_accs = []
        // await accounts.map(async (i ,index)=> {

        //     let client = new TiktokSocket({ cookie_string: i, proxy_string: proxyServer, useragent: this.genuaMAC(),rooms: this.rooms, task_id: task_id,isShowLog: true })
        //     let clone = { task_id, video_id, cookie_string: i, proxyServer, client }
        //     // await BrowserService.getInstance(userAgentDefault,{ initSign:true, proxy: helper.parserProxyString(proxy_pup)})
        //     // await this.callApi({clone:clone ,type: "enter" })
        //     await delay(index*100)
        //     client.connect({ room_id: video_id })
        //     new_accs.push(clone)
        // })
        for (var i = 0; i < accounts.length; i++) {
            let client = new TiktokSocket({ cookie_string: accounts[i], proxy_string: proxyServer, useragent: this.genuaMAC(),rooms: this.rooms, task_id: task_id,server_site: that.server_site, isShowLog: false })
            let clone = { task_id, video_id, cookie_string: accounts[i], proxyServer, client }
            // await BrowserService.getInstance(userAgentDefault,{ initSign:true, proxy: helper.parserProxyString(proxy_pup)})
            // await this.callApi({clone:clone ,type: "enter" })
            // await helper.delay(500)

            client.connect({ room_id: video_id })
            new_accs.push(clone)
        }

        this.accounts = [...this.accounts, ...new_accs]
        // console.log('new_accs',proxyServer)
        // setTimeout(function(){
        //     that.checkConnect({task_id})
        // }, 40000)
        

    }
    async checkConnect({task_id}) {
        let that = this;
        // console.log(that.accounts)
        let number_connect = 0;
        let number_account_in_task = 0;
        let have_retry_over = false
        this.accounts.map(function(account){
            if (account.task_id == task_id){
                number_account_in_task++;
            }
        })
        for (let i = 0; i < this.accounts.length; i++) {
            let account = this.accounts[i]
            if (account.task_id == task_id && account.client.socketConnected) {
                number_connect++;
            }
            if(account.task_id == task_id && account.client.retryTime > 3){
                have_retry_over = true;
                break
            }
        }
        
        if(number_connect == 0 || have_retry_over){
            let new_proxy = helper.getproxypy();//await helper.getcheckproxy(1,0);
            console.log(task_id,this.accounts.length,'number_connect',number_connect,'/',number_account_in_task)
            for (let i = 0; i < this.accounts.length; i++) {
                let account = this.accounts[i]
                if (account.task_id == task_id) {
                    account.client.proxy_string = new_proxy
                    account.client.retryTime = 1
                }
            }
        }
        if(this.accounts && this.accounts.length){
            setTimeout(function(){
                that.checkConnect({task_id})
            }, 30000)
        }
    }

    async check101({task_id}) {
        let number_101 = [];
        for (let i = 0; i < this.accounts.length; i++) {
            let account = this.accounts[i]
            if (account.task_id == task_id && account.client.is_101) {
                // number_101++;
                number_101.push(account.client.sessionid)
            }
        }
        return number_101;

    }
    async action({ type, task_id }) {
        for (let i = 0; i < this.accounts.length; i++) {
            let account = this.accounts[i]
            if (account.task_id == task_id) {
                if (type == "pause" || type == "cancel") {
                    account.client.close();

                } else {
                    account.client.retryTime = 0
                    account.client.connect({ room_id: account.video_id })
                }
            }
        }
        if (type == "cancel") {
            delete this.rooms[task_id]
            this.accounts = this.accounts.filter(i => i.task_id != task_id)
        }
    }


}
module.exports = Group