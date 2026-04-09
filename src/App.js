
// ============================================================
//  CRICOMANIA AUCTION — React + Context API + useReducer + Firebase
//  Enhanced: slot limits, admin player management, photo support, real-time sync
// ============================================================
import { createContext, useContext, useReducer, useState, useEffect, useCallback, useRef } from "react";
import { 
  initializeAuctionData, 
  subscribeToAuction, 
  updateAuctionData,
  syncConfigToFirebase,
  signInUser 
} from "./firebase";

/* ─── GOOGLE FONTS ─────────────────────────────────────────── */
const FontLoader = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');`}</style>
);

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const BUDGET = 7000_00_000; // 70 Crores

// ── TEAM SLOT LIMITS ──────────────────────────────────────────
const SLOT_LIMITS = { BAT: 2, BWL: 2, WK: 1, AR: 1, LEG: 1 };
const SLOT_LABELS = { BAT: "Batsmen", BWL: "Bowlers", WK: "Wicket-keeper", AR: "All-Rounders", LEG: "Legends" };
const TOTAL_SQUAD = Object.values(SLOT_LIMITS).reduce((a, b) => a + b, 0); // 8

const USERS = {
  admin:     { pass: "admin10042026",    role: "admin", team: null,                          label: "ADMIN" },
  csk_mgr:   { pass: "k7m2x9",       role: "team",  team: "CHENNAI SUPER KINGS",       label: "CHENNAI SUPER KINGS" },
  dc_mgr:    { pass: "p4b8w1",       role: "team",  team: "DELHI CAPITALS",            label: "DELHI CAPITALS" },
  kkr_mgr:   { pass: "j5n3t6",       role: "team",  team: "KOLKATA KNIGHT RIDERS",    label: "KOLKATA KNIGHT RIDERS" },
  mi_mgr:    { pass: "h6r1q8",       role: "team",  team: "MUMBAI INDIANS",             label: "MUMBAI INDIANS" },
  pbks_mgr:  { pass: "v2s9d4",       role: "team",  team: "PUNJAB KINGS",             label: "PUNJAB KINGS" },
  rr_mgr:    { pass: "f8k3z7",       role: "team",  team: "RAJASTHAN ROYALS",         label: "RAJASTHAN ROYALS" },
  rcb_mgr:   { pass: "c5y4x1",       role: "team",  team: "ROYAL CHALLENGERS BENGALURU", label: "ROYAL CHALLENGERS BENGALURU" },
  srh_mgr:   { pass: "m7a2b6",       role: "team",  team: "SUNRISERS HYDERABAD",      label: "SUNRISERS HYDERABAD" },
  bidder:    { pass: "bidder10042026",       role: "user",  team: null,                          label: "BIDDER / VIEWER" },
};

const TEAMS_INIT = {
  "CHENNAI SUPER KINGS":         { budget: BUDGET, spent: 0, color: "#ffc32f" },
  "DELHI CAPITALS":              { budget: BUDGET, spent: 0, color: "#00d4ff" },
  "KOLKATA KNIGHT RIDERS":       { budget: BUDGET, spent: 0, color: "#d946ef" },
  "MUMBAI INDIANS":              { budget: BUDGET, spent: 0, color: "#004687" },
  "PUNJAB KINGS":                { budget: BUDGET, spent: 0, color: "#c41e3a" },
  "RAJASTHAN ROYALS":            { budget: BUDGET, spent: 0, color: "#ec407a" },
  "ROYAL CHALLENGERS BENGALURU": { budget: BUDGET, spent: 0, color: "#ec1c24" },
  "SUNRISERS HYDERABAD":         { budget: BUDGET, spent: 0, color: "#ff7f00" },
};

const ROLES = { BAT: "Batsman", BWL: "Bowler", WK: "Wicketkeeper", AR: "All-Rounder", LEG: "Legend" };
const ROLE_COLORS = { BAT: "#60a5fa", BWL: "#fb7185", WK: "#0891b2", AR: "#fbbf24", LEG: "#a855f7" };

// Country flag emojis
const COUNTRY_FLAGS = {
  "India": "🇮🇳",
  "Australia": "🇦🇺",
  "Pakistan": "🇵🇰",
  "S. Africa": "🇿🇦",
  "New Zealand": "🇳🇿",
  "Afghanistan": "🇦🇫",
  "England": "🇬🇧",
  "Bangladesh": "🇧🇩",
  "West Indies": "🇼🇮",
};

// Player photo map — Local images from public/players/ folder
// IMPORTANT: Only add entries for images that actually exist in public/players/
// Add new images to public/players/ folder and they'll auto-display
const PLAYER_PHOTOS = {
  // Batsmen
  "Ruturaj Gaikwad":     "/players/ruturaj_gaikwad.avif",
  "Yashasvi Jaiswal":    "/players/yashasvi_jaiswal.avif",
  "Abhishek Sharma":     "/players/abhishek_sharma.avif",
  "Shreyas Iyer":        "/players/shreyas_iyer.avif",
  "Phil Salt":           "/players/phil_salt.avif",
  "Suryakumar Yadav":    "/players/suryakumar_yadav.avif",
  "Shubman Gill":        "/players/shubman_gill.avif",
  "Ellyse Perry":        "/players/ellyse_perry.webp",
  "Smriti Mandhana":     "/players/smriti_mandhana.avif",
  "David Miller":        "/players/david_miller.avif",
  "Virat Kohli":         "/players/virat_kohli.avif",
  "Travis Head":         "/players/travis_head.avif",
  "Harmanpreet Kaur":    "/players/harmanpreet_kaur.webp",
  "David Warner":        "/players/david_warner.avif",
  "Rohit Sharma":        "/players/rohit_sharma.png",
  "Rinku Singh":         "/players/rinku_singh.avif",
  "Faf Du Plessis":      "/players/faf_du_plessis.avif",
  "Tilak Varma":         "/players/tilak_verma.avif",
  // Bowlers
  "Kagiso Rabada":       "/players/kagiso_rabada.avif",
  "Sarah Glenn":         "/players/sarah_glenn.jpeg",
  "Mohammed Shami":      "/players/mohammed _shami.avif",
  "Kuldeep Yadav":       "/players/kuldeep_yadav.avif",
  "Bhuvneshwar Kumar":   "/players/bhuvneshwar_kumar.avif",
  "Yuzvendra Chahal":    "/players/yuzvendra_chahal.avif",
  "Josh Hazlewood":      "/players/josh_hazlewood.avif",
  "Trent Boult":         "/players/trent_boult.avif",
  "Rashid Khan":         "/players/rashid_khan.avif",
  "Sophie Ecclestone":   "/players/sophie_ecclestone.webp",
  "Mitchell Starc":      "/players/mitchell_starc.avif",
  "Mohammad Siraj":      "/players/mohammad_siraj.avif",
  "Lasith Malinga":      "/players/lasith_malinga.avif",
  "Jofra Archer":        "/players/jofra_archer.avif",
  "Sunil Narine":        "/players/sunil_narine.avif",
  "Pat Cummins":         "/players/pat_cummins.avif",
  "Varun Chakravarthy":  "/players/varun_chakravarthy.webp",
  "Jasprit Bumrah":      "/players/jasprit_bumrah .avif",
  // Wicket-keepers
  "Quinton de Kock":     "/players/quinton_de_kock.avif",
  "Sanju Samson":        "/players/sanju_samson.avif",
  "MS Dhoni":            "/players/ms_dhoni.avif",
  "KL Rahul":            "/players/kl_rahul.avif",
  "Jos Buttler":         "/players/jos_buttler.avif",
  "Rishabh Pant":        "/players/rishabh_pant.avif",
  // All-rounders
  "Glenn Maxwell":       "/players/glenn_maxwell.avif",
  "Andre Russell":       "/players/andre_russell.avif",
  "Ravindra Jadeja":     "/players/ravindra_jadeja.avif",
  "Hardik Pandya":       "/players/hardik_pandya.avif",
  // Legends
  "Ricky Ponting":       "/players/ricky_ponting.png",
  "Sachin Tendulkar":    "/players/sachin_tendulkar.png",
  "Chris Gayle":         "/players/chris_gayle.avif",
  "AB de Villiers":      "/players/ab_de_villiers.avif",
};

// CONFIG VERSION — increment this when PLAYER_PHOTOS or data structure changes
// When version changes, old localStorage data is automatically cleared
const CONFIG_VERSION = "v3.0"; // Updated: Redesigned Budget Management with card-based UI showing all teams

const PLAYERS_INIT = [
  // Batsmen (18 players) — base 1 Crore each
  { id:1,  name:"Ruturaj Gaikwad",    role:"BAT", country:"India",           base:100_00_000, t20Rating: 600 },
  { id:2,  name:"Yashasvi Jaiswal",   role:"BAT", country:"India",           base:100_00_000, t20Rating: 769 },
  { id:3,  name:"Abhishek Sharma",    role:"BAT", country:"India",           base:100_00_000, t20Rating: 890 },
  { id:4,  name:"Shreyas Iyer",       role:"BAT", country:"India",           base:100_00_000, t20Rating: 789 },
  { id:5,  name:"Phil Salt",          role:"BAT", country:"England",         base:100_00_000, t20Rating: 702 },
  { id:6,  name:"Suryakumar Yadav",   role:"BAT", country:"India",           base:100_00_000, t20Rating: 870 },
  { id:7,  name:"Shubman Gill",       role:"BAT", country:"India",           base:100_00_000, t20Rating: 673 },
  { id:8,  name:"Ellyse Perry",       role:"BAT", country:"Australia",       base:100_00_000, t20Rating: 890 },
  { id:9,  name:"Smriti Mandhana",    role:"BAT", country:"India",           base:100_00_000, t20Rating: 741 },
  { id:10, name:"David Miller",       role:"BAT", country:"South Africa",    base:100_00_000, t20Rating: 779 },
  { id:11, name:"Virat Kohli",        role:"BAT", country:"India",           base:100_00_000, t20Rating: 900 },
  { id:12, name:"Travis Head",        role:"BAT", country:"Australia",       base:100_00_000, t20Rating: 847 },
  { id:13, name:"Harmanpreet Kaur",   role:"BAT", country:"India",           base:100_00_000, t20Rating: 710 },
  { id:14, name:"David Warner",       role:"BAT", country:"Australia",       base:100_00_000, t20Rating: 826 },
  { id:15, name:"Rohit Sharma",       role:"BAT", country:"India",           base:100_00_000, t20Rating: 878 },
  { id:16, name:"Rinku Singh",        role:"BAT", country:"India",           base:100_00_000, t20Rating: 446 },
  { id:17, name:"Faf Du Plessis",     role:"BAT", country:"South Africa",    base:100_00_000, t20Rating: 843 },
  { id:18, name:"Tilak Varma",        role:"BAT", country:"India",           base:100_00_000, t20Rating: 709 },
  // Bowlers (18 players) — base 1 Crore each
  { id:19, name:"Kagiso Rabada",      role:"BWL", country:"South Africa",    base:100_00_000, t20Rating: 795 },
  { id:20, name:"Sarah Glenn",        role:"BWL", country:"England",         base:100_00_000, t20Rating: 661 },
  { id:21, name:"Mohammed Shami",     role:"BWL", country:"India",           base:100_00_000, t20Rating: 724 },
  { id:22, name:"Kuldeep Yadav",      role:"BWL", country:"India",           base:100_00_000, t20Rating: 678 },
  { id:23, name:"Bhuvneshwar Kumar",  role:"BWL", country:"India",           base:100_00_000, t20Rating: 782 },
  { id:24, name:"Yuzvendra Chahal",   role:"BWL", country:"India",           base:100_00_000, t20Rating: 706 },
  { id:25, name:"Josh Hazlewood",     role:"BWL", country:"Australia",       base:100_00_000, t20Rating: 764 },
  { id:26, name:"Trent Boult",        role:"BWL", country:"New Zealand",     base:100_00_000, t20Rating: 653 },
  { id:27, name:"Rashid Khan",        role:"BWL", country:"Afghanistan",     base:100_00_000, t20Rating: 816 },
  { id:28, name:"Sophie Ecclestone",  role:"BWL", country:"England",         base:100_00_000, t20Rating: 851 },
  { id:29, name:"Mitchell Starc",     role:"BWL", country:"Australia",       base:100_00_000, t20Rating: 702 },
  { id:30, name:"Mohammad Siraj",     role:"BWL", country:"India",           base:100_00_000, t20Rating: 614 },
  { id:31, name:"Lasith Malinga",     role:"BWL", country:"Sri Lanka",       base:100_00_000, t20Rating: 880 },
  { id:32, name:"Jofra Archer",       role:"BWL", country:"England",         base:100_00_000, t20Rating: 870 },
  { id:33, name:"Sunil Narine",       role:"BWL", country:"West Indies",     base:100_00_000, t20Rating: 820 },
  { id:34, name:"Pat Cummins",        role:"BWL", country:"Australia",       base:100_00_000, t20Rating: 790 },
  { id:35, name:"Varun Chakravarthy", role:"BWL", country:"India",           base:100_00_000, t20Rating: 800 },
  { id:36, name:"Jasprit Bumrah",     role:"BWL", country:"India",           base:100_00_000, t20Rating: 900 },
  // Wicket-keepers (6 players) — base 75 Lakhs (0.75 Crore) each
  { id:37, name:"Quinton de Kock",    role:"WK",  country:"South Africa",    base:75_00_000, t20Rating: 771 },
  { id:38, name:"Sanju Samson",       role:"WK",  country:"India",           base:75_00_000, t20Rating: 743 },
  { id:39, name:"MS Dhoni",           role:"WK",  country:"India",           base:75_00_000, t20Rating: 825 },
  { id:40, name:"KL Rahul",           role:"WK",  country:"India",           base:75_00_000, t20Rating: 715 },
  { id:41, name:"Jos Buttler",        role:"WK",  country:"England",         base:75_00_000, t20Rating: 734 },
  { id:42, name:"Rishabh Pant",       role:"WK",  country:"India",           base:75_00_000, t20Rating: 569 },
  // All-rounders (4 players) — base 75 Lakhs (0.75 Crore) each
  { id:43, name:"Glenn Maxwell",      role:"AR",  country:"Australia",       base:75_00_000, t20Rating: 836 },
  { id:44, name:"Andre Russell",      role:"AR",  country:"West Indies",     base:75_00_000, t20Rating: 897 },
  { id:47, name:"Ravindra Jadeja",    role:"AR",  country:"India",           base:75_00_000, t20Rating: 751 },
  { id:48, name:"Hardik Pandya",      role:"AR",  country:"India",           base:75_00_000, t20Rating: 817 },
  // Legends (4 players) — base 75 Lakhs (0.75 Crore) each
  { id:49, name:"Ricky Ponting",      role:"LEG", country:"Australia",       base:75_00_000, t20Rating: 900 },
  { id:50, name:"Sachin Tendulkar",   role:"LEG", country:"India",           base:75_00_000, t20Rating: 920 },
  { id:51, name:"Chris Gayle",        role:"LEG", country:"West Indies",     base:75_00_000, t20Rating: 870 },
  { id:52, name:"AB de Villiers",     role:"LEG", country:"South Africa",    base:75_00_000, t20Rating: 900 },
].map(p => ({ ...p, soldTo: null, soldPrice: null, photoUrl: PLAYER_PHOTOS[p.name] || null }));
console.log(PLAYERS_INIT);
// Currency formatting: >= 1 Crore shown as Crores, < 1 Crore shown as Lakhs
// 1 Crore = 100 Lakhs = 10,000,000
// 1 Lakh = 100,000
const fmtCur = n => {
  if (n == null || isNaN(n)) return "₹0";
  if (n >= 1_00_00_000) return "₹" + (n / 1_00_00_000).toFixed(2) + " Cr";  // >= 1 Crore (10 million)
  if (n >= 1_00_000) return "₹" + (n / 1_00_000).toFixed(2) + " L";        // Lakhs (100k)
  if (n >= 1_000)    return "₹" + (n / 1_000).toFixed(0) + "K";
  return "₹" + n;
};
// Parse lakh input: accepts "1.5" → 1.5 L = 1,50,000
const parseLakh = v => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n * 1_00_000);
};

