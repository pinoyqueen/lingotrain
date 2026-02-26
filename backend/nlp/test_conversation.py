from nlp.conversation import start_conversation, next_turn

def run_test():

    target_vocab = "hike"
    target_translation = "wandern"
    target_language = "en"

    state = start_conversation(target_vocab, target_language, target_translation)

    print("\n=== Mini-Konversation gestartet ===")
    print("-----------------------------------")

     # Erste Bot-Nachricht anzeigen
    first_bot_message = state["messages"][-1]["content"]
    print(f"\nBot: {first_bot_message}")

    finished = False

    while not finished:

        user_input = input("\nDu: ")

        if user_input.lower() == "exit":
            print("Konversation manuell beendet.")
            break

        reply, state, finished = next_turn(state, user_input, target_language)

        if finished:
            print("\nWort erfolgreich trainiert!")
            break

        print(f"\nBot: {reply}")

        # Debug-Infos
        print(f"\n[DEBUG] usage_count = {state['usage_count']}")
        print(f"[DEBUG] turn_count = {state['turn_count']}")

       


if __name__ == "__main__":
    run_test()