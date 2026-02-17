from sentence_generator import generate_sentence

def run_test():
    word = "apple"
    language = "Englisch"

    sentence = generate_sentence(word, language)
    print(f"Wort: {word}")
    print(f"Satz: {sentence}")

run_test()