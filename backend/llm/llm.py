import os
from litellm import completion

os.environ["OPENAI_API_KEY"] = "sk-_Pmm8MuGJr5ExE_7BP-wgw"

LITELLM_BASE_URL = "https://litellm.fh-swf.cloud"

def generate(prompt, model="gpt-4.1-mini"):
    response = completion(
        model = model,
        messages = [
            {
                "role": "user",
                "content": prompt
            }
        ],
        api_base = LITELLM_BASE_URL,

        # das Modell ist kreativer und wählt nicht immer den gleichen Satz
        temperature = 0.9,
        top_p=0.9,
        n=5  # Anzahl der Varianten
    )

    return response["choices"][0]["message"]["content"].strip()