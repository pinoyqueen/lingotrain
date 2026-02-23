from llm.prompts import sentence_prompt
from llm.llm import generate

# Generiert einen einfachen Satz in der angegebenen Zielsprache.
# Der Satz wird passend zu einer deutschen Vokabel und deren
# Übersetzung mithilfe eines LLMs generiert. Außerdem wird der Satz an den angegebenen
# Schwierigkeitsgrad angepasst.
#
# Argumente:
#   - germanWord (str): Das deutsche Wort, das im Satz vorkommen soll
#   - uebersetzung (str): die Übersetzung des deutschen Wortes in der Zielsprache
#   - language (str): die Zielsprache im Format "en", "fr" etc.
#   - schwierigkeitsgrad (str): der Schwierigkeitsgrad des Satzes (entweder einfach, mittel oder schwer)
#
# Return: (str) der generierte Satz
def generate_sentence(germanWord, uebersetzung, language="en", schwierigkeitsgrad="einfach"):
    prompt = sentence_prompt(germanWord, uebersetzung, language, schwierigkeitsgrad)
    sentence = generate(prompt)

    return sentence