// Parse amount: supports crores (C) and lakhs (L)
// Examples: "5" → 5,00,00,000 (5 Crores) | "25L" → 25,00,000 | "2C" → 2,00,00,000
const parseAmount = v => {
  const input = (v || "").trim().toUpperCase();
  if (!input) return 0;
  
  let num, multiplier;
  if (input.endsWith("C")) {
    num = parseFloat(input.slice(0, -1));
    multiplier = 1_00_00_000; // 1 Crore
  } else if (input.endsWith("L")) {
    num = parseFloat(input.slice(0, -1));
    multiplier = 1_00_000; // 1 Lakh
  } else {
    // Default to crores if no suffix
    num = parseFloat(input);
    multiplier = 1_00_00_000;
  }
  
  return isNaN(num) ? 0 : Math.round(num * multiplier);
};

const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ─── SLOT HELPERS ──────────────────────────────────────────── */
function getTeamSlots(players, teamName) {
  const tp = players.filter(p => p.soldTo === teamName);
  const counts = { BAT: 0, BWL: 0, WK: 0, AR: 0, LEG: 0 };
  tp.forEach(p => { counts[p.role] = (counts[p.role] || 0) + 1; });
  return counts;
}

function canAssignRole(players, teamName, role) {
  const counts = getTeamSlots(players, teamName);
  return counts[role] < SLOT_LIMITS[role];
}

/* ─── T20 RATING HELPERS ────────────────────────────────────── */
function getTeamT20Rating(players, teamName) {
  return players
    .filter(p => p.soldTo === teamName)
    .reduce((sum, p) => sum + (p.t20Rating || 0), 0);
}

/* ─── REDUCER ───────────────────────────────────────────────── */

// Helper: Clear localStorage if version changed, but preserve user login and theme
const checkAndClearOldCache = () => {
  const storedVersion = localStorage.getItem("cm_config_version");
  if (storedVersion !== CONFIG_VERSION) {
    console.log(`📦 Clearing old cache (version mismatch: ${storedVersion} → ${CONFIG_VERSION})`);
    // Preserve user login and theme preferences across config updates
    const savedUser = localStorage.getItem("cm_currentUser");
    const savedTheme = localStorage.getItem("cm_theme");
    localStorage.clear();
    // Restore preserved items
    if (savedUser) localStorage.setItem("cm_currentUser", savedUser);
    if (savedTheme) localStorage.setItem("cm_theme", savedTheme);
    localStorage.setItem("cm_config_version", CONFIG_VERSION);
  }
};

checkAndClearOldCache();

const initialState = {
  currentUser: JSON.parse(localStorage.getItem("cm_currentUser") || "null"),
  players: (() => {
    const cached = JSON.parse(localStorage.getItem("cm_players") || "null");
    if (cached) {
      // Always refresh photoUrl from current PLAYER_PHOTOS mapping
      return cached.map(p => ({ ...p, photoUrl: PLAYER_PHOTOS[p.name] || null }));
    }
    return PLAYERS_INIT;
  })(),
  teams:   JSON.parse(localStorage.getItem("cm_teams")   || "null") || JSON.parse(JSON.stringify(TEAMS_INIT)),
  teamCredentials: JSON.parse(localStorage.getItem("cm_teamCreds") || "{}"),
  history: JSON.parse(localStorage.getItem("cm_history") || "[]"),
  livePlayerId: JSON.parse(localStorage.getItem("cm_livePlayer") || "null"),
  page: "auction",
  filterRole: "ALL",
  searchQ: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN": {
      localStorage.setItem("cm_currentUser", JSON.stringify(action.payload));
      return { ...state, currentUser: action.payload, page: "auction" };
    }
    case "LOGOUT": {
      localStorage.removeItem("cm_currentUser");
      return { ...state, currentUser: null, page: "auction" };
    }
    case "SET_PAGE":   return { ...state, page: action.payload };
    case "SET_FILTER_ROLE": return { ...state, filterRole: action.payload };
    case "SET_SEARCH":      return { ...state, searchQ: action.payload };
    case "SET_LIVE_PLAYER": return { ...state, livePlayerId: action.payload };
    case "CLEAR_LIVE_PLAYER": return { ...state, livePlayerId: null };

    case "ASSIGN_PLAYER": {
      const { id, team, price } = action.payload;
      const players = state.players.map(p =>
        p.id === id ? { ...p, soldTo: team, soldPrice: price } : p
      );
      const teams = {
        ...state.teams,
        [team]: { ...state.teams[team], spent: state.teams[team].spent + price },
      };
      const player = state.players.find(p => p.id === id);
      const history = [
        { id: Date.now(), playerId: id, playerName: player.name, team, price, action: "SOLD", ts: Date.now() },
        ...state.history,
      ];
      return { ...state, players, teams, history };
    }

    case "UNASSIGN_PLAYER": {
      const { id } = action.payload;
      const p = state.players.find(x => x.id === id);
      if (!p?.soldTo) return state;
      const players = state.players.map(x =>
        x.id === id ? { ...x, soldTo: null, soldPrice: null } : x
      );
      const teams = {
        ...state.teams,
        [p.soldTo]: { ...state.teams[p.soldTo], spent: state.teams[p.soldTo].spent - p.soldPrice },
      };
      const history = [
        { id: Date.now(), playerId: id, playerName: p.name, team: p.soldTo, price: p.soldPrice, action: "RETURNED", ts: Date.now() },
        ...state.history,
      ];
      return { ...state, players, teams, history };
    }

    case "ADD_PLAYER": {
      const newPlayer = action.payload;
      const players = [...state.players, { ...newPlayer, soldTo: null, soldPrice: null }];
      return { ...state, players };
    }

    case "DELETE_PLAYER": {
      const { id } = action.payload;
      const p = state.players.find(x => x.id === id);
      let teams = state.teams;
      if (p?.soldTo) {
        teams = {
          ...state.teams,
          [p.soldTo]: { ...state.teams[p.soldTo], spent: state.teams[p.soldTo].spent - p.soldPrice },
        };
      }
      const players = state.players.filter(x => x.id !== id);
      return { ...state, players, teams };
    }

    case "EDIT_PLAYER": {
      const { id, updates } = action.payload;
      const players = state.players.map(x => x.id === id ? { ...x, ...updates } : x);
      return { ...state, players };
    }

    case "ADD_TEAM": {
      const { name, color } = action.payload;
      const teams = { ...state.teams, [name]: { budget: BUDGET, spent: 0, color } };
      return { ...state, teams };
    }

    case "EDIT_TEAM": {
      const { oldName, newName, color } = action.payload;
      if (oldName === newName) {
        // Only color changed
        const teams = { ...state.teams, [oldName]: { ...state.teams[oldName], color } };
        return { ...state, teams };
      } else {
        // Name changed - need to update team and all player assignments
        const oldTeam = state.teams[oldName];
        const teams = { ...state.teams };
        delete teams[oldName];
        teams[newName] = { ...oldTeam, color };
        
        const players = state.players.map(p =>
          p.soldTo === oldName ? { ...p, soldTo: newName } : p
        );
        return { ...state, teams, players };
      }
    }

    case "DELETE_TEAM": {
      const { teamName } = action.payload;
      const teams = { ...state.teams };
      delete teams[teamName];
      
      // Remove team credentials
      const teamCreds = { ...state.teamCredentials };
      delete teamCreds[teamName];
      
      // Unassign any players from this team
      const players = state.players.map(p =>
        p.soldTo === teamName ? { ...p, soldTo: null } : p
      );

      console.log(`🗑️ DELETING TEAM: "${teamName}"`);
      console.log("Teams after deletion:", teams);
      console.log("TeamCreds after deletion:", teamCreds);
      
      return { ...state, teams, teamCredentials: teamCreds, players };
    }

    case "SET_STATE": {
      return { ...state, ...action.payload };
    }

    case "ADD_TEAM_FUNDS": {
      const { teamName, amount } = action.payload;
      const teams = {
        ...state.teams,
        [teamName]: { ...state.teams[teamName], budget: state.teams[teamName].budget + amount }
      };
      const history = [
        { id: Date.now(), playerName: `Budget +${fmtCur(amount)}`, team: teamName, price: amount, action: "BUDGET_ADD", ts: Date.now() },
        ...state.history,
      ];
      return { ...state, teams, history };
    }

    case "SET_BUDGET": {
      const { teamName, budget } = action.payload;
      const teams = {
        ...state.teams,
        [teamName]: { ...state.teams[teamName], budget }
      };
      const history = [
        { id: Date.now(), playerName: `Budget Set to ${fmtCur(budget)}`, team: teamName, price: budget, action: "BUDGET_SET", ts: Date.now() },
        ...state.history,
      ];
      return { ...state, teams, history };
    }

    case "RESET_AUCTION": {
      // Option 1: Reset auction for next game (keep team structure, clear assignments)
      // Used to play another game without changing teams/players config
      const players = state.players.map(p => ({ ...p, soldTo: null, soldPrice: null }));
      const teams = Object.fromEntries(
        Object.entries(state.teams).map(([k, v]) => [k, { ...v, spent: 0 }])
      );
      return { ...state, players, teams, history: [], livePlayerId: null };
    }

    case "SYNC_CONFIG_TO_FIREBASE": {
      // Option 2: Sync fresh config to Firebase (nuclear reset matching TEAMS_INIT & PLAYERS_INIT)
      // Used when config changes and you want Firebase to match local constants
      const players = JSON.parse(JSON.stringify(PLAYERS_INIT));
      const teams = JSON.parse(JSON.stringify(TEAMS_INIT));
      const teamCreds = {};
      // Clear localStorage
      localStorage.removeItem("cm_players");
      localStorage.removeItem("cm_teams");
      localStorage.removeItem("cm_teamCreds");
      localStorage.removeItem("cm_history");
      localStorage.removeItem("cm_livePlayer");
      return {
        ...state,
        players,
        teams,
        teamCredentials: teamCreds,
        history: [],
        livePlayerId: null,
      };
    }

    default:
      return state;
  }
}

/* ─── THEME CONTEXT ─────────────────────────────────────────── */
const ThemeContext = createContext("dark");
const useTheme = () => useContext(ThemeContext);

function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem("cm_theme") || "dark";
  });

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("cm_theme", newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

/* ─── CONTEXT ───────────────────────────────────────────────── */
const AuctionContext = createContext(null);
const useAuction = () => useContext(AuctionContext);

function AuctionProvider({ children }) {
  const [state, dispatchBase] = useReducer(reducer, initialState);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const isRemoteUpdateRef = useRef(false); // Track if update came from Firestore (using ref to avoid infinite loops)
  const isSyncConfigRef = useRef(false); // Track if SYNC_CONFIG_TO_FIREBASE is in progress

  // Wrapper around dispatch to detect SYNC_CONFIG_TO_FIREBASE
  const dispatch = useCallback((action) => {
    if (action.type === "SYNC_CONFIG_TO_FIREBASE") {
      isSyncConfigRef.current = true;
    }
    dispatchBase(action);
  }, []);

  // Initialize Firebase and sign in user
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    const initFirebase = async () => {
      try {
        // Initialize Firebase auth (anonymous)
        await signInUser();
        
        // Initialize Firestore with starting data
        await initializeAuctionData(PLAYERS_INIT, TEAMS_INIT);
        
        // Subscribe to real-time updates from Firestore
        const unsubscribe = subscribeToAuction((firebaseData) => {
          // Update local state when Firestore changes
          console.log("📨 Received Firestore data in callback:", firebaseData);
          if (firebaseData) {
            isRemoteUpdateRef.current = true; // Mark this as a remote update
            // Only use the data that Firebase actually sent (don't fall back to captured state)
            const payload = {};
            if (firebaseData.players !== undefined) {
              // Always refresh photoUrl from current PLAYER_PHOTOS mapping when syncing from Firebase
              payload.players = firebaseData.players.map(p => ({ ...p, photoUrl: PLAYER_PHOTOS[p.name] || null }));
            }
            if (firebaseData.teams !== undefined) payload.teams = firebaseData.teams;
            if (firebaseData.teamCredentials !== undefined) payload.teamCredentials = firebaseData.teamCredentials;
            if (firebaseData.history !== undefined) payload.history = firebaseData.history;
            if (firebaseData.livePlayerId !== undefined) payload.livePlayerId = firebaseData.livePlayerId;
            
            dispatch({ type: "SET_STATE", payload });
            console.log("✅ Dispatched SET_STATE with Firebase data:", payload);
          }
        });
        
        setIsFirebaseReady(true);
        
        // Cleanup subscription on unmount
        return () => unsubscribe?.();
      } catch (error) {
        console.error("Firebase initialization failed:", error);
        console.log("Falling back to localStorage only");
        setIsFirebaseReady(true); // Continue with localStorage fallback
      }
    };

    initFirebase();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Sync to Firebase (primary source of truth) — localStorage is emergency fallback only
  useEffect(() => {
    // Only sync to Firestore if this is a LOCAL change (not from remote listener)
    if (isFirebaseReady && !isRemoteUpdateRef.current) {
      // Check if this is a config sync scenario (fresh 8 teams, 50 players, empty history)
      const isConfigSync = Object.keys(state.teams).length === 8 && 
                           state.players.length === 50 && 
                           state.history.length === 0 &&
                           isSyncConfigRef.current;

      const syncFn = isConfigSync ? syncConfigToFirebase : updateAuctionData;
      
      syncFn({
        players: state.players,
        teams: state.teams,
        teamCredentials: state.teamCredentials,
        history: state.history,
        livePlayerId: state.livePlayerId,
      }).catch(error => {
        console.error("❌ Firebase sync failed:", error);
        // Continue working even if Firebase sync fails
      });
      
      // Clear the sync config flag after syncing
      if (isConfigSync) {
        isSyncConfigRef.current = false;
      }
    } else if (isRemoteUpdateRef.current) {
      // Reset the flag immediately for next change (doesn't trigger another effect run since it's a ref)
      isRemoteUpdateRef.current = false;
    }
  }, [state.players, state.teams, state.teamCredentials, state.history, state.livePlayerId, isFirebaseReady]);

  return (
    <AuctionContext.Provider value={{ state, dispatch }}>
      {!isFirebaseReady ? (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--muted)" }}>
          <div style={{ marginBottom: 20, fontSize: 18 }}>🔄 Initializing Cricomania...</div>
          <div style={{ fontSize: 14 }}>Connecting to Firebase</div>
        </div>
      ) : (
        children
      )}
    </AuctionContext.Provider>
  );
}

