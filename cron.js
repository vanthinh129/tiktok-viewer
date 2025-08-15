const path = require('path')
const zlib = require('zlib');
const RabbitMQ = require(path.resolve("RabbitMQ.lib"))
const Viewer = require(path.resolve("./src/Viewer.tt5"));
const BrowserService = require("./src/BrowserService");
const request = require('request')
const helper = require("./src/helper")
const {execSync} = require('child_process');
const assert = require('assert');
process.on('uncaughtException', (error) => {
    if (error instanceof assert.AssertionError) {
      console.error('Assertion Error:', error.message,(new Date().toLocaleString()));
      // Handle the AssertionError, but don't let it propagate to the top level
    } else {
      // Handle other types of errors
      console.error('Unexpected Error:', error,(new Date().toLocaleString()));
    }
  });
var cron_authentic = '?authensone=mysonetrend';
var cronRun  = {};
var cron_data = {
    server_name: "",
    name: "Cron"
}
var number_arg = process.argv[2];
var server_site = process.argv[3] || "tt1";//
// console.log(server_site)
if(number_arg < 10){
    number_arg = '0'+number_arg;
}
// Viewer.setdatelocal("server_site", server_site)
cron_data.name += '_'+number_arg;
cron_data.pid = getScreenId();
var list_task_id = []
var list_account_101 = []
let rabbitService;
const { sendMessageTele, makeRequest,clearCacheForFile,getString} = require('./src/helper')
var vps_ip = 1;
const delay = (time)=>new Promise((res)=>setTimeout(res,time))
async function restartBrowser(time_sec){
    console.log(`Setting up browser restart every ${time_sec} seconds`);
    let restartCount = 0;
    // Sử dụng setInterval thay vì while(true) để tránh vấn đề với event loop
    setInterval(async () => {
        restartCount++;
        // console.log(`[${new Date().toISOString()}] Scheduled browser restart #${restartCount}`);
        try {
            // Cập nhật instance browser
            await BrowserService.updateInstance("new");
            // console.log(`Browser instance updated successfully`);
        } catch (e) {
            // console.error(`[ERROR] Failed to update browser instance:`, e);
        }
    }, time_sec * 1000);
}
const main = async ( )=>{
    // clearCacheForFile(path.resolve("./src/GroupProcess.js"))
    clearCacheForFile(path.resolve("./src/Viewer.tt5"))
    clearCacheForFile(path.resolve("./src/socket.js"))
    restartBrowser(3*60);
    let ip_input = process.argv[4]
    cron_data.server_name = await getIP()
    if(ip_input){
        cron_data.server_name = ip_input
    }
    // cron_data.server_name = "113.22.7.121"
    vps_ip = cron_data.server_name;
    console.log((new Date().toLocaleString()),"start worker",cron_data.name,`${cron_data.server_name}:${cron_data.name}`)
    let exchangeName = "bupmat_exchange"
    rabbitService = await RabbitMQ.getInstance({url: "amqp://bupmat:bupmat@185.190.140.88:5672/"+server_site+"?heartbeat=60"});
    // đây là 1 worker nhận task từ queue task_view
    await rabbitService.registerQueue({
        exchangeName,
        option: {
            durable:    true,
            messageTtl: (30*60*1000),
        },
        queueName: `${cron_data.server_name}:${cron_data.name}`,
        // routingKey,
        isConsumer: true,
        onMessage: async (payload, message, channel) => {
            if(payload.action == "new_task"){
                console.log(payload,"new_task",cron_data.name )
                try{
                    if(!list_task_id.includes(payload.task.data[0]._id)){
                        list_task_id.push(payload.task.data[0]._id)
                        payload = await getDataTask(0,payload.task.data[0]._id)
                        if(payload.status && payload.task && payload.task.data && payload.task.data[0] && payload.task.data[0].cookie_strings){
                            var dataJson = payload.task;
                            if(dataJson && dataJson.data){
                                var tasks = dataJson.data;
                                if(tasks.length > 0){
                                    let proxies = [];
                                    let time_get_proxy = 0;
                                    while(proxies.length == 0){
                                        proxies = await helper.getProxySite(180)
                                        time_get_proxy++
                                        if(time_get_proxy > 5){
                                            break;
                                        }else{
                                            await delay(2000);
                                        }
                                    }
                                    proxies = helper.shuffle(proxies)
                                    for (var i = 0; i < tasks.length; i++) {
                                        cronRun[tasks[i]._id] = {}
                                        let accounts = tasks[i].cookie_strings.split(',')
                                        console.log("accounts",accounts.length)
                                        let acc_socket = []
                                        accounts.map(account => {
                                            let proxy = proxies[Math.floor(Math.random()*proxies.length)];
                                            account =  account +";proxy="+proxy+";"
                                            if(proxy && account.includes('proxy_socket') && !account.includes('proxy_socket=;')){
                                                acc_socket.push(account)
                                            }
                                        });
                                        let room_id = tasks[i].room_id || tasks[i].video_id
                                        // console.log("start", acc_socket)
                                        Viewer.startViewers({accounts:acc_socket, task_id: tasks[i]._id, room_id, rabbitService, server_site})
                                    }
                                    
                                }else{
                                    
                                }
                            }else{
                            }
                        }
                    }else{
                        console.log(payload.task.data[0]._id, 'is exists')
                    }
                }catch(e){
                    console.log('error new_task',e)
                }
            }else if(payload.action == "proxy_change"){
                var dataJson = payload.task;
                console.log("proxy_change",dataJson.data)
                if(dataJson && dataJson.data){
                    Viewer.updateProxy({data_proxy:dataJson.data})
                }

            }else if(payload.action == "pause_task"){
                var dataJson = payload.task;
                if(dataJson && dataJson.data){
                    var tasks = dataJson.data;
                    if(tasks.length > 0){
                        for (var i = 0; i < tasks.length; i++) {
                            GroupProcessServer.action({ action:"pause", task_id:tasks[i]._id })

                        }
                    }
                }
            }else if(payload.action == "resume_task"){
                var dataJson = payload.task;
                if(dataJson && dataJson.data){
                    var tasks = dataJson.data;
                    var proxy = dataJson.proxy;
                    if(tasks.length > 0){
                        for (var i = 0; i < tasks.length; i++) {
                            GroupProcessServer.action({ action:"resume", task_id:tasks[i]._id })
                        }
                    }
                }
            }else if(payload.action == "stop_task"){
                console.log(JSON.stringify(payload),"stop_task",cron_data.name )
                var dataJson = payload.task;
                if(dataJson && dataJson.data){
                    var tasks = dataJson.data;
                    if(tasks.length > 0){
                        for (var i = 0; i < tasks.length; i++) {
                            console.log("cancel task", tasks[i]._id,(new Date().toLocaleString()))
                            // GroupProcessServer.action({ action:"cancel", task_id:tasks[i]._id })
                            // close
                            Viewer.stopViewers({ task_id: tasks[i]._id})
                            list_task_id = list_task_id.filter(id => id !== tasks[i]._id);
                            if(cronRun[tasks[i]._id]){
                                for(var key in cronRun[tasks[i]._id]){
                                    // cronRun[tasks[i]._id][key].cancel()
                                    delete cronRun[tasks[i]._id][key];
                                }
                                delete cronRun[tasks[i]._id];
                            }
                            if (global.gc) {
                                try {
                                    global.gc();
                                    // console.log(`[${new Date().toISOString()}] Đã giải phóng bộ nhớ sau khi dừng task ${tasks[i]._id}`);
                                } catch (e) {
                                    console.error(`[ERROR] Không thể giải phóng bộ nhớ: ${e.message}`);
                                }
                            }

                        }
                    }
                }
            }
            // console.log('ack')
            channel.ack(message)
        }
    });
    if(cron_data.server_name){
        // console.log((new Date().toLocaleString()))
        await rabbitService.sendMessage("rabbit_cron", {"action": "new_cron", "cron_data":cron_data, time_now: Date.now()})
        setInterval(async function(){
            cron_data.tasks = getTaskId();
            // console.log('update_cron be',cron_data,(new Date().toLocaleString()))
            await rabbitService.sendMessage("rabbit_cron", {"action": "update_cron", "cron_data":cron_data, time_now: Date.now()})
            // console.log('update_cron en',cron_data,(new Date().toLocaleString()))
        }, 50000) 
        if(number_arg == '01'){
          }
        
    }
    
    
} 
main().catch(error=>console.log("WORKER VIEW",error))
async function getIP(){
    var url = 'http://amazingcpanel.com/api/cron/myip?authensone=mysonetrend&server_name=&name=Cron_01&pid=&t=1684326215799';
    // url = "https://jsonip.com"
    // console.log(url)
    return new Promise((resolve,reject) => {
        request.get({
            url: decodeURI(url),
        }, function(error, response, data){
            if(data && data.indexOf('"ip"') > -1){
                data = JSON.parse(data);
                // data.ip = "164.68.96.126"
                return resolve(data.ip);
            }else{
                return resolve(false);
            }
        })
     })
}
function getTaskId(){
    var list_id = []
    for(var key in cronRun){
        list_id.push(key);
    }
    return list_id;
}


