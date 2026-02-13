import { 
  collection, 
  getDocs, 
  doc, 
  getDoc, 
  query, 
  where,
  documentId 
} from "firebase/firestore";
import { db } from "./firebase";
import type { Sprachen } from "@/models/Sprachen";

const COLLECTION_NAME = "Sprachen";
const sprachenCollection = collection(db, COLLECTION_NAME);

/**
 * Gibt alle Sprachen aus der Collection in Firestore zurück.
 * 
 * @return {Promise<Sprachen[]>} die gefundenen Sprachen
 */
export async function findAllSprachen(): Promise<Sprachen[]> {
  const snapshot = await getDocs(sprachenCollection);
  
  return snapshot.docs.map(snap => ({
    id: snap.id,
    ...(snap.data() as Omit<Sprachen, 'id'>)
  })) as Sprachen[];
}

/**
 * Gibt eine Sprache anhand ihrer ID zurück.
 * 
 * @param {string} id die ID der Sprache, die gesucht werden soll
 * @return {Promise<Sprachen | null>} die gefundene Sprache oder null
 */
export async function getSpracheById(id: string): Promise<Sprachen | null> {
  const snap = await getDoc(doc(sprachenCollection, id));
  if(!snap.exists()) return null;
  
  return {
    id: snap.id,
    ...(snap.data() as Omit<Sprachen, 'id'>)
  } as Sprachen;
}

/**
 * Gibt eine Liste von Sprachen basierend auf einer Liste von IDs zurück.
 * 
 * @param {string[]} ids die IDs der zu suchenden Sprachen
 * @return {Promise<Sprachen[]>} die gefundenen Sprachen
 */
export async function getSprachenByIds(ids: string[]): Promise<Sprachen[]> {
  if (!ids || ids.length === 0) return [];
  
  const q = query(sprachenCollection, where(documentId(), "in", ids));
  const snapshot = await getDocs(q);
  
  return snapshot.docs.map(snap => ({
    id: snap.id,
    ...(snap.data() as Omit<Sprachen, 'id'>)
  })) as Sprachen[];
}