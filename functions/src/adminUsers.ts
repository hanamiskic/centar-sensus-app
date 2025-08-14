import { onCall, HttpsError } from 'firebase-functions/v2/https';
import * as admin from 'firebase-admin';

try { admin.app(); } catch { admin.initializeApp(); }

const db = admin.firestore();

export const listUsers = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Nisi admin.');
  }

  const res = await admin.auth().listUsers(1000);

  const rows = await Promise.all(
    res.users.map(async (u) => {
      const snap = await db.doc(`users/${u.uid}`).get();
      const d = snap.exists ? (snap.data() as any) : {};

      const created =
        d?.createdAt?.toDate?.() ??
        (u.metadata?.creationTime ? new Date(u.metadata.creationTime) : null);

      return {
        uid: u.uid,
        email: u.email || d?.email || '',
        firstName: d?.firstName || '',
        lastName:  d?.lastName  || '',
        membership: d?.membership || '',
        phone: d?.phone || u.phoneNumber || '',
        createdAt: created ? created.toISOString() : null,
      };
    })
  );

  return rows;
});

export const deleteUser = onCall(async (request) => {
  if (!request.auth?.token?.admin) {
    throw new HttpsError('permission-denied', 'Nisi admin.');
  }
  const uid = request.data?.uid as string | undefined;
  if (!uid) throw new HttpsError('invalid-argument', 'UID je obavezan.');

  await admin.auth().deleteUser(uid);
  return { success: true };
});
