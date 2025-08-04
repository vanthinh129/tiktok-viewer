const WebSocketClient = require('ws');
const protobufjs = require('protobufjs');
const tunnel = require('tunnel');

const util = require('node:util');

const zlib = require('node:zlib');
const helper = require('./helper');

const unzip = util.promisify(zlib.unzip);

let tiktokSchemaPath = require.resolve('./tiktok.proto');

let tiktokSchema = null;
let config = {
    skipMessageTypes: []
};
const userAgentDefault =
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/118.0.0.0 Safari/537.36';


class TikTokSocket {
    constructor(data) {
        let { cookie_string, proxy_string, useragent, isShowComment, onMessage, isShowLog } = data;
        this.cookie_string = cookie_string || "";
        this.onMessage = onMessage;
        this.isShowLog = isShowLog;
        this.sessionid = this.getString(this.cookie_string + ";", "sessionid=", ";")
        this.isShowComment = isShowComment
        this.proxy_string = proxy_string
        this.useragent = useragent || userAgentDefault;
        this.appversion = this.useragent.replace("Mozilla/", "");
        this.browser_platform = this.getString(this.useragent, "(", ")")
        this.retryTime = 0;
        this.retryTimeMax = 0;
        this.retryTimeFull = 0;
        this.retryTimeMaxFull = 10000;
        this.socketConnected = false;
        this.closed = false;
        this.is_101 = false;
    }
    async connect({ room_id }) {
        let that = this
        that.alive = true;
        let result = await new Promise(async (r) => {
            try {
                let tunnelingAgent
                const headers = {
                    'Cookie': that.cookie_string,
                    'Connection': 'Upgrade',
                    'Host': 'webcast16-ws-alisg.tiktok.com',
                    'Origin': 'https://webcast.tiktok.com',
                    'Upgrade': 'websocket',
                    'User-Agent': that.useragent,
                };



                let options = {
                    headers,
                    tlsOptions: {
                    }
                }

                if (that.proxy_string) {
                    tunnelingAgent = tunnel.httpsOverHttp(that.parseProxy(that.proxy_string));
                    options.tlsOptions.agent = tunnelingAgent

                }
                if (tunnelingAgent) {
                    options.agent = tunnelingAgent
                }
              
                    const client = new WebSocketClient(that.createUrl({ room_id }), options);
                    that.client = client
                


                that.client.on('open', async function (connection) {
                    if (!that.socketConnected) that.socketConnected = true;
                    that.retryTime = 0
                    that.client.pause();
                    // that.client = connection
                    if (that.isShowLog)
                        console.log(that.sessionid, 'WebSocket Client Connected');

                    // connection.on('message', async function (message) {
                    //     if (!that.socketConnected) that.socketConnected = true;
                    //     try {
                    //         let decodedContainer = await that.deserializeWebsocketMessage(message.binaryData);


                    //         if (decodedContainer.id > 0) {
                    //             // _sendAck2()
                    //         }
                    //         if(that.onMessage){
                    //             that.onMessage(decodedContainer)
                    //         }
                    //     } catch (err) {
                    //         console.log("error", err)
                    //     }


                    // });
                    // connection.on('message', async function (message) {
                    //     if (!that.socketConnected) that.socketConnected = true;
                    //     // console.log('message')
                    //     // connection.pause();
                    //     // that.client.pause();
                    //     // pauseResume()
                    //     // console.log('pause')
                    // });
                    // pauseResume()
                    async function pauseResume() {
                        // Send static connection alive ping
                        let randomNum = that.getRandomInt(30000, 50000)
                        try {
                            that.client.resume();
                        } catch (e) { }
                        await helper.delay(that.getRandomInt(500, 800))
                        try {
                            that.client.pause();
                        } catch (e) { }
                        setTimeout(() => { if (that.alive) pauseResume() }, randomNum);
                    }
                    function _sendPing2() {
                        // console.log('send message')
                        // Send static connection alive ping
                        let randomNum = that.getRandomInt(3000, 5000)
                        try{
                            that.client.send(Buffer.from('3A026862', 'hex'));
                        }catch(e){}
                        
                        setTimeout(() => { if (that.alive) _sendPing2() }, randomNum);
                    }
                    function _sendAck3() {
                        // Send static connection alive ping
                        let randomNum = that.getRandomInt(40000, 50000)
                        _sendAck2()
                        setTimeout(() => { if (that.alive) _sendAck3() }, randomNum);
                    }

                    function _sendAck2(id) {
                        let ackMsg = that.serializeMessage('WebcastWebsocketAck', {
                            type: 'ack',
                            id
                        });
                        try{
                            that.client.send(ackMsg);
                        }catch(e){}
                        
                    }
                    _sendPing2()
                    _sendAck3()
                });
                that.client.on('error', function (error) {
                    error = error.message
                    if (error.includes("Server responded with a non-101 status: 200 OK")) {
                        error = "Server responded with a non-101 status: 200 OK"
                        that.is_101 = true
                        if (that.retryTime < that.retryTimeMax) {
                            that.retryTime = that.retryTimeMax;
                        }
                    }
                    if (that.isShowLog)
                        console.log(that.sessionid, 'connect Error: ' + error, (new Date().toLocaleString()), that.proxy_string);
                    that.socketConnected = false

                    r(false)
                });
                that.client.on('message', async function (message) {
                    if (!that.socketConnected) that.socketConnected = true;
                    that.client.pause();
                    // console.log('message')
                    // connection.pause();
                    // that.client.pause();
                    // pauseResume()
                    // console.log('pause')
                });
                that.client.on('close', async function () {
                    if (that.isShowLog)
                        console.log(that.sessionid, 'echo-protocol Connection Closed', (new Date().toLocaleString()));
                    that.socketConnected = false

                    r(false)
                });

            } catch (e) {
                console.log("error connect:", e)
                // await helper.delay(that.getRandomInt(1500, 2500))
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
                    console.log(that.sessionid, "Retry connect time", that.retryTime, that.proxy_string)
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
            this.client.close();

        }
        if (this.isShowLog)
            console.log(this.sessionid, "close done")

    }
    createUrl({ room_id }) {
        let browser_version = encodeURIComponent(this.appversion)
        let res = `wss://webcast16-ws-alisg.tiktok.com/webcast/im/ws_proxy/ws_reuse_supplement/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=${this.browser_platform}&browser_version=${browser_version}&compress=gzip&cookie_enabled=true&cursor=&debug=false&device_platform=web&heartbeatDuration=0&host=https%3A%2F%2Fwebcast.tiktok.com&identity=audience&imprp=&internal_ext=&live_id=12&room_id=` + room_id + `&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&update_version_code=1.3.0&version_code=270000&webcast_sdk_version=1.3.0&wrss=` + this.generateRandomString(43)
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
