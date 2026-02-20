from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from llm.sentence_generator import generate_sentence

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
    language: str = "Englisch"

# Endpoint
@app.post("/generate-sentence")
def sentence(req: WordRequest):
    s = generate_sentence(req.word, req.language)
    return {"word": req.word, "sentence": s}
