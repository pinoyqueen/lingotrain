from llm.prompts import sentence_prompt
from llm.llm import generate

def generate_sentence(germanWord, uebersetzung, language="en"):
    prompt = sentence_prompt(germanWord, uebersetzung, language)
    sentence = generate(prompt)

    return sentence