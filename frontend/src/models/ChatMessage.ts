/**
 * Definiert eine einzelne Nachricht innerhalb der Chat-Konversation,
 */
export interface ChatMessage {
  /**
   * Rolle des Senders der Nachricht.
   * - "assistant": Nachricht vom Chatbot
   * - "user": Nachricht vom Nutzer
   */
  role: "assistant" | "user"
  /** Der eigentliche Textinhalt der Nachricht */
  content: string
  /**
   * Nachrichtentyp zur Unterscheidung verschiedener Chat-Nachrichten,
   * - "sentence": Übungseingabe
   * - "answer": Antwort im Gespräch
   * - "feedback": Feedback nach Abschluss der Konversation
   */
  type?: "sentence" | "answer" | "feedback",
  /** Zusatzinformationen, die bei Feedback-Nachrichten genutzt werden. */
  details?: {
    /** Verbesserungsvorschlag */
    suggestion?: string
    /** Bewertung der Leistung */
    rating?: string
    /** Kommentar */
    comment?: string
  }
}