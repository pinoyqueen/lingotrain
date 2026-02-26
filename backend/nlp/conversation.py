from nlp.evaluator import contains_target_word, get_nlp_for_language, is_sentence_plausible
from llm.llm import conversation_turn
from llm.prompts import conversation_system_prompt, answer_relevant_prompt

def is_relevant_answer(user_input, assistant_question, target_language):

    prompt = answer_relevant_prompt(
        assistant_question,
        user_input,
        target_language
    )

    result = conversation_turn([
        {"role": "system", "content": prompt}
    ])

    return result.strip().upper().startswith("YES")

def count_word_usage(messages, target_word, target_language):
    count = 0
    nlp = get_nlp_for_language(target_language)
    if not nlp:
        return 0  # Sprachmodell nicht verfügbar
    for m in messages:
        if m["role"] == "user":
            doc = nlp(m["content"])
            if contains_target_word(doc, target_word, target_language):
                count += 1
    return count

def trim_messages(messages, max_messages=6):
    system_message = messages[0]  # System bleibt immer
    conversation = messages[1:]
    trimmed_conversation = conversation[-(max_messages-1):]
    return [system_message] + trimmed_conversation

def start_conversation(target_word, target_language, translation):

    # System prompt am Anfang einfügen
    messages = [
        {
            "role": "system",
            "content": conversation_system_prompt(
                target_word,
                target_language,
                translation
            )
        }
    ]

    # Bot startet direkt mit erster Frage
    first_reply = conversation_turn(messages)

    messages.append({
        "role": "assistant",
        "content": first_reply
    })

    return {
        "target_word": target_word,
        "usage_count": 0,
        "turn_count": 0,
        "messages": messages
    }

def next_turn(state, user_input, target_language):

    nlp = get_nlp_for_language(target_language)
    if not nlp:
        return "Sprachmodell nicht verfügbar.", state, False

    doc = nlp(user_input)

    # Plausibilitätsprüfung
    if not is_sentence_plausible(doc):
        reply = "Bitte bilde einen vollständigen Satz mit einem Verb."
        return reply, state, False

    # letzte Assistentfrage holen
    last_assistant_message = None
    for m in reversed(state["messages"]):
        if m["role"] == "assistant":
            last_assistant_message = m["content"]
            break
    
    # Relevanzprüfung: Ist die Nutzerantwort relevant zu der Frage?
    if last_assistant_message:
        if not is_relevant_answer(user_input, last_assistant_message, target_language):
            return "Bitte beantworte meine letzte Frage inhaltlich.", state, False

    # Eingabe akzeptiert und speichern
    state["messages"].append({
        "role": "user",
        "content": user_input
    })

    state["turn_count"] += 1

    # Wort zählen
    state["usage_count"] = count_word_usage(
        state["messages"],
        state["target_word"],
        target_language
    )

    # Abbruchbedingung: Wort muss mindestens zweimal vom User verwendet und User muss mindestens dreimal der Bot beantwortet
    if state["usage_count"] >= 2 and state["turn_count"] >= 3:
        finished = True
        # TODO: Gespräche evaluieren und Feedback geben
        reply = "Du hast die Vokabeln gut trainiert!"
        return reply, state, finished
    
    # Nur letzte 6 Nachrichten an LLM schicken (Kosten sparen)
    trimmed = trim_messages(state["messages"])
    # Konversation fortsetzen
    reply = conversation_turn(trimmed)

    state["messages"].append({
        "role": "assistant",
        "content": reply
    })

    finished = False

    return reply, state, finished

def evaluate_conversation(state):
    usage = state["usage_count"]
    turns = state["turn_count"]

    if(usage >= 2):
        return {
            ""
        }