/* ─── TOAST ─────────────────────────────────────────────────── */
const ToastContext = createContext(null);
function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);
  const add = useCallback((msg, err = false) => {
    const id = Date.now();
    setToasts(t => [...t, { id, msg, err }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 2800);
  }, []);
  return (
    <ToastContext.Provider value={add}>
      {children}
      <div style={{ position: "fixed", top: 64, right: 16, zIndex: 9999, display: "flex", flexDirection: "column", gap: 8 }}>
        {toasts.map(t => (
          <div key={t.id} style={{
            background: "var(--surface)", border: `1px solid ${t.err ? "var(--red)" : "var(--green)"}`,
            borderLeft: `3px solid ${t.err ? "var(--red)" : "var(--green)"}`,
            color: "var(--text)", fontFamily: "Rajdhani, sans-serif", fontSize: 14,
            letterSpacing: 0.5, padding: "10px 18px",
            animation: "slideIn .25s ease",
            boxShadow: "0 4px 20px rgba(0,0,0,.4)",
          }}>{t.msg}</div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
const useToast = () => useContext(ToastContext);

/* ─── PLAYER AVATAR ─────────────────────────────────────────── */
function PlayerAvatar({ name, size = 56, role, photoUrl }) {
  const [err, setErr] = useState(false);
  const src = photoUrl || PLAYER_PHOTOS[name];
  const initials = name.split(" ").map(w => w[0]).join("").slice(0, 2).toUpperCase();
  const bg = ROLE_COLORS[role] + "33";
  const col = ROLE_COLORS[role];

  if (!src || err) {
    return (
      <div style={{
        width: size, height: size, borderRadius: "50%",
        background: bg, border: `2px solid ${col}44`,
        display: "flex", alignItems: "center", justifyContent: "center",
        fontFamily: "Oswald, sans-serif", fontWeight: 700,
        fontSize: size * 0.32, color: col, flexShrink: 0,
      }}>{initials}</div>
    );
  }
  return (
    <img
      src={src} alt={name}
      onError={() => setErr(true)}
      crossOrigin="anonymous"
      style={{
        width: size, height: size, borderRadius: "50%",
        objectFit: "cover", objectPosition: "top",
        border: `2px solid ${col}55`, flexShrink: 0,
      }}
    />
  );
}

/* ─── SLOT PILL COMPONENT ───────────────────────────────────── */
function SlotPill({ role, filled, limit, compact }) {
  const over = filled >= limit;
  const color = over ? "var(--red)" : filled > 0 ? ROLE_COLORS[role] : "var(--border)";
  if (compact) {
    return (
      <span title={`${SLOT_LABELS[role]}: ${filled}/${limit}`} style={{
        fontSize: 10, fontFamily: "Share Tech Mono, monospace", letterSpacing: 0.5,
        padding: "2px 6px", border: `1px solid ${color}`,
        color, background: color + "15", whiteSpace: "nowrap",
      }}>{filled}/{limit}</span>
    );
  }
  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "6px 10px", border: `1px solid ${color}22`,
      background: color + "0d", marginBottom: 4,
    }}>
      <span style={{ fontSize: 11, letterSpacing: 1, color: "var(--muted)", textTransform: "uppercase" }}>{SLOT_LABELS[role]}</span>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <div style={{ display: "flex", gap: 3 }}>
          {Array.from({ length: limit }).map((_, i) => (
            <div key={i} style={{
              width: 10, height: 10, borderRadius: 2,
              background: i < filled ? color : "var(--border)",
              transition: "background .3s",
            }} />
          ))}
        </div>
        <span style={{
          fontSize: 11, fontFamily: "Share Tech Mono, monospace",
          color: over ? "var(--red)" : "var(--muted)",
          fontWeight: over ? 700 : 400,
        }}>{filled}/{limit}{over ? " ✓" : ""}</span>
      </div>
    </div>
  );
}

/* ─── TEAM SLOTS MINI DISPLAY ───────────────────────────────── */
function TeamSlotsDisplay({ teamName, players, compact = false }) {
  const slots = getTeamSlots(players, teamName);
  if (compact) {
    return (
      <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
        {Object.keys(SLOT_LIMITS).map(r => (
          <SlotPill key={r} role={r} filled={slots[r]} limit={SLOT_LIMITS[r]} compact />
        ))}
      </div>
    );
  }
  return (
    <div>
      {Object.keys(SLOT_LIMITS).map(r => (
        <SlotPill key={r} role={r} filled={slots[r]} limit={SLOT_LIMITS[r]} />
      ))}
    </div>
  );
}

/* ─── LOGIN PAGE ────────────────────────────────────────────── */
function LoginPage() {
  const { dispatch } = useAuction();
  const [u, setU] = useState("");
  const [p, setP] = useState("");
  const [err, setErr] = useState("");

  const login = () => {
    const user = USERS[u.trim().toLowerCase()];
    if (!user || user.pass !== p) { setErr("INVALID CREDENTIALS"); return; }
    dispatch({ type: "LOGIN", payload: { ...user, username: u.trim().toLowerCase() } });
    setErr(""); setU(""); setP("");
  };

  return (
    <div style={{
      position: "fixed", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
      background: "var(--bg)", zIndex: 100,
    }}>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderTop: "3px solid var(--accent)", padding: "48px 40px", width: 380,
      }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ fontFamily: "Oswald", fontSize: 38, fontWeight: 700, letterSpacing: 4, color: "var(--accent)" }}>🏏 CRICOMANIA</div>
          <div style={{ fontSize: 11, letterSpacing: 6, color: "var(--muted)", textTransform: "uppercase", marginTop: 4 }}>Auction System</div>
        </div>
        {[["USERNAME", u, setU, "text"], ["PASSWORD", p, setP, "password"]].map(([lbl, val, set, type]) => (
          <div key={lbl} style={{ marginBottom: 16 }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>{lbl}</div>
            <input
              type={type} value={val} onChange={e => set(e.target.value)}
              onKeyDown={e => e.key === "Enter" && login()}
              style={{
                width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--text)", padding: "11px 14px",
                fontFamily: "Share Tech Mono, monospace", fontSize: 14, outline: "none",
              }}
            />
          </div>
        ))}
        <button onClick={login} style={{
          width: "100%", background: "var(--accent)", color: "#000", border: "none",
          padding: 14, fontFamily: "Oswald", fontSize: 16, fontWeight: 600, letterSpacing: 3,
          cursor: "pointer", marginTop: 8,
        }}>ENTER AUCTION</button>
        {err && <div style={{ color: "var(--red)", fontSize: 12, textAlign: "center", marginTop: 12, letterSpacing: 1 }}>{err}</div>}
      </div>
    </div>
  );
}

/* ─── TOPBAR ────────────────────────────────────────────────── */
function TopBar() {
  const { state, dispatch } = useAuction();
  const { theme, toggleTheme } = useTheme();
  const { currentUser, page } = state;
  const isAdmin = currentUser?.role === "admin";

  const nav = [
    { id: "auction",   label: isAdmin ? "AUCTION (ADMIN)" : "AUCTION" },
    { id: "livebid",   label: isAdmin ? "🔴 LIVE BID" : "🔴 LIVE" },
    { id: "display",   label: "📺 DISPLAY" },
    { id: "squads",    label: "👥 SQUADS" },
    { id: "team",      label: "MY TEAM" },
    { id: "overview",  label: "OVERVIEW" },
    ...(isAdmin ? [
      { id: "history", label: "HISTORY" },
      { id: "manage",  label: "⚙ MANAGE PLAYERS" },
      { id: "budget",  label: "💰 BUDGETS" },
    ] : []),
  ];

  return (
    <div style={{
      background: "var(--surface)", borderBottom: "2px solid var(--accent)",
      padding: "0 24px", display: "flex", alignItems: "center",
      justifyContent: "space-between", height: 56, position: "sticky", top: 0, zIndex: 50,
    }}>
      <div style={{ fontFamily: "Oswald", fontSize: 22, fontWeight: 700, letterSpacing: 3, color: "var(--accent)" }}>🏏 CRICOMANIA</div>
      <nav style={{ display: "flex", gap: 2 }}>
        {nav.map(n => (
          <button key={n.id} onClick={() => dispatch({ type: "SET_PAGE", payload: n.id })} style={{
            background: "none", border: "none", cursor: "pointer",
            fontFamily: "Rajdhani, sans-serif", fontSize: 13, fontWeight: 600, letterSpacing: 1.5,
            padding: "6px 14px", textTransform: "uppercase",
            color: page === n.id ? "var(--accent)" : "var(--muted)",
            borderBottom: page === n.id ? "2px solid var(--accent)" : "2px solid transparent",
            transition: "all .2s",
          }}>{n.label}</button>
        ))}
      </nav>
      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontSize: 12, letterSpacing: 1, color: "var(--muted)", padding: "4px 10px", border: "1px solid var(--border)" }}>
          {currentUser?.team && <span style={{ color: "var(--accent)", fontWeight: 700 }}>{currentUser.team}</span>}
          {!currentUser?.team && <>Logged in as <span style={{ color: "var(--accent)", fontWeight: 700 }}>{currentUser?.label}</span></>}
        </div>
        <button onClick={toggleTheme} style={{
          background: "none", border: "1px solid var(--border)", color: "var(--muted)",
          fontFamily: "Rajdhani, sans-serif", fontSize: 12, letterSpacing: 1, padding: "4px 10px", cursor: "pointer",
          transition: "all .2s",
        }} title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
          {theme === 'dark' ? '☀️ LIGHT' : '🌙 DARK'}
        </button>
        <button onClick={() => dispatch({ type: "LOGOUT" })} style={{
          background: "none", border: "1px solid var(--border)", color: "var(--muted)",
          fontFamily: "Rajdhani, sans-serif", fontSize: 12, letterSpacing: 1, padding: "4px 10px", cursor: "pointer",
        }}>LOGOUT</button>
      </div>
    </div>
  );
}

/* ─── PLAYER CARD ───────────────────────────────────────────── */
function PlayerCard({ player }) {
  const { state, dispatch } = useAuction();
  const toast = useToast();
  const isAdmin = state.currentUser?.role === "admin";

  const isSold = !!player.soldTo;
  const teamColor = isSold ? state.teams[player.soldTo]?.color : null;

  const unassign = () => {
    dispatch({ type: "UNASSIGN_PLAYER", payload: { id: player.id } });
    toast("Player returned to auction pool");
  };

  return (
    <div style={{
      background: "var(--surface)", border: "1px solid var(--border)",
      borderLeft: `3px solid ${ROLE_COLORS[player.role]}`,
      padding: 12, transition: "border-color .2s, transform .15s",
      opacity: isSold ? 0.65 : 1,
      position: "relative", overflow: "hidden",
      display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
    }}>
      {/* LARGE PLAYER IMAGE */}
      <PlayerAvatar name={player.name} role={player.role} size={120} photoUrl={player.photoUrl} />
      
      {/* PLAYER NAME & ROLE */}
      <div style={{ marginTop: 12, width: "100%" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 18, fontWeight: 700, lineHeight: 1.2 }}>{player.name}</div>
        <span style={{
          fontSize: 10, fontWeight: 700, letterSpacing: 1.5, padding: "4px 8px", display: "inline-block", marginTop: 4,
          background: ROLE_COLORS[player.role] + "22", color: ROLE_COLORS[player.role],
          border: `1px solid ${ROLE_COLORS[player.role]}44`,
          borderRadius: 3,
        }}>{ROLES[player.role]}</span>
        <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>{COUNTRY_FLAGS[player.country] || "🌍"} {player.country}</div>
      </div>

      {/* PLAYER STATS */}
      <div style={{ marginTop: 10, width: "100%", fontSize: 11, color: "var(--muted)", lineHeight: 1.6 }}>
        <div style={{ color: "var(--green)", fontFamily: "Share Tech Mono, monospace", fontWeight: 600 }}>Base: {fmtCur(player.base)}</div>
        <div style={{ marginTop: 8, padding: "8px", background: "rgba(168, 85, 247, 0.1)", border: "1px solid rgba(168, 85, 247, 0.3)", borderRadius: 3 }}>
          <div style={{ fontSize: 9, letterSpacing: 1, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>T20 Rating</div>
          <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, color: "#a855f7" }}>{player.t20Rating}</div>
        </div>
      </div>

      {isSold && (
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.2)",
          padding: "6px 10px", marginTop: 6,
        }}>
          <span style={{ fontSize: 10, letterSpacing: 2, color: "var(--green)", fontWeight: 700 }}>SOLD</span>
          <span style={{ fontFamily: "Oswald", fontSize: 13, fontWeight: 700, color: teamColor }}>{player.soldTo}</span>
          <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 12, color: "var(--accent)" }}>{fmtCur(player.soldPrice)}</span>
        </div>
      )}

      {isAdmin && isSold && (
        <button onClick={unassign} style={{
          width: "100%", marginTop: 6, background: "none", border: "1px solid var(--red)",
          color: "var(--red)", fontFamily: "Rajdhani, sans-serif", fontSize: 11,
          fontWeight: 600, letterSpacing: 1, padding: "4px 8px", cursor: "pointer",
        }}>↩ UNASSIGN</button>
      )}



      {isAdmin && !isSold && (
        <>
          {state.livePlayerId === player.id ? (
            <div style={{ display: "flex", gap: 6, marginTop: 6 }}>
              <button style={{
                flex: 1, background: "var(--red)", color: "#fff",
                border: "none", fontFamily: "Rajdhani, sans-serif", fontSize: 11,
                fontWeight: 600, letterSpacing: 1, padding: "4px 8px", cursor: "pointer",
              }}>🔴 LIVE NOW</button>
              <button onClick={() => dispatch({ type: "CLEAR_LIVE_PLAYER" })} style={{
                flex: 1, background: "none", border: "1px solid var(--red)",
                color: "var(--red)", fontFamily: "Rajdhani, sans-serif", fontSize: 11,
                fontWeight: 600, letterSpacing: 1, padding: "4px 8px", cursor: "pointer",
              }}>REMOVE BID</button>
            </div>
          ) : (
            <button onClick={() => { dispatch({ type: "SET_LIVE_PLAYER", payload: player.id }); dispatch({ type: "SET_PAGE", payload: "livebid" }); }} style={{
              width: "100%", marginTop: 6, background: "none",
              border: "1px solid var(--border)",
              color: "var(--muted)",
              fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 600,
              letterSpacing: 1, padding: "4px 8px", cursor: "pointer",
            }}>▶ SET AS LIVE BID</button>
          )}
        </>
      )}
    </div>
  );
}

/* ─── SQUAD LIMITS LEGEND ───────────────────────────────────── */
function SquadLimitsLegend() {
  return (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      padding: "10px 16px", display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center",
      marginBottom: 16,
    }}>
      <span style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginRight: 4 }}>Squad Limits per team:</span>
      {Object.entries(SLOT_LIMITS).map(([r, lim]) => (
        <span key={r} style={{
          fontSize: 11, fontFamily: "Share Tech Mono, monospace",
          padding: "2px 8px", border: `1px solid ${ROLE_COLORS[r]}44`,
          color: ROLE_COLORS[r], background: ROLE_COLORS[r] + "12",
        }}>{SLOT_LABELS[r]} ×{lim}</span>
      ))}
      <span style={{ fontSize: 10, color: "var(--muted)", marginLeft: "auto" }}>Total: {TOTAL_SQUAD} players/team</span>
    </div>
  );
}

