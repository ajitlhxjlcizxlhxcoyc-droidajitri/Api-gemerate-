const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'darkwin_secret_2026';
const ADMIN_SECRET = process.env.ADMIN_SECRET || 'darkwin_admin_2026';

app.use(cors({ origin: '*' }));
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  try { fs.mkdirSync(DATA_DIR, { recursive: true }); } catch (e) { console.log('mkdir err:', e.message); }
}

const loadData = (f) => {
  const p = path.join(DATA_DIR, f + '.json');
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf8')); } catch { return []; }
};

const saveData = (f, d) => {
  try { fs.writeFileSync(path.join(DATA_DIR, f + '.json'), JSON.stringify(d, null, 2)); }
  catch (e) { console.log('save err:', e.message); }
};

const hashPwd = (p) => crypto.createHash('sha256').update(p + JWT_SECRET).digest('hex');
const genId = (p = '') => p + Date.now().toString(36) + crypto.randomBytes(3).toString('hex');
const genUID = () => 'DW' + Date.now().toString().slice(-8);
const genInvite = () => crypto.randomBytes(4).toString('hex').toUpperCase();

function initData() {
  if (!fs.existsSync(path.join(DATA_DIR, 'banners.json'))) {
    saveData('banners', [
      { id: genId('bn_'), title: 'Welcome', imageUrl: 'https://i.ibb.co/hxyMYWyt/file-00000000192c8211bf1bcf496522a496.png', type: 'popup', position: 0, isActive: true, createdAt: new Date().toISOString() },
      { id: genId('bn_'), title: 'Home', imageUrl: 'https://i.ibb.co/8DXd4d5D/file-00000000e284820bb3bcdcdc7654f7e9.png', type: 'home', position: 0, isActive: true, createdAt: new Date().toISOString() }
    ]);
  }
  ['users','transactions','bets','giftcodes','gameresults'].forEach(f => {
    if (!fs.existsSync(path.join(DATA_DIR, f + '.json'))) saveData(f, []);
  });
  if (loadData('giftcodes').length === 0) {
    saveData('giftcodes', [
      { id: genId('gc_'), code: 'DARKWIN600', amount: 600, maxUses: 100, usedCount: 0, usedBy: [], isActive: true, createdAt: new Date().toISOString() },
      { id: genId('gc_'), code: 'WELCOME100', amount: 100, maxUses: 100, usedCount: 0, usedBy: [], isActive: true, createdAt: new Date().toISOString() }
    ]);
  }
  console.log('✅ Data ready');
}
initData();

function auth(req, res, next) {
  const t = req.headers.authorization?.split(' ')[1];
  if (!t) return res.status(401).json({ success: false, message: 'No token' });
  try { req.user = jwt.verify(t, JWT_SECRET); next(); }
  catch { res.status(401).json({ success: false, message: 'Invalid token' }); }
}

function adminAuth(req, res, next) {
  if (req.headers['x-admin-key'] !== ADMIN_SECRET) return res.status(403).json({ success: false, message: 'Admin denied' });
  next();
}

app.get('/', (req, res) => res.json({ success: true, message: '🚀 DARKWIN API running perfectly', version: '2.1.0' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// AUTH
app.post('/api/auth/register', (req, res) => {
  const { phone, password, inviteCode } = req.body;
  if (!phone || !password) return res.status(400).json({ success: false, message: 'Phone & password required' });
  const users = loadData('users');
  if (users.find(u => u.phone === phone)) return res.status(400).json({ success: false, message: 'Phone already registered' });
  const user = {
    uid: genUID(), phone, password: hashPwd(password),
    inviteCode: genInvite(), invitedBy: inviteCode || null,
    balance: 0, totalDeposit: 0, totalWithdraw: 0, totalBet: 0, totalWin: 0,
    vipLevel: 0, isBanned: false, bankDetails: null, upiDetails: null,
    lastLogin: new Date().toISOString(), createdAt: new Date().toISOString()
  };
  users.push(user);
  saveData('users', users);
  const token = jwt.sign({ uid: user.uid, phone }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, message: 'Registered', token, user: { uid: user.uid, phone, balance: 0, inviteCode: user.inviteCode, vipLevel: 0 } });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  const users = loadData('users');
  const user = users.find(u => u.phone === phone);
  if (!user) return res.status(400).json({ success: false, message: 'User not found' });
  if (user.isBanned) return res.status(403).json({ success: false, message: 'Account banned' });
  if (user.password !== hashPwd(password)) return res.status(400).json({ success: false, message: 'Wrong password' });
  user.lastLogin = new Date().toISOString();
  saveData('users', users);
  const token = jwt.sign({ uid: user.uid, phone }, JWT_SECRET, { expiresIn: '30d' });
  res.json({ success: true, message: 'Login successful', token, user: { uid: user.uid, phone, balance: user.balance, inviteCode: user.inviteCode, vipLevel: user.vipLevel } });
});

app.get('/api/auth/me', auth, (req, res) => {
  const u = loadData('users').find(x => x.uid === req.user.uid);
  if (!u) return res.status(404).json({ success: false, message: 'User not found' });
  const { password, ...safe } = u;
  res.json({ success: true, user: safe });
});

// USER & GAME ROUTES
app.get('/api/user/balance', auth, (req, res) => {
  const u = loadData('users').find(x => x.uid === req.user.uid);
  if (!u) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, balance: u.balance, totalDeposit: u.totalDeposit, totalWithdraw: u.totalWithdraw, totalBet: u.totalBet, totalWin: u.totalWin, vipLevel: u.vipLevel });
});

app.get('/api/banners/:type', (req, res) => {
  const banners = loadData('banners').filter(b => b.type === req.params.type && b.isActive);
  res.json({ success: true, banners });
});

// SERVER LISTEN WITH 0.0.0.0 (RENDER FIX)
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
  
