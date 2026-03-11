import spacy
from llm.llm import (evaluate_with_llm)
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity
import re

# Sentence-Embedding-Modell laden für Ähnlichkeitsberechnungen der Sätzen
model = SentenceTransformer("all-MiniLM-L6-v2")

# ----------------------------------------------------------------------
# Laden der SpaCy-Modelle für unterstützte Sprachen des Vokabeltrainers
# ----------------------------------------------------------------------

# Sprachcodes auf die SpaCy-Modelle mappen
MODELS = {
    "de": "de_core_news_sm", 
    "en": "en_core_web_sm", 
    "fr": "fr_core_news_sm", 
    "es": "es_core_news_sm"
}

# Modelle einmal beim Start laden
loaded_models = {}
for lang, model_name in MODELS.items():
    try:
        loaded_models[lang] = spacy.load(model_name)
    except OSError:
        print(f"[WARN] SpaCy-Modell {model_name} nicht gefunden.")

# Gibt das passende SpaCy-Modell für eine Sprache zurück.
#
# Argumente:
#   - lang_code (str): der Sprachcode, der geladen werden soll
#
# Return: das geladene SpaCy-Modell oder None
def get_nlp_for_language(lang_code):
    return loaded_models.get(lang_code)

# ----------------------------------------------------------------------
# Prüfungen der Eingabe (eigene Logik, ohne LLM)
# ----------------------------------------------------------------------

# Prüft, ob die Zielvokabel im eingegebenen Satz vorkommt.
# Dabei werden auch Vokabeln unterstützt, die aus mehreren Wörtern besteht.
# Es wird sowohl der exakte Text als auch die Lemma-Form der Wörter geprüft,
# um Unterschiede wie "hiking" und "hike" zu erkennen.
# 
# Argumente:
#   - doc : SpaCy-Dokument der Nutzerantwort
#   - target_word (str): die Zielvokabel, die im Satz vorkommen sollte
#   - target_language (str): die Zielsprache 
# 
# Return: True, wenn das Zielwort im Satz vorkommt; ansonsten False
def contains_target_word(doc, target_word, target_language):

    # Zielvokabel tokenisieren
    target_tokens = target_word.lower().split()

    # Zielvokabel lemmatisieren
    nlp = get_nlp_for_language(target_language)
    target_lemmas = [token.lemma_.lower() for token in nlp(target_word)]

    # Tokens und Lemmata des Nutzersatzes
    doc_tokens_text = [token.text.lower() for token in doc]
    doc_tokens_lemma = [token.lemma_.lower() for token in doc]

    # Sliding-Window-Vergleich für Mehrwort-Vokabeln
    for i in range(len(doc_tokens_text) - len(target_tokens) + 1):
        text_slice = doc_tokens_text[i:i + len(target_tokens)]
        lemma_slice = doc_tokens_lemma[i:i + len(target_tokens)]

        if (
            text_slice == target_tokens or
            lemma_slice == target_tokens or
            lemma_slice == target_lemmas
        ):
            return True

    return False

# Prüft, ob der Satz mit einem Satzzeichen endet.
#
# Argumente:
#   - user_sentence (str): der Satz, den der Nutzer eingegeben hat
#
# Return: True, wenn ein Satzzeichen vorhanden ist; ansonsten False
def check_sentence_end(user_sentence):
    user_sentence = user_sentence.strip()
    if not user_sentence:
        return False
    return user_sentence[-1] in [".", "!", "?"]

# Prüft, ob der Satz plausibel ist.
# Ein Satz gilt als plausibel, wenn er mehr als ein Token enthält und mindestens
# ein Verb oder Hilfsverb enthält. Sollte ein Wort die Wurzel eines Satzes sein, so 
# gilt der Satz auch als plausibel, um auch korrekt konjugierte Verben in verschiedenen
# Sprachen zu erkennen.
#
# Argumente:
#   - doc : SpaCy-Dokument der Nutzerantwort
#
# Return: True, wenn der Satz plausibel ist; ansonsten false
def is_sentence_plausible(doc):

    if len(doc) <= 1:
        return False

    for token in doc:
        # POS-Tag oder morphologische Merkmale
        if token.pos_ in {"VERB", "AUX"} or any(key in token.morph.to_dict() for key in ["Tense", "Person", "VerbForm"]):
            return True
        
        # Wenn ein Wort die Wurzel des Satzes ist, vertrauen wir darauf, dass das LLM die wahre Plausibilität klärt
        # bei Spanisch werden sonst Wörter wie "como" oder Vergangenheitsformen von Verben nicht anerkannt
        if token.dep_ == "ROOT":
            return True

    return False

