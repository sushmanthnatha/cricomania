
// ============================================================
//  CRICOMANIA AUCTION — React + Context API + useReducer + Firebase
//  Enhanced: slot limits, admin player management, photo support, real-time sync
// ============================================================
import { createContext, useContext, useReducer, useState, useEffect, useCallback, useRef } from "react";
import { 
  initializeAuctionData, 
  subscribeToAuction, 
  updateAuctionData,
  signInUser 
} from "./firebase";

/* ─── GOOGLE FONTS ─────────────────────────────────────────── */
const FontLoader = () => (
  <style>{`@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Rajdhani:wght@400;500;600;700&family=Share+Tech+Mono&display=swap');`}</style>
);

/* ─── CONSTANTS ─────────────────────────────────────────────── */
const BUDGET = 10_00_00_000; // 10 Crore

// ── TEAM SLOT LIMITS ──────────────────────────────────────────
const SLOT_LIMITS = { BAT: 4, BWL: 4, WK: 1, AR: 2 };
const SLOT_LABELS = { BAT: "Batsmen", BWL: "Bowlers", WK: "Wicket-keeper", AR: "All-Rounders" };
const TOTAL_SQUAD = Object.values(SLOT_LIMITS).reduce((a, b) => a + b, 0); // 11

const USERS = {
  admin:     { pass: "admin123",   role: "admin", team: null,                      label: "ADMIN" },
  mi_mgr:    { pass: "mi2024",     role: "team",  team: "MUMBAI INDIANS",         label: "MUMBAI INDIANS" },
  csk_mgr:   { pass: "csk2024",    role: "team",  team: "CHENNAI SUPER KINGS",   label: "CHENNAI SUPER KINGS" },
  rcb_mgr:   { pass: "rcb2024",    role: "team",  team: "ROYAL CHALLENGERS",     label: "ROYAL CHALLENGERS" },
};

const TEAMS_INIT = {
  "MUMBAI INDIANS":       { budget: BUDGET, spent: 0, color: "#004687" },
  "CHENNAI SUPER KINGS":  { budget: BUDGET, spent: 0, color: "#ffc32f" },
  "ROYAL CHALLENGERS":    { budget: BUDGET, spent: 0, color: "#ec1c24" },
};

const ROLES = { BAT: "Batsman", BWL: "Bowler", WK: "Wicketkeeper", AR: "All-Rounder" };
const ROLE_COLORS = { BAT: "#60a5fa", BWL: "#fb7185", WK: "#0891b2", AR: "#fbbf24" };

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
// Run: node download-player-images.js to download all player images
const PLAYER_PHOTOS = {
  "Rohit Sharma":      "/players/rohit_sharma.png",
  "David Warner":      "/players/david_warner.jpg",
  "Babar Azam":        "/players/babar_azam.jpg",
  "Faf du Plessis":    "/players/faf_du_plessis.jpg",
  "KL Rahul":          "/players/kl_rahul.jpg",
  "Kane Williamson":   "/players/kane_williamson.jpg",
  "Travis Head":       "/players/travis_head.jpg",
  "Jasprit Bumrah":    "/players/jasprit_bumrah.jpg",
  "Pat Cummins":       "/players/pat_cummins.jpg",
  "Rashid Khan":       "/players/rashid_khan.jpg",
  "Mitchell Starc":    "/players/mitchell_starc.jpg",
  "Kagiso Rabada":     "/players/kagiso_rabada.jpg",
  "Trent Boult":       "/players/trent_boult.jpg",
  "Mohammed Shami":    "/players/mohammed_shami.jpg",
  "Shaheen Afridi":    "/players/shaheen_afridi.jpg",
  "MS Dhoni":          "/players/ms_dhoni.jpg",
  "Jos Buttler":       "/players/jos_buttler.jpg",
  "Rishabh Pant":      "/players/rishabh_pant.jpg",
  "Heinrich Klaasen":  "/players/heinrich_klaasen.jpg",
  "Quinton de Kock":   "/players/quinton_de_kock.jpg",
  "Ben Stokes":        "/players/ben_stokes.jpg",
  "Hardik Pandya":     "/players/hardik_pandya.jpg",
  "Shakib Al Hasan":   "/players/shakib_al_hasan.jpg",
  "Andre Russell":     "/players/andre_russell.jpg",
  "Glenn Maxwell":     "/players/glenn_maxwell.jpg",
  "Marcus Stoinis":    "/players/marcus_stoinis.jpg",
};

const PLAYERS_INIT = [
  { id:1,  name:"Rohit Sharma",    role:"BAT", country:"India",       base:50000000 },
  { id:2,  name:"David Warner",    role:"BAT", country:"Australia",   base:40000000 },
  { id:3,  name:"Babar Azam",      role:"BAT", country:"Pakistan",    base:45000000 },
  { id:4,  name:"Faf du Plessis",  role:"BAT", country:"S. Africa",   base:35000000 },
  { id:5,  name:"KL Rahul",        role:"BAT", country:"India",       base:40000000 },
  { id:6,  name:"Kane Williamson", role:"BAT", country:"New Zealand", base:35000000 },
  { id:7,  name:"Travis Head",     role:"BAT", country:"Australia",   base:30000000 },
  { id:8,  name:"Jasprit Bumrah",  role:"BWL", country:"India",       base:60000000 },
  { id:9,  name:"Pat Cummins",     role:"BWL", country:"Australia",   base:55000000 },
  { id:10, name:"Rashid Khan",     role:"BWL", country:"Afghanistan", base:50000000 },
  { id:11, name:"Mitchell Starc",  role:"BWL", country:"Australia",   base:45000000 },
  { id:12, name:"Kagiso Rabada",   role:"BWL", country:"S. Africa",   base:40000000 },
  { id:13, name:"Trent Boult",     role:"BWL", country:"New Zealand", base:35000000 },
  { id:14, name:"Mohammed Shami",  role:"BWL", country:"India",       base:40000000 },
  { id:15, name:"Shaheen Afridi",  role:"BWL", country:"Pakistan",    base:35000000 },
  { id:16, name:"MS Dhoni",        role:"WK",  country:"India",       base:60000000 },
  { id:17, name:"Jos Buttler",     role:"WK",  country:"England",     base:50000000 },
  { id:18, name:"Rishabh Pant",    role:"WK",  country:"India",       base:50000000 },
  { id:19, name:"Heinrich Klaasen",role:"WK",  country:"S. Africa",   base:30000000 },
  { id:20, name:"Quinton de Kock", role:"WK",  country:"S. Africa",   base:32000000 },
  { id:21, name:"Ben Stokes",      role:"AR",  country:"England",     base:55000000 },
  { id:22, name:"Hardik Pandya",   role:"AR",  country:"India",       base:50000000 },
  { id:23, name:"Shakib Al Hasan", role:"AR",  country:"Bangladesh",  base:30000000 },
  { id:24, name:"Andre Russell",   role:"AR",  country:"West Indies", base:45000000 },
  { id:25, name:"Glenn Maxwell",   role:"AR",  country:"Australia",   base:40000000 },
  { id:26, name:"Marcus Stoinis",  role:"AR",  country:"Australia",   base:25000000 },
].map(p => ({ ...p, soldTo: null, soldPrice: null, photoUrl: PLAYER_PHOTOS[p.name] || null }));

