from prompts import sentence_prompt
from llm import generate

def generate_sentence(word, language="Englisch"):
    prompt = sentence_prompt(word, language)
    sentence = generate(prompt)

    return sentence