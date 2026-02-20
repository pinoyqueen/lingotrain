def sentence_prompt(germanWord, uebersetzung, language = "Englisch"):
    return f"""
Du bist ein Sprachlernassistent.

Generiere bitte exakt einen einfachen Satz in der Sprache Deutsch.
Beachte dabei folgende Regeln:
- Der Satz muss das Wort "{germanWord}" enthalten.
- Der Kontext des Satzes muss zu der Übersetzung des Wortes "{uebersetzung} auf der Sprache {language} passen.
- Der Satz muss grammatikalisch korrekt sein.
- Der Satz soll mit einem Punkt, Ausrufezeichen oder Fragezeichen enden.
- Benutze einfache Alltagssprache.
- Halte den Satz kurz.
- Erzeuge keine verschachtelten Sätze.
- Keine Erklärungen.
- Keine Übersetzungen.

Gib NUR den einen Satz aus.
"""