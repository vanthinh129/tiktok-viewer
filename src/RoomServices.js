let data = {
    rooms: {},
    arr_room: []
}
const helper = require("./helper")

class RoomServices {
    constructor({proxies}){
        this.proxies = proxies
    }
    async actionChangeRoom(){
        try {
            console.log("Change room action")
            await this.fn(this.room_id);
        } catch(e){
            console.log("error onChangeRoom:", e)
        }
    }
    async onChangeRoom(fn){
        try {
            this.fn = fn;
        } catch(e){
            console.log("error onChangeRoom:", e)
        }
    }
    async getRoomId(){
        let rs = await getLives(3, "", "");
        rs = [
              {
    user_count: 77,
    status: 2,
    room_id: '7393196424822901520',
    display_id: 'm.bm.3con'
  },
        ]
        let index = rs.findIndex(i=>{
            let is_under_50 = i.user_count <=20;
            let is_avail = data.arr_room.findIndex(j=>j == i.room_id) == -1;
            return is_avail && is_under_50;
        })
        console.log(rs,index)
        if(index!=-1){
            this.old_room_id =   this.room_id
            this.room = rs[index];
            this.room_id = rs[index].room_id;
            data.rooms[this.room_id] = true;
            data.arr_room.push(this.room_id);
            let proxy = "";

            if(this.proxies){
                let p = this.proxies[helper.getRandomInt(0, this.proxies.length -1)];
                proxy = p;
            }
            let res = await helper.getRoomInfo({room_id: this.room_id,proxy: helper.parserProxyString(this.proxy || proxy)});
            this.room.start = res.view_count;
            this.intervalCheck()
            let log = `room: ${this.room.room_id} name: ${this.room.display_id} start:${this.room.start}`
            console.log("New --", log)
            return  this.room_id
        } else {
            return await this.getRoomId();
        }
    }
    
    async intervalCheck (key){
        if(this.key && this.key !== key) return; 
        if(!this.key){
            this.key = Date.now()
        }
        try {
            let proxy = "";
            if(this.proxies){
                let p = this.proxies[helper.getRandomInt(0, this.proxies.length -1)];
                proxy = p;
            }
            let res = await helper.getRoomInfo({room_id: this.room_id,proxies: this.proxies,proxy: helper.parserProxyString(this.proxy || proxy)});
            let log  = `${this.room.display_id} room: ${this.room_id} start: ${this.room.start} now: ${res.view_count} alive: ${res.is_alive}`
            console.log(helper.getTime(),"Info -- ",log);
            if(res.display_id && !res.err && !res.is_alive){
                await this.getRoomId();
                let old_room_id = this.old_room_id;
                let log  = `room: ${old_room_id} to: ${this.room_id}`
                console.log("Change -- ",log);
                await this.actionChangeRoom()
            }
            await helper.delay(5000);
            return await this.intervalCheck(this.key)
        } catch(e){
            console.log("error intervalCheck",e)
            await helper.delay(30000);
            return await this.intervalCheck(this.key)
        } 

    }
}
let getLives = async(time, proxy, session_id) =>{

    let get = async (session_id, time, cookie) => {
        let r = {};
        let res = await helper.makeRequest({ proxy, url: `https://webcast.tiktok.com/webcast/feed/?WebIdLastTime=1696158187&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F124.0.0.0%20Safari%2F537.36&channel=tiktok_web&channel_id=42&content_type=0&cookie_enabled=true&device_id=7284943888836822529&device_platform=web_pc&device_type=web_h265&focus_state=false&from_page=user&hidden_banner=true&history_len=4&is_fullscreen=false&is_non_personalized=0&is_page_visible=true&max_time=0&os=mac&priority_region=VN&referer=https%3A%2F%2Fwww.tiktok.com%2Fforyou%3Fis_copy_url%3D1%26is_from_webapp%3Dv1&region=VN&req_from=${time!= 0 ? "pc_web_recommend_room_loadmore": "pc_web_suggested_host"}&root_referer=https%3A%2F%2Fwww.tiktok.com%2Fforyou%3Fis_copy_url%3D1%26is_from_webapp%3Dv1&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=vi-VN&msToken=USMKKBCI0iM-nMzGpZcG8I7CwE6HQCJAEep7w_pRFRtOsF3AxSkqmyVG7WKz8PXrbuj4ggDwPiKVfJEjJIPXxWiqSYwagKSR06UT5NoSIwTm17yNHHtp6zzKm1apZzL5pqUpOiA=&X-Bogus=DFSzswVu6vxANjM/t2H2fcRXoRMv&_signature=_02B4Z6wo00001GmqqtwAAIDBh49uIXe7E.Rpqq5AAHxLab`, headers: {
            cookie: cookie || `sessionid=${session_id}`
        } })
        if (res.bodyJson && res.bodyJson.data) {
            res.bodyJson.data.forEach(i => {
                r[i.data.owner.display_id] = { user_count: i.data.user_count, status: i.data.status, room_id: i.data.id_str,display_id:i.data.owner.display_id   }
            })
        }
        let cookie_str = (res.headers["set-cookie"] || []).map(i=>{ let c = i.split(";"); return c[0] +";"}).join(";")
        r.cookie = cookie_str;
        return r
    }
    let results = []
    let cookie = "";
    for (i = 0; i < time; i++){
        let res = await get(session_id, i,cookie)
        cookie = res.cookie;
        await helper.delay(10)
        results.push(res)
    } 
    let obejct = {};
    for (item of results) {
        obejct = { ...obejct, ...item }
    }
    let rs = [];
    for(let key in obejct){
        rs.push(obejct[key])
    }
    return rs;

}
module.exports =RoomServices