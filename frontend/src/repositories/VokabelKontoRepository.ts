import { db } from './firebase'
import {
  collection,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  updateDoc,
  writeBatch,
  limit,
  DocumentReference,
  DocumentSnapshot,
  increment,
} from 'firebase/firestore'
import type { VokabelKonto } from '@/models/VokabelKonto'
import { VOKABELN_STATUS, type VokabelnStatus } from '@/models/VokabelnStatus'
import type { Vokabeln } from '@/models/Vokabeln'

const VOKABELN_COLLECTION = 'Vokabeln'
const VK_COLLECTION = 'VokabelKonto'
const vkCollection = collection(db, VK_COLLECTION)

/**
 * Erstellt einen neuen Eintrag in VokabelKonto.
 * Dieser Eintrag speichert den Lernstatus einer spezifischen Vokabel für einen bestimmten Benutzer.
 * @param vk VokabelKonto-Objekt
 * @returns Promise<DocumentRef> - Referenz zum neuen VokabelKonto-Eintrag
 */
export async function create(vk: VokabelKonto) {
    const vokabelRef = doc(db, VOKABELN_COLLECTION, vk.vokabelId)
    return await addDoc(vkCollection, {
        vokabelId: vk.vokabelId,
        kontoId: vk.kontoId,
        status: vk.status,
        lernsetId: vk.lernsetId,
        anzahlGelernt: vk.anzahlGelernt,
        vokabelRef
    })
}

/**
 * Aktualisiert den Lernstatus einer bestimmten Vokabel für einen bestimmten Benutzer.
 * @param kontoId Benutzer-Id
 * @param vokabelId Id der Vokabel
 * @param status Neuer Status (NICHT_GELERNT, FALSCH, RICHTIG)
 */
export async function updateStatus(kontoId: string, vokabelId: string, status: VokabelnStatus): Promise<void> {
    const q = query(vkCollection,
        where('vokabelId', '==', vokabelId),
        where('kontoId', '==', kontoId),
        limit(1)
    )
    
    const snap = await getDocs(q)
    const doc0 = snap.docs[0]

    if (!doc0) {
        throw new Error('VokabelKonto nicht gefunden')
    }

    if (status === VOKABELN_STATUS.RICHTIG) {
        await updateDoc(doc0.ref, {
            status: status,
            anzahlGelernt: increment(1)
        })
    } else {
        await updateDoc(doc0.ref, {
            status: status
        })
    }

}

/**
 * Holt alle Vokabeln eines Lernsets, die für das Training relevant sind.
 * Das sind nur solche mit Status NICHT_GELERNT oder FALSCH.
 * Wenn alle gelernt sind, dann automatische Status-Zurücksetzung.
 * 
 * @param lernsetId Id des Lernsets
 * @param kontoId Benutzer-Id
 * @returns Promise<Vokabeln[]> - Liste der Vokabelobjekte
 */
export async function getAllVokabelnForTraining(lernsetId: string, kontoId: string): Promise<Vokabeln[]> {
    const q = query(
        vkCollection,
        where('kontoId', '==', kontoId),
        where('lernsetId', '==', lernsetId),
        where('status', 'in', [VOKABELN_STATUS.NICHT_GELERNT, VOKABELN_STATUS.FALSCH])
    )

    const snap = await getDocs(q)

    // wenn alles gelernt -> Status zurücksetzen
    if(snap.empty) {
        await resetAndReload(kontoId, lernsetId)
        return getAllVokabelnForTraining(lernsetId, kontoId)
    }

    // Lade zugehörige Vokabel-Daten
    const vokTasks = snap.docs.map(async (vkDoc) => {
        const data = vkDoc.data() as any
        const ref: DocumentReference | undefined = data?.vokabelRef
        const vokabelId: string | undefined = data?.vokabelId

        let vSnap: DocumentSnapshot | null = null

        if (ref) {
            vSnap = await getDoc(ref)
        } else if (vokabelId) {
            vSnap = await getDoc(doc(db, VOKABELN_COLLECTION, vokabelId))
        }

        if (!vSnap || !vSnap.exists())  return null

        return mapVokabelDoc(vSnap)
    })

    // Filtert null-Einträge heraus
    const resolved = await Promise.all(vokTasks)
    return resolved.filter(Boolean) as Vokabeln[]
    
}

/**
 * Setzt alle Vokabelstatus eines Lernsets wieder auf NICHT_GELERNT.
 * Wird automatisch aufgerufen, wenn alle Vokabeln gelernt wurden.
 * 
 * @param kontoId Benutzer Id
 * @param lernsetId Lernset Id
 * @returns Promise<void>
 */
async function resetAndReload(kontoId: string, lernsetId: string): Promise<void> {
    const qAll = query(
        vkCollection,
        where('kontoId', '==', kontoId),
        where('lernsetId', '==', lernsetId)
    )

    const snap = await getDocs(qAll)

    if (snap.empty) return

    const batch = writeBatch(db)
    snap.docs.forEach((d) => {
        batch.update(d.ref, {status: VOKABELN_STATUS.NICHT_GELERNT})
    })
    await batch.commit()

}

/**
 * Löscht den VokabelKonto-Eintrag einer bestimmten Vokabel für einen bestimmten Nutzer.
 * @param kontoId Benutzer-Id
 * @param vokabelId Id der Vokabel
 */
export async function deleteVK(kontoId: string, vokabelId: string): Promise<void> {
    const q = query(
        vkCollection,
        where('vokabelId', '==', vokabelId),
        where('kontoId', '==', kontoId),
        limit(1)
    )

    const snap = await getDocs(q)
    const doc0 = snap.docs[0]

    if (!doc0)
        throw new Error('Vokabelkonto nicht gefunden')

    await deleteDoc(doc0.ref)
}

export async function getAnzahlGelernt(kontoId: string, vokabelId: string): Promise<number> {
  try {
    const q = query(
      vkCollection,
      where("kontoId", "==", kontoId),
      where("vokabelId", "==", vokabelId),
      limit(1)
    )

    const qs = await getDocs(q)

    if (qs.empty) {
      return 0
    }

    const doc = qs.docs[0]
    if (doc) {
        const val = doc.data().anzahlGelernt
        return val ?? 0
    }
    
    return 0

  } catch (e) {
    console.error("Abfrage anzahlGelernt fehlgeschlagen", e)
    throw e
  }
}

/**
 * Wandelt ein Firestore-Vokabel-Dokument in ein Vokabeln-Modell um.
 * Stellt sicher, dass fehlende Fehler mit Defaults gefüllt werden.
 * 
 * @param docSnap Firestore-Dokument
 * @returns Vokabeln-Objekt
 */
function mapVokabelDoc(docSnap: DocumentSnapshot): Vokabeln {
    const d = docSnap.data() as any
    
    return {
        id: docSnap.id,
        vokabel: d?.vokabel ?? '',
        uebersetzung: d?.uebersetzung ?? undefined,
        beschreibung: d?.beschreibung ?? undefined,
        setId: d?.setId ?? undefined,
        isWort: Boolean(d?.isWort),
    }

}

