import spacy
from llm.llm import (evaluate_with_llm)

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
# 
# Argumente:
#   - doc : SpaCy-Dokument der Nutzerantwort
#   - target_word (str): die Zielvokabel, die im Satz vorkommen sollte
#
# Return: True, wenn das Zielwort im Satz vorkommt; ansonsten False
def contains_target_word(doc, target_word):

    # splitte die Zielvokabel in Wörter und prüfz ob diese Wortfolge vorkommt
    target_tokens = target_word.lower().split()
    doc_tokens = [token.lemma_.lower() for token in doc]
    
    for i in range(len(doc_tokens) - len(target_tokens) + 1):
        if doc_tokens[i:i+len(target_tokens)] == target_tokens:
            return True
        
    return False

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
    if contains_target_word(doc, target_word):
        result["word_correct"] = True
    else:
        result["correct"] = False
        result["errors"].append("target_word_missing")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result  # LLM nicht aufrufen, Satz sowieso falsch

    # Überprüfen, ob der Satz plausibel ist
    if not is_sentence_plausible(doc):
        result["correct"] = False
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

