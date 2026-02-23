from pydantic import BaseModel

# --- Modell für Satz-Generierung ---
class WordRequest(BaseModel):
    word: str                 # Das Wort, für das ein Satz generiert werden soll
    language: str = "en"      # Standardsprache

# --- Modell für Bewertung der Eingabe ---
class EvalRequest(BaseModel):
    user_answer: str          # Antwort des Nutzers
    original_sentence: str    # Generierten Satz
    target_word: str          # Die Vokabel, die bewertet werden soll
    target_language: str      # Sprache, in der die Bewertung erfolgen soll