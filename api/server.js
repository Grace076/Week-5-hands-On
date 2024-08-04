const express=require('express')
const app =express();
const mysql =require('mysql2')
const cors = require('cors');
const bcrypt = require('bcrypt')
const dotenv =require('dotenv');
const jwt = require('jsonwebtoken'); // for handling

app.use(express.json())
app.use(cors())
dotenv.config();


//CONNECTION TO THE DATABASE
const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD
})
 //check connection
db.connect((err)=>{
    if(err) return console.log('error connecting to the myysql database')
        console.log("Connected to MYSQL as id:",db.threadId)
})

app.get('',(req,res)=>{
    res.send('welcome to the node js programming, fully online today');

})
//create database
db.query('CREATE DATABASE IF NOT EXISTS expense_trackers',(err,result)=>{
    if (err) return console.log(err)
    console.log('Database expense_trackers has been created/checked')




//change database
db.changeUser({database:'expense_trackers'},(err,res)=>{
    if (err) return console.log(err)

    console.log('expense_trackers is in use');


        //create users
        const usersTable =`CREATE TABLE IF NOT EXISTS users(
            id INT AUTO_INCREMENT PRIMARY KEY,
            email VARCHAR(100) NOT NULL UNIQUE,
            username VARCHAR(50) NOT NULL,
            password VARCHAR(255)
        
        )
        `;

        db.query(usersTable,(err,result)=>{
            if(err) return console.log(err)
            
            console.log("users table created/checked")
        })

          //create expense table
          const expenseTable =`CREATE TABLE IF NOT EXISTS expense(
            id INT AUTO_INCREMENT PRIMARY KEY,
            user_id INT NOT NULL,
            amount DECIMAL(10, 2) NOT NULL,
            date DATE NOT NULL,
            category VARCHAR(100) NOT NULL,
            FOREIGN KEY (user_id) REFERENCES Users(id)  
        )`;

        db.query(expenseTable,(err,result)=>{
            if(err) return console.log(err)
            
            console.log("expense table created/checked")
        })

    })

})

//create routes
app.post('/api/register', async(req,res)=>{
    
        try {
            const users = `SELECT * FROM users WHERE email = ?`
            //check if users exist
            db.query(users,[req.body.email],(err,data)=>{
                if (data.length >0) return res.status(409).json("user already exist")
                    
                //hasshing password
                const salt =bcrypt.genSaltSync(10)
                const hashedPassword =bcrypt.hashSync(req.body.password,salt)

                const newUser= `INSERT INTO users (email,username,password) VALUES (?)`
                value =[req.body.email, req.body.username, hashedPassword]

                db.query(newUser,[value],(err,data)=>{
                    if(err) return  res.status(400).json("Something went wrong")
                    
                    return res.status(200).json("user created succesfully")
                })
            })
            
        } catch (error) {
            res.status(500).json("Internal server error")
            
        }

    })
   

            //route for login
            app.post('/api/login',async(req,res)=>{
                try {
                    const users =`SELECT*FROM users  WHERE email =?`
                    db.query(users,[req.body.email],(err,data)=>{
                        if(data.length === 0)return res.status(404).json("user not found")
    
                        const isPasswordValid= bcrypt.compareSync(req.body.password, data[0].password)
    
                        if(!isPasswordValid) return res.status(400).json('invalid email or password')

                        
                      return ( res.status(200).json("Login succesful"))
                        
                    })
                    
                } catch (error) {
                    res.status(500).json('Internal Server Error')
                    
                }
            })
        

   
//EXPENSE TABLE STARTS HERE!!
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


app.get('/api/view/:user_id', async (req, res) => {
    const userId = req.params.user_id;

    try {
        const query = 'SELECT * FROM expense WHERE user_id = ?';
        
        db.query(query, [userId], (err, data) => {
            if (err) {
                return res.status(400).json("Failed to retrieve data");
            }
            
            return res.status(200).json(data);
        });
        
    } catch (error) {
        res.status(500).json('Internal Server Error');
    }
});

        
app.listen('3000',()=>{
    console.log( 'port is running on port 3000');
})