// Currency in crores. 1 Cr = 1,00,00,000
const fmtCur = n => {
  if (n == null || isNaN(n)) return "₹0";
  if (n >= 1_00_00_000) return "₹" + (n / 1_00_00_000).toFixed(2) + " Cr";
  if (n >= 1_00_000)    return "₹" + (n / 1_00_000).toFixed(2) + " L";
  if (n >= 1_000)       return "₹" + (n / 1_000).toFixed(0) + "K";
  return "₹" + n;
};
// Parse crore input: accepts "1.5" → 1.5 Cr = 1,50,00,000
const parseCr = v => {
  const n = parseFloat(v);
  return isNaN(n) ? 0 : Math.round(n * 1_00_00_000);
};
const fmtTime = ts => new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });

/* ─── SLOT HELPERS ──────────────────────────────────────────── */
function getTeamSlots(players, teamName) {
  const tp = players.filter(p => p.soldTo === teamName);
  const counts = { BAT: 0, BWL: 0, WK: 0, AR: 0 };
  tp.forEach(p => { counts[p.role] = (counts[p.role] || 0) + 1; });
  return counts;
}

function canAssignRole(players, teamName, role) {
  const counts = getTeamSlots(players, teamName);
  return counts[role] < SLOT_LIMITS[role];
}

/* ─── RANDOM STAT GENERATOR ─────────────────────────────────── */
function generateStats(role) {
  const rnd = (lo, hi, dec = 0) => {
    const v = lo + Math.random() * (hi - lo);
    return dec ? parseFloat(v.toFixed(dec)) : Math.round(v);
  };
  if (role === "BAT") return {
    matches: rnd(30, 150), runs: rnd(800, 5000), avg: rnd(22, 55, 1),
    sr: rnd(115, 170, 1), wickets: null, economy: null,
    hundreds: rnd(0, 6), fifties: rnd(5, 35), catches: rnd(10, 60),
  };
  if (role === "BWL") return {
    matches: rnd(30, 130), runs: null, avg: null, sr: null,
    wickets: rnd(40, 180), economy: rnd(6.5, 9.8, 2),
    hundreds: null, fifties: null, catches: rnd(10, 45),
  };
  if (role === "WK") return {
    matches: rnd(40, 200), runs: rnd(600, 4000), avg: rnd(20, 48, 1),
    sr: rnd(120, 160, 1), wickets: null, economy: null,
    hundreds: rnd(0, 4), fifties: rnd(5, 28), catches: rnd(40, 130),
  };
  if (role === "AR") return {
    matches: rnd(50, 140), runs: rnd(900, 3500), avg: rnd(18, 40, 1),
    sr: rnd(125, 180, 1), wickets: rnd(20, 130), economy: rnd(7.5, 10.2, 2),
    hundreds: rnd(0, 3), fifties: rnd(4, 20), catches: rnd(20, 65),
  };
  return {};
}

/* ─── REDUCER ───────────────────────────────────────────────── */
const initialState = {
  currentUser: null,
  players: JSON.parse(localStorage.getItem("cm_players") || "null") || PLAYERS_INIT,
  teams:   JSON.parse(localStorage.getItem("cm_teams")   || "null") || JSON.parse(JSON.stringify(TEAMS_INIT)),
  history: JSON.parse(localStorage.getItem("cm_history") || "[]"),
  livePlayerId: JSON.parse(localStorage.getItem("cm_livePlayer") || "null"),
  page: "auction",
  filterRole: "ALL",
  searchQ: "",
};

