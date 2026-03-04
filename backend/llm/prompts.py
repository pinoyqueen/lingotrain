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
- Benutze natürliche Alltagssprache (kein poetischer oder literarischer Stil).
- Variiere den Satzstil, z.B. mit verschiedenen Verben oder Satzanfängen und vermeide identische Wiederholungen.
- Keine Erklärungen, Übersetzungen oder zusätzlichen Sätze.
- Klar und gut verständlich für Sprachlernende.
- Komplexität bedeutet Satzstruktur, NICHT gehobene Wortwahl.

Regeln nach Schwierigkeitsgrad:
- einfach:
    - 5 bis 9 Wörter
    - Ein kurzer Hauptsatz
    - Präsens
    - Kein Nebensatz
    - Genau ein konjugiertes Verb
    - Kein Adjektiv
- mittel: 
    - 8 bis 14 Wörter
    - Genau ein Nebensatz mit "weil", "wenn" oder "dass" 
      ODER zwei Hauptsätze mit "und" oder "aber"
    - Präsens oder Perfekt
    - Maximal zwei konjugierte Verben 
    - Keine Schachtelung
    - Höchstens ein Adjektiv
- schwer:
    - 12 bis 18 Wörter
    - Genau ein Nebensatz (auch mit "obwohl", "nachdem" oder "während" erlaubt)
    - Keine verschachtelten Nebensätze
    - Maximal drei konjugierte Verben
    - Höchstens zwei Adjektive
    - Zeitform darf variieren

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
3. Prüfe das vorhandene Satzzeichen am Ende des Satzes:
    - Aussagesätze -> Punkt (.)
    - Fragesätze -> Fragezeichen (?)
    - Ausrufesätze -> Ausrufezeichen (!)
    - Ignoriere führende oder folgende Leerzeichen.
    - Fehlendes Satzzeichen muss NICHT überprüft werden.
4. Rechtschreibung, Akzente und Kommasetzung müssen korrekt sein.
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

# Generiert den Prompt für das LLM, um einen natürliche Konversation zu erzeugen.
# Dabei wird berücksichtigt, ob das Zielwort ein Nomen, Verb oder Adjektiv ist, 
# damit passende Fragen formuliert werden können.
# 
# Argumente: 
#   - target_text (str): Das Wort, das im Gespräch verwendet werden soll.
#   - target_language (str): Die Sprache, in der die Konversation geführt wird.
#   - translation (str): Die Bedeutung des Fokusobjekts, um eine korrekte Verwendung zu gewährleisten.
#
# Return: (str) der fertige Prompt-Text für das LLM
def conversation_system_prompt(target_text, target_language, translation):
    return f"""
Du bist ein Sprachlernassistent.

Führe eine natürliche Mini-Konversation in {target_language}.
Die beabsichtigte Bedeutung des Fokusobjekts ist: "{translation}"
Verwende das Fokusobjekt nur in dieser Bedeutung.

WICHTIG:
- Das Fokusobjekt ist: "{target_text}".
Ziel: Der Lernende soll das Fokusobjekt selbst in seiner Antwort verwenden.

WORTART-REGEL:
- Falls das Fokusobjekt ein VERB ist:
  - Stelle Fragen nach Handlungen oder Aktivitäten.
  - Frage nach persönlichen Erfahrungen oder Gewohnheiten.
  - Beispiel: "Wann machst du das?" oder "Warum machst du das?"

- Falls das Fokusobjekt ein NOMEN ist:
  - Stelle Fragen, bei denen der Lernende das Nomen natürlich als Objekt benutzen kann.
  - Frage nach Meinungen, Besitz, Beschreibung oder Erfahrungen.
  - Beispiel: "Hast du so etwas?" oder "Was denkst du über das?"

- Falls das Fokusobjekt ein ADJEKTIV ist:
  - Stelle Fragen nach Meinungen oder Beschreibungen.
  - Beispiel: "Findest du das auch so?" oder "Wann ist etwas so?"

Regeln:
- Überlege dir eine realistische Situation, in der der Benutzer diesen Satz verwenden könnte.
- Stelle offene Fragen, die das Wort aktiv einbeziehen.
- Motiviere den Lernenden, aktiv zu antworten.
- Antworte maximal in 2 Sätzen.
- Korrigiere nicht direkt, gib nur Feedback am Ende der Konversation falls nötig.
"""

# Generiert den Prompt für das LLM, um zu prüfen, ob die Nutzerantwort relevant ist.
# 
# Argumente: 
#   - assistant_question (str): Die vom Assistenten gestellte Frage.
#   - user_input (str): Die vom Lernenden gegebene Antwort.
#   - target_language (str): Die Sprache der Konversation.
#
# Return: (str) der fertige Prompt-Text, der an das LLM übergeben wird.
#         Das LLM soll nur mit "YES" oder "NO" antworten.
def answer_relevant_prompt(assistant_question, user_input, target_language):
    return f"""
Die Konversation ist in "{target_language}"
Der Assistent hat gefragt: "{assistant_question}"
Der Lernende antwortet: "{user_input}"

Beantworte nur mit:
YES - wenn die Antwort inhaltlich zur Frage passt
NO - wenn sie nicht zur Frage passt
"""

# Generiert den Prompt für das LLM, um eine Konversation zu bewerten und dem Nutzer
# Feedback zu der geführten Konversation geben zu können.
#
# Dabei wird darauf geachtet, ob die Zielvokabel korrekt und sinnvoll verwendet wurde und
# was dem Nutzer für häufige Fehler während der Konversation passiert sind. Außerdem soll
# dem Nutzer konstruktiv und motivierend Feedback gegeben werden.
#
# Argumente: 
#   - target_word (str): Die Zielvokabel, die der Nutzer verwenden soll
#   - target_language (str): Die Zielsprache, in der die Konversation geführt sein soll
#   - conversation_history (list[dict]): die geführte Konversation mit den Keys "role" (user/assistant) und "content" (Text)
#
# Return: (str) der fertige Prompt-Text für das LLM
def conversation_feedback_prompt(target_word, target_language, conversation_history):
    
    messages_text = "\n".join([f"{m['role']}: {m['content']}" for m in conversation_history])
    
    return f""""
Du bist ein Sprachlernassistent.

Analysiere die folgende Mini-Konversation mit Fokus auf die Vokabel "{target_word}" in der Zielsprache {target_language}.

WICHTIG:
- Antworte IMMER auf Deutsch, unabhängig von der Zielsprache.
- Erkenne, ob der Lernende die Zielvokabel korrekt und sinnvoll verwendet hat.
- Gib Hinweise auf die häufigsten Fehler oder typische Stolperfallen.
- Formuliere freundliche Tipps, worauf der Nutzer beim nächsten Mal achten sollte.
- Sei konstruktiv und motivierend.
- Gib dem Nutzer in der Du-Form Feedback und Kommentare.

Gib die Ausgabe ausschließlich im JSON-Format:
{{
    "rating": "correct | almost_correct | wrong",
    "feedback": "max 2 kurze Sätze für Lernende, freundlich formuliert, direkt im UI nutzbar, basierend auf der technischen Begründung",
    "comment": "technische Begründung, z.B. häufige Fehler",
    "hint": "kurzer Hinweis für das nächste Mal"
}}

Die Konversation ist: {messages_text}
"""