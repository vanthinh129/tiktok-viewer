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
        this.wrss = wrss;
        this.isShowLog= isShowLog;
        this.task_id= task_id || "";
        this.sessionid = this.getString(this.cookie_string + ";", "sessionid=", ";")
        this.isShowComment = isShowComment

         
        let p = helper.getString(this.cookie_string+";", "proxy=",";")
        if(p ){
            this.cookie_string = this.cookie_string.replace("proxy="+p,"")
        }
        this.proxy_string = proxy_string || p;
        this.useragent = userAgentDefault;
        this.appversion = this.useragent.replace("Mozilla/", "");
        this.browser_platform = this.getString(this.useragent, "(", ")")
        this.retryTime = 5;
        this.retryTimeMax = 0;
        this.retryTimeFull = 5;
        this.retryTimeMaxFull = 10000;
        this.socketConnected = false;
        this.closed = false;
        this.is_101 = false;
        this.reconnect_after_time = reconnect_after_time || this.getRandomInt(8*60, 10*60)*1000
        this.reconnect_after_time = -1;//reconnect_after_time || this.getRandomInt(7*60, 10*60)*1000
        // this.reconnect_after_time = reconnect_after_time || this.getRandomInt(10, 20)*1000
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
    async connect({ room_id }) {
        let that = this
        if(this.closed){
            return false
        }
        let max = 3;
        let proxy_list = []
        for(let i = 0 ; i < max; i ++){
            proxy_list.push( "http://babalili121415-zone-resi-region-vn-session-"+helper.generateRandomHex(12)+"-5:Tabdajkhsdf13235@b35301d43d682c1a.xuw.as.pyproxy.io:16666")
        }
        let p = "http://babalili121415-zone-resi-region-vn-session-"+helper.generateRandomHex(12)+"-5:Tabdajkhsdf13235@b35301d43d682c1a.xuw.as.pyproxy.io:16666"
        // proxy_list = [that.proxy_string]
        // p = that.proxy_string
        that.alive = true;
        // let res1 = await this.clone.callApi({type: "enter"})
        //     console.log("ENTER")
     
        // this.clone = new Clone({cookie_string: this.cookie_string, room_id, proxy: p, proxy_list})
        // if(
        // //     // that.is_101 && 
        //     !this.wrss ||  this.lastFetch < (Date.now() - 5 * 60000)) {
        // console.log("proxy_string",that.proxy_string)
        that.start = Date.now();
            if(true){

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
            }
        
            // await this.clone.runFetchs()
            // await helper.delay(100000000)
            // return
            this.clone.setCursor  = true
            if(true){
                let res = await this. clone.fetch()
                this.lastFetch = Date.now();
                this.wrss = this.clone.wrss

                this.internal_ext = this.clone.internal_ext
                this.cursor = this.clone.cursor
              
            //    res =   this. clone.fetch()


            }

    
        // this.fetchs()
        // }

        // setTimeout(()=>{
        //     if(that.isShowLog)
        //     console.log("Force reconnect")
        //     that.disconnect()
        // },5* 60000)
        let result =  await new Promise(async(r) => {
            console.log("start socket", (new Date().toLocaleString()))

            await helper.delay(30000)
            // that.proxy_string = "KAOjQTal:3Vo2GjD2@92.112.111.248:35200"
            // that.proxy_string = "5Yvg7Ebz:DUvvwcSw@193.160.216.151:62446"
            // that.proxy_string = "UGCyfu:pLOaUI@200.229.24.222:33061"// topproxy
            // that.proxy_string = "c67r:c67r@160.187.120.106:41969"// topproxy
            
            // that.proxy_string = "156.248.84.248:3129"//webshare
            // that.proxy_string = "khljtiNj3Kd:fdkm3nbjg45d@42.112.113.52:21232"
            that.proxy_string = helper.getString(that.cookie_string+";", "proxy_socket=",";")
            console.log("that.proxy_string", that.proxy_string)
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
                    tunnelingAgent = tunnel.httpsOverHttp(that.parseProxy(that.proxy_string));
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

                        // let res = await helper.makeRequest({url: `http://217.15.163.20:8549/api/cron/getliveproxies?authensone=mysonetrend&time=1000`})
                            //   let proxies = res.bodyJson.proxies
                            let proxies = helper.getProxySite(120)
                              proxies = helper.shuffle(proxies)
                              that.proxy_string = proxies[Math.floor(Math.random()*proxies.length)]
                        await helper.delay(that.getRandomInt(1500, 2500))
                        r(false)
                    });
                    connection.on('message', async function (message) {
                        if(!that.logged){

                            that.logged = true
                          console.log("Socket success", that.clone.username, room_id, (new Date().toLocaleString()))
                        }
                        let mes = await that.deserializeWebsocketMessage(message.binaryData)
                        // if(mes?.webcastResponse?.internalExt&& mes.webcastResponse.internalExt !=="-"){

                            // console.log("message",mes?.webcastResponse?.cursor)

                        // }
                        if (!that.socketConnected) that.socketConnected = true;
                        try {
                            let c1 = false;
                            let c2 = false;
                            let c3 = false;
                            let data = message.binaryData.toString("hex");
                            let utf = message.binaryData.toString("utf8");
                            if(utf.includes("compress_type")){
                                c1 = data.slice(0,2);
                                c2 = data.slice(4,6);
                                c3 = data.slice(6,8);
                                let idServer 
                                if(c1 == "08" && c2 == "10" &&  c3!=="10"){
                                    idServer   = data.slice(6,24)
                                }
                                if( c1 == "08" && c2 !== "10" &&  c3=="10"){
                                    idServer   = data.slice(8,26)

                                }

                                if(true){
                                      
                                        let message
                                        if(mes?.webcastResponse?.internalExt?.includes("push_time")){
                                            // message =  createMessageAckServer(idServer, mes.webcastResponse.internalExt)
                                            if(!message){
                                                message  = createMessageClientACK(idServer);

                                            }
                                        }else if(mes?.webcastResponse?.internalExt == "-"){ 
                                            message  = createMessageClientACK(idServer);

                                        }
                                        if(message)
                                        connection.sendBytes(message);
                                
                                 
                                }
                            }

                        } catch (err) {
                            console.log("error", err)
                        }

                        
                    });


          
                    let seq =1 

                    const createImEnterHexMessage = () => {
                        // Phần header cố định
                        const header = '320270623a0d696d5f656e7465725f726f6f6d42540';
                      
                        // Random 8 bytes hoặc có thể từ timestamp nếu cần
                        let random8Bytes =  that.clone.idHexServer
                        
                        // Phần giữa cố định
                        const midfix =  (that.clone.part || "68")+'200c2a0861756469656e63653235';
                      
                        // Chuyển ID thành hex
                        const idWithSuffix = that.clone.cursor   // Thêm "_08" vào ID trước khi mã hóa
                        const idHex = Buffer.from(idWithSuffix, 'utf8').toString('hex');
                      
                        // Phần kết thúc cố định
                        const suffix = '38004a01305000';
                        
                        // Kết hợp tất cả lại thành một gói message
                        let messageHex =  header + random8Bytes + midfix + idHex + suffix;
                    
                        let message =Buffer.from(messageHex,"hex")
                        // console.log("createImEnterHexMessage", message.toString(),message.toString('hex') )
                        return message
                      };
                    // connection.sendBytes(Buffer.from(createHexMessage(that.clone.cursor),"hex"));
                    function createMessageClientACK (idServer){
                        let mid =   Number((Date.now()+"").slice(3));
                        let sub = "320270623a0361636b42012d"
                        if(! idServer)return
                        
                        let hex = "10"+idServer+sub
                        let idHex = Buffer.from(hex, 'hex')


                        // console.log("ClientACK",hex, idHex.toString  ("utf8"))
                        return idHex
                    }

                function createMessageAckServer (idHexServer, jsonData){
                    let headerHex = "10"+idHexServer+"320270623a0361636b42";
                
                    let json = JSON.parse(jsonData)
                        if(json.msg_type == "o"){
                                headerHex += "70"
                        }else
                        if(Number(json.seq_id)>= 1000){
                            headerHex += "73"
                        }else if(Number(json.seq_id)>= 100){
                            headerHex += "72"

                        }else if(Number(json.seq_id)>= 10){
                            headerHex += "71"

                        }else {
                            headerHex += "70"
                        }



                        jsonData = JSON.stringify(json)
               
                    // 3️⃣ Chuyển JSON sang buffer, rồi encode thành HEX
                    const jsonHex = Buffer.from(jsonData, "utf8").toString("hex");
                    // 4️⃣ Kết hợp header + json
                    const finalHex = headerHex + jsonHex;
                    
                    let message =  Buffer.from(finalHex, "hex")
                    console.log("AckServer",finalHex, message.toString("utf8"))
                    return message
                }
                    async function _sendPing2() {
                        let randomNum = 10000;//that.getRandomInt(2000, 6000)
                        await helper.delay(randomNum)
                        if(that.socketConnected){
                            connection.sendBytes(createMessageClientHBFirst());
                        }
                        // setTimeout(() => { if (that.alive) _sendPing2() }, randomNum);
                        if (that.alive) _sendPing2()
                    }
                    function createMessageClientHBFirst (){
                        let header = "320270623a026862420a0"
    
                        // console.log("idHexServer", that.clone.idHexServer)
                        let hex = header + that.clone.idHexServer + (that.clone.part ||"68")
                        let idHex = Buffer.from(hex, 'hex')
                        // console.log("ClientHB", hex,idHex.toString  ("utf8"))
                        return idHex
                    }

                    connection.sendBytes(createMessageClientHBFirst());
                    connection.sendBytes(createImEnterHexMessage());
                    _sendPing2()
                    // that.inter = setInterval(() => {
                    //     connection.sendBytes(createMessageClientHBFirst());

                    // },10000)
                        
                    
          

             
                    let id = 1

                    

               


   
                
                
          
                

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
                // await helper.delay(that.getRandomInt(1500, 2500))
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
        //webcast16-ws-useast5.us.tiktok.com
        let browser_version = encodeURI(this.appversion)

        let res =  `wss://webcast16-ws-alisg.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=${this.clone.browser_platform}&browser_name=Mozilla&browser_version=${browser_version}&browser_online=true&tz_name=Asia/Saigon&app_name=tiktok_web&sup_ws_ds_opt=1&version_code=270000&update_version_code=2.0.0&compress=gzip&wrss=${this.wrss ? this.wrss : this.generateRandomString(43)}&host=https://webcast.tiktok.com&aid=1988&live_id=12&debug=false&app_language=vi-VN&client_enter=1&room_id=${room_id}&identity=audience&history_comment_count=6&heartbeat_duration=0&last_rtt=${this.clone.last_rtt}&internal_ext=${this.internal_ext}&cursor=${this.cursor}&resp_content_type=protobuf&did_rule=3&webcast_language=vi-VN`
        // let res =  `wss://webcast16-ws-alisg.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=en-US&browser_platform=${this.clone.browser_platform}&browser_name=Mozilla&browser_version=${browser_version}&browser_online=true&tz_name=Asia/Saigon&app_name=tiktok_web&sup_ws_ds_opt=1&version_code=270000&update_version_code=2.0.0&compress=gzip&webcast_language=en&wrss=${this.wrss ? this.wrss : this.generateRandomString(43)}&ws_direct=0&aid=1988&live_id=12&app_language=en&client_enter=1&room_id=${room_id}&identity=audience&history_comment_count=6&heartbeat_duration=0&last_rtt=${this.clone.last_rtt}&internal_ext=${this.internal_ext}&cursor=${this.cursor}&resp_content_type=protobuf&did_rule=3`
        // console.log("res",res)
        return res
        //wss://webcast16-ws-useast1a.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F106.0.0.0+Safari%2F537.36&cookie_enabled=true&cursor=1744462589876_7492409661476306973_1_1_7492405984984310405_0&internal_ext=fetch_time%3A1744462589876%7Cstart_time%3A0%7Cack_ids%3A%2C%2C%7Cflag%3A0%7Cseq%3A1%7Cnext_cursor%3A1744462589876_7492409661476306973_1_1_7492405984984310405_0%7Cwss_info%3A0-1744462589876-0-0&device_platform=web&focus_state=true&from_page=user&history_len=0&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&host=https%3A%2F%2Fwebcast.tiktok.com&webcast_sdk_version=2.0.0&update_version_code=2.0.0&room_id=7492405931744529173&compress=gzip&wrss=fDNfcXEVrip-lSKL9VX_ZqAmHxmVv0RmHh33bE9oAM4&imprp=&version_code=180800
    }
    getRandomInt(min, max) {
        min = Math.ceil(min);
        max = Math.floor(max);
        return Math.floor(Math.random() * (max - min) + min);
    }
    generateRandomString(length) {
        let result = '';
        const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';
        const charLen = characters.length;

        for (let i = 0; i < length; i++) {
            const randomNum = this.getRandomInt(0, charLen - 1)
            result += characters.charAt(randomNum);
        }

        return result;
    }
    parseProxy(proxy_string) {
        var proxy_data = {
            proxy: {
                host: '',
                port: ''
            }
        }
        var proxy_array = proxy_string.replace('http://', '').replace('@', ':').split(':');
        if (proxy_array.length == 4) {
            proxy_data = {
                proxy: {
                    host: proxy_array[2],
                    port: parseInt(proxy_array[3]),
                    proxyAuth: `${proxy_array[0]}:${proxy_array[1]}`
                }
            };
        } else if (proxy_array.length == 2) {
            proxy_data = {
                proxy: {
                    host: proxy_array[0],
                    port: parseInt(proxy_array[1])
                }
            };
        }
        return proxy_data
    }

    loadTikTokSchema() {
        if (!tiktokSchema) {
            tiktokSchema = protobufjs.loadSync(tiktokSchemaPath);
        }
    }

    serializeMessage(protoName, obj) {
        this.loadTikTokSchema();
        return tiktokSchema.lookupType(`TikTok.${protoName}`).encode(obj).finish();
    }

    deserializeMessage(protoName, binaryMessage) {
        this.loadTikTokSchema();
        var webcastData = tiktokSchema.lookupType(`TikTok.${protoName}`).decode(binaryMessage);

        if (protoName === 'WebcastResponse' && Array.isArray(webcastData.messages)) {
            // Contains different object structures depending on the type field
            webcastData.messages.forEach(message => {
                if (config.skipMessageTypes.includes(message.type)) {
                    return;
                }

                switch (message.type) {
                    case 'WebcastControlMessage':
                    case 'WebcastRoomUserSeqMessage':
                    case 'WebcastChatMessage':
                    case 'WebcastMemberMessage':
                    case 'WebcastGiftMessage':
                    case 'WebcastSocialMessage':
                    case 'WebcastLikeMessage':
                    case 'WebcastQuestionNewMessage':
                    case 'WebcastLinkMicBattle':
                    case 'WebcastLinkMicArmies':
                    case 'WebcastLiveIntroMessage':
                    case 'WebcastEmoteChatMessage':
                    case 'WebcastEnvelopeMessage':
                    case 'WebcastSubNotifyMessage':
                        message.decodedData = tiktokSchema.lookupType(`TikTok.${message.type}`).decode(message.binary);
                        break;
                }
            });
        }

        return webcastData;
    }
    async deserializeWebsocketMessage(binaryMessage) {
        // Websocket messages are in an container which contains additional data
        // Message type 'msg' represents a normal WebcastResponse
        let decodedWebsocketMessage = this.deserializeMessage('WebcastWebsocketMessage', binaryMessage);

        if (decodedWebsocketMessage.type === 'msg') {
            let binary = decodedWebsocketMessage.binary; // Decompress binary (if gzip compressed)
            // https://www.rfc-editor.org/rfc/rfc1950.html

            if (binary && binary.length > 2 && binary[0] === 0x1f && binary[1] === 0x8b && binary[2] === 0x08) {
                decodedWebsocketMessage.binary = await unzip(binary);
            }

            decodedWebsocketMessage.webcastResponse = this.deserializeMessage('WebcastResponse', decodedWebsocketMessage.binary);
        }

        return decodedWebsocketMessage;
    }
    getPosition(string, subString, index) {
        return string.split(subString, index).join(subString).length
    }

    getString(test_str, text_begin, text_end, index) {
        var fromIndex = index || 1
        if (!test_str || test_str == '') {
            return ''
        }
        var start_pos = this.getPosition(
            test_str.toString(),
            text_begin,
            fromIndex
        )
        if (start_pos < 0 || start_pos == test_str.length) {
            return ''
        }
        start_pos += text_begin.length
        var end_pos = test_str.indexOf(text_end, start_pos)
        if (end_pos == -1) end_pos = test_str.length
        var text_to_get = test_str.substring(start_pos, end_pos)
        if (text_to_get == test_str) return ''
        return text_to_get;
    }
}


module.exports = TikTokSocket
