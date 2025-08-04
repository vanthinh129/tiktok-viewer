
const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
// const path = require('path');
// const os = require('os');
const path = require("path")
const { delay, getString, parserProxyString, sendMessageTele, sendMessageTele403,log_403, logs_die, changeIp, changeProxyIp, clearCacheForFile, getRandomInt } = require("./helper")
const helper = require('./helper')
const { del } = require("request")
const request = require("request")
let config_file = path.resolve('./data/config.v5.json');
clearCacheForFile(config_file)
const RabbitMQ = require(path.resolve("RabbitMQ.lib"))
const BrowserService = require("./BrowserService")
const os = require("os");
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

const userAgentDefaul1 = `Mozilla/5.0 (${os_ver}) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`
const userAgentDefault = `Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36`
const appVersionDefault = userAgentDefault.replace("Mozilla/", "")
// console.log("os_type",os_type)

console.log("userAgentDefault",userAgentDefault)

// console.log("browser_platform",browser_platform)

class Clone {
  constructor({ cookie_string, task_id, room_id,proxy, proxy_list,server_site }) {
    this.task_id = task_id;
    this.cookie_string = cookie_string
    this.username = helper.getString(cookie_string, 'username=', ';');
    this.session_id = helper.getString(cookie_string, 'sessionid=', ';');
    this.room_id = room_id;
    this.proxy = proxy;
    this.proxy_list =proxy_list
    this.failTime = 0;
    this.status = "running"
    this.browser_platform =browser_platform
    let random_de = getRandomInt(187248723442,934782374123)  
    this.device_id=  "7284943"+random_de;
    this.device_id = helper.getString(cookie_string, ';wid=', ';');
    this.is_first = true;
    this.status_viewer = -1;//3 - no login, 1 viewed, 2 - error,4 - 403
    // console.log(proxy)
    this.endpoint = ""
    this.imfetch_time = 0;
    this.delay_all_time = 8000;
    this.delay_10_time = 45000;
    this.delay = this.delay_all_time;
    this.url = ""
    this.is_10_time = true
    this.server_site = server_site || "tt2"
  }
  async run1(){
    // let r_leave = await this.callApi({type: "leave"})
    // await delay(1000)

    // let r_enter = await this.callApi({type: "enter"});
    // console.log(r_enter.body)
    let is_run = true;
    while(is_run){
      let random_de = getRandomInt(187248723442,934782374123)  
      this.device_id=  "7284943"+random_de;
          let r_enter = await this.callApi({type: "enter"});
        
         console.log(r_enter.body.length)
        await delay(170*1000)
    }
  }
    async run(){
        this.status = "running";
        // console.log(helper.getTime(),this.username, "start",this.status_viewer,this.proxy)
        let is_join = await this.runJoin();
        if(is_join){
            this.status = "running"
            this.runFetchs();
            return true
        }else{
            // console.log(helper.getTime(),this.username, "join fail",this.status_viewer)
            this.status = "end"
            return false
        }
    }
    async cancel(){
        this.status = "end"
        // console.log(helper.getTime(),this.username, "cancel",this.status_viewer)
    }
    async pause(){
        this.status = "pause"
    }
    async resume(){
        this.status = "running"
    }
    async runJoin(){
        let cookie_status = {
            status: true,
            live: true
        };//await helper.checkCookieLive({ username: this.username, cookie_string: this.cookie_string, proxy:this.proxy, proxy_list: this.proxy_list }); 
        if(!cookie_status.status || !cookie_status.live){
            console.log(helper.getTime(),this.username,`Cookie die`);
            this.status_viewer = 3;
            return false;
        }
        let res1 = await this.callApi({ type: "enter" });
        let is_good = false
        if(res1 && res1.body && res1.body.includes('user_side_title')){
            is_good = true
        }
        // console.log(helper.getTime(),this.username, "enter",this.status_viewer,is_good);
        if ([-1, 1].includes(this.status_viewer) && is_good) {
            return true
        }else{
            console.log(helper.getTime(),this.username, "enter",this.status_viewer,is_good);
            return false
        }
    }
  async runFetchs(){
    // let r_leave = await this.callApi({type: "leave"})
    // await delay(1000)

    // let r_enter = await this.callApi({type: "enter"});
    // console.log(r_enter.body)
    let is_run = true;
    this.setCursor = true;
    while(is_run){
        if(this.status == "running"){
            let r_enter = await this.fetch();
            if(r_enter.is_403){
                is_run = false;
                this.status_viewer = 4;
            }
            // console.log(helper.getTime(),this.username, this.room_id,this.imfetch_time, this.proxy)
            await delay(this.delay)
            this.imfetch_time++;
        }else if(this.status == "pause"){
            await delay(1000)
        }else if(this.status == "resume"){
            this.status = "running"
            await delay(1000)
        }else if(this.status == "end"){
            is_run = false
        }
    }
  }
  async callApi({ type }) {
    let { cookie_string, room_id, msToken: cmsToken, session_id: csession_id, timeout ,device_id } = this
    timeout = timeout || 30000
    var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
    let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
    this.tt_csrf_token =  getString(cookie_string.replace(/ /g,'') + ';', 'tt_csrf_token=', ';');
    this.s_v_web_id =  getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
    this.session_id = session_id;
    let device_type = "web_h264"
    let screen_height = 982
    let screen_width = 1512
    // console.log("device_id",device_id)
    try {
        if (session_id == "") {
          throw new Error( "Cookie no session id")
        }

        let url = "";

        // let br = await BrowserService.getInstance(userAgentDefault, {initSign: true, headless: "yes", proxy: helper.parserProxyString(this.proxy)})
        let br = await BrowserService.getInstance(userAgentDefault, {initSign: true, headless: "yes"})

        // device_id = 7368406746468058640;
        let verifyFp = getString(cookie_string.replace(/ /g,'') + ';', 's_v_web_id=', ';');
        let _bodyJson = null;
        switch (type) {
            case "leave":
                url = `https://webcast.tiktok.com/webcast/room/leave/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en&msToken=${msToken}`
                _bodyJson = {reason: 0, room_id: room_id}
              break;
            case "enter":
                //  url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${encodeURIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h264&focus_state=true&from_page=user&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=en`
                url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=web_h265&focus_state=true&from_page=&history_len=6&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&webcast_language=en`
                url = `https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&device_type=${device_type}&focus_state=true&from_page=&history_len=0&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=${screen_height}&screen_width=${screen_width}&tz_name=Asia%2FBangkok&user_is_login=true&verifyFp=${verifyFp}&webcast_language=vi-VN`
                _bodyJson = {enter_source: "others-others", room_id: room_id}
                break;

           
           case "name":
            url = `https://www.tiktok.com/api/update/profile/?WebIdLastTime=&aid=1988&app_language=vi-VN&app_name=tiktok_web&browser_language=vi&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=${this.encodeRFC3986URIComponent(appVersionDefault)}&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=${device_id}&device_platform=web_pc&focus_state=true&from_page=user&history_len=3&is_fullscreen=false&is_page_visible=true&odinId=${this.userId}&os=mac&priority_region=&referer=&region=VN&screen_height=982&screen_width=1512&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=${this.s_v_web_id}&webcast_language=vi-VN&msToken=${msToken}`
           _bodyJson =  {
            'nickname': this.name,
            'tt_csrf_token': this.tt_csrf_token
          }
           break;

      }
           let target_url = ""
     
      
           let  { url: targetUrl, xbogus, _signature, bodyEncoded, is_retry} = await br.buildUrlPageFull({url,  bodyJson: _bodyJson, msToken})
           if(is_retry){
            await delay(500)
            return await this.callApi({type}) 
          }
            target_url = targetUrl
            target_url = "https://www.facebook.com/"
        var options = {
        proxy:  parserProxyString(this.proxy),
        'method': 'POST',
        'url':  target_url,
        'headers': {
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
            'sec-ch-ua': '"Google Chrome";v="131", "Chromium";v="131", "Not?A_Brand";v="24"',
            'sec-ch-ua-mobile': '?0',
            'sec-ch-ua-platform': '"macOS"',
            'x-secsdk-csrf-token': 'DOWNGRADE'
        },
        body: bodyEncoded,
        isRetry: false
        };
        
        // console.log("target_url",target_url)  
        // process.exit(1)
        // let data_page = await this.makeRequestcurl(options);
        // options.url = "https://www.facebook.com/"
        let data_page = await this.makeRequest(options);
        data_page = {
            error: null,
            bodyJson: {"data":{"AnchorABMap":{},"adjust_display_order":1,"admin_ec_show_permission":{},"admin_user_ids":[],"age_restricted":{"AgeInterval":0,"restricted":false,"source":0},"aigc_self_disclosure_switch":false,"allow_preview_time":-1,"anchor_live_pro_info":{"banner_starling_key":"","gamer_banner_starling_key":"","is_live_pro":false,"live_pro_type":0,"show_banner":false},"anchor_scheduled_time_text":"","anchor_share_text":"","anchor_tab_type":7,"answering_question_content":"","app_id":8311,"audio_mute":0,"auto_cover":0,"ba_leads_gen_info":{"leads_gen_model":"","leads_gen_permission":false},"ba_link_info":{"ba_link_data":"","ba_link_permission":0},"biz_sticker_list":[],"blurred_cover":{"avg_color":"#FAF0DC","height":100,"image_type":0,"is_animated":false,"open_web_url":"","uri":"tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-resize-blur:100:100:4.webp?lk3s=97fb53a0&nonce=26404&refresh_token=b62fcefb463de60c45d7bed4bdc62a80&x-expires=1747054800&x-signature=4vhS2048UQ92AQqIBYZbXEDO7ow=&shp=97fb53a0&shcp=-","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-resize-blur:100:100:4.jpeg?lk3s=97fb53a0&nonce=71273&refresh_token=941294ef38819e320e1f6db843ae8675&x-expires=1747054800&x-signature=PVd0rgrE41asNZ1hcWl0ma5lN4A=&shp=97fb53a0&shcp=-"],"width":100},"book_end_time":0,"book_time":0,"business_live":0,"challenge_info":"","client_version":8302,"comment_has_text_emoji_emote":2,"comment_name_mode":0,"commerce_info":{"commerce_permission":0,"oec_live_enter_room_init_data":"","product_num":0,"use_async_load":false,"use_new_promotion":0},"commercial_content_toggle":{"open_commercial_content_toggle":false,"promote_myself":false,"promote_third_party":false},"common_label_list":"","content_tag":"","continuous_room_quota_config":{"1":{"component_type":1,"count":1,"coutinuous_room_cnt":3}},"cover":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"720x720/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=a36348a9&x-expires=1747202400&x-signature=7ZUXzy4rspBoMj7qvk3UYdpe+WE=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=01938cb2&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=1536df9c&x-expires=1747202400&x-signature=Y0S1GInBKkn3HibA2C0QfPIrUe0=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=01938cb2&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=8e823e87&x-expires=1747202400&x-signature=6M9bfvgHe6RqTqShXt2brCJmB0s=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=01938cb2&idc=my2"],"width":0},"cover_type":0,"cpp_version":0,"create_time":1747032842,"decisions":{"data":{"im_frequency":"-2","public_screen_frequency":"1.5"},"data_v2":{"im_frequency":"{\"value\":\"-2\",\"source\":\"1362\",\"decision_name\":\"1392\",\"decision_id\":\"\"}","public_screen_frequency":"{\"value\":\"1.5\",\"source\":\"1465\",\"decision_name\":\"1433\",\"decision_id\":\"\"}"},"server_features":{"comment_active_layer":"00","exp_level":"3","following":"0","hot_level":"1","ua_consume_d14_count":"0"},"ts":1747034147},"deco_list":[],"deprecated10":"","deprecated11":"","deprecated12":"","deprecated13":"","deprecated14":0,"deprecated15":0,"deprecated16":0,"deprecated17":[],"deprecated18":0,"deprecated19":"","deprecated195":false,"deprecated2":"","deprecated20":0,"deprecated21":false,"deprecated22":0,"deprecated23":"","deprecated24":0,"deprecated26":"","deprecated28":"","deprecated3":{},"deprecated30":"","deprecated31":false,"deprecated32":"","deprecated35":0,"deprecated36":0,"deprecated39":"","deprecated4":0,"deprecated41":0,"deprecated43":false,"deprecated44":0,"deprecated5":false,"deprecated6":"","deprecated7":0,"deprecated8":"","deprecated9":"","disable_preload_stream":false,"disable_preview_sub_only":0,"disable_screen_record":false,"drawer_tab_position":"game","drop_comment_group":0,"drops_info":{"drops_list_entrance":true,"earliest_gift_expire_ts":0,"promoting_drops_game_id":"","promoting_drops_game_name_for_report":"","promoting_drops_id":"","show_claim_drops_gift_notice":false,"show_drops_tag":false},"ec_age_interval":0,"ecommerce_room_tags":[],"effect_frame_upload_demotion":0,"effect_info":[],"emoji_list":[],"enable_optimize_sensitive_word":true,"enable_server_drop":0,"enable_stream_encryption":false,"existed_commerce_goods":false,"fansclub_msg_style":2,"feed_room_label":{"avg_color":"#607A53","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-sg/2ea90002aca1159b5c67","url_list":["https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/2ea90002aca1159b5c67~tplv-obj.image","https://p19-webcast.tiktokcdn.com/img/alisg/webcast-sg/2ea90002aca1159b5c67~tplv-obj.image"],"width":0},"feed_room_labels":[],"filter_msg_rules":[{"name":"regiongroup","random":{"percentage":100},"rule":0},{"name":"agegroup3","random":{"percentage":100},"rule":0}],"finish_reason":0,"finish_time":1747032842,"finish_url":"","finish_url_v2":"","follow_msg_style":2,"forum_extra_data":"","game_demo":0,"game_emotes_tab":{"can_use_guessing_emotes":false,"game_emote_config":{"emotes_can_not_be_used_hint":"ttlive_guessGame_livePage_stickerPanel_guessingStickerNote"},"unusable_guessing_emotes":{"emote_list":[],"emote_version":0,"exist":false},"usable_guessing_emotes":{"emote_list":[],"emote_version":0,"exist":false}},"game_gift_guide_config":{"game_gift_guide_keyword_config":[{"regrex_pattern":"(?i)\\b${value}\\b","type":1,"value":"ttlive_giftMoment_viewerCmtOcr1"},{"regrex_pattern":"(?i)\\b${value}\\b","type":1,"value":"ttlive_giftMoment_viewerCmtOcr2"},{"regrex_pattern":"(?i)\\b${value}\\b","type":1,"value":"ttlive_giftMoment_viewerCmtOcr3"},{"regrex_pattern":"(?i)\\b${value}\\b","type":1,"value":"ttlive_giftMoment_viewerCmtOcr4"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"good game"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"cheers"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"nice game"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"gG"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"good job"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"nice play"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"nice work"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"good bro"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"epico"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"epic"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"nice"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"perfect"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"fantastic"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"Clutch play"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"Awesome"},{"regrex_pattern":"(?i)\\b${value}\\b","type":2,"value":"celebrate"}]},"game_tag":[{"bundle_id":"","full_name":"","game_category":[],"gar":[],"hashtag_id":[5],"hashtag_list":[],"id":1329,"is_new_game":false,"landscape":0,"package_name":"","short_name":"","show_name":"Ragnarok Origin Global"}],"game_tag_detail":{"display_name":"Ragnarok Origin Global","game_tag_id":1329,"game_tag_name":"Ragnarok Origin Global","preview_game_moment_enable":false,"starling_key":"topic_game_ragnarokoriginglobal"},"gift_msg_style":2,"gift_poll_vote_enabled":true,"group_live_session":{"group_live_members":[],"is_group_live_session":false,"last_visit_time":0},"group_source":0,"has_commerce_goods":false,"has_more_history_comment":false,"has_used_music":false,"hashtag":{"id":5,"image":{"avg_color":"#607A53","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-sg/5Gaming.png","url_list":["https://p16-webcast.tiktokcdn.com/img/alisg/webcast-sg/5Gaming.png~tplv-obj.image","https://p19-webcast.tiktokcdn.com/img/alisg/webcast-sg/5Gaming.png~tplv-obj.image"],"width":0},"namespace":0,"title":"Gaming"},"have_wishlist":false,"history_comment_cursor":"","history_comment_list":[],"hot_sentence_info":"","id":7503448765740977000,"id_str":"7503448765740976902","idc_region":"maliva","indicators":[],"interaction_question":{"has_lightning_strengthen":false,"has_quick_answer":true,"has_recommend":true,"question_and_answer_entry":3},"interaction_question_version":1,"introduction":"","is_game":0,"is_gated_room":false,"is_replay":false,"is_show_user_card_switch":false,"karaoke_info":{"display_karaoke":false,"karaoke_lyric_status":false,"karaoke_status":false},"last_ping_time":1747034144,"layout":0,"like_count":8,"like_effect":{"effect_cnt":0,"effect_interval_ms":300,"level":0,"version":0},"like_icon_info":{"default_icons":[],"icons":[{"avg_color":"#53537A","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-sg/icon1.png","url_list":["https://p16-webcast.tiktokcdn.com/webcast-sg/icon1.png~tplv-resize:96:96.image","https://p19-webcast.tiktokcdn.com/webcast-sg/icon1.png~tplv-resize:96:96.image"],"width":0},{"avg_color":"#373752","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-sg/icon2.png","url_list":["https://p16-webcast.tiktokcdn.com/webcast-sg/icon2.png~tplv-resize:96:96.image","https://p19-webcast.tiktokcdn.com/webcast-sg/icon2.png~tplv-resize:96:96.image"],"width":0},{"avg_color":"#7A6D53","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-sg/icon3.png","url_list":["https://p16-webcast.tiktokcdn.com/webcast-sg/icon3.png~tplv-resize:96:96.image","https://p19-webcast.tiktokcdn.com/webcast-sg/icon3.png~tplv-resize:96:96.image"],"width":0},{"avg_color":"#405237","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-sg/puc_icon.png","url_list":["https://p16-webcast.tiktokcdn.com/webcast-sg/puc_icon.png~tplv-resize:96:96.image","https://p19-webcast.tiktokcdn.com/webcast-sg/puc_icon.png~tplv-resize:96:96.image"],"width":0},{"avg_color":"#666666","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-sg/icon4.png","url_list":["https://p16-webcast.tiktokcdn.com/webcast-sg/icon4.png~tplv-resize:96:96.image","https://p19-webcast.tiktokcdn.com/webcast-sg/icon4.png~tplv-resize:96:96.image"],"width":0}],"icons_self":[]},"like_info":{"click_cnt":0,"show_cnt":0},"link_mic":{"audience_id_list":[],"battle_scores":[],"battle_settings":{"battle_id":0,"battle_status":0,"channel_id":0,"duration":0,"finished":0,"match_type":0,"start_time":0,"start_time_ms":0,"theme":""},"channel_id":0,"channel_info":{"dimension":0,"group_channel_id":0,"inner_channel_id":0,"layout":0,"vendor":0},"followed_count":0,"linked_user_list":[],"multi_live_enum":1,"rival_anchor_id":0,"show_user_list":[]},"linker_map":{},"linkmic_layout":0,"lite_user_not_visible":false,"lite_user_visible":false,"live_distribution":[],"live_id":12,"live_reason":"","live_room_mode":6,"live_sub_only":0,"live_sub_only_month":0,"live_sub_only_tier":0,"live_sub_only_use_music":0,"live_type_audio":false,"live_type_linkmic":false,"live_type_normal":false,"live_type_sandbox":false,"live_type_screenshot":false,"live_type_social_live":false,"live_type_third_party":true,"living_room_attrs":{"admin_flag":0,"rank":0,"room_id":7503448765740977000,"room_id_str":"7503448765740976902","silence_flag":0},"lottery_finish_time":0,"max_continue_watch_mill_seconds":30000,"max_preview_time":60000,"mosaic_status":0,"multi_stream_id":0,"multi_stream_id_str":"","multi_stream_scene":0,"multi_stream_source":0,"multi_stream_url":{"alive_timestamp":0,"candidate_resolution":[],"complete_push_urls":[],"default_resolution":"","drm_type":0,"flv_pull_url":{},"flv_pull_url_params":{},"hls_pull_url":"","hls_pull_url_map":{},"hls_pull_url_params":"","id":0,"id_str":"","provider":0,"push_resolution":"","push_urls":[],"resolution_name":{},"rtmp_pull_url":"","rtmp_pull_url_params":"","rtmp_push_url":"","rtmp_push_url_params":"","stream_app_id":0,"stream_control_type":0,"stream_delay_ms":0,"stream_size_height":0,"stream_size_width":0,"vr_type":0},"net_mode":0,"os_type":0,"owner":{"allow_find_by_contacts":false,"allow_others_download_video":false,"allow_others_download_when_sharing_video":false,"allow_share_show_profile":false,"allow_show_in_gossip":false,"allow_show_my_action":false,"allow_strange_comment":false,"allow_unfollower_comment":false,"allow_use_linkmic":false,"avatar_large":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"1080x1080/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:1080:1080.webp?dr=14579&refresh_token=38bc0fbe&x-expires=1747202400&x-signature=BqJTepWDgI9d49F5hgdFBX73j44=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:1080:1080.webp?dr=14579&refresh_token=65a5537b&x-expires=1747202400&x-signature=sbYDqDwYFpSoKtDhqZgn4BGt/qU=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=3e15e262&x-expires=1747202400&x-signature=Hdu70lLkl/GOps9ZGZhgAHQbnJY=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"avatar_medium":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"720x720/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=a36348a9&x-expires=1747202400&x-signature=7ZUXzy4rspBoMj7qvk3UYdpe+WE=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=01938cb2&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=1536df9c&x-expires=1747202400&x-signature=Y0S1GInBKkn3HibA2C0QfPIrUe0=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=01938cb2&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=8e823e87&x-expires=1747202400&x-signature=6M9bfvgHe6RqTqShXt2brCJmB0s=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=01938cb2&idc=my2"],"width":0},"avatar_thumb":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"100x100/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=196c43e4&x-expires=1747202400&x-signature=iS2trBxI6hywWllFdI05kMwgQgY=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=832e8677&x-expires=1747202400&x-signature=SoeS23U+XeOqH7fEQe/oQqRlxKs=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:100:100.jpeg?dr=14579&refresh_token=e6295c62&x-expires=1747202400&x-signature=dRUst8QP/ip0PP4O1cylJBoOy0w=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"badge_image_list":[],"badge_list":[],"bg_img_url":"","bio_description":"","block_status":0,"border_list":[],"comment_restrict":0,"commerce_webcast_config_ids":[],"constellation":"","create_time":0,"deprecated1":0,"deprecated12":0,"deprecated13":0,"deprecated15":0,"deprecated16":false,"deprecated17":false,"deprecated18":"","deprecated19":false,"deprecated2":0,"deprecated21":0,"deprecated28":false,"deprecated29":"","deprecated3":0,"deprecated4":0,"deprecated5":"","deprecated6":0,"deprecated7":"","deprecated8":0,"disable_ichat":0,"display_id":"qlaiqlai22","enable_ichat_img":0,"exp":0,"fan_ticket_count":0,"fans_club_info":{"badge":{"avg_color":"","height":0,"image_type":35,"is_animated":false,"open_web_url":"","uri":"webcast-va/fans_left_up_corner_entrance_icon_lv1_v0.png","url_list":["https://p16-webcast.tiktokcdn.com/webcast-va/fans_left_up_corner_entrance_icon_lv1_v0.png~tplv-obj.image","https://p19-webcast.tiktokcdn.com/webcast-va/fans_left_up_corner_entrance_icon_lv1_v0.png~tplv-obj.image"],"width":0},"fans_club_name":"","fans_count":0,"fans_level":0,"fans_score":0,"is_sleeping":false},"fold_stranger_chat":false,"follow_info":{"follow_status":0,"follower_count":832,"following_count":7,"push_status":0},"follow_status":0,"ichat_restrict_type":0,"id":6888971869959046000,"id_str":"6888971869959046145","is_anchor_marked":false,"is_block":false,"is_follower":false,"is_following":false,"is_subscribe":false,"link_mic_stats":2,"media_badge_image_list":[],"mint_type_label":[],"modify_time":1747032983,"need_profile_guide":false,"new_real_time_icons":[],"nickname":"Qlai","own_room":{"room_ids":[7503448765740977000],"room_ids_str":["7503448765740976902"]},"pay_grade":{"deprecated20":0,"deprecated22":0,"deprecated23":0,"deprecated24":0,"deprecated25":0,"deprecated26":0,"grade_banner":"","grade_describe":"","grade_icon_list":[],"level":0,"name":"","next_name":"","next_privileges":"","score":0,"screen_chat_type":0,"upgrade_need_consume":0},"pay_score":0,"pay_scores":0,"push_comment_status":false,"push_digg":false,"push_follow":false,"push_friend_action":false,"push_ichat":false,"push_status":false,"push_video_post":false,"push_video_recommend":false,"real_time_icons":[],"scm_label":"","sec_uid":"MS4wLjABAAAA8L1GAr-6EXlWa330S-THNJUTnKsrpH-G-s3tzrx-PsxhDgWQ3Qro4VYKs3q-Nyun","secret":0,"share_qrcode_uri":"","special_id":"","status":1,"subscribe_info":{"anchor_gift_sub_auth":false,"badge":{"is_customized":false},"enable_subscription":false,"is_in_grace_period":false,"is_sol_eligible":false,"is_subscribe":false,"is_subscribed_to_anchor":false,"package_id":"","qualification":false,"sol_room_display_text":"","status":0,"sub_end_time":0,"subscriber_count":0,"timer_detail":{"anchor_id":0,"anchor_side_title":"","antidirt_status":0,"audit_status":0,"last_pause_timestamp_s":0,"remaining_time_s":0,"screen_h":0,"screen_w":0,"start_countdown_time_s":0,"start_timestamp_s":0,"sticker_x":0,"sticker_y":0,"sub_count":0,"time_increase_cap_s":0,"time_increase_per_sub_s":0,"time_increase_reach_cap":false,"timer_id":0,"timer_status":0,"timestamp_s":0,"total_pause_time_s":0,"total_time_s":0,"user_side_title":""},"user_gift_sub_auth":false},"ticket_count":0,"top_fans":[],"top_vip_no":0,"upcoming_event_list":[],"user_attr":{"admin_permissions":{},"has_voting_function":false,"is_admin":false,"is_channel_admin":false,"is_muted":false,"is_super_admin":false,"mute_duration":0},"user_role":0,"verified":false,"verified_content":"","verified_reason":"","with_car_management_permission":false,"with_commerce_permission":false,"with_fusion_shop_entry":false},"owner_device_id":0,"owner_device_id_str":"","owner_user_id":6888971869959046000,"owner_user_id_str":"","paid_content_info":{"paid_content_live_data":"","paid_content_permission":false},"paid_event":{"event_id":0,"paid_type":0},"partnership_info":{"partnership_room":false,"promoting_drops_id":"","promoting_game_id":"","promoting_room":false,"promoting_task_id":"","promoting_task_type":0,"show_task_id":"","show_task_type":0,"task_id_list":[]},"pico_live_type":0,"pin_info":{"display_duration":60,"has_pin":true},"poll_conf":{"gift_poll_limit":{"current_poll_count":0,"max_poll_count":6,"unlimited":false},"poll_template_optimize_group":2,"use_new_gift_poll":true},"polling_star_comment":false,"pre_enter_time":0,"preview_flow_tag":0,"quota_config":{"6":{"component_type":6,"default_count":1,"position_count_map":{}},"7":{"component_type":7,"default_count":1,"position_count_map":{}},"15":{"component_type":15,"default_count":1,"position_count_map":{}},"16":{"component_type":16,"default_count":1,"position_count_map":{}}},"rank_comment_groups":["ug_6","user_type_rule"],"ranklist_audience_type":0,"rectangle_cover_img":{"avg_color":"#EBE1CE","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-va/6affabf2b724ae7955c8b3ff394d30db","url_list":["https://p16-webcast.tiktokcdn.com/webcast-va/6affabf2b724ae7955c8b3ff394d30db~tplv-obj.image","https://p19-webcast.tiktokcdn.com/webcast-va/6affabf2b724ae7955c8b3ff394d30db~tplv-obj.image"],"width":0},"regional_restricted":{"block_list":[]},"relation_tag":"","replay":true,"reposted":false,"room_audit_status":0,"room_auth":{"Banner":1,"BroadcastMessage":1,"Chat":true,"ChatL2":true,"ChatSubOnly":false,"CommercePermission":0,"CommunityFlagged":false,"CommunityFlaggedReview":false,"CustomizableGiftPoll":1,"CustomizablePoll":1,"Danmaku":false,"Digg":true,"DonationSticker":2,"EmotePoll":2,"EnableFansLevel":false,"EnableShowUserUV":false,"EventPromotion":0,"Explore":true,"GameRankingSwitch":0,"Gift":true,"GiftAnchorMt":1,"GiftPoll":1,"GoldenEnvelope":2,"GoldenEnvelopeActivity":2,"InteractionQuestion":true,"Landscape":1,"LandscapeChat":0,"LuckMoney":true,"MultiEnableReserve":false,"Pictionary":0,"PictionaryBubble":0,"PictionaryPermission":0,"Poll":1,"Promote":false,"PromoteOther":1,"Props":false,"PublicScreen":1,"QuickChat":1,"Rank":1,"RankingChangeAlterSwitch":0,"RoomContributor":false,"SecretRoom":0,"Share":true,"ShareEffect":0,"ShoppingRanking":0,"SpamComments":true,"UserCard":true,"UserCount":1,"Viewers":true,"anchor_level_permission":{"InteractionQuestion":0,"beauty":0,"comment_filter":0,"comment_setting":0,"customizable_poll":1,"donation_sticker":0,"effects":0,"flip":0,"full_screen_mode":0,"goody_bag":0,"hear_your_own_voice":0,"karaoke":0,"live_background":0,"live_center":0,"live_intro":0,"mirror":0,"moderator_setting":0,"pause_live":0,"pictionary":0,"pin":1,"play_together":0,"poll":1,"portal":0,"promote":0,"share":1,"sticker":0,"topic":0,"treasure_box":0,"viewer_rank_list":1,"voice_effect":0},"comment_tray_status":0,"credit_entrance_for_audience":false,"deprecated1":false,"deprecated118":[],"deprecated119":0,"deprecated2":0,"deprecated3":0,"deprecated4":0,"deprecated5":0,"deprecated6":0,"deprecated7":0,"deprecated8":0,"deprecated9":0,"game_guess_permission":false,"guess_entrance_for_host":false,"show_credit_widget":false,"star_comment_permission_switch":{"OffReason":"","status":1},"transaction_history":0,"use_user_pv":false},"room_create_ab_param":"{\"ai_live_summary\":0,\"check_ping_no_streaming_short_close\":0,\"check_ping_top_host\":0,\"compensation_push\":0,\"count_strategy\":0,\"create_room_continue_optimize\":0,\"enable_revenue_tips_moderator_comment\":1,\"game_use_new_virtual_app_id\":2,\"gb_obs_use_virtual_app_id\":0,\"gift_poll_optimize\":1,\"go_live_with_vip_stream\":0,\"heartme_gift_text_enabled\":true,\"host_lop_realtime_settle\":0,\"lite_user_not_visible\":false,\"live_cohost_cross_room_push_arch_enable\":true,\"live_cohost_timeout_strategy_group\":0,\"live_replay_highlight_refactor\":0,\"moderator_tips_v2\":0,\"new_platform_badges\":false,\"obs_use_new_virtual_app_id\":0,\"pictionary_bubble\":0,\"pictionary_permission\":0,\"poll_template_optimize_group\":2,\"push_concurrency\":0,\"room_has_pin\":true,\"room_pin_duration\":60,\"sea_obs_use_virtual_app_id\":0,\"show_subscription_barrage_message\":false,\"show_subscription_enter_message\":false,\"sub_only_live_moderator\":false,\"update_room_status_optimize\":0,\"wave_optimize_strategy\":2}","room_layout":0,"room_llm_title":"","room_pcu":541,"room_sticker_list":[],"room_tabs":[],"room_tag":0,"rtc_app_id":"","scroll_config":"","search_id":0,"share_msg_style":2,"share_show_time":{"show_time_on_enter":0,"show_time_on_share":0},"share_url":"https://m.tiktok.com/share/live/7503448765740976902/?language=en&u_code=ejecbi7jhd8jeg","short_title":"","short_touch_items":[],"show_star_comment_entrance":false,"social_interaction":{"cohost":{"linked_users":[],"multi_cohost_permission":true},"linkmic_scene_linker":{"2":7503448921064082000,"4":7503448919435775000},"multi_live":{"anchor_setting_info":{"last_layout_settings":[]},"audience_send_gifts_to_all_enum":0,"audience_shared_invitee_panel_type":0,"host_gifter_linkmic_enum":0,"host_multi_guest_dev_mode":0,"host_send_gifts_to_all_enum":0,"linkmic_service_version":1,"multi_guest_play_info":{"pack_succ_flag":false,"play_scene_to_config_map":{}},"room_audience_multi_guest_permission_info":{"permission_info":{"err_code":0,"flag":false,"no_permission_prompt":"","specific_permission_bit_map":2},"room_pack_succ_flag":true},"room_multi_guest_linkmic_info":{"linkmic_room_create_ab_param":"","multi_guest_linkmic_info":{"fan_ticket_icon_url":"","linked_users":[{"fan_ticket":1,"fan_ticket_icon_type":0,"linkmic_id_str":"7503448919435774775_7503448907716922167_0","modify_time":1747032843,"role_type":1,"user":{"allow_find_by_contacts":false,"allow_others_download_video":false,"allow_others_download_when_sharing_video":false,"allow_share_show_profile":false,"allow_show_in_gossip":false,"allow_show_my_action":false,"allow_strange_comment":false,"allow_unfollower_comment":false,"allow_use_linkmic":false,"avatar_large":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"1080x1080/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:1080:1080.webp?dr=14579&refresh_token=38bc0fbe&x-expires=1747202400&x-signature=BqJTepWDgI9d49F5hgdFBX73j44=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:1080:1080.webp?dr=14579&refresh_token=65a5537b&x-expires=1747202400&x-signature=sbYDqDwYFpSoKtDhqZgn4BGt/qU=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=3e15e262&x-expires=1747202400&x-signature=Hdu70lLkl/GOps9ZGZhgAHQbnJY=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"avatar_medium":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"720x720/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=a36348a9&x-expires=1747202400&x-signature=7ZUXzy4rspBoMj7qvk3UYdpe+WE=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=1536df9c&x-expires=1747202400&x-signature=Y0S1GInBKkn3HibA2C0QfPIrUe0=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=8e823e87&x-expires=1747202400&x-signature=6M9bfvgHe6RqTqShXt2brCJmB0s=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"avatar_thumb":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"100x100/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777","url_list":["https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=832e8677&x-expires=1747202400&x-signature=SoeS23U+XeOqH7fEQe/oQqRlxKs=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=196c43e4&x-expires=1747202400&x-signature=iS2trBxI6hywWllFdI05kMwgQgY=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/d437b6f74315f3dbeebab35daf631777~tplv-tiktokx-cropcenter:100:100.jpeg?dr=14579&refresh_token=5c3a77e4&x-expires=1747202400&x-signature=Sd01Ghv2B4FMPQ5+trcwckRiFhc=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"badge_image_list":[],"badge_list":[],"bg_img_url":"","bio_description":"","block_status":0,"border_list":[],"comment_restrict":0,"commerce_webcast_config_ids":[],"constellation":"","create_time":0,"deprecated1":0,"deprecated12":0,"deprecated13":0,"deprecated15":0,"deprecated16":false,"deprecated17":false,"deprecated18":"","deprecated19":false,"deprecated2":0,"deprecated21":0,"deprecated28":false,"deprecated29":"","deprecated3":0,"deprecated4":0,"deprecated5":"","deprecated6":0,"deprecated7":"","deprecated8":0,"disable_ichat":0,"display_id":"qlaiqlai22","enable_ichat_img":0,"exp":0,"fan_ticket_count":0,"fold_stranger_chat":false,"follow_info":{"follow_status":0,"follower_count":832,"following_count":7,"push_status":0},"follow_status":0,"ichat_restrict_type":0,"id":6888971869959046000,"id_str":"6888971869959046145","is_anchor_marked":false,"is_block":false,"is_follower":false,"is_following":false,"is_subscribe":false,"link_mic_stats":1,"media_badge_image_list":[],"mint_type_label":[],"modify_time":0,"need_profile_guide":false,"new_real_time_icons":[],"nickname":"Qlai","pay_score":0,"pay_scores":0,"push_comment_status":false,"push_digg":false,"push_follow":false,"push_friend_action":false,"push_ichat":false,"push_status":false,"push_video_post":false,"push_video_recommend":false,"real_time_icons":[],"scm_label":"","sec_uid":"MS4wLjABAAAA8L1GAr-6EXlWa330S-THNJUTnKsrpH-G-s3tzrx-PsxhDgWQ3Qro4VYKs3q-Nyun","secret":0,"share_qrcode_uri":"","special_id":"","status":1,"ticket_count":0,"top_fans":[],"top_vip_no":0,"upcoming_event_list":[],"user_role":0,"verified":false,"verified_content":"","verified_reason":"","with_car_management_permission":false,"with_commerce_permission":false,"with_fusion_shop_entry":false}}],"request_user_status":1},"pack_err_code":0},"try_open_multi_guest_when_create_room":false,"user_settings":{"applier_sort_gift_score_threshold":0,"applier_sort_setting":0,"multi_guest_allow_request_from_followers":0,"multi_guest_allow_request_from_friends":0,"multi_guest_allow_request_from_others":0,"multi_guest_disable_video_linkmic":0,"multi_live_apply_permission":1},"viewer_gifter_linkmic_enum":0}},"square_cover_img":{"avg_color":"#89A37C","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"webcast-va/f011a8fba255bce96be3432d03119fcc","url_list":["https://p16-webcast.tiktokcdn.com/webcast-va/f011a8fba255bce96be3432d03119fcc~tplv-obj.image","https://p19-webcast.tiktokcdn.com/webcast-va/f011a8fba255bce96be3432d03119fcc~tplv-obj.image"],"width":0},"star_comment_config":{"display_lock":false,"grant_group":0,"grant_level":0,"star_comment_qualification":true,"star_comment_switch":true},"start_time":1747032845,"stats":{"comment_count":0,"deprecated1":0,"deprecated2":"","digg_count":0,"enter_count":0,"fan_ticket":0,"follow_count":0,"gift_uv_count":0,"id":7503448765740977000,"id_str":"7503448765740976902","like_count":0,"replay_fan_ticket":0,"replay_viewers":0,"share_count":0,"total_user":1661,"total_user_desp":"","user_count_composition":{"deprecated1":0,"my_follow":0,"other":0.97,"video_detail":0},"watermelon":0},"status":2,"sticker_list":[],"stream_id":2999545150721753000,"stream_id_str":"2999545150721753184","stream_status":1,"stream_url":{"alive_timestamp":0,"candidate_resolution":["SD1","SD2","HD1"],"complete_push_urls":[],"default_resolution":"SD2","drm_type":0,"extra":{"anchor_interact_profile":0,"audience_interact_profile":0,"bframe_enable":false,"bitrate_adapt_strategy":0,"bytevc1_enable":false,"default_bitrate":0,"deprecated1":false,"fps":0,"gop_sec":0,"hardware_encode":false,"height":0,"max_bitrate":0,"min_bitrate":0,"roi":false,"sw_roi":false,"video_profile":0,"width":0},"flv_pull_url":{"HD1":"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_hd5.flv?expire=1748243747&sign=be08b41b4d0edfc2d41ce03fc7c35805","SD1":"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_ld5.flv?expire=1748243747&sign=784f6e91c1850a9cd5475eafdbadc7e2","SD2":"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_sd5.flv?expire=1748243747&sign=ff8a3deb1f87ed230ae44108cdb476e0"},"flv_pull_url_params":{"HD1":"{\"gop\":4,\"v_rtpsnr\":0,\"Auto\":{\"Demotion\":{\"StallCount\":4},\"Enable\":1},\"VCodec\":\"h265\",\"v_rtbitrate_timestamp\":1747034137020,\"v_rtbitrate_vpaas_timestamp\":1747034147157,\"stream_suffix\":\"hd5\",\"vbitrate\":1600000,\"resolution\":\"1280x720\",\"v_rtbitrate\":1152960}","SD1":"{\"Auto\":{\"Demotion\":{\"StallCount\":4},\"Enable\":1},\"VCodec\":\"h265\",\"gop\":4,\"v_rtbitrate\":567900,\"v_rtbitrate_timestamp\":1747034022031,\"v_rtbitrate_vpaas_timestamp\":1747034147157,\"resolution\":\"640x360\",\"v_rtpsnr\":0,\"stream_suffix\":\"ld5\",\"vbitrate\":600000}","SD2":"{\"Auto\":{\"Demotion\":{\"StallCount\":4},\"Enable\":1},\"vbitrate\":1000000,\"v_rtpsnr\":0,\"gop\":4,\"v_rtbitrate\":475040,\"v_rtbitrate_timestamp\":1747034143026,\"VCodec\":\"h265\",\"v_rtbitrate_vpaas_timestamp\":1747034147157,\"stream_suffix\":\"sd5\",\"resolution\":\"960x540\"}"},"hls_pull_url":"https://pull-hls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184/playlist.m3u8?expire=1748243747&session_id=178-2025051207154689B62CE39CB18B4E79B9&sign=2c028fc8561b39a3556622acfd311836","hls_pull_url_map":{},"hls_pull_url_params":"{\"gop\":4,\"vbitrate\":7600000,\"Auto\":{\"Demotion\":{\"StallCount\":4},\"Enable\":1},\"VCodec\":\"h265\",\"resolution\":\"1920x1080\"}","id":2999545150721753000,"id_str":"2999545150721753184","live_core_sdk_data":{"pull_data":{"options":{"default_quality":{"icon_type":0,"level":0,"name":"540p","resolution":"","sdk_key":"sd","v_codec":""},"qualities":[{"icon_type":6,"level":10,"name":"Original","resolution":"","sdk_key":"origin","v_codec":""},{"icon_type":4,"level":6,"name":"1080p60","resolution":"","sdk_key":"uhd_60","v_codec":""},{"icon_type":3,"level":4,"name":"720p60","resolution":"","sdk_key":"hd_60","v_codec":""},{"icon_type":3,"level":3,"name":"720p","resolution":"","sdk_key":"hd","v_codec":""},{"icon_type":2,"level":2,"name":"540p","resolution":"","sdk_key":"sd","v_codec":""},{"icon_type":1,"level":1,"name":"360p","resolution":"","sdk_key":"ld","v_codec":""}],"show_quality_button":true},"stream_data":"{\"common\":{\"session_id\":\"178-2025051207154689B62CE39CB18B4E79B9\",\"rule_ids\":\"{\\\"ab_version_trace\\\":null,\\\"sched\\\":\\\"{\\\\\\\"ids\\\\\\\":[\\\\\\\"ex_608398(Weight:20)\\\\\\\"],\\\\\\\"result\\\\\\\":{\\\\\\\"hit\\\\\\\":\\\\\\\"default\\\\\\\",\\\\\\\"cdn\\\\\\\":200}}\\\"}\",\"user_count\":561,\"peer_anchor_level\":1},\"data\":{\"uhd_60\":{\"main\":{\"flv\":\"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_uhd560.flv?expire=1748243747\\u0026sign=0096ab4d6f142022204d889c44e68627\",\"hls\":\"https://pull-hls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_uhd560/playlist.m3u8?expire=1748243747\\u0026sign=3e36ae86c7a368e05c6132c0a1a137e7\",\"cmaf\":\"\",\"dash\":\"\",\"lls\":\"https://pull-lls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_uhd560.sdp?expire=1748243747\\u0026sign=a3d5fdcf17dad538e11bcb9cce049ba3\",\"tsl\":\"\",\"tile\":\"\",\"rtc\":\"\",\"sdk_params\":\"{\\\"resolution\\\":\\\"1920x1080\\\",\\\"gop\\\":4,\\\"stream_suffix\\\":\\\"uhd560\\\",\\\"Auto\\\":{\\\"Demotion\\\":{\\\"StallCount\\\":4},\\\"Enable\\\":1},\\\"VCodec\\\":\\\"h265\\\",\\\"vbitrate\\\":4000000}\"}},\"hd_60\":{\"main\":{\"flv\":\"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_hd560.flv?expire=1748243747\\u0026sign=7d7846ded4bd2b4aad5009d876fb095c\",\"hls\":\"https://pull-hls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_hd560/playlist.m3u8?expire=1748243747\\u0026sign=c588a76dc259ef9c586e730dea5bbfcd\",\"cmaf\":\"\",\"dash\":\"\",\"lls\":\"https://pull-lls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_hd560.sdp?expire=1748243747\\u0026sign=9d0c895b54c69fc52bcec29c36b3d0f1\",\"tsl\":\"\",\"tile\":\"\",\"rtc\":\"\",\"sdk_params\":\"{\\\"Auto\\\":{\\\"Demotion\\\":{\\\"StallCount\\\":4},\\\"Enable\\\":1},\\\"v_rtbitrate_vpaas_timestamp\\\":1747034147157,\\\"vbitrate\\\":2600000,\\\"resolution\\\":\\\"1280x720\\\",\\\"gop\\\":4,\\\"VCodec\\\":\\\"h265\\\",\\\"v_rtbitrate_timestamp\\\":1747034096038,\\\"stream_suffix\\\":\\\"hd560\\\",\\\"v_rtbitrate\\\":1761370,\\\"v_rtpsnr\\\":0}\"}},\"ao\":{\"main\":{\"flv\":\"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184.flv?expire=1748243747\\u0026sign=290a4f28eb9060147ae30058e2ee262d\\u0026only_audio=1\",\"hls\":\"\",\"cmaf\":\"\",\"dash\":\"\",\"lls\":\"\",\"tsl\":\"\",\"tile\":\"\",\"rtc\":\"\",\"sdk_params\":\"{\\\"Auto\\\":{\\\"Demotion\\\":{\\\"StallCount\\\":4},\\\"Enable\\\":1},\\\"VCodec\\\":\\\"h264\\\",\\\"vbitrate\\\":0,\\\"resolution\\\":\\\"\\\",\\\"gop\\\":4}\"}},\"origin\":{\"main\":{\"flv\":\"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184.flv?expire=1748243747\\u0026sign=290a4f28eb9060147ae30058e2ee262d\",\"hls\":\"https://pull-hls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184/playlist.m3u8?expire=1748243747\\u0026sign=2c028fc8561b39a3556622acfd311836\",\"cmaf\":\"\",\"dash\":\"\",\"lls\":\"https://pull-lls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184.sdp?expire=1748243747\\u0026sign=9976d467fd5a9925e8b74b9f9e23010e\",\"tsl\":\"\",\"tile\":\"\",\"rtc\":\"\",\"sdk_params\":\"{\\\"gop\\\":4,\\\"vbitrate\\\":7600000,\\\"Auto\\\":{\\\"Demotion\\\":{\\\"StallCount\\\":4},\\\"Enable\\\":1},\\\"VCodec\\\":\\\"h265\\\",\\\"resolution\\\":\\\"1920x1080\\\"}\"}},\"hd\":{\"main\":{\"flv\":\"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_hd5.flv?expire=1748243747\\u0026sign=be08b41b4d0edfc2d41ce03fc7c35805\",\"hls\":\"https://pull-hls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_hd5/playlist.m3u8?expire=1748243747\\u0026sign=5e0458640dfd5e0d9f5dea756c382d99\",\"cmaf\":\"\",\"dash\":\"\",\"lls\":\"https://pull-lls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_hd5.sdp?expire=1748243747\\u0026sign=a6f720d94f1c519c9c572aa2e1112847\",\"tsl\":\"\",\"tile\":\"\",\"rtc\":\"\",\"sdk_params\":\"{\\\"gop\\\":4,\\\"v_rtpsnr\\\":0,\\\"Auto\\\":{\\\"Demotion\\\":{\\\"StallCount\\\":4},\\\"Enable\\\":1},\\\"VCodec\\\":\\\"h265\\\",\\\"v_rtbitrate_timestamp\\\":1747034137020,\\\"v_rtbitrate_vpaas_timestamp\\\":1747034147157,\\\"stream_suffix\\\":\\\"hd5\\\",\\\"vbitrate\\\":1600000,\\\"resolution\\\":\\\"1280x720\\\",\\\"v_rtbitrate\\\":1152960}\"}},\"sd\":{\"main\":{\"flv\":\"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_sd5.flv?expire=1748243747\\u0026sign=ff8a3deb1f87ed230ae44108cdb476e0\",\"hls\":\"https://pull-hls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_sd5/playlist.m3u8?expire=1748243747\\u0026sign=e3827f5fa1ea7f4e601b4caa538f77a5\",\"cmaf\":\"\",\"dash\":\"\",\"lls\":\"https://pull-lls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_sd5.sdp?expire=1748243747\\u0026sign=3582bff6232a6bc690d26cb2cdff664d\",\"tsl\":\"\",\"tile\":\"\",\"rtc\":\"\",\"sdk_params\":\"{\\\"Auto\\\":{\\\"Demotion\\\":{\\\"StallCount\\\":4},\\\"Enable\\\":1},\\\"vbitrate\\\":1000000,\\\"v_rtpsnr\\\":0,\\\"gop\\\":4,\\\"v_rtbitrate\\\":475040,\\\"v_rtbitrate_timestamp\\\":1747034143026,\\\"VCodec\\\":\\\"h265\\\",\\\"v_rtbitrate_vpaas_timestamp\\\":1747034147157,\\\"stream_suffix\\\":\\\"sd5\\\",\\\"resolution\\\":\\\"960x540\\\"}\"}},\"ld\":{\"main\":{\"flv\":\"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_ld5.flv?expire=1748243747\\u0026sign=784f6e91c1850a9cd5475eafdbadc7e2\",\"hls\":\"https://pull-hls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_ld5/playlist.m3u8?expire=1748243747\\u0026sign=41e33c2d5790279841d0771cfa78375c\",\"cmaf\":\"\",\"dash\":\"\",\"lls\":\"https://pull-lls-l1-va01.tiktokcdn.com/game/stream-2999545150721753184_ld5.sdp?expire=1748243747\\u0026sign=19ec951ef7ac4759fc8b3b600bd17a1b\",\"tsl\":\"\",\"tile\":\"\",\"rtc\":\"\",\"sdk_params\":\"{\\\"Auto\\\":{\\\"Demotion\\\":{\\\"StallCount\\\":4},\\\"Enable\\\":1},\\\"VCodec\\\":\\\"h265\\\",\\\"gop\\\":4,\\\"v_rtbitrate\\\":567900,\\\"v_rtbitrate_timestamp\\\":1747034022031,\\\"v_rtbitrate_vpaas_timestamp\\\":1747034147157,\\\"resolution\\\":\\\"640x360\\\",\\\"v_rtpsnr\\\":0,\\\"stream_suffix\\\":\\\"ld5\\\",\\\"vbitrate\\\":600000}\"}}}}"}},"provider":0,"push_resolution":"","push_urls":[],"resolution_name":{"AUTO":"AUTO","FULL_HD1":"1080p","HD1":"720p","ORIGION":"Original","SD1":"360p","SD2":"540p","pm_mt_video_1080p60":"1080p60","pm_mt_video_720p60":"720p60"},"rtmp_pull_url":"https://pull-flv-l1-va01.tiktokcdn.com/game/stream-2999545150721753184.flv?expire=1748243747&session_id=178-2025051207154689B62CE39CB18B4E79B9&sign=290a4f28eb9060147ae30058e2ee262d","rtmp_pull_url_params":"{\"gop\":4,\"vbitrate\":7600000,\"Auto\":{\"Demotion\":{\"StallCount\":4},\"Enable\":1},\"VCodec\":\"h265\",\"resolution\":\"1920x1080\"}","rtmp_push_url":"","rtmp_push_url_params":"","stream_app_id":0,"stream_control_type":0,"stream_delay_ms":0,"stream_size_height":0,"stream_size_width":0,"vr_type":0},"sub_tag":0,"support_quiz":0,"title":"Ow Zeny Only","top_fans":[{"fan_ticket":1,"user":{"allow_find_by_contacts":false,"allow_others_download_video":false,"allow_others_download_when_sharing_video":false,"allow_share_show_profile":false,"allow_show_in_gossip":false,"allow_show_my_action":false,"allow_strange_comment":false,"allow_unfollower_comment":false,"allow_use_linkmic":false,"avatar_large":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"1080x1080/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:1080:1080.webp?dr=14579&refresh_token=8c7a5a9b&x-expires=1747206000&x-signature=5NPWYo8vMWMx+DqfUn/3+Zrv/7o=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:1080:1080.webp?dr=14579&refresh_token=7aed216e&x-expires=1747206000&x-signature=/0x8sZDR5xvXzHwfINAANnGg/hg=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:1080:1080.jpeg?dr=14579&refresh_token=95827f87&x-expires=1747206000&x-signature=MHI2ciqwgbVqOIFWowcmqDWp3IM=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"avatar_medium":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"720x720/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=a3a9a277&x-expires=1747206000&x-signature=KPh7kUTqEgDANbnuyxbDXJU+kRc=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:720:720.webp?dr=14579&refresh_token=2e6b4a28&x-expires=1747206000&x-signature=N6/cMFX0urj/nlrB6ZnJLT1CmjU=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:720:720.jpeg?dr=14579&refresh_token=0b210e04&x-expires=1747206000&x-signature=UZuIKr1H6a/TLA1fEoyf+za8m7I=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"avatar_thumb":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"100x100/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f","url_list":["https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=8510271a&x-expires=1747206000&x-signature=Ct9eZ+Xqvg5DT3R8Xs4MOaeG/IY=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p9-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:100:100.webp?dr=14579&refresh_token=e5a5bdf7&x-expires=1747206000&x-signature=Dljv/UmUng/aZZJ7wkt/57wsTJY=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2","https://p16-sign-sg.tiktokcdn.com/tos-alisg-avt-0068/1add02f9ca93f6b5c59527b4086d529f~tplv-tiktokx-cropcenter:100:100.jpeg?dr=14579&refresh_token=2a60f6c3&x-expires=1747206000&x-signature=56dLBuMtPildadhFLlprOzLQzbg=&t=4d5b0474&ps=13740610&shp=a5d48078&shcp=fdd36af4&idc=my2"],"width":0},"badge_image_list":[],"badge_list":[{"OpenWebURL":"sslocal://webcast_lynxview_popup?use_spark=1&url=https://lf16-gecko-source.tiktokcdn.com/obj/byte-gurd-source-sg/tiktok/fe/live/tiktok_live_revenue_user_level_main/src/pages/privilege/panel/template.js&hide_status_bar=0&hide_nav_bar=1&container_bg_color=00000000&height=90%&bdhm_bid=tiktok_live_revenue_user_level_main&use_forest=1","combine":{"background":{"background_color_code":"#995F90EF","border_color_code":"","image":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"","url_list":[],"width":0}},"background_auto_mirrored":false,"background_dark_mode":{"background_color_code":"#995F90EF","border_color_code":"","image":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"","url_list":[],"width":0}},"display_type":4,"font_style":{"border_color":"","font_color":"","font_size":0,"font_width":0},"icon":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"sslocal://webcast_lynxview_popup?use_spark=1&url=https://lf16-gecko-source.tiktokcdn.com/obj/byte-gurd-source-sg/tiktok/fe/live/tiktok_live_revenue_user_level_main/src/pages/privilege/panel/template.js&hide_status_bar=0&hide_nav_bar=1&container_bg_color=00000000&height=90%&bdhm_bid=tiktok_live_revenue_user_level_main&use_forest=1","uri":"webcast-va/grade_badge_icon_lite_lv5_v1.png","url_list":["https://p16-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv5_v1.png~tplv-obj.image","https://p19-webcast.tiktokcdn.com/webcast-va/grade_badge_icon_lite_lv5_v1.png~tplv-obj.image"],"width":0},"icon_auto_mirrored":false,"multi_guest_show_style":0,"padding":{"badge_width":32,"horizontal_padding_rule":0,"icon_bottom_padding":0,"icon_top_padding":0,"left_padding":0,"middle_padding":3,"right_padding":0,"use_specific":true,"vertical_padding_rule":0},"padding_new_font":{"badge_width":32,"horizontal_padding_rule":0,"icon_bottom_padding":0,"icon_top_padding":0,"left_padding":0,"middle_padding":3,"right_padding":0,"use_specific":true,"vertical_padding_rule":0},"personal_card_show_style":15,"profile_card_panel":{"badge_text_position":0,"profile_content":{"icon_list":[],"use_content":false},"projection_config":{"icon":{"avg_color":"","height":0,"image_type":0,"is_animated":false,"open_web_url":"","uri":"","url_list":[],"width":0},"use_projection":false},"use_new_profile_card_style":false},"public_screen_show_style":14,"ranklist_online_audience_show_style":0,"str":"5"},"display":true,"display_status":0,"display_type":4,"exhibition_type":0,"greyed_by_client":0,"is_customized":false,"position":1,"priority_type":20,"privilege_log_extra":{"data_version":"2","level":"5","privilege_id":"7138381176787506980","privilege_order_id":"mock_fix_width_transparent_7138381176787506980","privilege_version":"0"},"scene_type":8}],"bg_img_url":"","bio_description":"👌🏿‼️","block_status":0,"border_list":[],"comment_restrict":0,"commerce_webcast_config_ids":[],"constellation":"","create_time":0,"deprecated1":0,"deprecated12":0,"deprecated13":0,"deprecated15":0,"deprecated16":false,"deprecated17":false,"deprecated18":"","deprecated19":false,"deprecated2":0,"deprecated21":0,"deprecated28":false,"deprecated29":"","deprecated3":0,"deprecated4":0,"deprecated5":"","deprecated6":0,"deprecated7":"","deprecated8":0,"disable_ichat":0,"display_id":"kensuuuuuu1","enable_ichat_img":0,"exp":0,"fan_ticket_count":0,"fold_stranger_chat":false,"follow_info":{"follow_status":0,"follower_count":157,"following_count":185,"push_status":0},"follow_status":0,"ichat_restrict_type":0,"id":6917212843016799000,"id_str":"6917212843016799234","is_anchor_marked":false,"is_block":false,"is_follower":false,"is_following":false,"is_subscribe":false,"link_mic_stats":2,"media_badge_image_list":[],"mint_type_label":[7160893592603462000],"modify_time":1747015139,"need_profile_guide":false,"new_real_time_icons":[],"nickname":"Ken Su","pay_grade":{"deprecated20":0,"deprecated22":0,"deprecated23":0,"deprecated24":0,"deprecated25":0,"deprecated26":0,"grade_banner":"","grade_describe":"","grade_icon_list":[],"level":0,"name":"","next_name":"","next_privileges":"","score":0,"screen_chat_type":0,"upgrade_need_consume":0},"pay_score":0,"pay_scores":0,"push_comment_status":false,"push_digg":false,"push_follow":false,"push_friend_action":false,"push_ichat":false,"push_status":false,"push_video_post":false,"push_video_recommend":false,"real_time_icons":[],"scm_label":"","sec_uid":"MS4wLjABAAAAfybmmbBQW4IDocmtEMGbisdCwAeAqiTM_U-5JpEIII1VykWSYHmSCT-JWlcBnLH4","secret":0,"share_qrcode_uri":"","special_id":"","status":1,"ticket_count":0,"top_fans":[],"top_vip_no":0,"upcoming_event_list":[],"user_attr":{"admin_permissions":{},"has_voting_function":false,"is_admin":false,"is_channel_admin":false,"is_muted":false,"is_super_admin":false,"mute_duration":0},"user_role":0,"verified":false,"verified_content":"","verified_reason":"","with_car_management_permission":false,"with_commerce_permission":false,"with_fusion_shop_entry":false}}],"use_filter":false,"user_count":541,"user_share_text":"","video_feed_tag":"","watch_early_quota_config":{"1":{"component_type":1,"count":0,"watch_mill_seconds":10000}},"webcast_comment_tcs":0,"webcast_sdk_version":832,"with_draw_something":false,"with_ktv":false,"with_linkmic":true},"extra":{"digg_color":16711902,"finished_perception_msg":"","is_official_channel":false,"is_same_app_language":true,"now":1747034147224,"pay_scores":0,"region":"VN","user_restricted_mode":0},"status_code":0},
            headers: {},
            status: 200
        }
        data_page.body = JSON.stringify(data_page.bodyJson)
        if(data_page.status == 403){
          throw new Error( "Request failed with status code 403")
       }
        if(data_page.error && data_page.error != "Request timeout"){
          console.log(data_page.error)
      }
        if(data_page.body) {
            let code = data_page.bodyJson.status_code;
            let message = (data_page.bodyJson|| {}).data.message;
            let result = { is_403: false, is_dead: message === "User doesn't login" || code === 20003 ? true: false, body: data_page.body}
            return result

        }
          let result = { is_403: false, data: data_page.body,body: data_page.body}
        return result

    } catch (error) {
        console.log("error call api",this.session_id, error.message)
        let result =  { is_403: error.message == "Request failed with status code 403" ? true: false, error:error.message}

        return result
    }

}
async makeRequest (options) {
    let that = this;
    
    let {url, headers, method, proxy,retryCount, body, timeout, retryTime, proxy_list, form, preCheckRetry, name, retryAfter} = options
    if(!url.includes("X-Gnarly") ){
        return  {error:"None sign"+that.proxy, body: "", headers:  {}, status:  null }
    }
    method = method || "get"
    retryTime = retryTime || 2;
    retryAfter =retryAfter || 1000
    let isGetBody = true;
    if(options.hasOwnProperty("isGetBody")) {
      isGetBody = options.isGetBody
    }
    let isRetry = true;
    if(options.hasOwnProperty("isRetry")) {
      isRetry = options.isRetry
    }
    let retry = retryCount || 0;
    let head = await  new Promise(r => {
      const options = {
        url,
        method: method.toUpperCase(),
        headers: headers,
        body,
        timeout: timeout  || 30000
      }
      if(body) options.body = body;
      if(form) options.form = form;
      let done = false;
      setTimeout(()=>{
        if(!done){
          done = true;
          return  {error:"Request timeout "+that.proxy, body: "", headers:  {}, status:  null }
        }
      },timeout  || 30000)

      if (proxy) {
        let proxystr = ""
        if( typeof proxy == "string") {
          proxystr = proxy
          if(!proxy.includes("https" || !proxy.includes("http"))){
            let { protocol, host, port, username, password } = helper.parserProxyString(proxy);
            proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
          }
        } else {
          let { protocol, host, port, username, password } = proxy;
          proxystr = `${protocol || "http"}://${username && password ? `${username}:${password}@` : ''}${host}:${port}`
        }
        options.proxy = proxystr
      }
      request(options,(error, response, body) => {
        if(!body){
          that.status_viewer = 6
        }
            if (response && response.statusCode == 403) {
                that.status_viewer = 4;
            }else if(url.includes("webcast/room/enter")) {
            if (body && body.includes('"status_code":20003')) {
                that.status_viewer = 3; // logout
              } else if (body && body.includes('"status_code":4003182')) {
                that.status_viewer = 2;
              } else if (body && body.includes('AnchorABMap')) {
                that.status_viewer = 1; // good
            } else if (body && body.includes('"status_code":30003')) {
                that.status_viewer = 5; //finish
              }
            }
          if(!done){
            done = true;
            return  {error, body: body ? body.toString("utf8"): "", bodyBinary: body, headers: response ? response.headers : {}, status: response ?response.statusCode : null }
          }
      })
    })
    let isRetryPreCheck =false
    if( "function" ==  typeof preCheckRetry) 
      {
        try {
          isRetryPreCheck = await preCheckRetry(head.body || "", head)
          isRetryPreCheck 
        } catch(e){
          console.log("err pre", e)
        }
      }

      let bodyJson = {};
      try { bodyJson= JSON.parse(head.body)} catch(e){}
      head.bodyJson = bodyJson
    if(isRetryPreCheck || head.error || (!head.body && isGetBody) ) {
      if(retry < retryTime && isRetry){
        // console.log("retry request:",name)
        if(proxy_list && proxy_list.length > 0){
          options.proxy = proxy_list[Math.floor((Math.random() * proxy_list.length))]
        }
        retry++
        options.retryCount = retry
        await helper.delay(retryAfter || 1000)
        return await this.makeRequest(options)
      }
      return head
  
    }

    return head
  }
async makeRequestcurl(options) {
    let that = this;
    
    let { url, headers, method, proxy, retryCount, body, timeout, retryTime, 
         proxy_list, form, preCheckRetry, name, retryAfter } = options;
    
    method = method || "get";
    retryTime = retryTime || 2;
    retryAfter = retryAfter || 1000;
    timeout = timeout || 10000;
    
    let isGetBody = options.hasOwnProperty("isGetBody") ? options.isGetBody : true;
    let isRetry = options.hasOwnProperty("isRetry") ? options.isRetry : true;
    let retry = retryCount || 0;

    // Tạo file tạm để lưu response body và headers
    const tmpDir = os.tmpdir();
    const bodyFile = path.join(tmpDir, `curl_body_${Date.now()}_${Math.random().toString(36).substring(2, 10)}.txt`);

    try {
      // Xây dựng lệnh curl trực tiếp
      let curlCommand = `curl "${url}"`;
      
      // Thêm method nếu không phải GET
      if (method.toUpperCase() !== 'GET') {
        curlCommand += ` -X ${method.toUpperCase()}`;
      }
      
      // Thêm timeout
      curlCommand += ` -m ${Math.ceil(timeout / 1000)}`;
      
      // Loại bỏ proxy từ chuỗi cookie trước khi thêm headers
      if (headers && headers.Cookie && typeof headers.Cookie === 'string') {
        // Loại bỏ thông tin proxy từ cookie
        headers.Cookie = headers.Cookie.replace(/proxy=([^;]+);?/g, '');
      }
      
      // Thêm headers
      if (headers) {
        Object.entries(headers).forEach(([key, value]) => {
          if (value) {
            // Xử lý đặc biệt cho header sec-ch-ua và các header tương tự có nhiều dấu nháy kép
            if (key.toLowerCase() === 'sec-ch-ua' || value.includes('"')) {
              // Escape tất cả dấu nháy kép bằng cách thay bằng \"
              const escapedValue = value.replace(/"/g, '\\"');
              curlCommand += ` -H "${key}: ${escapedValue}"`;
            } else {
              curlCommand += ` -H "${key}: ${value}"`;
            }
          }
        });
      }

      // Xử lý proxy
      let proxyStr = null;
      if (proxy) {
        let proxyUrl = "";
        if (typeof proxy === "string") {
          // Nếu proxy là string trực tiếp
          if (proxy.includes("http://") || proxy.includes("https://")) {
            proxyUrl = proxy;
          } else {
            // Nếu proxy có định dạng khác, parse nó
            try {
              let parsedProxy = helper.parserProxyString(proxy);
              if (parsedProxy) {
                const { protocol = "http", host, port, username, password } = parsedProxy;
                proxyUrl = `${protocol}://`;
                if (username && password) {
                  proxyUrl += `${username}:${password}@`;
                }
                proxyUrl += `${host}:${port}`;
              }
            } catch (e) {
              console.error("Error parsing proxy string:", e);
              // Nếu không thể parse, sử dụng trực tiếp
              proxyUrl = `http://${proxy}`;
            }
          }
        } else if (typeof proxy === 'object') {
          // Nếu proxy là object
          const { protocol = "http", host, port, username, password } = proxy;
          proxyUrl = `${protocol}://`;
          if (username && password) {
            proxyUrl += `${username}:${password}@`;
          }
          proxyUrl += `${host}:${port}`;
        }
        
        if (proxyUrl) {
          curlCommand += ` -x "${proxyUrl}"`;
        }
      }

      // Thêm body hoặc form data
      if (body) {
        // Escape ký tự đặc biệt trong body
        const escapedBody = body.replace(/'/g, "'\\''");
        curlCommand += ` -d '${escapedBody}'`;
      } else if (form) {
        const formData = Object.entries(form)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&');
        curlCommand += ` -d '${formData}'`;
      }

      // Thêm các options curl cần thiết
      curlCommand += ` -s -o "${bodyFile}" -w "%{http_code}"`;
      
      // Debug command (comment sau khi xác nhận lệnh hoạt động)
      // console.log("Executing curl command:", curlCommand);
      
      // Thực thi curl command
    //   console.log(curlCommand)
    //   process.exit(1)
      const execAsync = promisify(exec);
      const { stdout, stderr } = await execAsync(curlCommand, { timeout: timeout + 1000 })
        .catch(error => {
          console.error("Curl execution error:", error.message);
          return { stdout: '', stderr: error.message };
        });
      
      // Parse status code từ curl output
      const statusCode = parseInt(stdout) || null;
      
      // Kiểm tra trạng thái
      if (statusCode === 403) {
        that.status_viewer = 4;
      }
      
      // Đọc body từ file
      let bodyContent = '';
      try {
        if (fs.existsSync(bodyFile)) {
          bodyContent = fs.readFileSync(bodyFile, 'utf8');
          // console.log("Response body:", bodyContent.substring(0, 200) + (bodyContent.length > 200 ? '...' : ''));
        } else {
          console.error("Body file not found:", bodyFile);
        }
      } catch (readError) {
        console.error("Error reading body file:", readError);
      }
      
      // Kiểm tra response body để xác định trạng thái
      if (bodyContent && url.includes("webcast/room/enter")) {
        if (bodyContent.includes('"status_code":20003')) {
          that.status_viewer = 3; // logout
        } else if (bodyContent.includes('"status_code":4003182')) {
          that.status_viewer = 2;
        } else if (bodyContent.includes('AnchorABMap')) {
          that.status_viewer = 1; // good
        } else if (bodyContent.includes('"status_code":30003')) {
          that.status_viewer = 5; // finish
        }
      } else if(that.status_viewer != 4){
        that.status_viewer = 6; // Không có body
      }
      
      // Xóa file tạm
      try {
        if (fs.existsSync(bodyFile)) {
          fs.unlinkSync(bodyFile);
        }
      } catch (unlinkError) {
        console.error("Error removing temp file:", unlinkError);
      }
      
      // Đóng gói kết quả
      const head = {
        error: stderr ? stderr : null,
        body: bodyContent,
        headers: {},  // Không có headers chi tiết với cách này
        status: statusCode
      };
      
      // Parse body thành JSON nếu có thể
      let bodyJson = {};
      try {
        if (bodyContent) {
          bodyJson = JSON.parse(bodyContent);
        }
      } catch (e) {
        // Không cần log lỗi parse JSON nếu body không phải JSON
      }
      
      head.bodyJson = bodyJson;
      
      // Kiểm tra điều kiện retry
      let isRetryPreCheck = false;
      if (typeof preCheckRetry === "function") {
        try {
          isRetryPreCheck = await preCheckRetry(head.body || "", head);
        } catch (e) {
          console.error("Error in preCheckRetry:", e.message);
        }
      }
      
      if (isRetryPreCheck || head.error || (!head.body && isGetBody)) {
        if (retry < retryTime && isRetry) {
          // Chọn proxy mới nếu có
          if (proxy_list && proxy_list.length > 0) {
            options.proxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
          }
          retry++;
          options.retryCount = retry;
          await helper.delay(retryAfter);
          return await this.makeRequestcurl(options);
        }
      }
      
      return head;
      
    } catch (error) {
      console.error("Fatal error in makeRequest:", error.message);
      
      // Xóa files tạm trong trường hợp lỗi
      try {
        if (fs.existsSync(bodyFile)) {
          fs.unlinkSync(bodyFile);
        }
      } catch (unlinkError) {}
      
      // Thử lại nếu cần
      if (retry < retryTime && isRetry) {
        if (proxy_list && proxy_list.length > 0) {
          options.proxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
        }
        retry++;
        options.retryCount = retry;
        await helper.delay(retryAfter);
        return await this.makeRequestcurl(options);
      }
      
      return {
        error: error.message,
        body: "",
        headers: {},
        status: null,
        bodyJson: {}
      };
    }
  }
encodeRFC3986URIComponent(str) {
    return encodeURIComponent(str).replace(
      /[!'()*]/g,
      (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}
async send403Rabbit(proxy){
    // "update_account_403"
    try {
        let rabbitService = await RabbitMQ.getInstance({url: "amqp://bupmat:bupmat@185.190.140.88:5672/"+this.server_site+"?heartbeat=60"});
        if(proxy){
            let message = {"action": "update_account_403_fetch", "proxy":proxy, time_now: Date.now()}
            await rabbitService.sendMessage("rabbit_cron", message)
        }
    } catch(error){
        console.log("error handleSendRabbit", error)
    }

}
fetch() {
    return new Promise(async r=>{
        let start = Date.now()
        let done = false;
        let isFetch = false;
        let isApi = false
        let { timeout } =  { timeout: 30000}
        let { cookie_string, video_id, msToken: cmsToken, session_id: csession_id } = this
        var msToken = cmsToken || getString(cookie_string + ';', 'msToken=', ';');
        let session_id = csession_id || getString(cookie_string.replace(/ /g,'') + ';', ';sessionid=', ';')||
        getString(cookie_string.replace(/ /g,'') + ';', 'sessionid=', ';');
        this.session_id = session_id;
        if (session_id == "") {
          throw new Error( "Cookie no session id")
        }
        try {

            // setTimeout(()=>{
            //     if(!done){
            //         done = true;
            //         let result = { error: "Timeout "+timeout ,is_403: false, is_fetch:isFetch, is_api: isApi ? {} : false, process_time: Date.now() - start, start}
            //         return r(result)
            //     }
            // },timeout)
           
            let br = await BrowserService.getInstance(userAgentDefault, {initSign: true, headless: "yes"})

            let appVersion = encodeURI(appVersionDefault)

            isFetch = true
            let history_comment_cursor =  this.history_comment_cursor || 0
            let cursor = this.cursor || ''
            let internal_ext = ''
            internal_ext = this.internal_ext || ''
            let fetch_rule = this.internal_ext ? 2: 1
            fetch_rule =1;
            let endpoint = ``
            endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=${this.last_rtt }&internal_ext=${(internal_ext).replaceAll("|","%7C")}&cursor=${cursor}&history_comment_cursor=${history_comment_cursor}&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`
            let url = "";
            if(!internal_ext) {
                endpoint = `version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=MacIntel&browser_name=Mozilla&browser_version=${appVersion}&browser_online=true&tz_name=Asia/Saigon&aid=1988&app_name=tiktok_web&live_id=12&version_code=270000&debug=false&app_language=vi-VN&client_enter=1&room_id=${this.room_id}&identity=audience&history_comment_count=6&fetch_rule=1&last_rtt=-1&internal_ext=0&cursor=0&history_comment_cursor=0&sup_ws_ds_opt=1&resp_content_type=protobuf&did_rule=3`
            }
            // if(this.is_10_time && this.imfetch_time >= 10){
            //     endpoint = this.endpoint
            //     this.delay = this.delay_10_time
            // }else{
            //     this.endpoint = endpoint
            //     this.delay = this.delay_all_time
            // }

            // if(this.is_10_time && this.imfetch_time >= 10){
            if(this.imfetch_time >= 11){
                // console.log("is_10_time",this.imfetch_time)
                endpoint = this.endpoint
                // url = this.url
                // this.delay = this.delay_10_time
                this.delay = getRandomInt(30,45)*1000
            }else{
                this.endpoint = endpoint
                // this.url = url
                this.delay = this.delay_all_time
            }
 
            let route = 'https://webcast.tiktok.com/webcast/im/fetch/'
            let  { url: targetUrl, xbogus, _signature, is_retry} = await br.buildUrlPageFull({url: `${route}?${endpoint}`, msToken})
            if(is_retry){
              await delay(500)
              return r(await this.fetch())
            }
              
               url = targetUrl
            //   console.log("url",url)
               var options = {
                proxy_list: this.proxy_list,
                proxy:  parserProxyString(this.proxy),
                'method': 'GET',
                timeout,
                'url':  url,
                'headers': {
                    'Accept': '*/*',
                    'Accept-Language': 'en-US,en;q=0.9',
                    'Connection': 'keep-alive',
                    'Cookie': cookie_string,
                    "priority":"u=1, i",
                    "b": cookie_string,
                    'Origin': 'https://www.tiktok.com',
                    'Referer': 'https://www.tiktok.com',
                    'Sec-Fetch-Dest': 'empty',
                    'Sec-Fetch-Mode': 'cors',
                    'Sec-Fetch-Site': 'same-origin',
                    'User-Agent': userAgentDefault,
                    'content-type': 'application/x-www-form-urlencoded; charset=UTF-8',
                    'sec-ch-ua': '"Chromium";v="134", "Not:A-Brand";v="24", "Google Chrome";v="134"',
                    'sec-ch-ua-mobile': '?0',
                    'sec-ch-ua-platform': '"macOS"',
                    "dnt": "1",
                    'x-secsdk-csrf-token': 'DOWNGRADE'
                },
                isRetry: true,
                retryTime: 2,
                preCheckRetry: (body, jsonBody)=>{
                  if (!body||!body.includes(`wrss`)) {
                    // console.log("retry request")
                    return true;   
                  }
                }
                };
                // console.log("fetch",this.last_rtt ,url )
                this.last_time = Date.now()

                // let data_page = await helper.makeRequest(options);
                options.url = "https://www.facebook.com"
                let data_page = await this.makeRequest(options);
                 data_page = {
                    error: null,
                    body: `51747409464991_7505066496305922839_1_1_1747405431593_0� �����2*�fetch_time:1747409464991|start_time:1747409195052|ack_ids:,,|fetch_id:7505066496305922839|flag:0|seq:4|next_cursor:1747409464991_7505066496305922839_1_1_1747405431593_0|wss_info:0-1747409462536-0-0`,
                    bodyBinary: "",
                    headers: {},
                    status: 200 
                }
                this.imfetch_time = 11
                // options = {
                //   url,
                //   useragent: userAgentDefault,
                //   proxyUrl: this.proxy,
                //   cookie_string: cookie_string,
                // }
                // let data_page = await helper.requestCURL(options);
                // console.log(data_page.body)
                data_page.bodyBinary = data_page.bodyBinary || Buffer.from(data_page.body, 'utf8')
                if(data_page.body){
                  let hex = data_page.bodyBinary.toString('hex');
                  let idHexServer = helper.getString(hex, "a181", "6720")||helper.getString(hex, "b181", "6720")||helper.getString(hex, "c181", "6720")
                  if(!this.idHexServer){
                    this.idHexServer = idHexServer
                  }
                
                }

                let that = this;
                function updateCookie(){
                  if(data_page.headers && data_page.headers['set-cookie']&& data_page.headers['set-cookie'].length){
                    let new_cookie = data_page.headers['set-cookie'].map(i=>{
                      let msToken = getString(i, 'msToken=', ';') 
                      if(msToken){
                        that.cookie_string = cookie_string.replace(/msToken=[^;]+/g, `msToken=${msToken}`)
                        return `msToken=${msToken}`
                      }
                    })
                 
                  }
                } 
                updateCookie()

                this.last_rtt = Date.now() - this.last_time
              // await br.initCookiesPageSign({cookies: helper.parserCookieString(cookie_string)})
            // let result = await br.fetchPageSign({
            //   // link: `${route}?${endpoint}&X-Bogus=${this.xbogusFetch.xbogus}`,
            //   link: `${url}`,
            //   cookie: cookie_string,
            //   // device_id: this.device_id,
            //   parser: true,
            //   returnData: true,
            // })
            // let data_page = { body: result.result}
              if(data_page.error){
                // console.log(data_page.error)
              }
          function Wrss (data){
            let [ t , w] = data.match(/wrss(.*?):/) || [ ]
            w = w || ""
            return w.slice(2,45)
          }
          function getData(split, current, is_last_time) {
            split = split || [];
            current = current || split.length - 1;
        
            if (is_last_time) current = 0;
        
            while (current >= 0) {
                if (split[current].includes("fetch_time")) {
                    return split[current];
                }
                current--;
            }
        
            return "";
        }
            function getDataold(split, current, is_last_time){
              split = split || []
              
              current = current || split.length-1;
              if(is_last_time)  current = 0
              if(current == -1) return ""
              if(split[current].includes("fetch_time")) return split[current]
              // if(current == 1) {
              //   if(split[current].includes("fetch_time")) return split[current]
              // }
              return getData(split, current -1, current- 1 == 0)
            }
            function getWrss(split, current){


              split = split || []
              current = current || split.length-1;
              if(current == -1) return ""
              if(split[current].includes("wrss")) {
                return helper.getString(split[current], "+", "RLwss")
              }
              if(current == 1) {
                if(split[0].includes("wrss")) {
                  return helper.getString(split[0], "+", "RLwss")
                } 
                return ""
              }
              return getWrss(split, current -1)
            }
            function getHistoryComment(split){
              let history_comment = ""
              for(let i = 0; i < split.length; i++){
                if(split[i].includes("ws_proxy")) {
                  history_comment = split[i].slice(-19);
                }
              }
              history_comment = history_comment.replace(/\D/g, "");
              return history_comment
            }
             if(!done){
                done = true;
                if(data_page.error){
                  console.log("error fetch",this.session_id, data_page.error, this.proxy)
                }
                if(data_page.status == 403){
                  console.log("fetch 403",this.session_id, this.proxy)
                  this.send403Rabbit(this.proxy)
                   throw new Error( "Request failed with status code 403")
                }

                if ( data_page.body && data_page.body.length) {
                    let split = data_page.body.split('\n')
                    let wrss = Wrss(data_page.body)

                    wrss= wrss.replace(":", "")
                    if(wrss){
                      this.wrss= wrss
                    }
                    let str = getData(split)
                    let ext = getString(str, 'fetch_time').replace('0\x01:&', '').replace(/\x01/g, "").replace(":\t", "")
                    let cursor  = getString(ext, 'next_cursor:', '|').replace('\x01:&', '')
                    if(! this.history_comment_cursor){
                      this.history_comment_cursor = getHistoryComment(split)
                    }
                    if(this.setCursor){
                      ext = ext.replace(/:3$/, "");
                      ext = ext.endsWith("00") ? ext.replace(/0$/, "") : ext
                      this.internal_ext = 'fetch_time' + ext
                      this.cursor = cursor
                    }
                    // this.cursor = cursor
                    // console.log("ext",this.session_id,ext)
      
                    // console.log(this.session_id, "wrss:", this.wrss)
                  }
                  if(false){
                    this.internal_ext = ""
                    this.cursor = ""
                    if(!is_last_time) {
                        this.last_time = 0
                    }
                  }
                  let result = { is_403: data_page.status == 403,is_fetch: true, process_time: Date.now() - start, start};
                  this.fetch_403 = data_page.status == 403
                return r(result)
            }


        } catch (error) {
          console.log("error",error)
            if(error.message == "Request failed with status code 403" ){
                this.internal_ext = ""
                this.cursor = ""
                this.last_time = 0

            }
            // console.log("error call fetch",this.session_id, error.message)

            this.url = ""
            let result =  { is_403: error.message == "Request failed with status code 403" ? true: false, is_fetch: true, error: error.message, process_time: Date.now() - start, start}
            this.fetch_403 = error.message == "Request failed with status code 403" ? true: false

            return r(result)
        }

    })
 }

}

module.exports = Clone
