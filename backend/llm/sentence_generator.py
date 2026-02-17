from prompts import sentence_prompt
from fake_llm import generate

def generate_sentence(word, language="Englisch"):
    prompt = sentence_prompt(word, language)
    sentence = generate(prompt, word)

    return sentence