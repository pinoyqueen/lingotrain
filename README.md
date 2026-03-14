# Frontend Setup

Zum **`frontend`-Ordner** navigieren und die benötigten Dependencies installieren.

## Dependencies installieren

```
npm install vue
npm install vue-router
npm install vee-validate
npm install lucide-vue-next
npm install -D vite tailwindcss postcss autoprefixer
```

## shadcn-vue initialisieren
`npx shadcn-vue@latest init`

## Tailwind CSS initialisieren
`npx tailwindcss init -p`

## Frontend starten
`npm run dev`

Das Frontend läuft anschließend unter:
`http://localhost:5173`

## Anmeldung in der Webanwendung:
Es wurde ein Demo-Konto mit den folgenden Zugangsdaten erstellt:  
**E-Mail:** maxmustermann@gmx.de  
**Passwort:** Testtest  

Dieses Demo-Konto enthält bereits jeweils 3 Lernsets pro Sprache:
- Lernset mit Wörtern
- Lernset mit Sätzen
- Gemischtes Lernset (Wörter und Sätze)

Eigene Konten können über die **Registrierung** ebenfalls angelegt werden.

--- 

# Backend Setup

Zum `**backend`-Ordner** navigieren und die benötigten Python-Abhängigkeiten installieren.

## Core Dependencies
```
pip install litellm
pip install fastapi uvicorn pydantic
```
## spaCy und Sprachmodelle
Zuerst spaCy installieren:

`pip install spacy`

Anschließend die Sprachmodelle herunterladen:

```
python -m spacy download de_core_news_sm
python -m spacy download en_core_web_sm
python -m spacy download fr_core_news_sm
python -m spacy download es_core_news_sm
```

Diese Modelle werden für die Verarbeitung verschiedener Sprachen verwendet.

## Evaluation der Sätze

Für die semantische Ähnlichkeitsberechnung wird **Sentence Transformers** verwendet:

`pip install sentence-transformers`

## Backend starten
`uvicorn main:app --reload`

Das Backend läuft anschließend unter:
`http://localhost:8000`

---

# Credits und verwendete Assets

## KI-generierte Grafiken
Einige grafische Elemente der Anwendung wurden mit KI-Unterstützung erstellt. 

Folgende Assets wurden mit **ChatGPT** erstellt:
- App Logo
- Profilbilder
- Abzeichen
- Streak Icons

Diese Grafiken wurden speziell für dieses Projekt basierend auf unserem Farbschema erstellt.

## Externe Grafiken
Einige grafische Elemente stammen aus frei verfügbaren Quellen:

- Flagge von England - [Wikipedia](https://de.wikipedia.org/wiki/Datei:Flag_of_the_United_Kingdom.png)
- Flagge von Frankreich - [Wikipedia](https://de.wikipedia.org/wiki/Datei:Flag_of_France.png)
- Flagge von Spanien - [Wikipedia](https://de.wikipedia.org/wiki/Datei:Flag_of_Spain.svg)
- Icon vom Tab "Meine Vokabeln" - [Google Material Icons](https://fonts.google.com/icons?selected=Material+Icons:library_books:&icon.query=learning&icon.size=24&icon.color=%23FFFFFF&icon.platform=web)

## Verwendete Icon-Bibliothek
Für weitere Icons in der Benutzeroberfläche werden die **Lucide Icons** über die Vue-Bibliothek **lucide-vue-next** verwendet 

- https://lucide.dev