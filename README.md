# Vue 3 + TypeScript + Vite

This template should help get you started developing with Vue 3 and TypeScript in Vite. The template uses Vue 3 `<script setup>` SFCs, check out the [script setup docs](https://v3.vuejs.org/api/sfc-script-setup.html#sfc-script-setup) to learn more.

Learn more about the recommended Project Setup and IDE Support in the [Vue Docs TypeScript Guide](https://vuejs.org/guide/typescript/overview.html#project-setup).


im backend ordner:  
pip install litellm  
pip install fastapi uvicorn pydantic 

für die einzelnen Sprachen (allg. spacy und dann deutsch, englisch, französisch, spanisch):  
pip install spacy   
python -m spacy download de_core_news_sm  
python -m spacy download en_core_web_sm  
python -m spacy download fr_core_news_sm  
python -m spacy download es_core_news_sm

für die Evaluation der Sätze:
pip install sentence-transformers

backend starten:  
uvicorn main:app --reload (oder ohne --reload)