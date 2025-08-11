const {initializeApp, cert} = require("firebase-admin/app");
const {getAuth} = require("firebase-admin/auth");
const serviceAccount = require("./serviceAccount.json");

(async () => {
  const uid = process.argv[2];
  if (!uid) {
    console.error("Usage: node scripts/makeAdmin.js <UID>");
    process.exit(1);
  }

  initializeApp({credential: cert(serviceAccount)});

  try {
    await getAuth().setCustomUserClaims(uid, {admin: true});
    console.log(`Admin set for ${uid}`);
  } catch (err) {
    console.error(" Error setting admin:", err);
    process.exit(1);
  }
})();
