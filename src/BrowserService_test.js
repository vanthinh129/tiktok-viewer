const originalFetch = window.fetch;
window.fetch = async (...args) => {
    let finalUrl = '';
    const response = await originalFetch(...args);

    try {
        // Nếu fetch được truyền Request object
        if (args[0] instanceof Request) {
            finalUrl = args[0].url;
        } else {
            finalUrl = args[0];
        }

        // Đọc URL thực sự từ response nếu bị redirect (ví dụ 302)
        const redirectedUrl = response.url;
        console.log('🟢 Input URL:', finalUrl);
        console.log('🔵 Actual fetch URL:', redirectedUrl);

    } catch (e) {
        console.warn('❌ Error tracking URL:', e);
    }

    return response;
};

fetch("https://webcast.tiktok.com/webcast/room/enter/?aid=1988&app_language=en&app_name=tiktok_web&browser_language=en-US&browser_name=Mozilla&browser_online=true&browser_platform=MacIntel&browser_version=5.0%20%28Macintosh%3B%20Intel%20Mac%20OS%20X%2010_15_7%29%20AppleWebKit%2F537.36%20%28KHTML%2C%20like%20Gecko%29%20Chrome%2F133.0.0.0%20Safari%2F537.36&channel=tiktok_web&cookie_enabled=true&data_collection_enabled=true&device_id=7484543802662487553&device_platform=web_pc&device_type=web_h265&focus_state=true&from_page=&history_len=4&is_fullscreen=false&is_page_visible=true&os=mac&priority_region=&referer=&region=VN&screen_height=1117&screen_width=1728&tz_name=Asia%2FSaigon&user_is_login=true&verifyFp=verify_lzzndjml_geR45jSd_PKon_4Ykv_Bc0M_n040N3GAU9Nc&webcast_language=en", {
  "headers": {
    "accept": "*/*",
    "accept-language": "en-US,en;q=0.9,vi;q=0.8,ht;q=0.7",
    "cache-control": "no-cache",
    "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    "pragma": "no-cache",
    "priority": "u=1, i",
    "sec-ch-ua": "\"Not(A:Brand\";v=\"99\", \"Google Chrome\";v=\"133\", \"Chromium\";v=\"133\"",
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": "\"macOS\"",
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    "tt-ticket-guard-client-data": "eyJ0c19zaWduIjoidHMuMS40NDA2ODZlMmI2NWEyYzU2ZWFlODU1YWNjZmUzMGM3NzQzZGUzYmI4MWMwY2I2MTFjYjVjYzdkYmM1NmMxZjQ1MGU3MGI0YmRhODJjMTM4MzZlNWNmYTE4Mzk0ZDcwMjQwZjhhZjE2MzFmMTY1YWU5NjAxMjJlZWZmZDQ1MzNkZCIsInJlcV9jb250ZW50IjoidGlja2V0LHBhdGgsdGltZXN0YW1wIiwicmVxX3NpZ24iOiJNRVVDSVFDMHVtUldpYmVVU3lGbGkzWkkxWmR2YWx2MkQ1Rmo5QVpmLzUxMWs2cU9Md0lnTDJ0SDhZNG0xcXJwRlhiNG5SRXkwWWxYTXlaTW1jQW1RZi82S2FMYzNmcz0iLCJ0aW1lc3RhbXAiOjE3NDU1NzYwNzR9",
    "tt-ticket-guard-iteration-version": "0",
    "tt-ticket-guard-public-key": "BN457/XIi3J0+/3XSZQFbLevJNhNwiu8/1WjvvUC7eumfkv0Q/ttZZh+FDLLdtQ3+zuSy050oLzVE95m925kerA=",
    "tt-ticket-guard-version": "2",
    "tt-ticket-guard-web-version": "1",
    "x-secsdk-csrf-token": "000100000001353375ba2ab117d4f54a00f75505fde53416650cb4ec0f4f8c85bfa049b108d218398830fb3fd411,e74da40570f76254c0ecc9e9fab39943"
  },
  "referrer": "https://www.tiktok.com/",
  "referrerPolicy": "strict-origin-when-cross-origin",
  "body": "enter_source=recommend-suggested_others_photo&room_id=7497186648251550485",
  "method": "POST",
  "mode": "cors",
  "credentials": "include"
});