async function getDataTask(number, task_id){
    if(number > 6){
        console.log(`${task_id} faile load`)
        await sendMessageTele(`${cron_data.server_name}: ${task_id} faile load`);
        return {status: false};
    }
    console.log('get task',task_id,'number',number)
    console.time('getDataTask'+task_id)
    let domain = {
        // "tt1": "http://localhost:9002",
        // "tt2": "http://45.119.82.144:29002",
        // "tt2": "http://localhost:29001",
        "tt1": "http://tt1cronlive.amazingcpanel.com",
        "tt2": "http://tt2cronlive.amazingcpanel.com",
    }
    let domain_select = domain[server_site.trim()];
    let url = `${domain_select}/api/tiktok/gettaskbyid?authensone=mysonetrend&id=${task_id}`
    let options = {
        url: decodeURI(url),
        timeout: 60000,
        retryTime: 2
    }
    console.log(decodeURI(url))
    let result = await makeRequest(options)
    console.timeEnd('getDataTask'+task_id)
    try{
        if(result && result.bodyJson){
            // callback(proxy)
            var inflated = zlib.inflateSync(Buffer.from(result.bodyJson.task.data[0], 'base64')).toString()
            result.bodyJson.task.data[0] = JSON.parse(inflated)
            return result.bodyJson;
        }else{
            console.log('error data',result.body)
            number++
            await delay(1000);
            return await getDataTask(number, task_id)
        }
    }catch(e){
        console.log('error getDataTask',e)
        number++
        await delay(1000);
        return await getDataTask(number, task_id)
        
    }
    // return false
}

function getScreenId(){
    var screen_id = '';
    var output = execSync('echo $STY').toString();
    if(output.indexOf('.') > -1){
        screen_id = getString('@'+output,'@','.')
    }
    return screen_id;
}
