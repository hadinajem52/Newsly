import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyDWuDD280ChENHxTokh5abOR-oSipwZzNo",
  authDomain: "newsly-416ef.firebaseapp.com",
  projectId: "newsly-416ef",
  storageBucket: "newsly-416ef.appspot.com",
  messagingSenderId: "332471723040",
  appId: "1:332471723040:android:4681613a7945ffb7a54845",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
