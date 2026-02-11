import { 
  getFirestore, 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where,
  documentId 
} from "firebase/firestore";
import type { Sprachen } from "@/models/Sprachen";

const COLLECTION_NAME = "Sprachen";

/**
 * Gibt alle Sprachen aus der Collection in Firestore zurück.
 */
export async function findAllSprachen(): Promise<Sprachen[]> {
  const db = getFirestore();
  const sprachenCol = collection(db, COLLECTION_NAME);
  const snapshot = await getDocs(sprachenCol);
  
  return snapshot.docs.map(snap => ({
    id: snap.id,
    ...(snap.data() as Omit<Sprachen, 'id'>)
  })) as Sprachen[];
}

/**
 * Gibt eine Sprache anhand ihrer ID zurück.
 */
export async function getSpracheById(id: string): Promise<Sprachen | null> {
  const db = getFirestore();
  const docRef = doc(db, COLLECTION_NAME, id);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    return {
      id: snap.id,
      ...(snap.data() as Omit<Sprachen, 'id'>)
    } as Sprachen;
  }
  
  return null;
}

/**
 * Gibt eine Liste von Sprachen basierend auf einer Liste von IDs zurück.
 */
export async function getSprachenByIds(ids: string[]): Promise<Sprachen[]> {
  if (!ids || ids.length === 0) return [];

  const db = getFirestore();
  const sprachenCol = collection(db, COLLECTION_NAME);
  
  // Firestore "in" Query ist effizienter als einzelne findById Aufrufe
  // Achtung: "in" unterstützt maximal 10 IDs pro Abfrage. 
  // Für mehr IDs müsste man die Liste splitten (Chunking).
  const q = query(sprachenCol, where(documentId(), "in", ids));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(snap => ({
    id: snap.id,
    ...(snap.data() as Omit<Sprachen, 'id'>)
  })) as Sprachen[];
}