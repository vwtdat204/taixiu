const API = location.origin + '/api';
let token = localStorage.getItem('taixiu_token') || null;
let username = 'Khách';
const socket = io(location.origin);

function setUser(user, _token){
  token = _token;
  username = user.username;
  document.getElementById('usernameDisplay').innerText = username;
  document.getElementById('balanceDisplay').innerText = formatCurrency(user.balance);
  if(token) localStorage.setItem('taixiu_token', token);
}

function formatCurrency(n){
  return Number(n).toLocaleString();
}

// auth modals
const modal = document.getElementById('modal');
const modalTitle = document.getElementById('modalTitle');
const mUser = document.getElementById('mUsername');
const mPass = document.getElementById('mPassword');
document.getElementById('btnRegister').onclick = ()=>{ modalTitle.innerText='Đăng ký'; modal.classList.remove('hidden'); }
document.getElementById('btnLogin').onclick = ()=>{ modalTitle.innerText='Đăng nhập'; modal.classList.remove('hidden'); }
document.getElementById('modalClose').onclick = ()=>{ modal.classList.add('hidden'); }
document.getElementById('modalSubmit').onclick = async ()=>{
  const u = mUser.value.trim(); const p = mPass.value.trim();
  if(!u||!p) return alert('Nhập đủ');
  const mode = modalTitle.innerText.includes('Đăng ký') ? 'register' : 'login';
  try{
    const res = await fetch(`${API}/auth/${mode}`, {
      method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({ username:u, password:p })
    });
    const data = await res.json();
    if(!res.ok) return alert(data.error || 'Lỗi');
    setUser(data.user, data.token);
    modal.classList.add('hidden');
  }catch(e){ alert('Lỗi server'); }
};

// place bet
document.getElementById('placeBetBtn').onclick = async ()=>{
  if(!token) return alert('Đăng nhập trước');
  const amount = Number(document.getElementById('betAmount').value);
  const choice = selectedChoice || 'TAI';
  if(amount <= 0) return alert('Số tiền không hợp lệ');
  try{
    const res = await fetch(`${API}/game/bet`, {
      method:'POST',
      headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
      body: JSON.stringify({ choice, amount })
    });
    const data = await res.json();
    if(!res.ok) return alert(data.error || 'Lỗi');
    // show result
    document.getElementById('diceSum').innerText = data.sum;
    document.getElementById('resultBadge').innerText = data.result;
    document.getElementById('balanceDisplay').innerText = formatCurrency(data.balance);
    // Emit round result to chat viewers
    socket.emit('chatMessage', { username:'Hệ thống', message: `${username} cược ${choice} ${amount} - KQ: ${data.result} (sum ${data.sum})`});
  }catch(e){ alert('Lỗi đặt cược'); }
};

let selectedChoice = 'TAI';
document.querySelectorAll('.bet').forEach(b => {
  b.addEventListener('click', () => {
    selectedChoice = b.dataset.choice;
    document.querySelectorAll('.bet').forEach(x => x.style.outline = 'none');
    b.style.outline = '3px solid rgba(255,255,255,0.12)';
  });
});

// chat
const chatWindow = document.getElementById('chatWindow');
document.getElementById('sendChat').onclick = ()=> {
  const msg = document.getElementById('chatMessage').value.trim();
  if(!msg) return;
  socket.emit('chatMessage', { username, message: msg });
  document.getElementById('chatMessage').value = '';
};
socket.on('chatMessage', (data) => {
  const el = document.createElement('div');
  el.className = 'msg';
  const t = new Date(data.time || Date.now());
  el.innerHTML = `<strong>${data.username}</strong> <small style="color:#9aa">[${t.toLocaleTimeString()}]</small><div>${escapeHtml(data.message)}</div>`;
  chatWindow.appendChild(el);
  chatWindow.scrollTop = chatWindow.scrollHeight;
});

function escapeHtml(s){ return s.replace(/[&<>"']/g, c=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[c])); }

// when page loads, try fetch profile
async function loadProfile(){
  if(!token) return;
  try{
    const res = await fetch(`${API}/game/profile`, { headers: { 'Authorization':'Bearer '+token } });
    const data = await res.json();
    if(res.ok) setUser(data.user, token);
    else { localStorage.removeItem('taixiu_token'); token = null; }
  }catch(e){}
}
loadProfile();
