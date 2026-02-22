# Generiert den Prompt für das LLM, um einen einfachen Satz auf Deutsch zu einem gegebenen
# Wort zu erstellen.
#
# Argumente: 
#   - germanWord (str): Das Zielwort, das im Satz vorkommen soll
#   - uebersetzung (str): Die Bedeutung des Wortes in der Zielsprache
#   - language (str): die Sprache, auf die sich die Bedeutung bezieht
#
# Return: (str) der fertige Prompt-Text für das LLM
def sentence_prompt(germanWord, uebersetzung, language = "en"):
    return f"""
Du bist ein Sprachlernassistent.

Generiere bitte exakt einen einfachen Satz in der Sprache Deutsch.
Beachte dabei folgende Regeln:
- Der Satz muss das Wort "{germanWord}" enthalten.
- Der Satz muss inhaltlich zur Übersetzung "{uebersetzung}" in {language} passen.
- Der Satz muss grammatikalisch korrekt sein.
- Der Satz soll korrekt mit einem Punkt, Ausrufezeichen oder Fragezeichen enden.
- Achte darauf, dass nur ein Satzzeichen am Ende steht.
- Benutze einfache Alltagssprache.
- Halte den Satz kurz, aber du darfst auch einen Nebensatz einfügen.
- Variiere den Satzstil, z.B. mit verschiedenen Verben oder Satzanfängen und vermeide identische Wiederholungen.
- Erzeuge wenn nötig Nebensätze, aber keine verschachtelten Hauptsätze.
- Keine Erklärungen, Übersetzungen oder zusätzlichen Sätze.

Erzeuge mehrere sinnvolle Versionen des Satzes und wähle eine zufällige aus.
Gib NUR den einen Satz aus. 
"""

# Generiert den Prompt für das LLM, um einen eingegebenen Satz des Nutzers im Vergleich
# zu einem Referenzsatz (dem Originalsatz) zu bewerten. Dabei wird besonders auf die
# semantische Korrektheit geachtet, aber auch auf Zeichensetzung und Rechtschreibung.
# Zusätzlich werden ein Hinweis, der korrigierte Satz und eine kurze Rückmeldung geliefert.
#
# Argumente: 
#   - original_sentence (str): Der Referenzsatz (Originalsatz), der vom LLM generiert wurde
#   - target_language (str): Die Zielsprache, in der der Nutzer den Satz übersetzen soll
#   - user_sentence (str): der eingegebene Satz des Nutzers
#
# Return: (str) der fertige Prompt-Text für das LLM
def evaluation_prompt(original_sentence, target_language, user_sentence):
    return f"""
Du bist ein Sprachlernassistent.

Bewerte den folgenden Satz eines Lerners im Vergleich zu einem Referenzsatz:

- Referenzsatz: "{original_sentence}"
- Sprache: {target_language}
- Nutzerantwort: "{user_sentence}"

Der Satz ist korrekt, wenn:
1. Die Handlung und Bedeutung mit dem Referenzsatz übereinstimmen.
2. Der Satz grammatikalisch korrekt ist.
3. Die Zeichensetzung korrekt ist (inklusive Kommas und Satztrennung).
4. Die Rechtschreibung korrekt ist.

Antworte ausschließlich im JSON-Format, z.B.:
{{
  "semantically_correct": true/false,
  "comment": "kurze technische Begründung, falls falsch",
  "rating": "correct | almost_correct | wrong", 
  "short_feedback": "max 2 kurze Sätze für Lernende, freundlich formuliert, direkt im UI nutzbar,  basierend auf der technischen Begründung", 
  "corrected_sentence": "die beste korrekte Übersetzung", 
  "hint": "kurzer Tipp, ohne die korrekte Antwort zu verraten, falls rating=almost_correct/wrong"
}}

Gib eine kurze technische Begründung, warum der Satz falsch ist (z.B. falsches Verb, andere Handlung, Wort fehlt, Grammatikfehler).
Gib freundliches, kurzes Feedback, korrigiere den Satz und gib eine Bewertung (correct, almost_correct, wrong).
"""