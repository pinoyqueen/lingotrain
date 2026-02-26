from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from nlp.conversation import next_turn, start_conversation
from schemas import NextRequest, StartRequest, WordRequest, EvalRequest
from llm.sentence_generator import generate_sentence
from nlp.evaluator import evaluate_answer_combined, evaluate_sentence_similarity

# FastAPI App erstellen
app = FastAPI()

# CORS Middleware hinzufügen, damit die Frontend-Server Anfragen an die API
# senden kann, ohne von Browsern blockiert zu werden
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vue Dev-Server
    allow_credentials=True,                   # Cookies / Authorization Header erlaubt
    allow_methods=["*"],                      # Alle HTTP-Methoden zulässig
    allow_headers=["*"],                      # Alle Header zulässig
)

# Generiert einen Satz für ein gegebenes Wort
@app.post("/generate-sentence")
def sentence(req: WordRequest):
    s = generate_sentence(
        germanWord = req.word, 
        uebersetzung = req.uebersetzung, 
        language = req.language, 
        schwierigkeitsgrad = req.schwierigkeitsgrad
    )
    return {"word": req.word, "sentence": s}

# Bewertet die Antwort des Nutzers und liefert Feedback
@app.post("/evaluate-answer")
def evaluate(req: EvalRequest):
    result = evaluate_answer_combined(
        user_answer=req.user_answer,
        original_sentence=req.original_sentence,
        target_word=req.target_word,
        target_language=req.target_language
    )
    return result

# Bewertet die Antwort des Nutzers und liefert Feedback
@app.post("/evaluate-sentence")
def evaluate(req: EvalRequest):
    result = evaluate_sentence_similarity(
        user_answer=req.user_answer,
        original_sentence=req.original_sentence,
        target_word=req.target_word,
        target_language=req.target_language
    )
    return result

# Startet eine neue Konversation mit einem Zielwort und einer Zielsprache
@app.post("/conversation/start")
def api_start_conversation(req: StartRequest):
    state = start_conversation(req.target_word, req.target_language, req.translation)
    return state

# Führt einen nächsten Schritt in der Konversation aus, basierend auf dem aktuellen Zustand und der Nutzerantwort
@app.post("/conversation/next")
def api_next_turn(req: NextRequest):
    reply, state, finished = next_turn(
        req.state,
        req.user_input,
        req.target_language
    )

    return {
        "reply": reply,
        "state": state,
        "finished": finished
    }
