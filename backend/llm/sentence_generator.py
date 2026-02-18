from llm.prompts import sentence_prompt
from llm.fake_llm import generate

def generate_sentence(word, language="Englisch"):
    prompt = sentence_prompt(word, language)
    sentence = generate(prompt, word)

    return sentence