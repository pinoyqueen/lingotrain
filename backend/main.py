from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from schemas import WordRequest, EvalRequest
from llm.sentence_generator import generate_sentence
from nlp.evaluator import evaluate_answer_combined

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
