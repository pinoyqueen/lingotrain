from llm.sentence_generator import generate_sentence

def run_test():
    germanWord = "Birne"
    uebersetzung = "pear"
    language = "Englisch"

    sentence = generate_sentence(germanWord, uebersetzung, language)
    print(f"Wort: {germanWord}")
    print(f"Satz: {sentence}")

run_test()