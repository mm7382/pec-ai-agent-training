(() => {
  const page = document.querySelector(".journal-article-page");
  if (!page) return;

  const translations = {
    "journal-message-integration-app.html": {
      title: "A Message Integration App That Keeps the Final Decision Human",
      lede: "I am not trying to let AI speak for me. I want to bring scattered messages into one place while keeping the final approval human.",
      sections: [
        ["From an Idea to a Working Tool", "My earlier question was simple: would work feel lighter if email, team chat, and social messages could be handled from one place? That idea is now a working message integration app. Messages arrive with their context. I review the recipient and the complete reply, and only then does the agent send it back to the original platform."],
        ["Current Progress", "Teams, Telegram, and iMessage have been validated. Outlook, Gmail, Instagram, LinkedIn, WhatsApp, LINE, and WeChat remain on the connector roadmap."],
        ["The Boundary I Intentionally Keep", "A draft should never be sent merely because the system can send it. Recipient, context, and tone must remain visible and reviewable. Human in the loop is not an optional feature; it is the condition that makes the tool trustworthy."]
      ]
    },
    "journal-personal-message-relay.html": {
      title: "A Personal Message Relay for Cross-Platform Work",
      lede: "The exhausting part is often not replying. It is finding the message and rebuilding the context fragmented across platforms.",
      sections: [
        ["Where Attention Is Lost", "Outlook, Gmail, LINE, Teams, and WeChat can all demand attention. Before replying, I have to open another app, locate the conversation, and rebuild its context. The real cost is repeated interruption."],
        ["My Approach", "I imagine a personal message relay: every platform feeds one inbox, a second brain restores the relevant context, and I speak or write a reply. After I approve it, the agent routes it back to the correct person and platform."],
        ["A Work-Design Perspective", "This is not merely another app. It reorganizes attention. The system handles low-value switching while people retain understanding, judgment, and relationships."]
      ]
    },
    "journal-ai-code-review-depth.html": {
      title: "Should We Read AI-Generated Code Line by Line?",
      lede: "Disposable scripts, product features, and safety-critical paths should not receive the same review treatment.",
      sections: [
        ["Two Apparently Opposing Answers", "AI agents can generate a feature in minutes while people are still reading the first diff. One view says engineers must understand the code they ship. Another emphasizes clear requirements, tests, mutation testing, and QA evidence instead of line-by-line reading."],
        ["My View: Review Depth Follows Risk", "For a disposable tool, validate inputs, outputs, and failure behavior. For maintained product code, inspect interfaces, boundaries, diffs, and error handling. For permissions, money, privacy, or safety-critical paths, people should still read the code and preserve verification evidence."],
        ["Code Review Is Changing", "When generation outpaces reading, review must include requirement quality, test evidence, risk classification, observability, and human sampling. This is not abandoning understanding. It is directing limited attention to the places where misunderstanding is most costly."]
      ]
    },
    "journal-voice-brief-agent.html": {
      title: "From Writing Prompts to Briefing Agents by Voice",
      lede: "Moving from typing to voice is not merely a new input method. It changes how I communicate intent to an agent.",
      sections: [
        ["Voice Preserves More Context", "Speaking is faster than typing and lets me capture background, concerns, and judgment before compressing them into a short prompt."],
        ["Voice Does Not Go Directly to the Agent", "Typeless cleans pauses, repetition, and corrections. An LLM then organizes the text into goal, background, constraints, and completion criteria. I review the result before the agent acts."],
        ["Human Responsibility Remains", "I remain responsible for expressing intent, approving context, and reviewing the outcome. Voice reduces input friction; it does not remove human judgment."]
      ]
    },
    "journal-ai-schematic-review.html": {
      title: "Using an AI Agent to Assist Schematic Review",
      lede: "The goal is not to replace engineers, but to handle repetitive checks before experience is needed for the final decision.",
      sections: [
        ["Starting from a Practical Question", "I was asked whether an AI agent could help electrical engineers review schematics. I began with circuit structure, pin direction, naming differences, shared circuits, and component patterns."],
        ["What the Agent Does First", "The agent compares connections, highlights inconsistent naming, inspects shared or isolated structures, and groups findings by type. It produces a review list rather than declaring errors."],
        ["Improving the Next Round", "Engineer feedback on false positives and missed issues can improve rules, prompts, and check order. The value is not only the first scan, but the controlled learning loop that follows."]
      ]
    }
  };

  const key = location.pathname.split("/").pop();
  const copy = translations[key];
  if (!copy) return;

  const title = document.querySelector(".journal-article-header h1");
  const lede = document.querySelector(".journal-article-lede");
  if (title && !title.querySelector(".journal-bilingual-title")) title.insertAdjacentHTML("beforeend", `<span class="journal-bilingual-title" lang="en">${copy.title}</span>`);
  if (lede && !lede.querySelector("[lang='en']")) lede.insertAdjacentHTML("beforeend", `<span class="journal-intro-en" lang="en">${copy.lede}</span>`);

  const body = document.querySelector(".journal-article-body");
  const source = body?.querySelector(".journal-source");
  if (!body || !source || body.querySelector(".journal-english")) return;
  const english = document.createElement("section");
  english.className = "journal-english";
  english.lang = "en";
  english.setAttribute("aria-label", "English version");
  english.innerHTML = `<span class="journal-language-label">English version</span>${copy.sections.map(([heading, paragraph]) => `<h2>${heading}</h2><p>${paragraph}</p>`).join("")}`;
  body.insertBefore(english, source);
})();
