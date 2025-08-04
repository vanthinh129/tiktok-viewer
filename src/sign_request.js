const request = require('request');
const querystring = require('querystring');
function sign(options) {
    let {url, body, msToken, userAgent} = options;
    const SERVER_URL = 'http://localhost:3000';
  return new Promise((resolve, reject) => {
    // Chuẩn bị dữ liệu request
    const requestData = {
      url: url,
      body: querystring.stringify(body),
      msToken: msToken,
      userAgent: userAgent
    };

    // Gửi request để lấy signature
    request({
      method: 'POST',
      url: `${SERVER_URL}/sign`,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestData)
    }, (error, response, body) => {
      if (error) {
        console.error("Lỗi khi lấy signature:", error);
        reject(error);
        return;
      }
      
      try {
        const data = JSON.parse(body);
        resolve(data);
      } catch (err) {
        console.error("Lỗi khi parse response:", err);
        reject(err);
      }
    });
  });
}
module.exports = { signreq: sign }