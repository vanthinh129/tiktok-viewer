const fs = require("fs");
const path = require("path")
const v8 = require("v8")
const { JSDOM, ResourceLoader } = require("jsdom");
const { createCipheriv } = require("crypto");
const querystring = require("querystring")
const Request = require("request")
let DEFAULT_USERAGENT =
"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36";
let PASSWORD = "webapp1.0+202106";
class Signer {

  /**
   * @type Window
   */
  window 
  static getInstance(userAgent){
    if(!Signer.instance){
      let ins = new Signer(userAgent);
      Signer.instance = ins;
    }
    return Signer.instance
  }
  constructor(userAgent = Signer.DEFAULT_USERAGENT) {

    this.webmssdk = fs.readFileSync(path.resolve( "./src/webmssdk.js"), "utf-8");
    this.initjs = fs.readFileSync( path.resolve( "./src/./init.js"), "utf-8");
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
    this.userAgent = this.window.navigator.userAgent;
    this.appVersion =  this.userAgent.replace("'Mozilla/","")
    this.window.CanvasRenderingContext2D = {}
    this.window.Request = Request
    this.window.eval(this.webmssdk.toString());
    this.window.eval(this.initjs.toString())

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
   * @param {options: {url:String, bodyEncoded: strong, bodyJson: Object}}  options
   */
  buildUrlPageSign(options) {
    this.window.CanvasRenderingContext2D = {}
    this.window.Request = Request
    this.window.eval(this.webmssdk.toString());
    this.window.eval(this.initjs.toString())
    let { url, bodyEncoded, bodyJson } = options;

        if(bodyEncoded &&  !bodyJson){
          options.bodyJson = querystring.encode(bodyEncoded);
        }
        if(bodyJson &&  !bodyEncoded){
          options.bodyEncoded = querystring.stringify(bodyJson);
        }
        try {
          let result = this.window.buildUrl(options)

          return  result
    
        } catch(error){
          console.log("Error buildUrlPage", error)
          return ""
        }
    
    }  
}

module.exports = Signer;
