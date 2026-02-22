# evaluator.py
import spacy
from llm.llm import (evaluate_with_llm)

# --- SpaCy Modelle ---
MODELS = {"de": "de_core_news_sm", "en": "en_core_web_sm", "fr": "fr_core_news_sm", "es": "es_core_news_sm"}
loaded_models = {}
for lang, model_name in MODELS.items():
    try:
        loaded_models[lang] = spacy.load(model_name)
    except OSError:
        print(f"[WARN] SpaCy-Modell {model_name} nicht gefunden.")

def get_nlp_for_language(lang_code):
    return loaded_models.get(lang_code)

# splitte die Zielvokabel in Wörter und prüfz ob diese Wortfolge vorkommt
def contains_target_word(doc, target_word):
    target_tokens = target_word.lower().split()
    doc_tokens = [token.lemma_.lower() for token in doc]
    
    for i in range(len(doc_tokens) - len(target_tokens) + 1):
        if doc_tokens[i:i+len(target_tokens)] == target_tokens:
            return True
    return False

def is_sentence_plausible(doc):
    return len(doc) > 1 and any(token.pos_ in ["VERB", "AUX"] for token in doc)

def build_rule_feedback(errors, target_word):
    if "target_word_missing" in errors:
        return f"Das Wort '{target_word}' fehlt in deinem Satz."
    
    if "sentence_not_plausible" in errors:
        return "Dein Satz ist nicht vollständig oder enthält kein Verb."
    
    if "no_nlp_model" in errors:
       return "Sprachmodell nicht verfügbar" 
    
    return ""

def evaluate_answer_combined(user_answer, original_sentence, target_word, target_language="en"):
    result = {
        "correct": True,
        "errors": [],
        "word_correct": False,
        "comment": "",      # ausführliche technische Analyse
        "feedback": "",     # Feedback für UI
        "suggestion": "",   # Korrekturvorschlag
        "rating": "",       # kann correct/almost_correct/wrong
        "hint": ""          # Tipp 
    }

    nlp = get_nlp_for_language(target_language)
    if not nlp:
        result["correct"] = False
        result["errors"].append("no_nlp_model")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result

    doc = nlp(user_answer)

    # Wortprüfung
    if contains_target_word(doc, target_word):
        result["word_correct"] = True
    else:
        result["correct"] = False
        result["errors"].append("target_word_missing")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result  # LLM nicht aufrufen, Satz sowieso falsch

    # Satz plausibel?
    if not is_sentence_plausible(doc):
        result["correct"] = False
        result["errors"].append("sentence_not_plausible")
        result["feedback"] = build_rule_feedback(result["errors"], target_word)
        result["rating"] = "wrong"
        return result  # LLM nicht aufrufen

    # Semantikprüfung via LLM
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

