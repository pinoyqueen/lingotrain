import { 
  doc, 
  setDoc, 
  updateDoc,
  collection, 
  query, 
  where, 
  getDocs, 
  getDoc, 
  arrayUnion,
  arrayRemove,
  deleteDoc,
  serverTimestamp,
  increment
} from "firebase/firestore";
import { db } from "./firebase"; 
import type { Konto } from "@/models/Konto";

const KONTO_COLLECTION = "Konto";
const kontoCollection = collection(db, KONTO_COLLECTION);

/**
 * Anlegen eines neues Konto-Document in der Collection der DB.
 * 
 * Die Dokument-ID entspricht der bereits existierenden Firebase-Auth-User-ID,
 * um Auth-User und das Konto-Document eindeutig zu verknüpfen.
 * 
 * @param {Konto} konto das neu zu erstellende Konto
 * @return {Promise<string>} die ID des erstellten Kontos (Dokument-ID)
 */
export async function createKonto(konto: Konto): Promise<string> {
  const docRef = doc(kontoCollection, konto.id);
  
  // Default-Werte setzen, falls noch nicht definiert
  const data = {
    benutzername: konto.benutzername,
    vorname: konto.vorname,
    nachname: konto.nachname,
    email: konto.email,
    anzTage: 0,
    punkte: konto.punkte ?? 0,
    benachrichtigung: konto.benachrichtigung ?? false,
    profilbild_id: konto.profilbild_id ?? "",  
    sprachenIds: konto.sprachenIds ?? [],
    aktuelleSpracheId: konto.aktuelleSpracheId ?? konto.sprachenIds?.[0] ?? "",
    abzeichenIds: konto.abzeichenIds ?? [],
    lernsets: konto.lernsets ?? [],
    letztesLernes: konto.letztesLernen ?? null,
    vokabelnProTag: {}
  };

  await setDoc(docRef, data);
  return docRef.id;
}

/**
 * Gibt das Konto mit der gewünschten ID aus der Collection in Firestore zurück.
 *
 * @param {string} id die ID des zu suchenden Kontos
 * @return {Promise<Konto | null>} das gefundene Konto mit der ID; null wenn kein Konto gefunden
 */
export async function findKontoById(id: string): Promise<Konto | null> {
  const snap = await getDoc(doc(kontoCollection, id));
  if (!snap.exists()) return null;

  return {
    id: snap.id,
    ...(snap.data() as Omit<Konto, 'id'>)
  };
}

/**
 * Gibt das Konto mit dem gewünschten Username aus der Collection in Firestore zurück.
 * 
 * @param {string} username der Benutzername des zu suchenden Kontos
 * @return {Promise<Konto | null>} das gefundene Konto; null wenn kein Konto gefunden
 */
export async function findKontoByUsername(username: string): Promise<Konto | null> {
  const q = query(kontoCollection, where("benutzername", "==", username));
  const snapshot = await getDocs(q);

  if (snapshot.empty) return null;

  // Das erste Konto mit dem Usernamen nehmen (es dürfte nur eins geben)
	const docSnap = snapshot.docs[0];
  if (!docSnap) return null;       

  return {
    id: docSnap.id,
    ...(docSnap.data() as Omit<Konto, 'id'>)
  };
}

/**
 * Aktualisiert ausgewählte Profildaten eines Kontos.
 *
 * Es werden ausschließlich folgende Felder aktualisiert:
 * - vorname
 * - nachname
 * - benutzername
 * - profilbild_id
 * 
 * @param {string} id die ID des zu aktualisierenden Kontos
 * @param {Partial<Konto>} data die aktualisierten Daten
 * @returns {Promise<void>}
 */
export async function updateKonto(id: string, data: Partial<Konto>): Promise<void> {
  try {
    const docRef = doc(kontoCollection, id);
    await updateDoc(docRef, data);

  } catch (error) {
    console.error("Fehler beim Aktualisieren des Kontos im Repository:", error);
    throw error; 
  }
}

/**
 * Aktualisiert die aktuell ausgewählte Sprache des Kontos in der Datenbank.
 * 
 * @param {string} id die ID des Kontos, bei dem die Sprache aktualisiert werden soll
 * @param {string} aktuelleSpracheId die ID der neu zu setzenden, aktuellen Sprache
 * @return {Promise<void>} 
 */
export async function editAktuelleSprache(id: string, aktuelleSpracheId: string): Promise<void> {
  try {
    const docRef = doc(kontoCollection, id);

    await updateDoc(docRef, {
      aktuelleSpracheId: aktuelleSpracheId
    });
    
  } catch (error) {
    console.error("Fehler beim Aktualisieren der Sprache im Repository:", error);
    throw error; 
  }
}

/**
 * Aktualisiert die gelernten Vokabeln pro Tag für ein bestehendes Konto in der Datenbank.
 * 
 * Neue Vokabeln werden immer unter dem Key des heutigen Datums gespeichert. Sollte das Datum
 * schon existieren, wird der Wert erhöht.
 * 
 * @param {string} id die ID des Kontos, bei dem die gelernten Vokabeln pro Tag aktualisiert werden sollen
 * @param {number} neueVokabeln die Anzahl der neu gelernten Vokabeln
 */