/* ─── DISPLAY PAGE (Scoreboard) ─────────────────────────────── */
function DisplayPage() {
  const { state } = useAuction();
  const { players, teams, livePlayerId, currentUser } = state;

  if (!currentUser) return null;

  const livePlayer = players.find(p => p.id === livePlayerId);
  const roleColor = livePlayer ? ROLE_COLORS[livePlayer.role] : "var(--accent)";

  // Count players per team
  const teamRosters = {};
  Object.keys(teams).forEach(tName => {
    teamRosters[tName] = {
      total: 0,
      t20Rating: 0,
      BAT: 0,
      BWL: 0,
      WK: 0,
      AR: 0,
      LEG: 0,
    };
  });

  players.forEach(p => {
    if (p.soldTo) {
      teamRosters[p.soldTo].total += 1;
      teamRosters[p.soldTo].t20Rating += p.t20Rating || 0;
      teamRosters[p.soldTo][p.role] += 1;
    }
  });

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1400, margin: "0 auto", minHeight: "100vh" }}>
      {/* Main Display: Current Player */}
      <div style={{ marginBottom: 60 }}>
        {!livePlayer ? (
          <div style={{
            background: "var(--surface)", border: "2px dashed var(--border)",
            padding: "80px 40px", textAlign: "center", borderRadius: 8,
          }}>
            <div style={{ fontSize: 48, marginBottom: 20, opacity: 0.3 }}>🏏</div>
            <div style={{ fontFamily: "Oswald", fontSize: 32, color: "var(--muted)", letterSpacing: 2 }}>
              NO PLAYER SELECTED
            </div>
            <div style={{ fontSize: 16, color: "var(--muted)", marginTop: 16, letterSpacing: 1 }}>
              Set a live player from the Live Bid page
            </div>
          </div>
        ) : (
          <div style={{
            background: "var(--surface)", border: `2px solid ${roleColor}`,
            borderTop: `6px solid ${roleColor}`, padding: "60px 40px", borderRadius: 8,
            textAlign: "center", position: "relative", overflow: "hidden",
          }}>
            <div style={{
              position: "absolute", top: -60, right: -60, width: 300, height: 300,
              borderRadius: "50%", background: roleColor + "08", pointerEvents: "none",
            }} />

            {/* Player Image */}
            <div style={{ marginBottom: 40, position: "relative", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <PlayerAvatar
                name={livePlayer.name}
                role={livePlayer.role}
                size={280}
                photoUrl={livePlayer.photoUrl}
              />
              {livePlayer.soldTo && (
                <div style={{
                  position: "absolute", left: "50%", bottom: -40, transform: "translateX(-50%)",
                  background: teams[livePlayer.soldTo]?.color,
                  padding: "12px 32px", borderRadius: 4,
                  fontFamily: "Oswald", fontSize: 18, fontWeight: 700,
                  color: "#fff", letterSpacing: 2,
                }}>
                  ✓ {livePlayer.soldTo}
                </div>
              )}
            </div>

            {/* Player Name and Role */}
            <div style={{ marginTop: 60, marginBottom: 20 }}>
              <div style={{
                fontFamily: "Oswald", fontSize: 56, fontWeight: 700,
                letterSpacing: 2, lineHeight: 1, marginBottom: 16,
              }}>
                {livePlayer.name}
              </div>

              <div style={{ display: "flex", gap: 20, justifyContent: "center", alignItems: "center", flexWrap: "wrap" }}>
                <span style={{
                  fontSize: 14, fontWeight: 700, letterSpacing: 2, padding: "8px 16px",
                  background: roleColor + "22", color: roleColor, border: `2px solid ${roleColor}`,
                  borderRadius: 4, textTransform: "uppercase",
                }}>
                  {ROLES[livePlayer.role]}
                </span>
                <span style={{
                  fontSize: 14, color: "var(--muted)", letterSpacing: 1,
                }}>
                  {COUNTRY_FLAGS[livePlayer.country] || "🌍"} {livePlayer.country}
                </span>
              </div>

              {/* Base Price */}
              <div style={{ marginTop: 28 }}>
                <div style={{ fontSize: 12, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
                  Base Price
                </div>
                <div style={{
                  fontFamily: "Oswald", fontSize: 42, fontWeight: 700,
                  color: "var(--green)", letterSpacing: 1,
                }}>
                  {livePlayer.base ? fmtCur(livePlayer.base) : "—"}
                </div>
                
                {/* T20 Rating */}
                <div style={{ marginTop: 20 }}>
                  <div style={{ fontSize: 12, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>
                    T20 Rating
                  </div>
                  <div style={{
                    fontFamily: "Oswald", fontSize: 42, fontWeight: 700,
                    color: "#a855f7", letterSpacing: 1,
                  }}>
                    {livePlayer.t20Rating}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

/* ─── TEAM SQUADS SECTION (Separated Component) ─────────────── */
function TeamSquadsSection({ teams, players, teamRosters }) {
  return (
    <div>
      <div style={{
        fontFamily: "Oswald", fontSize: 24, fontWeight: 700,
        letterSpacing: 2, marginBottom: 24, paddingBottom: 16,
        borderBottom: "2px solid var(--border)",
      }}>
        TEAM SQUADS
      </div>

      <div style={{
        display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
        gap: 24,
      }}>
        {Object.entries(teams).map(([tName, tData]) => {
          const roster = teamRosters[tName];
          const progress = Math.round((roster.total / TOTAL_SQUAD) * 100);

          return (
            <div key={tName} style={{
              background: "var(--surface)", border: `2px solid ${tData.color}33`,
              borderTop: `4px solid ${tData.color}`, padding: 24, borderRadius: 8,
            }}>
              {/* Team Name & Color */}
              <div style={{
                display: "flex", alignItems: "center", gap: 12, marginBottom: 20,
              }}>
                <div style={{
                  width: 20, height: 20, background: tData.color,
                  borderRadius: 3, border: "2px solid var(--text)"
                }} />
                <div style={{
                  fontFamily: "Oswald", fontSize: 18, fontWeight: 700,
                  letterSpacing: 1, color: tData.color,
                  padding: "0",
                  borderRadius: "2px",
                  flex: 1,
                }}>
                  {tName}
                </div>
                <div style={{
                  fontSize: 16, fontWeight: 700, color: "var(--accent)",
                  fontFamily: "Share Tech Mono, monospace",
                }}>
                  {roster.total}/{TOTAL_SQUAD}
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{
                height: 8, background: "var(--bg)", borderRadius: 4,
                overflow: "hidden", marginBottom: 20,
              }}>
                <div style={{
                  height: "100%", width: `${progress}%`, background: tData.color,
                  transition: "width 0.3s ease",
                }} />
              </div>

              {/* Role Breakdown */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12,
              }}>
                {Object.entries(SLOT_LABELS).map(([role, label]) => (
                  <div key={role} style={{
                    background: "var(--bg)", padding: "10px 12px", borderRadius: 4,
                    borderLeft: `3px solid ${ROLE_COLORS[role]}`,
                  }}>
                    <div style={{
                      fontSize: 11, color: "var(--muted)", letterSpacing: 1,
                      marginBottom: 4, textTransform: "uppercase",
                    }}>
                      {label}
                    </div>
                    <div style={{
                      fontSize: 18, fontWeight: 700, color: ROLE_COLORS[role],
                      fontFamily: "Share Tech Mono, monospace",
                    }}>
                      {roster[role]}/{SLOT_LIMITS[role]}
                    </div>
                  </div>
                ))}
              </div>

              {/* T20 Rating Total */}
              <div style={{
                marginTop: 20, padding: "12px 16px", background: "#a855f722",
                borderLeft: "4px solid #a855f7", borderRadius: 4,
              }}>
                <div style={{
                  fontSize: 10, color: "#a855f7", letterSpacing: 1, marginBottom: 6,
                  textTransform: "uppercase", fontWeight: 700,
                }}>
                  Team T20 Rating
                </div>
                <div style={{
                  fontSize: 24, fontWeight: 700, color: "#a855f7",
                  fontFamily: "Share Tech Mono, monospace",
                }}>
                  {getTeamT20Rating(players, tName)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── TEAM SQUADS PAGE ─────────────────────────────────────── */
function TeamSquadsPage() {
  const { state } = useAuction();
  const { players, teams } = state;

  // Count players per team
  const teamRosters = {};
  Object.keys(teams).forEach(tName => {
    teamRosters[tName] = {
      total: 0,
      t20Rating: 0,
      BAT: 0,
      BWL: 0,
      WK: 0,
      AR: 0,
      LEG: 0,
    };
  });

  players.forEach(p => {
    if (p.soldTo) {
      teamRosters[p.soldTo].total += 1;
      teamRosters[p.soldTo].t20Rating += p.t20Rating || 0;
      teamRosters[p.soldTo][p.role] += 1;
    }
  });

  return (
    <div style={{ padding: "40px 24px", maxWidth: 1400, margin: "0 auto", minHeight: "100vh" }}>
      <TeamSquadsSection teams={teams} players={players} teamRosters={teamRosters} />
    </div>
  );
}

/* ─── AUCTION PAGE ──────────────────────────────────────────── */
function AuctionPage() {
  const { state, dispatch } = useAuction();
  const { players, filterRole, searchQ, currentUser } = state;
  const isAdmin = currentUser?.role === "admin";

  const filtered = players.filter(p => {
    const rm = filterRole === "ALL" || p.role === filterRole;
    const sm = !searchQ || p.name.toLowerCase().includes(searchQ.toLowerCase()) || p.country.toLowerCase().includes(searchQ.toLowerCase());
    return rm && sm;
  });

  const sold   = players.filter(p => p.soldTo).length;
  const unsold = players.length - sold;

  // Group filtered players by role
  const groupedByRole = Object.fromEntries(
    Object.keys(ROLES).map(role => [
      role,
      filtered.filter(p => p.role === role)
    ])
  );

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div>
          <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
            PLAYER <span style={{ color: "var(--accent)" }}>AUCTION</span>
          </div>
          <div style={{ fontSize: 12, color: "var(--muted)", letterSpacing: 1, marginTop: 4 }}>
            {isAdmin ? "Admin — assign players after offline bidding" : "View only — contact admin to assign players"}
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 13, color: "var(--muted)" }}>
          <span>SOLD <strong style={{ color: "var(--green)", fontFamily: "Share Tech Mono, monospace" }}>{sold}</strong></span>
          <span>AVAILABLE <strong style={{ color: "var(--accent)", fontFamily: "Share Tech Mono, monospace" }}>{unsold}</strong></span>
        </div>
      </div>

      <SquadLimitsLegend />

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center", marginBottom: 20 }}>
        {["ALL", "BAT", "BWL", "WK", "AR", "LEG"].map(r => (
          <button key={r} onClick={() => dispatch({ type: "SET_FILTER_ROLE", payload: r })} style={{
            background: filterRole === r ? "var(--accent)" : "var(--surface)",
            border: `1px solid ${filterRole === r ? "var(--accent)" : "var(--border)"}`,
            color: filterRole === r ? "#000" : "var(--muted)",
            fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700,
            letterSpacing: 1.5, padding: "6px 14px", cursor: "pointer", textTransform: "uppercase",
          }}>
            {r === "ALL" ? "ALL" : r === "BAT" ? `BATSMEN (×${SLOT_LIMITS.BAT})` : r === "BWL" ? `BOWLERS (×${SLOT_LIMITS.BWL})` : r === "WK" ? `KEEPER (×${SLOT_LIMITS.WK})` : r === "AR" ? `ALL-ROUNDERS (×${SLOT_LIMITS.AR})` : `LEGENDS (×${SLOT_LIMITS.LEG})`}
          </button>
        ))}
        <input
          value={searchQ} onChange={e => dispatch({ type: "SET_SEARCH", payload: e.target.value })}
          placeholder="🔍  Search player or country..."
          style={{
            background: "var(--surface)", border: "1px solid var(--border)",
            color: "var(--text)", fontFamily: "Rajdhani, sans-serif", fontSize: 14,
            padding: "7px 14px", outline: "none", width: 240, marginLeft: "auto",
          }}
        />
      </div>

      {filterRole === "ALL" ? (
        // Show separated by category
        <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
          {Object.entries(ROLES).map(([roleKey, roleLabel]) => {
            const rolePlayers = groupedByRole[roleKey];
            return (
              <div key={roleKey}>
                <div style={{
                  fontFamily: "Oswald", fontSize: 18, fontWeight: 700, letterSpacing: 2,
                  color: ROLE_COLORS[roleKey], marginBottom: 16, paddingBottom: 12,
                  borderBottom: `2px solid ${ROLE_COLORS[roleKey]}55`,
                }}>
                  {roleLabel}S <span style={{ fontSize: 13, color: "var(--muted)", fontWeight: 400 }}>({rolePlayers.length})</span>
                </div>
                {rolePlayers.length === 0 ? (
                  <div style={{ color: "var(--muted)", fontSize: 14, letterSpacing: 1, padding: "20px 0" }}>No {roleLabel}s in pool.</div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                    {rolePlayers.map(p => <PlayerCard key={p.id} player={p} />)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        // Show single category
        filtered.length === 0 ? (
          <div style={{ color: "var(--muted)", fontSize: 14, letterSpacing: 1, padding: "20px 0" }}>No players found.</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
            {filtered.map(p => <PlayerCard key={p.id} player={p} />)}
          </div>
        )
      )}
    </div>
  );
}

/* ─── TEAM PAGE ─────────────────────────────────────────────── */
function TeamSection({ tName, tData, showBudget }) {
  const { state } = useAuction();
  const teamPlayers = state.players.filter(p => p.soldTo === tName);
  const remaining = tData.budget - tData.spent;
  const pct = Math.max(0, Math.round((remaining / tData.budget) * 100));
  const cls = pct <= 20 ? "var(--red)" : pct <= 50 ? "var(--accent)" : "var(--green)";
  const total = teamPlayers.length;

  return (
    <div style={{ marginBottom: 36 }}>
      {/* Team Name Header */}
      <div style={{
        fontFamily: "Oswald", fontSize: 20, fontWeight: 700, letterSpacing: 2,
        color: tData.color, marginBottom: 16,
      }}>
        {tName}
      </div>
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderTop: `3px solid ${tData.color}`,
        padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 12, color: "var(--muted)", letterSpacing: 1, marginTop: 4 }}>
            {total} / {TOTAL_SQUAD} players acquired
          </div>
          {/* Slot dots */}
          <div style={{ marginTop: 12 }}>
            <TeamSlotsDisplay teamName={tName} players={state.players} />
          </div>
        </div>
        {showBudget && (
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 4 }}>Remaining Budget</div>
            <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 26, color: cls }}>{fmtCur(remaining)}</div>
            <div style={{ width: 200, height: 4, background: "var(--border)", borderRadius: 2, marginTop: 6, overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${pct}%`, background: cls, transition: "width .5s ease" }} />
            </div>
            <div style={{ fontSize: 11, color: "var(--muted)", marginTop: 4 }}>Spent: {fmtCur(tData.spent)} / {fmtCur(tData.budget)}</div>
            
            {/* T20 Rating Total */}
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--border)" }}>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Team T20 Rating</div>
              <div style={{ fontFamily: "Oswald", fontSize: 32, fontWeight: 700, color: "#a855f7" }}>{getTeamT20Rating(state.players, tName)}</div>
            </div>
          </div>
        )}
      </div>

      {Object.entries(ROLES).map(([rKey, rLabel]) => {
        const rPlayers = teamPlayers.filter(p => p.role === rKey);
        const limit = SLOT_LIMITS[rKey];
        const isFull = rPlayers.length >= limit;
        return (
          <div key={rKey} style={{ marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
              <span style={{ fontFamily: "Oswald", fontSize: 14, fontWeight: 600, letterSpacing: 2, color: ROLE_COLORS[rKey], textTransform: "uppercase" }}>{rLabel}s</span>
              <span style={{ fontSize: 10, background: "var(--border)", color: "var(--muted)", padding: "2px 7px", letterSpacing: 1 }}>{rPlayers.length}/{limit}</span>
              {isFull && <span style={{ fontSize: 9, color: "var(--green)", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", padding: "2px 6px", letterSpacing: 1 }}>FULL</span>}
              {!isFull && <span style={{ fontSize: 9, color: "var(--muted)", background: "var(--surface2)", border: "1px solid var(--border)", padding: "2px 6px", letterSpacing: 1 }}>{limit - rPlayers.length} SLOTS LEFT</span>}
            </div>
            {rPlayers.length === 0
              ? <div style={{ color: "var(--muted)", fontSize: 13, letterSpacing: 1 }}>No {rLabel}s acquired yet</div>
              : <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 8 }}>
                  {rPlayers.map(p => (
                    <div key={p.id} style={{
                      background: "var(--surface2)", border: "1px solid var(--border)",
                      padding: "10px 14px", display: "flex", alignItems: "center", gap: 10,
                    }}>
                      <PlayerAvatar name={p.name} role={p.role} size={36} photoUrl={p.photoUrl} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontFamily: "Oswald", fontSize: 13, fontWeight: 600, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{p.name}</div>
                        <div style={{ display: "flex", gap: 8, marginTop: 2, fontSize: 11 }}>
                          <span style={{ fontFamily: "Share Tech Mono, monospace", color: "var(--accent)" }}>{fmtCur(p.soldPrice)}</span>
                          <span style={{ color: "#a855f7", fontWeight: 600 }}>⭐ {p.t20Rating}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
            }
          </div>
        );
      })}
    </div>
  );
}

function TeamPage() {
  const { state } = useAuction();
  const { currentUser, teams } = state;
  const isAdmin = currentUser?.role === "admin";

  if (isAdmin) {
    return (
      <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 12, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          ALL <span style={{ color: "var(--accent)" }}>TEAMS</span>
        </div>
        <SquadLimitsLegend />
        {Object.entries(teams).map(([tName, tData]) => (
          <TeamSection key={tName} tName={tName} tData={tData} showBudget={true} />
        ))}
      </div>
    );
  }

  const tName = currentUser?.team;
  const tData = teams[tName];
  if (!tData) return <div style={{ padding: 40, color: "var(--muted)" }}>Team not found.</div>;

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 12, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        MY <span style={{ color: "var(--accent)" }}>SQUAD</span>
      </div>
      <SquadLimitsLegend />
      <TeamSection tName={tName} tData={tData} showBudget={true} />
    </div>
  );
}

/* ─── OVERVIEW PAGE ─────────────────────────────────────────── */
function OverviewPage() {
  const { state, dispatch } = useAuction();
  const toast = useToast();
  const { players, teams, currentUser } = state;
  const isAdmin = currentUser?.role === "admin";
  const myTeam = currentUser?.team;

  const total = players.length;
  const sold  = players.filter(p => p.soldTo).length;

  const handleResetAuction = () => {
    if (window.confirm("🔄 START NEW GAME?\n\nThis will:\n• Return all sold players to auction\n• Reset all team budgets to 1000L\n• Clear auction history\n• KEEP current teams & players config\n\nYou can play another round!")) {
      dispatch({ type: "RESET_AUCTION" });
      toast("✅ Auction reset! Ready to play again.", false);
    }
  };

  const handleSyncConfigToFirebase = () => {
    if (window.confirm("⚠️ SYNC CONFIG TO FIREBASE?\n\nThis will:\n• Update entire database to match local config\n• Reset all sold players\n• Reset all team budgets\n• Delete all history\n• Sync TEAMS and PLAYERS to cloud\n\nUse this when config changes. CANNOT be undone!")) {
      dispatch({ type: "SYNC_CONFIG_TO_FIREBASE" });
      toast("✅ Config synced to Firebase!", false);
    }
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
          TEAMS <span style={{ color: "var(--accent)" }}>OVERVIEW</span>
        </div>
        {isAdmin && (
          <div style={{ display: "flex", gap: 12 }}>
            <button onClick={handleSyncConfigToFirebase} style={{
              background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.5)",
              color: "var(--red)", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: 1, padding: "8px 16px", cursor: "pointer", borderRadius: 4,
              opacity: 0.8, transition: "all 0.2s",
            }} onMouseEnter={e => e.target.style.opacity = "1"} onMouseLeave={e => e.target.style.opacity = "0.8"}>
              ⚠️ SYNC CONFIG
            </button>
            <button onClick={handleResetAuction} style={{
              background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.5)",
              color: "var(--accent)", fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: 1, padding: "8px 16px", cursor: "pointer", borderRadius: 4,
              opacity: 0.8, transition: "all 0.2s",
            }} onMouseEnter={e => e.target.style.opacity = "1"} onMouseLeave={e => e.target.style.opacity = "0.8"}>
              🔄 RESET AUCTION
            </button>
          </div>
        )}
      </div>

      <SquadLimitsLegend />

      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 28px", marginBottom: 24, display: "flex", gap: 32, flexWrap: "wrap", alignItems: "center" }}>
        {[
          { n: total, l: "Total Players", c: "var(--text)" },
          { n: sold,  l: "Sold",          c: "var(--green)" },
          { n: total - sold, l: "Available", c: "var(--muted)" },
          { n: Object.keys(teams).length, l: "Teams", c: "var(--accent)" },
        ].map((s, i) => (
          <div key={i} style={{ display: "flex", alignItems: "center", gap: i > 0 ? 32 : 0 }}>
            {i > 0 && <div style={{ width: 1, height: 40, background: "var(--border)" }} />}
            <div style={{ textAlign: "center" }}>
              <div style={{ fontFamily: "Oswald", fontSize: 32, fontWeight: 700, color: s.c, lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 11, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginTop: 4 }}>{s.l}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px,1fr))", gap: 20, marginBottom: 24 }}>
        {Object.entries(teams).map(([tName, tData]) => {
          const tp = players.filter(p => p.soldTo === tName);
          const slots = getTeamSlots(players, tName);
          const remaining = tData.budget - tData.spent;
          const canSeeBudget = isAdmin || myTeam === tName;

          return (
            <div key={tName} style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: `3px solid ${tData.color}`, padding: 24 }}>
              {/* Team Name */}
              <div style={{
                fontFamily: "Oswald", fontSize: 16, fontWeight: 700, letterSpacing: 1,
                color: tData.color, marginBottom: 16,
              }}>
                {tName}
              </div>

              {/* Squad slot progress */}
              <div style={{ marginBottom: 14 }}>
                {Object.keys(SLOT_LIMITS).map(r => (
                  <SlotPill key={r} role={r} filled={slots[r]} limit={SLOT_LIMITS[r]} />
                ))}
              </div>

              {[
                ["Total Players", `${tp.length} / ${TOTAL_SQUAD}`, "var(--text)"],
                ["T20 Rating", getTeamT20Rating(players, tName), "#a855f7"],
                ...(canSeeBudget ? [
                  ["Spent",         fmtCur(tData.spent),    "var(--accent)"],
                  ["Remaining",     fmtCur(remaining),      "var(--green)"],
                ] : [
                  ["Budget",        "CONFIDENTIAL", "var(--border)"],
                ]),
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontFamily: label === "T20 Rating" ? "Oswald" : "Share Tech Mono, monospace", fontSize: label === "T20 Rating" ? 16 : 13, fontWeight: label === "T20 Rating" ? 700 : 400, color }}>{val}</span>
                </div>
              ))}
            </div>
          );
        })}
      </div>

      {/* Category breakdown */}
      <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "20px 24px" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 14, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 16 }}>Category Breakdown (filled / limit per team)</div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px,1fr))", gap: 12 }}>
          {Object.entries(ROLES).map(([rKey, rLabel]) => (
            <div key={rKey} style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: "12px 16px" }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: ROLE_COLORS[rKey], textTransform: "uppercase", marginBottom: 4 }}>{rLabel}s</div>
              <div style={{ fontSize: 10, color: "var(--muted)", marginBottom: 10 }}>Max {SLOT_LIMITS[rKey]} per team</div>
              {Object.entries(teams).map(([tName, tData]) => {
                const cnt = players.filter(p => p.soldTo === tName && p.role === rKey).length;
                const lim = SLOT_LIMITS[rKey];
                const full = cnt >= lim;
                return (
                  <div key={tName} style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginBottom: 6, alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <div style={{ display: "flex", gap: 2 }}>
                        {Array.from({ length: lim }).map((_, i) => (
                          <div key={i} style={{ width: 8, height: 8, borderRadius: 1, background: i < cnt ? ROLE_COLORS[rKey] : "var(--border)" }} />
                        ))}
                      </div>
                      <strong style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: full ? "var(--green)" : "var(--muted)" }}>{cnt}/{lim}</strong>
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ─── PLAYER STATS ──────────────────────────────────────────── */
const PLAYER_STATS = {
  // Batsmen
  "Ruturaj Gaikwad":    { matches:85,  runs:2156,  avg:31.5,  sr:132.1, wickets:null, economy:null,  hundreds:0,   fifties:14, catches:18  },
  "Shikhar Dhawan":     { matches:175, runs:5169,  avg:32.0,  sr:127.8, wickets:null, economy:null,  hundreds:2,   fifties:36, catches:41  },
  "Sophie Devine":      { matches:142, runs:3589,  avg:32.6,  sr:131.4, wickets:null, economy:null,  hundreds:8,   fifties:22, catches:44  },
  "Yashasvi Jaiswal":   { matches:32,  runs:1041,  avg:35.2,  sr:148.6, wickets:null, economy:null,  hundreds:2,   fifties:4,  catches:8   },
  "Kane Williamson":    { matches:95,  runs:3227,  avg:33.9,  sr:125.9, wickets:null, economy:null,  hundreds:2,   fifties:22, catches:42  },
  "Shreyas Iyer":       { matches:69,  runs:1854,  avg:32.1,  sr:127.4, wickets:null, economy:null,  hundreds:1,   fifties:10, catches:19  },
  "Phil Salt":          { matches:58,  runs:1923,  avg:35.6,  sr:152.3, wickets:null, economy:null,  hundreds:4,   fifties:9,  catches:35  },
  "Suryakumar Yadav":   { matches:72,  runs:2566,  avg:42.8,  sr:157.2, wickets:null, economy:null,  hundreds:4,   fifties:17, catches:26  },
  "Shubman Gill":       { matches:45,  runs:1294,  avg:32.4,  sr:129.5, wickets:null, economy:null,  hundreds:1,   fifties:7,  catches:14  },
  "Ellyse Perry":       { matches:155, runs:4329,  avg:36.1,  sr:128.7, wickets:107,  economy:7.84,  hundreds:9,   fifties:27, catches:65  },
  "Virat Kohli":        { matches:112, runs:4055,  avg:42.4,  sr:140.3, wickets:null, economy:null,  hundreds:7,   fifties:31, catches:48  },
  "Aaron Finch":        { matches:103, runs:3044,  avg:33.5,  sr:147.6, wickets:null, economy:null,  hundreds:1,   fifties:18, catches:35  },
  "Tilak Verma":        { matches:38,  runs:892,   avg:28.1,  sr:118.9, wickets:null, economy:null,  hundreds:0,   fifties:5,  catches:9   },
  "Steve Smith":        { matches:92,  runs:2705,  avg:37.3,  sr:130.8, wickets:null, economy:null,  hundreds:3,   fifties:15, catches:31  },
  "Harmanpreet Kaur":   { matches:114, runs:3421,  avg:35.5,  sr:134.2, wickets:21,   economy:8.34,  hundreds:4,   fifties:21, catches:52  },
  "David Warner":       { matches:110, runs:3277,  avg:33.4,  sr:142.6, wickets:null, economy:null,  hundreds:1,   fifties:26, catches:44  },
  "Rohit Sharma":       { matches:156, runs:5326,  avg:41.7,  sr:140.5, wickets:null, economy:null,  hundreds:5,   fifties:32, catches:58  },
  "Rinku Singh":        { matches:18,  runs:421,   avg:29.4,  sr:145.7, wickets:null, economy:null,  hundreds:0,   fifties:2,  catches:4   },
  "Faf Du Plessis":     { matches:143, runs:4431,  avg:36.5,  sr:135.0, wickets:null, economy:null,  hundreds:4,   fifties:28, catches:52  },
  "Smriti Mandhana":    { matches:127, runs:3686,  avg:34.2,  sr:135.8, wickets:15,   economy:8.12,  hundreds:6,   fifties:25, catches:64  },
  // Bowlers
  "Kagiso Rabada":      { matches:84,  runs:null,  avg:null,  sr:null,  wickets:117,  economy:8.29,  hundreds:null, fifties:null, catches:28  },
  "Sarah Glenn":        { matches:78,  runs:null,  avg:null,  sr:null,  wickets:96,   economy:7.56,  hundreds:null, fifties:null, catches:24  },
  "Mohammed Shami":     { matches:86,  runs:null,  avg:null,  sr:null,  wickets:113,  economy:8.84,  hundreds:null, fifties:null, catches:21  },
  "Kuldeep Yadav":      { matches:68,  runs:null,  avg:null,  sr:null,  wickets:98,   economy:7.34,  hundreds:null, fifties:null, catches:18  },
  "Amelia Kerr":        { matches:92,  runs:null,  avg:null,  sr:null,  wickets:119,  economy:7.21,  hundreds:null, fifties:null, catches:31  },
  "Bhuvneshwar Kumar":  { matches:97,  runs:null,  avg:null,  sr:null,  wickets:128,  economy:8.01,  hundreds:null, fifties:null, catches:26  },
  "Yuzvendra Chahal":   { matches:84,  runs:null,  avg:null,  sr:null,  wickets:112,  economy:7.89,  hundreds:null, fifties:null, catches:19  },
  "Jasprit Bumrah":     { matches:120, runs:null,  avg:null,  sr:null,  wickets:145,  economy:7.39,  hundreds:null, fifties:null, catches:28  },
  "Trent Boult":        { matches:82,  runs:null,  avg:null,  sr:null,  wickets:108,  economy:8.32,  hundreds:null, fifties:null, catches:35  },
  "Rashid Khan":        { matches:118, runs:null,  avg:null,  sr:null,  wickets:169,  economy:6.71,  hundreds:null, fifties:null, catches:42  },
  "Sophie Ecclestone":  { matches:85,  runs:null,  avg:null,  sr:null,  wickets:107,  economy:7.14,  hundreds:null, fifties:null, catches:29  },
  "Mitchell Starc":     { matches:74,  runs:null,  avg:null,  sr:null,  wickets:99,   economy:8.65,  hundreds:null, fifties:null, catches:24  },
  "Mohammad Siraj":     { matches:52,  runs:null,  avg:null,  sr:null,  wickets:71,   economy:9.12,  hundreds:null, fifties:null, catches:14  },
  "Deepti Sharma":      { matches:94,  runs:null,  avg:null,  sr:null,  wickets:118,  economy:7.98,  hundreds:null, fifties:null, catches:38  },
  "Lasith Malinga":     { matches:122, runs:null,  avg:null,  sr:null,  wickets:170,  economy:8.41,  hundreds:null, fifties:null, catches:41  },
  "Dale Steyn":         { matches:104, runs:null,  avg:null,  sr:null,  wickets:151,  economy:8.23,  hundreds:null, fifties:null, catches:37  },
  "Zaheer Khan":        { matches:86,  runs:null,  avg:null,  sr:null,  wickets:121,  economy:8.67,  hundreds:null, fifties:null, catches:23  },
  "Morne Morkel":       { matches:89,  runs:null,  avg:null,  sr:null,  wickets:125,  economy:8.54,  hundreds:null, fifties:null, catches:31  },
  "Imran Tahir":        { matches:78,  runs:null,  avg:null,  sr:null,  wickets:104,  economy:7.76,  hundreds:null, fifties:null, catches:26  },
  "Sunil Narine":       { matches:95,  runs:1342,  avg:18.7,  sr:142.3, wickets:129,  economy:6.89,  hundreds:null, fifties:null, catches:34  },
  // Wicket-keepers
  "Quinton de Kock":    { matches:107, runs:3159,  avg:29.7,  sr:133.8, wickets:null, economy:null,  hundreds:4,   fifties:17, catches:116 },
  "Glenn Philips":      { matches:68,  runs:1956,  avg:31.2,  sr:148.6, wickets:null, economy:null,  hundreds:2,   fifties:12, catches:71  },
  "MS Dhoni":           { matches:98,  runs:2773,  avg:37.5,  sr:137.8, wickets:null, economy:null,  hundreds:1,   fifties:18, catches:84  },
  "Ishan Kishan":       { matches:52,  runs:1687,  avg:32.4,  sr:146.8, wickets:null, economy:null,  hundreds:2,   fifties:9,  catches:62  },
  "Dinesh Karthik":     { matches:97,  runs:2619,  avg:31.8,  sr:132.4, wickets:4,    economy:10.12, hundreds:1,   fifties:12, catches:68  },
  "Rishabh Pant":       { matches:82,  runs:2163,  avg:34.9,  sr:148.1, wickets:null, economy:null,  hundreds:1,   fifties:13, catches:89  },
  // All-rounders
  "Glenn Maxwell":      { matches:115, runs:2608,  avg:29.0,  sr:158.7, wickets:37,   economy:8.94,  hundreds:3,   fifties:15, catches:48  },
  "Hardik Pandya":      { matches:115, runs:2071,  avg:28.7,  sr:145.2, wickets:65,   economy:9.01,  hundreds:0,   fifties:12, catches:40  },
  "Ben Stokes":         { matches:115, runs:2347,  avg:26.1,  sr:128.4, wickets:74,   economy:8.82,  hundreds:1,   fifties:14, catches:53  },
  "Axar Patel":         { matches:72,  runs:1234,  avg:24.3,  sr:134.8, wickets:89,   economy:7.94,  hundreds:0,   fifties:6,  catches:32  },
  "Ravindra Jadeja":    { matches:88,  runs:1512,  avg:23.4,  sr:128.9, wickets:124,  economy:7.65,  hundreds:0,   fifties:8,  catches:41  },
  // Legends
  "AB de Villiers":     { matches:156, runs:5162,  avg:38.7,  sr:155.8, wickets:null, economy:null,  hundreds:1,   fifties:40, catches:29  },
  "Sachin Tendulkar":   { matches:100, runs:3640,  avg:41.3,  sr:138.2, wickets:null, economy:null,  hundreds:8,   fifties:18, catches:35  },
  "Chris Gayle":        { matches:121, runs:4005,  avg:37.2,  sr:147.2, wickets:null, economy:null,  hundreds:6,   fifties:23, catches:18  },
  "Kieron Pollard":     { matches:152, runs:3829,  avg:34.2,  sr:159.4, wickets:63,   economy:8.76,  hundreds:0,   fifties:27, catches:35  },
};

/* ─── LIVE BID PAGE ─────────────────────────────────────────── */
function LiveBidPage() {
  const { state, dispatch } = useAuction();
  const toast = useToast();
  const { livePlayerId, players, teams, currentUser } = state;
  const isAdmin = currentUser?.role === "admin";

  const [selTeam, setSelTeam] = useState(Object.keys(teams)[0]);
  const [bidVal, setBidVal] = useState("");
  const [pulse, setPulse] = useState(false);

  const player = players.find(p => p.id === livePlayerId);
  const stats = player ? PLAYER_STATS[player.name] : null;
  const isSold = !!player?.soldTo;
  const roleColor = player ? ROLE_COLORS[player.role] : "var(--accent)";

  useEffect(() => {
    if (!player) return;
    setPulse(true);
    const t = setTimeout(() => setPulse(false), 600);
    return () => clearTimeout(t);
  }, [livePlayerId, player]);

  const assign = () => {
    const price = parseAmount(bidVal) || player.base;
    if (price < player.base) { toast("Bid must be ≥ base price!", true); return; }
    const t = teams[selTeam];
    if (price > t.budget - t.spent) { toast(`${selTeam} budget exceeded!`, true); return; }
    if (!canAssignRole(players, selTeam, player.role)) {
      toast(`${selTeam} has reached the ${SLOT_LABELS[player.role]} limit (${SLOT_LIMITS[player.role]})!`, true); return;
    }
    dispatch({ type: "ASSIGN_PLAYER", payload: { id: player.id, team: selTeam, price } });
    dispatch({ type: "CLEAR_LIVE_PLAYER" });
    toast(`🔨 SOLD! ${player.name} → ${selTeam} for ${fmtCur(price)}`);
    setBidVal("");
  };

  const unsold = () => {
    dispatch({ type: "CLEAR_LIVE_PLAYER" });
    toast(`${player.name} marked as UNSOLD`, true);
  };

  const removeBid = () => {
    dispatch({ type: "CLEAR_LIVE_PLAYER" });
    toast(`Removed ${player.name} from live bid`);
  };

  const StatBox = ({ label, value, color = "var(--text)" }) => (
    <div style={{
      background: "var(--surface2)", border: "1px solid var(--border)",
      padding: "14px 16px", textAlign: "center", flex: 1, minWidth: 80,
    }}>
      <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 22, fontWeight: 700, color, lineHeight: 1 }}>{value ?? "—"}</div>
      <div style={{ fontSize: 10, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginTop: 6 }}>{label}</div>
    </div>
  );

  if (!player || isSold) {
    const unsoldPlayers = players.filter(p => !p.soldTo);
    return (
      <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
          <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
            LIVE <span style={{ color: "var(--accent)" }}>BIDDING</span>
          </div>
          {isSold && player && (
            <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--green)", background: "rgba(34,197,94,.1)", padding: "4px 12px", border: "1px solid rgba(34,197,94,.2)" }}>
              LAST SOLD: {player.name} → {player.soldTo}
            </span>
          )}
        </div>

        {/* Live squad status for all teams */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px,1fr))", gap: 12, marginBottom: 24 }}>
          {Object.entries(teams).map(([tName, tData]) => {
            const tp = players.filter(p => p.soldTo === tName);
            const rem = tData.budget - tData.spent;
            const pct = Math.round((rem / tData.budget) * 100);
            const canSeeBudget = isAdmin || currentUser?.team === tName;
            return (
              <div key={tName} style={{ background: "var(--surface)", border: `1px solid ${tData.color}33`, borderTop: `2px solid ${tData.color}`, padding: 14 }}>
                {/* Team Name */}
                <div style={{
                  fontFamily: "Oswald", fontSize: 14, fontWeight: 700, letterSpacing: 1,
                  color: tData.color, marginBottom: 10,
                }}>
                  {tName}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontSize: 10, fontFamily: "Share Tech Mono, monospace", color: "var(--muted)" }}>{tp.length}/{TOTAL_SQUAD}</span>
                </div>
                <TeamSlotsDisplay teamName={tName} players={players} compact />
                {canSeeBudget && (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                    <span style={{ fontSize: 10, color: "var(--muted)" }}>Budget left</span>
                    <span style={{ fontSize: 12, fontFamily: "Share Tech Mono, monospace", color: pct > 50 ? "var(--green)" : pct > 20 ? "var(--accent)" : "var(--red)" }}>{fmtCur(rem)}</span>
                  </div>
                )}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: "#a855f7", fontWeight: 700 }}>T20 Rating</span>
                  <span style={{ fontSize: 12, fontFamily: "Share Tech Mono, monospace", color: "#a855f7", fontWeight: 700 }}>{getTeamT20Rating(players, tName)}</span>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{
          border: "1px dashed var(--border)", padding: "60px 32px",
          textAlign: "center", marginBottom: 32,
        }}>
          <div style={{ fontSize: 48, marginBottom: 16, opacity: 0.3 }}>🏏</div>
          <div style={{ fontFamily: "Oswald", fontSize: 20, color: "var(--muted)", letterSpacing: 2, marginBottom: 8 }}>
            {isSold ? "PLAYER SOLD — SELECT NEXT" : "NO ACTIVE BID"}
          </div>
          <div style={{ fontSize: 13, color: "var(--muted)", letterSpacing: 1 }}>
            {isAdmin ? "Pick a player below or from the Auction page" : "Waiting for admin to set next player..."}
          </div>
        </div>

        {isAdmin && unsoldPlayers.length > 0 && (
          <>
            <div style={{ fontFamily: "Oswald", fontSize: 14, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 14 }}>
              Quick Select — Available Players ({unsoldPlayers.length})
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: 10 }}>
              {unsoldPlayers.map(p => (
                <button key={p.id} onClick={() => dispatch({ type: "SET_LIVE_PLAYER", payload: p.id })} style={{
                  background: "var(--surface)", border: `1px solid ${ROLE_COLORS[p.role]}44`,
                  padding: "12px 14px", cursor: "pointer", textAlign: "left",
                  display: "flex", alignItems: "center", gap: 10, transition: "all .2s",
                }}>
                  <PlayerAvatar name={p.name} role={p.role} size={36} photoUrl={p.photoUrl} />
                  <div>
                    <div style={{ fontFamily: "Oswald", fontSize: 13, fontWeight: 600, color: "var(--text)" }}>{p.name}</div>
                    <div style={{ fontSize: 11, color: ROLE_COLORS[p.role], marginTop: 2 }}>{ROLES[p.role]}</div>
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  const slotWarning = !canAssignRole(players, selTeam, player.role);

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1100, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
          LIVE <span style={{ color: "var(--accent)" }}>BIDDING</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{
            display: "inline-block", width: 8, height: 8, borderRadius: "50%",
            background: "var(--red)", boxShadow: "0 0 0 0 rgba(239,68,68,.4)",
            animation: "livePulse 1.5s infinite",
          }} />
          <span style={{ fontSize: 11, letterSpacing: 2, color: "var(--red)", fontWeight: 700 }}>ON AIR</span>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: 24, alignItems: "start" }}>
        <div>
          {/* Hero card */}
          <div style={{
            background: "var(--surface)", border: `1px solid ${roleColor}44`,
            borderTop: `4px solid ${roleColor}`, padding: 32, marginBottom: 20,
            position: "relative", overflow: "hidden",
            transform: pulse ? "scale(1.005)" : "scale(1)", transition: "transform .3s",
          }}>
            <div style={{ position: "absolute", top: -40, right: -40, width: 220, height: 220, borderRadius: "50%", background: roleColor + "08", pointerEvents: "none" }} />
            <div style={{ display: "flex", gap: 32, alignItems: "flex-start", position: "relative" }}>
              <div style={{ position: "relative", flex: "0 0 auto" }}>
                <PlayerAvatar name={player.name} role={player.role} size={260} photoUrl={player.photoUrl} />
                {isSold && (
                  <>
                    <style>{`
                      @keyframes ribbonFly {
                        0% { opacity: 1; transform: translateY(-100px) translateX(0) rotate(0deg); }
                        50% { opacity: 1; transform: translateY(-20px) translateX(80px) rotate(45deg); }
                        100% { opacity: 0; transform: translateY(80px) translateX(-100px) rotate(-45deg); }
                      }
                      @keyframes ribbonFly2 {
                        0% { opacity: 1; transform: translateY(-80px) translateX(0) rotate(30deg); }
                        50% { opacity: 1; transform: translateY(0) translateX(-70px) rotate(-20deg); }
                        100% { opacity: 0; transform: translateY(100px) translateX(60px) rotate(45deg); }
                      }
                      @keyframes ribbonFly3 {
                        0% { opacity: 1; transform: translateY(0) translateX(-100px) rotate(-45deg); }
                        50% { opacity: 1; transform: translateY(-40px) translateX(50px) rotate(20deg); }
                        100% { opacity: 0; transform: translateY(120px) translateX(-40px) rotate(60deg); }
                      }
                    `}</style>
                    <div style={{
                      position: "absolute", top: "50%", left: "50%", width: 300, height: 300,
                      transform: "translate(-50%, -50%)", pointerEvents: "none",
                    }}>
                      <div style={{
                        position: "absolute", width: 40, height: 120, background: "linear-gradient(135deg, #f5c518, #fbbf24)",
                        borderRadius: "50% 50%", opacity: 0.9, animation: "ribbonFly 2s ease-out infinite",
                        boxShadow: "0 4px 12px rgba(245, 197, 24, 0.4)",
                      }} />
                      <div style={{
                        position: "absolute", width: 35, height: 110, background: "linear-gradient(135deg, #fb7185, #ff6b9d)",
                        borderRadius: "50% 50%", opacity: 0.85, animation: "ribbonFly2 2.4s ease-out infinite 0.3s",
                        boxShadow: "0 4px 12px rgba(251, 113, 133, 0.4)",
                      }} />
                      <div style={{
                        position: "absolute", width: 38, height: 115, background: "linear-gradient(135deg, #60a5fa, #3b82f6)",
                        borderRadius: "50% 50%", opacity: 0.88, animation: "ribbonFly3 2.2s ease-out infinite 0.6s",
                        boxShadow: "0 4px 12px rgba(96, 165, 250, 0.4)",
                      }} />
                    </div>
                  </>
                )}
                <span style={{
                  position: "absolute", bottom: -6, left: "50%", transform: "translateX(-50%)",
                  fontSize: 9, fontWeight: 700, letterSpacing: 1.5, padding: "2px 8px",
                  background: roleColor + "22", color: roleColor, border: `1px solid ${roleColor}44`,
                  whiteSpace: "nowrap",
                }}>{ROLES[player.role]}</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "Oswald", fontSize: 38, fontWeight: 700, letterSpacing: 1, lineHeight: 1, marginBottom: 8 }}>{player.name}</div>
                <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap", marginBottom: 16 }}>
                  <span style={{ fontSize: 14, color: "var(--muted)", letterSpacing: 1 }}>{COUNTRY_FLAGS[player.country] || "🌍"} {player.country}</span>
                  <span style={{ fontSize: 14, color: "var(--muted)", letterSpacing: 1 }}>
                    Base: <span style={{ color: "var(--green)", fontFamily: "Share Tech Mono, monospace", fontSize: 15 }}>{fmtCur(player.base)}</span>
                  </span>
                </div>
                <div style={{ display: "inline-block", background: "rgba(245,197,24,.08)", border: "1px solid rgba(245,197,24,.2)", padding: "10px 20px" }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase" }}>BASE PRICE</div>
                  <div style={{ fontFamily: "Oswald", fontSize: 30, fontWeight: 700, color: "var(--accent)", lineHeight: 1.1 }}>{fmtCur(player.base)}</div>
                </div>
                <div style={{ display: "inline-block", background: "rgba(168, 85, 247, .08)", border: "1px solid rgba(168, 85, 247, .2)", padding: "10px 20px", marginLeft: 12 }}>
                  <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase" }}>T20 RATING</div>
                  <div style={{ fontFamily: "Oswald", fontSize: 30, fontWeight: 700, color: "#a855f7", lineHeight: 1.1 }}>{player.t20Rating}</div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          {stats && (
            <div style={{ marginBottom: 20 }}>
              <div style={{ fontFamily: "Oswald", fontSize: 13, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>T20 Career Stats</div>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <StatBox label="Matches" value={stats.matches} />
                {stats.runs != null    && <StatBox label="Runs"    value={stats.runs?.toLocaleString()} color="var(--blue)" />}
                {stats.avg != null     && <StatBox label="Avg"     value={stats.avg}     color="var(--green)" />}
                {stats.sr != null      && <StatBox label="S/R"     value={stats.sr}      color="var(--accent)" />}
                {stats.wickets != null && <StatBox label="Wickets" value={stats.wickets} color="var(--accent)" />}
                {stats.economy != null && <StatBox label="Economy" value={stats.economy} color={stats.economy < 8 ? "var(--green)" : "var(--red)"} />}
                {stats.hundreds != null && <StatBox label="100s"   value={stats.hundreds} color="var(--accent)" />}
                {stats.fifties != null  && <StatBox label="50s"    value={stats.fifties}  color="var(--text)" />}
                {stats.catches != null  && <StatBox label="Catches" value={stats.catches} color="var(--muted)" />}
              </div>
            </div>
          )}

          {/* Team budget strip — now with slot info */}
          {isAdmin && (
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {Object.entries(teams).map(([tName, tData]) => {
                const rem = tData.budget - tData.spent;
                const pct = Math.round((rem / tData.budget) * 100);
                const slotFull = !canAssignRole(players, tName, player.role);
                const slots = getTeamSlots(players, tName);
                return (
                  <div key={tName} style={{
                    background: "var(--surface2)", border: `1px solid ${slotFull ? "var(--red)33" : tData.color + "33"}`,
                    padding: "10px 14px", flex: 1, minWidth: 130,
                    opacity: slotFull ? 0.7 : 1,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: tData.color, marginBottom: 6, letterSpacing: 0.5 }}>{tName}</div>
                    <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 14, color: pct > 50 ? "var(--green)" : pct > 20 ? "var(--accent)" : "var(--red)" }}>{fmtCur(rem)}</div>
                    <div style={{ height: 3, background: "var(--border)", marginTop: 4, borderRadius: 2, overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, background: tData.color, transition: "width .4s" }} />
                    </div>
                    <div style={{ fontSize: 10, color: slotFull ? "var(--red)" : "var(--muted)", marginTop: 4 }}>
                      {slotFull
                        ? `⛔ ${SLOT_LABELS[player.role]} full`
                        : `${SLOT_LABELS[player.role]}: ${slots[player.role]}/${SLOT_LIMITS[player.role]}`}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT panel */}
        <div style={{ position: "sticky", top: 72 }}>
          {isAdmin ? (
            <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", padding: 24 }}>
              <div style={{ fontFamily: "Oswald", fontSize: 16, letterSpacing: 2, color: "var(--accent)", marginBottom: 20, textTransform: "uppercase" }}>Assign Player</div>

              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>Select Team</div>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {Object.entries(teams).map(([tName, tData]) => {
                    const rem = tData.budget - tData.spent;
                    const canAfford = rem >= (parseAmount(bidVal) || player.base);
                    const slotAvail = canAssignRole(players, tName, player.role);
                    const slots = getTeamSlots(players, tName);
                    return (
                      <button key={tName} onClick={() => setSelTeam(tName)} style={{
                        background: selTeam === tName ? tData.color + "22" : "var(--bg)",
                        border: `1px solid ${selTeam === tName ? tData.color : "var(--border)"}`,
                        padding: "10px 14px", cursor: slotAvail ? "pointer" : "not-allowed", textAlign: "left",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        opacity: (canAfford && slotAvail) ? 1 : 0.5,
                        boxShadow: tData.color === "#00d4ff" || tData.color === "#d946ef" ? `inset 0 0 0 1px rgba(255,255,255,0.4)` : "none",
                      }}>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, color: tData.color, marginBottom: 4, fontSize: 12, letterSpacing: 0.5 }}>{tName}</div>
                          {!slotAvail && <span style={{ fontSize: 9, color: "var(--red)", letterSpacing: 1 }}>⛔ {SLOT_LABELS[player.role]} SLOT FULL</span>}
                          {slotAvail && <span style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1 }}>{SLOT_LABELS[player.role]}: {slots[player.role]}/{SLOT_LIMITS[player.role]}</span>}
                        </div>
                        <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: "var(--muted)" }}>{fmtCur(rem)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div style={{ marginBottom: 20 }}>
                <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 8 }}>Winning Bid Amount</div>
                <input
                  type="text" value={bidVal}
                  onChange={e => setBidVal(e.target.value)}
                  placeholder={`Min: ${fmtCur(player.base)} (e.g., 10 or 1C)`}
                  style={{
                    width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                    color: "var(--accent)", fontFamily: "Share Tech Mono, monospace",
                    fontSize: 18, padding: "12px 14px", outline: "none", textAlign: "center", letterSpacing: 2,
                  }}
                />
                {bidVal && parseAmount(bidVal) < player.base && (
                  <div style={{ fontSize: 11, color: "var(--red)", marginTop: 6, letterSpacing: 1 }}>⚠ Below base price ({fmtCur(player.base)})</div>
                )}
              </div>

              {slotWarning && (
                <div style={{ fontSize: 11, color: "var(--red)", background: "rgba(239,68,68,.1)", border: "1px solid rgba(239,68,68,.3)", padding: "8px 12px", marginBottom: 12, letterSpacing: 1 }}>
                  ⛔ {selTeam} {SLOT_LABELS[player.role]} slot is full ({SLOT_LIMITS[player.role]}/{SLOT_LIMITS[player.role]})
                </div>
              )}

              <button onClick={assign} style={{
                width: "100%", background: slotWarning ? "rgba(239,68,68,.3)" : "var(--accent)",
                color: slotWarning ? "var(--red)" : "#000", border: slotWarning ? "1px solid var(--red)" : "none",
                fontFamily: "Oswald", fontSize: 18, fontWeight: 700, letterSpacing: 2,
                padding: "14px", cursor: "pointer", marginBottom: 10,
              }}>
                {slotWarning ? "⛔ SLOT FULL" : `🔨 SOLD TO ${selTeam.split(" ")[0]}`}
              </button>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={unsold} style={{
                  flex: 1, background: "none", border: "1px solid var(--muted)",
                  color: "var(--muted)", fontFamily: "Rajdhani, sans-serif", fontSize: 13,
                  fontWeight: 600, letterSpacing: 2, padding: "10px", cursor: "pointer",
                }}>MARK AS UNSOLD</button>
                <button onClick={removeBid} style={{
                  flex: 1, background: "none", border: "1px solid var(--red)",
                  color: "var(--red)", fontFamily: "Rajdhani, sans-serif", fontSize: 13,
                  fontWeight: 600, letterSpacing: 2, padding: "10px", cursor: "pointer",
                }}>REMOVE BID</button>
              </div>
            </div>
          ) : (
            <div style={{ background: "var(--surface)", border: `1px solid ${roleColor}33`, borderTop: `3px solid ${roleColor}`, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>Now Bidding</div>
              <PlayerAvatar name={player.name} role={player.role} size={80} photoUrl={player.photoUrl} />
              <div style={{ fontFamily: "Oswald", fontSize: 24, fontWeight: 700, marginTop: 12, letterSpacing: 1 }}>{player.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{player.country} · {ROLES[player.role]}</div>
              <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 20, color: "var(--green)", marginTop: 16 }}>{fmtCur(player.base)}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginTop: 4 }}>BASE PRICE</div>
              <div style={{ fontFamily: "Oswald", fontSize: 24, fontWeight: 700, color: "#a855f7", marginTop: 12 }}>{player.t20Rating}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginTop: 4 }}>T20 RATING</div>
              <div style={{ marginTop: 20, padding: "10px", background: "rgba(239,68,68,.08)", border: "1px solid rgba(239,68,68,.2)" }}>
                <span style={{ fontSize: 11, color: "var(--red)", letterSpacing: 2 }}>🔴 BIDDING IN PROGRESS</span>
              </div>
            </div>
          )}

          {isAdmin && (
            <button onClick={() => dispatch({ type: "SET_PAGE", payload: "auction" })} style={{
              width: "100%", marginTop: 10, background: "none",
              border: "1px solid var(--border)", color: "var(--muted)",
              fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 600,
              letterSpacing: 1.5, padding: "8px", cursor: "pointer",
            }}>← CHANGE PLAYER</button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes livePulse {
          0%   { box-shadow: 0 0 0 0 rgba(239,68,68,.5); }
          70%  { box-shadow: 0 0 0 8px rgba(239,68,68,0); }
          100% { box-shadow: 0 0 0 0 rgba(239,68,68,0); }
        }
      `}</style>
    </div>
  );
}

/* ─── HISTORY PAGE ──────────────────────────────────────────── */
function HistoryPage() {
  const { state } = useAuction();
  const { history, teams } = state;

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2 }}>
          AUCTION <span style={{ color: "var(--accent)" }}>HISTORY</span>
        </div>
        <span style={{ fontSize: 12, color: "var(--muted)", fontFamily: "Share Tech Mono, monospace" }}>{history.length} events</span>
      </div>

      {history.length === 0
        ? <div style={{ color: "var(--muted)", fontSize: 14, letterSpacing: 1, padding: "40px 0", textAlign: "center" }}>No auction events yet.</div>
        : <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {history.map(h => {
              const tColor = teams[h.team]?.color || "#888";
              const isSold = h.action === "SOLD";
              const isReturned = h.action === "RETURNED";
              const isBudgetAction = h.action === "BUDGET_ADD" || h.action === "BUDGET_SET";
              const borderColor = isSold ? "var(--green)" : isBudgetAction ? "var(--blue)" : "var(--red)";
              const badgeBg = isSold ? "rgba(34,197,94,.15)" : isBudgetAction ? "rgba(59,130,246,.15)" : "rgba(239,68,68,.15)";
              const badgeColor = isSold ? "var(--green)" : isBudgetAction ? "var(--blue)" : "var(--red)";
              
              return (
                <div key={h.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderLeft: `3px solid ${borderColor}`,
                  padding: "12px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "2px 8px",
                    background: badgeBg,
                    color: badgeColor,
                  }}>{h.action}</span>
                  <span style={{ fontFamily: "Oswald", fontSize: 16, fontWeight: 600, flex: 1 }}>{h.playerName}</span>
                  {isSold && <>
                    <span style={{ fontSize: 13, color: tColor, fontWeight: 700 }}>→ {h.team}</span>
                    <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 13, color: "var(--accent)" }}>{fmtCur(h.price)}</span>
                  </>}
                  {isBudgetAction && <>
                    <span style={{ fontSize: 13, color: tColor, fontWeight: 700 }}>🔹 {h.team}</span>
                    <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 13, color: "var(--accent)" }}>{fmtCur(h.price)}</span>
                  </>}
                  {isReturned && <span style={{ fontSize: 12, color: "var(--muted)" }}>from {h.team} — {fmtCur(h.price)}</span>}
                  <span style={{ fontSize: 11, color: "var(--border)", fontFamily: "Share Tech Mono, monospace", marginLeft: "auto" }}>{fmtTime(h.ts)}</span>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

/* ─── BUDGET MANAGEMENT PAGE (ADMIN) ────────────────────────── */
function BudgetManagementPage() {
  const { state, dispatch } = useAuction();
  const toast = useToast();

  const handleAddFunds = (teamName, amount) => {
    const amt = parseAmount(amount);
    if (!amount.trim() || amt <= 0) { toast("Please enter a valid amount!", true); return; }
    dispatch({ type: "ADD_TEAM_FUNDS", payload: { teamName, amount: amt } });
    toast(`✅ ${fmtCur(amt)} added to ${teamName}!`);
    document.getElementById(`add-${teamName}`).value = "";
  };

  const handleSetBudget = (teamName, amount) => {
    const newBudget = parseAmount(amount);
    if (!amount.trim() || newBudget < 0) { toast("Please enter a valid budget!", true); return; }
    dispatch({ type: "SET_BUDGET", payload: { teamName, budget: newBudget } });
    toast(`✅ ${teamName} budget set to ${fmtCur(newBudget)}!`);
    document.getElementById(`set-${teamName}`).value = "";
  };

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 24, paddingBottom: 16, borderBottom: "1px solid var(--border)", color: "var(--accent)" }}>
        💰 BUDGET MANAGEMENT
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
        {Object.keys(TEAMS_INIT).map((teamName) => {
          const teamData = state.teams[teamName];
          const remaining = teamData.budget - teamData.spent;
          const percentUsed = Math.round((teamData.spent / teamData.budget) * 100);

          return (
            <div key={teamName} style={{
              background: "var(--surface)", border: `1px solid ${teamData.color}33`, borderTop: `3px solid ${teamData.color}`,
              padding: 20, borderRadius: 6,
            }}>
              {/* Team Header */}
              <div style={{
                fontFamily: "Oswald", fontSize: 16, fontWeight: 700, color: teamData.color,
                letterSpacing: 1, marginBottom: 12,
                padding: "0",
                borderRadius: "2px",
                display: "inline-block",
              }}>
                {teamName}
              </div>

              {/* Budget Info */}
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, marginBottom: 4 }}>TOTAL</div>
                  <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 18, fontWeight: 700, color: "var(--accent)" }}>
                    {fmtCur(teamData.budget)}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, marginBottom: 4 }}>SPENT</div>
                  <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 18, fontWeight: 700, color: percentUsed > 90 ? "var(--red)" : "var(--accent)" }}>
                    {fmtCur(teamData.spent)}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div style={{ marginBottom: 12 }}>
                <div style={{ height: 4, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${percentUsed}%`, background: percentUsed > 90 ? "var(--red)" : percentUsed > 70 ? "var(--accent)" : "var(--green)",
                    transition: "width .3s",
                  }} />
                </div>
                <div style={{ fontSize: 9, color: "var(--muted)", marginTop: 6 }}>{percentUsed}% used • {fmtCur(remaining)} left</div>
              </div>

              {/* Add Funds */}
              <div style={{ marginBottom: 10, display: "flex", gap: 6 }}>
                <input
                  id={`add-${teamName}`}
                  type="text" placeholder="Add (e.g., 5 or 50L)" defaultValue=""
                  onKeyDown={(e) => e.key === "Enter" && handleAddFunds(teamName, e.target.value)}
                  style={{
                    flex: 1, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                    fontFamily: "Share Tech Mono, monospace", fontSize: 12, padding: "8px 10px", outline: "none", borderRadius: 3,
                  }}
                />
                <button onClick={(e) => { e.stopPropagation(); handleAddFunds(teamName, document.getElementById(`add-${teamName}`).value); }} style={{
                  background: "var(--green)", color: "#000", border: "none", fontFamily: "Oswald",
                  fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", borderRadius: 3, whiteSpace: "nowrap",
                }}>➕ ADD</button>
              </div>

              {/* Set Budget */}
              <div style={{ display: "flex", gap: 6, marginBottom: 6 }}>
                <input
                  id={`set-${teamName}`}
                  type="text" placeholder="Set (e.g., 7 or 700L)" defaultValue=""
                  onKeyDown={(e) => e.key === "Enter" && handleSetBudget(teamName, e.target.value)}
                  style={{
                    flex: 1, background: "var(--bg)", border: "1px solid var(--border)", color: "var(--text)",
                    fontFamily: "Share Tech Mono, monospace", fontSize: 12, padding: "8px 10px", outline: "none", borderRadius: 3,
                  }}
                />
                <button onClick={(e) => { e.stopPropagation(); handleSetBudget(teamName, document.getElementById(`set-${teamName}`).value); }} style={{
                  background: "var(--blue)", color: "#fff", border: "none", fontFamily: "Oswald",
                  fontSize: 12, fontWeight: 700, padding: "8px 14px", cursor: "pointer", borderRadius: 3, whiteSpace: "nowrap",
                }}>⚙ SET</button>
              </div>
              <div style={{ fontSize: 8, color: "var(--muted)", letterSpacing: 0.5 }}>Format: integer (crores), 50L, or 2.5C</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── MANAGE PLAYERS PAGE (ADMIN) ───────────────────────────── */
function ManagePlayersPage() {
  const { state, dispatch } = useAuction();
  const toast = useToast();
  const { players } = state;

  const [filterRole, setFilterRole] = useState("ALL");
  const [confirmDel, setConfirmDel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPass, setResetPass] = useState("");

  const delPlayer = (id) => {
    const p = players.find(x => x.id === id);
    dispatch({ type: "DELETE_PLAYER", payload: { id } });
    toast(`${p?.name} removed from pool${p?.soldTo ? " (budget returned)" : ""}`);
    setConfirmDel(null);
  };

  const startEdit = (player) => {
    setEditingId(player.id);
    setEditForm({ name: player.name, base: fmtCur(player.base).replace("₹", "").replace(" Cr", "").trim() });
  };

  const saveEdit = (id) => {
    const player = players.find(p => p.id === id);
    if (!editForm.name.trim()) { toast("Player name required!", true); return; }
    const newBase = parseLakh(editForm.base) || player.base;
    if (players.find(p => p.id !== id && p.name.toLowerCase() === editForm.name.trim().toLowerCase())) {
      toast("Another player with that name already exists!", true); return;
    }
    dispatch({
      type: "EDIT_PLAYER",
      payload: { id, updates: { name: editForm.name.trim(), base: newBase } }
    });
    toast(`✅ ${editForm.name.trim()} updated!`);
    setEditingId(null);
  };

  const resetAuction = () => {
    if (resetPass !== "admin123") { toast("Invalid admin password!", true); return; }
    dispatch({ type: "RESET_AUCTION" });
    toast("✅ Auction reset! Play another round.");
    setShowResetConfirm(false);
    setResetPass("");
  };

  const filteredPlayers = filterRole === "ALL" ? players : players.filter(p => p.role === filterRole);
  const roleStats = Object.fromEntries(Object.keys(SLOT_LIMITS).map(r => [r, players.filter(p => p.role === r).length]));

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 8, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        ⚙ MANAGE <span style={{ color: "var(--accent)" }}>PLAYERS</span>
        <span style={{ fontSize: 12, fontFamily: "Rajdhani, sans-serif", fontWeight: 400, color: "var(--muted)", letterSpacing: 2, marginLeft: 16 }}>ADMIN ONLY</span>
      </div>

      {/* Pool summary */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 20 }}>
        {Object.entries(SLOT_LIMITS).map(([r, lim]) => (
          <div key={r} style={{
            background: "var(--surface)", border: `1px solid ${ROLE_COLORS[r]}33`,
            borderTop: `2px solid ${ROLE_COLORS[r]}`,
            padding: "12px 16px", minWidth: 130, textAlign: "center",
          }}>
            <div style={{ fontSize: 10, letterSpacing: 2, color: ROLE_COLORS[r], textTransform: "uppercase", marginBottom: 6 }}>{SLOT_LABELS[r]}</div>
            <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, color: "var(--text)" }}>{roleStats[r]}</div>
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>in pool · {lim}/team limit</div>
          </div>
        ))}
        <div style={{
          background: "var(--surface)", border: "1px solid var(--border)",
          padding: "12px 16px", minWidth: 130, textAlign: "center",
        }}>
          <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Total Pool</div>
          <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, color: "var(--accent)" }}>{players.length}</div>
          <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 2 }}>{players.filter(p => p.soldTo).length} sold</div>
        </div>
      </div>

      {/* PLAYER LIST */}
      <div>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 16, alignItems: "center" }}>
          {["ALL", "BAT", "BWL", "WK", "AR"].map(r => (
              <button key={r} onClick={() => setFilterRole(r)} style={{
                background: filterRole === r ? "var(--accent)" : "var(--surface)",
                border: `1px solid ${filterRole === r ? "var(--accent)" : "var(--border)"}`,
                color: filterRole === r ? "#000" : "var(--muted)",
                fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 700,
                letterSpacing: 1.5, padding: "5px 12px", cursor: "pointer", textTransform: "uppercase",
              }}>
                {r === "ALL" ? `ALL (${players.length})` : `${r === "BAT" ? "BAT" : r === "BWL" ? "BWL" : r === "WK" ? "WK" : "AR"} (${roleStats[r]})`}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredPlayers.map(p => (
              editingId === p.id ? (
                <div key={p.id} style={{
                  background: "var(--accent)", color: "#000", border: "2px solid var(--accent)",
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                  fontWeight: 600, borderRadius: "4px",
                }}>
                  <input
                    type="text" value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))}
                    style={{
                      flex: 1, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,0,0,0.3)", color: "#000",
                      padding: "6px 10px", fontFamily: "Rajdhani, sans-serif", fontSize: 14, outline: "none",
                    }}
                  />
                  <input
                    type="text" value={editForm.base} onChange={e => setEditForm(f => ({ ...f, base: e.target.value }))}
                    placeholder="3" style={{
                      width: 80, background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,0,0,0.3)", color: "#000",
                      padding: "6px 10px", fontFamily: "Share Tech Mono, monospace", fontSize: 13, outline: "none",
                    }}
                  />
                  <button onClick={() => saveEdit(p.id)} style={{
                    background: "#000", color: "var(--accent)", border: "none",
                    fontFamily: "Rajdhani", fontSize: 11, fontWeight: 700, padding: "6px 12px", cursor: "pointer",
                  }}>✓ SAVE</button>
                  <button onClick={() => setEditingId(null)} style={{
                    background: "rgba(0,0,0,0.3)", color: "#000", border: "none",
                    fontFamily: "Rajdhani", fontSize: 11, padding: "6px 12px", cursor: "pointer",
                  }}>✕ CANCEL</button>
                </div>
              ) : (
                <div key={p.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderLeft: `3px solid ${ROLE_COLORS[p.role]}`,
                  padding: "12px 16px", display: "flex", alignItems: "center", gap: 12,
                }}>
                  <PlayerAvatar name={p.name} role={p.role} size={40} photoUrl={p.photoUrl} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                      <span style={{ fontFamily: "Oswald", fontSize: 15, fontWeight: 600 }}>{p.name}</span>
                      <span style={{ fontSize: 9, padding: "2px 6px", background: ROLE_COLORS[p.role] + "22", color: ROLE_COLORS[p.role], border: `1px solid ${ROLE_COLORS[p.role]}44`, letterSpacing: 1 }}>{ROLES[p.role]}</span>
                      {p.soldTo && <span style={{ fontSize: 9, color: "var(--green)", background: "rgba(34,197,94,.1)", border: "1px solid rgba(34,197,94,.3)", padding: "2px 6px", letterSpacing: 1 }}>SOLD → {p.soldTo}</span>}
                    </div>
                    <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
                      {p.country} · Base: <span style={{ color: "var(--green)", fontFamily: "Share Tech Mono, monospace" }}>{fmtCur(p.base)}</span>
                      {p.soldTo && <span style={{ color: "var(--accent)", fontFamily: "Share Tech Mono, monospace", marginLeft: 8 }}>Sold: {fmtCur(p.soldPrice)}</span>}
                    </div>
                  </div>
                  <div style={{ fontSize: 10, color: "var(--muted)", textAlign: "right", minWidth: 60 }}>
                    <div style={{ fontFamily: "Share Tech Mono, monospace" }}>#{p.id}</div>
                    {p.photoUrl ? <div style={{ color: ROLE_COLORS[p.role], marginTop: 2 }}>📷 photo</div> : <div style={{ marginTop: 2 }}>initials</div>}
                  </div>
                  <button onClick={() => startEdit(p)} style={{
                    background: "none", border: "1px solid var(--accent)", color: "var(--accent)",
                    fontFamily: "Rajdhani", fontSize: 11, fontWeight: 600, letterSpacing: 1,
                    padding: "5px 10px", cursor: "pointer", marginRight: 4,
                  }}>✎ EDIT</button>
                  {confirmDel === p.id ? (
                    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                      <span style={{ fontSize: 11, color: "var(--red)", whiteSpace: "nowrap" }}>Confirm?</span>
                      <button onClick={() => delPlayer(p.id)} style={{
                        background: "var(--red)", color: "#fff", border: "none",
                        fontFamily: "Rajdhani", fontSize: 11, fontWeight: 700, padding: "4px 10px", cursor: "pointer",
                      }}>YES</button>
                      <button onClick={() => setConfirmDel(null)} style={{
                        background: "none", color: "var(--muted)", border: "1px solid var(--border)",
                        fontFamily: "Rajdhani", fontSize: 11, padding: "4px 10px", cursor: "pointer",
                      }}>NO</button>
                    </div>
                  ) : (
                    <button onClick={() => setConfirmDel(p.id)} style={{
                      background: "none", border: "1px solid var(--red)", color: "var(--red)",
                      fontFamily: "Rajdhani", fontSize: 11, fontWeight: 600, letterSpacing: 1,
                      padding: "5px 10px", cursor: "pointer",
                    }}>🗑 REMOVE</button>
                  )}
                </div>
              )
            ))}
          </div>
        </div>

      {/* TEAM MANAGEMENT SECTION */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 16, color: "var(--accent)" }}>
          👥 EDIT TEAMS
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 24 }}>
          {/* Teams Overview */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", padding: 20 }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
              {Object.keys(TEAMS_INIT).map((teamName) => {
                const teamData = state.teams[teamName];
                return (
                  <div key={teamName} style={{
                    background: "var(--bg)", border: `2px solid ${teamData.color}`,
                    padding: "12px", borderRadius: "3px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: 4, fontFamily: "Rajdhani, sans-serif", fontSize: 12 }}>
                        {teamName}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 10, fontFamily: "Share Tech Mono, monospace" }}>
                        Budget: {fmtCur(teamData.budget)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* TEAM CREDENTIALS SECTION */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 16, color: "var(--accent)" }}>
          🔑 TEAM CREDENTIALS
        </div>
        <div style={{
          display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16,
        }}>
          {Object.keys(TEAMS_INIT).map((teamName) => {
            const creds = state.teamCredentials[teamName];
            const teamData = state.teams[teamName];
            return (
              <div key={teamName} style={{
                background: "var(--surface)", border: `2px solid ${teamData?.color}44`,
                borderLeft: `4px solid ${teamData?.color}`, padding: 16, borderRadius: 4,
              }}>
                <div style={{
                  fontFamily: "Oswald", fontSize: 13, fontWeight: 700, letterSpacing: 1,
                  color: teamData?.color, marginBottom: 12,
                  padding: "0",
                  borderRadius: "2px",
                  display: "inline-block",
                }}>
                  {teamName}
                </div>
                <div style={{ marginBottom: 12 }}>
                  <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Username</div>
                  <div style={{
                    fontFamily: "Share Tech Mono, monospace", fontSize: 12, color: "var(--text)",
                    background: "var(--bg)", padding: "8px 10px", borderRadius: 3, wordBreak: "break-all",
                  }}>
                    {teamName}
                  </div>
                </div>
                <div>
                  <div style={{ fontSize: 9, color: "var(--muted)", letterSpacing: 1, marginBottom: 4, textTransform: "uppercase" }}>Password</div>
                  <div style={{
                    fontFamily: "Share Tech Mono, monospace", fontSize: 13, fontWeight: 700, color: "var(--accent)",
                    background: "var(--bg)", padding: "10px", borderRadius: 3, letterSpacing: 1.5,
                  }}>
                    {creds?.pass || "—"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* GAME CONTROL SECTION */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 16, color: "var(--red)" }}>
          ⚠ GAME CONTROL
        </div>

        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)} style={{
            background: "var(--accent)", color: "#000", border: "none",
            fontFamily: "Oswald", fontSize: 14, fontWeight: 600, letterSpacing: 1.5,
            padding: "12px 24px", cursor: "pointer",
          }}>🔄 NEW GAME</button>
        ) : (
          <div style={{ background: "var(--surface)", border: "2px solid var(--accent)", padding: 20, borderRadius: "4px" }}>
            <div style={{ fontSize: 12, color: "var(--accent)", marginBottom: 16, fontWeight: 600 }}>
              ℹ Resetting auction pool & budgets for a new game. Admin password required.
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Admin Password</div>
              <input
                type="password" value={resetPass} onChange={e => setResetPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && resetAuction()}
                placeholder="Enter admin password"
                style={{
                  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                  color: "var(--text)", fontFamily: "Share Tech Mono, monospace", fontSize: 14,
                  padding: "9px 12px", outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={resetAuction} style={{
                background: "var(--accent)", color: "#000", border: "none",
                fontFamily: "Rajdhani", fontSize: 12, fontWeight: 700, letterSpacing: 1,
                padding: "8px 16px", cursor: "pointer",
              }}>CONFIRM RESET</button>
              <button onClick={() => { setShowResetConfirm(false); setResetPass(""); }} style={{
                background: "none", border: "1px solid var(--border)", color: "var(--muted)",
                fontFamily: "Rajdhani", fontSize: 12, padding: "8px 16px", cursor: "pointer",
              }}>CANCEL</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
const GlobalStyles = () => {
  const { theme } = useTheme();
  const isDark = theme === "dark";
  
  const darkVars = `
    --bg: #0a0c0f; --surface: #111418; --surface2: #181c22;
    --border: #2a2f38; --accent: #f5c518; --green: #22c55e;
    --red: #ef4444; --blue: #3b82f6; --text: #e8eaf0; --muted: #6b7280;
  `;
  
  const lightVars = `
    --bg: #f8f9fa; --surface: #ffffff; --surface2: #f1f3f5;
    --border: #d1d5db; --accent: #f59e0b; --green: #10b981;
    --red: #ef4444; --blue: #3b82f6; --text: #1f2937; --muted: #9ca3af;
  `;
  
  return (
    <style>{`
      :root {
        ${isDark ? darkVars : lightVars}
      }
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { background: var(--bg); color: var(--text); font-family: Rajdhani, sans-serif; min-height: 100vh; overflow-x: hidden; transition: background 0.3s, color 0.3s; }
      body::before {
        content: ''; position: fixed; inset: 0; pointer-events: none; z-index: 0;
        background-image:
          repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(245,197,24,.025) 40px, rgba(245,197,24,.025) 41px),
          repeating-linear-gradient(90deg, transparent, transparent 40px, rgba(245,197,24,.025) 40px, rgba(245,197,24,.025) 41px);
      }
      input[type=number]::-webkit-inner-spin-button { -webkit-appearance: none; }
      select option { background: var(--bg); color: var(--text); }
      @keyframes slideIn { from { transform: translateX(120%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
      ::-webkit-scrollbar { width: 6px; height: 6px; }
      ::-webkit-scrollbar-track { background: var(--bg); }
      ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 3px; }
      button { transition: all .2s; }
      button:hover { opacity: .88; }
      button:active { transform: scale(.97); }
    `}</style>
  );
};

/* ─── APP ROOT ──────────────────────────────────────────────── */
function AppInner() {
  const { state } = useAuction();
  const { currentUser, page } = state;

  if (!currentUser) return <LoginPage />;

  const pages = {
    auction:  AuctionPage,
    livebid:  LiveBidPage,
    display:  DisplayPage,
    squads:   TeamSquadsPage,
    team:     TeamPage,
    overview: OverviewPage,
    history:  HistoryPage,
    manage:   ManagePlayersPage,
    budget:   BudgetManagementPage,
  };
  const CurrentPage = pages[page] || AuctionPage;

  return (
    <div style={{ position: "relative", zIndex: 1 }}>
      <TopBar />
      <CurrentPage />
    </div>
  );
}

export default function App() {
  return (
    <>
      <FontLoader />
      <ThemeProvider>
        <GlobalStyles />
        <AuctionProvider>
          <ToastProvider>
            <AppInner />
          </ToastProvider>
        </AuctionProvider>
      </ThemeProvider>
    </>
  );
}
