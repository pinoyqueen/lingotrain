from llm.sentence_generator import generate_sentence

# Testet den Satzgenerierer (generate_sentence) mit verschiedenen Wörtern,
# Sprachen und Schwierigkeitsgraden.
#
# Für jedes Wort wird ein Beispielsatz in drei Schwierigkeitsstufen
# (einfach, mittel, schwer) generiert und in der Konsole ausgegeben.
def run_test():

    # ------------------------- Englisch -------------------------
    germanWord = "Birne"
    uebersetzung = "pear"
    language = "en"

    schwierigkeitsgrad = "einfach"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    schwierigkeitsgrad = "mittel"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    schwierigkeitsgrad = "schwer"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    # ------------------------- Französisch -------------------------
    germanWord = "Flugzeug"
    uebersetzung = "avion"
    language = "fr"

    schwierigkeitsgrad = "einfach"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    schwierigkeitsgrad = "mittel"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    schwierigkeitsgrad = "schwer"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    # ------------------------- Spanisch -------------------------
    germanWord = "laufen"
    uebersetzung = "correr"
    language = "es"

    schwierigkeitsgrad = "einfach"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    schwierigkeitsgrad = "mittel"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

    schwierigkeitsgrad = "schwer"
    sentence = generate_sentence(germanWord, uebersetzung, language, schwierigkeitsgrad)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

run_test()