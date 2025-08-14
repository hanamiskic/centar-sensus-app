import { setGlobalOptions } from 'firebase-functions/v2';
import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';
import { getAuth } from 'firebase-admin/auth';

try { admin.app(); } catch { admin.initializeApp(); }

setGlobalOptions({ region: 'europe-west1', maxInstances: 10 });

export { listUsers, deleteUser } from './adminUsers';

export const setAdminRole = onCall(async (request) => {
  if (!request.auth) throw new HttpsError('unauthenticated', 'Login required.');
  if (!request.auth.token.admin) throw new HttpsError('permission-denied', 'Admins only.');

  const { uid, makeAdmin } = request.data as { uid?: string; makeAdmin?: boolean };
  if (!uid || typeof makeAdmin !== 'boolean') {
    throw new HttpsError('invalid-argument', 'Pass { uid, makeAdmin }.');
  }

  const user = await getAuth().getUser(uid);
  const claims = { ...(user.customClaims || {}) };

  if (makeAdmin) claims.admin = true;
  else delete claims.admin;

  await getAuth().setCustomUserClaims(uid, claims);
  return { ok: true, uid, admin: !!claims.admin };
});
