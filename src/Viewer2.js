const helper = require("./helper.js")
// const TiktokSocketAuto = require("./tiktok.socket.auto.thinh1.js")
const TiktokSocketAuto = require("./tiktok.socket.auto.tt2.js")
const Clone = require("./Clone.js")
const data = {

}
let wrss_obejct = {
    wrss: ""
}
let clones_obejct = {

}
let interval = setInterval(()=>{
    let total = 0;
    let non_101 = 0;
    let fetch_403 = 0
    let connected = 0 
    for(let i in data){
        let sockets = data[i].sockets
        sockets.forEach(item=>{
            total++;
            if(item.is_101){
                non_101++
            }
            if(item.clone && item.clone.fetch_403){
                fetch_403++;
            }
            if(item.socketConnected){
                connected++;
            }
            
        })
    }
    console.log((new Date().toLocaleString()),  "total", total, "non_101", non_101, "fetch_403", fetch_403, "connected",connected)
},20000)
class GroupView {

    constructor(){

    }
    static async removeViewer(socket){

    }
    static async fetchInterval(account, room){
        clones_obejct[room] = clones_obejct[room] ? [...clones_obejct[room] , account] : [account];
        async function getRoomWrss  (){
            let acc = clones_obejct[room][helper.getRandomInt(0,clones_obejct[room].length-1 )]
            let clone =  acc.clone;
            await clone.fetch()
            if(clone.wrss ){
                clone.fetch_wrss = clone.wrss
                wrss_obejct[room] = { ... wrss_obejct[room], wrss: clone.wrss }

                console.log("Set wrss", clone.wrss ,clone.wrss[21])
            } else {
                return await getRoomWrss();
            }
        }
      
        if(!wrss_obejct[room] || !wrss_obejct[room].interval){
            wrss_obejct[room] = { ... wrss_obejct[room], interval: true}

            await getRoomWrss()
            let interval = setInterval(()=>{
                getRoomWrss()
            },4 * 60 * 1000)
            wrss_obejct[room] = { ... wrss_obejct[room], interval}
        }

    }
    static async getGoProxies ({accounts, quantity,  max_account_go, tokens, country_code}){
        let proxies = [];
        let total_proxy = Math.ceil((accounts.length)/max_account_go)
        tokens = tokens || []
    
        for(let i = 0 ; i < (quantity || total_proxy); i ++){
            let proxy_string = helper.getString(accounts[helper.getRandomInt(0 , accounts.length)]+";", "proxy=",";")
            let token = tokens[helper.getRandomInt(0 , tokens.length)]
            let options = {
                method: "POST",
            url : "https://api.gologin.com/users-proxies/mobile-proxy",
                headers : {
                    "Authorization": "Bearer " + token,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    "browserId": "",
                    "countryCode": country_code || "us",
                    "isDC": true,
                    "isMobile": false
                }),
                proxy: proxy_string
            
        }
            let result = await helper.makeRequest(options)
            let proxyInfo =  result.bodyJson
            if(proxyInfo.username) {
                let proxy = `http://${proxyInfo.username}:${proxyInfo.password}@${proxyInfo.host}:${proxyInfo.port}`
                proxies.push(proxy)
            }
         
        }
        return proxies
    }
    static async startViewers({accounts, task_id, proxy, room_id, ex_wrss, tokens}) {
        try{
            let total = 0 
            console.log("Start task_id:",task_id, " room:", room_id," accounts:", accounts.length)
            data[task_id] = { sockets: []};
            let max_account_go = 10;

                let proxies = [];//await GroupView.getGoProxies({accounts, max_account_go, tokens})
                // console.log(proxies);
                accounts.forEach(async (i, index )=>{
                await helper.delay(index*20000)
                let _index = Math.floor(index/max_account_go);
                let p = helper.getString(i+";", "proxy=",";")
                if(p && proxy){
                    i = i.replace("proxy="+p,"")
                    i += ";proxy="+proxy;
                }
                let proxy_list = [   proxy || p]
                 let clone = new Clone({cookie_string: i, room_id, proxy:  proxies[_index] || proxy || p, proxy_list})
                let config_data = { cookie_string: i, proxy_string: proxy || p, useragent: helper.genuaMAC(),rooms: {}, task_id,server_site: "tt1", isShowLog:  false, clone, ex_wrss, wrss_obejct, force_fetch: total<30}
                total ++
                // GroupFetch.addClone({clone})
                let socket = new TiktokSocketAuto(config_data)
                // await GroupView.fetchInterval(socket, room_id)

                socket.connect({ room_id})
                data[task_id].sockets = [...data[task_id].sockets , socket]
            })
        }catch(e){
            console.log("startViewers error",e,(new Date().toLocaleString()))
        }
        
    }
    static async stopViewers({ task_id}){
        console.log("Stop -- task_id:",task_id)
        try{
            for(let i = 0 ; i< data[task_id].sockets.length; i ++){
                data[task_id].sockets[i].cancel();
            }
            data[task_id].sockets = [];
        }catch(e){
            console.log("stopViewers error",e,(new Date().toLocaleString()))
        }
        
    }   
}
GroupView.data = data
module.exports = GroupView