function reducer(state, action) {
  switch (action.type) {
    case "LOGIN":      return { ...state, currentUser: action.payload, page: "auction" };
    case "LOGOUT":     return { ...state, currentUser: null, page: "auction" };
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

    case "SET_STATE": {
      return { ...state, ...action.payload };
    }

    case "ADD_TEAM_FUNDS": {
      const { teamName, amount } = action.payload;
      const teams = {
        ...state.teams,
        [teamName]: { ...state.teams[teamName], budget: state.teams[teamName].budget + amount }
      };
      return { ...state, teams };
    }

    case "RESET_GAME": {
      const players = state.players.map(p => ({ ...p, soldTo: null, soldPrice: null }));
      const teams = Object.fromEntries(
        Object.entries(state.teams).map(([k, v]) => [k, { ...v, spent: 0 }])
      );
      return { ...state, players, teams, history: [], livePlayerId: null };
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
  const [state, dispatch] = useReducer(reducer, initialState);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const isRemoteUpdateRef = useRef(false); // Track if update came from Firestore (using ref to avoid infinite loops)

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
          // (from other users' actions)
          console.log("📨 Received Firestore data in callback:", firebaseData);
          if (firebaseData) {
            isRemoteUpdateRef.current = true; // Mark this as a remote update
            dispatch({
              type: "SET_STATE",
              payload: {
                players: firebaseData.players || state.players,
                teams: firebaseData.teams || state.teams,
                history: firebaseData.history || state.history,
                livePlayerId: firebaseData.livePlayerId || state.livePlayerId,
              },
            });
            console.log("✅ Dispatched SET_STATE action");
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

  // Persist to localStorage (backup) and Firebase (primary)
  useEffect(() => {
    // Always save to localStorage as fallback
    localStorage.setItem("cm_players",    JSON.stringify(state.players));
    localStorage.setItem("cm_teams",      JSON.stringify(state.teams));
    localStorage.setItem("cm_history",    JSON.stringify(state.history));
    localStorage.setItem("cm_livePlayer", JSON.stringify(state.livePlayerId));

    // Only sync to Firestore if this is a LOCAL change (not from remote listener)
    if (isFirebaseReady && !isRemoteUpdateRef.current) {
      updateAuctionData({
        players: state.players,
        teams: state.teams,
        history: state.history,
        livePlayerId: state.livePlayerId,
      }).catch(error => {
        console.error("Failed to update Firestore:", error);
        // Continue working even if Firebase sync fails
      });
    } else if (isRemoteUpdateRef.current) {
      // Reset the flag immediately for next change (doesn't trigger another effect run since it's a ref)
      isRemoteUpdateRef.current = false;
    }
  }, [state.players, state.teams, state.history, state.livePlayerId, isFirebaseReady]);

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
    { id: "team",      label: "MY TEAM" },
    { id: "overview",  label: "OVERVIEW" },
    ...(isAdmin ? [
      { id: "history", label: "HISTORY" },
      { id: "manage",  label: "⚙ MANAGE PLAYERS" },
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
  const [selTeam, setSelTeam] = useState(Object.keys(state.teams)[0]);
  const [bidVal, setBidVal] = useState("");

  const isSold = !!player.soldTo;
  const teamColor = isSold ? state.teams[player.soldTo]?.color : null;

  const assign = () => {
    const price = parseCr(bidVal) || player.base;
    if (price < player.base) { toast("Bid must be ≥ base price!", true); return; }
    const t = state.teams[selTeam];
    if (price > t.budget - t.spent) { toast("Team budget exceeded!", true); return; }
    if (!canAssignRole(state.players, selTeam, player.role)) {
      toast(`${selTeam} has reached the ${SLOT_LABELS[player.role]} limit (${SLOT_LIMITS[player.role]})!`, true); return;
    }
    dispatch({ type: "ASSIGN_PLAYER", payload: { id: player.id, team: selTeam, price } });
    toast(`${player.name} → ${selTeam} for ${fmtCur(price)}`);
    setBidVal("");
  };

  const unassign = () => {
    dispatch({ type: "UNASSIGN_PLAYER", payload: { id: player.id } });
    toast("Player returned to auction pool");
  };

  // Check slot availability per team for this role
  const slotWarning = isAdmin && !isSold && selTeam && !canAssignRole(state.players, selTeam, player.role);

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
          <div style={{ display: "flex", gap: 6, marginTop: 10, alignItems: "center" }}>
            <select value={selTeam} onChange={e => setSelTeam(e.target.value)} style={{
              flex: 1, background: "var(--bg)", border: "1px solid var(--border)",
              color: "var(--text)", fontFamily: "Rajdhani, sans-serif", fontSize: 12, padding: "6px 8px", outline: "none",
            }}>
              {Object.entries(state.teams).map(([t, td]) => {
                const full = !canAssignRole(state.players, t, player.role);
                return <option key={t} value={t}>{t}{full ? " (FULL)" : ""}</option>;
              })}
            </select>
            <input
              type="number" value={bidVal} onChange={e => setBidVal(e.target.value)}
              placeholder="Cr e.g. 1.5" style={{
                width: 80, background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--accent)", fontFamily: "Share Tech Mono, monospace",
                fontSize: 12, padding: "6px 6px", outline: "none", textAlign: "center",
              }}
            />
            <button onClick={assign} style={{
              background: slotWarning ? "var(--red)" : "var(--accent)", color: "#000", border: "none",
              fontFamily: "Oswald", fontSize: 12, fontWeight: 600, letterSpacing: 1,
              padding: "6px 12px", cursor: "pointer",
            }}>SELL</button>
          </div>
          {slotWarning && (
            <div style={{ fontSize: 10, color: "var(--red)", marginTop: 4, letterSpacing: 1 }}>
              ⚠ {selTeam} {SLOT_LABELS[player.role]} slot full ({SLOT_LIMITS[player.role]}/{SLOT_LIMITS[player.role]})
            </div>
          )}
        </>
      )}

      {isAdmin && !isSold && (
        <button onClick={() => { dispatch({ type: "SET_LIVE_PLAYER", payload: player.id }); dispatch({ type: "SET_PAGE", payload: "livebid" }); }} style={{
          width: "100%", marginTop: 6, background: "none",
          border: `1px solid ${state.livePlayerId === player.id ? "var(--accent)" : "var(--border)"}`,
          color: state.livePlayerId === player.id ? "var(--accent)" : "var(--muted)",
          fontFamily: "Rajdhani, sans-serif", fontSize: 11, fontWeight: 600,
          letterSpacing: 1, padding: "4px 8px", cursor: "pointer",
        }}>{state.livePlayerId === player.id ? "🔴 LIVE NOW" : "▶ SET AS LIVE BID"}</button>
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
        {["ALL", "BAT", "BWL", "WK", "AR"].map(r => (
          <button key={r} onClick={() => dispatch({ type: "SET_FILTER_ROLE", payload: r })} style={{
            background: filterRole === r ? "var(--accent)" : "var(--surface)",
            border: `1px solid ${filterRole === r ? "var(--accent)" : "var(--border)"}`,
            color: filterRole === r ? "#000" : "var(--muted)",
            fontFamily: "Rajdhani, sans-serif", fontSize: 12, fontWeight: 700,
            letterSpacing: 1.5, padding: "6px 14px", cursor: "pointer", textTransform: "uppercase",
          }}>
            {r === "ALL" ? "ALL" : r === "BAT" ? `BATSMEN (×${SLOT_LIMITS.BAT})` : r === "BWL" ? `BOWLERS (×${SLOT_LIMITS.BWL})` : r === "WK" ? `KEEPER (×${SLOT_LIMITS.WK})` : `ALL-ROUNDERS (×${SLOT_LIMITS.AR})`}
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
      <div style={{
        background: "var(--surface)", border: "1px solid var(--border)",
        borderTop: `3px solid ${tData.color}`,
        padding: "20px 24px", marginBottom: 20,
        display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2, color: tData.color }}>{tName}</div>
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
                        <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 11, color: "var(--accent)" }}>{fmtCur(p.soldPrice)}</div>
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
  const { state } = useAuction();
  const { players, teams, currentUser } = state;
  const isAdmin = currentUser?.role === "admin";
  const myTeam = currentUser?.team;

  const total = players.length;
  const sold  = players.filter(p => p.soldTo).length;

  return (
    <div style={{ padding: "28px 24px", maxWidth: 1400, margin: "0 auto" }}>
      <div style={{ fontFamily: "Oswald", fontSize: 28, fontWeight: 700, letterSpacing: 2, marginBottom: 16, paddingBottom: 16, borderBottom: "1px solid var(--border)" }}>
        TEAMS <span style={{ color: "var(--accent)" }}>OVERVIEW</span>
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
              <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, letterSpacing: 1.5, color: tData.color, marginBottom: 8 }}>{tName}</div>

              {/* Squad slot progress */}
              <div style={{ marginBottom: 14 }}>
                {Object.keys(SLOT_LIMITS).map(r => (
                  <SlotPill key={r} role={r} filled={slots[r]} limit={SLOT_LIMITS[r]} />
                ))}
              </div>

              {[
                ["Total Players", `${tp.length} / ${TOTAL_SQUAD}`, "var(--text)"],
                ...(canSeeBudget ? [
                  ["Spent",         fmtCur(tData.spent),    "var(--accent)"],
                  ["Remaining",     fmtCur(remaining),      "var(--green)"],
                ] : [
                  ["Budget",        "CONFIDENTIAL", "var(--border)"],
                ]),
              ].map(([label, val, color]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border)", fontSize: 13 }}>
                  <span style={{ color: "var(--muted)" }}>{label}</span>
                  <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 13, color }}>{val}</span>
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
                    <span style={{ color: tData.color, fontSize: 11 }}>{tName.split(" ")[0]}</span>
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
  "Rohit Sharma":      { matches:243, runs:9205,  avg:48.7,  sr:140.9, wickets:null, economy:null,  hundreds:3,  fifties:29, catches:68  },
  "David Warner":      { matches:110, runs:3277,  avg:33.4,  sr:142.6, wickets:null, economy:null,  hundreds:1,  fifties:26, catches:44  },
  "Babar Azam":        { matches:106, runs:3985,  avg:41.5,  sr:128.6, wickets:null, economy:null,  hundreds:3,  fifties:33, catches:37  },
  "Faf du Plessis":    { matches:143, runs:4431,  avg:36.5,  sr:135.0, wickets:null, economy:null,  hundreds:4,  fifties:28, catches:52  },
  "KL Rahul":          { matches:72,  runs:2265,  avg:36.5,  sr:134.7, wickets:null, economy:null,  hundreds:1,  fifties:22, catches:60  },
  "Kane Williamson":   { matches:95,  runs:3227,  avg:33.9,  sr:125.9, wickets:null, economy:null,  hundreds:2,  fifties:22, catches:42  },
  "Travis Head":       { matches:55,  runs:1623,  avg:30.6,  sr:152.4, wickets:null, economy:null,  hundreds:3,  fifties:9,  catches:27  },
  "Jasprit Bumrah":    { matches:120, runs:null,  avg:null,  sr:null,  wickets:145,  economy:7.39,  hundreds:null, fifties:null, catches:28  },
  "Pat Cummins":       { matches:106, runs:null,  avg:null,  sr:null,  wickets:148,  economy:8.57,  hundreds:null, fifties:null, catches:35  },
  "Rashid Khan":       { matches:118, runs:null,  avg:null,  sr:null,  wickets:169,  economy:6.71,  hundreds:null, fifties:null, catches:42  },
  "Mitchell Starc":    { matches:74,  runs:null,  avg:null,  sr:null,  wickets:99,   economy:8.65,  hundreds:null, fifties:null, catches:24  },
  "Kagiso Rabada":     { matches:84,  runs:null,  avg:null,  sr:null,  wickets:117,  economy:8.29,  hundreds:null, fifties:null, catches:28  },
  "Trent Boult":       { matches:82,  runs:null,  avg:null,  sr:null,  wickets:108,  economy:8.32,  hundreds:null, fifties:null, catches:35  },
  "Mohammed Shami":    { matches:86,  runs:null,  avg:null,  sr:null,  wickets:113,  economy:8.84,  hundreds:null, fifties:null, catches:21  },
  "Shaheen Afridi":    { matches:68,  runs:null,  avg:null,  sr:null,  wickets:97,   economy:8.05,  hundreds:null, fifties:null, catches:18  },
  "MS Dhoni":          { matches:350, runs:4746,  avg:39.2,  sr:135.9, wickets:null, economy:null,  hundreds:0,   fifties:23, catches:132 },
  "Jos Buttler":       { matches:167, runs:4204,  avg:33.4,  sr:143.6, wickets:null, economy:null,  hundreds:4,   fifties:27, catches:96  },
  "Rishabh Pant":      { matches:82,  runs:2163,  avg:34.9,  sr:148.1, wickets:null, economy:null,  hundreds:1,   fifties:13, catches:89  },
  "Heinrich Klaasen":  { matches:65,  runs:1878,  avg:37.5,  sr:152.0, wickets:null, economy:null,  hundreds:2,   fifties:13, catches:54  },
  "Quinton de Kock":   { matches:107, runs:3159,  avg:29.7,  sr:133.8, wickets:null, economy:null,  hundreds:4,   fifties:17, catches:116 },
  "Ben Stokes":        { matches:115, runs:2347,  avg:26.1,  sr:128.4, wickets:74,   economy:8.82,  hundreds:1,   fifties:14, catches:53  },
  "Hardik Pandya":     { matches:115, runs:2071,  avg:28.7,  sr:145.2, wickets:65,   economy:9.01,  hundreds:0,   fifties:12, catches:40  },
  "Shakib Al Hasan":   { matches:122, runs:2386,  avg:24.6,  sr:125.3, wickets:129,  economy:7.74,  hundreds:0,   fifties:13, catches:43  },
  "Andre Russell":     { matches:106, runs:1908,  avg:31.8,  sr:177.4, wickets:81,   economy:9.24,  hundreds:0,   fifties:6,  catches:32  },
  "Glenn Maxwell":     { matches:115, runs:2608,  avg:29.0,  sr:158.7, wickets:37,   economy:8.94,  hundreds:3,   fifties:15, catches:48  },
  "Marcus Stoinis":    { matches:78,  runs:1639,  avg:26.0,  sr:142.3, wickets:33,   economy:9.35,  hundreds:1,   fifties:7,  catches:31  },
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
    const price = parseCr(bidVal) || player.base;
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
            return (
              <div key={tName} style={{ background: "var(--surface)", border: `1px solid ${tData.color}33`, borderTop: `2px solid ${tData.color}`, padding: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                  <span style={{ fontFamily: "Oswald", fontSize: 14, fontWeight: 700, color: tData.color, letterSpacing: 1 }}>{tName}</span>
                  <span style={{ fontSize: 10, fontFamily: "Share Tech Mono, monospace", color: "var(--muted)" }}>{tp.length}/{TOTAL_SQUAD}</span>
                </div>
                <TeamSlotsDisplay teamName={tName} players={players} compact />
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontSize: 10, color: "var(--muted)" }}>Budget left</span>
                  <span style={{ fontSize: 12, fontFamily: "Share Tech Mono, monospace", color: pct > 50 ? "var(--green)" : pct > 20 ? "var(--accent)" : "var(--red)" }}>{fmtCur(rem)}</span>
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
                    <div style={{ fontSize: 10, fontWeight: 700, letterSpacing: 1.5, color: tData.color, marginBottom: 4 }}>{tName}</div>
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
                    const canAfford = rem >= (parseCr(bidVal) || player.base);
                    const slotAvail = canAssignRole(players, tName, player.role);
                    const slots = getTeamSlots(players, tName);
                    return (
                      <button key={tName} onClick={() => setSelTeam(tName)} style={{
                        background: selTeam === tName ? tData.color + "22" : "var(--bg)",
                        border: `1px solid ${selTeam === tName ? tData.color : "var(--border)"}`,
                        padding: "10px 14px", cursor: slotAvail ? "pointer" : "not-allowed", textAlign: "left",
                        display: "flex", alignItems: "center", justifyContent: "space-between",
                        opacity: (canAfford && slotAvail) ? 1 : 0.5,
                      }}>
                        <div>
                          <span style={{ fontFamily: "Oswald", fontSize: 13, color: selTeam === tName ? tData.color : "var(--text)", letterSpacing: 1, display: "block" }}>{tName}</span>
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
                  type="number" value={bidVal}
                  onChange={e => setBidVal(e.target.value)}
                  placeholder={`Min: ${fmtCur(player.base)}`}
                  style={{
                    width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                    color: "var(--accent)", fontFamily: "Share Tech Mono, monospace",
                    fontSize: 18, padding: "12px 14px", outline: "none", textAlign: "center", letterSpacing: 2,
                  }}
                />
                {bidVal && parseCr(bidVal) < player.base && (
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
              <button onClick={unsold} style={{
                width: "100%", background: "none", border: "1px solid var(--muted)",
                color: "var(--muted)", fontFamily: "Rajdhani, sans-serif", fontSize: 13,
                fontWeight: 600, letterSpacing: 2, padding: "10px", cursor: "pointer",
              }}>MARK AS UNSOLD</button>
            </div>
          ) : (
            <div style={{ background: "var(--surface)", border: `1px solid ${roleColor}33`, borderTop: `3px solid ${roleColor}`, padding: 24, textAlign: "center" }}>
              <div style={{ fontSize: 11, letterSpacing: 3, color: "var(--muted)", textTransform: "uppercase", marginBottom: 12 }}>Now Bidding</div>
              <PlayerAvatar name={player.name} role={player.role} size={80} photoUrl={player.photoUrl} />
              <div style={{ fontFamily: "Oswald", fontSize: 24, fontWeight: 700, marginTop: 12, letterSpacing: 1 }}>{player.name}</div>
              <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 4 }}>{player.country} · {ROLES[player.role]}</div>
              <div style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 20, color: "var(--green)", marginTop: 16 }}>{fmtCur(player.base)}</div>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "var(--muted)", marginTop: 4 }}>BASE PRICE</div>
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
              return (
                <div key={h.id} style={{
                  background: "var(--surface)", border: "1px solid var(--border)",
                  borderLeft: `3px solid ${isSold ? "var(--green)" : "var(--red)"}`,
                  padding: "12px 18px", display: "flex", alignItems: "center", gap: 16, flexWrap: "wrap",
                }}>
                  <span style={{
                    fontSize: 10, fontWeight: 700, letterSpacing: 2, padding: "2px 8px",
                    background: isSold ? "rgba(34,197,94,.15)" : "rgba(239,68,68,.15)",
                    color: isSold ? "var(--green)" : "var(--red)",
                  }}>{h.action}</span>
                  <span style={{ fontFamily: "Oswald", fontSize: 16, fontWeight: 600, flex: 1 }}>{h.playerName}</span>
                  {isSold && <>
                    <span style={{ fontSize: 13, color: tColor, fontWeight: 700 }}>→ {h.team}</span>
                    <span style={{ fontFamily: "Share Tech Mono, monospace", fontSize: 13, color: "var(--accent)" }}>{fmtCur(h.price)}</span>
                  </>}
                  {!isSold && <span style={{ fontSize: 12, color: "var(--muted)" }}>from {h.team} — {fmtCur(h.price)}</span>}
                  <span style={{ fontSize: 11, color: "var(--border)", fontFamily: "Share Tech Mono, monospace", marginLeft: "auto" }}>{fmtTime(h.ts)}</span>
                </div>
              );
            })}
          </div>
      }
    </div>
  );
}

