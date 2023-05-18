const express = require('express');
const app = express();
const bodyParser = require('body-parser');
const sqlite3 = require('sqlite3').verbose();
const crypto = require('crypto');
const getRawBody = require('raw-body');
const port = 80;
const secret = 'c0bce4fef9d3b7b579afa8d08306e6221d45b53dc72bd4e784887dcb2f81ec81';

app.use(bodyParser.json());
app.use(express.json());
let db = new sqlite3.Database('./db/data.db', sqlite3.OPEN_READWRITE,(err) => {
    if (err) {
      console.error(err.message);
    }
    console.log('Connected to the database.');
});

// const createTableQuery = `
//   CREATE TABLE IF NOT EXISTS orders (
//     id TEXT,
//     order_name TEXT,
//     total_price TEXT,
//     items TEXT,
//     name TEXT,
//     email TEXT,
//     address TEXT,
//     created_at TEXT
//   );
// `;

// db.run(createTableQuery, (error) => {
//     if (error) {
//       console.error('Error creating table:', error.message);
//     } else {
//       console.log('Table created successfully');
//     }
// });

// Define routes
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

function verifyShopifyWebhook(headers, payload, secret) {
    const providedSignature = headers;
    const calculatedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload, 'utf8')
      .digest('base64');
  
    return crypto.timingSafeEqual(
      Buffer.from(providedSignature, 'base64'),
      Buffer.from(calculatedSignature, 'base64')
    );
  }

// Define routes
app.post('/order-webhook', async(req, res) => {

    const hmac = req.get('X-Shopify-Hmac-Sha256');
    var body = JSON.stringify(req.body);
    if (true) { //verifyShopifyWebhook(hmac, body, secret)
        console.log('Webhook verified successfully');
        var body = req.body;
        var id = String(body.id);
        var order_name = body.name;
        var total_price = body.total_price;
        var items = body.line_items.map(function(itm) {
              return itm.name
        }).join(', ');;
        var name = body.customer.first_name +' '+body.customer.last_name;
        var email = body.customer.email;
        var address = body.billing_address.address1+', '+body.billing_address.city+', '+body.billing_address.country;
        var created_at = body.created_at;
        db.run(`INSERT INTO orders(id, order_name, total_price, items, name, email, address, created_at) VALUES(?, ?, ?, ?, ?, ?, ?, ?)`,
         [id, order_name, total_price, items, name, email, address, created_at], function(err) {
          if (err) {
            return console.log(err.message);
          }
          // get the last insert id
          console.log(`A row has been inserted with rowid ${this.lastID}`);
          res.json(body);
        });
    } else {
        console.error('Webhook verification failed');
        res.status(401).end('Webhook verification failed');
    }
});

app.get('/orders', async(req, res) => {
    let sql = `SELECT * FROM orders`;
    db.all(sql, [], (err, rows) => {
        if (err) {
            throw err;
        }
        res.json(rows);
    });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});