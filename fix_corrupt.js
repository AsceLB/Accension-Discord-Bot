const { initializeApp } = require('firebase/app');
const { getDatabase, ref, get, set } = require('firebase/database');
const { getAuth, signInAnonymously } = require('firebase/auth');

const app = initializeApp({
    apiKey: 'AIzaSyDOJq7SNRIMDHY8p1R8wbmjjj89-FpP4GE',
    databaseURL: 'https://accension-leaderboard-default-rtdb.asia-southeast1.firebasedatabase.app/'
});
const auth = getAuth(app);
const db = getDatabase(app);

async function fix() {
    await signInAnonymously(auth);
    const playersRef = ref(db, 'players');
    const snap = await get(playersRef);
    if (snap.exists()) {
        let data = snap.val();
        let players = Array.isArray(data) ? data : Object.values(data);
        const oldLen = players.length;
        players = players.filter(p => p && p.name && !p.name.includes(','));
        if (players.length < oldLen) {
            await set(playersRef, players);
            console.log('Removed ' + (oldLen - players.length) + ' corrupt players.');
        } else {
            console.log('No corrupt players found.');
        }
    }
    process.exit(0);
}
fix();