/* ─── MANAGE PLAYERS PAGE (ADMIN) ───────────────────────────── */
const COUNTRIES = ["India","Australia","England","Pakistan","S. Africa","New Zealand","West Indies","Bangladesh","Afghanistan","Sri Lanka","Zimbabwe","Ireland","Netherlands","Other"];

function ManagePlayersPage() {
  const { state, dispatch } = useAuction();
  const toast = useToast();
  const { players } = state;

  const blank = { name: "", role: "BAT", country: "India", base: "3", photoUrl: "" };
  const [form, setForm] = useState(blank);
  const [photoPreviewErr, setPhotoPreviewErr] = useState(false);
  const [filterRole, setFilterRole] = useState("ALL");
  const [confirmDel, setConfirmDel] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [newTeamName, setNewTeamName] = useState("");
  const [newTeamColor, setNewTeamColor] = useState("#3b9eff");
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetPass, setResetPass] = useState("");
  const [editingTeam, setEditingTeam] = useState(null);
  const [editTeamForm, setEditTeamForm] = useState({});
  const [fundTeam, setFundTeam] = useState(null);
  const [fundAmount, setFundAmount] = useState("");

  const upd = (k, v) => { setForm(f => ({ ...f, [k]: v })); if (k === "photoUrl") setPhotoPreviewErr(false); };

  const addPlayer = () => {
    if (!form.name.trim()) { toast("Player name required!", true); return; }
    if (players.find(p => p.name.toLowerCase() === form.name.trim().toLowerCase())) {
      toast("Player with that name already exists!", true); return;
    }
    const newId = Math.max(...players.map(p => p.id), 0) + 1;
    const stats = generateStats(form.role);
    dispatch({
      type: "ADD_PLAYER",
      payload: {
        id: newId,
        name: form.name.trim(),
        role: form.role,
        country: form.country,
        base: parseCr(form.base) || 30000000,
        photoUrl: form.photoUrl.trim() || null,
        generatedStats: stats,
      },
    });
    // Also store in PLAYER_STATS for live bid display
    PLAYER_STATS[form.name.trim()] = stats;
    toast(`✅ ${form.name.trim()} added to player pool!`);
    setForm(blank);
    setPhotoPreviewErr(false);
  };

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
    const newBase = parseCr(editForm.base) || player.base;
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

  const addTeam = () => {
    if (!newTeamName.trim()) { toast("Team name required!", true); return; }
    if (state.teams[newTeamName.trim()]) { toast("Team already exists!", true); return; }
    dispatch({
      type: "ADD_TEAM",
      payload: { name: newTeamName.trim(), color: newTeamColor }
    });
    toast(`✅ Team ${newTeamName.trim()} added!`);
    setNewTeamName("");
    setNewTeamColor("#3b9eff");
  };

  const startEditTeam = (teamName) => {
    setEditingTeam(teamName);
    setEditTeamForm({ name: teamName, color: state.teams[teamName].color });
  };

  const saveEditTeam = () => {
    if (!editTeamForm.name.trim()) { toast("Team name required!", true); return; }
    const newName = editTeamForm.name.trim();
    if (newName !== editingTeam && state.teams[newName]) {
      toast("A team with that name already exists!", true); return;
    }
    dispatch({
      type: "EDIT_TEAM",
      payload: { oldName: editingTeam, newName, color: editTeamForm.color }
    });
    toast(`✅ Team updated!`);
    setEditingTeam(null);
  };

  const addFundsToTeam = (teamName) => {
    const amt = parseCr(fundAmount);
    if (!fundAmount.trim() || amt <= 0) { toast("Please enter a valid amount!", true); return; }
    dispatch({
      type: "ADD_TEAM_FUNDS",
      payload: { teamName, amount: amt }
    });
    toast(`✅ ₹${fmtCur(amt)} added to ${teamName}!`);
    setFundTeam(null);
    setFundAmount("");
  };

  const resetGame = () => {
    if (resetPass !== "admin123") { toast("Invalid admin password!", true); return; }
    dispatch({ type: "RESET_GAME" });
    toast("✅ Game reset! All players returned, budgets reset.");
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

      <div style={{ display: "grid", gridTemplateColumns: "380px 1fr", gap: 24, alignItems: "start" }}>

        {/* ADD PLAYER FORM */}
        <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", padding: 24, position: "sticky", top: 72 }}>
          <div style={{ fontFamily: "Oswald", fontSize: 16, letterSpacing: 2, color: "var(--accent)", marginBottom: 20 }}>ADD NEW PLAYER</div>

          {/* Photo preview */}
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
            {form.photoUrl && !photoPreviewErr
              ? <img src={form.photoUrl} alt="preview" onError={() => setPhotoPreviewErr(true)} style={{ width: 80, height: 80, borderRadius: "50%", objectFit: "cover", objectPosition: "top", border: `2px solid ${ROLE_COLORS[form.role]}55` }} />
              : <div style={{
                  width: 80, height: 80, borderRadius: "50%",
                  background: ROLE_COLORS[form.role] + "22", border: `2px dashed ${ROLE_COLORS[form.role]}44`,
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontFamily: "Oswald", fontSize: 28, color: ROLE_COLORS[form.role],
                }}>
                  {form.name ? form.name.split(" ").map(w => w[0]).join("").slice(0,2).toUpperCase() : "?"}
                </div>
            }
          </div>

          {[
            { label: "Player Name", key: "name", type: "text", placeholder: "e.g. Virat Kohli" },
            { label: "Photo URL (optional)", key: "photoUrl", type: "text", placeholder: "https://..." },
          ].map(({ label, key, type, placeholder }) => (
            <div key={key} style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>{label}</div>
              <input
                type={type} value={form[key]} onChange={e => upd(key, e.target.value)}
                placeholder={placeholder}
                style={{
                  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                  color: "var(--text)", fontFamily: "Rajdhani, sans-serif", fontSize: 14,
                  padding: "9px 12px", outline: "none",
                }}
              />
              {key === "photoUrl" && form.photoUrl && photoPreviewErr && (
                <div style={{ fontSize: 10, color: "var(--red)", marginTop: 4 }}>⚠ Image failed to load — initials will be shown</div>
              )}
              {key === "photoUrl" && !form.photoUrl && (
                <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>Leave blank to use auto-generated initials avatar</div>
              )}
            </div>
          ))}

          {/* Role select */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>
              Role <span style={{ color: ROLE_COLORS[form.role], fontSize: 10, marginLeft: 6 }}>(team limit: ×{SLOT_LIMITS[form.role]})</span>
            </div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {Object.entries(ROLES).map(([rKey, rLabel]) => (
                <button key={rKey} onClick={() => upd("role", rKey)} style={{
                  padding: "6px 12px", fontSize: 11, fontWeight: 700, letterSpacing: 1,
                  fontFamily: "Rajdhani, sans-serif", cursor: "pointer",
                  background: form.role === rKey ? ROLE_COLORS[rKey] + "22" : "var(--bg)",
                  border: `1px solid ${form.role === rKey ? ROLE_COLORS[rKey] : "var(--border)"}`,
                  color: form.role === rKey ? ROLE_COLORS[rKey] : "var(--muted)",
                }}>{rLabel}</button>
              ))}
            </div>
          </div>

          {/* Country */}
          <div style={{ marginBottom: 14 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Country</div>
            <select value={form.country} onChange={e => upd("country", e.target.value)} style={{
              width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
              color: "var(--text)", fontFamily: "Rajdhani, sans-serif", fontSize: 14,
              padding: "9px 12px", outline: "none",
            }}>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {/* Base price */}
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Base Price (Crores ₹)</div>
            <input
              type="number" value={form.base} onChange={e => upd("base", e.target.value)}
              style={{
                width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                color: "var(--accent)", fontFamily: "Share Tech Mono, monospace", fontSize: 16,
                padding: "9px 12px", outline: "none",
              }}
            />
            <div style={{ fontSize: 10, color: "var(--muted)", marginTop: 4 }}>= {fmtCur(parseCr(form.base) || 0)}</div>
          </div>

          {/* Stats note */}
          <div style={{ background: "var(--surface2)", border: "1px solid var(--border)", padding: "10px 14px", marginBottom: 16, fontSize: 11, color: "var(--muted)", letterSpacing: 0.5 }}>
            📊 T20 career stats will be <strong style={{ color: "var(--accent)" }}>auto-generated</strong> based on role ({ROLES[form.role]})
          </div>

          <button onClick={addPlayer} style={{
            width: "100%", background: "var(--accent)", color: "#000", border: "none",
            fontFamily: "Oswald", fontSize: 16, fontWeight: 600, letterSpacing: 2,
            padding: "14px", cursor: "pointer",
          }}>＋ ADD TO AUCTION POOL</button>
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
      </div>

      {/* TEAM MANAGEMENT SECTION */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 16, color: "var(--accent)" }}>
          👥 TEAM MANAGEMENT
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 24 }}>
          {/* Add New Team */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", padding: 20 }}>
            <div style={{ fontFamily: "Oswald", fontSize: 14, letterSpacing: 1.5, color: "var(--accent)", marginBottom: 16 }}>＋ ADD NEW TEAM</div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Team Name</div>
              <input
                type="text" value={newTeamName} onChange={e => setNewTeamName(e.target.value)}
                placeholder="e.g. Delhi Capitals"
                style={{
                  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                  color: "var(--text)", fontFamily: "Rajdhani, sans-serif", fontSize: 14,
                  padding: "9px 12px", outline: "none",
                }}
              />
            </div>
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Team Color</div>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color" value={newTeamColor} onChange={e => setNewTeamColor(e.target.value)}
                  style={{
                    width: 50, height: 50, border: "2px solid var(--border)", cursor: "pointer",
                    borderRadius: 4,
                  }}
                />
                <div style={{
                  background: newTeamColor, width: 50, height: 50, borderRadius: 4,
                  border: "2px solid var(--border)"
                }} title={newTeamColor}></div>
                <span style={{ fontSize: 12, fontFamily: "Share Tech Mono", color: "var(--muted)" }}>{newTeamColor}</span>
              </div>
            </div>
            <button onClick={addTeam} style={{
              width: "100%", background: "var(--accent)", color: "#000", border: "none",
              fontFamily: "Oswald", fontSize: 14, fontWeight: 600, letterSpacing: 1.5,
              padding: "11px", cursor: "pointer",
            }}>ADD TEAM</button>
          </div>

          {/* Edit Existing Teams */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", padding: 20 }}>
            <div style={{ fontFamily: "Oswald", fontSize: 14, letterSpacing: 1.5, color: "var(--accent)", marginBottom: 16 }}>✎ EDIT TEAMS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
              {Object.entries(state.teams).map(([teamName, teamData]) => (
                editingTeam === teamName ? (
                  <div key={teamName} style={{
                    background: "var(--accent)", color: "#000", border: "2px solid var(--accent)",
                    padding: "10px 12px", borderRadius: "3px", display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <input
                      type="text" value={editTeamForm.name} onChange={e => setEditTeamForm(f => ({ ...f, name: e.target.value }))}
                      style={{
                        background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,0,0,0.3)", color: "#000",
                        padding: "6px 10px", fontFamily: "Rajdhani, sans-serif", fontSize: 12, outline: "none",
                      }}
                    />
                    <input
                      type="color" value={editTeamForm.color} onChange={e => setEditTeamForm(f => ({ ...f, color: e.target.value }))}
                      style={{
                        width: "100%", height: 40, border: "2px solid rgba(0,0,0,0.3)", borderRadius: 3, cursor: "pointer",
                      }}
                    />
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={saveEditTeam} style={{
                        flex: 1, background: "#000", color: "var(--accent)", border: "none",
                        fontFamily: "Rajdhani", fontSize: 11, fontWeight: 700, padding: "5px", cursor: "pointer",
                      }}>SAVE</button>
                      <button onClick={() => setEditingTeam(null)} style={{
                        flex: 1, background: "rgba(0,0,0,0.3)", color: "#000", border: "none",
                        fontFamily: "Rajdhani", fontSize: 11, padding: "5px", cursor: "pointer",
                      }}>CANCEL</button>
                    </div>
                  </div>
                ) : fundTeam === teamName ? (
                  <div key={teamName} style={{
                    background: "var(--green)", color: "#000", border: "2px solid var(--green)",
                    padding: "10px 12px", borderRadius: "3px", display: "flex", flexDirection: "column", gap: 8,
                  }}>
                    <div style={{ fontSize: 11, fontWeight: 700 }}>Add Funds to {teamName}</div>
                    <input
                      type="text" value={fundAmount} onChange={e => setFundAmount(e.target.value)}
                      placeholder="e.g. 1.5" title="Enter amount in Crores"
                      onKeyDown={e => e.key === "Enter" && addFundsToTeam(teamName)}
                      style={{
                        background: "rgba(0,0,0,0.2)", border: "1px solid rgba(0,0,0,0.3)", color: "#000",
                        padding: "6px 10px", fontFamily: "Share Tech Mono, monospace", fontSize: 12, outline: "none",
                      }}
                    />
                    <div style={{ fontSize: 9, color: "rgba(0,0,0,0.8)" }}>Current: {fmtCur(teamData.budget)}</div>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button onClick={() => addFundsToTeam(teamName)} style={{
                        flex: 1, background: "#000", color: "var(--green)", border: "none",
                        fontFamily: "Rajdhani", fontSize: 11, fontWeight: 700, padding: "5px", cursor: "pointer",
                      }}>ADD</button>
                      <button onClick={() => { setFundTeam(null); setFundAmount(""); }} style={{
                        flex: 1, background: "rgba(0,0,0,0.3)", color: "#000", border: "none",
                        fontFamily: "Rajdhani", fontSize: 11, padding: "5px", cursor: "pointer",
                      }}>CANCEL</button>
                    </div>
                  </div>
                ) : (
                  <div key={teamName} style={{
                    background: "var(--bg)", border: `2px solid ${teamData.color}`,
                    padding: "10px 12px", borderRadius: "3px", display: "flex", justifyContent: "space-between", alignItems: "center",
                  }}>
                    <div>
                      <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: 2, fontFamily: "Rajdhani, sans-serif", fontSize: 11 }}>
                        {teamName}
                      </div>
                      <div style={{ color: "var(--muted)", fontSize: 9, fontFamily: "Share Tech Mono, monospace" }}>
                        Budget: {fmtCur(teamData.budget)}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: 4 }}>
                      <button onClick={() => setFundTeam(teamName)} style={{
                        background: "none", border: "1px solid var(--green)", color: "var(--green)",
                        fontFamily: "Rajdhani", fontSize: 10, padding: "3px 8px", cursor: "pointer", fontWeight: 600,
                      }}>+$</button>
                      <button onClick={() => startEditTeam(teamName)} style={{
                        background: "none", border: "1px solid var(--accent)", color: "var(--accent)",
                        fontFamily: "Rajdhani", fontSize: 10, padding: "3px 8px", cursor: "pointer",
                      }}>EDIT</button>
                    </div>
                  </div>
                )
              ))}
            </div>
          </div>

          {/* Team Credentials */}
          <div style={{ background: "var(--surface)", border: "1px solid var(--border)", borderTop: "3px solid var(--accent)", padding: 20 }}>
            <div style={{ fontFamily: "Oswald", fontSize: 14, letterSpacing: 1.5, color: "var(--accent)", marginBottom: 16 }}>🔐 LOGIN CREDENTIALS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 300, overflowY: "auto" }}>
              {Object.entries(USERS).map(([uname, u]) => (
                <div key={uname} style={{
                  background: "var(--bg)", border: "1px solid var(--border)",
                  padding: "10px 12px", borderRadius: "3px", fontSize: 11,
                }}>
                  <div style={{ color: "var(--accent)", fontWeight: 700, marginBottom: 4, fontFamily: "Share Tech Mono, monospace" }}>
                    {uname}
                  </div>
                  <div style={{ color: "var(--muted)", fontFamily: "Share Tech Mono, monospace", marginBottom: 2 }}>
                    Pass: {u.pass}
                  </div>
                  <div style={{ color: "var(--border)", fontSize: 9 }}>
                    {u.label}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* GAME CONTROL SECTION */}
      <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid var(--border)" }}>
        <div style={{ fontFamily: "Oswald", fontSize: 20, fontWeight: 700, letterSpacing: 2, marginBottom: 16, color: "var(--red)" }}>
          ⚠ GAME CONTROL
        </div>

        {!showResetConfirm ? (
          <button onClick={() => setShowResetConfirm(true)} style={{
            background: "var(--red)", color: "#fff", border: "none",
            fontFamily: "Oswald", fontSize: 14, fontWeight: 600, letterSpacing: 1.5,
            padding: "12px 24px", cursor: "pointer",
          }}>🔄 RESET ENTIRE GAME</button>
        ) : (
          <div style={{ background: "var(--surface)", border: "2px solid var(--red)", padding: 20, borderRadius: "4px" }}>
            <div style={{ fontSize: 12, color: "var(--red)", marginBottom: 16, fontWeight: 600 }}>
              ⚠ WARNING: This will reset all players, budgets, and history. Admin password required.
            </div>
            <div style={{ marginBottom: 12 }}>
              <div style={{ fontSize: 11, letterSpacing: 1.5, color: "var(--muted)", textTransform: "uppercase", marginBottom: 6 }}>Admin Password</div>
              <input
                type="password" value={resetPass} onChange={e => setResetPass(e.target.value)}
                onKeyDown={e => e.key === "Enter" && resetGame()}
                placeholder="Enter admin password"
                style={{
                  width: "100%", background: "var(--bg)", border: "1px solid var(--border)",
                  color: "var(--text)", fontFamily: "Share Tech Mono, monospace", fontSize: 14,
                  padding: "9px 12px", outline: "none",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: 12 }}>
              <button onClick={resetGame} style={{
                background: "var(--red)", color: "#fff", border: "none",
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
    team:     TeamPage,
    overview: OverviewPage,
    history:  HistoryPage,
    manage:   ManagePlayersPage,
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
