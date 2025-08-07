const http = require('http');
const helper = require('./src/helper');
const request = require('request');
const { promisify } = require('util');

const requestAsync = promisify(request);


const folderNameInput = process.argv[2] || "New 100 21-6" ;
// getOrder()
async function getOrder(){
    try{
        const response = await fetch('http://217.15.163.20:8549/api/cron/gettiktokorder?authensone=mysonetrend&is_reel=0,1&sort=-amount_remain&limit=1000&status=3');
        const data = await response.json();
        // console.log(data);
        if(data && data.orders && data.orders.length > 0){
            return data.orders;
        }
        return [];
    }catch(e){
        console.error('❌ Error getting order:', e.message);
        return [];
    }
}
async function getRoomData(username,proxies){
    try {
        // console.log("🔍 Lấy roomId thật từ TikTok cho username:", username);
        if (proxies && proxies.length > 0) {
            let proxy_random = "http://"+proxies[Math.floor(Math.random() * proxies.length)];
            let dataUser = await helper.getRoomId3({name: username, proxy: proxy_random,retryCount:1});
            if (dataUser && dataUser.data && dataUser.data.user && dataUser.data.user.roomId) {
                roomId = dataUser.data.user.roomId;
                // console.log("✅ Lấy được roomId thật:", roomId);
                return {
                    roomId: roomId,
                    roomUrl: `https://www.tiktok.com/@${username}/live/`,
                    profile_id: username,
                    status: dataUser.data.user.status,
                    is_live: (dataUser.data.user.status == 2),
                    userCount: dataUser.data.liveRoom.liveRoomStats.userCount,
                    enterCount: dataUser.data.liveRoom.liveRoomStats.enterCount,
                };
            } else {
                console.error("❌ Không lấy được roomId từ TikTok, có thể user không live");
                return;
            }
        } else {
            console.error("❌ Không có proxy để lấy roomId");
            return;
        }
    } catch (err) {
        console.error("❌ Lỗi khi lấy roomId từ TikTok:", err);
        
        return;
    }
}
async function sendRequest(data) {
  return new Promise((resolve, reject) => {
    const postData = JSON.stringify(data);
    // console.log(postData);
    resolve(true);
    return;
    const options = {
      hostname: '127.0.0.1',
      port: 8899,
      path: '/api/auto-add-room-and-start-viewer',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(postData)
      }
    };

    console.log('📤 Sending:', JSON.stringify(data, null, 2));

    const req = http.request(options, (res) => {
      let responseData = '';

      res.on('data', (chunk) => {
        responseData += chunk;
      });

      res.on('end', () => {
        console.log('📥 Response:', responseData);
        console.log('---');
        resolve(responseData);
      });
    });

    req.on('error', (error) => {
      console.error('❌ Error:', error);
      reject(error);
    });

    req.write(postData);
    req.end();
  });
}
async function getRedirectOnce(url) {
    try {
        const response = await requestAsync({
            url,
            followRedirect: false // Không tự động follow
        });

        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return response.headers.location; // Trả về link redirect
        }

        return null; // Không có redirect
    } catch (error) {
        throw error;
    }
}
async function main() {
    const orders = await getOrder();
    let proxies = await helper.getProxySite();
    console.log(orders.length);
    for(let i = 0; i < orders.length; i++){
        const order = orders[i];
        const roomUrl = order.video_id;
        const url = order.url;
        const amount = order.amount;
        const start_count = order.start_count;
        let accountCount = amount;
        if(accountCount > 335){
            accountCount = 335;
        }
        const start_time = order.start_time;
        const spent_time = Math.floor((Date.now()/1000 - start_time)/60);
        const duration = order.num_minutes - spent_time;
        const folderName = folderNameInput;
        const orderId = order._id;
        let profile_id = order.profile_id;
        if(!profile_id && url.includes("@")){
            profile_id = helper.getString(url+'/','@','/')
        }
        if(!profile_id){
            let redirectUrl = await getRedirectOnce(url);
            if(redirectUrl){
                profile_id = helper.getString(redirectUrl+'/','@','/')
            }
        }
        let roomData = {};
        let amount_remain = 0;
        if(profile_id){
            roomData = await getRoomData(profile_id,proxies);
            // console.log("roomData",roomData);
            if(typeof roomData.userCount == "number"){
                amount_remain = (amount - roomData.userCount + start_count);
            }
            // console.log(roomData.roomId,roomData.profile_id,roomData.is_live,roomData.userCount,"remain",amount_remain)
        }
        try{
            if(amount_remain > 0 && roomData.is_live){
                console.log("profile_id",profile_id,roomUrl,amount_remain);
                let res = await sendRequest({roomUrl, accountCount:amount_remain, duration, folderName, orderId});
            }
            // console.log("res",res);
        }catch(e){
            console.error(`Error sending request ${i + 1}:`, e.message);
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    console.log('✅ All requests completed!');
    await new Promise(resolve => setTimeout(resolve, 10000));
    main();
}

main();