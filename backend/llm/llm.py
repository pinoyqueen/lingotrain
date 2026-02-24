import json
import re
import os
import random
from litellm import completion
from .prompts import evaluation_prompt

os.environ["OPENAI_API_KEY"] = "sk-_Pmm8MuGJr5ExE_7BP-wgw"

# Basis-URL für das LiteLLM-Gateway der FH
LITELLM_BASE_URL = "https://litellm.fh-swf.cloud"

# Diese Funktion generiert einen Satz mithilfe eines Large Language Models (LLM).
# Dies wird z.B. für das Erzeugen von Sätzen im Vokabeltrainer verwendet.
# 
# Argumente: 
#   - prompt (str): Der Prompt, der an das LLM zum Generieren von Sätzen gesendet wird
#   - model (str): Das Modell zum Generieren der Sätze (Standardmäßig gpt-4o)
#
# Return: (str) der generierte Satz
def generate(prompt, model="gpt-4o"):
    response = completion(
        model = model,
        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ],
        api_base = LITELLM_BASE_URL,

        # das Modell ist kreativer und wählt nicht immer den gleichen Satz
        temperature = 0.9, 

        # Wortauswahl wird auf die wahrscheinlichsten 90% beschränkt für variablen, aber noch stabilen Text
        top_p = 0.9, 

        # Anzahl der Varianten, die das Modell erstellt (dann zufällige Auswahl)
        n = 5  
    )

    # Alle erzeugten Sätze sammeln
    sentences = [
        choice["message"]["content"].strip()
        for choice in response["choices"]
    ]

    # Zufällige Variante auswählen
    return random.choice(sentences)

# Diese Funktion bewertet einen Satz auf semantische Korrektheit mithilfe eines LLMs.
# Dabei wird geprüft, ob die Eingabe des Nutzers die gleiche Bedeutung enthält wie der
# Referenzsatz. Außerdem wird auf grammatikalische Korrektheit geprüft. 
# Es wird hier nicht geprüft, ob das Zielwort vorhanden ist oder der Satz plausibel ist
# (die Prüfung wird zuvor schon vorausgesetzt).
#
# Argumente: 
#   - user_sentence (str): der eingegebene Satz des Nutzers
#   - original_sentence (str): Der Referenzsatz (Originalsatz), der vom LLM generiert wurde
#   - target_language (str): Die Zielsprache, in der der Nutzer den Satz übersetzen soll
#
# Return: (dict) enthält semantically_correct, comment, rating, short_feedback, corrected_sentence und hint
def evaluate_with_llm(user_sentence, original_sentence, target_language="en"):

    prompt = evaluation_prompt(original_sentence, target_language, user_sentence)

    response = completion(
        model = "gpt-4o",
        messages = [
            {
                "role": "user", 
                "content": prompt
            }
        ],
        api_base = LITELLM_BASE_URL,
        temperature = 0
    )

    # JSON aus der Modellantwort extrahieren, Text davor / danach wird nicht benötigt
    text = response["choices"][0]["message"]["content"].strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)

    if match:
        try:
            result = json.loads(match.group())

            # Falls das LLM ein Feld bei der Rückgabe vergisst, würde ein Standardwert gesetzt (für mehr Robustheit)
            return {
                "semantically_correct": result.get("semantically_correct", False),
                "comment": result.get("comment", ""),
                "rating": result.get("rating", "wrong"),
                "short_feedback": result.get("short_feedback", ""),
                "corrected_sentence": result.get("corrected_sentence", ""),
                "hint": result.get("hint", "")
            }
        
        except json.JSONDecodeError:
            return {
                "semantically_correct": False,
                "comment": "JSON konnte nicht geparst werden",
                "rating": "wrong",
                "short_feedback": "",
                "corrected_sentence": "",
                "hint": "Überprüfe deine Antwort noch einmal."
            }
    else:
        return {
            "semantically_correct": False,
            "comment": "Keine JSON-Antwort vom LLM",
            "rating": "wrong",
            "short_feedback": "",
            "corrected_sentence": "",
            "hint": "Überprüfe deine Antwort noch einmal."
        }

def conversation_turn(messages):

    response = completion(
        model = "gpt-4o",
        messages = messages,
        api_base = LITELLM_BASE_URL,
        temperature = 0.7,
        max_tokens=120
    )

    return response["choices"][0]["message"]["content"].strip()