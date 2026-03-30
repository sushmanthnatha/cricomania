# 🏏 Cricomania - Real-Time Cricket Auction App

A **real-time, multi-user cricket auction platform** built with React, Firebase, and Firestore. Perfect for IPL-style fantasy cricket tournaments.

## ✨ Features

- **Real-Time Multi-User Sync**: Changes appear instantly across all devices
- **Admin Controls**: Manage player auctions, set prices, assign teams
- **Team Dashboards**: Each team manager sees their squad and budget in real-time
- **Smart Budget Management**: Track spending, remaining budget, and role limits
- **Player Stats**: Built-in T20 career statistics for all players
- **Responsive Design**: Works on desktop, tablet, and mobile
- **Zero Backend**: Firebase handles all server/database operations
- **Free Hosting**: Deploy on Vercel with zero cost

## 🚀 Quick Start

### Local Development (2 minutes)

```bash
# Install dependencies
npm install

# Start dev server (port 3001)
npm start

# Open http://localhost:3001
```

### Deploy Free (15 minutes)

See comprehensive guides:
- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** — Set up Firebase project
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** — Deploy to production
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** — Complete overview

## 🏗️ Architecture

```
Frontend (React)       →  Vercel CDN
    ↓
State Management      →  Context API + useReducer
    ↓
Real-Time Sync        →  Firestore Listeners
    ↓
Backend/Database      →  Firebase Firestore
    ↓ + Fallback
Local Storage         →  Offline support
```

**Tech Stack**:
- Frontend: React 19, Context API, CSS-in-JS
- Backend: Firebase (no server code)
- Database: Firestore (NoSQL)
- Hosting: Vercel Global CDN
- Auth: Firebase Anonymous Auth

## 💰 Pricing (All FREE)

| Component | Cost | Why |
|-----------|------|-----|
| **React App** | $0 | Vercel free tier |
| **Firestore DB** | $0 | 50K reads/day free |
| **Hosting** | $0 | Vercel free tier |
| **Domain** | $0 | .vercel.app subdomain |
| **SSL/HTTPS** | $0 | Automatic |
| **Monthly Bill** | **$0** | Forever free for small tournaments |

## 📋 Project Structure

```
cricomania/
├── src/
│   ├── firebase.js           ← Firebase config & helpers
│   ├── App.js                ← Main app (26+ players, team management)
│   ├── index.js
│   └── index.css
├── public/
│   └── players/              ← Player photos (optional)
├── .env.example              ← Firebase credentials template
├── .env.local                ← Your actual secrets (git-ignored)
├── FIREBASE_SETUP.md         ← Firebase setup guide
├── VERCEL_DEPLOYMENT.md      ← Deployment guide
├── DEPLOYMENT_SUMMARY.md     ← Complete walkthrough
├── package.json
└── README.md                 ← This file
```

## 🔧 Available Scripts

```bash
# Start development server (port 3001)
npm start

# Build for production
npm run build

# Run tests
npm test

# Watch mode with auto-restart
npm run dev
```

## 🎮 How to Use

### Admin Role
1. Login with username: `admin`, password: `admin123`
2. Go to **"Live Bidding"** page
3. Select a player
4. Set winning bid amount
5. Click **"Sold"** button
6. All teams see the update instantly

### Team Manager Role
1. Login with your team credentials:
   - **MUMBAI INDIANS**: `mi_mgr` / `mi2024`
   - **CHENNAI SUPER KINGS**: `csk_mgr` / `csk2024`
   - **ROYAL CHALLENGERS**: `rcb_mgr` / `rcb2024`
2. View **"My Squad"** with your purchased players
3. See real-time budget updates
4. Check team slot limits (batsmen, bowlers, etc.)

## 📊 App Pages

| Page | Role | Purpose |
|------|------|---------|
| **Auction** | Admin | Browse all players, manage inventory |
| **Live Bidding** | Admin + Teams | Real-time auction interface |
| **My Squad** | Team Mgr | View purchased players, budget |
| **Teams Overview** | All | See all teams, budgets, player counts |
| **History** | Admin | Audit log of all transactions |

## 🔒 Security Features

- ✅ Anonymous authentication
- ✅ Firestore rules prevent unauthorized writes
- ✅ Read-only auction data for spectators
- ✅ Team-specific data access
- ✅ No sensitive data stored in frontend

## 🐛 Troubleshooting

### "Blank white page"
→ Check browser console (F12) for Firebase errors  
→ Verify `.env.local` is in project root  
→ Make sure all 6 Firebase values are set

### "Real-time updates not working"
→ Check Firestore Rules are published (not just saved)  
→ Verify browser is signed in (console should not show auth errors)  
→ Hard refresh: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)

### "Players not loading"
→ Check Firestore `/auction/current` document exists  
→ Verify Firestore Rules allow reads  
→ Check network tab in browser dev tools

See **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md#-troubleshooting)** for more help.

## 📱 Deployment

### Production URL
Once deployed to Vercel, share:
```
https://cricomania-xxxxx.vercel.app
```

Everyone with the link can:
- Access from any device
- See real-time updates
- Login with provided credentials
- No installation needed

### Auto-Updates
Every push to GitHub auto-deploys:
```bash
git push origin main  →  Vercel builds & deploys (3 min)
```

## 🎯 Next Steps

1. **Local Testing**
   ```bash
   npm start
   # Open 2 tabs, test real-time sync
   ```

2. **Setup Firebase**  
   Follow [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

3. **Deploy to Vercel**  
   Follow [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)

4. **Share URL**  
   Send link to all participants

5. **Run Your Auction!** 🏆

## 📚 Documentation

- **[FIREBASE_SETUP.md](./FIREBASE_SETUP.md)** — Complete Firebase setup
- **[VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)** — Deployment guide
- **[DEPLOYMENT_SUMMARY.md](./DEPLOYMENT_SUMMARY.md)** — Full overview & troubleshooting

## 💡 Tips & Tricks

### Tip 1: Test Multi-User Locally
```bash
# Terminal 1
npm start  # http://localhost:3001

# Terminal 2 (same port, different browser)
open http://localhost:3001

# Open browser DevTools (F12) in both → Login as different users
# Changes in one appear instantly in other ✅
```

### Tip 2: Monitor Firestore Writes
1. Firebase Console → Firestore
2. Click `auction/current` document
3. Watch data update as you sell players

### Tip 3: Team Customization
Edit `TEAMS_INIT` in `src/App.js` to add your teams:
```javascript
const TEAMS_INIT = {
  "YOUR TEAM NAME": { budget: 100000000, spent: 0, color: "#FF5733" },
  // ... more teams
};
```

## 🤝 Contributing

Want to improve Cricomania?
- Add more players
- Improve design
- Add auction timer
- Create spectator mode
- Export results as CSV/PDF

## 📝 License

MIT - Feel free to use, modify, and deploy!

## 🙏 Credits

Built with:
- ❤️ React (UI)
- 🔥 Firebase (Backend)
- 📊 Firestore (Database)
- 🚀 Vercel (Hosting)

---

**Ready to launch your cricket auction?** Start with [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) 🚀