# Erzeugt einfaches Feedback für die regelbasierten Fehler. Dafür wird kein LLM verwendet.
# 
# Argumente:
#   - errors: eine Liste mit den erkannten Fehlercodes
#   - target_word (str): die Zielvokabel, die im Satz vorkommen sollte
#
# Return: (str) der Text mit dem Feedback
def build_rule_feedback(errors, target_word):
    if "target_word_missing" in errors:
        return f"Das Wort '{target_word}' fehlt in deinem Satz."
    
    if "missing_end_punctuation" in errors:
        return f"Das Satzzeichen am Ende fehlt oder ist falsch."
    
    if "sentence_not_plausible" in errors:
        return "Dein Satz ist nicht vollständig oder enthält kein Verb."
    
    if "no_nlp_model" in errors:
       return "Sprachmodell nicht verfügbar" 
    
    return ""

# ----------------------------------------------------------------------
# Kombinierte Bewertung aus eigener Logik und zusätzlichem LLM
# ----------------------------------------------------------------------

# Bewertet eine Nutzerantwort mithilfe eigener Logik und einem zusätzlichen LLM.
# Dabei wird zunächst geprüft, ob das Zielwort vorkommt und anschließend, ob der Satz
# plausibel ist. Wenn beides zutrifft, wird ein LLM verwendet, um den Satz auf Semantik
# und Grammatik zu überprüfen.
#
# Argumente:
#   - user_answer (str): der eingegebene Satz des Nutzers, der überprüft werden soll
#   - original_sentence (str): Der Referenzsatz (Originalsatz), der vom LLM generiert wurde
#   - target_word (str): das Zielwort, welches im Satz vorkommen soll
#   - target_language (str): Die Zielsprache, in der der Nutzer den Satz übersetzen soll
#
# Return: (dict) die Bewertung der Eingabe
def evaluate_answer_combined(user_answer, original_sentence, target_word, target_language="en"):
    
    # die standardmäßige Ergebnisstruktur
    result = {
        "correct": True,        # finale Entscheidung (ist für die Speicherung in der DB notwendig)
        "errors": [],           # technische Fehlercodes
        "word_correct": False,  # Zielwort korrekt?
        "comment": "",      # ausführliche technische Analyse
        "feedback": "",     # Feedback für UI
        "suggestion": "",   # Korrekturvorschlag
        "rating": "",       # kann correct/almost_correct/wrong
        "hint": ""          # Tipp 
    }

    # Laden des NLP-Modells für die benötigte Zielsprache
    nlp = get_nlp_for_language(target_language)
    if not nlp:
        result["correct"] = False
        result["errors"].append("no_nlp_model")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result

    # Analysieren der Nutzerantwort
    doc = nlp(user_answer)

    # Überprüfen, ob der Satz das Zielwort enthält
    if contains_target_word(doc, target_word, target_language):
        result["word_correct"] = True
    else:
        result["correct"] = False
        result["hint"] = "Achte darauf, das richtige Wort zu verwenden."
        result["errors"].append("target_word_missing")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result  # LLM nicht aufrufen, Satz sowieso falsch
    
    # Überprüfung, ob der Satz mit einem Satzzeichen endet
    if not check_sentence_end(user_answer):
        result["correct"] = False
        result["hint"] = "Achte auf fehlende Satzzeichen."
        result["errors"].append("missing_end_punctuation")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result # LLM nicht aufrufen

    # Überprüfen, ob der Satz plausibel ist
    if not is_sentence_plausible(doc):
        result["correct"] = False
        result["hint"] = "Achte darauf, einen vollständigen Satz zu schreiben."
        result["errors"].append("sentence_not_plausible")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result  # LLM nicht aufrufen

    # Semantikprüfung mithilfe des LLMs
    llm_eval = evaluate_with_llm(user_answer, original_sentence, target_language)

    result["comment"] = llm_eval.get("comment", "")
    result["feedback"] = llm_eval.get("short_feedback", "")
    result["suggestion"] = llm_eval.get("corrected_sentence", "")
    result["rating"] = llm_eval.get("rating", "wrong")

    # Korrektheit basierend auf LLM
    if result["rating"] == "correct":
        result["correct"] = True
        if not result["feedback"]:
            result["feedback"] = "Richtig übersetzt!"
        if not result["comment"]:
            result["comment"] = "sentence semantically and grammatically correct"
        result["hint"] = ""
    else:
        result["correct"] = False
        
        # Hinweis nur geben, wenn almost_correct oder wrong
        result["hint"] = llm_eval.get("hint", "")

    return result

