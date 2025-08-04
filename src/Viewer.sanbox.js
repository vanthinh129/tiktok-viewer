const helper = require("./helper.js")
const Clone = require("./Clone.sanbox.js")
const path = require('path')
const RabbitMQ = require(path.resolve("RabbitMQ.lib"))
const data = {}
let data_local = {}
let list_403_total = []
let list_die_total = []
let intervalcheck;
let is_running = true
class GroupView {
    constructor(){
    }
    static setdatelocal(key, value){
        data_local[key] = value
    }
    static getdatelocal(key){
        // console.log("getdatelocal", key, data_local[key])
        return data_local[key]
    }
    static async checkViewer403(){
        while(is_running){
            await helper.delay(20000);
            try{
                let total = 0;
                let fetch_403 = 0
                let list_403 = []
                let list_die = []
                for(let i in data){
                    let sockets = data[i].sockets
                    // console.log("sockets", sockets.length)
                    sockets.forEach(item=>{
                        // console.log(item.username, item.session_id,item.status_viewer)
                        total++;
                        if(item.status_viewer == 4 && !list_403_total.includes(item.session_id)){
                            list_403.push(item.session_id)
                            list_403_total.push(item.session_id)
                            fetch_403++;
                        }
                        if(item.status_viewer == 3 && !list_die_total.includes(item.session_id)){
                            // console.log("die",item.username, item.session_id)
                            list_die.push(item.session_id)
                            list_die_total.push(item.session_id)
                        }
                    })
                }
                if(list_403.length > 0){
                    console.log("list_403", list_403.length)
                    await GroupView.send403Rabbit(list_403,"update_account_403")
                }
                if(list_die.length > 0){
                    console.log("list_die", list_die.length)
                    await GroupView.send403Rabbit(list_die,"update_account_die")
                }
            }catch(e){
                console.log("checkViewer403 error", e)
            }
        }
    }
    static async removeViewer(socket){

    }
    static startProxyGroupViewers({accounts, task_id, proxy, room_id, ex_wrss,}) {
        try{
            
                accounts.forEach(async (i, index )=>{
                // await helper.delay(index*1000)
                let p = helper.getString(i+";", "proxy=",";")
                if(p && proxy){
                    i = i.replace("proxy="+p,"")
                    i += ";proxy="+proxy;
                }
                let proxy_list = [  p]
                let clone = new Clone({cookie_string: i, room_id, proxy: proxy || p, proxy_list, server_site:data_local.server_site})
                clone.run()
                // let config_data = { cookie_string: i, proxy_string: proxy || p, useragent: helper.genuaMAC(),rooms: {}, task_id,server_site: "tt1", isShowLog:  false, clone, ex_wrss, wrss_obejct}
                // let socket = new TiktokSocketAuto(config_data)

                // socket.connect({ room_id})
                data[task_id].sockets = [...data[task_id].sockets , clone]
            })
        }catch(e){
            console.log("startProxyGroupViewers error",e,(new Date().toLocaleString()))
        }
        GroupView.checkViewer403();
       
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
                GroupView.startProxyGroupViewers({accounts:grouped_proxy[i] , task_id, proxy, room_id})
            }
        }catch(e){
            console.log("startViewers error",e,(new Date().toLocaleString()))
        }
        
    }
    static async updateProxy({data_proxy}){
        try{
            for(let task_id in data){
                if(data[task_id]){
                    let sockets = data[task_id].sockets
                    for(let i = 0 ; i< sockets.length; i ++){
                        if(sockets[i].status == "running"){
                            let p = helper.getString(sockets[i].cookie_string+";", "proxy=",";")
                            if(p && data_proxy[p]){
                                sockets[i].proxy = data_proxy[p]
                                sockets[i].proxy_list = [data_proxy[p]]
                            }
                        }
                        
                    }
                }
            }
        }catch(e){
            console.log("updateProxy error",e,(new Date().toLocaleString()))
        }
    }
    static async stopViewers({ task_id}){
        is_running = false
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
    static async send403Rabbit(list_403,action = "update_account_403"){
        // "update_account_403"
        try {
            let rabbitService = await RabbitMQ.getInstance({url: "amqp://bupmat:bupmat@185.190.140.88:5672/"+data_local.server_site+"?heartbeat=60"});
            if(list_403.length){
                let message = {"action": action, "accounts":list_403, time_now: Date.now()}
                await rabbitService.sendMessage("rabbit_cron", message)
            }
        } catch(error){
            console.log("error handleSendRabbit", error)
        }
    
    } 

}
GroupView.data = data
module.exports = GroupView