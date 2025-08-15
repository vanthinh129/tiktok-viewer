const axios = require("axios");

const COOKIE_TTWID = "1%7CeWoGG2WEzx3PS3tKWWToQw2WfWI5PKD2s6csquCR8KE|1757047752|b590ef566c89846e2f78f12ae56cf5e1b0406948aee1b1747e8de6dd19c53ca4";
async function getWid() {
    try {
        let cookie = `sessionid=768603d1ca054dfbd761e02cf98ec69c;username=;msToken=W06m1d3Yq3x-iCCivUtklMbZPRhTE4n3i2MXCCM5LTsopP23oo-o2E9QI8weRRQkbce63ipM_GeAtZLpl1NETATHm37X5RktsqriVSQ8-de0qzj1mevoZRMb-O3Q;ttwid=1%7CGy8xRoCne1ybFOKgOm1K03qqCY8nOBXAECdhuuGRndc%7C1755038326%7C3f8c8429eb619ad495ea462cb5fc382e89a39d3e6a922e21e934726581101dd5;wid=7537831468967740935;proxy=sp22v5-us01.proxy.mkvn.net:16290:v5-290-273736:WIUCF;proxy=khljtiNj3Kd:fdkm3nbjg45d@14.189.222.21:18091;proxy_socket=sp22v5-us01.proxy.mkvn.net:16290:v5-290-273736:WIUCF;`
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
