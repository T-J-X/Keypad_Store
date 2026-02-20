const http = require('http');

const req = http.request('http://localhost:3001/api/cart/add-item', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', res.headers);
  res.on('data', d => process.stdout.write(d));
});

req.write(JSON.stringify({
  productVariantId: '1',
  quantity: 1
}));
req.end();
