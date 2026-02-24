from nlp.evaluator import contains_target_word, get_nlp_for_language
from llm.llm import conversation_turn
from llm.prompts import conversation_system_prompt

# TODO: prüfen ob der Zielsatz richtig verwendet/überhaupt in der Eingabe vorkommt

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

def start_conversation(target_word, target_language):

    # System prompt am Anfang einfügen
    messages = [
        {
            "role": "system",
            "content": conversation_system_prompt(
                target_word,
                target_language
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
    else:
        # Nur letzte 6 Nachrichten an LLM schicken (Kosten sparen)
        trimmed = trim_messages(state["messages"])

        reply = conversation_turn(trimmed)

        state["messages"].append({
            "role": "assistant",
            "content": reply
        })

        finished = False

    return reply, state, finished