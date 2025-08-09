// functions/src/index.ts (Firebase Functions v2)
import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import { initializeApp } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

// globalne postavke (regija + cost control)
setGlobalOptions({
  region: 'europe-west1',   // promijeni ako želiš
  maxInstances: 10,
});

initializeApp();

export const setAdminRole = onCall(async (request) => {
  // mora biti prijavljen
  if (!request.auth) {
    throw new HttpsError('unauthenticated', 'Login required.');
  }
  // samo admin smije mijenjati uloge
  if (!request.auth.token.admin) {
    throw new HttpsError('permission-denied', 'Admins only.');
  }

  const { uid, makeAdmin } = request.data as { uid?: string; makeAdmin?: boolean };

  if (!uid || typeof makeAdmin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Pass { uid, makeAdmin }.');
  }

  const user = await getAuth().getUser(uid);
  const current = user.customClaims || {};
  const claims: Record<string, any> = { ...current };

  if (makeAdmin) claims.admin = true;
  else delete claims.admin;

  await getAuth().setCustomUserClaims(uid, claims);

  // (opc) možeš revoke-ati refresh tokene ako želiš instant efekt:
  // await getAuth().revokeRefreshTokens(uid);

  return { ok: true, uid, admin: !!claims.admin };
});
