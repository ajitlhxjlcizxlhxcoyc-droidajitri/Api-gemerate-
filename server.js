const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const loadData = (f) => { try { return JSON.parse(fs.readFileSync(path.join(DATA_DIR, f + '.json'), 'utf8')); } catch { return []; } };
const saveData = (f, d) => fs.writeFileSync(path.join(DATA_DIR, f + '.json'), JSON.stringify(d, null, 2));
const genId = (p = '') => p + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const genUID = () => 'UID' + Math.floor(100000 + Math.random() * 900000);
const genInvite = () => 'DW' + Math.floor(10000 + Math.random() * 90000);

const vipConfig = [
  { level: 1, expNeeded: 3000, levelUpBonus: 60 }, { level: 2, expNeeded: 30000, levelUpBonus: 180 },
  { level: 3, expNeeded: 400000, levelUpBonus: 690 }, { level: 4, expNeeded: 1000000, levelUpBonus: 1890 },
  { level: 5, expNeeded: 3000000, levelUpBonus: 4890 }, { level: 6, expNeeded: 10000000, levelUpBonus: 16900 },
  { level: 7, expNeeded: 30000000, levelUpBonus: 58900 }, { level: 8, expNeeded: 100000000, levelUpBonus: 169000 },
  { level: 9, expNeeded: 300000000, levelUpBonus: 689000 }, { level: 10, expNeeded: 1000000000, levelUpBonus: 1890000 }
];

// 🎁 Deposit Milestones
const depositMilestones = [
  { id: 'm1', deposit: 1000, reward: '₹100 Bonus', rewardType: 'cash', amount: 100, icon: '💰' },
  { id: 'm2', deposit: 2500, reward: 'Smart Watch', rewardType: 'product', amount: 0, icon: '⌚' },
  { id: 'm3', deposit: 5000, reward: 'Activa Scooter', rewardType: 'product', amount: 0, icon: '🛵' },
  { id: 'm4', deposit: 10000, reward: 'iPhone 15', rewardType: 'product', amount: 0, icon: '📱' },
  { id: 'm5', deposit: 25000, reward: 'Royal Enfield Bike', rewardType: 'product', amount: 0, icon: '🏍️' },
  { id: 'm6', deposit: 50000, reward: '₹5000 Cash + Gold Coin', rewardType: 'cash', amount: 5000, icon: '🏆' },
  { id: 'm7', deposit: 100000, reward: 'Laptop + ₹10000 Cash', rewardType: 'cash', amount: 10000, icon: '💻' }
];

// ⚙️ Default page content (editable by admin)
const defaultPages = {
  home: {
    title: 'Home',
    popupBanner: 'https://i.ibb.co/hxyMYWyt/file-00000000192c8211bf1bcf496522a496.png',
    marqueeText: '🎉 User 72***91 won ₹1,850 in WinGo • 🎉 User 88***12 won ₹5,200 • 🎉 User 91***08 won ₹12,000 • 🎉 User 82***56 won ₹21,000',
    promoText: 'Play. Win. Earn.',
    updatedAt: new Date().toISOString()
  },
  deposit: {
    upiNumber: '7478478039',
    qrCodeUrl: 'https://i.ibb.co/kVBLF7G6/Screenshot-20260918-145024.png',
    instructions: 'Scan QR with any UPI app. Pay exactly the amount. Then submit UTR.',
    updatedAt: new Date().toISOString()
  },
  promotion: {
    bannerUrl: 'https://i.ibb.co/8DXd4d5D/file-00000000e284820bb3bcdcdc7654f7e9.png',
    rules: '1. Bonuses credited within 24 hours.\n2. Each reward once per day.\n3. Referral bonus on friend deposit.\n4. Fraud forfeits all bonuses.',
    updatedAt: new Date().toISOString()
  },
  agent: {
    bannerUrl: 'https://i.ibb.co/pvMbkdBb/images-3.jpg',
    description: 'Invite friends and earn up to ₹10,000 per friend!',
    updatedAt: new Date().toISOString()
  }
};

