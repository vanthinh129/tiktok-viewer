const WebSocketClient = require('websocket').client;
const protobufjs = require('protobufjs');
const tunnel = require('tunnel');
const fs = require('fs');
const path = require('path');
const util = require('node:util');
// const BufferList = require('bl');
const zlib = require('node:zlib');
const helper = require('./helper.js');
const Clone = require("./Clone.js")
const unzip = util.promisify(zlib.unzip);

let tiktokSchemaPath = require.resolve('./tiktok.proto');
// const RabbitMQ = require(path.resolve("RabbitMQ.lib"))
let tiktokSchema = null;
let config = {
    skipMessageTypes: []
};
const userAgentDefault =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36';

const data_tring = require("./tik_data.js")
// console.log(data_tring)
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
        this.retryTime = 0;
        this.retryTimeMax = 3;
        this.retryTimeFull = 0;
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
        let res1 = await this.clone.callApi({type: "enter"})
        let user_id = helper.getString(res1.data,'"user_id":','}')
        console.log(helper.getTime(),"enter",user_id);
        // while(true){
        //     this.clone.proxy = `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`
        //     let res1 = await this.clone.callApi({type: "enter"})
        //     let user_id = helper.getString(res1.data,'"user_id":','}')
        //     console.log(helper.getTime(),"enter",user_id);
        //     // await helper.delay(that.getRandomInt(120, 140)*1000)
        //     await helper.delay(160000)
        // }
        
        console.log("ENTER")
    }
    async connect1({ room_id }) {
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
            console.log("ENTER")
        let res1 = await this.clone.callApi({type: "enter"})
            console.log("ENTER")
            process.exit(1)
        // this.clone = new Clone({cookie_string: this.cookie_string, room_id, proxy: p, proxy_list})
        // if(
        // //     // that.is_101 && 
        //     !this.wrss ||  this.lastFetch < (Date.now() - 5 * 60000)) {
            let res = await this.clone.fetch()
            this.lastFetch = Date.now();
            this.wrss = this.clone.wrss
        // }

        // setTimeout(()=>{
        //     if(that.isShowLog)
        //     console.log("Force reconnect")
        //     that.disconnect()
        // },5* 60000)
        let result =  await new Promise(async(r) => {
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
                    // that.client.pause();
                    // that.client = connection
                    //
                    // console.log(that.client.socket.write)
                    // console.log(that.client.bufferList.toString())
                    // process.exit(1)
                    // that.client.pause();
                    // that.client.socket.write(data_tring, function(){})
                    // console.log(JSON.stringify(connection))
                    // let bl = new BufferList();
                    // bl.append(Buffer.from('{ head: null, tail: null, length: 0 }'));
                    // console.log(bl)
                    // process.exit(1)
                    // connection.pause();
                    // connection.socket._readableState.needReadable = false
                    // connection.socket._readableState.reading = false
                    // connection.socket._parent._readableState.highWaterMark = -1024;
                    // connection.socket._parent._writableState.highWaterMark = -1024;
                    // connection.socket._readableState.highWaterMark = -1024;
                    // connection.socket._writableState.highWaterMark = -1024;
                    // connection.socket.ssl._parentWrap._readableState.highWaterMark = -1024
                    // connection.socket.ssl._parentWrap._writableState.highWaterMark = -1024
                    // that.client.socket._readableState.buffer = [{"head":{"data":{"type":"Buffer","data":[130]},"next":{"data":{"type":"Buffer","data":[130]},"next":null}},"tail":{"data":{"type":"Buffer","data":[130,0,0,0,0,0,0,0,0]},"next":null},"length":2}]
                    setData();
                    // console.log(that.client.socket._readableState)
                    // fs.appendFile("./test_data1.txt", (JSON.stringify(that.client)) + '\n', () => {process.exit(1) })
                    
                    // connection.pause();
                    that.retryTime = 0
                    // that.client.maxReceivedFrameSize = 1;
                    // that.client.maxReceivedMessageSize = 0.001*1024;
                    // that.client.maxPayload = 1
                    if(that.isShowLog)
                    console.log(that.sessionid, 'WebSocket Client Connected',(new Date().toLocaleString()));
                    // await helper.delay(that.getRandomInt(1500, 2000))
                    // that.disconnect();
                    // if(that.is_first_connected){
                    //     that.is_first_connected = false;
                    //     await helper.delay(that.getRandomInt(20000, 30000))
                    // }else{
                    //     await helper.delay(that.getRandomInt(10000, 30000))
                    // }
                    
                    // return r(false)
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
                        // await helper.delay(that.getRandomInt(1500, 2500))
                        r(false)
                    });
                    // connection.on('message', async function (message) {
                    //     if (!that.socketConnected) that.socketConnected = true;
                    //     try {
                    //         let decodedContainer = await that.deserializeWebsocketMessage(message.binaryData);
                            
                    //         // console.log(decodedContainer)
                    //         if(decodedContainer.webcastResponse) {
                    //             decodedContainer.webcastResponse?.messages.forEach(i=>{
                    //                 if(i.type == "WebcastChatMessage" && i.decodedData){
                    //                     console.log("comment",  i.decodedData.comment)
                    //                 }else if( !['WebcastRoomUserSeqMessage','WebcastLinkLayerMessage','WebcastMemberMessage','WebcastLinkMicArmies','WebcastLikeMessage','WebcastLinkmicBattleTaskMessage','WebcastRoomMessage','WebcastRankUpdateMessage','WebcastEnvelopeMessage','WebcastLinkMicBattle'].includes(i.type)){
                    //                     console.log('i',i.type)
                    //                 }
                    //             })

                    //         }
                    //         if (decodedContainer.id > 0) {
                    //             // _sendAck2()
                    //         }
                    //         if(that.onMessage){
                    //             // that.onMessage(decodedContainer)
                    //         }
                    //     } catch (err) {
                    //         console.log("error", err)
                    //     }

                    //     // that.client.pause();

                    // });
                    // connection.on('message', async function (message) {
                    //     if (!that.socketConnected) that.socketConnected = true;
                    //     console.log(that.sessionid,'message')
                    //     // connection.pause();
                    //     // that.client.pause();
                    //     // pauseResume()
                    //     // console.log('pause')
                    // });
                    function setData(){
                        // connection.socket._readableState.buffer = [{"head":{"data":{"type":"Buffer","data":[130]},"next":{"data":{"type":"Buffer","data":[130]},"next":null}},"tail":{"data":{"type":"Buffer","data":[130,0,0,0,0,0,0,0,0]},"next":null},"length":2}]
                        // connection.socket._readableState.length = 18000
                    }
                    async function pauseResume() {
                        // Send static connection alive ping
                        let randomNum = that.getRandomInt(40000, 50000)
                        try{
                            // connection.resume();
                            // that.client.resume();
                        }catch(e){}
                        await helper.delay(that.getRandomInt(500, 700))
                        try{
                            connection.pause();
                            that.client.pause();
                        }catch(e){}
                        setTimeout(() => { if (that.alive) pauseResume() }, randomNum);
                    }
                    function generateRandomHex(length) {
                        let result = '';
                        for (let i = 0; i < length; i++) {
                            result += Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
                        }
                        return result;
                    }
                    async function _sendPing2() {
                        // connection.pause();
                        // console.log('send message')
                        // if(that.client.socket._readableState.length != 18032903 || that.sessionid,that.client.socket._readableState.buffer.length != 1)
                        // console.log(that.sessionid,that.client.socket._readableState.buffer.length,that.client.socket._readableState.length)
                        // fs.appendFile("./test_data.txt", (JSON.stringify(that.client)) + '\n', () => { })
                        // fs.appendFile("./test_data2.txt", (JSON.stringify(process)) + '\n', () => { })
                        // Send static connection alive ping
                        let randomNum = that.getRandomInt(500, 1000)
                        randomNum = that.getRandomInt(6000, 10000)
                        randomNum = 1000
                        if(that.socketConnected){
                            try{
                                if(that.reconnect_after_time > 0 && Date.now() - that.time_connected > that.reconnect_after_time){
                                    that.disconnect();
                                }
                                
                            }catch(e){}
                            setData();
                    //         that.client.socket._parent._readableState.highWaterMark = -1024;
                    // that.client.socket._parent._writableState.highWaterMark = -1024;
                    // that.client.socket._readableState.highWaterMark = -1024;
                    // that.client.socket._writableState.highWaterMark = -1024;
                    // that.client.socket.ssl._parentWrap._readableState.highWaterMark = -1024
                    // that.client.socket.ssl._parentWrap._writableState.highWaterMark = -1024
                    // that.client.socket._readableState.buffer = [{"head":{"data":{"type":"Buffer","data":[130]},"next":{"data":{"type":"Buffer","data":[130]},"next":null}},"tail":{"data":{"type":"Buffer","data":[130,0,0,0,0,0,0,0,0]},"next":null},"length":2}]
                    // that.client.socket._readableState.length = 18032903
                            connection.sendBytes(Buffer.from('3A026862', 'hex'));
                            // connection.ping('Keepalive');
                            // connection.sendBytes(Buffer.from(generateRandomHex(1000), 'hex'));

                            
                            // if (!fs.existsSync(path.resolve("./data_client/"))){
                            //     fs.mkdirSync(path.resolve("./data_client/"));
                            // }
                            // if (!fs.existsSync(path.resolve("./data_client/total"))){
                            //     fs.mkdirSync(path.resolve("./data_client/total"));
                            // }
                            // if (!fs.existsSync(path.resolve("./data_client/"+that.sessionid))){
                            //     fs.mkdirSync(path.resolve("./data_client/"+that.sessionid));
                            // }
                            // fs.appendFile(path.resolve("./data_client/"+that.sessionid)+"/"+Date.now()+".txt", (JSON.stringify(that.client)) + '\n', () => { })
                            // fs.appendFile(path.resolve("./data_client/total/")+"/"+that.sessionid+"_"+Date.now()+".txt", (JSON.stringify(that.client)) + '\n', () => { })
                            
                            // connection.pause();
                            // that.client.pause();
                        }
                        setTimeout(() => { if (that.alive) _sendPing2() }, randomNum);
                    }
                    function _sendAck3() {
                        // Send static connection alive ping
                        let randomNum = that.getRandomInt(20000, 30000)
                        randomNum = that.getRandomInt(6000, 10000)
                        randomNum = 1000//
                        if(that.socketConnected)
                        _sendAck2(1)
                        setTimeout(() => { if (that.alive) _sendAck3() }, randomNum);
                    }

                    function _sendAck2(id) {
                        let ackMsg = that.serializeMessage('WebcastWebsocketAck', {
                            type: 'ack',
                            id
                        });
                        connection.sendBytes(ackMsg);
                    }
                    setTimeout(function(){
                        _sendPing2()//let randomNum = that.getRandomInt(500, 1000) //on dinh
                        _sendAck3()//randomNum = 2000 // on dinh
                    }, 2000)
                    // if (connection.socket) {
                    //     try {
                    //         // Gửi dữ liệu thô trực tiếp qua socket TCP
                    //         connection.socket.write('Dữ liệu thô\r\n');
                    //         console.log(connection.socket)
                    //         console.log('Dữ liệu đã được gửi qua socket thấp cấp.');
                    //     } catch (error) {
                    //         console.error('Lỗi khi ghi vào socket:', error);
                    //     }
                    // }
                });
                const headers = {
                    'Cookie': that.cookie_string,
                    'Connection': 'Upgrade',
                    'Host': 'webcast16-ws-alisg.tiktok.com',
                    'Origin': 'https://webcast.tiktok.com',
                    'Upgrade': 'websocket',
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
        let {cursor} = require("../data_cursor.js")
        let browser_version = encodeURIComponent(this.appversion)
        let res = `wss://webcast16-ws-alisg.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=${this.browser_platform}&browser_version=${browser_version}&compress=gzip&cookie_enabled=true&cursor=${cursor}&debug=false&device_platform=web&heartbeatDuration=0&host=https%3A%2F%2Fwebcast.tiktok.com&identity=audience&imprp=&internal_ext=&live_id=12&room_id=` + room_id + `&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&update_version_code=1.3.0&version_code=270000&webcast_sdk_version=1.3.0&wrss=` + (this.wrss ? this.wrss : this.generateRandomString(43))
        return res
        //wss://webcast16-ws-useast1a.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?aid=1988&app_language=en-US&app_name=tiktok_web&browser_language=en&browser_name=Mozilla&browser_online=true&browser_platform=Win32&browser_version=5.0+%28Windows+NT+10.0%3B+Win64%3B+x64%29+AppleWebKit%2F537.36+%28KHTML%2C+like+Gecko%29+Chrome%2F106.0.0.0+Safari%2F537.36&cookie_enabled=true&cursor=1744462589876_7492409661476306973_1_1_7492405984984310405_0&internal_ext=fetch_time%3A1744462589876%7Cstart_time%3A0%7Cack_ids%3A%2C%2C%7Cflag%3A0%7Cseq%3A1%7Cnext_cursor%3A1744462589876_7492409661476306973_1_1_7492405984984310405_0%7Cwss_info%3A0-1744462589876-0-0&device_platform=web&focus_state=true&from_page=user&history_len=0&is_fullscreen=false&is_page_visible=true&did_rule=3&fetch_rule=1&last_rtt=0&live_id=12&resp_content_type=protobuf&screen_height=1152&screen_width=2048&tz_name=Europe%2FBerlin&referer=https%3A%2F%2Fwww.tiktok.com%2F&root_referer=https%3A%2F%2Fwww.tiktok.com%2F&host=https%3A%2F%2Fwebcast.tiktok.com&webcast_sdk_version=1.3.0&update_version_code=1.3.0&room_id=7492405931744529173&compress=gzip&wrss=fDNfcXEVrip-lSKL9VX_ZqAmHxmVv0RmHh33bE9oAM4&imprp=&version_code=180800
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
