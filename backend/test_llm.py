from llm.sentence_generator import generate_sentence

def run_test():
    germanWord = "Birne"
    uebersetzung = "pear"
    language = "Englisch"

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