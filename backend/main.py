from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llm.sentence_generator import generate_sentence
from nlp.evaluator import evaluate_answer_combined

# FastAPI App erstellen
app = FastAPI()

# CORS Middleware hinzufügen
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vue Dev-Server
    allow_credentials=True,
    allow_methods=["*"],  # erlaubt POST, OPTIONS usw.
    allow_headers=["*"],
)

# Request Model
class WordRequest(BaseModel):
    word: str
    language: str = "en" # Standardsprache

# Bewertung der Eingabe
class EvalRequest(BaseModel):
    user_answer: str
    original_sentence: str
    target_word: str
    target_language: str

# Endpoint
@app.post("/generate-sentence")
def sentence(req: WordRequest):
    s = generate_sentence(req.word, req.language)
    return {"word": req.word, "sentence": s}

@app.post("/evaluate-answer")
def evaluate(req: EvalRequest):
    result = evaluate_answer_combined(
        user_answer=req.user_answer,
        original_sentence=req.original_sentence,
        target_word=req.target_word,
        target_language=req.target_language
    )
    return result
