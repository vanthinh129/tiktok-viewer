const helper = require("./helper")
const TiktokSocketAuto = require("./tiktok.socket.auto.js")
const RoomServices = require("./RoomServices.js")
const data = {

}
class GroupView {
    constructor({cookies, proxies, acc_per_proxy}){
        this.cookies = cookies;
        this.proxies = proxies;
        this.acc_per_proxy = acc_per_proxy;
    }
    async process(){
        this.roomServices = new RoomServices({proxies: this.proxies});
        let room_id = await this.roomServices.getRoomId();
        this.roomServices.onChangeRoom(async (room_id)=>{
            await this.restartViewers(this.roomServices.old_room_id);
            await this.startViewers(this.roomServices.room_id);
        })
        await this.startViewers(room_id);
    }
    async startViewers(room_id) {
        let splice_accounts = helper.splice(this.cookies,this.acc_per_proxy);
        for(let index = 0 ; index < splice_accounts.length; index ++ ){
            let accounts = splice_accounts[index];
            let proxy = this.proxies[index];
            // let p = "http://babalili121415-zone-resi-region-vn-session-"+helper.generateRandomHex(12)+"-5:Tabdajkhsdf13235@b35301d43d682c1a.xuw.as.pyproxy.io:16666"
            // p = "";
            data[room_id] = { sockets: []};
            accounts.forEach(async i=>{
                if(proxy){
                    i += ";proxy="+proxy;
                }
                // let proxy_string =  parserProxyString(proxy)
                let config_data = { cookie_string: i, proxy_string: proxy, useragent: helper.genuaMAC(),rooms: {}, task_id: 1,server_site: "tt1", isShowLog:  false}
                let socket = new TiktokSocketAuto(config_data)
                socket.connect({ room_id})
                data[room_id].sockets = [...data[room_id].sockets , socket]
            })

        }
    }
    async restartViewers(room_id){
        console.log("Stop -- room:",room_id)
        for(let i = 0 ; i< data[room_id].sockets.length; i ++){
            data[room_id].sockets[i].cancel();
        }
        data[room_id].sockets = [];
    }   
}
module.exports = GroupView