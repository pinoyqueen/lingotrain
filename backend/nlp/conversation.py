from nlp.evaluator import contains_target_word, get_nlp_for_language, is_sentence_plausible
from llm.llm import conversation_turn, get_llm_conversation_feedback
from llm.prompts import conversation_system_prompt, answer_relevant_prompt

# Prüft, ob die Antwort des Nutzer relevant zur letzten Frage des Assistenten ist.
#
# Argumente:
#   - user_input(str): Eingabe des Nutzers
#   - assistant_question(str): Letzte Frage des Assistenten
#   - target_language(str): Sprache der Konversation
#
# Return: (bool) True, wenn die Antwort relevant ist, sonst False
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

# Zählt, wie oft ein bestimmtes Zielwort in den Nutzer-Nachrichten vorkommt.
#
# Argumente:
#   - messages(list): Liste aller Nachrichten in der Konversation
#   - target_word(str): Wort, dessen Verwendung gezählt werden soll
#   - target_language(str): Sprache der Konversation
#
# Return: (int) Anzahl der Vorkommen des Zielworts
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

# Kürzt die Nachrichtenliste auf die letzten max_messages-1 User/Assistant-Nachrichten
# und die initiale Systemnachricht, um LLM-Kosten zu sparen.
#
# Argumente:
#   - messages (list): Alle Nachrichten der Konversation
#   - max_messages (int): Maximale Anzahl an Nachrichten, die behalten werden
#
# Return: (list) gekürzte Nachrichtenliste
def trim_messages(messages, max_messages=6):
    system_message = messages[0]  # System bleibt immer
    conversation = messages[1:]
    trimmed_conversation = conversation[-(max_messages-1):]
    return [system_message] + trimmed_conversation

# Initialisiert eine neue Konversation und startet mit der ersten Frage des Assistenten.
#
# Argumente:
#   - target_word (str): Wort, das im Gespräch geübt werden soll
#   - target_language (str): Sprache der Konversation
#   - translation (str): Übersetzung des Zielworts für den Systemprompt
#
# Return: (dict) Startzustand der Konversation inkl. Systemnachricht und initialer Assistentenantwort
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

# Verarbeitet die nächste Runde der Konversation mit der Nutzerantwort.
#
# Argumente:
#   - state (dict): Aktueller Zustand der Konversation
#   - user_input (str): Eingabe des Nutzers
#   - target_language (str): Sprache der Konversation
#
# Return: (tuple) Assistenantwort/Feedback, aktualisierter Zustand, bool ob Konversation beendet
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

    # Abbruchbedingung 2: User hat mindestens 10mal der Bot beantwortet
    if state["turn_count"] >= 10:
        finished = True

        # Feedback zur Konversation geben
        feedback = evaluate_conversation(state, target_language)
        return feedback, state, finished
    
    # Abbruchbedingung 2: Wort muss mindestens zweimal vom User verwendet und User muss mindestens dreimal der Bot beantwortet
    if state["usage_count"] >= 2 and state["turn_count"] >= 3:
        finished = True

        # Feedback zur Konversation geben
        feedback = evaluate_conversation(state, target_language)
        return feedback, state, finished
    
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

# Wertet die Konversation aus und liefert Feedback von LLM.
#
# Argumente:
#   - state (dict): Aktueller Zustand der Konversation
#   - target_language (str): Sprache der Konversation
#
# Return: (dict) Bewertung, Feedback, Kommentare und Hinweise
def evaluate_conversation(state, target_language):

    llm_feedback = get_llm_conversation_feedback(
        state["messages"],
        state["target_word"],
        target_language
    )

    rating = llm_feedback.get("rating", "wrong")

    return {
        "correct": rating == "correct",
        "rating": rating,
        "feedback": llm_feedback["feedback"],
        "comment": llm_feedback["comment"],
        "suggestion": "",
        "hint": llm_feedback["hint"]
    }