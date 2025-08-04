const TikTokSocket = require("./tiktok.socket")
const helper = require("./helper")
const userAgentDefault =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';
const browserVersionDefault = userAgentDefault.replace("Mozilla/", "");
const querystring = require("querystring")
class CheckViewer {
    constructor(data) {
        let { cookie_string, proxy_string, username, newRoom, timeout } = data;
        this.timeout = timeout
        this.cookie_string = cookie_string;
        this.newRoom = newRoom;
        this.uniqueId = username || helper.getString(this.cookie_string + ";", "username=", ";")
        this.proxy_string = proxy_string || helper.getString(this.cookie_string + ";", "proxy=", ";")
        this.msToken = helper.getString(this.cookie_string + ";", "msToken=", ";")
        this.sessionid = helper.getString(this.cookie_string + ";", "sessionid=", ";");
        this.cookie_string = this.cookie_string.replace(`proxy=${this.proxy_string}`, "").replace(`username=${this.username}`, "")
        this.checkRoomTime = 0

    }
    // async getInfo() {
    //     console.log(await helper.makeRequest({url: "https://ipinfo.io/", proxy: this.proxy_string , name: "ip"}))
    //     let res = await helper.makeRequest({
    //         proxy: this.proxy_string,
    //         name: this.sessionid,
    //         isRetry: true,
    //         preCheckRetry: (body)=>{
    //             if(!body) return true;
    //             let uniqueId = helper.getString((body || ""), `uniqueId":"`, `"`);
    //             if(!uniqueId) return true
    //         },
    //         url: "https://www.tiktok.com/setting", "headers": {
    //             "cookie": this.cookie_string,
    //             // "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
    //             // "accept-language": "en-US,en;q=0.9",
    //             // "cache-control": "max-age=0",
    //             // "priority": "u=0, i",
    //             // "sec-ch-ua": "\"Chromium\";v=\"124\", \"Google Chrome\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
    //             // "sec-ch-ua-mobile": "?0",
    //             // "sec-ch-ua-platform": "\"macOS\"",
    //             // "sec-fetch-dest": "document",
    //             // "sec-fetch-mode": "navigate",
    //             // "sec-fetch-site": "none",
    //             // "sec-fetch-user": "?1",
    //             // "upgrade-insecure-requests": "1"
    //         },
    //     })
    //     let uniqueId = helper.getString((res.body || ""), `uniqueId":"`, `"`);
    //     this.uniqueId = uniqueId;

    // }
    async leave({ room_id }) {
        let random_de = helper.getRandomInt(187248723442, 934782374123)
        let device_id = "7284943" + random_de;

        let url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${encodeURIComponent(this.appversion || browserVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${this.msToken}`
        let _bodyJson = { reason: 0, room_id: room_id }
        var options = {
            proxy: helper.parserProxyString(this.proxy_string),
            'method': 'POST',
            'url': url,
            'headers': {
                'Accept': '*/*',
                'Accept-Language': 'en-US,en;q=0.9',
                'Connection': 'keep-alive',
                'Cookie': this.cookie_string,
                'Origin': 'https://www.tiktok.com',
                'Referer': 'https://www.tiktok.com',
                'Sec-Fetch-Dest': 'empty',
                'Sec-Fetch-Mode': 'cors',
                'Sec-Fetch-Site': 'same-origin',
                'User-Agent': this.client.useragent || userAgentDefault,
                'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                'sec-ch-ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
                'sec-ch-ua-mobile': '?0',
                'sec-ch-ua-platform': '"macOS"',
                'x-secsdk-csrf-token': 'DOWNGRADE'
            },
            body: querystring.stringify(_bodyJson),
            isRetry: false
        };
        let res = await helper.makeRequest(options)
    }
    async check({ room_id }) {
        let returned = false;
        let that = this;

        // if (!this.uniqueId) {
        //     return { isViewer: false }
        // }
        return new Promise(async (r) => {
            setTimeout(() => {
                if (!returned) {
                    returned = true;
                    client.close();
                    that.leave({ room_id })
                    return r({ isViewer: false })
                }
            }, that.timeout || 30000)
            let { cookie_string, proxy_string } = this
            let client = new TikTokSocket({
                cookie_string, proxy_string,isShowLog: true, onMessage: (decodedContainer) => {
                    // if (decodedContainer.webcastResponse?.messages?.length) {
                    //     decodedContainer.webcastResponse?.messages.forEach(i => {
                    //         if (i.type == "WebcastRoomUserSeqMessage" && i.decodedData) {
                    //             if (JSON.stringify(i.decodedData).includes(this.uniqueId) && !returned) {
                    //                 returned = true;
                    //                 that.leave({ room_id })
                    //                 r({ isViewer: true, decodedData: i.decodedData })
                    //                 client.close();

                    //             }
                    //         }
                    //     })
                    // }

                }
            })
            this.client = client;

            room_id = await that.checkRoom(room_id);
            console.log("Check room", room_id)
            client.connect({ room_id });
            let res = await helper.makeRequest({
                proxy: proxy_string,
                retryAfter: 3000,
                retryTime: 10,
                url: `https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F106.0.0.0+Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&version_code=180800&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`, preCheckRetry: (body) => {
                    if (!body.includes(`"user_count":1`)) return true;
                }
            });

            if (!returned && res && res.body) {
                returned = true;
                that.leave({ room_id })
               
                client.close();
                return r ({isViewer:  res.body.includes(`"user_count":1`)})

            }
      
        })
    }
    async checkRoom(room_id) {
        let res = await helper.makeRequest({
            retryAfter : 3000,
            url: `https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F106.0.0.0+Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&version_code=180800&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`, preCheckRetry: (body) => {
                if (!body.includes("user_count")) return true
            }
        });
        if (!res || !res.body || !res.body.includes(`"user_count":0`)) {
            if (this.checkRoomTime < 3) {
                this.checkRoomTime++;
                let new_room_id = await this.newRoom();
                return await this.checkRoom(new_room_id)
            } else {
                return false
            }
        } else {
            return room_id
        }
    }
}
module.exports = CheckViewer