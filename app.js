const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const session = require('express-session');

const app = express();
const PORT = 3000;

mongoose.connect('mongodb://localhost:27017/ALTAMEERDB', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  //autoCreate: false,
});
const db = mongoose.connection;
db.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});
db.once('open', () => {
  console.log('MongoDB connected successfully');
});

app.use(session({
  secret: '123456789', // Replace with your actual secret key
  resave: false,
  saveUninitialized: true,
  //cookie: { maxAge: 3600000 }// Set the expiration time in milliseconds (1 hour in this example)
  cookie: { maxAge: 360000 }
}));
app.use(bodyParser.json());
app.use(express.json());

// Create a Mongoose model without explicitly defining a schema
const Member = mongoose.model('Member', mongoose.Schema({}), 'MembersCollection');

// Serve the login page when accessing the root route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'login.html'));
});
// Login endpoint
app.post('/login', async (req, res) => {
  try {
    // Check if req.body exists
    if (!req.body) {
      throw new Error('Invalid request body');
    }
    const { username, password } = req.body;
    // Check if username and password are provided
    if (!username || !password) {
      throw new Error('Username and password are required');
    }
    // Retrieve user by username from the MembersCollection in MongoDB
    const user = await Member.findOne({ "Member Name": username });
    const userObject=user.toObject();
    if (!user) {
      throw new Error('User not found');
      res.status(401).json({ success: false, message: 'Invalid username or password' });
      //return;
    }
    // For the first login, compare plaintext password
    if (password === userObject.Password) {
      req.session.user = {username:username};
      res.json({ success: true, showChangePasswordModal: true });
      //res.json({ success: true, redirect: '/ACD.html' });
    } else{
      // For subsequent logins, use bcrypt.compare
      const storedHashedPassword = userObject.Password;
      const isPasswordValid = await bcrypt.compare(password, storedHashedPassword);
      if (isPasswordValid) {
        // Successful login
        // Send JSON response with redirect URL
        req.session.user = {username:username};
        res.json({ success: true, redirect: '/ACD.html' });
      } else {
        // Failed login
        res.status(401).json({ success: false, message: 'Invalid username or password' });
      }
    }
  } catch (error) {
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});
//Middleware to change the password
app.post('/changepassword', async (req, res) => {
  try {
    if (!req.session || !req.session.user) {
      console.log('authentication is void...');
      return res.redirect('/');
    }
    const username = req.session.user.username;
    const newPassword=req.body.newPassword;
    const saltRound=10;
    const hashedPassword= await bcrypt.hash(newPassword, saltRound);
    // Update the user's password in the database
    result= await db.collection('MembersCollection').updateOne(
      { "Member Name": username },
      { $set: { Password: hashedPassword } }
    )
    if (!result) {
      // Handle case where the document is not found
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    console.log(`Password changed for user: ${username}`);
    res.json({ success: true, redirect: '/login.html' });
  } catch(error){
    console.error('Login error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

// Middleware to check if the user is authenticated
const authenticateUser = async (req, res, next) => {
  try {
    console.log('Checking authentication...');
    console.log('Session:', req.session);
    if (!req.session || !req.session.user) {
      console.log('authentication is void...');
      return res.redirect('/');
    }
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};
// Apply the authentication middleware to the route you want to protect
app.get('/ACD.html', authenticateUser, (req, res) => {
  console.log('Authenticated user accessing /ACD.html');
  res.sendFile(__dirname + '/ACD.html');
});

// Serve static files for authenticated users only
//app.use('/static', serveStaticForAuthenticated);
app.use(express.static(path.join(__dirname)));



//webserver functions
// Get all collections with optional search term
app.get('/collections', async (req, res) => {
  try {
    // Fetch all collections from the database
    const allCollections = await mongoose.connection.db.listCollections().toArray();
    // Extract the collection names
    const allCollectionNames = allCollections.map(collection => collection.name);
    // Check if a search term is provided in the query parameters
    const searchTerm = req.query.search;
    // If there's a search term, filter the collection names
    const filteredCollections = searchTerm
    ? allCollectionNames.filter(collection => collection.toLowerCase().includes(searchTerm.toLowerCase())) : allCollectionNames;
    res.json(filteredCollections);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get documents from a specific collection with optional search term
app.get('/collection/:name', async (req, res) => {
  try {
    const collectionName = req.params.name;
    const searchTerm = req.query.search;

    const collection = mongoose.connection.db.collection(collectionName);

    let documents;
    if (searchTerm) {
      // If there's a search term, filter documents based on the search
      documents = await collection.find({ $text: { $search: searchTerm } }).toArray();
    } else {
      // If no search term, retrieve all documents
      documents = await collection.find().toArray();
    }

    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Additional route to specifically handle /collections/CompaniesCollection
app.get('/collections/ProjectsCollection', async (req, res) => {
  try {
    const searchTerm = req.query.search;
    const collection = mongoose.connection.db.collection('ProjectsCollection');
    let documents;
    if (searchTerm) {
      // If there's a search term, filter documents based on the Company Name field
      documents = await collection.find({ 'Project Name': { $regex: new RegExp(searchTerm, 'i') } }).toArray();
    } else {
      // If no search term, retrieve all documents
      documents = await collection.find().toArray();
    }
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

//Additional route to specifically handle /collections/CompaniesCollection
app.get('/collections/CompaniesCollection', async (req, res) => {
  try {
    const searchTerm = req.query.search;
    const collection = mongoose.connection.db.collection('CompaniesCollection');
    let documents;
    if (searchTerm) {
      // If there's a search term, filter documents based on the Company Name field
      documents = await collection.find({ 'Company Name': { $regex: new RegExp(searchTerm, 'i') } }).toArray();
    } else {
      // If no search term, retrieve all documents
      documents = await collection.find().toArray();
    }
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new route to handle fetching documents from MembersCollection
app.get('/collections/MembersCollection', async (req, res) => {
  try {
    const searchTerm = req.query.search;
    const collection = mongoose.connection.db.collection('MembersCollection');
    let documents;
    if (searchTerm) {
      documents = await collection.find({ 'Member Name': { $regex: new RegExp(searchTerm, 'i') } }).toArray();
    } else {
      documents = await collection.find().toArray();
    }
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Create a new document in the specified collection
app.post('/create-document', async (req, res) => {
  try {
    const { collectionName, document } = req.body;
    // Get the collection
    const collection = mongoose.connection.db.collection(collectionName);
    // Insert the new document into the collection
    await collection.insertOne(document);
    res.json({ success: true, message: 'New document created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Add a new route to handle creating a document in MembersCollection
app.post('/create-member-document', async (req, res) => {
  try {
    const { document } = req.body;
    // Check if a member with the same name already exists
    const existingMember = await mongoose.connection.db.collection('MembersCollection')
    .findOne({ 'Member Name': document['Member Name'] });

    if (existingMember){
      console.log("user exist");
      return res.status(400).json({ success: false, message: 'Member with the same name already exists' });
    }

    document.Password='Password';
    console.log(document);
    const collection = mongoose.connection.db.collection('MembersCollection');
    await collection.insertOne(document);
    res.json({ success: true, message: 'New member document created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  });
