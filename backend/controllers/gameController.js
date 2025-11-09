const pool = require('../db');

function rollThreeDice(){
  const d1 = Math.floor(Math.random()*6)+1;
  const d2 = Math.floor(Math.random()*6)+1;
  const d3 = Math.floor(Math.random()*6)+1;
  return { d1, d2, d3, sum: d1+d2+d3 };
}

// Tài = sum 11-17, Xỉu = sum 4-10. Handle triples: if all three same => house wins? Many rules vary.
// We'll implement classic rule: triples (e.g., 1-1-1 or 6-6-6) count as dealer (HOUSe) wins -> treat as neither TAI nor XIU => player loses.
// For simplicity: triples => ALL lose (player loses).
function evaluate(choice, sum, dice){
  const isTriple = (dice.d1 === dice.d2 && dice.d2 === dice.d3);
  if(isTriple) return 'LOSE';
  if(sum >= 11 && sum <= 17){
    return choice === 'TAI' ? 'WIN' : 'LOSE';
  } else if(sum >=4 && sum <=10){
    return choice === 'XIU' ? 'WIN' : 'LOSE';
  } else {
    return 'LOSE';
  }
}

async function placeBet(req, res){
  const userId = req.user.id;
  const { choice, amount } = req.body;
  if(!choice || !amount) return res.status(400).json({error:'Missing fields'});
  if(!['TAI','XIU'].includes(choice)) return res.status(400).json({error:'Invalid choice'});
  const betAmount = parseInt(amount);
  if(betAmount <= 0) return res.status(400).json({error:'Invalid amount'});

  const conn = await pool.getConnection();
  try{
    await conn.beginTransaction();
    // fetch user balance FOR UPDATE
    const [rows] = await conn.query('SELECT balance FROM users WHERE id = ? FOR UPDATE', [userId]);
    if(!rows.length) { await conn.rollback(); return res.status(400).json({error:'User not found'}); }
    const balance = BigInt(rows[0].balance);
    if(balance < BigInt(betAmount)){ await conn.rollback(); return res.status(400).json({error:'Insufficient balance'}); }

    // deduct balance
    const newBalance = balance - BigInt(betAmount);
    await conn.query('UPDATE users SET balance = ? WHERE id = ?', [newBalance.toString(), userId]);
    await conn.query('INSERT INTO transactions (user_id, type, amount, note) VALUES (?, "BET", ?, ?)', [userId, betAmount, `Bet ${choice}`]);
    // roll dice
    const dice = rollThreeDice();
    const result = evaluate(choice, dice.sum, dice);
    let payout = 0;
    if(result === 'WIN'){
      // payout 1:1 (simplest). You can adjust odds.
      payout = betAmount * 2; // return stake + win equal stake
      await conn.query('UPDATE users SET balance = balance + ? WHERE id = ?', [payout, userId]);
      await conn.query('INSERT INTO transactions (user_id, type, amount, note) VALUES (?, "PAYOUT", ?, ?)', [userId, payout, `Payout ${choice}`]);
    }
    // record bet
    await conn.query('INSERT INTO bets (user_id, choice, amount, result, payout, dice_sum) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, choice, betAmount, result, payout, dice.sum]);

    await conn.commit();

    // fetch new balance
    const [urows] = await pool.query('SELECT balance FROM users WHERE id = ?', [userId]);
    const updatedBalance = urows[0].balance;

    // Return details
    res.json({
      result,
      dice,
      sum: dice.sum,
      payout,
      balance: updatedBalance
    });

  }catch(e){
    console.error(e);
    await conn.rollback();
    res.status(500).json({error:'Server error'});
  }finally{
    conn.release();
  }
}

async function getProfile(req, res){
  const userId = req.user.id;
  try{
    const [rows] = await pool.query('SELECT id, username, balance FROM users WHERE id = ?', [userId]);
    if(!rows.length) return res.status(404).json({error:'Not found'});
    res.json({ user: rows[0] });
  }catch(e){
    console.error(e);
    res.status(500).json({error:'Server error'});
  }
}

module.exports = { placeBet, getProfile };