function initData() {
  ['users','banners','messages','deposits','withdrawals','giftCodes','bets','vipHistory','gameResults','transactions','milestoneClaims'].forEach(f => {
    if (!fs.existsSync(path.join(DATA_DIR, f + '.json'))) saveData(f, []);
  });
  if (!fs.existsSync(path.join(DATA_DIR, 'pages.json'))) saveData('pages', defaultPages);
  if (loadData('banners').length === 0) {
    saveData('banners', [
      { id: genId('bn_'), imageUrl: 'https://i.ibb.co/hxyMYWyt/file-00000000192c8211bf1bcf496522a496.png', link: '', type: 'popup', isActive: true },
      { id: genId('bn_'), imageUrl: 'https://i.ibb.co/8DXd4d5D/file-00000000e284820bb3bcdcdc7654f7e9.png', link: '', type: 'home', isActive: true }
    ]);
  }
  if (loadData('giftCodes').length === 0) {
    saveData('giftCodes', [
      { code: 'DARKWIN600', amount: 600, isActive: true, usedBy: [], maxUses: 100, usedCount: 0 },
      { code: 'WELCOME100', amount: 100, isActive: true, usedBy: [], maxUses: 100, usedCount: 0 }
    ]);
  }
  console.log('✅ Data ready');
}
initData();

const findUser = (uid) => loadData('users').find(u => u.uid === uid);
const updateUser = (uid, updates) => {
  const users = loadData('users');
  const i = users.findIndex(u => u.uid === uid);
  if (i === -1) return null;
  users[i] = { ...users[i], ...updates };
  saveData('users', users);
  return users[i];
};

// ==================== ROOT ====================
app.get('/', (req, res) => res.json({ success: true, message: '🚀 DARKWIN API v3.1', version: '3.1.0' }));
app.get('/health', (req, res) => res.json({ status: 'ok' }));

// ==================== 📄 PAGES API (NEW - Admin editable) ====================
app.get('/api/pages/:pageName', (req, res) => {
  const pages = loadData('pages');
  const page = pages[req.params.pageName];
  if (!page) return res.status(404).json({ error: 'Page not found' });
  res.json(page);
});

app.get('/api/pages', (req, res) => {
  res.json(loadData('pages'));
});

app.post('/api/admin/pages/:pageName', (req, res) => {
  const pages = loadData('pages');
  const pageName = req.params.pageName;
  pages[pageName] = { ...pages[pageName], ...req.body, updatedAt: new Date().toISOString() };
  saveData('pages', pages);
  res.json({ message: 'Page updated', page: pages[pageName] });
});

// ==================== AUTH ====================
app.post('/api/auth/register', (req, res) => {
  const { phone, password, referralCode } = req.body;
  if (!phone || !password) return res.status(400).json({ error: 'Phone & password required' });
  if (phone.length < 10) return res.status(400).json({ error: 'Invalid phone' });
  const users = loadData('users');
  if (users.find(u => u.phone === phone)) return res.status(400).json({ error: 'Phone already registered' });
  const newUser = {
    uid: genUID(), phone, password, balance: 0, exp: 0, vipLevel: 0,
    totalDeposit: 0, totalWithdraw: 0, totalBet: 0, totalWin: 0,
    isBanned: false, inviteCode: genInvite(), referredBy: referralCode || null,
    bankDetails: null, upiDetails: null,
    createdAt: new Date().toISOString(), lastLogin: new Date().toISOString()
  };
  users.push(newUser);
  saveData('users', users);
  if (referralCode) {
    const ref = users.find(u => u.inviteCode === referralCode);
    if (ref) updateUser(ref.uid, { balance: (ref.balance || 0) + 50 });
  }
  res.json({ message: 'Registration successful', user: newUser });
});

