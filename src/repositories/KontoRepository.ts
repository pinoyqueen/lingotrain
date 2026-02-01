import { 
  doc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc 
} from "firebase/firestore";
import { db } from "./firebase"; 
import type { Konto } from "@/models/Konto";

const KONTO_COLLECTION = "Konto";
const kontoCollection = collection(db, KONTO_COLLECTION);

/**
 * Konto erstellen
 */
export async function createKonto(konto: Konto): Promise<string> {
  const docRef = doc(kontoCollection, konto.id);
  
  // Default-Werte setzen, falls undefined
  const data = {
    benutzername: konto.benutzername,
    vorname: konto.vorname,
    nachname: konto.nachname,
    email: konto.email,
    anzTage: konto.anzTage ?? 0,
    punkte: konto.punkte ?? 0,
    benachrichtigung: konto.benachrichtigung ?? false,
    profilbild_id: konto.profilbild_id ?? "",  // TODO: Standardbild setzen
    sprachenIds: konto.sprachenIds ?? [],
    aktuelleSpracheId: konto.aktuelleSpracheId ?? konto.sprachenIds?.[0] ?? "",
    abzeichen: konto.abzeichen ?? [],
    lernsets: konto.lernsets ?? []
  };

  await setDoc(docRef, data);
  return docRef.id;
}

/**
 * Konto per ID suchen
 */
export async function findKontoById(id: string): Promise<Konto | null> {
  const snap = await getDoc(doc(db, KONTO_COLLECTION, id));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<Konto, 'id'>)
  };
}

/**
 * Konto per Benutzername suchen
 */
export async function findKontoByUsername(username: string): Promise<Konto | null> {
  const q = query(kontoCollection, where("benutzername", "==", username));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  const docSnap = snapshot.docs[0];
  if (!docSnap) return null;       

  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<Konto, 'id'>)
  };
}

