def sentence_prompt(germanWord, uebersetzung, language = "Englisch"):
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
- Halte den Satz kurz, aber du darfst ein oder zwei zusätzliche Wörter (z.B. Adjektive) einfügen.
- Variiere den Satzstil, z.B. mit verschiedenen Verben oder Satzanfängen und vermeide identische Wiederholungen.
- Erzeuge keine verschachtelten Sätze.
- Keine Erklärungen, Übersetzungen oder zusätzlichen Sätze.

Erzeuge mehrere sinnvolle Versionen des Satzes und wähle eine zufällige aus.
Gib NUR den einen Satz aus. 
"""