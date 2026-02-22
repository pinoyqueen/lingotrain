from nlp.evaluator import evaluate_answer_combined as evaluate_answer

def test():
    test_cases = [
        {
            "original_sentence": "Ich esse eine Birne.",  
            "word": "pear",
            "user_answer": "I eat a pear.",
            "lang": "en",
            "description": "korrektes Englisch"
        },
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "pear",
            "user_answer": "I am a pear.",
            "lang": "en",
            "description": "falsch, 'i am' ist nicht 'ich esse'"
        },
        {
            "original_sentence": "Ich esse eine Birne.",  
            "word": "pear",
            "user_answer": "I eat an apple.",
            "lang": "en",
            "description": "Falsches Wort, kein LLM-Aufruf"
        },
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "pear",
            "user_answer": "I buy a pear.",
            "lang": "en",
            "description": "falsches Verb / semantisch falsch, Feedback durch LLM"
        },
        {
            "original_sentence": "Ich esse eine Birne, während ich ein Buch lese.",
            "word": "pear",
            "user_answer": "I eat a pear while I read a book.",
            "lang": "en",
            "description": "korrekt mit Nebensatz"
        },
        {
            "original_sentence": "Ich esse eine Birne, während ich ein Buch lese.",
            "word": "pear",
            "user_answer": "I eat a pear while I watch TV.",
            "lang": "en",
            "description": "Nebensatz semantisch falsch"
        },
        {
            "original_sentence": "Ich habe gestern eine Birne gegessen.",
            "word": "pear",
            "user_answer": "I ate a pear yesterday.",
            "lang": "en",
            "description": "korrekt Vergangenheit"
        },
        {
            "original_sentence": "Ich habe gestern eine Birne gegessen.",
            "word": "pear",
            "user_answer": "I eat a pear yesterday.",
            "lang": "en",
            "description": "Zeitform falsch"
        },
        {
            "original_sentence": "Wenn ich hungrig bin, esse ich eine Birne.",
            "word": "pear",
            "user_answer": "If I am hungry, I eat a pear.",
            "lang": "en",
            "description": "korrekter Konditionalsatz"
        },
        {
            "original_sentence": "Wenn ich hungrig bin, esse ich eine Birne.",
            "word": "pear",
            "user_answer": "If I am hungry, I will eat a pear yesterday.",
            "lang": "en",
            "description": "Zeitlogik inkorrekt"
        },
        {
            "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
            "word": "pear",
            "user_answer": "I eat a pear because it is healthy.",
            "lang": "en",
            "description": "korrekt mit Begründung"
        },
        {
            "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
            "word": "pear",
            "user_answer": "I eat a pear because I am healthy.",
            "lang": "en",
            "description": "Begründung semantisch falsch"
        },
        {
            "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
            "word": "pear",
            "user_answer": "Although I am not hungry, I eat a pear.",
            "lang": "en",
            "description": "korrekt mit although"
        },
        {
            "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
            "word": "pear",
            "user_answer": "Although I am not hungry, I sleep a pear.",
            "lang": "en",
            "description": "stark semantisch falsch"
        },
        {
            "original_sentence": "Ich esse normalerweise eine Birne nach dem Mittagessen.",
            "word": "pear",
            "user_answer": "I usually eat a pear after lunch.",
            "lang": "en",
            "description": "Adverb korrekt positioniert"
        },
        {
            "original_sentence": "Ich esse normalerweise eine Birne nach dem Mittagessen.",
            "word": "pear",
            "user_answer": "I eat usually a pear after lunch.",
            "lang": "en",
            "description": "Adverbstellung falsch"
        },
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
        },

        # ----------------------------------------------------------------------
        # Französische Sätze
        # ----------------------------------------------------------------------
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "poire",
            "user_answer": "Je mange une poire.",
            "lang": "fr",
            "description": "korrektes Französisch"
        },
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "poire",
            "user_answer": "Je suis une poire.",
            "lang": "fr",
            "description": "falsch, 'je suis' ist nicht 'ich esse'"
        },
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "poire",
            "user_answer": "Je mange une pomme.",
            "lang": "fr",
            "description": "Falsches Wort, kein LLM-Aufruf"
        },
        {
            "original_sentence": "Ich esse eine Birne, während ich ein Buch lese.",
            "word": "poire",
            "user_answer": "Je mange une poire pendant que je lis un livre.",
            "lang": "fr",
            "description": "korrekt mit Nebensatz"
        },
        {
            "original_sentence": "Ich habe gestern eine Birne gegessen.",
            "word": "poire",
            "user_answer": "J'ai mangé une poire hier.",
            "lang": "fr",
            "description": "korrekt Vergangenheit"
        },
        {
            "original_sentence": "Wenn ich hungrig bin, esse ich eine Birne.",
            "word": "poire",
            "user_answer": "Si j'ai faim, je mange une poire.",
            "lang": "fr",
            "description": "korrekter Konditionalsatz"
        },
        {
            "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
            "word": "poire",
            "user_answer": "Je mange une poire parce qu'elle est saine.",
            "lang": "fr",
            "description": "falsch, saine verwendet man nicht bei Lebensmitteln"
        },
        {
            "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
            "word": "poire",
            "user_answer": "Bien que je n'aie pas faim, je mange une poire.",
            "lang": "fr",
            "description": "korrekt mit bien que"
        },
        {
            "original_sentence": "Ich esse normalerweise eine Birne nach dem Mittagessen.",
            "word": "poire",
            "user_answer": "Je mange normalement une poire après le déjeuner.",
            "lang": "fr",
            "description": "Adverb korrekt positioniert"
        },
        {
            "original_sentence": "Esse ich eine Birne?",
            "word": "poire",
            "user_answer": "Est-ce que je mange une poire", 
            "lang": "fr",
            "description": "fehlendes Fragezeichen am Ende"
        },
        {
            "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
            "word": "poire",
            "user_answer": "Je mange une poire parce que elle est saine.",  
            "lang": "fr",
            "description": "Rechtschreib-/Grammatikfehler im Nebensatz"
        },
        {
            "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
            "word": "poire",
            "user_answer": "Bien que je n'aie pas faim je mange une poire.",  
            "lang": "fr",
            "description": "fehlendes Komma im Nebensatz"
        },

        # ----------------------------------------------------------------------
        # Spanische Sätze
        # ----------------------------------------------------------------------
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "pera",
            "user_answer": "Yo como una pera.",
            "lang": "es",
            "description": "korrektes Spanisch"
        },
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "pera",
            "user_answer": "Yo una pera.",
            "lang": "es",
            "description": "nicht plausibel, kein LLM-Aufruf"
        },
        {
            "original_sentence": "Ich esse eine Birne.",
            "word": "pera",
            "user_answer": "Yo como una manzana.",
            "lang": "es",
            "description": "Falsches Wort, kein LLM-Aufruf"
        },
        {
            "original_sentence": "Ich esse eine Birne, während ich ein Buch lese.",
            "word": "pera",
            "user_answer": "Yo como una pera mientras leo un libro.",
            "lang": "es",
            "description": "korrekt mit Nebensatz"
        },
        {
            "original_sentence": "Ich habe gestern eine Birne gegessen.",
            "word": "pera",
            "user_answer": "Ayer comí una pera.",
            "lang": "es",
            "description": "korrekt Vergangenheit"
        },
        {
            "original_sentence": "Wenn ich hungrig bin, esse ich eine Birne.",
            "word": "pera",
            "user_answer": "Si tengo hambre, como una pera.",
            "lang": "es",
            "description": "korrekter Konditionalsatz"
        },
        {
            "original_sentence": "Ich esse eine Birne, weil sie gesund ist.",
            "word": "pera",
            "user_answer": "Como una pera porque es saludable.",
            "lang": "es",
            "description": "korrekt mit Begründung"
        },
        {
            "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
            "word": "pera",
            "user_answer": "Aunque no tengo hambre, como una pera.",
            "lang": "es",
            "description": "korrekt mit aunque"
        },
        {
            "original_sentence": "Ich esse normalerweise eine Birne nach dem Mittagessen.",
            "word": "pera",
            "user_answer": "Normalmente como una pera después del almuerzo.",
            "lang": "es",
            "description": "Adverb korrekt positioniert"
        },
        {
            "original_sentence": "Esse ich eine Birne?",
            "word": "pera",
            "user_answer": "¿Como una pera?", 
            "lang": "es",
            "description": "korrektes Fragezeichen"
        },
        {
            "original_sentence": "Obwohl ich keinen Hunger habe, esse ich eine Birne.",
            "word": "pera",
            "user_answer": "Aunque no tengo hambre como una pera",  
            "lang": "es",
            "description": "fehlendes Komma im Nebensatz"
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