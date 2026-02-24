export interface ChatMessage {
  role: "assistant" | "user"
  content: string
  type?: "sentence" | "answer" | "feedback"
}