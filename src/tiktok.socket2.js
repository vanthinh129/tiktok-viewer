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
const { TikTokMessageBuilder } = require('./message_builder.js');

// let tiktokSchemaPath = require.resolve('../proto/src/webcast.proto');
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

        // Khởi tạo message builder
        this.messageBuilder = new TikTokMessageBuilder();

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
    async checkRoomChange({room_id}){
        let that = this
        let file_room_change_check = path.resolve("./room_change_check.json")
        /*
        định dạng file kiểu key là room cũ, value là room mới
            {
                "71236512631824122": "712651264216512412",
                "71236512631824123": "712651264216512413",
            }
        */
        try{
            if(fs.existsSync(file_room_change_check)){
                let data = JSON.parse(fs.readFileSync(file_room_change_check, "utf8"))
                if(data[room_id] && data[room_id] != room_id){
                    that.switchRoom(data[room_id])
                }
            }
        }catch(e){
            console.log("checkRoomChange error", e)
        }   
       
        // check file 
    }
    async switchRoom(room_id){
        let that = this
        this.clone.room_id = room_id
        this.clone.callApi({type: "enter"})
        this.clone.setCursor  = true
        let res = await this. clone.fetch()
        this.lastFetch = Date.now();
        this.wrss = this.clone.wrss

        this.internal_ext = this.clone.internal_ext
        this.cursor = this.clone.cursor
    }
    async connect({ room_id }) {
        let that = this
        if(this.closed){
            return false
        }
        that.alive = true;
        that.start = Date.now();
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

            // await helper.delay(30000)
            if(that.cookie_string.includes("proxy_socket")){
                that.proxy_string = helper.getString(that.cookie_string+";", "proxy_socket=",";")
            }else{
            }
            console.log("that.proxy_string", that.proxy_string)
            try {
                let tunnelingAgent
                let options = {
                    tlsOptions: {},
                }
                if (that.proxy_string) {
                    tunnelingAgent = tunnel.httpsOverHttp(that.parseProxy(that.proxy_string));
                    options.tlsOptions.agent = tunnelingAgent
                }
                const client = new WebSocketClient(options);
                that.client = client
                // console.log("ok1")
                client.on('connectFailed', async function (error) {
                    // console.log("ok3", error)
                    error = error.message || error.toString()
                    if (error.includes("Server responded with a non-101 status: 200 OK")) {
                        error = "Server responded with a non-101 status: 200 OK"
                        that.is_101 = true
                        if (that.retryTime < that.retryTimeMax) {
                            that.retryTime = that.retryTimeMax - 1;
                        }
                        try {
                            helper.sendMessageTele403(`${that.sessionid} - 101`);
                        } catch (e) { }
                    }
                    if (that.isShowLog)
                        console.log(that.sessionid, 'connectFailed Error: ' + error, (new Date().toLocaleString()));
                    that.socketConnected = false
                    r(false)
                });

                client.on('connect', async function (connection) {
                    // console.log("ok2")
                    that.connection = connection
                    that.time_connected = Date.now();
                    if (!that.socketConnected) that.socketConnected = true;

                    that.retryTime = 0

                    if (that.isShowLog)
                        console.log(that.sessionid, 'WebSocket Client Connected', (new Date().toLocaleString()));

                    connection.on('error', function (error) {
                        if (that.isShowLog)
                            console.log(that.sessionid, "Connection Error: " + error.toString(), (new Date().toLocaleString()), that.proxy_string);
                        that.socketConnected = false
                        r(false)
                    });

                    connection.on('close', async function () {
                        if (that.isShowLog)
                            console.log(that.sessionid, 'echo-protocol Connection Closed', (new Date().toLocaleString()));
                        that.socketConnected = false
                        console.log(that.sessionid, "Close", Date.now() - that.start)
                        that.wrss = null
                        that.clone.wrss = ""
                        that.clone.internal_ext = ""
                        that.clone.cursor = ""
                        clearInterval(that.inter)

                        let proxies = helper.getProxySite(120)
                        proxies = helper.shuffle(proxies)
                        that.proxy_string = proxies[Math.floor(Math.random() * proxies.length)]
                        await helper.delay(that.getRandomInt(1500, 2500))
                        r(false)
                    });

                    connection.on('message', async function (message) {
                        if (!that.logged) {
                            that.logged = true
                            console.log("Socket success", that.clone.username, room_id, (new Date().toLocaleString()))
                        }
                        let mes = await that.deserializeWebsocketMessage(message.binaryData)

                        if (!that.socketConnected) that.socketConnected = true;
                        try {
                            let c1 = false;
                            let c2 = false;
                            let c3 = false;
                            let data = message.binaryData.toString("hex");
                            let utf = message.binaryData.toString("utf8");
                            if (utf.includes("compress_type")) {
                                c1 = data.slice(0, 2);
                                c2 = data.slice(4, 6);
                                c3 = data.slice(6, 8);
                                let idServer
                                if (c1 == "08" && c2 == "10" && c3 !== "10") {
                                    idServer = data.slice(6, 24)
                                }
                                if (c1 == "08" && c2 !== "10" && c3 == "10") {
                                    idServer = data.slice(8, 26)
                                }

                                if (true) {
                                    let message
                                    if (mes?.webcastResponse?.internalExt?.includes("push_time")) {
                                        if (!message) {
                                            message = createMessageClientACK(idServer);
                                        }
                                    } else if (mes?.webcastResponse?.internalExt == "-") {
                                        message = createMessageClientACK(idServer);
                                    }
                                    if (message)
                                        connection.sendBytes(message);
                                }
                            }
                        } catch (err) {
                            console.log("error", err)
                        }
                    });

                    let seq = 1

                    // Tạo message heartbeat sử dụng TikTokMessageBuilder
                    const createMessageClientHBFirst = () => {
                        // console.log('Creating heartbeat message using TikTokMessageBuilder');
                        const heartbeatMessage = that.messageBuilder.createHeartbeatMessage(room_id);
                        return heartbeatMessage;
                    };

                    // Tạo message enter room sử dụng TikTokMessageBuilder
                    const createImEnterHexMessage = () => {
                        // console.log('Creating enter room message using TikTokMessageBuilder');
                        const enterRoomMessage = that.messageBuilder.createEnterRoomMessage(room_id, {
                            cursor: that.cursor || '',
                            liveId: '12',
                            identity: 'audience',
                            accountType: '0'
                        });
                        return enterRoomMessage;
                    };

                    function createMessageClientACK(idServer) {
                        if (!idServer) return null;
                        // Convert hex idServer to decimal logId
                        const logId = parseInt(idServer, 16).toString();
                        return that.messageBuilder.createAckMessage(logId, '-');
                    }

                    function createMessageAckServer(idHexServer, jsonData) {
                        let headerHex = "10" + idHexServer + "320270623a0361636b42";

                        let json = JSON.parse(jsonData)
                        if (json.msg_type == "o") {
                            headerHex += "70"
                        } else
                            if (Number(json.seq_id) >= 1000) {
                                headerHex += "73"
                            } else if (Number(json.seq_id) >= 100) {
                                headerHex += "72"
                            } else if (Number(json.seq_id) >= 10) {
                                headerHex += "71"
                            } else {
                                headerHex += "70"
                            }

                        jsonData = JSON.stringify(json)

                        const jsonHex = Buffer.from(jsonData, "utf8").toString("hex");
                        const finalHex = headerHex + jsonHex;
                        
                        let message = Buffer.from(finalHex, "hex")
                        console.log("AckServer", finalHex, message.toString("utf8"))
                        return message
                    }

                    async function _sendPing2() {
                        let randomNum = 10000;
                        await helper.delay(randomNum)
                        if (that.socketConnected) {
                            connection.sendBytes(createMessageClientHBFirst());
                        }
                        if (that.alive) _sendPing2()
                    }

                    let first_mess = createMessageClientHBFirst()
                    let enter_mess = createImEnterHexMessage()
                    connection.sendBytes(first_mess);
                    connection.sendBytes(enter_mess);
                    console.log("first_mess", first_mess.toString("base64"))
                    console.log("first_mess", enter_mess.toString("base64"))
                    _sendPing2()

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
                return r(false)
            }
        })
        
        if (!result) {
            if (this.closed) {
                return false
            } else if (that.retryTimeFull > that.retryTimeMaxFull) {
                if (that.isShowLog)
                    console.log(that.sessionid, "Retry  maxfull  time", that.retryTime)
                return false
            } else if (that.retryTime <= that.retryTimeMax - 1) {
                this.retryTime++;
                this.retryTimeFull++;
                await helper.delay(2000)
                if (that.isShowLog)
                    console.log(that.sessionid, "Retry connect time", that.retryTime)
                return await this.connect({ room_id });
            } else {
                if (that.isShowLog)
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
        if (this.isShowLog)
            console.log(this.sessionid, "close done")
    }

    cancel() {
        this.alive = false
        this.retryTime = this.retryTimeMax;
        this.closed = true;
        try {
            this.clone.callApi({ type: "leave" })
            this.client.abort();
        } catch (e) { }
        try {
            this.connection.close();
        } catch (e) { }
        if (this.isShowLog)
            console.log(this.sessionid, "close done")
    }

    disconnect() {
        if (this.socketConnected) {
            this.connection.close();
        }
        if (this.isShowLog)
            console.log(this.sessionid, "Stop by human")
    }

    createUrl({ room_id }) {
        let browser_version = encodeURI(this.appversion)
        let res = `wss://webcast16-ws-alisg.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?version_code=180800&device_platform=web&cookie_enabled=true&screen_width=1512&screen_height=982&browser_language=vi&browser_platform=${this.clone.browser_platform}&browser_name=Mozilla&browser_version=${browser_version}&browser_online=true&tz_name=Asia/Saigon&app_name=tiktok_web&sup_ws_ds_opt=1&version_code=270000&update_version_code=2.0.0&compress=gzip&wrss=${this.wrss ? this.wrss : this.generateRandomString(43)}&host=https://webcast.tiktok.com&aid=1988&live_id=12&debug=false&app_language=vi-VN&client_enter=1&room_id=${room_id}&identity=audience&history_comment_count=6&heartbeat_duration=0&last_rtt=${this.clone.last_rtt}&internal_ext=${this.internal_ext}&cursor=${this.cursor}&resp_content_type=protobuf&did_rule=3&webcast_language=vi-VN`
        return res
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
        let decodedWebsocketMessage = this.deserializeMessage('WebcastWebsocketMessage', binaryMessage);

        if (decodedWebsocketMessage.type === 'msg') {
            let binary = decodedWebsocketMessage.binary;

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
