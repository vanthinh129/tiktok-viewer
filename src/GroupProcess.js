

let { delay, subArray, splice, parserCookieString, parserProxyString ,clearCacheForFile, getString} = require("./helper.js");
const path = require("path")
const Proccess = require("./Process.js")
let status = "";
let Object_Data = { proxy: {},
    processes: []}

const assert = require('assert');
const { type } = require("os");

process.on('uncaughtException', (error) => {
    if (error instanceof assert.AssertionError) {
      console.error('Assertion Error:', error.message);
      // Handle the AssertionError, but don't let it propagate to the top level
    } else {
      // Handle other types of errors
      console.error('Unexpected Error:', error);
    }
  });
class GroupProcess {

    constructor() {

    }
    static async run({ accounts, task_id, proxystring, video_id, key, number_id, server_ip,timestamp, proxy_data, server_site , key_proxy,proxy_pup}) {
        while(status == "processing") {
            await delay(100)
        }
        accounts = accounts  || ""

        status = "processing"
        proxystring =  proxystring || ""
        if (typeof accounts == "string") {
            let accs = accounts.split(key || ",");
            accounts = accs.filter(i=>i.trim())
        }
      
        let groups = accounts.reduce((pre, cur)=>{
            let proxy = getString(cur + ';', 'proxy=', ';');
            cur= cur.replace(`proxy=${proxy}`,"")
            return pre[proxy]? {...pre, [proxy]: [...pre[proxy], cur]}: {...pre, [proxy]:[cur]};
        },{});
        let processes = Object_Data.processes;
        processes = processes.filter(i=> (!i.closed) || !i.accounts.length)
        if (processes.length) {
            for (let pup of processes) {
                if ( groups[pup.proxyServer]  ) {
                    pup.addAccounts({ accounts: groups[pup.proxyServer], task_id, video_id, proxyServer: pup.proxyServer });
                    delete groups[pup.proxyServer]
                }
            }
        }
        for(let key in groups){
            let accounts = groups[key];
            Proccess.init({ proxyServer: key, accounts, video_id,task_id, number_id,server_ip, timestamp, proxy_data, server_site, proxy_pup}).then(proc=>{
                Object_Data.processes.push(proc)

            })
        }
        // setInterval(async function(){
        //     // Proccess.check101();
        //     let number_101 = 0
        //     if (Object_Data.processes.length) {
        //         for (let pup of Object_Data["processes"]) {
        //             if (pup.rooms && pup.rooms[task_id]) {
        //                 number_101 += await pup.check101({task_id})
                        
        //             }
        //         }
        //     }
        //     console.log('number_101',number_101)
        // }, 30000)
        status = "done"
    }
    static getProxy(list_proxy){
     
        let list_used_proxy =[];
         Object_Data.processes.forEach(item=>{
            if(item.accounts.length){
                list_used_proxy.push(item.proxyServer)
            }
        })
        let index = list_proxy.findIndex(i =>!list_used_proxy.includes(i))
        if(index!= -1){
            return list_proxy[index]
        }
        return ""

    }
    static async action({ task_id, action }) {
        console.log(action," task:", task_id)

        if (action == "resume") action = "running"
        if (Object_Data.processes.length) {
            for (let pup of Object_Data["processes"]) {
                if (pup.rooms && pup.rooms[task_id]) {
                    pup.action({task_id, type: action})
                    
                }
            }
        }
    }
    static async check101({ task_id }) {
        let number_101 = []
        if (Object_Data.processes.length) {
            for (let pup of Object_Data["processes"]) {
                if (pup.rooms && pup.rooms[task_id]) {
                    number_101 = number_101.concat(await pup.check101({task_id}))
                    
                }
            }
        }
        return number_101;
    }

}
module.exports = GroupProcess