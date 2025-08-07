const room_id = process.argv[2]
const helper = require("./src/helper")
const axios = require("axios")
const fs = require("fs")
const path = require("path")
const { delay } = require("./src/helper")

const main = async () => {
    let res = await axios.get(`https://webcast.tiktok.com/webcast/room/info/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F106.0.0.0+Safari%2F537.36&cookie_enabled=true&cursor=&internal_ext=&device_platform=web&focus_state=true&from_page=user&history_len=0&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&host=https%3A%2F%2Fwebcast.tiktok.com&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=${room_id}`)
    // console.log(res.data)
    console.log(`https://www.tiktok.com/@${res.data.data.owner.display_id}/live`)
    process.exit(0)
    let data = res.data
    let json = JSON.parse(data)
    let user = json.bodyJson.userInfo.user
    console.log(user)
}
main()