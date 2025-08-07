
const { spawn } = require('child_process');
const helper = require("./src/helper")
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
        await runScript([room_ids[i],number_acc,number_slice,config_file])
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
