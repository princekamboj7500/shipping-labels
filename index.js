const express = require('express');
const app = express();
const port = 80;

// Define routes
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});