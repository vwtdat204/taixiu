const pool = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
dotenv.config();

async function register(req, res){
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({error:'Missing fields'});
  try{
    const [rows] = await pool.query('SELECT id FROM users WHERE username = ?', [username]);
    if(rows.length) return res.status(400).json({error:'Username exists'});

    const hash = await bcrypt.hash(password, 10);
    const [resIns] = await pool.query('INSERT INTO users (username, password, balance) VALUES (?, ?, ?)', [username, hash, 1000000]);
    const userId = resIns.insertId;
    const token = jwt.sign({ id: userId, username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: userId, username, balance: 1000000 }});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Server error'});
  }
}

async function login(req, res){
  const { username, password } = req.body;
  if(!username || !password) return res.status(400).json({error:'Missing fields'});
  try{
    const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
    if(!rows.length) return res.status(400).json({error:'Invalid credentials'});
    const user = rows[0];
    const ok = await bcrypt.compare(password, user.password);
    if(!ok) return res.status(400).json({error:'Invalid credentials'});

    const token = jwt.sign({ id: user.id, username: user.username }, process.env.JWT_SECRET, { expiresIn: '7d' });
    res.json({ token, user: { id: user.id, username: user.username, balance: user.balance }});
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Server error'});
  }
}

module.exports = { register, login };
