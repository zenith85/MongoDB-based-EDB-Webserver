# Project Setup Guide

**Doc Keys**  
~~ : Separation  
// : Comments inside the code  
() : Specific step that should be done  
"" : Information

## Installation Steps

1. **Install Node.js**
2. **Install MongoDB** (as a network service user) and MongoDB Compass

## Project Initialization

3. **Navigate to the Project Folder Using CMD**
4. Run the command: `npm init -y`
5. Create `app.js`

### For Projects Without a Database

```javascript
// app.js
const express = require('express');
const app = express();
app.get('/', (req, res) => {
  res.send('Hello, Express!');
});
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

### For Projects With a Database
If your project requires a database, use CMD and navigate to the project folder. Run: npm install mongoose
Write the following code inside app.js:

Node.js will guide you for any missing dependencies as it request you to install them, do so.

```javascript
// app.js
const mongoose = require('mongoose');
// Connect to MongoDB
mongoose.connect('mongodb://localhost/your-database', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
// Define your MongoDB models and schemas

Note: Once MongoDB is installed, Windows will create a MongoDB server as a service that will automatically run on Windows startup.

Node.js will guide you for any missing dependencies as it requests you to install them; do so.

