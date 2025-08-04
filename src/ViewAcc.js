const helper = require("./helper.js")
const fs = require("fs")
const path = require("path")
const config = require("../config_viewer.json");
const Viewer = require("./Viewer.tt2");
let path_proxies =   config.proxy_path || path.resolve("./p.txt");
let path_proxies_json = path.resolve("./proxies_json.json")
let host = config.host || "http://localhost:3000";
let category_source = config.category_source || "tiktok_reg";
let category_move = config.category_move || "tiktok_move";
let category_live_done = config.category_live_done || "tiktok_live_done";

let wait_time = config.wait_time || 5 
let json_data;
const BrowserService = require("./BrowserService.js")


const os = require("os")
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

const userAgentDefault = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/119.0.0.0 Safari/537.36`
const appVersionDefault = userAgentDefault.replace("Mozilla/", "")
class ViewAccs {
    constructor() {

    }

    static async start() {
        try {
            json_data = await require(path_proxies_json);

        } catch(e){
            fs.unlinkSync(path_proxies_json,()=>{})
        }
        try {
            
            if (!fs.existsSync(path_proxies_json)) {
                let proxies = helper.parserAccounts({ acc_string: await helper.strData(path_proxies), getIndex: 0, number_slice: 0, key: ",", number_ignore: 0, format: "proxy", key_format: "|", item_return_type: "proxy" });
                json_data = proxies.map(i => {
                    return { proxy: i, last: 0 }
                })
                await helper.writeFile({ path: path_proxies_json, data:JSON.stringify(json_data) })
            }
            json_data = await require(path_proxies_json);
            ViewAccs.runViewer();
            await helper.delay(5000);
            return await ViewAccs.start();
        } catch(e){
            console.log("error start",e)
            await helper.delay(5000);
            return await ViewAccs.start();
        }
     

    }
    static async getRoom() {
        let proxies = json_data
        let proxy = proxies[helper.getRandomInt(0, proxies.length)]
        let br = await BrowserService.getInstance(userAgentDefault,{ initSign:true})

        let url= `https://webcast.tiktok.com/webcast/feed/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=${browser_platform}&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&channel_id=1111006&cookie_enabled=true&data_collection_enabled=true&device_id=7284943888836822529&device_platform=web_pc&device_type=web_h265&focus_state=false&from_page=live&history_len=3&is_fullscreen=false&is_non_personalized=0&is_page_visible=true&os=mac&priority_region=VN&referer=https%3A%2F%2Fwww.tiktok.com%2Fforyou&region=VN&related_live_tag=League%20of%20Legends&req_from=pc_web_game_sub_feed_refresh&root_referer=https%3A%2F%2Fwww.tiktok.com%2Fforyou&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&webcast_language=vi-VN&msToken=`
        let  { url: targetUrl, xbogus, _signature, bodyEncoded} = await br.buildUrlPageSign({url})
        let target_url = targetUrl
        let cookie_string = "ssid_ucp_v1=1.0.0-KGI3YTdjNTE3ZDRhMjM2MzJjM2QwMzI3MTgzMjI2MmM2NTE5OTJhNjQKIAiFiNnmjcr7kWYQ-tyPsQYYswsgDDD53I-xBjgBQOsHEAMaBm1hbGl2YSIgZWI5MjZmODVhY2NiZTUwOWNlY2E1ODEzMzhmNzFhYzg; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=mxLhpEoMnwpEFHYmHy-SlUzVOtmcoaf4KsZOBfGNisDIww6YvE8YjyqBK8rbhz3VUiRpiIxeFcMg1xDL5PmhmMyM8ktPbR9rJvB0aoZCTF8HIgYDniUfhsac_we8tNLyj3rBiN1T_J8KcSLiSUBrimX_bMmjQMoZK5vq-gyI9oVibkoIaFEeT9-UO5Efeyf4T1RDvcyABSRMk9QWdtrPzd3Jsu6fZsGSczEYVNI63Qf9gAvuBs17LF_GiRoamT7aPZ2VouEGQNErcjAnyh2OGwQ-XlWGPOZwJ2dDTQoySTG_8bdI-53halCf7GDei7o5bEDw-NhPJdFlqiwNsWHnm9gQ5ktsvnIge1d1tLm9L5SS1bmdElS0X8oq962UCOlDwaqtp61IrfvwgKNqFa8n1sUr6rYP3PjuGEeWjThpCEJZ0OEHbtdd-q93Sjfb2W2U0xk0kxdmOU5KeXQGw5W4mZ40y6mmkLTrK9U42Q5arfdvE_b3Vwble2oOGZgn5Gic; tt_chain_token=qlzwxiapaX3OtFUQ9iShiw==; ak_bmsc=4106CDB03B79EA0213F70730D3A31BB5~000000000000000000000000000000~YAAQxb4vF6FhB/yOAQAA9JRb/Bf0TY/KVh5HPvR9OZiWAkOZmznEfoMbjDedDbKiTT0k8tAeQTEiOqkbqd4nkAbM02OABu4VTeEkK8NiifHs4YbyrI/v3jRYmU8AlozYLeplHYS0v1Wmuvpauy8Xj8YwedlyRM4FNEbeXCr2Qs35X/54NhldodhhC52nbYWa9owF2cCnFTJDnqA5hSCtG5PimieOYL3OYc5wrgrYseelE1AqkatobtYHEJpf5ajN/kpFemlgQqMZHywB5BrvpLmoFydGc5wqs4ES+tgUQt3ojuW2OnP24ntRKQ+XbrQzgiGQLltnIpHnsAXezB+Zy7vSUsGRr7O5eDWLDcZ0Ip6cFEY1jp9hfO1OfFqST9MIHEf3Qwh2tt6ZNw==; ttwid=1%7CnW5iLVPjfodxA9UkpNMn-BfdZsMA16CWp7g09nwxFVc%7C1713630850%7Cfba83305a9789983041a22fef62de6d7ad3d2a17eb63a4f39ba29b5c3e4eee09; odin_tt=ed18f7ce1ba197c7f443e28a76fd9408d46671504900218fd5521ff003d3aeb9e0d65a56214e698fd4b7e04cefcefb282e515ae694b0f8c0831119f01fb31caf6ddb869c532f1b239d776bb1af286f2f; "
        let res = await helper.makeRequest({
            proxy: proxy.proxy, url: target_url, headers: {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Cookie': cookie_string,
                    'Origin': 'https://www.tiktok.com',
                    'Referer': 'https://www.tiktok.com',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': userAgentDefault,
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    'x-secsdk-csrf-token': 'DOWNGRADE'
            
            }
        })
        let rooms = []
        if(! res.bodyJson.data) {
            await helper.delay(1000)
            return await ViewAccs.getRoom()
        }
        res.bodyJson.data.forEach(i => {
            rooms.push([i.data.id_str, i.data.owner.display_id, i.data.user_count])
        })
        return rooms[helper.getRandomInt(0, rooms.length)]


    }
    // static async getDataProxies() {
    //     await helper.delay(helper.getRandomInt(1, 10))
    //     while (ViewAccs.status == "processing") {
    //         await helper.delay(100)
    //     }
    //     ViewAccs.status = "processing"
    //     let json_data = await require(path_proxies_json)
    //     ViewAccs.status = "done"

    //     return json_data
    // }
    static async updateDataProxies(data) {
        await helper.writeFile({ path: path_proxies_json, data })
    }
    static async runViewer() {
        let res = await  helper.makeRequest({url: `${host}/api/accounts/getByCategoryV2Move?category=${category_source}&min=${config.min_accounts || 20}&limit=30&category_to=${category_move}`})
       // res [{"_2fa":"","last_get_check_live":"1970-01-01T00:00:00.000Z","time_start":"1970-01-01T00:00:00.000Z","status":1,"created":"2024-07-29T08:55:54.149Z","cookie":"email=b123nh@gmail.com;","password":"ưew","uId":"172224335414919411"}]
 
        let accounts = res.bodyJson;
        if(!accounts.length) return false;
        let proxies = json_data;
        let _proxies =proxies.filter(i=>(i.last+wait_time*60000) < Date.now());
        if(!_proxies.length){
            return;
        }   
    

        let proxy_obj = _proxies[helper.getRandomInt(0, proxies.length)];
        let index = json_data.findIndex(i=>i.proxy == proxy_obj.proxy)
        json_data[index].last = Date.now()
        ViewAccs.updateDataProxies(JSON.stringify(json_data))
        let max_room = (config.max_room || 10)
        for(let i = 0; i <max_room ; i ++){
            let task_id = Date.now() + helper.getRandomInt(1000, 2000)
         
            let _accounts = accounts.map(a=>a.cookie+";proxy="+proxy_obj.proxy+";");
            let [room, owner, user_count] = await ViewAccs.getRoom()
            console.log("Owner", owner, "user_count",user_count)
            if(room) {
                Viewer.startViewers({accounts:_accounts, task_id: task_id, room_id: room})
                await helper.delay((config.live_in_time || 10)* 60000)
                Viewer.stopViewers({ task_id:  task_id})
            }
            if(i!== (max_room -1)) {
                await helper.delay((config.wait_time||5)* 60000)
            }
        }
        const options = {method: "POST",url: `${host}/api/accounts/move-to-category?category_to=${category_live_done}`,body:JSON.stringify( {accounts: accounts.map(i=>i.uId), category_to: category_live_done}), headers: {  'accept': '*/*',
            'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7',
            'cache-control': 'no-cache',
            'content-type': 'application/json',
            'dnt': '1',}}
        let resp = await helper.makeRequest(options)
    }
}
module.exports = ViewAccs