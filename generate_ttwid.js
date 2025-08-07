const crypto = require("crypto");

function generateFakeTtwid() {
  const version = 1;
  const payload = crypto.randomBytes(32).toString("base64url"); // ~43 ký tự
  const expires = Math.floor(Date.now() / 1000) + 3600 * 24 * 30; // 30 ngày
  const signature = crypto.randomBytes(32).toString("hex"); // random, không hợp lệ

  return `${version}%7C${payload}|${expires}|${signature}`;
}

console.log(generateFakeTtwid());
