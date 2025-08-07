const helper = require("./helper.js")
const TiktokSocketAuto = require("./socket.js")
// const GroupFetch = require("./GroupFetch.js")
const Clone = require("./Clone3.js")
const { head } = require("request")
const data = {

}
let wrss_obejct = {
    wrss: ""
}
let clones_obejct = {

}
// let interval = setInterval(async ()=>{
//     let total = 0;
//     let non_101 = 0;
//     let fetch_403 = 0
//     let connected = 0 
//     let list_403 = []
//     for(let i in data){
//         let total = 0;
//         let non_101 = 0;
//         let fetch_403 = 0
//         let connected = 0 
//         let success = 0
//         let sockets = data[i].sockets
//         sockets.forEach(item=>{
//             total++;
//             if(item.is_101){
//                 non_101++
//             }
//             if(item.clone && item.clone.fetch_403){
//                 try{

//                     let cookie_string = item.clone.cookie_string
//                     let session_id = helper.getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
//                     list_403.push(session_id)
//                 }catch(e){

//                 }
//                 fetch_403++;
//             }
//             if(item.socketConnected){
//                 connected++;
//             }

//             if(item.logged){
//                 success++;
//             }
            
//         })
//         if(total == 0){
//             delete data[i]
//         }
        
//         console.log(i,(new Date().toLocaleString()),  "total", total, "non_101", non_101, "fetch_403", fetch_403, "connected",connected, "success",success)

//     }
//     // await helper.writeFile({path:'./101.txt', data:list_403.join(',')})
//     // console.log((new Date().toLocaleString()),  "total", total, "non_101", non_101, "fetch_403", fetch_403, "connected",connected)
// },20000)
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
        return proxies
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
                // console.log("res",result.bodyJson)
                proxies.push(proxy)
            }
         
        }
        return proxies
    }
    static startProxyGroupViewers({accounts, task_id, proxy, room_id, ex_wrss,}) {
        try{
            
                accounts.forEach(async (i, index )=>{
                // await helper.delay(index*6000)
                let p = helper.getString(i+";", "proxy=",";")
                if(p && proxy){
                    i = i.replace("proxy="+p,"")
                    i += ";proxy="+proxy;
                }
                let proxy_list = [  p]
                 let clone = new Clone({cookie_string: i, room_id, proxy:  proxy || p, proxy_list})
                let config_data = { cookie_string: i, proxy_string: proxy || p, useragent: helper.genuaMAC(),rooms: {}, task_id,server_site: "tt1", isShowLog:  false, clone, ex_wrss, wrss_obejct}
                let socket = new TiktokSocketAuto(config_data)
                // console.log("Start socket", index, (new Date().toLocaleString()))
                socket.connect({ room_id})

                if(!data[task_id]){
                    data[task_id] = {}
                }
                if(!data[task_id].sockets){
                    data[task_id].sockets = []
                }
                data[task_id].sockets = [...data[task_id].sockets , socket]
            })
        }catch(e){
            console.log("startProxyGroupViewers error",e,(new Date().toLocaleString()))
        }
    }
    static async startViewers({accounts, task_id, proxy, room_id, ex_wrss, tokens}) {
        try{
            let total = 0 
            console.log("Start task_id:",task_id, " room:", room_id," accounts:", accounts.length)
            data[task_id] = { sockets: []};
            let grouped_proxy = accounts.reduce((pre,cur)=>{
                let p = helper.getString(cur+";", "proxy=",";")
                return {...pre, [p]: pre[p] ? [...pre[p], cur]: [cur]}
            },{})
            for(let i in grouped_proxy){
                let adn = await helper.getLocationProxy(i)
                console.log("Start group", i, adn)
                GroupView.startProxyGroupViewers({accounts:grouped_proxy[i] , task_id, proxy, room_id})
            }
        }catch(e){
            console.log("startViewers error",e,(new Date().toLocaleString()))
        }
        
    }
    static async stopViewers({ task_id}){
        console.log("Stop -- task_id:",task_id)
        try{
            if(data[task_id]){
                for(let i = 0 ; i< data[task_id].sockets.length; i ++){
                    data[task_id].sockets[i].cancel();
                }
                data[task_id].sockets = [];
            }
            
        }catch(e){
            console.log("stopViewers error",e,(new Date().toLocaleString()))
        }
        
    }   
}
GroupView.data = data
module.exports = GroupView