export async function updateVokabelnProTag(id: string, neueVokabeln: number): Promise<void> {
  try{
    const docRef = doc(kontoCollection, id);

    // Das heutige Datum im Format yyyy-MM-dd erzeugen
    const heuteKey = new Date().toISOString().slice(0, 10);

    await updateDoc(docRef, {
      [`vokabelnProTag.${heuteKey}`]: increment(neueVokabeln)
    });

  } catch (error) {
    console.error("Fehler beim Aktualisieren der gelernten Vokabeln pro Tag im Repository:", error);
    throw error; 
  }
}

/**
 * Fügt einem Konto eine neue Sprache hinzu.
 *
 * Die Sprache wird per arrayUnion zur Liste hinzugefügt
 * Gleichzeitig wird sie als aktuelle Sprache gesetzt
 *
 * @param {string} id - Konto-ID
 * @param {string} spracheId - ID der hinzuzufügenden Sprache
 * @returns {Promise<void>}
 */
export async function addSprache(id: string, spracheId: string): Promise<void> {
  try {
    const docRef = doc(kontoCollection, id);

    await updateDoc(docRef, {
      sprachenIds: arrayUnion(spracheId),
      aktuelleSpracheId: spracheId
    });
    
  } catch (error) {
    console.error("Fehler beim Hinzufügen der Sprache im Repository:", error);
    throw error; 
  }
}

/**
 * Entfernt eine Sprache aus dem Konto.
 *
 * Die Sprache wird per arrayRemove aus dem Array entfernt
 * Die aktuell aktive Sprache wird entsprechend angepasst
 *
 * @param {string} id - Konto-ID
 * @param {string} spracheId - Zu entfernende Sprache
 * @param {string | null} neueAktiveSpracheId - Neue aktive Sprache oder null
 * @returns {Promise<void>}
 */
export async function removeSprache(id: string, spracheId: string, neueAktiveSpracheId: string | null): Promise<void> {
  try {
    const docRef = doc(kontoCollection, id);

    await updateDoc(docRef, {
      sprachenIds: arrayRemove(spracheId),
      aktuelleSpracheId: neueAktiveSpracheId
    });
    
  } catch (error) {
    console.error("Fehler beim Entfernen der Sprache im Repository:", error);
    throw error; 
  }
}

/**
 * Löscht ein Konto.
 *
 * Das Document mit der übergebenen ID wird aus der Konto-Collection
 * der Firebase DB gelöscht.
 *
 * @param {string} id - Konto-ID
 * @returns {Promise<void>}
 */
export async function deleteKonto(id: string): Promise<void> {
  try {
    const docRef = doc(kontoCollection, id);
    await deleteDoc(docRef);

  } catch (error) {
    console.error("Fehler beim Löschen des Kontos: ", error);
    throw error; 
  }
}

/**
 * Aktualisiert die Anzahl der gelernten Tage (anzTage) und das letzte Lern-Datum (letztesLernen).
 * 
 * @param kontoId - ID des Kontos
 * @param reset - true: setzt anzTage auf 0, false: increment um 1
 */
export async function updateFlammeAndLetztesLernen(kontoId: string, reset: boolean): Promise<void> {
  const docRef = doc(db, KONTO_COLLECTION, kontoId);

  const updates: any = {}

  if (reset) {
    updates.anzTage = 0;
  } else {
    updates.anzTage = increment(1)
    updates.letztesLernen = serverTimestamp()
  }

  try {
    await updateDoc(docRef, updates)
  } catch (error) {
    console.error("Fehler beim Aktualisieren von anzTage/letztesLernen:", error)
    throw error
  }
}

/**
 * Liefert das Datum des letzten Lernens zurück.
 * 
 * @param kontoId - ID des Kontos
 * @returns Datum des letzten Lernens oder null, falls nicht vorhanden
 */
export async function getLetztesLernenById(kontoId: string): Promise<Date | null> {
  const docRef = doc(db, KONTO_COLLECTION, kontoId);

  try {
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;

    // Falls letztesLernen noch nicht gesetzt ist → null zurückgeben
    const lastLearning: any = snap.data()?.letztesLernen;
    return lastLearning ? lastLearning.toDate() : null;

  } catch (error) {
    console.error("Fehler beim Laden von letztesLernen:", error);
    throw error;
  }
}

/**
 * Fügt einem Konto ein neues Abzeichen hinzu.
 *
 * Das Abzeichen wird per arrayUnion zur Liste hinzugefügt.
 * Falls es bereits existiert, wird es nicht doppelt gespeichert.
 *
 * @param kontoId - ID des Kontos
 * @param abzeichenId - ID des hinzuzufügenden Abzeichens
 */
export async function addAbzeichen(
  kontoId: string,
  abzeichenId: string
): Promise<void> {
  try {
    const docRef = doc(kontoCollection, kontoId)

    await updateDoc(docRef, {
      abzeichenIds: arrayUnion(abzeichenId)
    })

  } catch (error) {
    console.error("Fehler beim Hinzufügen eines Abzeichens:", error)
    throw error
  }
}

/**
 * Entfernt ein Abzeichen aus einem Konto.
 *
 * Das Abzeichen wird per arrayRemove aus dem Array entfernt,
 * falls es vorhanden ist.
 *
 * @param kontoId - ID des Kontos
 * @param abzeichenId - ID des zu entfernenden Abzeichens
 */
export async function removeAbzeichen(
  kontoId: string,
  abzeichenId: string
): Promise<void> {
  try {
    const docRef = doc(kontoCollection, kontoId)

    await updateDoc(docRef, {
      abzeichenIds: arrayRemove(abzeichenId)
    })

  } catch (error) {
    console.error("Fehler beim Entfernen eines Abzeichens:", error)
    throw error
  }
}