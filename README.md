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

--- 

# Backend Setup

Zum `**backend`-Ordner** navigieren und die benötigten Python-Abhängigkeiten installieren.

## Core Dependencies
```
pip install litellm
pip install fastapi uvicorn pydantic
```
# spaCy und Sprachmodelle
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

# Evaluation der Sätze

Für die semantische Ähnlichkeitsberechnung wird **Sentence Transformers** verwendet:

`pip install sentence-transformers`

## Backend starten
`uvicorn main:app --reload`

Das Backend läuft anschließend unter:
`http://localhost:8000`