app.post('/api/auth/login', (req, res) => {
  const { phone, password } = req.body;
  const users = loadData('users');
  const user = users.find(u => u.phone === phone && u.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  if (user.isBanned) return res.status(403).json({ error: 'Account banned' });
  updateUser(user.uid, { lastLogin: new Date().toISOString() });
  res.json({ message: 'Login successful', user });
});

// ==================== USER ====================
app.get('/api/user/profile/:uid', (req, res) => {
  const user = findUser(req.params.uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

app.get('/api/user/balance/:uid', (req, res) => {
  const user = findUser(req.params.uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ balance: user.balance, totalDeposit: user.totalDeposit, totalBet: user.totalBet, totalWin: user.totalWin, vipLevel: user.vipLevel, exp: user.exp });
});

app.post('/api/user/bank', (req, res) => {
  const { uid, accountName, accountNumber, ifsc } = req.body;
  const user = updateUser(uid, { bankDetails: { accountName, accountNumber, ifsc } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'Bank saved' });
});

app.post('/api/user/upi', (req, res) => {
  const { uid, upiId, accountName } = req.body;
  const user = updateUser(uid, { upiDetails: { upiId, accountName } });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ message: 'UPI saved' });
});

// ==================== BANNERS ====================
app.get('/api/banners', (req, res) => res.json(loadData('banners').filter(b => b.isActive && b.type === 'home')));
app.get('/api/banners/popup', (req, res) => res.json(loadData('banners').filter(b => b.isActive && b.type === 'popup')));

// ==================== WINGO ====================
app.post('/api/game/wingo/bet', (req, res) => {
  const { uid, betAmount, betType, betValue, period } = req.body;
  const user = findUser(uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.isBanned) return res.status(403).json({ error: 'User banned' });
  if (user.balance < betAmount) return res.status(400).json({ error: 'Insufficient balance' });
  const users = loadData('users');
  const ui = users.findIndex(u => u.uid === uid);
  users[ui].balance -= Number(betAmount);
  users[ui].totalBet = (users[ui].totalBet || 0) + Number(betAmount);
  users[ui].exp = (users[ui].exp || 0) + Number(betAmount);
  let newVip = users[ui].vipLevel || 0;
  vipConfig.forEach(cfg => { if (users[ui].exp >= cfg.expNeeded && newVip < cfg.level) newVip = cfg.level; });
  users[ui].vipLevel = newVip;
  saveData('users', users);
  const bets = loadData('bets');
  bets.push({ id: genId('bet_'), uid, period: period || genId('P'), betType: betType || 'big', betValue: betValue !== undefined ? betValue : null, amount: Number(betAmount), payout: 0, result: 'pending', createdAt: new Date().toISOString() });
  saveData('bets', bets);
  res.json({ message: 'Bet placed', remainingBalance: users[ui].balance, vipLevel: users[ui].vipLevel });
});

app.get('/api/game/wingo/history/:uid', (req, res) => {
  res.json(loadData('bets').filter(b => b.uid === req.params.uid).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 50));
});

app.get('/api/game/wingo/periods', (req, res) => {
  const results = loadData('gameResults').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 10);
  if (results.length === 0) {
    const demo = [];
    for (let i = 0; i < 10; i++) {
      const n = Math.floor(Math.random() * 10);
      const color = n === 0 ? ['violet','red'] : n === 5 ? ['violet','green'] : [1,3,7,9].includes(n) ? ['green'] : ['red'];
      demo.push({ number: n, color });
    }
    return res.json(demo);
  }
  res.json(results);
});

// ==================== VIP ====================
app.get('/api/vip/status/:uid', (req, res) => {
  const user = findUser(req.params.uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ uid: user.uid, exp: user.exp, vipLevel: user.vipLevel, vipConfig });
});

