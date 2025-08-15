const http = require('http');
const helper = require('./src/helper');
const request = require('request');
const { promisify } = require('util');

const requestAsync = promisify(request);
async function getRedirectOnce(url, proxy = "") {
    try {
        const response = await requestAsync({
            headers: {
                "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7",
                "accept-language": "en-US,en;q=0.9",
                "sec-fetch-dest": "document",
                "sec-fetch-mode": "navigate",
                "sec-fetch-site": "none",
                "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/134.0.0.0 Safari/537.36"
            },
            url,
            proxy: proxy,
            followRedirect: false // Không tự động follow
        });

        if (response.statusCode >= 300 && response.statusCode < 400 && response.headers.location) {
            return response.headers.location; // Trả về link redirect
        }
        console.log(response)
        return null; // Không có redirect
    } catch (error) {
        throw error;
    }
}
async function main(){
    const url = "https://www.facebook.com/share/r/173gDgrXWu/?mibextid=wwXIfr"
    const redirect = await getRedirectOnce(url)
    console.log(redirect)
}
main()