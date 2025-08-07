const axios = require("axios");

const COOKIE_TTWID = "1%7CeWoGG2WEzx3PS3tKWWToQw2WfWI5PKD2s6csquCR8KE|1757047752|b590ef566c89846e2f78f12ae56cf5e1b0406948aee1b1747e8de6dd19c53ca4";
async function getWid() {
    try {
        let cookie = `csrfToken=YzVV7CG7-PmTPSl35Xp6i8ovLwlw7YGSFDOQ;csrf_session_id=207b6b6a02048ee3e0dc04ded73ff131; FPAU=1.2.1784640952.1754228948; FPID=FPID2.2.K%2BfxW5XfX%2BoyHovWwSUz74nAJrySwwVVMh97kzCdO5U%3D.1754228948; _ga=GA1.1.1920089603.1754228948; odin_tt=290d8e935be400a40d266fbda388b5159b905cab1d2643334f7d875130b1490ecd5935710d366952cb9cd002b674074eb8413c11314e7c769eb50915391138e27c751f2a7199b7267c6fcd1764754fae; _fbp=fb.1.1754228947871.1899417434; store-country-sign=MEIEDPYJm4s_WCyJ7VzDowQgLIEYogD59wJQZZH75sjg508RMlUPT9PLywbup7n_GA4EEFNYUvVMhOYTy4K3kS-Mq80; tt-target-idc-sign=Rs6GZrm2vEyHsX68E6HmNS7YrKkCr2RKXIqbfyLrtIpf13JydMpnvDUaaK6RquobpbaNgKzne8w-N3K8UBFcME-cvg_vVf2A8g0eTySmryAWniJS005ZVwGATdnpP7IEVbeE_MmOKClZJDXY4TzReCb-TmuFWJxR9vEnVV94tUJGZuFUngmT5zWZFa_bx-vXKHbJ4cdaWuYbtxSXTDcy69Z6YtJcNKbubs-1qSN4JScCcbR2F8U0dC6mvwTZhR5xQ5awK8DcETOMTfL8R5JllfDTzbV2K2XLVbu6IZj2NS8RXduhG84hHonnfLwJpMZL4do3dNcIvmapjsGfRBK1eOdAgxkY6Ayuo0W5z2Ca95njgNTNOONEUuwMWhhjGtugqEj6lkM3FGNN6BGKFWTxoWMSzQS2ny-uXLn0R-n_NYKJKLwKMLDJOqZsc92mpmgoGrGbXLAPrWi-rWN3Xcc9p9hQE0Wy8BQPKdy4Et8HPfIMfKdBTOblFLLJRUbqMfKU; tt_chain_token=t3DYT5+TSiWTWR9KF7vfag==; passport_csrf_token=0e59461160fae3ca400873c66d4c3a4d; tt-target-idc=alisg; ttwid=1%7CJ9vnEaktM538s0PFZTrwLLAZ_zMiwhQgGGTkiI7YyAw%7C1754228943%7C6e0c069bc7286703699cca6e7a7976eac607089b307a8775ed23576a55f5493a; tt_csrf_token=sGsysRLd-ApsqDYyZjoFTL_OcrQP3bG0FQPY; store-country-code-src=uid; _ga_LWWPCY99PB=GS1.1.1754228947.1.1.1754228961.0.0.1807262046; cmpl_token=AgQQAPOFF-RO0rixq18z8F0p8u7xGqYNv4UOYN2HaA; store-idc=alisg; sid_guard=692f25dcd26e54a77d3cf5e03e200ec3%7C1754228933%7C15551994%7CFri%2C+30-Jan-2026+13%3A48%3A47+GMT; store-country-code=vn; sessionid_ss=692f25dcd26e54a77d3cf5e03e200ec3; d_ticket=bd57699674e9c17ba4f627f4b733aa0a9a186; sid_ucp_v1=1.0.0-KDkxY2U5M2RkNWFkOTg3ZDlkOWQ5YjJkZDA1NzI3ZjFkOTk2NTRmYTUKGgiQiIrei7_Rx2gQxdG9xAYYsws4BEDqB0gEEAMaAm15IiA2OTJmMjVkY2QyNmU1NGE3N2QzY2Y1ZTAzZTIwMGVjMw; FPLC=SkY%2FjyOe3Vm50PseEkuZVOVY%2BddzAQF051qGheO4QtHHfmDGHqSnzVPe%2BFhHi2wWqUYiiwpejjezpm2EjLQQRvQq4cMWO0WunUFAg4t2OIA72D8nuk1F5DqszDC7sQ%3D%3D; sessionid=692f25dcd26e54a77d3cf5e03e200ec3; uid_tt=5f15a00e34797e3eef152e4d84a8a6fe27c87c578f1a4c62e1c5e4987eb4e48a; ssid_ucp_v1=1.0.0-KDkxY2U5M2RkNWFkOTg3ZDlkOWQ5YjJkZDA1NzI3ZjFkOTk2NTRmYTUKGgiQiIrei7_Rx2gQxdG9xAYYsws4BEDqB0gEEAMaAm15IiA2OTJmMjVkY2QyNmU1NGE3N2QzY2Y1ZTAzZTIwMGVjMw; uid_tt_ss=5f15a00e34797e3eef152e4d84a8a6fe27c87c578f1a4c62e1c5e4987eb4e48a; s_v_web_id=verify_mdvqlxcr_nweHj6ly_VBtX_4rMs_BfbK_otKffU2Zadkm; msToken=6vPoL2hT-YscnQ1Vo3Ao_exk4PBdbIIOQZYynrxz5cSYPKn8yfbVmc2U_Wzm4RFa_dtnKZ4rg2CoAQHiKqBctSAlfw9lQGd0kt9Tk-qa_fevXiS1o6cVK9ZLAIui6yY2FrX9r03fvoCJYLayvLaxDeU=; passport_csrf_token_default=0e59461160fae3ca400873c66d4c3a4d; multi_sids=7534317636218422288%3A692f25dcd26e54a77d3cf5e03e200ec3; sid_tt=692f25dcd26e54a77d3cf5e03e200ec3;wid=7534355227077674503;crypt_sdk_b64=eyJkYXRhIjoie1wiZWNfcHJpdmF0ZUtleVwiOlwiLS0tLS1CRUdJTiBQUklWQVRFIEtFWS0tLS0tXFxuTUlHSEFnRUFNQk1HQnlxR1NNNDlBZ0VHQ0NxR1NNNDlBd0VIQkcwd2F3SUJBUVFncURXL0dYc1dJbGU1Y0RDcTlpQnFDMU94MWszbEtydVY5M3RsYldQQU1MR2hSQU5DQUFUbEZEQVpFbm5KdjdqQ3dQam5wOW0yUUpiU2RVTCt6R0VsTUU0UGhvQS85MHdDbkZzNGxvaXBobjVoM1RpcUJ2bFVWcHZvRzU0Tzg1Nkg1QXdpR2dvVFxcbi0tLS0tRU5EIFBSSVZBVEUgS0VZLS0tLS1cIixcImVjX3B1YmxpY0tleVwiOlwiLS0tLS1CRUdJTiBQVUJMSUMgS0VZLS0tLS1cXG5NRmt3RXdZSEtvWkl6ajBDQVFZSUtvWkl6ajBEQVFjRFFnQUU1UlF3R1JKNXliKzR3c0Q0NTZmWnRrQ1cwblZDL3N4aEpUQk9ENGFBUC9kTUFweGJPSmFJcVlaK1lkMDRxZ2I1VkZhYjZCdWVEdk9laCtRTUlob0tFdz09XFxuLS0tLS1FTkQgUFVCTElDIEtFWS0tLS0tXCIsXCJlY19jc3JcIjpcIlwifSJ9;sign_data_key_b64=eyJkYXRhIjoie1widHNfc2lnblwiOlwidHMuMS4zODZjMjZkNDdjNDYwM2I1ZjcxNzY5NGI4NzdhZjNkMzZmZmE4ZGRlMGNlZjdmMGRiMzY2MDRkZTg1YzE1ODk2MGU3MGI0YmRhODJjMTM4MzZlNWNmYTE4Mzk0ZDcwMjQwZjhhZjE2MzFmMTY1YWU5NjAxMjJlZWZmZDQ1MzNkZFwiLFwiZW5jcnlwdF90aWNrZXRcIjpcInkxbTBwc3E0bWp3STFJa2xiMDZMdTRhSjdhWFpORDlxUVVON0lFTWpPc3FPbE1mRVgvbnZ0SGx2TTIxN3p3NE94UEk4ZGdMK3EwNER4NUtaXCJ9In0=;`
      const response = await axios.get("https://www.tiktok.com/api/v1/web-cookie-privacy/config?locale=en&appId=1988&theme=default&tea=1", {
        headers: {
          "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        //   "Cookie": `ttwid=${COOKIE_TTWID};`,
        "Cookie": cookie,
          "Content-Type": "application/json"
        }
      });
  
      const html = response.data;
      //{"statusCode":200,"body":{"i18n":{"cookieBannerTitle":"Allow cookies from TikTok on this browser?","cookieBannerSubTitle":"TikTok uses cookies and similar technologies to provide, improve, protect and analyze our services. Essential cookies are necessary for our site to work as intended. By selecting \"Allow all\", you allow us to use optional cookies for additional purposes, such as measuring the effectiveness and relevance of ads, including personalized ads on TikTok.com, depending on your settings. Optional cookies also help us do other things, such as better measure the performance of our advertising campaigns off TikTok.com. Learn more about how we use cookies and manage your choices in our \u003Ca href=\"https://www.tiktok.com/legal/tiktok-website-cookies-policy?lang=en\" target=\"_blank\" rel=\"noopener noreferrer\"\u003ECookies Policy\u003C/a\u003E.","cookieBannerBtnAccept":"Allow all","cookieBannerBtnDecline":"Decline optional cookies","cookieBannerSaveToast":"Saved!","cookieSettingSaveBtn":"Save","cookieSettingsTitle":"Manage cookies","cookieSettingsSubTitle":"Change your cookie settings to allow or decline optional cookies.","cookieSettingsFooter":"Learn more in our \u003Ca href=\"https://www.tiktok.com/legal/tiktok-website-cookies-policy?lang=en\" target=\"_blank\" rel=\"noopener noreferrer\"\u003ECookies Policy\u003C/a\u003E"},"appProps":{"region":"VN","idcRegion":"ALL_SG"},"cookieBanner":{"resource":{"esm":"/pns/tiktok-cookie-banner/1.0.0.272/default.esm.js","nomodule":"/pns/tiktok-cookie-banner/1.0.0.272/default.js","baseUrl":"https://sf16-website-login.neutral.ttwstatic.com/obj/tiktok_web_login_static","version":"1.0.0.272"},"settings":[{"groupName":"Optional cookies","groupDescription":"With your consent, we use optional cookies for additional purposes, such as measuring the effectiveness and relevance of ads, including personalized ads on TikTok.com, depending on your settings. Optional cookies also help us better measure the performance of our advertising campaigns off TikTok.com.","disabled":false,"items":{},"groupEntityKeys":[{"entityKey":"optional"},{"entityKey":"ga"},{"entityKey":"af"},{"entityKey":"fbp"},{"entityKey":"lip"},{"entityKey":"bing"},{"entityKey":"ttads"},{"entityKey":"reddit"},{"entityKey":"hubspot"}]},{"groupName":"Essential cookies","groupDescription":"Essential cookies are necessary for TikTok to work as intended. This includes cookies which are necessary to provide, improve, protect and analyze our services.","disabled":true,"items":{}}],"disabled":false,"isEffective":false,"version":"v10","disabledAccessKeys":[{"path":".","accessKeys":["*"]}]},"consent":{"domain":"https://www.tiktok.com","appId":1988,"entityKeys":{"optional":["data-cookie-optional"]},"mode":"production","fetchDataAtInit":false,"api":{"consent":{"fetch":{"version":"v2"},"update":{"version":"v2"}}},"wid":"7484543802662487553"},"tea":{"channel":"sg","channel_type":"tcpy","channel_domain":"https://mcs-sg.tiktokv.com"},"tenantId":"paas_tiktok"}}
      console.log(html)
      const wid = html?.body?.consent?.wid
      // Tìm wid trong mã nguồn HTML (window.__INIT_PROPS__ hoặc window.__DEFAULT_SCOPE__)
      if (wid) {
        console.log("✅ wid:", wid);
      } else {
        console.log("❌ Không tìm thấy wid trong response");
      }
  
    } catch (error) {
      console.error("Lỗi:", error.response?.status, error.message);
    }
  }
async function getWid2() {
  try {
    const response = await axios.get("https://www.tiktok.com/", {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36",
        "Cookie": `ttwid=${COOKIE_TTWID};`
      }
    });

    const html = response.data;

    // Tìm wid trong mã nguồn HTML (window.__INIT_PROPS__ hoặc window.__DEFAULT_SCOPE__)
    const match = html.match(/"wid":"(\d+)"/);
    if (match) {
      console.log("✅ wid:", match[1]);
    } else {
      console.log("❌ Không tìm thấy wid trong response");
    }

  } catch (error) {
    console.error("Lỗi:", error.response?.status, error.message);
  }
}

getWid();
