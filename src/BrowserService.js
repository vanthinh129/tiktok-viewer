// const puppeteer = require('puppeteer')
const puppeteer = require('puppeteer-extra')
const querystring = require("querystring")
const path = require("path")
let userAgentDefault =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36'

  const delay = (time) => new Promise((r) => setTimeout(r, time))
let { executablePath, headless } = require(path.resolve("./data/accounts.json"))
const os = require("os");
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

 userAgentDefault = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36`
const { getString,strData } = require("./helper")
class BrowserService {
  static isInitialized
  static instance
  page
  browser
  userAgent
  appVersion
  navigator
  pageFetch
  constructor({ userAgent, proxy, getNewCookie, modeInstance,profile_name,initSign,cookies, headless }) {
    this.getNewCookie = getNewCookie
    this.modeInstance = modeInstance
    this.reTryInitFetch = 0;
    this.reTryInitSign = 0;
    this.reTryInitTemp = 0;
    this.reTryInitUpdate = 0;
    this.cookies = cookies
    this.reTryInit = 0
    this.userAgent = userAgent
    this.proxy = proxy
    this.page = null;
    this.browser = null
    this.pageFetch = null
    this.totalDone = 0;
    this.profile_name = profile_name;
    this.totalAttendanced = 0;
    this.initSign =  initSign;
    this.initTemp = "pending";
    this.headless = headless;
    this.id = Date.now()
  }
  static async getInstance(userAgent, options) {
    try {
        while (BrowserService.initStatus == "processing") {
          await delay(100);
      }
      options = options || {}
      if (!BrowserService.isInitialized) {
        BrowserService.initStatus = "processing"
        BrowserService.isInitialized = false
        BrowserService.instance = new BrowserService({
          userAgent: userAgent || userAgentDefault,
          modeInstance: "single",
          profile_name:  options.profile_name ||"xbogus",
          ...options
        })
        await BrowserService.instance.init("single")
      }
      return BrowserService.instance
    } catch (e) {
      console.log("get Instance error:",e);
      return false
    }

  }
  static async updateInstance(mode) {
    try {
      if(!BrowserService.instance ) return; 
         BrowserService.initStatus = "processing"
        if(mode == "tab"){
          let success = await BrowserService.instance.initPageUpdate();
          if(success) {
             BrowserService.instance.page = BrowserService.instance.page_temp;
             BrowserService.instance.page_temp = null;
             setTimeout(async() => {
              try {
                let pages = await BrowserService.instance.browser.pages();
                pages.forEach(async (page) => {
                  if(! (page._idPage ==   BrowserService.instance.page._idPage)){
                    await page.close();
                  }
                })
              } catch (e) {
              }
              
                }, 1000);
          }
        } else {
          BrowserService.isInitialized= false;

            let      { getNewCookie, cookies, userAgent ,   proxy ,initSign,modeInstance, headless} = BrowserService.instance
            let ins = new BrowserService( { getNewCookie, cookies, userAgent ,   proxy ,initSign,modeInstance, headless});
            await ins.init("single")
            let temp = BrowserService.instance;
            BrowserService.instance = ins

            setTimeout(()=>{
              temp.browser.close();
            },15000)
        
           
        }
      
        BrowserService.initStatus = "inited"
        return true;
    } catch (e) {
      console.log("get updateInstance error:",e);
      return false
    }

  }
  /**
  * init
  * @param {userAgent: string, options: {cookies:Array<objCookie>}}
  */
  static async newInstance(userAgent, options) {
    try {
      options = options || {}
      let { cookies, profile_name } = options
      // if (BrowserService.instance && !BrowserService.instance.pageFetch && !BrowserService.instanceGot ) {
      //   BrowserService.instanceGot = true;
      //   await BrowserService.instance.initPageFetch({ cookies })
      //   return BrowserService.instance
      // }

      let newInstance = new BrowserService({
        userAgent: userAgent || userAgentDefault,
        modeInstance: "multi",
        profile_name: profile_name,
        ...options
      })
      await newInstance.init("multi")
      await newInstance.initPageFetch({ cookies })

      return newInstance;
    } catch (e) {
      console.log("Error newInstance", e);
      return false
    }

  }
  /**
 * init
 * @param {modeInstance: string} modeInstance (single | multi| update)
 */
  async init(modeInstance) {
    return new Promise(async (resolve, reject) => {
      try {
        if (modeInstance == "update" || !BrowserService.isInitialized || modeInstance != "single") {
          const StealthPlugin = require('puppeteer-extra-plugin-stealth')
          puppeteer.use(StealthPlugin())
          var window_size = {
            // width: 320,
            // height: 400
            width: 1920,
            height: 1080
          }
          let _headless = this.headless || headless;
          let params = {
            args: [
        //       '--lang=en-US','--no-sandbox',
        // '--disable-setuid-sandbox',
        // "--no-first-run",
        // '---auto-open-devtools-for-tabs',
        // '--disable-dev-shm-usage',
        // '--disable-session-crashed-bubble',
        // `--window-size=${window_size.width},${window_size.height+150}`,
        // `--window-position=0,0`,
        '--lang=en-US',
  '--no-sandbox',
  '--disable-setuid-sandbox',
  '--disable-dev-shm-usage',
  '--disable-background-networking',
  '--disable-background-timer-throttling',
  '--disable-backgrounding-occluded-windows',
  '--disable-breakpad',
  '--disable-client-side-phishing-detection',
  '--disable-default-apps',
  '--disable-hang-monitor',
  '--disable-popup-blocking',
  '--disable-prompt-on-repost',
  '--disable-sync',
  '--metrics-recording-only',
  '--no-first-run',
  '--no-default-browser-check',
  '--disable-translate',
  '--disable-extensions',
  '--safebrowsing-disable-auto-update',
  '--disable-features=site-per-process',
  '--window-size=320,550',
  '--window-position=0,0',
  '--disable-gpu',
  // '--single-process',
  // `--user-data-dir=profile/${this.profile_name}`,
        // `--user-data-dir=profile/${this.profile_name}`,
              ],
            executablePath: executablePath,
            headless: _headless  && _headless == "no" ? false :  "new",
            protocolTimeout: 120000,
            env: {
                DISPLAY: ":10.0"
            },
            ignoreDefaultArgs: ['--disable-extensions'],
          }
          if(os_type == "Linux"){
            delete params.executablePath
          }
          if (this.proxy) {
            let { protocol, host, port, username, password } = this.proxy;
            params.args.push(`--proxy-server=${host}:${port}`)
            if (username && password) {
              params.args.push(`--proxy-auth=${username}:${password}`)
            }

          }
          this.browser = await puppeteer.launch(params)
          
          if (modeInstance == "single") {
              BrowserService.isInitialized = true
              if(!this.initSign){
                BrowserService.initStatus = "inited"
              }
          }
          if(this.initSign){
            let { cookies } = this
            await this.initPageSign({cookies});
            if (modeInstance == "single") {
              BrowserService.initStatus = "inited"
          }
          }

          return resolve()
        }
      } catch (error) {
        console.log("Error init browser", error)
        if (this.reTryInit <= 3) {
           await delay(1000)
          this.reTryInit++;
          return await this.init(modeInstance)
        } else {
          throw new Error("Init max retry")
        }
      }
    })
  }
  /**
   * sign
   * @param {array: Array<string>} list agruments
   */
  async sign(array) {
    if (!this.page) throw new Error("Page sign not found");
    try {
      return await this.page.evaluate((args) => {
        return window.sign(args)
      }, array)
    } catch(error){
      console.log("Error sign", error)
      return ""
    }

  }
  static async deleteInstance() {
    try {
      if (BrowserService.instance) {
      let ins = BrowserService.instance;
      ins.browser.close();
      BrowserService.isInitialized= false;
      BrowserService.instance = null;
      }
    } catch (e) {
      console.log("deleteInstance error:",e);
      return false
    }
  }
  /**
 * initPageSign
 * @param {{userAgent:string}} options
 */
  async initPageSign(options) {
    if(this.page) return
    try {
      options = options || {}
      if (!this.browser) {
        throw new Error("Browser is not initialized")
      }
      let pages = await this.browser.pages();

      this.page = pages && pages.length ? pages[0] : await this.browser.newPage()
      if (this.proxy) {
        let { protocol, host, port, username, password } = this.proxy;
        await this.page.authenticate({ username, password })
      }
      let { userAgent: userAgentInit,  cookies  } = options

      await this.page.setUserAgent(userAgentInit || this.userAgent)

      var window_size = {width: 320, height: 400}
      await this.page.setViewport({width: window_size.width, height: window_size.height, deviceScaleFactor:0.5});
      let { userAgent, appVersion, navigator } = await this.page.evaluate(() => {
        let navigator = window.navigator
        let { appVersion, userAgent } = navigator
        return { appVersion, userAgent, navigator }
      })
      this.appVersion = appVersion
      this.navigator = navigator
      this.userAgent = userAgent
      if (cookies && cookies.length) {
        await this.page.setCookie(...cookies)
      }
      await this.page.goto(`https://webcast.tiktok.com/setting`)
      await delay(200)
      // await this.loadInit({page: this.page, options: { loadScript: true}})

      await this.loadInit2({page: this.page, options: { loadScript: true}})

      // await this.page.evaluate(async () => {
      //   const script = document.createElement('script');
      // script.src = 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/webmssdk/1.0.0.57/webmssdk.js';
      // document.head.appendChild(script);
      // let delay = (time)=> new Promise(r=>setTimeout(r,time))
      // let init = async function(){
      //   if(window.byted_acrawler && window.byted_acrawler.frontierSign){
      //     window.sign = (args) => {
      //       let frontierSign = window.byted_acrawler.frontierSign
      //       let temp = frontierSign['_v'][2]
      //       frontierSign['_v'] = [413, 2, temp]
      //       let result = frontierSign(...args)
      //       return result
      //     }
      //     console.log(window.sign)
      //   } else {
      //     await delay(200);
      //     return init()
      //   }
      // }
      // await init();
      // })
      console.log("Init sign success")

    } catch (error) {
      console.log("Error init page sign:", error)
      if (this.reTryInitSign <= 3) {
         await delay(1000)
        this.reTryInitSign++;
        return await this.initPageSign(options)
      } else {
        throw new Error("Init page sign max retry")
      }
    }
  }
  async initPageUpdate(options) {
    if(!this.page) return
    try {
      options = options || {}
      if (!this.browser) {
        throw new Error("Browser is not initialized")
      }

      this.page_temp =  await this.browser.newPage()
      if (this.proxy) {
        let { protocol, host, port, username, password } = this.proxy;
        await this.page_temp.authenticate({ username, password })
      }
      let { userAgent: userAgentInit,  cookies  } = options

      await this.page_temp.setUserAgent(userAgentInit || this.userAgent)

      var window_size = {width: 320, height: 400}
      await this.page_temp.setViewport({width: window_size.width, height: window_size.height, deviceScaleFactor:0.5});
      let { userAgent, appVersion, navigator } = await this.page_temp.evaluate(() => {
        let navigator = window.navigator
        let { appVersion, userAgent } = navigator
        return { appVersion, userAgent, navigator }
      })
      this.appVersion = appVersion
      this.navigator = navigator
      this.userAgent = userAgent
      if (cookies && cookies.length) {
        await this.page_temp.setCookie(...cookies)
      }
        await this.page_temp.goto(`https://webcast.tiktok.com/setting`)
      await delay(200)
      // await this.loadInit({page: this.page, options: { loadScript: true}})

      await this.loadInit2({page: this.page_temp, options: { loadScript: true}})

      // await this.page.evaluate(async () => {
      //   const script = document.createElement('script');
      // script.src = 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/webmssdk/1.0.0.57/webmssdk.js';
      // document.head.appendChild(script);
      // let delay = (time)=> new Promise(r=>setTimeout(r,time))
      // let init = async function(){
      //   if(window.byted_acrawler && window.byted_acrawler.frontierSign){
      //     window.sign = (args) => {
      //       let frontierSign = window.byted_acrawler.frontierSign
      //       let temp = frontierSign['_v'][2]
      //       frontierSign['_v'] = [413, 2, temp]
      //       let result = frontierSign(...args)
      //       return result
      //     }
      //     console.log(window.sign)
      //   } else {
      //     await delay(200);
      //     return init()
      //   }
      // }
      // await init();
      // })
      this.reTryInitUpdate = 0;
      this.page_temp._idPage = Date.now()
      return true

    } catch (error) {
      console.log("Error init  page_temp:", error)
      if (this.reTryInitUpdate <= 2) {
         await delay(1000)
        this.reTryInitUpdate++;
        return await this.initPageUpdate(options)
      } else {
        process.exit(1)
        throw new Error("Init page_temp max retry")
      }
    }
  }
  /**
 * initPage
 * @param {{userAgent, cookies: Array}} options
 */
  async initPageFetch(options) {
    try {
      options = options || {}
      if (!this.browser) {
        throw new Error("Browser is not initialized")
      }
      let { cookies, userAgent: userAgentInit } = options;
      let pages = await this.browser.pages();
      if (this.modeInstance == "multi") {
        this.pageFetch = pages && pages.length ? pages[0] : await this.browser.newPage();
      } else {
        this.pageFetch = await this.browser.newPage();
      }
      if (this.proxy) {
        let { protocol, host, port, username, password } = this.proxy;
        if (username && password)
          await this.pageFetch.authenticate({ username, password })
        // await this.setProxy(this.proxy)
      }
      await this.pageFetch.setUserAgent(userAgentInit || this.userAgent)
      var window_size = {width: 320, height: 400}
      await this.pageFetch.setViewport({width: window_size.width, height: window_size.height, deviceScaleFactor:0.5});
      if (this.getNewCookie) {
        await this.getNewCookie();
      } else if (cookies && cookies.length) {

        await this.pageFetch.setCookie(...cookies)
      }
      // await this.pageFetch.setCookie(...cookies)
      await this.pageFetch.goto(`https://webcast.tiktok.com/setting`)

      // await this.pageFetch.goto(`https://tiktok.com`)
      await this.pageFetch.reload({waitUntil: 'networkidle2'});
      await this.pageFetch.setCacheEnabled(false);
      await delay(200)
      await this.loadInit2({page: this.pageFetch, options: { loadScript: true}})
      // await this.pageFetch.evaluate(async() => {
      //   const script = document.createElement('script');
      //   script.src = 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/webmssdk/1.0.0.57/webmssdk.js';
      //   document.head.appendChild(script);
      //   let delay = (time)=> new Promise(r=>setTimeout(r,time))
      //   let init = async function(){
      //     if(window.byted_acrawler && window.byted_acrawler.frontierSign){
      //       window.sign = (args) => {
      //         let frontierSign = window.byted_acrawler.frontierSign
      //         let temp = frontierSign['_v'][2]
      //         frontierSign['_v'] = [413, 2, temp]
      //         let result = frontierSign(...args)
      //         return result
      //       }
      //       console.log(window.sign)
      //     } else {
      //       await delay(200);
      //       return init()
      //     }
      //   }
      //   await init();
      //   window.imFetch = async (options) => {
      //     try {
      //       let { link, cookie, body, parser, method } = options
      //       var myHeaders = new Headers()
      //       myHeaders.append('Accept', '*/*')
      //       myHeaders.append('Accept-Language', 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1')
      //       myHeaders.append('Cache-Control', 'no-cache')
      //       myHeaders.append('Connection', 'keep-alive')
      //       myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
      //       myHeaders.append('Cookie', cookie)
      //       myHeaders.append('DNT', '1')
      //       myHeaders.append('Origin', 'https://www.tiktok.com')
      //       myHeaders.append('Pragma', 'no-cache')
      //       myHeaders.append('Referer', 'https://www.tiktok.com/')
      //       myHeaders.append('Sec-Fetch-Dest', 'empty')
      //       myHeaders.append('Sec-Fetch-Mode', 'cors')
      //       myHeaders.append('Sec-Fetch-Site', 'same-site')
      //       let { userAgent } = navigator
      //       myHeaders.append('User-Agent', userAgent)
      //       myHeaders.append('sec-ch-ua', '"Not/A)Brand";v="99", "Google Chrome";v="116", "Chromium";v="116"')
      //       myHeaders.append('sec-ch-ua-mobile', '?0')
      //       myHeaders.append('sec-ch-ua-platform', '"macOS"');
      //       let ops =  {
      //         headers: myHeaders,
      //         referrer: 'https://www.tiktok.com/',
      //         referrerPolicy: 'strict-origin-when-cross-origin',
      //         body: null,
      //         method: 'GET',
      //         mode: 'cors',
      //         credentials: 'include',
      //       }
      //       if(body) ops.body = body;
      //       if(method) ops.method = method
      //       return await new Promise((r, rj) => {
      //         fetch(link,ops)
      //           .then(async (a) => {
      //             // r({ is_error: false, data: '', status: a.status, msToken:'' })
      //             if (a.status >= 300) {
      //               r({ is_error: true, data: "", status: a.status })
      //             }
      //             let reader = null
      //             let result = ''
      //             if (parser) {
      //               if (a.body) {
      //                 reader = await a.body.getReader()
      //               }
      //               if (reader) {
      //                 let read = await reader.read()
      //                 if (read && read.value && read.value.length)
      //                   result = read.value.reduce(
      //                     (pre, cur) => pre + String.fromCharCode(cur),
      //                     ''
      //                   )
      //               }
      //             }
      //             // if (result) console.log("result",result )
      //             let msToken = a.headers.get("x-ms-token")
      //             r({ is_error: false, data: result, status: a.status, msToken })
      //           })
      //           .catch((e) => rj(e))
      //       })
      //     } catch (error) {
      //       console.log("error imfetch" , error)
      //       return { is_error: true, error: error.stack, status: -1, msToken:"" }
      //     }
      //   }
      //   console.log(window.imFetch)
      // })

      console.log("Init page fetch success")
    } catch (error) {
      console.log("Error init page fetch:", error)
      if (this.reTryInitFetch <= 20) {
        this.reTryInitFetch++;
         await delay(2000)
        return await this.initPageFetch(options)
      } else {
        throw new Error("Init page fetch max retry")
      }
    }


  }
  async loadInit ({page, options}){
    let {loadScript} = options;
    let scriptSdk =  await strData(path.resolve("./src/webmssdk.js"))
    let reuslt = await page.evaluate(async({ loadScript, scriptSdk}) => {
      if(loadScript){
        window.eval(scriptSdk);
        // const script = document.createElement('script');
        // script.src = 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/webmssdk/1.0.0.57/webmssdk.js';
        // document.head.appendChild(script);
      }

      let delay = (time)=> new Promise(r=>setTimeout(r,time))
      let init = async function(){
        if(window.byted_acrawler && window.byted_acrawler.frontierSign){
          window.sign = (args) => {
            let frontierSign = window.byted_acrawler.frontierSign
            let temp = frontierSign['_v'][2]
            frontierSign['_v'] = [413, 2, temp]
            let result = frontierSign(...args)
            return result
          }
          console.log(window.sign)
          window.buildUrl = ({url, bodyEncoded, bodyJson})=>{
            let [ host, params] = url.split("?")
            let ars = [params] 
            if(bodyEncoded){
              ars.push(bodyEncoded)
            }
            let xbogus = window.sign(ars);
            let new_url =  `${url}&X-Bogus=${xbogus}`;
            let sign_params = { url: new_url}
            if(bodyJson){
              sign_params.bodyVal2str = true;
              sign_params.body = bodyJson;
            }
            let ars_signature = [ sign_params, undefined, "forreal"]
            let _signed = window.getSignature(...ars_signature)
            let result =  { _signature: _signed, url: `${url}&X-Bogus=${xbogus}&_signature=${_signed}`, xbogus, bodyEncoded, bodyJson}
            return result
          }
        } else {
          await delay(200);
          return init()
        }
      }
      await init();
      window.imFetch = async (options) => {
        try {
          let { link, cookie, body, parser, method, log, returnData, sessionid } = options
          var myHeaders = new Headers()
          myHeaders.append('Accept', '*/*')
          myHeaders.append('Accept-Language', 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1')
          // myHeaders.append('Cache-Control', 'no-cache')
          myHeaders.append('Connection', 'keep-alive')
          myHeaders.append('Content-Type', 'application/x-www-form-urlencoded; charset=UTF-8')
          myHeaders.append('Cookie', cookie)
          myHeaders.append('DNT', '1')
          myHeaders.append('Origin', 'https://www.tiktok.com')
          // myHeaders.append('Pragma', 'no-cache')
          myHeaders.append('Referer', 'https://www.tiktok.com/')
          myHeaders.append('Sec-Fetch-Dest', 'empty')
          myHeaders.append('Sec-Fetch-Mode', 'cors')
          myHeaders.append('Sec-Fetch-Site', 'same-site')
          let { userAgent } = navigator
          myHeaders.append('User-Agent', userAgent)
          // myHeaders.append('sec-ch-ua', '"Not/A)Brand";v="99", "Google Chrome";v="116", "Chromium";v="116"')
          myHeaders.append('sec-ch-ua-mobile', '?0')
          myHeaders.append('sec-ch-ua-platform', '"macOS"');
          let ops =  {
            headers: myHeaders,
            referrer: 'https://www.tiktok.com/',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: 'GET',
            mode: 'cors',
            credentials: 'include',
          }
          if(body) ops.body = body;
          if(method) ops.method = method
          return await new Promise((r, rj) => {
            fetch(link,ops)
              .then(async (a) => {
                // r({ is_error: false, data: '', status: a.status, msToken:'' })
                if (!a || a.status >= 300) {
                  r({ is_error: true, data: "", status: a.status })
                }
                let reader = null
                let result = ''
                if (parser) {
                  if (a.body) {
                    reader = await a.body.getReader()
                  }
                  if (reader) {
                    let read = await reader.read()
                    if (read && read.value && read.value.length)
                      result = read.value.reduce(
                        (pre, cur) => pre + String.fromCharCode(cur),
                        ''
                      )
                  }
                }
                if (result && log) {
                  let [others, internal_exts ] = link.split("internal_ext=");
                  let [ internal_ext, other] = (internal_exts||"").split("&")
                  console.log(`${sessionid}: ${internal_ext}\n${result}` )
                } 
                let msToken = a.headers.get("x-ms-token")
                r({ is_error: false, data: returnData ? result : "", status: a.status, msToken, dataLength: result? result.length: 0 , result})
              })
              .catch((e) => rj(e))
          })
        } catch (error) {
          console.log("error imfetch" , error)
          return { is_error: true, error: error.stack, status: -1, msToken:"" }
        }
      }
      console.log(window.imFetch)
    },{ loadScript, scriptSdk})
  }
  async loadInit2 ({page, options}){
    let {loadScript} = options;
    let scriptSdk2 =  await strData(path.resolve("./src/webmssdk_v4.js"))

    let reuslt = await page.evaluate(async({ loadScript, scriptSdk}) => {
      if(loadScript){
        window.eval(scriptSdk);
        // const script = document.createElement('script');
        // script.src = 'https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static/webmssdk/1.0.0.57/webmssdk.js';
        // document.head.appendChild(script);
      }

      let delay = (time)=> new Promise(r=>setTimeout(r,time))
      let init = async function(){
        if(window.__tsign && window.__tsign.u && window.__tsign.u[870] && window.__tsign.u[871]){
      
          window.buildUrlFull =  function ({msToken, url, bodyEncoded, bodyJson}) {
            let [ host, params] = url.split("?")
            console.log("buildUrlFull", msToken,url, bodyEncoded, bodyJson)
            let xbogus = window.__tsign.u[870].v(params, bodyEncoded);
            let xgnarly = window.__tsign.u[871].v(params, bodyEncoded);
            let result =  { url: `${url}&X-Bogus=${xbogus}&X-Gnarly=${xgnarly}`, bodyEncoded, bodyJson, xbogus, xgnarly}
            return result;
        };
        } else {
          await delay(200);
          return init()
        }
      }
      await init();
      window.imFetch = async (options) => {
        try {
          let { link, cookie, body, parser, method, log, returnData, sessionid, content_type } = options
          var myHeaders = new Headers()
          myHeaders.append('Accept', '*/*')
          myHeaders.append('Accept-Language', 'en-US,en;q=0.9,it-IT;q=0.8,it;q=0.7,ko;q=0.6,ja;q=0.5,zh;q=0.4,vi;q=0.3,vi-VN;q=0.2,zh-HK;q=0.1')
          // myHeaders.append('Cache-Control', 'no-cache')
          myHeaders.append('Connection', 'keep-alive')
          myHeaders.append('Content-Type', content_type || 'application/json; charset=UTF-8')
          myHeaders.append('Cookie', cookie)
          myHeaders.append('DNT', '1')
          myHeaders.append('Origin', 'https://www.tiktok.com')
          // myHeaders.append('Pragma', 'no-cache')
          myHeaders.append('Referer', 'https://www.tiktok.com/')
          myHeaders.append('Sec-Fetch-Dest', 'empty')
          myHeaders.append('Sec-Fetch-Mode', 'cors')
          myHeaders.append('Sec-Fetch-Site', 'same-site')
          let { userAgent } = navigator
          myHeaders.append('User-Agent', userAgent)
          myHeaders.append('sec-ch-ua-mobile', '?0')
          myHeaders.append('sec-ch-ua-platform', '"macOS"');
          let ops =  {
            headers: myHeaders,
            referrer: 'https://www.tiktok.com/',
            referrerPolicy: 'strict-origin-when-cross-origin',
            body: null,
            method: method || 'GET',
            mode: 'cors',
            credentials: 'include',
          }
          if(body) ops.body = body;
          if(method) ops.method = method
          return await new Promise((r, rj) => {
            fetch(link,ops)
              .then(async (a) => {
                // r({ is_error: false, data: '', status: a.status, msToken:'' })
                if (!a || a.status >= 300) {
                  r({ is_error: true, data: "", status: a.status })
                }
                let reader = null
                let result = ''
                if (parser) {
                  if (a.body) {
                    reader = await a.body.getReader()
                  }
                  if (reader) {
                    let read = await reader.read()
                    if (read && read.value && read.value.length)
                      result = read.value.reduce(
                        (pre, cur) => pre + String.fromCharCode(cur),
                        ''
                      )
                  }
                }
                if (result && log) {
                  let [others, internal_exts ] = link.split("internal_ext=");
                  let [ internal_ext, other] = (internal_exts||"").split("&")
                  console.log(`${sessionid}: ${internal_ext}\n${result}` )
                } 
                let msToken = a.headers.get("x-ms-token")
                r({ is_error: false, data: returnData ? result : "", status: a.status, msToken, dataLength: result? result.length: 0 , result})
              })
              .catch((e) => rj(e))
          })
        } catch (error) {
          console.log("error imfetch" , error)
          return { is_error: true, error: error.stack, status: -1, msToken:"" }
        }
      }
      console.log(window.imFetch)
    },{ loadScript, scriptSdk:scriptSdk2})
  }
    /**
 * initPage
 * @param {{userAgent, cookies: Array}} options
 */
    async initPageTemp(options) {
      try {
        if(this.pageTemp || this.initTemp == "processing" || this.initTemp == "success" || this.isClosed) {
          return;
        }
        options = options || {}
        if (!this.browser) {
          throw new Error("Browser is not initialized")
        }
        this.initTemp = "processing"
        let { cookies, userAgent: userAgentInit } = options;
          this.pageTemp = await this.browser.newPage();
        if (this.proxy) {
          let { protocol, host, port, username, password } = this.proxy;
          if (username && password)
            await this.pageTemp.authenticate({ username, password })
        }
        await this.pageTemp.setUserAgent(userAgentInit || this.userAgent)
        var window_size = {width: 320, height: 400}
      await this.pageTemp.setViewport({width: window_size.width, height: window_size.height, deviceScaleFactor:0.5});
        if (cookies && cookies.length) {
          await this.pageTemp.setCookie(...cookies)
        }
        await this.pageTemp.goto(`https://webcast.tiktok.com/setting`)
        await this.pageTemp.reload({waitUntil: 'networkidle2'});
        await this.pageTemp.setCacheEnabled(false);
        await delay(200)
        await this.loadInit({page: this.pageTemp, options: { loadScript: true}})

        // console.log("Init page temp success");
        this.initTemp = "success"
      } catch (error) {
        console.log("Error init page temp:", error)
        if (this.reTryInitTemp <= 20) {
          this.reTryInitTemp++;
           await delay(2000)
          return await this.initPageTemp(options)
        } else {
          this.initTemp = "pending"
        }
      }
  
  
    }
  async getNewCookie() {
    if (cookies && cookies.length) {
      await this.pageFetch.setCookie(...cookies)
    }
    await this.pageFetch.goto("https://www.tiktok.com/explore");
     await delay(1000);
    cookies = await this.pageFetch.cookies();
    await delay(200)
    let innerHtml = await this.pageFetch.evaluate(() => {
      let result = "";
      let tag = document.querySelector("#SIGI_STATE");
      if (tag) result = tag.innerHTML;
      return result;
    })
    let device_id = getString(innerHtml || "", `wid":"`, `"`);
    this.pageFetch.device_id = device_id
  }
  /**
   * fetch
   * @param {{link: string, device_id: string, cookies}} options
   */
  async fetch(options) {
    try {
      if(this.isClosed) return { is_error: false, status: 2000, data: ""}
      let page = this.pageFetch;
      if (!page) throw new Error(`Page fetch not found`)
      // const client = await page.target().createCDPSession()    
      // await client.send('Network.clearBrowserCookies')
      // await page.setCookie(...options.cookies)
      if(!options.timeout){
        options.timeout = 30000
      }
      let result=  await page.evaluate((args) => {
        return window.imFetch(args)
      }, options)
      return result;
    } catch(error) {
      console.log("Error page fetch", error);
      return { is_error: true, status: -1, data: "", error:error}
    }

  }
  async fetchPageSign(options) {
    try {
      if(this.isClosed) return { is_error: false, status: 2000, data: ""}
      let page = this.page;
      if (!page) throw new Error(`Page fetch not found`)
      // const client = await page.target().createCDPSession()    
      // await client.send('Network.clearBrowserCookies')
      // await page.setCookie(...options.cookies)
      let result=  await page.evaluate((args) => {
        return window.imFetch(args)
      }, options)
      return result;
    } catch(error) {
      console.log("Error page fetch", error);
      return { is_error: true, status: -1, data: "", error:error}
    }

  }
  /**
   * initCookies
   * @param {{cookies: Array, device_id: string}} options
   */
  async initCookies(options) {
    try {
      let { cookies } = options
      let page = this.pageFetch;
      const client = await page.target().createCDPSession()
      await client.send('Network.clearBrowserCookies')
      if (!page) throw new Error(`Page fetch not found`)
      await this.pageFetch.setCookie(...cookies)
      return true;
    } catch(error){
      console.log("Error init cookies", error)
      return false
    }
    
  }
    /**
   * initCookies
   * @param {{cookies: Array, device_id: string}} options
   */
    async initCookiesPageSign(options) {
      try {
        let { cookies } = options
        let page = this.page;
        const client = await page.target().createCDPSession()
        await client.send('Network.clearBrowserCookies')
        if (!page) throw new Error(`Page fetch not found`)
        await this.page.setCookie(...cookies)
        return true;
      } catch(error){
        console.log("Error init cookies", error)
        return false
      }
      
    }
  /**
 * setProxy
 * @param {proxy: Proxy} proxy set proxy for page fetch
 */
  async setProxy(proxy) {
    this.proxy = proxy || this.proxy;
    let page = this.pageFetch;
    await page.setRequestInterception(true);
    let { protocol, host, port, username, password } = this.proxy;
    this.proxyServer = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`;
    page.on('request', (request) => {

      request.continue({ proxy: this.proxyServer });
    });
  }
  async clearProxy() {
    let page = this.pageFetch;
    page.setRequestInterception(false);
    await page.setExtraHTTPHeaders({ 'Proxy-Authorization': "" });
  
    this.proxyServer = ""
  }
  setAttendanced(total) {
    this.totalAttendanced = total
  }
  async done() {
    this.totalDone++;
    if (this.totalAttendanced && this.totalDone == this.totalAttendanced && this.browser) {
      this.browser.close();
      this.browser = null
    }
  }
  /**
   * signPage
   * @param {array: Array<string>} list agruments
   */
    async signPage(array) {
      if (!this.pageFetch) throw new Error("Page Fetch not found");
      try {
        return await this.pageFetch.evaluate((args) => {
          return window.sign(args)
        }, array)
      } catch(error){
        console.log("Error sign", error)
        return ""
      }
  
    }
     /**
   * signaturePage
   * @param {options: {url:String, bodyEncoded: strong, bodyJson: Object}}  options
   */
     async buildUrlPage(options) {
      if (!this.pageFetch) throw new Error("Page Fetch not found");
      return await this.buildUrl({page: this.pageFetch, options})
    }
    /**
   * signaturePage
   * @param {options: {url:String, bodyEncoded: strong, bodyJson: Object}}  options
   */
    async buildUrlPageSign(options) {
    if (!this.page) throw new Error("Page Fetch not found");
    return await this.buildUrl({page: this.page, options})
  }
      /**
   * buildUrlPageFull
   * @param {options: {url:String, bodyEncoded: strong, bodyJson: Object}}  options
   */
      async buildUrlPageFull(options) {
        if (!this.page) throw new Error("Page Fetch not found");
        let result =  await this.buildUrlFull({page: this.page, options})
        if( result == "ERROR_SIGN_PAGE")
        return {is_retry: true};
      return result
      }
    /**
   * buildUrl
   * @param {{page, options: {url:String, bodyEncoded: strong, bodyJson: Object}}}  options
   */
    async buildUrl({page, options}) {
    let { url, bodyEncoded, bodyJson} = options;
    if(bodyEncoded &&  !bodyJson){
      options.bodyJson = querystring.encode(bodyEncoded);
    }
    if(bodyJson &&  !bodyEncoded){
      options.bodyEncoded = querystring.stringify(bodyJson);
    }
    if (!page) throw new Error("Page Fetch not found");
    if(!options.timeout){
      options.timeout = 30000
    }
    try {
      return await page.evaluate((args) => {
        return window.buildUrl(args)
      }, options)
    } catch(error){
      console.log("Error buildUrlPage", error)
      return ""
    }

        } 
           /**
   * buildUrl
   * @param {{page, options: {url:String, bodyEncoded: strong, bodyJson: Object}}}  options
   */
    async buildUrlFull({page, options, current}) {
      current = current || 0
      let { url, bodyEncoded, bodyJson} = options;
      if(bodyEncoded &&  !bodyJson){
        options.bodyJson = querystring.encode(bodyEncoded);
      }
      if(bodyJson &&  !bodyEncoded){
        options.bodyEncoded = querystring.stringify(bodyJson);
      }
      if (!page) throw new Error("Page Fetch not found");
      if(!options.timeout){
        options.timeout = 30000
      }
      try {
        return await page.evaluate((args) => {
          return window.buildUrlFull(args)
        }, options)
      } catch(error){
        console.log("Error buildUrlPage", error)
        // current ++;
        // if(current<3){
        //   await delay(1000)
        //   return await this.buildUrlFull({page, options, current})
        // }
        return "ERROR_SIGN_PAGE"
      }
  
          }  
/**
 * fetchPage
 * @param {options: {link: string, cookie: string, body: string, method: string, log: boolean, returnData: boolean, sessionid: string, content_type: string}} options
 */ 
    async fetchPage(options) {
      if (!options.page) throw new Error("Page not found");
      let result =  await options.page.evaluate((args) => {
        return window.imFetch(args)
      }, options)
      return result;
    }



      /**
   * initCookies
   * @param {{cookies: Array, device_id: string}} options
   */
  async initCookiesPage(options) {
    try {
      let { cookies,page } = options
      const client = await page.target().createCDPSession()
      await client.send('Network.clearBrowserCookies')
      if (!page) throw new Error(`Page not found`)
      await  page.setCookie(...cookies)
      return true;
    } catch(error){
      console.log("Error init cookies", error)
      return false
    }
    
  }
}

module.exports = BrowserService
