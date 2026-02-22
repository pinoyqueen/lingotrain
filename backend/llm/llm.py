import json
import re
import os
import random
from litellm import completion

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
    prompt = f"""
Du bist ein Sprachlernassistent.

Bewerte den folgenden Satz eines Lerners im Vergleich zu einem Referenzsatz:

- Referenzsatz: "{original_sentence}"
- Sprache: {target_language}
- Nutzerantwort: "{user_sentence}"

Der Satz ist korrekt, wenn die Handlung und Bedeutung mit dem Referenzsatz übereinstimmt und der Satz grammatikalisch korrekt ist.

Antworte ausschließlich im JSON-Format, z.B.:
{{
  "semantically_correct": true/false,
  "comment": "kurze technische Begründung, falls falsch",
  "rating": "correct | almost_correct | wrong",
  "short_feedback": "max 2 kurzer Satz für Lernende, freundlich formuliert, direkt im UI nutzbar,  basierend auf der technischen Begründung",
  "corrected_sentence": "die beste korrekte Übersetzung",
  "hint": "kurzer Tipp, ohne die korrekte Antwort zu verraten, falls rating=almost_correct/wrong"
}}

Gib eine kurze technische Begründung, warum der Satz falsch ist (z.B. falsches Verb, andere Handlung, Wort fehlt, Grammatikfehler).
Gib freundliches, kurzes Feedback, korrigiere den Satz und gib eine Bewertung (correct, almost_correct, wrong).

"""
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
    