// ==================== 🎁 MILESTONES ====================
app.get('/api/milestones/:uid', (req, res) => {
  const user = findUser(req.params.uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const claims = loadData('milestoneClaims').filter(c => c.uid === user.uid);
  const milestones = depositMilestones.map(m => {
    const claimed = claims.find(c => c.milestoneId === m.id);
    return { ...m, unlocked: (user.totalDeposit || 0) >= m.deposit, claimed: !!claimed, claimedAt: claimed ? claimed.claimedAt : null };
  });
  res.json({ totalDeposit: user.totalDeposit || 0, milestones, nextMilestone: milestones.find(m => !m.claimed) || null });
});

app.post('/api/milestones/claim', (req, res) => {
  const { uid, milestoneId } = req.body;
  const user = findUser(uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const milestone = depositMilestones.find(m => m.id === milestoneId);
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  if ((user.totalDeposit || 0) < milestone.deposit) return res.status(400).json({ error: 'Deposit more to unlock' });
  const claims = loadData('milestoneClaims');
  if (claims.find(c => c.uid === uid && c.milestoneId === milestoneId)) return res.status(400).json({ error: 'Already claimed' });
  const claim = { id: genId('mc_'), uid, milestoneId, reward: milestone.reward, rewardType: milestone.rewardType, amount: milestone.amount, status: 'PENDING', claimedAt: new Date().toISOString() };
  claims.push(claim);
  saveData('milestoneClaims', claims);
  if (milestone.rewardType === 'cash' && milestone.amount > 0) {
    updateUser(uid, { balance: (user.balance || 0) + milestone.amount });
    claim.status = 'SUCCESS';
    saveData('milestoneClaims', claims);
  }
  const messages = loadData('messages');
  messages.push({ id: genId('msg_'), uid, title: '🎁 Milestone Unlocked!', message: `You unlocked: ${milestone.reward}`, date: new Date().toISOString() });
  saveData('messages', messages);
  res.json({ message: 'Milestone claimed!', claim });
});

// ==================== GIFT CODE ====================
app.post('/api/user/claim-giftcode', (req, res) => {
  const { uid, code } = req.body;
  const user = findUser(uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  const giftCodes = loadData('giftCodes');
  const gi = giftCodes.findIndex(g => g.code === code.toUpperCase());
  if (gi === -1) return res.status(400).json({ error: 'Invalid Gift Code' });
  if (!giftCodes[gi].isActive) return res.status(400).json({ error: 'Code Expired' });
  if (giftCodes[gi].usedBy.includes(uid)) return res.status(400).json({ error: 'Already used' });
  if (giftCodes[gi].usedCount >= giftCodes[gi].maxUses) return res.status(400).json({ error: 'Code Expired' });
  const users = loadData('users');
  const ui = users.findIndex(u => u.uid === uid);
  users[ui].balance += giftCodes[gi].amount;
  saveData('users', users);
  giftCodes[gi].usedCount += 1;
  giftCodes[gi].usedBy.push(uid);
  saveData('giftCodes', giftCodes);
  res.json({ message: `Success! ₹${giftCodes[gi].amount} added`, amount: giftCodes[gi].amount, newBalance: users[ui].balance });
});

// ==================== MESSAGES ====================
app.get('/api/user/messages/:uid', (req, res) => {
  res.json(loadData('messages').filter(m => m.uid === req.params.uid).sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// ==================== DEPOSIT ====================
app.post('/api/user/deposit', (req, res) => {
  const { uid, amount, utr, method } = req.body;
  if (!amount || amount < 100) return res.status(400).json({ error: 'Min ₹100' });
  if (!utr || utr.length < 12) return res.status(400).json({ error: 'Valid 12-digit UTR required' });
  const deposits = loadData('deposits');
  const dep = { id: genId('dep_'), uid, amount: Number(amount), utr, method: method || 'UPI', status: 'PENDING', date: new Date().toISOString() };
  deposits.push(dep);
  saveData('deposits', deposits);
  res.json({ message: 'Deposit submitted', deposit: dep });
});

app.get('/api/user/deposit-history/:uid', (req, res) => {
  res.json(loadData('deposits').filter(d => d.uid === req.params.uid).sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// ==================== WITHDRAW ====================
app.post('/api/user/withdraw', (req, res) => {
  const { uid, amount, method, password } = req.body;
  const user = findUser(uid);
  if (!user) return res.status(404).json({ error: 'User not found' });
  if (user.password !== password) return res.status(400).json({ error: 'Wrong password' });
  if (amount < 100) return res.status(400).json({ error: 'Min ₹100' });
  if (user.balance < amount) return res.status(400).json({ error: 'Insufficient balance' });
  if (method === 'bank' && !user.bankDetails) return res.status(400).json({ error: 'Save bank first' });
  if (method === 'upi' && !user.upiDetails) return res.status(400).json({ error: 'Save UPI first' });
  const users = loadData('users');
  const ui = users.findIndex(u => u.uid === uid);
  users[ui].balance -= Number(amount);
  users[ui].totalWithdraw = (users[ui].totalWithdraw || 0) + Number(amount);
  saveData('users', users);
  const wd = { id: genId('wd_'), uid, amount: Number(amount), method, status: 'PROCESSING', details: method === 'bank' ? user.bankDetails : user.upiDetails, date: new Date().toISOString() };
  const withdrawals = loadData('withdrawals');
  withdrawals.push(wd);
  saveData('withdrawals', withdrawals);
  res.json({ message: 'Withdraw submitted', withdrawal: wd, newBalance: users[ui].balance });
});

app.get('/api/user/withdraw-history/:uid', (req, res) => {
  res.json(loadData('withdrawals').filter(w => w.uid === req.params.uid).sort((a, b) => new Date(b.date) - new Date(a.date)));
});

// ==================== HOME ====================
app.get('/api/home/winners', (req, res) => {
  const bets = loadData('bets');
  const today = new Date().toDateString();
  const byUser = {};
  bets.forEach(b => { if (b.result === 'win' && b.payout > 0 && new Date(b.createdAt).toDateString() === today) byUser[b.uid] = (byUser[b.uid] || 0) + b.payout; });
  let winners = Object.entries(byUser).map(([uid, amount]) => ({ uid, name: 'User ' + uid.slice(-5), amount, game: 'WinGo' })).sort((a, b) => b.amount - a.amount).slice(0, 10);
  if (winners.length === 0) winners = [
    { name: 'User 72***91', amount: 18500, game: 'WinGo 3m' }, { name: 'User 88***12', amount: 12400, game: 'WinGo 1m' },
    { name: 'User 65***44', amount: 9800, game: 'K3 1m' }, { name: 'User 91***08', amount: 7600, game: 'WinGo 30s' },
    { name: 'User 34***77', amount: 5200, game: '5D 1m' }
  ];
  res.json(winners);
});

// ==================== AGENT ====================
app.get('/api/agent/team/:uid', (req, res) => {
  const users = loadData('users');
  const me = users.find(u => u.uid === req.params.uid);
  if (!me) return res.status(404).json({ error: 'User not found' });
  const team = users.filter(u => u.referredBy === me.inviteCode).map(u => ({ uid: u.uid, name: 'User ' + u.uid.slice(-5), joinedAt: u.createdAt, earned: Math.floor((u.totalDeposit || 0) * 0.1) }));
  res.json({ team, totalInvited: team.length, activeCount: team.filter(t => t.earned > 0).length, totalEarned: team.reduce((s, t) => s + t.earned, 0) });
});

// ==================== ADMIN ====================
app.get('/api/admin/stats', (req, res) => {
  const users = loadData('users');
  const deposits = loadData('deposits');
  const withdrawals = loadData('withdrawals');
  const bets = loadData('bets');
  const claims = loadData('milestoneClaims');
  res.json({
    totalUsers: users.length, bannedUsers: users.filter(u => u.isBanned).length,
    totalBalance: users.reduce((s, u) => s + (u.balance || 0), 0),
    totalDeposit: deposits.filter(d => d.status === 'APPROVED').reduce((s, d) => s + d.amount, 0),
    totalWithdraw: withdrawals.filter(w => w.status === 'SUCCESS').reduce((s, w) => s + w.amount, 0),
    totalBet: bets.reduce((s, b) => s + b.amount, 0),
    pendingDeposits: deposits.filter(d => d.status === 'PENDING').length,
    pendingWithdraws: withdrawals.filter(w => w.status === 'PROCESSING').length,
    pendingMilestones: claims.filter(c => c.status === 'PENDING').length
  });
});

app.get('/api/admin/users', (req, res) => {
  const search = (req.query.search || '').toLowerCase();
  let users = loadData('users');
  if (search) users = users.filter(u => u.uid.toLowerCase().includes(search) || u.phone.includes(search));
  res.json(users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
});

app.post('/api/admin/give-bonus', (req, res) => {
  const { uid, bonusAmount, reasonMessage } = req.body;
  const user = updateUser(uid, { balance: (findUser(uid)?.balance || 0) + parseFloat(bonusAmount) });
  if (!user) return res.status(404).json({ error: 'User not found' });
  const messages = loadData('messages');
  messages.push({ id: genId('msg_'), uid, title: 'Bonus Received!', message: reasonMessage || `You received ₹${bonusAmount} bonus!`, date: new Date().toISOString() });
  saveData('messages', messages);
  res.json({ message: 'Bonus added', newBalance: user.balance });
});

app.post('/api/admin/ban-user', (req, res) => {
  const { uid, banStatus } = req.body;
  const user = updateUser(uid, { isBanned: banStatus });
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ message: `User ${banStatus ? 'banned' : 'unbanned'}` });
});

app.get('/api/admin/deposits', (req, res) => {
  const status = req.query.status;
  let list = loadData('deposits');
  if (status) list = list.filter(d => d.status === status);
  res.json(list.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.post('/api/admin/deposit-action', (req, res) => {
  const { id, action } = req.body;
  const deposits = loadData('deposits');
  const i = deposits.findIndex(d => d.id === id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  if (deposits[i].status !== 'PENDING') return res.status(400).json({ error: 'Already processed' });
  if (action === 'approve') {
    const user = findUser(deposits[i].uid);
    if (user) {
      const newBalance = (user.balance || 0) + deposits[i].amount;
      const newDeposit = (user.totalDeposit || 0) + deposits[i].amount;
      updateUser(user.uid, { balance: newBalance, totalDeposit: newDeposit });
      if (!user.totalDeposit || user.totalDeposit === 0) {
        const bonus = Math.floor(deposits[i].amount * 0.05);
        if (bonus > 0) updateUser(user.uid, { balance: newBalance + bonus });
      }
    }
    deposits[i].status = 'APPROVED';
  } else { deposits[i].status = 'REJECTED'; }
  saveData('deposits', deposits);
  res.json({ message: `Deposit ${action}d` });
});

app.get('/api/admin/withdrawals', (req, res) => {
  const status = req.query.status;
  let list = loadData('withdrawals');
  if (status) list = list.filter(w => w.status === status);
  res.json(list.sort((a, b) => new Date(b.date) - new Date(a.date)));
});

app.post('/api/admin/withdraw-action', (req, res) => {
  const { id, action } = req.body;
  const withdrawals = loadData('withdrawals');
  const i = withdrawals.findIndex(w => w.id === id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  if (withdrawals[i].status !== 'PROCESSING') return res.status(400).json({ error: 'Already processed' });
  if (action === 'approve') { withdrawals[i].status = 'SUCCESS'; }
  else {
    const user = findUser(withdrawals[i].uid);
    if (user) updateUser(user.uid, { balance: (user.balance || 0) + withdrawals[i].amount });
    withdrawals[i].status = 'REJECTED';
  }
  saveData('withdrawals', withdrawals);
  res.json({ message: `Withdrawal ${action}d` });
});

app.post('/api/admin/add-banner', (req, res) => {
  const { imageUrl, link, type } = req.body;
  if (!imageUrl) return res.status(400).json({ error: 'imageUrl required' });
  const banners = loadData('banners');
  const banner = { id: genId('bn_'), imageUrl, link: link || '', type: type || 'home', isActive: true };
  banners.push(banner);
  saveData('banners', banners);
  res.json({ message: 'Banner added', banner });
});

app.get('/api/admin/banners', (req, res) => res.json(loadData('banners')));

app.delete('/api/admin/banner/:id', (req, res) => {
  let banners = loadData('banners');
  banners = banners.filter(b => b.id !== req.params.id);
  saveData('banners', banners);
  res.json({ message: 'Deleted' });
});

app.post('/api/admin/create-giftcode', (req, res) => {
  const { code, amount, maxUses } = req.body;
  if (!code || !amount) return res.status(400).json({ error: 'code & amount required' });
  const giftCodes = loadData('giftCodes');
  const upper = code.toUpperCase();
  if (giftCodes.find(g => g.code === upper)) return res.status(400).json({ error: 'Code exists' });
  const gift = { code: upper, amount: parseFloat(amount), isActive: true, usedBy: [], maxUses: parseInt(maxUses) || 100, usedCount: 0 };
  giftCodes.push(gift);
  saveData('giftCodes', giftCodes);
  res.json({ message: 'Gift code created', gift });
});

app.get('/api/admin/giftcodes', (req, res) => res.json(loadData('giftCodes')));

app.get('/api/admin/milestone-claims', (req, res) => {
  const claims = loadData('milestoneClaims');
  const users = loadData('users');
  res.json(claims.map(c => ({ ...c, userPhone: users.find(u => u.uid === c.uid)?.phone || 'Unknown' })).sort((a, b) => new Date(b.claimedAt) - new Date(a.claimedAt)));
});

app.post('/api/admin/milestone-action', (req, res) => {
  const { id, action } = req.body;
  const claims = loadData('milestoneClaims');
  const i = claims.findIndex(c => c.id === id);
  if (i === -1) return res.status(404).json({ error: 'Not found' });
  claims[i].status = action === 'approve' ? 'DELIVERED' : 'REJECTED';
  claims[i].processedAt = new Date().toISOString();
  saveData('milestoneClaims', claims);
  res.json({ message: `Milestone ${action}d` });
});

app.post('/api/admin/declare-result', (req, res) => {
  const { period, gameMode, number } = req.body;
  const num = Number(number);
  if (!period || !gameMode || isNaN(num) || num < 0 || num > 9) return res.status(400).json({ error: 'Invalid' });
  const results = loadData('gameResults');
  if (results.find(r => r.period === period && r.gameMode === gameMode)) return res.status(400).json({ error: 'Already declared' });
  const color = num === 0 ? ['violet','red'] : num === 5 ? ['violet','green'] : [1,3,7,9].includes(num) ? ['green'] : ['red'];
  results.push({ period, gameMode, number: num, color, createdAt: new Date().toISOString() });
  saveData('gameResults', results);
  const bets = loadData('bets');
  const users = loadData('users');
  let settled = 0, totalPayout = 0;
  bets.forEach(bet => {
    if (bet.period !== period || bet.result !== 'pending') return;
    let mult = 0;
    const t = (bet.betType || '').toLowerCase();
    const v = bet.betValue !== null && bet.betValue !== undefined ? bet.betValue.toString().toLowerCase() : '';
    if (t === 'number') { if (parseInt(v) === num) mult = 9; }
    else if (t === 'color') { if (color.includes(v)) mult = v === 'violet' ? 4.5 : 2; }
    else if (t === 'big') { if (num >= 5) mult = 2; }
    else if (t === 'small') { if (num <= 4) mult = 2; }
    const pay = mult > 0 ? Math.floor(bet.amount * mult) : 0;
    bet.result = pay > 0 ? 'win' : 'lose';
    bet.payout = pay;
    if (pay > 0) {
      const ui = users.findIndex(u => u.uid === bet.uid);
      if (ui !== -1) { users[ui].balance = (users[ui].balance || 0) + pay; users[ui].totalWin = (users[ui].totalWin || 0) + pay; }
      totalPayout += pay;
    }
    settled++;
  });
  saveData('bets', bets); saveData('users', users);
  res.json({ message: `Result ${num} declared`, settledBets: settled, totalPayout });
});

app.get('/api/admin/bets', (req, res) => res.json(loadData('bets').sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 200)));

// ==================== START ====================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log('\n==========================================');
  console.log('  🎮 DARKWIN API v3.1');
  console.log('==========================================');
  console.log(`  🌐 Port: ${PORT}`);
  console.log('==========================================\n');
});
