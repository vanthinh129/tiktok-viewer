const helper = require("./helper.js")
const TiktokSocketAuto = require("./tiktok.socket.auto2.js")
const data = {

}
class GroupView {

    constructor(){

    }
  
    static async startViewers({accounts, task_id, proxy, room_id}) {
        try{
            console.log("Start task_id:",task_id, " room:", room_id," accounts:", accounts.length)
            data[task_id] = { sockets: []};
            accounts.forEach(async (i, index )=>{
                await helper.delay(index*10000)
                // await helper.delay(index*100)
                let p = helper.getString(i+";", "proxy=",";")
                if(p && proxy){
                    i = i.replace("proxy="+p,"")
                    i += ";proxy="+proxy;
                }
                let config_data = { cookie_string: i, proxy_string: proxy || p, useragent: helper.genuaMAC(),rooms: {}, task_id,server_site: "tt1", isShowLog:  false}
                let socket = new TiktokSocketAuto(config_data)
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