from nlp.evaluator import evaluate_answer_combined as evaluate_answer

def test():
    test_cases = [
        # {
        #     "original_sentence": "Ich esse eine Birne.",  
        #     "word": "pear",
        #     "user_answer": "I eat a pear.",
        #     "lang": "en",
        #     "description": "korrektes Englisch"
        # },
        # {
        #     "original_sentence": "Ich esse eine Birne.",
        #     "word": "pear",
        #     "user_answer": "I am a pear.",
        #     "lang": "en",
        #     "description": "nicht plausibel, kein LLM-Aufruf"
        # },
        # {
        #     "original_sentence": "Ich esse eine Birne.",  
        #     "word": "pear",
        #     "user_answer": "I eat an apple.",
        #     "lang": "en",
        #     "description": "Falsches Wort, kein LLM-Aufruf"
        # },
        # {
        #     "original_sentence": "Ich esse eine Birne.",
        #     "word": "pear",
        #     "user_answer": "I buy a pear.",
        #     "lang": "en",
        #     "description": "falsches Verb / semantisch falsch, Feedback durch LLM"
        # },

        # {
        #     "original_sentence": "Ich esse eine Birne, während ich ein Buch lese.",
        #     "word": "pear",
        #     "user_answer": "I eat a pear while I read a book.",
        #     "lang": "en",
        #     "description": "korrekt mit Nebensatz"
        # },
        # {
        #     "original_sentence": "Ich esse eine Birne, während ich ein Buch lese.",
        #     "word": "pear",
        #     "user_answer": "I eat a pear while I watch TV.",
        #     "lang": "en",
        #     "description": "Nebensatz semantisch falsch"
        # },
        # {
        #     "original_sentence": "Ich habe gestern eine Birne gegessen.",
        #     "word": "pear",
        #     "user_answer": "I ate a pear yesterday.",
        #     "lang": "en",
        #     "description": "korrekt Vergangenheit"
        # },
        # {
        #     "original_sentence": "Ich habe gestern eine Birne gegessen.",
        #     "word": "pear",
        #     "user_answer": "I eat a pear yesterday.",
        #     "lang": "en",
        #     "description": "Zeitform falsch"
        # },
        # {
        #     "original_sentence": "Wenn ich hungrig bin, esse ich eine Birne.",
        #     "word": "pear",
        #     "user_answer": "If I am hungry, I eat a pear.",
        #     "lang": "en",
        #     "description": "korrekter Konditionalsatz"
        # },
        # {
        #     "original_sentence": "Wenn ich hungrig bin, esse ich eine Birne.",
        #     "word": "pear",
        #     "user_answer": "If I am hungry, I will eat a pear yesterday.",
        #     "lang": "en",
        #     "description": "Zeitlogik inkorrekt"
        # },
        # {
        #     "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
        #     "word": "pear",
        #     "user_answer": "I eat a pear because it is healthy.",
        #     "lang": "en",
        #     "description": "korrekt mit Begründung"
        # },
        # {
        #     "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
        #     "word": "pear",
        #     "user_answer": "I eat a pear because I am healthy.",
        #     "lang": "en",
        #     "description": "Begründung semantisch falsch"
        # },
        # {
        #     "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
        #     "word": "pear",
        #     "user_answer": "Although I am not hungry, I eat a pear.",
        #     "lang": "en",
        #     "description": "korrekt mit although"
        # },
        # {
        #     "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
        #     "word": "pear",
        #     "user_answer": "Although I am not hungry, I sleep a pear.",
        #     "lang": "en",
        #     "description": "stark semantisch falsch"
        # },
        # {
        #     "original_sentence": "Ich esse normalerweise eine Birne nach dem Mittagessen.",
        #     "word": "pear",
        #     "user_answer": "I usually eat a pear after lunch.",
        #     "lang": "en",
        #     "description": "Adverb korrekt positioniert"
        # },
        # {
        #     "original_sentence": "Ich esse normalerweise eine Birne nach dem Mittagessen.",
        #     "word": "pear",
        #     "user_answer": "I eat usually a pear after lunch.",
        #     "lang": "en",
        #     "description": "Adverbstellung falsch"
        # },
        {
            "original_sentence": "Esse ich eine Birne?",
            "word": "pear",
            "user_answer": "Do I eat a pear", 
            "lang": "en",
            "description": "fehlendes Fragezeichen am Ende"
        },
        {
            "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
            "word": "pear",
            "user_answer": "I eat a pear because its healthy.",  
            "lang": "en",
            "description": "Rechtschreib-/Grammatikfehler im Nebensatz"
        },
        {
            "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
            "word": "pear",
            "user_answer": "Although I am not hungry I eat a pear.",  
            "lang": "en",
            "description": "fehlendes Komma im Nebensatz"
        },
        {
            "original_sentence": "Ich esse normalerweise eine Birne nach dem Mittagessen.",
            "word": "pear",
            "user_answer": "I usually eat a pear, after lunch.",  
            "lang": "en",
            "description": "falsches Komma nach Adverbial"
        }
    ]

    for case in test_cases:
        print(f"Test: {case['description']} ({case['lang']})")
        result = evaluate_answer(
            user_answer=case["user_answer"],
            original_sentence=case["original_sentence"],  # Referenzsatz
            target_word=case["word"],
            target_language=case["lang"]
        )
        print(f"Input: {case['user_answer']}")
        print("Result:", result)
        print("---")

if __name__ == "__main__":
    test()