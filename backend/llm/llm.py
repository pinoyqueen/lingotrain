import os
import random
from litellm import completion
from .prompts import evaluation_prompt

os.environ["OPENAI_API_KEY"] = "sk-_Pmm8MuGJr5ExE_7BP-wgw"

LITELLM_BASE_URL = "https://litellm.fh-swf.cloud"

def generate(prompt, model="gpt-4.1-mini"):
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
        top_p=0.9, 

        # Anzahl der Varianten, die das Modell erstellt (dann zufällige Auswahl)
        n=5  
    )

    # Alle erzeugten Sätze sammeln
    sentences = [
        choice["message"]["content"].strip()
        for choice in response["choices"]
    ]

    # Zufällige Variante auswählen
    return random.choice(sentences)

def evaluate_with_llm(user_sentence, original_sentence, target_language="en"):
    prompt = evaluation_prompt(original_sentence, target_language, user_sentence)

    response = completion(
        model="gpt-4.1-mini",
        messages=[{"role": "user", "content": prompt}],
        api_base=LITELLM_BASE_URL,
        temperature=0
    )

    # Sauberes Parsen des JSON
    import json, re
    text = response["choices"][0]["message"]["content"].strip()
    match = re.search(r'\{.*\}', text, re.DOTALL)
    if match:
        try:
            return json.loads(match.group())
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
    