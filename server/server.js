require("dotenv").config();
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const express=require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({extended:true}));

mongoose.connect('mongodb://localhost:27017/your_db_name', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
  
  const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    name: { type: String, required: true },
  });
  
const User = mongoose.model('User', userSchema);

const API_KEY=process.env.API_KEY;

function fetchNews(url,res)
{
    axios.get(url)
    .then(response=>{
        if(response.data.totalResults>0){
            res.json({
                status:200,
                success:true,
                message:"Success",
                data:response.data
            });
        }
        else{
            res.json({
                status:200,
                success:true,
                message:"No results"
            });
        }
    })
    .catch(error=>{
        res.json({
            status:500,
            success:false,
            message:"failed",
            error:error.message
        });
    });
}

app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ email, password: hashedPassword, name });
    await user.save();
    res.status(201).send({ message: 'User registered' });
  });

  app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).send('User not found');
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).send('Invalid credentials');
    }
    const token = jwt.sign({ id: user._id }, 'your_jwt_secret', { expiresIn: '1h' });
    res.send({ token, name: user.name });
  });

  app.get('/profile', async (req, res) => {
    const token = req.headers['authorization'];
    if (!token) {
      return res.status(401).send('Access denied');
    }
    try {
      const verified = jwt.verify(token, 'your_jwt_secret');
      const user = await User.findById(verified.id);
      res.send({ email: user.email, name: user.name });
    } catch (error) {
      res.status(400).send('Invalid token');
    }
  });

app.get("/all-news",(req,res)=>{
    let pageSize=parseInt(req.query.pagesize) || 10;
    let page=parseInt(req.query.page)||1;
    let url=`https://newsapi.org/v2/everything?q=news&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`
    fetchNews(url,res);
})

app.options("/top-headlines",cors());

app.get("/top-headlines",(req,res)=>{
    let pageSize=parseInt(req.query.pagesize) || 20;
    let page=parseInt(req.query.page)||1;
    let category=req.query.category||"business";

    let url=`https://newsapi.org/v2/top-headlines?category=${category}&language=en&page=${page}&pageSize=${pageSize}&apiKey=${API_KEY}`
    fetchNews(url,res);
})



const PORT=process.env.PORT || 3000;

app.listen(PORT,()=>{
    console.log(`Server is running at port ${PORT}`);
    
})