# Normalisiert einen Text für Vergleichszwecke.
#
# Argumente:
#   - text (str): Ein Satz (kann der Eingabetext oder die in DB gespeicherten Übersetzung)
#
# Return: (str): Der normalisierte text
def normalize(text: str) -> str:
    text = text.lower().strip()
    text = re.sub(r"[^\w\s]", "", text)
    return text

# Berechnet die semantische Ähnlichkeit zwischen zwei Sätzen mithilfe eines SBERT-Modells.
# Die Sätze werden duech das Modell in Embeddings umgewandelt und deren Cosinus-Ähnlichkeit werden berechnet.
#
# Argumente:
#   - a (str): Der Eingabetext
#   - b (str): Der Referenzsatz
#
# Return: (float): Ähnlichkeitswert zwischen 0 (keine Ähnlichkeit) und 1 (identisch)
def compute_similarity(a: str, b: str) -> float:
    emb = model.encode([a, b])
    return float(cosine_similarity([emb[0]], [emb[1]])[0][0])

# Bewertet die Antwort eines Nutzer im Satzmodus.
# Zunächst werden geprüft, ob der Eingabetext exakt mit der Übersetzung übereinstimmt.
# Wenn ja, wird es als richtig bewertet.
# Ansonsten werden die semantische Ähnlichkeit mit SBERT geprüft.
#   similarity >= 0.85: fast korrekt, sinngleich
#   similarity >= 0.65: teilweise korrekt, kleine Unterschiede
#   similarity < 0.65: falsch
#   
# Argumente:
#   - user_answer: Vom Nutzer eingegebener Satz
#   - original_sentence: Referenzsatz, der in DB gespeichert ist
#   - target_word: nicht nötig
#   - target_language: nicht nötig
#
# Return: (dict) die Bewertung der Eingabe
def evaluate_sentence_similarity(user_answer, original_sentence, target_word, target_language):

    user_norm = normalize(user_answer)
    original_norm = normalize(original_sentence)

    if user_norm == original_norm:
        return {
            "correct": True,
            "rating": "correct",
            "feedback": "Perfekt! Exakt richtig.",
            "comment": "",
            "suggestion": ""
        }

    similarity = compute_similarity(user_answer, original_sentence)

    if similarity >= 0.85:
        return {
            "correct": False,
            "rating": "almost_correct",
            "feedback": "Sehr gut! Sinngleich.",
            "comment": f"Ähnlichkeit: {round(similarity, 2)}",
            "suggestion": original_sentence
        }

    elif similarity >= 0.65:
        return {
            "correct": False,
            "rating": "almost_correct",
            "feedback": "Fast richtig.",
            "comment": f"Ähnlichkeit: {round(similarity, 2)}",
            "suggestion": original_sentence
        }

    else:
        return {
            "correct": False,
            "rating": "wrong",
            "feedback": "Leider nicht korrekt.",
            "comment": f"Ähnlichkeit: {round(similarity, 2)}",
            "suggestion": original_sentence
        }

