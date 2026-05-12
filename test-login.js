const http = require('http');

const passwords = ['123456', 'password', '12345678', 'admin123', 'Neita123!', 'neita', 'Test1234!'];

async function testLogin(password) {
  return new Promise((resolve) => {
    const data = JSON.stringify({ email: 'neita@420.com', password });
    const req = http.request({
      hostname: 'localhost',
      port: 3000,
      path: '/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    }, (res) => {
      let body = '';
      res.on('data', d => body += d);
      res.on('end', () => resolve({ code: res.statusCode, body, password }));
    });
    req.write(data);
    req.end();
  });
}

(async () => {
  for (const pw of passwords) {
    const res = await testLogin(pw);
    if (res.code === 201 || res.code === 200) {
      console.log('SUCCESS:', pw, res.body);
      return;
    }
  }
  console.log('Failed to find password');
})();
