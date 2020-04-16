import * as firebase from 'firebase/app';
import 'firebase/firestore';
import { firebaseConfig } from'./FireBaseConfig.js';



/**
 * Returns App
 */
export function app() {
    return !firebase.apps.length ? firebase.initializeApp(firebaseConfig) : firebase.app();
};

/**
 * Returns Firestore
 */
export function firestore() {
    const firebaseApp = app();
    return firebaseApp.firestore(firebaseApp);
}