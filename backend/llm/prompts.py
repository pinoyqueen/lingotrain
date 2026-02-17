def sentence_prompt(word, language = "Englisch"):
    return f"""
Du bist ein Sprachlernassistent.

Generiere bitte exakt einen einfachen Satz in der Sprache {language}.
Beachte dabei folgende Regeln:
- Der Satz muss das Wort "{word}" enthalten.
- Der Satz muss grammatikalisch korrekt sein.
- Der Satz soll mit einem Punkt, Ausrufezeichen oder Fragezeichen enden.
- Benutze einfache Alltagssprache.
- Halte den Satz kurz.
- Erzeuge keine verschachtelten Sätze.
- Keine Erklärungen.
- Keine Übersetzungen.

Gib NUR den einen Satz aus.
"""