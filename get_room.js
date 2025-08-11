const path = require('path');
const request = require('request');
const helper = require("./src/helper")
const Viewer = require("./src/Viewer.tt2");
// const Viewer = require("./src/Viewer1");
// const { setTimeout } = require('timers/promises');
let is_live_end = false;
let splice_accounts = []
let cookie_string = 'FPID=FPID2.2.i6VChkCmrwvA1Ja%2FOL6PHnWXV3ZAHb9%2BlntIVyqf89o%3D.1754405741; _fbp=fb.1.1754405741389.1404588911; msToken=R8LCFFqEiCNSQAFqZ2j6tLIaBYZZ8sfe7STW4YSysjFN38Kx6WF26B_92H93fCWTBduMaxJ6uT41roEozEWHySIig_GEnhlY_pxV06qeMRAYz_DRBoXy8UkijZKqxBtOcr_1ff2CkfL1hu6O3lSxFQ==; _ga=GA1.1.165361066.1754405741; _ga_LWWPCY99PB=GS1.1.1754405741.1.1.1754405779.0.0.778815004; odin_tt=2488b39a54fa9c8b475bcc34d7c1d0e017b19b9671c3754278237781d479675d88825d6f1fec00c5e2bcb0edf05dacf3b9dd2270b9afb0506af22e5e86e850efdf41b1c7baff8f4e90f0c7dac465d8b2; store-country-code=vn; store-country-code-src=uid; store-country-sign=MEIEDAFH-wCZoHi2LKbQMgQgKScLH31Ly2pc950apvGvNXZeWPLMpmlIH48hPvCIhwsEEAwhkc0VF5eWsE0y4_57DqI; store-idc=alisg; tt-target-idc=alisg; ttwid=1%7CVDh0A9rjl107qRuihWnfDELBVc_SxELEi0kjvOIQ9GU%7C1754405777%7Cfb941d45ad35972f82d67d5bf8b1996644870945e0f1eb957c062bc2da3d23f6; tt_chain_token=T2sIpsDp58limdbX9IANtw==; tt-target-idc-sign=pRzEbpRJytrCEhVfAlKq8-UddtIqc53DStu-S-qfjBDMTdCKyMmuMbf11Lu6aekJBwaJP47xGbJLccGlc2QK_zOZDPB0vjyQgOJMsAeOaxz6PPAMMuZetQZg0iXFOTxD60sqIOvTl-tgOl44o3gLJ9PZS0F3FaNfXzOKdFu0EzM60oeaK7R7JDFmuUOhczdecRlaylvX7fx7nJ-s3Z6dVz7_qjvpMloRPta7qYMRT_LvQGyVRtohW2qQP0Izh0O-pomLB5FC7f8oCHzolLa04GZ1AJThEIWAiIjq-PMNC8-dfmrMFtnO4dWvnn4iP4PxtS6WULYOeVt9aM8_HNaGIAourTxnRlokVMFYNlPGozITD0foljv9p5n-abfMuyqnocF_vB-Zw5KKrdJAg14mapa2_zR_sTYiU66YnGihgopEqo-8lKWHwphEuYKjrRtKf20wpIccZ_XDqSBU4fA0mqFpNiZKJcoq2TL_7czdoOQHFjIHitC9c_NMzlQh1HU3; cmpl_token=AgQQAPOFF-RO0rivthjV9d0t8vOCV9VSP4oOYN2z1A; d_ticket=90eab6ead097bb445fe47ca7081bb58812167; multi_sids=7534901230502872084%3A854e34cb3a7b48c18ba5b6c84d5cb6da; sessionid=854e34cb3a7b48c18ba5b6c84d5cb6da; sessionid_ss=854e34cb3a7b48c18ba5b6c84d5cb6da; sid_guard=854e34cb3a7b48c18ba5b6c84d5cb6da%7C1754405773%7C15552000%7CSun%2C+01-Feb-2026+14%3A56%3A13+GMT; sid_tt=854e34cb3a7b48c18ba5b6c84d5cb6da; sid_ucp_v1=1.0.0-KDBlNzk5Y2E2ODhlMWQ0MzhlNzk1N2NjMzE3Mjg3MWJiMGE3OTA1NjMKGgiUiJzu9ZfWyGgQjbfIxAYYsws4BEDqB0gEEAMaAm15IiA4NTRlMzRjYjNhN2I0OGMxOGJhNWI2Yzg0ZDVjYjZkYQ; ssid_ucp_v1=1.0.0-KDBlNzk5Y2E2ODhlMWQ0MzhlNzk1N2NjMzE3Mjg3MWJiMGE3OTA1NjMKGgiUiJzu9ZfWyGgQjbfIxAYYsws4BEDqB0gEEAMaAm15IiA4NTRlMzRjYjNhN2I0OGMxOGJhNWI2Yzg0ZDVjYjZkYQ; uid_tt=7cda5441db5fec920aa4858decc07db358d44fcd4d1732706bdac5f507ef4f85; uid_tt_ss=7cda5441db5fec920aa4858decc07db358d44fcd4d1732706bdac5f507ef4f85; s_v_web_id=verify_mdynw9az_N9O0pj2s_FbC9_4SwP_9Zom_ULNna5pwMyH2; passport_csrf_token=99153358afe59f627b6cb18418a7d488; passport_csrf_token_default=99153358afe59f627b6cb18418a7d488; FPAU=1.2.569675048.1754405741; FPLC=ccsFyrlSmdCepHZe1iDD5T5vLexpMVOauNc9qsIwVbHHGxX3hV8XTsAoeAjInjpXtH4Jix4EcBIgkS4ndr4aJuvL1VmcMexj2PxC9A5HLa%2FSytU0S1u9D1%2FlPXh%2B0Q%3D%3D; tt_csrf_token=3sALUd8G-K6K_FcU7PsSipCPCsMXd6R5wDVM'
// let room_id = "7404131027976817425";
try{
    let {room_id} = require(__dirname+"/data_room_mul.js")
}catch(e){
    let room_id = ""
}
let number_room = 1
if(process.argv[2]){
    number_room = parseInt(process.argv[2].trim())
}
// checkMemory()
function checkMemory() {
    setInterval(function() {
        try {
            const used = process.memoryUsage();
            console.log(`Memory usage: ${Math.round(used.rss / 1024 / 1024 * 100) / 100} MB`);
            if (used.rss > 200 * 1024 * 1024) { // nếu sử dụng hơn 800MB
                console.log('Memory usage too high, forcing garbage collection');
                if (global.gc){
                    global.gc();
                    setTimeout(() => {
                        global.gc();
                        
                        // Kiểm tra lại bộ nhớ sau khi GC
                        const afterGC = process.memoryUsage();
                        console.log(`After GC - RSS: ${Math.round(afterGC.rss / 1024 / 1024 * 100) / 100} MB | Heap: ${Math.round(afterGC.heapUsed / 1024 / 1024 * 100) / 100}/${Math.round(afterGC.heapTotal / 1024 / 1024 * 100) / 100} MB`);
                    }, 100);
                } 
            }
        }catch(e){
            console.log("error check memory",e)
        }
    }, 10000);
}
let maingetroom = async () => {
    let time = 5;
    let proxy = "" // https://abc:abc@182.223.12.32:304;
    let proxy_list = [];
    while(proxy_list.length == 0){
        try{
            let proxy_data = await helper.makeRequest({url:"http://217.15.163.20:8549/api/cron/getliveproxies?authensone=mysonetrend&time=900", method:"GET", headers:{}, body:""})
            proxy_list = proxy_data.bodyJson.proxies;
        }catch(e){
            console.log(e)
            await helper.delay(1000);
        } 
    }
    proxy = proxy_list[Math.floor(Math.random() * proxy_list.length)];
    let promises = []
    let session_ids =[ {id: "854e34cb3a7b48c18ba5b6c84d5cb6da", proxy: "http://bupmat.ddns.net:45404" }]
    //afb952619029f7e28438137612c72a8d

    for(let i = 0 ; i<session_ids.length ; i ++){
        promises.push(getLives(time, session_ids[i].id.proxy ,session_ids[i].id))
    }
    let results = await Promise.all(promises);
    let obejct = {};
    for (item of results) {
        obejct = { ...obejct, ...item }
    }
    let result = []
    // let obejct = await  await getLives(30, proxy, session_id)
    let room_ids = []
    let names = []
    let name_select = ''
    let room_select = false
    for (let key in obejct) {
        // console.log(obejct)
        // result.push({ display_id: key, ...obejct[key] })
        if(obejct[key].status == 2 
            && obejct[key].user_count < 70
            // && room_ids.length < 20
            ){
            room_ids.push(obejct[key])
            // name_select = key;
            // result.push({"url": `https://www.tiktok.com/@${key}/live`,"amount": 100,"num_minutes": 30})
            // var room_id = await helper.getRoomId({name:key, proxy});
            // console.log('room_ids.length',room_ids.length,room_id)
            // if(room_id){
                // names.push(key)
                // break;
            // }
        }
    }
    // console.log(room_ids)
    if(room_ids.length == 0){
        await helper.delay(5000)
        return await maingetroom();
    }
    room_ids = helper.shuffle(room_ids)
    let number_room_pass = 0
    for(let i = 0; i < room_ids.length; i++){
        let count_join = await onlineRoom(room_ids[i].room_id)
        console.log(room_ids[i].room_id,count_join)
        if(count_join == 99){
            room_ids.splice(i, 1)
            i--
        }else{
            number_room_pass++;
            if(number_room_pass >= number_room){
                // break;
            }
        }
    }
    let room_ids_string = room_ids.map(i=>i.room_id)
    room_ids_string = helper.shuffle(room_ids_string)
    console.log("room_ids_string",room_ids_string.length)
    if(room_ids_string.length < number_room){
        console.log("room_ids_string.length",room_ids_string.length)
        await helper.delay(5000)
        return await maingetroom();
    }
    room_ids_string = room_ids_string.slice(0, number_room).join(",")
    room_select = (room_ids[Math.floor((Math.random() * room_ids.length))]);
    var room_id = room_select.room_id;//await helper.getRoomId2({name:name_select, proxy:session_ids[0].proxy,cookie_string:`sessionid=${session_ids[0].id};session_id=${session_ids[0].id};`});
    // console.log(`https://amazingcpanel.com/omg-api?token=nrfQUuNEMXGmNYV0guwRxRqmcNygppKzLpD3Kl8vqCGquqG2r8QxHm6XuHg13dZxV8bwZ6MA1hsGTNuxYTV59cjZabjldaqh5AQn&action=order&service_id=201&promotion=AMAZINGLIVE&orders=`+JSON.stringify(result))
    // console.log(result.length)
    console.log(helper.getTime(),'room_id',room_select.username,room_id,room_select.user_count,`https://www.tiktok.com/@${room_select.username}/live`,'total',room_ids.length)
    console.log(helper.getTime(),"room_ids_string",room_ids_string)
    if(room_id)
    await helper.writeFile({path:__dirname+"/data_room_mul.js", data: `module.exports={"time":"${Date.now()}","room_id":"${room_ids_string}","is_off": false}`})
    
}
async function onlineRoom(room_id){
    let cookie_string1 = "store-country-code-src=uid; _ttp=2Xa0z5zsceA0cxIN9nhb5M2KioD; tt_csrf_token=ghFQU3l9-jG3g6kfJoqK3JQEhc3DW30DcUsc; s_v_web_id=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc; store-country-code=vn; tt-target-idc=alisg; tt_chain_token=ZI/n+AZUuVDJ7UiekYIePw==; _ga=GA1.1.1372313721.1742701466; FPID=FPID2.2.GkdIqM1xTtro1PM5WJJ0bFRa2BCMrwpowAzpIqB9WLs%3D.1742701466; _fbp=fb.1.1742701466359.2035966759; FPAU=1.2.262906749.1750480472; _fbc=fb.1.1752551226066.IwZXh0bgNhZW0CMTEAAR6RWeAV-fCT8fEEhW64qlIELBowsFX9Chr4bxKPdkGzDFU9KzrMEbE1aDI-IQ_aem_pckLemE8tBfpznlmhpyjcg; FPLC=WkNeIZ2JMp4zwXDp2633K9usdkHHaCXLbtuEgQu1Gm6LOryp6uHkGi%2FKd73bZxmLTxWkcDwdL%2BXflfZIkzCZZ5uU7Vv3PTJqM%2Bal0l2kmB4tRfQqa9d2Mwg9TeKAxg%3D%3D; passport_csrf_token=42206ccfc309c5d8b3a9ad0161614910; passport_csrf_token_default=42206ccfc309c5d8b3a9ad0161614910; d_ticket=493d4c6a0d5a26f309f9d97afa71130fb3387; multi_sids=7486540712688043026%3Af113c591a753752e87c0041313309885%7C7491909222662276103%3A50e742dabc45fde8befa7e26cf8b0624%7C7421520010978821126%3A7b8e65192a4e60d463ba23ee00d9d5f2%7C7534901215508464661%3A02ebd88f34c3c715473577894ac60bc2; cmpl_token=AgQQAPOFF-RO0rivthxoOF0s_b_p3KgTv4MOYN2z9g; uid_tt=b5be35709c7ea05ffaf890d5e69be86a32d8c8e09a4294262c033d942f14acc3; uid_tt_ss=b5be35709c7ea05ffaf890d5e69be86a32d8c8e09a4294262c033d942f14acc3; sid_tt=02ebd88f34c3c715473577894ac60bc2; sessionid=02ebd88f34c3c715473577894ac60bc2; sessionid_ss=02ebd88f34c3c715473577894ac60bc2; sid_ucp_v1=1.0.0-KDg0OTJiYmUxZDhlY2NlOWI2NmM3OWVlZDdmZDE5NDQzN2U3ZDFlZDIKGgiViKqAvpfWyGgQ_qjIxAYYsws4BEDqB0gEEAMaAm15IiAwMmViZDg4ZjM0YzNjNzE1NDczNTc3ODk0YWM2MGJjMg; ssid_ucp_v1=1.0.0-KDg0OTJiYmUxZDhlY2NlOWI2NmM3OWVlZDdmZDE5NDQzN2U3ZDFlZDIKGgiViKqAvpfWyGgQ_qjIxAYYsws4BEDqB0gEEAMaAm15IiAwMmViZDg4ZjM0YzNjNzE1NDczNTc3ODk0YWM2MGJjMg; store-idc=alisg; tt-target-idc-sign=tIJRT0XKM0zvLb2MuVh7A5D65AAnj0A-OOoNOgHTgD7sHT7S482k0I1OAoLQMqv0aqBT47Eu1SVKP2UpUTlEWadJNlU4wrETt4J5l1rgtCP9s8HuC36tG3WLwmya19kdfHE0F5RxZezHHb0zzS6RsthybAVKOTh-OA1ULcOz_x-dMfROaD6fX_Zcgd3QS3d8JltamhkIScoT4rY4bbLODTrI6AZ_v6hSkB2nkYI980d4Lf5VO3takeh7ZfCMWGyT0812mi4-CY8IUVHA1pwOm8cELZCuFdgsrQEmR0kv03-Plp0iCKcJs67J-JSgEehAXL4y88p6KVzRuhfI9E8tAehuWOrI13t_o9ilTDAP3NLCYP8fnb3nK32y8IHmA0ju46zGGvayeq_UvfAQpF6rS41zDffDOBbIvS_T3rsSWRn7sT6lbjA1-OlEls_66bAnMXkP_HAXweBjloLiX-KygqIRNcQviqB3QHV9kgvUrKzb_a73knQMXYn3syiO9Iy8; sid_guard=02ebd88f34c3c715473577894ac60bc2%7C1754403968%7C15551998%7CSun%2C+01-Feb-2026+14%3A26%3A06+GMT; odin_tt=32e687748ba21c6acb87f8e92924ae7042e2ef2aad936bd0db98499e3bbceb7becaa1f25e9e0edffcb79d028a0c718dfa9b17f5d0255d626d290a8d436506515734faeeffdc9693d7b07d668243a463b; _ga_LWWPCY99PB=GS1.1.1754403946.359.1.1754404025.0.0.393784851; ttwid=1%7CvdhT4GdjweC_vubE4LD1KqcTjJUq7XnK6LBh8gcXCdE%7C1754404026%7Cdbe292793a699917b78ec48f7e65e336f819f939152264b123ef9fbf5813d5b6; store-country-sign=MEIEDATLNr0-SH3ajX-vFgQgMiMJL8MSSVJ2kLMnCS-KwEDYhsEM-Hs1yeTqO1luxMsEELMBg47ZgrLVPsAUTljZSYY; msToken=Rzzbv47ayA44eYcxbfbU50KJYgGdq0kQa6oDuF-FaaswPwxwqx4OPFYZ05UOiWepubhUoumqlj0ZeWqu4YT9meAsIY3sCwuuEGK0wlTyJ0CAf3BobyN4T1_oe1IxUJa-6ACL1iu9ksQBO6_sabwBs4uB6hY="

    let data = await helper.getRoomUser({room_id,cookie_string: cookie_string1})
    return data?.data_user?.length
        
}
let getLives = async(time, proxy, session_id) =>{

    let get = async (session_id) => {
        let r = {};
        console.log("session_id",session_id, proxy)
        let url = `https://webcast.tiktok.com/webcast/feed/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F134.0.0.0%20Safari%2F537.36&channel=tiktok_web&channel_id=86&content_type=0&cookie_enabled=true&data_collection_enabled=false&device_id=7503068479504139783&device_platform=web_pc&device_type=web_h265&focus_state=true&from_page=&hidden_banner=true&history_len=2&is_fullscreen=false&is_non_personalized=0&is_page_visible=true&max_time=${Date.now()}&os=mac&priority_region=&referer=&region=VN&req_from=pc_web_suggested_host&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=false&webcast_language=en`
        // url = `https://webcast.tiktok.com/webcast/feed/?aid=1988&app_language=it-IT&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F116.0.0.0%20Safari%2F537.36&channel=tiktok_web&channel_id=86&cookie_enabled=true&device_id=7242723483242920000&device_platform=web_pc&device_type=web_h265&focus_state=false&from_page=user&hidden_banner=true&history_len=3&is_fullscreen=false&is_non_personalized=0&is_page_visible=true&max_time=${Date.now()}&os=mac&priority_region=VN&referer=&region=VN&req_from=pc_web_recommend_room_loadmore&screen_height=900&screen_width=1440&tz_name=Asia%2FSaigon&webcast_language=it-IT`
        let res = await helper.makeRequest({ proxy, url, headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Safari/605.1.15',
            cookie:  `sessionid=${session_id}`
        } })
        
        if (res.bodyJson && res.bodyJson.data) {
            res.bodyJson.data.forEach(i => {
                r[i.data.owner.display_id] = {username:i.data.owner.display_id, user_count: i.data.user_count, status: i.data.status, room_id: i.data.id_str }
            })
        }
        // console.log(r)
        return r
    }
    let results = []
    for (i = 0; i < time; i++){
        let res = await get(session_id)
        await helper.delay(10)
        results.push(res)
    } 
    let obejct = {};
    for (item of results) {
        obejct = { ...obejct, ...item }
    }
    return obejct;

    let result = []
    for (let key in obejct) {
        result.push({ display_id: key, ...obejct[key] })
    }
    console.log(result)
}
const main = async () =>{
    const assert = require('assert');

    process.on('uncaughtException', (error) => {
        if (error instanceof assert.AssertionError) {
          console.error('Assertion Error:', error.message);
          // Handle the AssertionError, but don't let it propagate to the top level
        } else {
          // Handle other types of errors
          console.error('Unexpected Error:', error);
        }
      });
    // let acc_string = await helper.strData(path.resolve("./data_test/acc2_18k6_1k.txt"));
    // let proxies_str =await helper.strData(path.resolve("./data_test/proxy.txt"));
    // let acc_string = await helper.strData(path.resolve("./data_test/data_test_vps_account_thinh.txt"));
    let acc_die_string = await helper.strData(path.resolve("./101.txt"));
    let acc_die_array = (acc_die_string.split(','))
    let acc_string = await helper.strData(path.resolve("./data_test/acc_vps_thinh.txt"));
    let proxies_str =await helper.strData(path.resolve("./data_test/data_test_vps_thinh.txt"));
    let proxies = helper.parserAccounts({ acc_string: proxies_str, getIndex:0, number_slice: 1000, key: ",", number_ignore:0, format: "proxy", key_format: "|", item_return_type: "proxy"})
    proxies = helper.shuffle(proxies)
    let accounts = helper.parserAccounts({ acc_string, getIndex:0, number_slice: 1, key: "\n", number_ignore:1, format: "u|p|t1|t2|cookie_string", key_format: "|", item_return_type: "cookie_string", preReturn:(object, cookie_string)=>{
        let sessionid = helper.getString(cookie_string,'sessionid=',';')
        if(!acc_die_array.includes(sessionid)){
            // console.log(sessionid)
            return cookie_string && cookie_string.includes("sessionid=")
        }else{
            // console.log(sessionid)
        }
    }})
    // accounts = helper.parserAccounts({ acc_string, getIndex:0, number_slice: 10, key: "\n", number_ignore:10, format: "cookie_string", key_format: "|", item_return_type: "cookie_string", preReturn:(object, cookie_string)=>{
    //     return cookie_string && cookie_string.includes("sessionid=")
    // }})
    // console.log("length", accounts.length,proxies.lengthl,proxies)
    accounts = ['passport_csrf_token=414dd83deb32c8e82fa0eaa66de7d038; passport_csrf_token_default=414dd83deb32c8e82fa0eaa66de7d038; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt_chain_token=m/gdioiLsRXvAUR1HdCgIA==; multi_sids=7260830958101595142%3A645e2a24e6e7d7d68d82777c4c10650c; cmpl_token=AgQQAPOFF-RO0rT9Se7n_N0__YFn7Q9N_5cOYNivgw; passport_auth_status=03526899704d9c50ca2e8f5d834d8768%2Cdd335b683f6bedc40d2dfda83ab2a1fc; passport_auth_status_ss=03526899704d9c50ca2e8f5d834d8768%2Cdd335b683f6bedc40d2dfda83ab2a1fc; uid_tt=ddcf440fc87d5e03385f9239d9ffcf977d1f3ee97c045e55e19548b7baad9a1f; uid_tt_ss=ddcf440fc87d5e03385f9239d9ffcf977d1f3ee97c045e55e19548b7baad9a1f; sid_tt=645e2a24e6e7d7d68d82777c4c10650c; sessionid=645e2a24e6e7d7d68d82777c4c10650c; sessionid_ss=645e2a24e6e7d7d68d82777c4c10650c; tt-target-idc-sign=CSgkKAw7kHl6Kb5VF1C1Fid25VZPho1kBLzAX2msNPcZpruxqo8yBeFAIjIHlJPaqizgedIWHDkl-wGTJ1uAuO260Jka14Vhn4N6xHxKYZ_8K817wHJrpsL3mLj-qdDuJvALX2xW2MLvZyMFRPxw7KFPsQAzYfh8oWtk435c5owYqbdsFT2N5Y2-eruruL8zpJkSw43SwrObe_J80yPJoLIRiiFEOvBljYhMfAG0gJNfyEgQeXjdoymZoLwz0Fz2Glt45GtWcziWPAltPmC07GPSsEApD5QN7XKBso31CDToazvceE_QA02SFMoawZr_oYgLqusUsuyB5mRQHDN8IRhNsPQJOPtliRqzAvh1IMPRoFsPKwKA2qr-1LSLEi8Bv0ZEgQJ4gLGVv1M119l1Vqj302g8TDi2DRalatmJuPyGS2_I6W1glBZg9CL3rJG9q8AgT2mh6t4YntVs9uThvDxmwMO5jS72N7hz5oKmbFZYXNqhv3YoiCRkvf9GCLBs; sid_guard=645e2a24e6e7d7d68d82777c4c10650c%7C1742798825%7C15551997%7CSat%2C+20-Sep-2025+06%3A47%3A02+GMT; sid_ucp_v1=1.0.0-KGNhNDY5ZjAyNzFlYTFiNTMxMWUyODhkNzgxOTE0YTk3MGRiNmJkNTMKGQiGiLj-lunp4WQQ6f-DvwYYsws4CEASSAQQAxoDbXkyIiA2NDVlMmEyNGU2ZTdkN2Q2OGQ4Mjc3N2M0YzEwNjUwYw; ssid_ucp_v1=1.0.0-KGNhNDY5ZjAyNzFlYTFiNTMxMWUyODhkNzgxOTE0YTk3MGRiNmJkNTMKGQiGiLj-lunp4WQQ6f-DvwYYsws4CEASSAQQAxoDbXkyIiA2NDVlMmEyNGU2ZTdkN2Q2OGQ4Mjc3N2M0YzEwNjUwYw; _ga=GA1.1.1109430864.1742798836; FPID=FPID2.2.OJRGTMxiqdLaaLgTlv%2BoaOwLRMQ8Ng85R2sEZ4UuT5k%3D.1742798836; FPAU=1.2.1567491046.1742798836; _fbp=fb.1.1742798836189.1943082367; FPLC=w6yM%2FEgVmGlTLGtKhQsjnyXDUKgcYZiGFxcZ%2BbObiIdvwwOp0wZYKo6QFDKk3WKqrt%2FT4b%2BGCdK4UYZSyYZwf9sn7hnVOrsTaQtNldZaQZbYCOCASMsbyPIPWeak%2Fw%3D%3D; tt_csrf_token=LPFdUfF4-wvVDAp0TIIHsh2uusU_vEzIBuKw; ttwid=1%7CzK1dsnUZBNCCbWLbb9O11-fulRctixWrGZTApi4GCGo%7C1742979234%7C24cf9b5b3ea9620a43a2d62483e771c857ca8d581e576c143ffd16844a5fa92c; store-country-sign=MEIEDIHsOlbbVLatuPLmkQQgpOd07NJkPiWeFdNqGVf5ncQVZJQwegBVb6TvsT3p7dwEEE6MnbJX5Us_wPgUXOwtqh8; odin_tt=e9fb8e5672418f2106b85ea931194d939e03c94abdffce9c0462523e55662d1f35613d3c6e5d103ca48ca90cac3b312231170ce220ee9f1885f1a47a98659cfc76c650b269250cc28138a66b7f1034d7; csrfToken=CbH86T1g-jFcmXYOlI2Mopnh58wcL-soE0bA; csrf_session_id=cda935068d84c90cfe0b01f4f1caf89b; _ga_LWWPCY99PB=GS1.1.1742979235.3.1.1742979242.0.0.202825251; msToken=xRiXvCDEuSQtptmKV4TvyBZWku3HV5jNJMwcMMLWFQeRKMAHGAGhkK5UvHbnw8e_FJIQCy8cPzdRKfFb5LfClCmF5QgNDONhQWfVSHSi55WGkJbw-Hr8tJaaWNnFUsl62f9CEAxKHntbfFW-U8WE6xAm']//haravanshop
    // accounts = ["store-country-code-src=uid; _ttp=2Xa0z5zsceA0cxIN9nhb5M2KioD; tt_csrf_token=ghFQU3l9-jG3g6kfJoqK3JQEhc3DW30DcUsc; csrf_session_id=e74da40570f76254c0ecc9e9fab39943; s_v_web_id=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc; store-country-code=vn; tt-target-idc=alisg; d_ticket=5ec678f4eeb803883c1c486e6db449cd94da5; uid_tt=7c29dce7c8081a51e88c7bcaaf1517da6dbe021eadb39fc00cfdd085f58ed46c; uid_tt_ss=7c29dce7c8081a51e88c7bcaaf1517da6dbe021eadb39fc00cfdd085f58ed46c; sid_tt=d293940bbc3ab94d9f9d58244e547a66; sessionid=d293940bbc3ab94d9f9d58244e547a66; sessionid_ss=d293940bbc3ab94d9f9d58244e547a66; store-idc=alisg; tt-target-idc-sign=rklYFDWE2PpeekDL8ZDgwYVkPrxiaFrhxnA_sJ0LDS37XuVSm93lWFmvT7uDqNNYoiOPK9Brq4PoorUwmCuoUSpRmW-D-OnhJR5m20w8u_LqE3d8BHrJwKQoMCUhK8Dh5lz1oI9w8UyLYdcCeHwiOKGvWmsMoXnJFmIFAJrFDNC_WF_GZNYPqW5cYFWzlxTfjRR9Yo-wTTmaWiXGypP5vm5rOeRJZzy5xIxBcJL7diOEPash2hdKX8NT7McUCE-MlEKs9SfvUlZX1-JtMPIM6ajbbVDVw4v1PWVi55dQgNOo8VjvHWlbFXrQKHmjrhuLEkkAEwHDAa89RNx-G12D2OzWrfk25NBRe_dO_XSB1RG8sEVR0E2Kl53-wsBsSufFbi6cvKDcL5pTQ0wzvVezjILuOsYnH7Nm225NVVGkE5Ej2KkA16lYI6nvISRUjMjQZIganKqMlU1lvIBEHswJ1Nhqu9G72ByRKeQHemrvkvXSMX4FOa_ED99VcIAX2SDR; sid_guard=d293940bbc3ab94d9f9d58244e547a66%7C1742631164%7C15552000%7CThu%2C+18-Sep-2025+08%3A12%3A44+GMT; sid_ucp_v1=1.0.0-KGUwNmE5NjZlNTM5YTU2ZjQ0YWE1MmYzOWNhYmY1Yjg0NWRhY2RlZjMKIgiGiOLekKSi_2YQ_OH5vgYYswsgDDDHkvq3BjgEQOoHSAQQAxoCbXkiIGQyOTM5NDBiYmMzYWI5NGQ5ZjlkNTgyNDRlNTQ3YTY2; ssid_ucp_v1=1.0.0-KGUwNmE5NjZlNTM5YTU2ZjQ0YWE1MmYzOWNhYmY1Yjg0NWRhY2RlZjMKIgiGiOLekKSi_2YQ_OH5vgYYswsgDDDHkvq3BjgEQOoHSAQQAxoCbXkiIGQyOTM5NDBiYmMzYWI5NGQ5ZjlkNTgyNDRlNTQ3YTY2; tt_chain_token=ZI/n+AZUuVDJ7UiekYIePw==; _ga=GA1.1.1372313721.1742701466; FPID=FPID2.2.GkdIqM1xTtro1PM5WJJ0bFRa2BCMrwpowAzpIqB9WLs%3D.1742701466; FPAU=1.2.726648848.1742701466; _fbp=fb.1.1742701466359.2035966759; FPLC=ogjREEWZolvJN8jblA1OMlsyAcPz2g0nix6ucOMnMaKxnWeMw%2BY7hA8BV1zAYjKNmI6L0jpq5%2FiBG9slCSvphKY71ICb6py%2Ba%2F0CheeURSAVJMYIy0Si4ICJIofH%2Fg%3D%3D; ttwid=1%7CvdhT4GdjweC_vubE4LD1KqcTjJUq7XnK6LBh8gcXCdE%7C1743145358%7Cefca8266dc7c1efaa3cda7d16b4586a2adf2d1e5a9fa3e8c5bfbe861299f0043; store-country-sign=MEIEDND-cxu6QzfpfqVfcgQguHFXkGB2fG-UTGQOIe3joc5Vf8wAEVgWXfmEsild5BYEEIhEtfZkjqU7M5OZFGGBVus; odin_tt=3f81e6bf8aa13c8ab16ce8bdeb4cb1d1679f516d117f33cc6d973c2e3fe19c695eab355ef77b956d9c69aefec7e30933b78631f50325bb4ddfe1f67a900bab6fa2a62c8c1848fef701adcc74791bc039; _ga_LWWPCY99PB=GS1.1.1743143839.6.1.1743145360.0.0.1810640825; msToken=yoiqI6nN_fQUuwNVYJ_8aVjcH0VJuWetuYCumZM-Howe6uQJG4UFK46BY3AcMreDr9YCp9b_16Sb6MTejnx4yHLLfjpNGSXemG5z1H-LozawgIE3r-4kH03Hir_W286D0Ky7XnF3iXSK9hCGuVULZOHwDQ=="]
    // accounts = ["tt_csrf_token=cFcIKZcd-ydRMj9cP-pR--nTL9kyvIUJ0ZiY; tt_chain_token=WcYClxTAjifBnkuVt7RNBg==; ttwid=1%7ChcohAq3MBoMx8LoAO71XZQCsCQOoarHodVfPmt7paLI%7C1743150357%7C6575e464cc650122c07f28655ea159fa03928bd058e2f8aef5e6fa77b89af1e0; s_v_web_id=verify_m8siprwu_BFdhLBfi_X6TQ_4IMI_BZUg_RXWMXM55Q7gF; odin_tt=89f502ca0815f237d93bd01f59cef2e26523ac1aed09535540c2d5bb08ab23ce90554aff3a798b84b3ae83afe476c62763374fe4ef75a70ff57183339d40c25b374f7d82ef0b63c8e954ba77301261e7; _ga=GA1.1.306695536.1743150363; FPID=FPID2.2.AtPWSSRPBPDFAUwkBoQ6EqGBy6%2BgykoMQ6NDi7fe3XU%3D.1743150363; FPLC=CePCwJQ393UYPGymsX87qgBEqLroABfpk%2BxyBdRb5A4%2BjtPi02MHhgxTWXLLwAXrxPVyBSNyss5YB52PafmHgk%2BCvrZO%2BcloeW%2FOsPYUdEa0xga55OgIVbh6wCDsUQ%3D%3D; FPAU=1.2.2058894693.1743150364; _fbp=fb.1.1743150362939.1320266986; csrfToken=PfrlWn8v-j2bhwhJDzOMB2UeArTjk8xVXG2I; _ga_LWWPCY99PB=GS1.1.1743150362.1.1.1743150373.0.0.186791239; msToken=pfmhrNqmsPioL-0iNenwizNnsGCxJa5g4Xp4VBKlUvlSFMnUhUqGAxz80_Li4oF01kQW-4LbW0I9TQUK20B15DVQ89ITC3wLMjcaIR2wEVZIMSZoQ6pk6jXCLHMg5pM0T_Gg96-R3Lozd_4R24XRbHu3JQ=="]//ok
    // accounts = ["msToken=pfmhrNqmsPioL-0iNenwizNnsGCxJa5g4Xp4VBKlUvlSFMnUhUqGAxz80_Li4oF01kQW-4LbW0I9TQUK20B15DVQ89ITC3wLMjcaIR2wEVZIMSZoQ6pk6jXCLHMg5pM0T_Gg96-R3Lozd_4R24XRbHu3JQ=="]
    // accounts = ["msToken=_0fHzXW5uu40f3MpFP_M1nb9MBRC0JqRig977Mw27Zf2FVi7FSRYMsY2MRoKqN3cYitPRQsxno2earDeTW1CfV57BoOx2ffzsNRSXkpCBXnhbcQLTwbnG4MhOJq72V_Uar4g3yEsGlcRR5sY_eG6w96Z9w=="]//bi 403
    accounts = ["tt_csrf_token=y4ZWhACC-ThzV7Rof94VkhxPafXCKkxGppj4; tiktok_webapp_theme_source=light; tiktok_webapp_theme=light; passport_csrf_token=eae1f57dad60f465e88e59da9b2d1412; passport_csrf_token_default=eae1f57dad60f465e88e59da9b2d1412; ttwid=1%7CezchXXlx5z0-5q56sZ2ik-080U4rAuUniX1eRHwO0hM%7C1743096238%7C24ac06b6f508e71d057bc2b57040cd66ac2a50b3fb3a993be3c423a5edb7a2dd; msToken=0uFOWbVYDVFUtt0SWZSa-4fiNHbccUqkoLSc3OrJNQVozd8-eHMA1lIb5NDUo6SAz0gZ13vNLE-vlhcl57RqOAg-hGRSC-HeyMYkHXLkE-lQQNNtTyOkNy04YE0=; s_v_web_id=verify_m8rmekuj_fLNeacsu_FyRP_4JG2_8sbx_DeUUAJHGgMp6; odin_tt=467a31bdc671d1accf7de7ecc9f45cf81e6b9356e5140b9adbe3083cbf6a677bfaf91c68ccd4af1d7970531428daba4c794fa22c13c652c230da5844fd0322f4; multi_sids=7486540712688043026%3A8f7350d8ff1c51c5f72156ec455cd516; cmpl_token=AgQQAPOFF-RO0rfbZ7tod50r_YQQSbVT_5AOYNjSIA; sid_guard=8f7350d8ff1c51c5f72156ec455cd516%7C1743096268%7C15551999%7CTue%2C 23-Sep-2025 17%3A24%3A27 GMT; uid_tt=ef9ea16a63cf7124b27519eb0822c9541219326f6bb41d27e490888c369e9b82; uid_tt_ss=ef9ea16a63cf7124b27519eb0822c9541219326f6bb41d27e490888c369e9b82; sid_tt=8f7350d8ff1c51c5f72156ec455cd516; sessionid=8f7350d8ff1c51c5f72156ec455cd516; sessionid_ss=8f7350d8ff1c51c5f72156ec455cd516; sid_ucp_v1=1.0.0-KDQ4ZjBjYzU0NWViOTJiYmE4MGFjMzI4N2U3YTIzNTc1M2QxZmE4NWMKGgiSiJWCzqPi8mcQzJOWvwYYsws4AUDrB0gEEAMaAm15IiA4ZjczNTBkOGZmMWM1MWM1ZjcyMTU2ZWM0NTVjZDUxNg; ssid_ucp_v1=1.0.0-KDQ4ZjBjYzU0NWViOTJiYmE4MGFjMzI4N2U3YTIzNTc1M2QxZmE4NWMKGgiSiJWCzqPi8mcQzJOWvwYYsws4AUDrB0gEEAMaAm15IiA4ZjczNTBkOGZmMWM1MWM1ZjcyMTU2ZWM0NTVjZDUxNg; tt_ticket_guard_has_set_public_key=1; store-idc=alisg; store-country-sign=MEIEDIKgDJE6yP_e34ruxgQgCWAlFs3o9NMjNRp6xV_9W-NXKLX2jUDi0Dixp5p-2aYEEHq7Apu-zaJ7XkRsIEe72Kk; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt-target-idc-sign=i8p6SE3IPxxWzb-srrJyEh-OFPNLtWsyhvkSWoWEh1yVdiOQgnQAHr-cA72lDqTL7oB3uGpAM_qNqn3-UaBUGYQ3JiD80EmtU3B1PCmRHaurZh-EXbcEMMSEzLpggzPzBpN3Kobxzn_LE3_CASkKumIFgiv8ylOu1z3XKEcXbgzT3H6vTRf1BoIM3UWokQSyVqWkRAXoEgWTJzslcsCVIZY4evayj5wczzhhsKegCCQcEjZB49kKfIpLYdRtc1eZ7hWpN_KJNRmPtO36-v20OoVcYzYIXAgk30cL0CjIBQE-5eg3O9Fz-8vCvCFKsZQxFMWpnqAyuZNqhrx3kAdYaEAVVzcHwIz8MH2JyhP3YCw0xkcMRHkYOXwxYPmEHLPYN3MqNO7ROjKJO-2zc5EskROb1t4zmGRqM1Rc725NQW36lIfXiWhJ3i_inMUl7SINhFKdpsxOQ1DpLjrGBpeR7roRK0JNmn5jfIMrzZWyHHBe6ySLTnsG2iNJW3MZAaGt; msToken=FcdCNzif1pU6x1M9x_xGtl-sV1VPkrshMbx9BwuithJsVGRkeK0BezzI3KqKOMmD27r07rS1klLZWQztqGHua4EQXjexPtZREP9Ac8EVKFH-y8ut3pHCkuUo2ipE8WjQWTDnKPvN3ioR;"]
    //msToken=yV0CkGeWW1py6HkU-HMIFE3KQ90cBKo2Buihs6g0sF7ZnDF4EOgfpo-5A8yYmjr-PCCvKoPGazExvLyd3bkEqhY1XBU086vokbDeRHyUDdKb0NiLbqO9f6VL-DhDA7uUoUOCpCuGhIN-;odin_tt=9a4da9797b210b5ca149ef22b2d7b181c6cc4788b321baa9759b12d3d3f205b6db6de8766351ef0737cbbd694680ac467b05b1f97887d4e72ef56fa6632092a8c5f2c0e8fb5d41e6fc4797bf59d50875;ssid_ucp_v1=1.0.0-KDJhMjM2YmE4ZGJmZjRhN2YzYTFmYWY5NTMxY2E3MjcwYWE2MTZjYzYKGgiGiN7kwO-Vv2cQt-nbvQYYsws4AUDqB0gEEAMaAm15IiBkZmE1NTU1YjE3N2IyOTA0MGU0YTUwMzEzNGVlMWFjZQ;sid_guard=dfa5555b177b29040e4a503134ee1ace%7C1740043447%7C15551994%7CTue%2C+19-Aug-2025+09%3A24%3A01+GMT;passport_fe_beating_status=true;tt-target-idc-sign=JVGGLkayxOf2RbEUfSafRPoqi7VSuAfjakFFEGZts-8ClBNIx4_REES-k9CNHlCmXXWV-5q0h2-SnJ47sl_TLhe9NFg-QG5uIUfVICB1gE3WtIA6B-UIXxMYyRgK_qpMAKdjKnzrdy4lucTbg3KmPYkZqVNK2eV9--bVzEM_inpfsYqX8J4mWkWTaccwJVmWgGMlWRtTv2SncJbaWuwZ_yuTdSI36ndzIs8FfpwHhUH6c5jYo7658_DARl4p2-sJsCws2dP0woFBmxgdcdv655H6jy36-_c9YZ1oiXXcSrZGC6DBQtXFqcABWxS2C3p9tCQhhU4y5imdjOkcwFMMnIa1LSir8Yn1q6dZ4cqqQSQBHfFXgAyyBGZqyhKVFFrY2x0jjyzfGyOL-GxD0xaLGHRsoYNdrccbqfUv1dTQPwuaNbvy3LPp0JTEW_6edQn5_2-k9GJwD_mFZmrga_eKYPv29yIGGU_SXhsbsyIKP_31fDoeBtF24D34uAN1SGue;tt_csrf_token=u8jPFD5p-gbcXYdhJxKbzVlRB3Z6AK1PsWZo;store-country-code=vn;sessionid_ss=dfa5555b177b29040e4a503134ee1ace;sid_ucp_v1=1.0.0-KDJhMjM2YmE4ZGJmZjRhN2YzYTFmYWY5NTMxY2E3MjcwYWE2MTZjYzYKGgiGiN7kwO-Vv2cQt-nbvQYYsws4AUDqB0gEEAMaAm15IiBkZmE1NTU1YjE3N2IyOTA0MGU0YTUwMzEzNGVlMWFjZQ;uid_tt=f045eb219d3e8520c0eec150b2924ed5d328a45c1f46a934994c641e2c2691c8;bm_sv=385306FC4F64EE0B5898A16CD60BE296~YAAQbPrSF5QsBSKVAQAAXeSrIhpYqwo6L4v9JejeK4OOjbjUEq9XcL346ZunLtXPqMVz1NZiAPAuPB+BLcHfp+q0cfRki6s/rZNR2xeRtDm9+bBH8f3ys3IJmN6LB7lfn1VikFn91/76YgmCNEq1ndjF4aNsbVVn6zH8HcVn8VNVlIe+pyKuiuxmVeAVUD6NoSPP45yj4vkSoqnQ8OgrJWlpQX+9ctkiSTCGDNb+K8/MMePOU4MBo4G8miWZ40Mt~1;cmpl_token=AgQQAPOFF-RO0rdAuduEpV0__ddtsy5Vf4UOYNkc4A;tt-target-idc=alisg;multi_sids=7457494223270937606%3Adfa5555b177b29040e4a503134ee1ace;ttwid=1%7CZpEYxHBKgjib16TPaoRfQHCAskwkOHIrcFN_LreBroA%7C1740043447%7C55db6dde51c129ea4d58e8374e5c55d00b987796af0d644af6705f4539af008b;passport_csrf_token_default=78e46afde5c5f16177f905ec2fea0095;msToken=yV0CkGeWW1py6HkU-HMIFE3KQ90cBKo2Buihs6g0sF7ZnDF4EOgfpo-5A8yYmjr-PCCvKoPGazExvLyd3bkEqhY1XBU086vokbDeRHyUDdKb0NiLbqO9f6VL-DhDA7uUoUOCpCuGhIN-;s_v_web_id=verify_m7d4xgfs_TgY1CLBj_9zqJ_4xl4_BOyh_wY4EIPkFVFJO;sid_tt=dfa5555b177b29040e4a503134ee1ace;uid_tt_ss=f045eb219d3e8520c0eec150b2924ed5d328a45c1f46a934994c641e2c2691c8;last_login_method=email;passport_csrf_token=78e46afde5c5f16177f905ec2fea0095;store-country-code-src=uid;delay_guest_mode_vid=5;tiktok_webapp_theme_source=auto;d_ticket=22618786f32a62bdce7c962009e8d4e67d14a;perf_feed_cache={%22expireTimestamp%22:1740063600000%2C%22itemIds%22:[%227458036515113897224%22%2C%227463947792872951046%22%2C%227454282058253290774%22]};tiktok_webapp_theme=light;store-idc=alisg;tt_chain_token=2r3UCG7j6iqgFcI38QgnzA==;sessionid=dfa5555b177b29040e4a503134ee1ace;ak_bmsc=028048C5E2E73A954046A89BCE7F0865~000000000000000000000000000000~YAAQvlA7F+HHeBuVAQAAUDirIhp59eGIwVoFYAQ4IPNbFqgdi2AkYpRvF94YZTVvChk2L5VXqb7qKyNk0RD7deiXHgfC9ssJUgk/qAAUOcqSaeYyFLQjvOWNKktWMpraGxzPV1P/wz8pTz8Q5LaA/XWtrHz+n49nyK9HnnCv8M3t4W/d9DgAGJbo87fh98WpBoLVuN8wjS5NVMM0nEJPacV4VMSlQNjMyOHGLBJYt3aZ+x2ZfP9N6+gz73CK5rbXBi61+C5KaQ6eIZ48MSyV7v/5Y0vVEhwPIXJ3n/70L4RRdoKwBVC/4yPw3jnxP0ExGk+rqMct+F9Uy5hKg8d1y1AJ+c4YA3AIueQeCptHBoQGqQpN48BrCRTC4alniIAd1GxjT/NZKsdIyg==;|VN|17:47 - 08/01/2025
    proxies = [`com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`]
    // console.log("length", accounts.length,proxies.length,acc_die_array.length)
    // console.log(accounts, proxies)
    // process.exit(1)

    

    let acc_per_proxy = 30
    let tokens =  [
        // "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2NmJkNWZhMTU2OTcyMjNkNzk0ZTRlOTgiLCJ0eXBlIjoiZGV2Iiwiand0aWQiOiI2NmJkNWZhOTgyNGNhMDkyMGQxNDNlMjgifQ.RL7fpeRtPmis0Kr-zhxuesPRYO9eOf8jMDzo9PTch"
        ];
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
    await maingetroom()
    let max_time = setTimeout(() => {
        console.log("max time")
        is_live_end = true
        process.exit(1)
    }, 15*60*1000)
    // await checkViewer(room_id);
    // clearTimeout(max_time)
    // await maingetroom()
    // await helper.delay(5000)
    
    // await helper.delay(60000)
        // for(let index = 0 ; index < splice_accounts.length; index ++ ){
            // Viewer.stopViewers({ task_id: 1 })
            // Viewer.stopViewers({ task_id: 2 })

        // }
}

