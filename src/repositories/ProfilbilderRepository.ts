import { 
  collection, 
  getDocs
} from "firebase/firestore";
import { db } from "./firebase";
import type { Profilbild } from "@/models/Profilbild";

const COLLECTION_NAME = "Profilbilder";
const profilbilderCollection = collection(db, COLLECTION_NAME);

/**
 * Gibt alle verfügbaren Profilbilder aus der Collection in Firestore zurück.
 * 
 * @return {Promise<Profilbild[]>} die gefundenen Sprachen
 */
export async function findAllProfilbilder(): Promise<Profilbild[]> {
  const snapshot = await getDocs(profilbilderCollection);
  
  return snapshot.docs.map(snap => ({
    id: snap.id,
    ...(snap.data() as Omit<Profilbild, 'id'>)
  })) as Profilbild[];
}