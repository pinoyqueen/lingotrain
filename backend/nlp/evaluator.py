# evaluator.py
import spacy
from llm.llm import evaluate_with_llm

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

def contains_target_word(doc, target_word):
    return any(token.lemma_.lower() == target_word.lower() for token in doc)

def is_sentence_plausible(doc):
    return len(doc) > 1 and any(token.pos_ == "VERB" for token in doc)

def evaluate_answer_combined(user_answer, original_sentence, target_word, target_language="en"):
    result = {
        "correct": True,
        "errors": [],
        "word_correct": False,
        "feedback": ""
    }

    nlp = get_nlp_for_language(target_language)
    if not nlp:
        result["correct"] = False
        result["errors"].append("no_nlp_model")
        return result

    doc = nlp(user_answer)

    # Wortprüfung
    if contains_target_word(doc, target_word):
        result["word_correct"] = True
    else:
        result["correct"] = False
        result["errors"].append("target_word_missing")
        return result  # LLM nicht aufrufen, Satz sowieso falsch

    # Satz plausibel?
    if not is_sentence_plausible(doc):
        result["correct"] = False
        result["errors"].append("sentence_not_plausible")
        return result  # LLM nicht aufrufen

    # Semantikprüfung via LLM
    llm_eval = evaluate_with_llm(user_answer, original_sentence, target_language)
    if not llm_eval.get("semantically_correct", False):
        result["correct"] = False
        result["errors"].append("semantic_error")
        result["feedback"] = llm_eval.get("feedback", "")

    return result