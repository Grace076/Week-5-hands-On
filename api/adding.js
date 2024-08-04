const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const jwt = require('jsonwebtoken'); // for handling JWT tokens

const app = express();
dotenv.config();

// Middleware
app.use(express.json());
app.use(cors());

// Connection to the database
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'expense_trackers'
});

// Check connection
db.connect((err) => {
    if (err) return console.log('Error connecting to the MySQL database:', err);
    console.log("Connected to MySQL as id:", db.threadId);
});

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json('Access denied, no token provided.');

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) return res.status(403).json('Invalid token.');
        req.user = user;
        next();
    });
};

// Register route
app.post('/api/register', async (req, res) => {
    try {
        const users = `SELECT * FROM users WHERE email = ?`;
        db.query(users, [req.body.email], (err, data) => {
            if (data.length > 0) return res.status(409).json("User already exists");

            const salt = bcrypt.genSaltSync(10);
            const hashedPassword = bcrypt.hashSync(req.body.password, salt);

            const newUser = `INSERT INTO users (email, username, password) VALUES (?)`;
            const values = [req.body.email, req.body.username, hashedPassword];

            db.query(newUser, [values], (err, data) => {
                if (err) return res.status(400).json("Something went wrong");
                return res.status(200).json("User created successfully");
            });
        });
    } catch (error) {
        res.status(500).json("Internal server error");
    }
});

// Login route
app.post('/api/login', async (req, res) => {
    try {
        const users = `SELECT * FROM users WHERE email = ?`;
        db.query(users, [req.body.email], (err, data) => {
            if (data.length === 0) return res.status(404).json("User not found");

            const isPasswordValid = bcrypt.compareSync(req.body.password, data[0].password);
            if (!isPasswordValid) return res.status(400).json('Invalid email or password');

            const token = jwt.sign({ id: data[0].id }, process.env.JWT_SECRET, { expiresIn: '1h' });
            return res.status(200).json({ message: "Login successful", token });
        });
    } catch (error) {
        res.status(500).json('Internal Server Error');
    }
});

// Route to add expenses
app.post('/api/add', authenticateToken, async (req, res) => {
    try {
        const addExpenseQuery = `INSERT INTO expense (user_id, amount, category, date) VALUES (?, ?, ?, ?)`;
        const values = [req.user.id, req.body.amount, req.body.category, req.body.date];

        db.query(addExpenseQuery, values, (err, data) => {
            if (err) return res.status(400).json("Failed to insert data");
            return res.status(200).json("Data inserted successfully");
        });
    } catch (error) {
        res.status(500).json('Internal Server Error');
    }
});

// Default route
app.get('/', (req, res) => {
    res.send('Welcome to the Node.js programming, fully online today');
});

// Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
