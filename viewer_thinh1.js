const path = require('path');
const helper = require("./src/helper")
const Viewer = require("./src/Viewer.tt2");
// const Viewer = require("./src/Viewer1");
const { setTimeout } = require('timers/promises');
let is_live_end = false;
let splice_accounts = []
let room_id = "7404131027976817425";
if(process.argv[2]){
    room_id = process.argv[2].trim()
}
const main = async () =>{
    const assert = require('assert');
    if(room_id.includes('@')){
        let username = helper.getString(room_id+'/','@','/')
        let data_room = await getRoomData(username);
        if(data_room && data_room.roomId && data_room.is_live){
            room_id = data_room.roomId
        }
    }
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
    let acc_die_string = '';//await helper.strData(path.resolve("./101.txt"));
    let acc_die_array = (acc_die_string.split(','))
    let acc_string = await helper.strData(path.resolve("./data_test/acc_socket1.txt"));
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
    // accounts = helper.parserAccounts({ acc_string, getIndex:0, number_slice: 10, key: "\n", number_ignore:10, format: "cookie_string", key_format: "|", item_return_type: "cookie_string", preReturn:(object, cookie_string)=>{
    //     return cookie_string && cookie_string.includes("sessionid=")
    // }})
    // console.log("length", accounts.length,proxies.lengthl,proxies)
    // accounts = ['passport_csrf_token=414dd83deb32c8e82fa0eaa66de7d038; passport_csrf_token_default=414dd83deb32c8e82fa0eaa66de7d038; store-idc=alisg; store-country-code=vn; store-country-code-src=uid; tt-target-idc=alisg; tt_chain_token=m/gdioiLsRXvAUR1HdCgIA==; multi_sids=7260830958101595142%3A645e2a24e6e7d7d68d82777c4c10650c; cmpl_token=AgQQAPOFF-RO0rT9Se7n_N0__YFn7Q9N_5cOYNivgw; passport_auth_status=03526899704d9c50ca2e8f5d834d8768%2Cdd335b683f6bedc40d2dfda83ab2a1fc; passport_auth_status_ss=03526899704d9c50ca2e8f5d834d8768%2Cdd335b683f6bedc40d2dfda83ab2a1fc; uid_tt=ddcf440fc87d5e03385f9239d9ffcf977d1f3ee97c045e55e19548b7baad9a1f; uid_tt_ss=ddcf440fc87d5e03385f9239d9ffcf977d1f3ee97c045e55e19548b7baad9a1f; sid_tt=645e2a24e6e7d7d68d82777c4c10650c; sessionid=645e2a24e6e7d7d68d82777c4c10650c; sessionid_ss=645e2a24e6e7d7d68d82777c4c10650c; tt-target-idc-sign=CSgkKAw7kHl6Kb5VF1C1Fid25VZPho1kBLzAX2msNPcZpruxqo8yBeFAIjIHlJPaqizgedIWHDkl-wGTJ1uAuO260Jka14Vhn4N6xHxKYZ_8K817wHJrpsL3mLj-qdDuJvALX2xW2MLvZyMFRPxw7KFPsQAzYfh8oWtk435c5owYqbdsFT2N5Y2-eruruL8zpJkSw43SwrObe_J80yPJoLIRiiFEOvBljYhMfAG0gJNfyEgQeXjdoymZoLwz0Fz2Glt45GtWcziWPAltPmC07GPSsEApD5QN7XKBso31CDToazvceE_QA02SFMoawZr_oYgLqusUsuyB5mRQHDN8IRhNsPQJOPtliRqzAvh1IMPRoFsPKwKA2qr-1LSLEi8Bv0ZEgQJ4gLGVv1M119l1Vqj302g8TDi2DRalatmJuPyGS2_I6W1glBZg9CL3rJG9q8AgT2mh6t4YntVs9uThvDxmwMO5jS72N7hz5oKmbFZYXNqhv3YoiCRkvf9GCLBs; sid_guard=645e2a24e6e7d7d68d82777c4c10650c%7C1742798825%7C15551997%7CSat%2C+20-Sep-2025+06%3A47%3A02+GMT; sid_ucp_v1=1.0.0-KGNhNDY5ZjAyNzFlYTFiNTMxMWUyODhkNzgxOTE0YTk3MGRiNmJkNTMKGQiGiLj-lunp4WQQ6f-DvwYYsws4CEASSAQQAxoDbXkyIiA2NDVlMmEyNGU2ZTdkN2Q2OGQ4Mjc3N2M0YzEwNjUwYw; ssid_ucp_v1=1.0.0-KGNhNDY5ZjAyNzFlYTFiNTMxMWUyODhkNzgxOTE0YTk3MGRiNmJkNTMKGQiGiLj-lunp4WQQ6f-DvwYYsws4CEASSAQQAxoDbXkyIiA2NDVlMmEyNGU2ZTdkN2Q2OGQ4Mjc3N2M0YzEwNjUwYw; _ga=GA1.1.1109430864.1742798836; FPID=FPID2.2.OJRGTMxiqdLaaLgTlv%2BoaOwLRMQ8Ng85R2sEZ4UuT5k%3D.1742798836; FPAU=1.2.1567491046.1742798836; _fbp=fb.1.1742798836189.1943082367; FPLC=w6yM%2FEgVmGlTLGtKhQsjnyXDUKgcYZiGFxcZ%2BbObiIdvwwOp0wZYKo6QFDKk3WKqrt%2FT4b%2BGCdK4UYZSyYZwf9sn7hnVOrsTaQtNldZaQZbYCOCASMsbyPIPWeak%2Fw%3D%3D; tt_csrf_token=LPFdUfF4-wvVDAp0TIIHsh2uusU_vEzIBuKw; ttwid=1%7CzK1dsnUZBNCCbWLbb9O11-fulRctixWrGZTApi4GCGo%7C1742979234%7C24cf9b5b3ea9620a43a2d62483e771c857ca8d581e576c143ffd16844a5fa92c; store-country-sign=MEIEDIHsOlbbVLatuPLmkQQgpOd07NJkPiWeFdNqGVf5ncQVZJQwegBVb6TvsT3p7dwEEE6MnbJX5Us_wPgUXOwtqh8; odin_tt=e9fb8e5672418f2106b85ea931194d939e03c94abdffce9c0462523e55662d1f35613d3c6e5d103ca48ca90cac3b312231170ce220ee9f1885f1a47a98659cfc76c650b269250cc28138a66b7f1034d7; csrfToken=CbH86T1g-jFcmXYOlI2Mopnh58wcL-soE0bA; csrf_session_id=cda935068d84c90cfe0b01f4f1caf89b; _ga_LWWPCY99PB=GS1.1.1742979235.3.1.1742979242.0.0.202825251; msToken=xRiXvCDEuSQtptmKV4TvyBZWku3HV5jNJMwcMMLWFQeRKMAHGAGhkK5UvHbnw8e_FJIQCy8cPzdRKfFb5LfClCmF5QgNDONhQWfVSHSi55WGkJbw-Hr8tJaaWNnFUsl62f9CEAxKHntbfFW-U8WE6xAm']//haravanshop
    // accounts = ["store-country-code-src=uid; _ttp=2Xa0z5zsceA0cxIN9nhb5M2KioD; tt_csrf_token=ghFQU3l9-jG3g6kfJoqK3JQEhc3DW30DcUsc; csrf_session_id=e74da40570f76254c0ecc9e9fab39943; s_v_web_id=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc; store-country-code=vn; tt-target-idc=alisg; d_ticket=5ec678f4eeb803883c1c486e6db449cd94da5; uid_tt=7c29dce7c8081a51e88c7bcaaf1517da6dbe021eadb39fc00cfdd085f58ed46c; uid_tt_ss=7c29dce7c8081a51e88c7bcaaf1517da6dbe021eadb39fc00cfdd085f58ed46c; sid_tt=d293940bbc3ab94d9f9d58244e547a66; sessionid=d293940bbc3ab94d9f9d58244e547a66; sessionid_ss=d293940bbc3ab94d9f9d58244e547a66; store-idc=alisg; tt-target-idc-sign=rklYFDWE2PpeekDL8ZDgwYVkPrxiaFrhxnA_sJ0LDS37XuVSm93lWFmvT7uDqNNYoiOPK9Brq4PoorUwmCuoUSpRmW-D-OnhJR5m20w8u_LqE3d8BHrJwKQoMCUhK8Dh5lz1oI9w8UyLYdcCeHwiOKGvWmsMoXnJFmIFAJrFDNC_WF_GZNYPqW5cYFWzlxTfjRR9Yo-wTTmaWiXGypP5vm5rOeRJZzy5xIxBcJL7diOEPash2hdKX8NT7McUCE-MlEKs9SfvUlZX1-JtMPIM6ajbbVDVw4v1PWVi55dQgNOo8VjvHWlbFXrQKHmjrhuLEkkAEwHDAa89RNx-G12D2OzWrfk25NBRe_dO_XSB1RG8sEVR0E2Kl53-wsBsSufFbi6cvKDcL5pTQ0wzvVezjILuOsYnH7Nm225NVVGkE5Ej2KkA16lYI6nvISRUjMjQZIganKqMlU1lvIBEHswJ1Nhqu9G72ByRKeQHemrvkvXSMX4FOa_ED99VcIAX2SDR; sid_guard=d293940bbc3ab94d9f9d58244e547a66%7C1742631164%7C15552000%7CThu%2C+18-Sep-2025+08%3A12%3A44+GMT; sid_ucp_v1=1.0.0-KGUwNmE5NjZlNTM5YTU2ZjQ0YWE1MmYzOWNhYmY1Yjg0NWRhY2RlZjMKIgiGiOLekKSi_2YQ_OH5vgYYswsgDDDHkvq3BjgEQOoHSAQQAxoCbXkiIGQyOTM5NDBiYmMzYWI5NGQ5ZjlkNTgyNDRlNTQ3YTY2; ssid_ucp_v1=1.0.0-KGUwNmE5NjZlNTM5YTU2ZjQ0YWE1MmYzOWNhYmY1Yjg0NWRhY2RlZjMKIgiGiOLekKSi_2YQ_OH5vgYYswsgDDDHkvq3BjgEQOoHSAQQAxoCbXkiIGQyOTM5NDBiYmMzYWI5NGQ5ZjlkNTgyNDRlNTQ3YTY2; tt_chain_token=ZI/n+AZUuVDJ7UiekYIePw==; _ga=GA1.1.1372313721.1742701466; FPID=FPID2.2.GkdIqM1xTtro1PM5WJJ0bFRa2BCMrwpowAzpIqB9WLs%3D.1742701466; FPAU=1.2.726648848.1742701466; _fbp=fb.1.1742701466359.2035966759; FPLC=ogjREEWZolvJN8jblA1OMlsyAcPz2g0nix6ucOMnMaKxnWeMw%2BY7hA8BV1zAYjKNmI6L0jpq5%2FiBG9slCSvphKY71ICb6py%2Ba%2F0CheeURSAVJMYIy0Si4ICJIofH%2Fg%3D%3D; ttwid=1%7CvdhT4GdjweC_vubE4LD1KqcTjJUq7XnK6LBh8gcXCdE%7C1743145358%7Cefca8266dc7c1efaa3cda7d16b4586a2adf2d1e5a9fa3e8c5bfbe861299f0043; store-country-sign=MEIEDND-cxu6QzfpfqVfcgQguHFXkGB2fG-UTGQOIe3joc5Vf8wAEVgWXfmEsild5BYEEIhEtfZkjqU7M5OZFGGBVus; odin_tt=3f81e6bf8aa13c8ab16ce8bdeb4cb1d1679f516d117f33cc6d973c2e3fe19c695eab355ef77b956d9c69aefec7e30933b78631f50325bb4ddfe1f67a900bab6fa2a62c8c1848fef701adcc74791bc039; _ga_LWWPCY99PB=GS1.1.1743143839.6.1.1743145360.0.0.1810640825; msToken=yoiqI6nN_fQUuwNVYJ_8aVjcH0VJuWetuYCumZM-Howe6uQJG4UFK46BY3AcMreDr9YCp9b_16Sb6MTejnx4yHLLfjpNGSXemG5z1H-LozawgIE3r-4kH03Hir_W286D0Ky7XnF3iXSK9hCGuVULZOHwDQ=="]
    // accounts = ["tt_csrf_token=cFcIKZcd-ydRMj9cP-pR--nTL9kyvIUJ0ZiY; tt_chain_token=WcYClxTAjifBnkuVt7RNBg==; ttwid=1%7ChcohAq3MBoMx8LoAO71XZQCsCQOoarHodVfPmt7paLI%7C1743150357%7C6575e464cc650122c07f28655ea159fa03928bd058e2f8aef5e6fa77b89af1e0; s_v_web_id=verify_m8siprwu_BFdhLBfi_X6TQ_4IMI_BZUg_RXWMXM55Q7gF; odin_tt=89f502ca0815f237d93bd01f59cef2e26523ac1aed09535540c2d5bb08ab23ce90554aff3a798b84b3ae83afe476c62763374fe4ef75a70ff57183339d40c25b374f7d82ef0b63c8e954ba77301261e7; _ga=GA1.1.306695536.1743150363; FPID=FPID2.2.AtPWSSRPBPDFAUwkBoQ6EqGBy6%2BgykoMQ6NDi7fe3XU%3D.1743150363; FPLC=CePCwJQ393UYPGymsX87qgBEqLroABfpk%2BxyBdRb5A4%2BjtPi02MHhgxTWXLLwAXrxPVyBSNyss5YB52PafmHgk%2BCvrZO%2BcloeW%2FOsPYUdEa0xga55OgIVbh6wCDsUQ%3D%3D; FPAU=1.2.2058894693.1743150364; _fbp=fb.1.1743150362939.1320266986; csrfToken=PfrlWn8v-j2bhwhJDzOMB2UeArTjk8xVXG2I; _ga_LWWPCY99PB=GS1.1.1743150362.1.1.1743150373.0.0.186791239; msToken=pfmhrNqmsPioL-0iNenwizNnsGCxJa5g4Xp4VBKlUvlSFMnUhUqGAxz80_Li4oF01kQW-4LbW0I9TQUK20B15DVQ89ITC3wLMjcaIR2wEVZIMSZoQ6pk6jXCLHMg5pM0T_Gg96-R3Lozd_4R24XRbHu3JQ=="]//ok
    // accounts = ["msToken=pfmhrNqmsPioL-0iNenwizNnsGCxJa5g4Xp4VBKlUvlSFMnUhUqGAxz80_Li4oF01kQW-4LbW0I9TQUK20B15DVQ89ITC3wLMjcaIR2wEVZIMSZoQ6pk6jXCLHMg5pM0T_Gg96-R3Lozd_4R24XRbHu3JQ=="]
    // accounts = ["msToken=_0fHzXW5uu40f3MpFP_M1nb9MBRC0JqRig977Mw27Zf2FVi7FSRYMsY2MRoKqN3cYitPRQsxno2earDeTW1CfV57BoOx2ffzsNRSXkpCBXnhbcQLTwbnG4MhOJq72V_Uar4g3yEsGlcRR5sY_eG6w96Z9w=="]//bi 403
    // accounts = ["msToken=tZ6aNNPe_jCgvGybM_n3F7KKy3B2b4Iw0v_GY7PTgvBpzenXzsV-5WsIB2CWqCaa82ja1IHSvI1WPwDcRR3ac9j7Mw9gmUXgC88ELW7VR3XeEcx7Ezdmn0ankz-7Mu_vEiUxqqaeNIv66MSU6Qph__ct;"]
    // proxies = [`com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`]
    console.log("length", accounts.length,proxies.length,acc_die_array.length)

    let proxies1 = [
    `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    // `com86335772-res-VN-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`,
    ]
    let acc_per_proxy = 1
    proxies = getProxy(Math.floor(accounts.length/acc_per_proxy)+1)
    proxies = await helper.getProxySite(120)
    proxies = helper.shuffle(proxies)
    // proxies = ["UGCyfu:pLOaUI@200.229.24.222:33061"]
    // console.log(accounts, proxies)
    // process.exit(1)
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
    // for (var i = 0; i < _accounts.length; i++) {
        
    //     testview([_accounts[i]],tokens)
    // }
    // Viewer.startViewers({accounts:_accounts, task_id: 1, room_id, tokens})
    // setInterval(function(){
    //     // proxies = [`com86335772-res-US-Lsid-${helper.getRandomInt(111111111,999999999)}-sesstime-60:PgW1d92K9aMg2r95rY@prem.as.iprocket.io:5959`]
    //     // _accounts = []
    //     // for(let index = 0 ; index < splice_accounts.length; index ++ ){
    //     //     let accs = splice_accounts[index];
    //     //     let proxy = proxies[index];
    //     //     accs = accs.map(account => {
    //     //         account = account +";proxy="+proxy+";"
    //     //         return account
    //     //     });
    //     //     _accounts = [..._accounts, ...accs]

    //     // }
    //     Viewer.startViewers({accounts:_accounts, task_id: 1, room_id, tokens})
    // }, 140000)
    // await checkViewer(room_id);
    // let is_start = await checkStartViewer(room_id)
    let is_start = true
    if(is_start){
        Viewer.startViewers({accounts:_accounts, task_id: 1, room_id, tokens})

        await checkViewer(room_id);
        if(is_live_end){
            for(let index = 0 ; index < splice_accounts.length; index ++ ){
                Viewer.stopViewers({ task_id: index+1 })
            }
        }
    }else{
        console.log('Cannot start')
    }
    // await helper.delay(60000)
        // for(let index = 0 ; index < splice_accounts.length; index ++ ){
            // Viewer.stopViewers({ task_id: 1 })
            // Viewer.stopViewers({ task_id: 2 })

        // }
}
async function getRoomData(username){
    let proxies = await helper.getProxySite();
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
function getProxy(number=1){
    let proxys = [];
    for(let index = 0 ; index < number; index ++ ){
        let proxy = "com86717627-res-vn-sid-" + helper.getRandomInt(111111111, 999999999) + "-sesstime-5:GgNufEC8cvtK09WZ7@prem.as.iprocket.io:5959";
        proxys.push(proxy)
    }
    return proxys;
}
function testview(_accounts,tokens){
    Viewer.startViewers({accounts:_accounts, task_id: 1, room_id, tokens})
    setInterval(function(){
        Viewer.startViewers({accounts:_accounts, task_id: 1, room_id, tokens})
    }, 140000)
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
async function checkStartViewer(room_id){
    let proxy = ''
    console.log("before check")
    let res = await helper.getRoomInfo({room_id: room_id,proxies: [],proxy: helper.parserProxyString(proxy),cookie_string:""});
    let log  = `room: ${room_id} now: ${res.view_count} alive: ${res.is_alive}`
    console.log(helper.getTime(),"Info -- ",log);
    if(!res.is_alive && res.view_count > 0){
        return false
    }
    return true
}
main()