function isGoodRoom(data) {
    // console.log(JSON.stringify(data))
  const v = data?.client_version;
  const hot = data?.decisions?.server_features?.hot_level;
  const indicators = data?.indicators || [];
  const battleId = data?.link_mic?.battle_settings?.battle_id;

  const hasGoal = Array.isArray(indicators) && indicators.includes("live_goal_indicator_stream_goal");
  const hasBattle = battleId && battleId !== 0;
  
  // console.log('v',v,hot,indicators,battleId,hasGoal,hasBattle,data.idc_region)
  return hasGoal
  return (
    v >= 390403 &&
    (hot >= 2 || hasBattle || hasGoal)
  );
}
async function checkViewer(room_id){ 
    if(is_live_end){
        await helper.delay(5000)
        return;
    }
    let proxy = ''
    let res = await helper.getRoomInfo({room_id: room_id,proxies: [],proxy: helper.parserProxyString(proxy),cookie_string});
    let log  = `room: ${room_id} now: ${res.view_count} alive: ${res.is_alive}`
    // let data_info = await getInfo('bfb582ee22f7b985c526b4304a7f572e');
        // console.log(data_info.data.flows.flow_mb);
    if(res.status_code == 4003110){
        res.is_alive = false
        is_live_end = true
    }
    if(!res.is_alive){
        is_live_end = true
    }
    
    // console.log(helper.getTime(),"Info -- ",log,data_info?.data?.flows?.flow_mb);
    console.log(helper.getTime(),"Info -- ",log);
    if(is_live_end){
        for(let index = 0 ; index < splice_accounts.length; index ++ ){
            Viewer.stopViewers({ task_id: index+1 })
        }
    }
    await helper.delay(1000)
    await checkViewer(room_id);
}
async function checkStartViewer(room_id){
    let proxy = ''
    console.log("before check")
    let res = await helper.getRoomInfo({room_id: room_id,proxies: [],proxy: helper.parserProxyString(proxy),cookie_string});
    let log  = `room: ${room_id} now: ${res.view_count} alive: ${res.is_alive}`
    console.log(helper.getTime(),"Info -- ",log);
    if(!res.is_alive && res.view_count > 0){
        return false
    }
    return true
}
async function getInfo(sessionId) {
    const options = {
        url: 'https://api.922proxy.com/center/flows/get_info',
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json, text/plain, */*',
            'Pragma': 'no-cache',
            'Cache-Control': 'no-cache',
            'Origin': 'https://center.922proxy.com',
            'Referer': 'https://center.922proxy.com/',
            'Accept-Language': 'en-GB,en-US;q=0.9,en;q=0.8',
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1.1 Safari/605.1.15',
        },
        form: {
            lang: 'en',
            session: sessionId
        },
        gzip: true
    };

    return new Promise((resolve, reject) => {
        request(options, (error, response, body) => {
            if (error) {
                reject(error);
            } else {
                try {
                    const data = JSON.parse(body);
                    resolve(data);
                } catch (parseError) {
                    reject(parseError);
                }
            }
        });
    });
}
main()