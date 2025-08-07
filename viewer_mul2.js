const path = require("path")
const { spawn } = require('child_process');

const helper = require("./src/helper")
const Viewer = require("./src/Viewer.tt2");
// const [,, targetFile, ...args] = process.argv;
let targetFile = "viewer_thinh1.js"
if (!targetFile) {
  console.error("Vui lòng cung cấp file js cần thực thi");
  process.exit(1);
}
let time_check = 0
function runScript(args = []) {
  const child = spawn('node', [targetFile, ...args]);

  child.stdout.on('data', (data) => {
    process.stdout.write(`[${args[0]} stdout]: ${data}`);
  });

  child.stderr.on('data', (data) => {
    process.stderr.write(`[${args[0]} stderr]: ${data}`);
  });

  child.on('close', (code) => {
    console.log(`[${args[0]}] đã kết thúc với mã: ${code}\n`);
  });
}
async function runViewer(room_id){
    let is_live_end = false
    let acc_die_string = '';//await helper.strData(path.resolve("./101.txt"));
    let acc_die_array = (acc_die_string.split(','))
    let acc_string = await helper.strData(path.resolve("./data_test/acc_socket2.txt"));
    let proxies_str =await helper.strData(path.resolve("./data_test/acc_socket_proxy.txt"));
    let proxies = helper.parserAccounts({ acc_string: proxies_str, getIndex:0, number_slice: 1000, key: ",", number_ignore:0, format: "proxy", key_format: "|", item_return_type: "proxy"})
    proxies = helper.shuffle(proxies)
    let accounts = helper.parserAccounts({ acc_string, getIndex:0, number_slice: 100, key: "\n", number_ignore:0, format: "u|p|t1|t2|cookie_string", key_format: "|", item_return_type: "cookie_string", preReturn:(object, cookie_string)=>{
        let sessionid = helper.getString(cookie_string,'sessionid=',';')
        if(!acc_die_array.includes(sessionid)){
            // console.log(sessionid)
            return cookie_string && cookie_string.includes("sessionid=")
        }else{
            // console.log(sessionid)
        }
    }})
    let acc_per_proxy = 1
    proxies = getProxy(Math.floor(accounts.length/acc_per_proxy)+1)
    proxies = await helper.getProxySite(120)
    proxies = helper.shuffle(proxies)
    let tokens =  [];
    splice_accounts = helper.splice(accounts,acc_per_proxy);
    let _accounts = []
    for(let index = 0 ; index < splice_accounts.length; index ++ ){
        let accs = splice_accounts[index];
        let proxy = proxies[index];
        accs = accs.map(account => {
            account = account +";proxy="+proxy+";"
            return account
        });
        _accounts = [..._accounts, ...accs]

    }
    let is_start = true
    Viewer.startViewers({accounts:_accounts, task_id: 1, room_id, tokens})

    await checkViewer(room_id);
    if(is_live_end){
        for(let index = 0 ; index < splice_accounts.length; index ++ ){
            // Viewer.stopViewers({ task_id: index+1 })
        }
    }
    async function checkViewer(room_id){
        if(is_live_end){
            await helper.delay(5000)
            return;
        }
        let proxy = ''
        let res = await helper.getRoomInfo({room_id: room_id,proxies: [],proxy: helper.parserProxyString(proxy),cookie_string:""});
        let log  = `room: ${room_id} now: ${res.view_count} alive: ${res.is_alive}`
        if(!res.is_alive && res.view_count > 0){
            is_live_end = true
        }
        
        // console.log(helper.getTime(),"Info -- ",log);
        if(is_live_end){
            for(let index = 0 ; index < splice_accounts.length; index ++ ){
                Viewer.stopViewers({ task_id: index+1 })
            }
        }
        await helper.delay(5000)
        await checkViewer(room_id);
    }
}
function getProxy(number=1){
    let proxys = [];
    for(let index = 0 ; index < number; index ++ ){
        let proxy = "com86717627-res-vn-sid-" + helper.getRandomInt(111111111, 999999999) + "-sesstime-5:GgNufEC8cvtK09WZ7@prem.as.iprocket.io:5959";
        proxy = `com86717627-res_sc-ASN45899-Lsid-${helper.getRandomInt(111111111, 999999999)}-TTL-300:GgNufEC8cvtK09WZ7@prem.as.iprocket.io:5959`
        proxys.push(proxy)
    }
    return proxys;
}
// runScript(["7501599845222697736","1","0","5"])
async function main(){
  await helper.delay(30000)
    helper.clearCacheForFile(__dirname+"/data_room_mul.js")
    let {room_id, time} = require(__dirname+"/data_room_mul.js")
    time_check = time
    if(process.argv[2] && process.argv[2] != "1"){
        room_id = process.argv[2].trim()
    }
    let room_ids = room_id.trim().split(",")
    if(room_ids.length > 0){
        checkFile()
    }
    // room_ids = "7501626615042984712,7501626163477121799".trim().split(",")
    let number_acc = process.argv[3] || 0
    let number_slice = process.argv[4] || 0
    let config_file = process.env.cf;
    // console.log(number_acc,number_slice,config_file)
    for (let i = 0; i < room_ids.length; i++) {
        runViewer(room_ids[i])
        // await runScript([room_ids[i],number_acc,number_slice,config_file])
        await helper.delay(61000)
    }
}
async function checkFile(){
    try{
        if(time_check){
            helper.clearCacheForFile(__dirname+"/data_room_mul.js")
            let {time} = require(__dirname+"/data_room_mul.js")
            if(time != time_check){
                console.log("Thay đổi file data_room_mul.js")
                Viewer.stopViewers({ task_id: 1 })
                await helper.delay(10000)
                process.exit(1)
            }
        }
    }catch(e){
        console.log("Lỗi khi kiểm tra file:", e);
    }
    await helper.delay(1000)
    return await checkFile()
}

main()
// setInterval(runScript, 1000);

// console.log(`Bắt đầu thực thi liên tục mỗi giây file: ${
