# Generiert den Prompt für das LLM, um einen Satz auf Deutsch zu einem gegebenen
# Wort zu erstellen.
# Je nach Schwierigkeitsgrad wird ein unterschiedlich komplexer Satz generiert.
#
# Argumente: 
#   - germanWord (str): Das Zielwort, das im Satz vorkommen soll
#   - uebersetzung (str): Die Bedeutung des Wortes in der Zielsprache
#   - language (str): die Sprache, auf die sich die Bedeutung bezieht
#   - schwierigkeitsgrad (str): der Schwierigkeitsgrad des zu generierenden Satzes
#
# Return: (str) der fertige Prompt-Text für das LLM
def sentence_prompt(germanWord, uebersetzung, language = "en", schwierigkeitsgrad="einfach"):
    return f"""
Du bist ein Sprachlernassistent.

Generiere bitte exakt einen einfachen Satz in der Sprache Deutsch.

Schwierigkeitsgrad: {schwierigkeitsgrad}

Beachte dabei folgende Regeln:
- Der Satz muss das Wort "{germanWord}" enthalten.
- Der Satz muss inhaltlich zur Übersetzung "{uebersetzung}" in {language} passen.
- Der Satz muss grammatikalisch korrekt sein.
- Der Satz soll korrekt mit einem Punkt, Ausrufezeichen oder Fragezeichen enden.
- Achte darauf, dass nur ein Satzzeichen am Ende steht.
- Benutze natürliche Alltagssprache.
- Variiere den Satzstil, z.B. mit verschiedenen Verben oder Satzanfängen und vermeide identische Wiederholungen.
- Keine Erklärungen, Übersetzungen oder zusätzlichen Sätze.

Regeln nach Schwierigkeitsgrad:
- einfach:
    - Kurzer Hauptsatz
    - Präsens
    - Kein Nebensatz
    - Ein Verb
- mittel: 
    - Hauptsatz mit mindestens einem Nebensatz oder zwei zusammenhängenden Handlungen
    - Präsens oder Perfekt
    - Zwei Verben möglich
- schwer:
    - mindestens zwei Nebensätze oder maximal ein verschachtelter Nebensatz
    - Zeitform darf variieren
    - Adverbien und Konjunktionen erlaubt, Satz soll noch gut lesbar sein
    - Pronomen und Rückbezüge verwenden

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

Bewertungsregeln:
1. Die Handlung und Bedeutung muss exakt mit dem Referenzsatz übereinstimmen.
2. Grammatik muss korrekt sein.
3. Zeichensetzung am Satzende muss korrekt sein:
   - Aussagesätze → Punkt
   - Fragesätze → Fragezeichen
   - Ausrufesätze → Ausrufezeichen
   Fehlendes oder falsches Satzzeichen gilt als **Fehler**.
4. Rechtschreibung muss korrekt sein.
5. Die Bedeutung des Fokuswortes muss zum Referenzsatz passen, auch wenn die Sprachen unterschiedlich sind.

Bewertungsskala: 
- "wrong": wenn Bedeutung, Handlung, Zeitform oder Zeichensetzung nicht korrekt ist.
- "almost_correct": wenn kleine stilistische Fehler oder minimale Rechtschreibung/Kommas fehlen.
- "correct": alles korrekt, inklusive korrekter Satzzeichen.

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

def conversation_system_prompt(target_text, target_language, translation):
    return f"""
Du bist ein Sprachlernassistent.

Führe eine natürliche Mini-Konversation in {target_language}.
Die beabsichtigte Bedeutung des Fokusobjekts ist: "{translation}"
Verwende das Fokusobjekt nur in dieser Bedeutung.

WICHTIG:
- Das Fokusobjekt ist: "{target_text}" (das kann ein einzelnes Wort oder ein ganzer Satz sein).
Ziel: Der Lernende soll das Fokusobjekt selbst in seiner Antwort verwenden.

Regeln:
- Wenn das Fokusobjekt ein normaler Satz ist:
    - Überlege dir eine realistische Situation, in der der Benutzer diesen Satz verwenden könnte.
    - Reagiere auf den Inhalt des Satzes, ohne ihn selbst komplett zu wiederholen.
    - Stelle offene Fragen, die den Lernenden motivieren, den Fokus-Satz oder dessen Inhalt selbst zu formulieren.
- Wenn das Fokusobjekt eine Frage ist:
    - Überlege dir eine Situation, in der der Benutzer diese Frage verwenden könnte.
    - Stelle eine Folgefrage, die den Lernenden ermutigen soll, die Fokusfrage selbst zu wiederholen oder zu paraphrasieren.
- Wenn das Fokusobjekt ein einzelnes Wort ist:
    - Verwende das Wort mindestens einmal in deiner Antwort.
    - Stelle offene Fragen, die das Wort aktiv einbeziehen.
- Motiviere den Lernenden, aktiv zu antworten.
- Antworte maximal in 2 Sätzen.
- Korrigiere nicht direkt, gib nur Feedback am Ende der Konversation falls nötig.
"""

def answer_relevant_prompt(assistant_question, user_input, target_language):
    return f"""
Die Konversation ist in "{target_language}"
Der Assistent hat gefragt: "{assistant_question}"
Der Lernende antwortet: "{user_input}"

Beantworte nur mit:
YES - wenn die Antwort inhaltlich zur Frage passt
NO - wenn sie nicht zur Frage passt
"""