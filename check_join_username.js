const helper = require("./src/helper")
const path = require('path');
const request = require('request');
const assert = require('assert');
const fs = require('fs');
let cookie_string = "store-country-code-src=uid; _ttp=2Xa0z5zsceA0cxIN9nhb5M2KioD; tt_csrf_token=ghFQU3l9-jG3g6kfJoqK3JQEhc3DW30DcUsc; s_v_web_id=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc; store-country-code=vn; tt-target-idc=alisg; tt_chain_token=ZI/n+AZUuVDJ7UiekYIePw==; _ga=GA1.1.1372313721.1742701466; FPID=FPID2.2.GkdIqM1xTtro1PM5WJJ0bFRa2BCMrwpowAzpIqB9WLs%3D.1742701466; _fbp=fb.1.1742701466359.2035966759; FPAU=1.2.262906749.1750480472; _fbc=fb.1.1752551226066.IwZXh0bgNhZW0CMTEAAR6RWeAV-fCT8fEEhW64qlIELBowsFX9Chr4bxKPdkGzDFU9KzrMEbE1aDI-IQ_aem_pckLemE8tBfpznlmhpyjcg; FPLC=WkNeIZ2JMp4zwXDp2633K9usdkHHaCXLbtuEgQu1Gm6LOryp6uHkGi%2FKd73bZxmLTxWkcDwdL%2BXflfZIkzCZZ5uU7Vv3PTJqM%2Bal0l2kmB4tRfQqa9d2Mwg9TeKAxg%3D%3D; passport_csrf_token=42206ccfc309c5d8b3a9ad0161614910; passport_csrf_token_default=42206ccfc309c5d8b3a9ad0161614910; d_ticket=493d4c6a0d5a26f309f9d97afa71130fb3387; multi_sids=7486540712688043026%3Af113c591a753752e87c0041313309885%7C7491909222662276103%3A50e742dabc45fde8befa7e26cf8b0624%7C7421520010978821126%3A7b8e65192a4e60d463ba23ee00d9d5f2%7C7534901215508464661%3A02ebd88f34c3c715473577894ac60bc2; cmpl_token=AgQQAPOFF-RO0rivthxoOF0s_b_p3KgTv4MOYN2z9g; uid_tt=b5be35709c7ea05ffaf890d5e69be86a32d8c8e09a4294262c033d942f14acc3; uid_tt_ss=b5be35709c7ea05ffaf890d5e69be86a32d8c8e09a4294262c033d942f14acc3; sid_tt=02ebd88f34c3c715473577894ac60bc2; sessionid=02ebd88f34c3c715473577894ac60bc2; sessionid_ss=02ebd88f34c3c715473577894ac60bc2; sid_ucp_v1=1.0.0-KDg0OTJiYmUxZDhlY2NlOWI2NmM3OWVlZDdmZDE5NDQzN2U3ZDFlZDIKGgiViKqAvpfWyGgQ_qjIxAYYsws4BEDqB0gEEAMaAm15IiAwMmViZDg4ZjM0YzNjNzE1NDczNTc3ODk0YWM2MGJjMg; ssid_ucp_v1=1.0.0-KDg0OTJiYmUxZDhlY2NlOWI2NmM3OWVlZDdmZDE5NDQzN2U3ZDFlZDIKGgiViKqAvpfWyGgQ_qjIxAYYsws4BEDqB0gEEAMaAm15IiAwMmViZDg4ZjM0YzNjNzE1NDczNTc3ODk0YWM2MGJjMg; store-idc=alisg; tt-target-idc-sign=tIJRT0XKM0zvLb2MuVh7A5D65AAnj0A-OOoNOgHTgD7sHT7S482k0I1OAoLQMqv0aqBT47Eu1SVKP2UpUTlEWadJNlU4wrETt4J5l1rgtCP9s8HuC36tG3WLwmya19kdfHE0F5RxZezHHb0zzS6RsthybAVKOTh-OA1ULcOz_x-dMfROaD6fX_Zcgd3QS3d8JltamhkIScoT4rY4bbLODTrI6AZ_v6hSkB2nkYI980d4Lf5VO3takeh7ZfCMWGyT0812mi4-CY8IUVHA1pwOm8cELZCuFdgsrQEmR0kv03-Plp0iCKcJs67J-JSgEehAXL4y88p6KVzRuhfI9E8tAehuWOrI13t_o9ilTDAP3NLCYP8fnb3nK32y8IHmA0ju46zGGvayeq_UvfAQpF6rS41zDffDOBbIvS_T3rsSWRn7sT6lbjA1-OlEls_66bAnMXkP_HAXweBjloLiX-KygqIRNcQviqB3QHV9kgvUrKzb_a73knQMXYn3syiO9Iy8; sid_guard=02ebd88f34c3c715473577894ac60bc2%7C1754403968%7C15551998%7CSun%2C+01-Feb-2026+14%3A26%3A06+GMT; odin_tt=32e687748ba21c6acb87f8e92924ae7042e2ef2aad936bd0db98499e3bbceb7becaa1f25e9e0edffcb79d028a0c718dfa9b17f5d0255d626d290a8d436506515734faeeffdc9693d7b07d668243a463b; _ga_LWWPCY99PB=GS1.1.1754403946.359.1.1754404025.0.0.393784851; ttwid=1%7CvdhT4GdjweC_vubE4LD1KqcTjJUq7XnK6LBh8gcXCdE%7C1754404026%7Cdbe292793a699917b78ec48f7e65e336f819f939152264b123ef9fbf5813d5b6; store-country-sign=MEIEDATLNr0-SH3ajX-vFgQgMiMJL8MSSVJ2kLMnCS-KwEDYhsEM-Hs1yeTqO1luxMsEELMBg47ZgrLVPsAUTljZSYY; msToken=Rzzbv47ayA44eYcxbfbU50KJYgGdq0kQa6oDuF-FaaswPwxwqx4OPFYZ05UOiWepubhUoumqlj0ZeWqu4YT9meAsIY3sCwuuEGK0wlTyJ0CAf3BobyN4T1_oe1IxUJa-6ACL1iu9ksQBO6_sabwBs4uB6hY="
async function main(){
    let {usernames,usernames_json} = await getalluser()
    // console.log("usernames",usernames)
    helper.clearCacheForFile(__dirname+"/data_room_mul.js")
    let {room_id} = require(__dirname+"/data_room_mul.js")
    if(process.argv[2] && process.argv[2] != "1"){
        room_id = process.argv[2].trim()
    }
    // room_id = "7501703576172579604,7501703414604106516,7501702729707178773,7501704873391164165,7501703762930486024,7501703568154479378,7501703532327553800,7501704515430042386,7501704819243666183,7501703281239460615"
    if(false || room_id.includes(",")){
        let room_ids = room_id.split(",")
        // let data_room = await checkLiveRoom(room_ids)
        let data_room = await checkLiveRoom2(room_ids)
        // console.log(helper.getTime(),data_room)
        for (let i = 0; i < room_ids.length; i++) {
            let data = await helper.getRoomUser({room_id:room_ids[i],cookie_string})
            
            let count_join = 0;
            let username_join_on_list = [];
            for (let i = 0; i < data.data_user.length; i++) {
                if(usernames.includes(data.data_user[i])){
                    username_join_on_list.push(data.data_user[i])
                    count_join++
                }
                
            }
            let total_user = data.total_user
            username_join_on_list = username_join_on_list.sort()
            console.log(helper.getTime(),room_ids[i],':',total_user,data?.data_user?.length,count_join,(data_room[room_ids[i]])?true:false
            // ,username_join_on_list.join(",")
        )
            // console.log(helper.getTime(),room_id,':',username_join_on_list.join(","),count_join)
            // await helper.delay(1000)
        }
        await helper.delay(1000)
        console.log("--------------------")
        return await main()
    }else{
        let room_ids = room_id.split(",")
        room_id = room_ids[0]
        let data = await helper.getRoomUser({room_id,cookie_string})
        let count_join = 0;
        let username_join_on_list = [];
        for (let i = 0; i < data.data_user.length; i++) {
            if(usernames.includes(data.data_user[i])){
                username_join_on_list.push(data.data_user[i])
                count_join++
            }
            
        }
        console.log(helper.getTime(),room_id,':',
        username_join_on_list.join(","),count_join)
        // console.log(helper.getTime(),room_id,':',username_join_on_list.join(","),count_join)
        // await helper.delay(1000)
        // return await main()
    }
}
async function getalluser(){
    //"./data_test/acc_vps_thinh_reg3.txt"
    let folder_accs = [];
    for (let i = 1; i <= 20; i++) {
        folder_accs.push(`./data_test/acc_test${i}.txt`)
        for (let j = 1; j <= 10; j++) {
            folder_accs.push(`./data_test/acc_test${i}.${j}.txt`)
        }
    }
    folder_accs.push(`./data_test/acc_socket1.txt`)
    folder_accs.push(`./data_test/acc_socket.txt`)
    folder_accs.push(`./data_test/acc_socket2.txt`)
    // folder_accs = [];
    // for (let i = 13; i <= 13; i++) {
    //     folder_accs.push(`./data_test/acc_test${i}.txt`)
    // }
    // let folder_accs = `
    // ./data_test/acc_test2.txt
    // ./data_test/acc_test3.txt
    // ./data_test/acc_test4.txt
    // ./data_test/acc_test5.txt
    // ./data_test/acc_test6.txt
    // `.trim().split("\n")
    let usernames = []
    let usernames_json = {}
    for (let i = 0; i < folder_accs.length; i++) {
        const user_array = await getuser(folder_accs[i].trim());
        usernames = usernames.concat(user_array);
        usernames_json[folder_accs[i].replace("./data_test/","").replace(".txt","")] = user_array;
    }
    // console.log(usernames.length)
    return {usernames, usernames_json}
}
async function checkLiveRoom(room_ids){
    let url = `https://webcast.tiktok.com/webcast/room/check_alive/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F134.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=7484543802662487553&device_platform=web_pc&focus_state=false&from_page=&history_len=2&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=VN&referer=https%3A%2F%2Fwww.tiktok.com%2F%40lngcgii%2Flive&region=VN&root_referer=https%3A%2F%2Fwww.tiktok.com%2F%40lngcgii%2Flive&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc&webcast_language=en&room_ids=${room_ids.join(",")}&`;
    let data = await helper.makeRequest({url, method: "GET"})
    // console.log(data.bodyJson)
    let data_room = {};
    try {
        data.bodyJson.data.map(function(a){
            data_room[a.room_id_str] = a.alive
        })
    } catch (error) {
        console.log("error",error)
    }
    
    return data_room
}
function checkLiveRoom2(room_ids){
    let url = `https://webcast.tiktok.com/webcast/room/check_alive/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F134.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=7484543802662487553&device_platform=web_pc&focus_state=false&from_page=&history_len=2&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=VN&referer=https%3A%2F%2Fwww.tiktok.com%2F%40lngcgii%2Flive&region=VN&root_referer=https%3A%2F%2Fwww.tiktok.com%2F%40lngcgii%2Flive&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc&webcast_language=en&room_ids=${room_ids.join(",")}&`;
    return new Promise((resolve,reject) => {
        request.get({
            url: decodeURI(url),
        }, function(error, response, data){
            if(data && data.includes("status_code")){
                let data_room = {};
                try{
                    data = JSON.parse(data)
                }catch(e){
                    console.log("error",e)
                }
                // console.log("data",data)
                try {
                    data.data.map(function(a){
                        data_room[a.room_id_str] = a.alive
                    })
                } catch (error) {
                    console.log("error",error)
                }
                return resolve(data_room);
            }else{
                return resolve(false);
            }
        })
     })
}
async function getuser(folder_account){
    let accounts = []
    try{
        let acc_string = await helper.strData(path.resolve(folder_account));
        if(acc_string){
            accounts = helper.parserAccounts({
                acc_string,
                getIndex: 0,
                number_slice: 100000000,
                key: "\n",
                number_ignore: 0,
                format: "u|p|t1|t2|cookie_string",
                key_format: "|",
                item_return_type: "u",
            });
        }
    }catch(e){}
    
    return accounts
}
//https://webcast.tiktok.com/webcast/ranklist/online_audience/?aid=1988&anchor_id=7171925485890700152&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F133.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=7484543802662487553&device_platform=web_pc&focus_state=true&from_page=user&history_len=2&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&room_id=7492806411964386055&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=&webcast_language=en&msToken=&X-Bogus=&_signature=
main()
// getalluser()
// data.data.ranks.map(function(a){
//   console.log(a.user.display_id)
// })
// console.log(data.data.ranks.length)
