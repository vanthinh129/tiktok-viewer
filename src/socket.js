const WebSocketClient = require('websocket').client;
const protobufjs = require('protobufjs');
const tunnel = require('tunnel');
const fs = require('fs');
const path = require('path');
const util = require('node:util');
// const BufferList = require('bl');
const zlib = require('node:zlib');
const helper = require('./helper.js');
const unzip = util.promisify(zlib.unzip);
const crypto =require("crypto");
const textEncoder = new TextEncoder();

const { WebcastImEnterRoomMessage, createBaseWebcastPushFrame, HeartbeatMessage} = require('./tiktok.schema.js');
let tiktokSchemaPath = require.resolve('./tiktok.proto');
// const RabbitMQ = require(path.resolve("RabbitMQ.lib"))
let tiktokSchema = null;
let config = {
    skipMessageTypes: []
};
const userAgentDefault =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36';

class TikTokSocket {

    constructor(data) {
        let { cookie_string, proxy_string, useragent, isShowComment, onMessage, isShowLog, reconnect_after_time, task_id, server_site, wrss, clone } = data;
        this.cookie_string = cookie_string || "";
        this.onMessage = onMessage;
        this.clone = clone
        this.room_id = clone.room_id
        this.wrss = wrss;
        this.isShowLog= isShowLog;
        this.task_id= task_id || "";
        this.sessionid = helper.getString(this.cookie_string + ";", "sessionid=", ";")
        this.isShowComment = isShowComment

         
        let p = helper.getString(this.cookie_string+";", "proxy=",";")
        if(p ){
            this.cookie_string = this.cookie_string.replace("proxy="+p,"")
        }
        this.proxy_string = proxy_string || p;
        this.useragent = userAgentDefault;
        this.appversion = this.useragent.replace("Mozilla/", "");
        this.browser_platform = helper.getString(this.useragent, "(", ")")
        this.retryTime = 5;
        this.retryTimeMax = 0;
        this.retryTimeFull = 5;
        this.retryTimeMaxFull = 10000;
        this.socketConnected = false;
        this.connection = null;
        this.closed = false;
        this.is_101 = false;
        this.reconnect_after_time = reconnect_after_time || helper.getRandomInt(8*60, 10*60)*1000
        this.reconnect_after_time = -1;//reconnect_after_time || helper.getRandomInt(7*60, 10*60)*1000
        // this.reconnect_after_time = reconnect_after_time || helper.getRandomInt(10, 20)*1000
        this.time_connected = 0
        this.is_first_connected = true;
        this.server_site = server_site || "tt1"
        // this.rabbitService = await RabbitMQ.getInstance({url: "amqp://bupmat:bupmat@185.190.140.88:5672/"+this.server_site+"?heartbeat=60"});

    }
    async fetchs(){
        await helper.delay(300)
            for(let i = 0 ; i < 1; i ++){
                this. clone.internal_ext = "-"

                let res = await this. clone.fetch()
                await helper.delay(1000)

            }
    }
    sendHeartbeat(room_id) {
        // Create the heartbeat
        const hb = HeartbeatMessage.encode({ roomId: room_id });
        // Wrap it in the WebcastPushFrame
        const webcastPushFrame = (0, createBaseWebcastPushFrame)({
            payloadEncoding: 'pb',
            payloadType: 'hb',
            payload: hb.finish(),
            service: undefined,
            method: undefined,
            headers: {}
        });
        return Buffer.from(webcastPushFrame.finish())
    }
    messageSwitchRooms(roomId) {
        const imEnterRoomMessage = WebcastImEnterRoomMessage.encode({
            roomId: roomId,
            roomTag: '',
            liveRegion: '',
            liveId: '12',
            identity: 'audience',
            cursor: '',//this.clone.cursor || '',
            accountType: '0',
            enterUniqueId: '',
            filterWelcomeMsg: '0',
            isAnchorContinueKeepMsg: false
        });
        const webcastPushFrame = (0, createBaseWebcastPushFrame)({
            payloadEncoding: 'pb',
            payloadType: 'im_enter_room',
            payload: imEnterRoomMessage.finish()
        });
        return Buffer.from(webcastPushFrame.finish())
    }
    sendAck({ logId, protoMessageFetchResult: { internalExt } }) {
        // Always send an ACK for the message
        if (!logId) {
            return;
        }
        const webcastPushFrame = (0, createBaseWebcastPushFrame)({
            logId: logId,
            payloadEncoding: 'pb',
            payloadType: 'ack',
            payload: textEncoder.encode(internalExt)
        });
        return Buffer.from(webcastPushFrame.finish())
    }
    async switchRoom({room_id, proxy}){
        let that = this
        if(that.room_id == room_id){
            return true
        }
        console.log(`Switching to room: ${room_id}`);
        that.clone.room_id = room_id
        that.room_id = room_id
        if(proxy){
            that.clone.proxy = proxy
            that.clone.proxy_list = [proxy]
        }
        try {
            await that.clone.callApi({type: "enter"});
            if(that.socketConnected && that.connection) {
                let hb_first = that.sendHeartbeat(that.room_id)
                    that.connection.sendBytes(hb_first);
                    await helper.delay(1000)
                    that.connection.sendBytes(that.messageSwitchRooms(that.room_id));
                    console.log(`Switch room message sent for room: ${room_id}`);
                    console.log(`Switch room message (base64): ${that.messageSwitchRooms(that.room_id).toString('base64')}`);
            }
            
            return true;
        } catch(e) {
            console.log("switchRoom error", e);
            return false;
        }
    }
    async connect({ room_id }) {
        let that = this
        that.room_id = room_id
        if(this.closed){
            return false
        }
        that.alive = true;
        that.start = Date.now();
            // await this.clone.checkCookieLive()
        if(!this.clone.is_cookie_live){
            this.retryTime = 0;
            this.retryTimeMax = 0;
            this.retryTimeFull = 0;
            console.log("Cookie die")
            return false
        }
        let res1 = await this.clone.callApi({type: "enter"})
        // console.log("ENTER")
        this.enter = true
        this.clone.setCursor  = true
        let res = await this. clone.fetch()
        this.lastFetch = Date.now();
        this.wrss = this.clone.wrss

        this.internal_ext = this.clone.internal_ext
        this.cursor = this.clone.cursor
        let result =  await new Promise(async(r) => {
            console.log("start socket", (new Date().toLocaleString()))

            await helper.delay(30000)
            if(that.cookie_string.includes("proxy_socket")){
                that.proxy_string = helper.getString(that.cookie_string+";", "proxy_socket=",";")
            }else{
            }
            try {
                let tunnelingAgent
                let options = {
                    tlsOptions: {
                    },
                    // maxReceivedFrameSize: 1*1024,
                    // maxReceivedMessageSize: 0.001*1024,
                    // maxPayload: 1
                    // fragmentationThreshold: 1
                }
                if (that.proxy_string) {
                    tunnelingAgent = tunnel.httpsOverHttp(helper.parseProxy(that.proxy_string));
                    options.tlsOptions.agent = tunnelingAgent

                }
                const client = new WebSocketClient(options);
                that.client = client

                // console.log(that.client)
                client.on('connectFailed', async function (error) {
                    error = error.message || error.toString()
                    if (error.includes("Server responded with a non-101 status: 200 OK")) {
                        error = "Server responded with a non-101 status: 200 OK"
                        that.is_101 = true
                        if(that.retryTime < that.retryTimeMax){
                            that.retryTime = that.retryTimeMax -1;
                        }
                        try{
                            helper.sendMessageTele403(`${that.sessionid} - 101`);
                        }catch(e){}
                        
                    }
                    if(that.isShowLog)
                    console.log(that.sessionid, 'connectFailed Error: ' + error,(new Date().toLocaleString()));
                    that.socketConnected = false
                    // await helper.delay(that.getRandomInt(1500, 2500))
                    r(false)
                });

                client.on('connect',async function (connection) {
                    that.connection = connection
                    that.time_connected = Date.now();
                    if (!that.socketConnected) that.socketConnected = true;
      
                    that.retryTime = 0
                  
                    if(that.isShowLog)
                    console.log(that.sessionid, 'WebSocket Client Connected',(new Date().toLocaleString()));
          
                    connection.on('error', function (error) {
                        if(that.isShowLog)
                        console.log(that.sessionid, "Connection Error: " + error.toString(),(new Date().toLocaleString()),that.proxy_string);
                        that.socketConnected = false
                        // await helper.delay(that.getRandomInt(1500, 2500))
                        r(false)
                    });
                    connection.on('close',async function () {
                        if(that.isShowLog)
                        console.log(that.sessionid, 'echo-protocol Connection Closed',(new Date().toLocaleString()));
                        that.socketConnected = false
                        console.log(that.sessionid, "Close", Date.now()- that.start)
                        that.wrss = null
                        that.clone.wrss = ""
                        that.clone.internal_ext = ""
                        that.clone.cursor = ""
                        clearInterval(that.inter)
                            let proxies = helper.getProxySite(120)
                              proxies = helper.shuffle(proxies)
                              that.proxy_string = proxies[Math.floor(Math.random()*proxies.length)]
                        await helper.delay(that.getRandomInt(1500, 2500))
                        r(false)
                    });
                    connection.on('message', async function (message) {
                        if(!that.logged){
                            that.logged = true
                            console.log("Socket success", that.clone.username, (new Date().toLocaleString()))
                        }
                    });
                    async function _sendPing2() {
                        let randomNum = 10000;
                        await helper.delay(randomNum)
                        if (that.socketConnected) {
                            connection.sendBytes(that.sendHeartbeat(that.room_id));
                        }
                        if (that.alive) _sendPing2()
                    }
                    let hb_first = that.sendHeartbeat(that.room_id)
                    await helper.delay(1000)
                    connection.sendBytes(that.messageSwitchRooms(that.room_id));
                    _sendPing2()
                });
                const headers = {
                    'Cookie': that.cookie_string,
                    'Connection': 'Upgrade',
                    'Host': 'webcast16-ws-alisg.tiktok.com',
                    "Pragma": "no-cache",
                    "Cache-Control": "no-cache",
                    "Origin": "https://www.tiktok.com",
                    "Sec-WebSocket-Version": 13,
                    "Accept-Encoding": "gzip, deflate, br, zstd",
                    "Accept-Language": "vi,en-US;q=0.9,en;q=0.8,vi-VN;q=0.7",
                    "Sec-WebSocket-Key": "KC6vxWiLylwUJpDshtNRAQ==",
                    "Sec-WebSocket-Extensions": "permessage-deflate; client_max_window_bits",
                    'User-Agent': that.useragent,
                };

                let option = {}
                if (tunnelingAgent) {
                    option.agent = tunnelingAgent
                }
                client.connect(that.createUrl({ room_id }), null, null, headers, option);

            } catch (e) {
                console.log("error connect:", e)
                return r(false)
            }
        })
        
        if (!result) {
            if(this.closed){
                return false
            }else if (that.retryTimeFull > that.retryTimeMaxFull) {
                if(that.isShowLog)
                console.log(that.sessionid, "Retry  maxfull  time", that.retryTime)
                return false
            }else if (that.retryTime <= that.retryTimeMax-1) {
                this.retryTime++;
                this.retryTimeFull++;
                await helper.delay(2000)
                if(that.isShowLog)
                console.log(that.sessionid, "Retry connect time", that.retryTime
                    // , that.proxy_string
                    )
                return await this.connect({ room_id });
            } else {
                if(that.isShowLog)
                console.log(that.sessionid, "Retry  max  time", that.retryTime)
                return false
            }
        } else {
            return true
        }
    }
    close() {
        this.alive = false
        this.retryTime = this.retryTimeMax;
        this.closed = true;
        if (this.socketConnected) {
            this.connection.close();

        }
        if(this.isShowLog)
        console.log(this.sessionid, "close done")

    }
    cancel() {
        this.alive = false
        this.retryTime = this.retryTimeMax;
        this.closed = true;
        try{
            this.clone.callApi({type:"leave"})
            this.client.abort();
        }catch(e){

        }
        try{
            this.connection.close();
        }catch(e){

        }
        if(this.isShowLog)
        console.log(this.sessionid, "close done")
    }
    disconnect() {
        if (this.socketConnected) {
            this.connection.close();

        }
        if(this.isShowLog)
        console.log(this.sessionid, "Stop by human")

    }
    createUrl({ room_id }) {
        let browser_version = encodeURI(this.appversion)
        let res = `wss://webcast16-ws-alisg.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=${this.browser_platform}&browser_version=${browser_version}&compress=gzip&cookie_enabled=true&cursor=${""}&debug=false&device_platform=web&heartbeatDuration=0&host=https%3A%2F%2Fwebcast.tiktok.com&identity=audience&imprp=&internal_ext=&live_id=12&room_id=` + room_id + `&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&update_version_code=2.0.0&version_code=270000&webcast_sdk_version=2.0.0&wrss=` + (this.wrss ? this.wrss : helper.generateRandomString(43))

        res =  `wss://webcast16-ws-alisg.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=${this.clone.browser_platform}&browser_name=Mozilla&browser_version=${browser_version}&browser_online=true&tz_name=Asia/Saigon&app_name=tiktok_web&sup_ws_ds_opt=1&version_code=270000&update_version_code=2.0.0&compress=gzip&wrss=${this.wrss ? this.wrss : helper.generateRandomString(43)}&host=https://webcast.tiktok.com&aid=1988&live_id=12&debug=false&app_language=vi-VN&client_enter=1&room_id=${room_id}&identity=audience&history_comment_count=6&heartbeat_duration=0&last_rtt=${this.clone.last_rtt}&internal_ext=${this.internal_ext}&cursor=${this.cursor}&resp_content_type=protobuf&did_rule=3&webcast_language=vi-VN`
        return res
    }
    
}
module.exports = TikTokSocket