# Brief R7: AI coach and voice

First read `research/briefs/00-RULES.md` and follow it.
**Your output file:** `research/R7-ai-and-voice.md`. Write nothing else.

## Goal

Two later features need research now, so we can design for them:
- **AI coach (Should):** Sara asks follow-up questions about her check-in, e.g. "why is my reaction slower?" The coach answers from our verified content only.
- **Voice (Later):** Sara talks to the app instead of tapping. The team has $500 of Speechmatics credits.

Hard constraint: the app must **work offline**, because Mars is up to 22 minutes away one way. Health decisions are made by fixed rules in code. The AI only explains; it never diagnoses or decides.

Skip Claude API pricing and model details; we have those already.

## Questions

1. **AI on board, offline.** Which open-weight language models can run on a laptop or tablet with no internet and give reliable short health explanations? For each, give:
   - size
   - hardware needed (RAM, GPU)
   - speed on a typical laptop
   - licence
   - runtime: llama.cpp, Ollama, or in the browser via WebLLM / WebGPU

   Which one would you pick for a hackathon demo, and why?
2. **Online vs offline.** What are the trade-offs between a cloud model (better answers, needs a link) and a local model (works offline, weaker)? Are there known designs that use the cloud model when a link exists and fall back to the local one?
3. **Keeping the coach safe.** How do health chatbots stop a model from inventing medical advice? Cover:
   - answering only from given documents (retrieval / grounding)
   - refusing to diagnose
   - citing the source
   - escalation wording

   Give published examples and how they were evaluated.
4. **NASA's own work.** What has NASA (or NASA with partners) published on AI medical assistants for crews? For example, a Crew Medical Officer digital assistant, or clinical decision support for Earth-independent operations. What did they test and find?
5. **Speechmatics.**
   - Real-time speech-to-text: latency, accuracy, languages, JavaScript / Node SDK, how billing works (what $500 buys).
   - Does Speechmatics offer an **on-device or on-premises / offline** option, and who can use it?
   - Does it offer text-to-speech?
   - Cite Speechmatics' own docs and pricing pages.
6. **Offline voice alternatives.** Speech-to-text that runs fully offline (e.g. whisper.cpp, Vosk, the browser Web Speech API — check whether it really works offline) and offline text-to-speech. Give accuracy and speed where measured.
7. **Where voice helps most.** Hands-busy moments. For example, during CPR or while the blood pressure cuff is on, Sara says "next step" or "start timer". Is there evidence that voice-guided steps help people follow first-aid or medical procedures?
8. **Recommendation.**
   - The simplest design for the AI coach and for voice that keeps the offline promise.
   - What to build first.
   - What to only mention in the pitch.
