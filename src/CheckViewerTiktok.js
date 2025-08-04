const helper = require("./helper.js")
const fs = require("fs")
const path = require("path")
const config = require("../config_check_viewer.json");
const Viewer = require("./Viewer.tt2");
let path_proxies =  config.proxy_path || path.resolve("./p.txt");
let host = config.host || "http://localhost:3000";
let category_source = config.category_source || "tiktok_live_done";
let category_move = config.category_move || "tiktok_temp";
let category_check_done = config.category_check_done || "tiktok_check_done";
let category_check_fail = config.category_check_fail || "tiktok_check_fail";

const CheckViewer = require("./CheckViewer");

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
            
            
                let proxies = helper.parserAccounts({ acc_string: await helper.strData(path_proxies), getIndex: 0, number_slice: 0, key: ",", number_ignore: 0, format: "proxy", key_format: "|", item_return_type: "proxy" });
                json_data = proxies.map(i => {
                    return { proxy: i, last: 0 }
                })
                json_data = proxies
            
            await ViewAccs.runViewer();
            await helper.delay(5000);
            return await ViewAccs.start();
        } catch(e){
            console.log("error start",e)
            await helper.delay(5000);
            return await ViewAccs.start();
        }
     

    }
    static async runViewer(){
        let res = await helper.makeRequest({url: "https://tt1.fbvideoview.com/api/tiktok/getroomid?authensone=mysonetrend&is_reel=0,1&sort=-complete_time&limit=15000&status=4&delivery_count=40000&view_type=10"})
        let room_ids = res.bodyJson
        room_ids = room_ids.map(i => i._id)
        for (var i = 0; i < 3; i++) {
          room_ids = room_ids.concat(room_ids)
        }
        let res1 = await  helper.makeRequest({url: `${host}/api/accounts/getByCategoryV2Move?category=${category_source}&min=${config.min_accounts || 20}&limit=${json_data.length}&category_to=${category_move}`})
        let accounts = res1.bodyJson;
        if(!accounts.length) return false;

        let accs_fails = [];
        let accs_done = []
        const newRoom = () => {
          return room_ids.pop()
        }
        async function checkViewer(data) {
            let checkViewer = new CheckViewer(data);
          
            let value = await checkViewer.check({ room_id: data.room_id })
            let { isViewer } = value;
            if (isViewer) {
                accs_done.push(data.info.uId)
            } else {
                accs_fails.push(data.info.uId)

            }
        
          }
          let promises = []
          const shuffle = (array) => {
            for (let i = array.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [array[i], array[j]] = [array[j], array[i]];
            }
            return array;
          };
          json_data = shuffle(json_data)
        for(let i = 0 ; i <accounts.length; i ++){
            let proxy_string = json_data[i]
            accounts[i].cookie_string += ";proxy=" + proxy_string;
          
       
          let data = { username: accounts[i].uId, cookie_string: accounts[i].cookie, proxy_string, 
          room_id: room_ids[i]
          , timeout: 60000, newRoom, info: accounts[i] };
          promises.push(checkViewer(data))
        }
        let results = await Promise.allSettled(promises)

        if(accs_done.length){
            const options = {method: "POST",url: `${host}/api/accounts/move-to-category?category_to=${category_check_done}`,body:JSON.stringify( {accounts: accs_done, category_to: category_check_done}), headers: {  'accept': '*/*',
                'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'dnt': '1',}}
            let resp = await helper.makeRequest(options)
            console.log(`Moved ${accs_done.length} accounts to ${category_check_done}`)
        }
        if(accs_fails.length){
            const options = {method: "POST",url: `${host}/api/accounts/move-to-category?category_to=${category_check_fail}`,body:JSON.stringify( {accounts: accs_fails, category_to: category_check_fail}), headers: {  'accept': '*/*',
                'accept-language': 'vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7',
                'cache-control': 'no-cache',
                'content-type': 'application/json',
                'dnt': '1',}}

            let resp = await helper.makeRequest(options)
            console.log(`Moved ${accs_fails.length} accounts to ${category_check_fail}`)

        }



    }



}
module.exports = ViewAccs