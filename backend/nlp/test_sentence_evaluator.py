from nlp.evaluator import evaluate_sentence_similarity as evaluate_answer

def test():

    test_cases = [
        {
            "original_sentence": "The banana is yellow.",
            "user_answer": "The banana is yellow.",
            "description": "Exakte Übereinstimmung"
        },
        {
            "original_sentence": "The banana is yellow.",
            "user_answer": "The banana is very yellow.",
            "description": "kleine Variation / Zusatzinformation"
        },
        {
            "original_sentence": "I go home.",
            "user_answer": "I am going home.",
            "description": "Paraphrase mit anderer Zeitform"
        },
        {
            "original_sentence": "She likes to read books.",
            "user_answer": "She enjoys reading books.",
            "description": "Paraphrase mit anderem Verb"
        },
        {
            "original_sentence": "I go home.",
            "user_answer": "I go to home.",
            "description": "Grammatikfehler aber ähnliche Bedeutung"
        },
        {
            "original_sentence": "He is eating an apple.",
            "user_answer": "He eat apple.",
            "description": "starker Grammatikfehler"
        },
        {
            "original_sentence": "The dog is sleeping.",
            "user_answer": "The dog is resting.",
            "description": "ähnliche Bedeutung"
        },
        {
            "original_sentence": "The banana is yellow.",
            "user_answer": "The banana is green.",
            "description": "gleiches Objekt, falsche Eigenschaft"
        },
        {
            "original_sentence": "The banana is yellow.",
            "user_answer": "The apple is yellow.",
            "description": "anderes Objekt"
        },
        {
            "original_sentence": "I go home.",
            "user_answer": "The car is very fast.",
            "description": "komplett andere Bedeutung"
        },
        {
            "original_sentence": "She is reading a book.",
            "user_answer": "Reading a book.",
            "description": "unvollständiger Satz"
        },
        {
            "original_sentence": "He drinks coffee every morning.",
            "user_answer": "He drinks tea every morning.",
            "description": "gleiches Muster, anderes Objekt"
        },
    ]

    for case in test_cases:

        print("=" * 60)
        print(f"Test: {case['description']}")
        print(f"Original: {case['original_sentence']}")
        print(f"User: {case['user_answer']}")

        result = evaluate_answer(
            user_answer=case["user_answer"],
            original_sentence=case["original_sentence"],
            target_word="",
            target_language="en"
        )

        print("Result:", result)
        print()


if __name__ == "__main__":
    test()