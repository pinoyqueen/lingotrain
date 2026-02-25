export interface ChatMessage {
  role: "assistant" | "user"
  content: string
  type?: "sentence" | "answer" | "feedback",
  details?: {
    suggestion?: string
    rating?: string
    comment?: string
  }
}