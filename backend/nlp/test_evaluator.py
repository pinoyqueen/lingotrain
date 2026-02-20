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
            "description": "nicht plausibel, kein LLM-Aufruf"
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