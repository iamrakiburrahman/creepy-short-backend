import * as admin from 'firebase-admin';
import config from '../config';

if (admin.apps.length === 0) {
     admin.initializeApp({
          credential: admin.credential.cert({
               projectId: config.firebase.projectId,
               clientEmail: config.firebase.clientEmail,
               privateKey: config.firebase.privateKey?.replace(/\\n/g, '\n'),
          }),
     });
}

export default admin;