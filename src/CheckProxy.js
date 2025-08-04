

let { delay, subArray, splice, parserCookieString, getDataSite,getDataCron, getString,strData, getDataProxyCron, parserProxyString } = require("./helper");
const path = require("path")
const request = require("request")
const fs = require("fs");
const helper = require("./helper");
const RabbitMQ = require(path.resolve("tiktok_rabbit"))

class CheckProxy {

    constructor({ server_ip,server_site }) {
        this.server_ip =  server_ip
        this.server_site = server_site
    }
    async process(){
        if(!this.running){
            this.running = true;
            let is_run =  true;
            while(is_run){
                const { interval_check_proxy, is_check_proxy } = require(path.resolve('./data/config.v5.json'))
                try {
                    if(is_check_proxy){
                        await  this.runCheck();

                    }

                } catch(err) {
                    console.log("error runcheck", err )
                }
               await delay((interval_check_proxy || 15) * 60 * 1000)
            }
        }
     

    }

    async runCheck(){ 
        let data = await  getDataProxyCron(this.server_ip);
        let data_json = {proxy: "", accounts: []};
        try {
            data_json = JSON.parse(data)
        } catch(error) {
            console.log("error paser data", error)
        }
        console.log((new Date().toLocaleString()),"start check")
        let proxies = (data_json.proxy || "").split(",")
        let obejct = await  this.checkAccs({accounts: data_json.accounts, proxies: proxies})

        let message =   {"action": "update_proxy_ip", data_proxy: obejct,   cron_name:`${this.server_ip.replace("Cron_0","").replace("Cron_","")}`}

        try {
            let rabbitService = await RabbitMQ.getInstance({url: "amqp://bupmat:bupmat@185.190.140.88:5672/"+(this.server_site || "tt1")});
            await rabbitService.sendMessage("rabbit_cron",message )
            

        } catch(error){
            console.log("error sendCheck", error)
        }

    }
    async checkAccs({ proxies}) {
        try {
            let obejct = {}
            if(proxies && proxies.length){
                for(let i = 0 ; i < proxies.length ; i ++){
                    let prox = proxies[i];
                    let result  = await this.checkAcc({ proxy: prox})
                    obejct = { ...obejct, [result.id]: result.ip || -1} 

                }

            }
            return obejct

        } catch(er){
            console.log("Error checkAccs", er)
            return false;
        }
        
    }
    async checkAcc({proxy, retryCount}){
        let retry = retryCount || 0
        let that = this;

            let list = ["https://api.ipify.org?format=json",
            "https://api.myip.com",
            "https://api.seeip.org/jsonip",  'http://amazingcpanel.com/api/cron/myip?authensone=mysonetrend', "https://jsonip.com"]
            let random =  (max, min)=> {
                return   Math.floor(Math.random() * (max - min) ) + min;
        
            }
            let link = list[random(list.length-1, 0)] || "https://jsonip.com"
            var url = link
            let options = {
                url: decodeURI(url),
                timeout: 10000,
                retryTime: 2,
                proxy
            }

            let result = await helper.makeRequest(options)
            return ({id: proxy, ip: result.bodyJson.ip})


    }
    //
  /**
     * init
     * @param {{ops:{ server_ip:string,server_site:string}}} ops
     */
    static async init(ops) {
        if(!CheckProxy.instance){
            let ins = new CheckProxy(ops);
            ins.process();
            CheckProxy.instance = ins;
        }
    }

}
module.exports = CheckProxy