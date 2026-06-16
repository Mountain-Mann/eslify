export function levelGuide(level: string): string {
  const guides: Record<string, string> = {
    'A1': 'A1 students know approximately 500 words. Use present simple and "to be" only. Maximum sentence length is 8 words. Avoid all abstract concepts. Activities must be highly visual, physical, or repetition-based. Do not use phrasal verbs or idioms.',
    'A2': 'A2 students know approximately 1000 words. Use present simple, past simple, and going-to future only. Keep sentences under 12 words. Topics must be concrete and everyday — family, food, shopping, routines. Avoid complex clauses.',
    'B1': 'B1 students know approximately 2000 words. Can handle present perfect, first and second conditionals, modal verbs, and passive voice. Can discuss abstract topics with scaffolding. Some common idioms and phrasal verbs are appropriate. Sentences up to 20 words.',
    'B2': 'B2 students know approximately 4000 words. Comfortable with all major grammar structures including third conditional, mixed conditionals, and complex passives. Can discuss nuanced and abstract topics independently. Collocations, idioms, and register awareness are appropriate.',
    'C1': 'C1 students know approximately 8000 words. Near-native fluency. Focus on precise vocabulary, nuance, register shifts, sophisticated cohesive devices, and idiomatic naturalness. Grammar accuracy is assumed — focus on stylistic and pragmatic choices.',
    'C2': 'C2 students have mastery-level English. Focus on subtle lexical distinctions, academic and professional register, rhetorical devices, and near-native cultural and pragmatic competence. Treat them as educated native speakers.'
  };
  const key = Object.keys(guides).find(k => level.startsWith(k));
  return key ? guides[key] : '';
}

export function lessonPrompt({
  level, type, topic, duration, classSize, goals
}: {
  level: string;
  type: string;
  topic: string;
  duration: string;
  classSize: string;
  goals?: string;
}): string {
  return `You are an expert ESL curriculum designer with 15 years of experience writing CEFR-aligned materials for accredited language schools. You write lessons that real teachers can pick up and deliver immediately without additional preparation.

STUDENT LEVEL: ${level}
LEVEL GUIDANCE: ${levelGuide(level)}

LESSON DETAILS:
- Lesson type: ${type}
- Topic: ${topic}
- Duration: ${duration}
- Class size: ${classSize}
${goals ? `- Teacher goals: ${goals}` : ''}

CRITICAL FORMATTING RULE: Output plain text only. Never use asterisks (*), hashtags (#), backticks, underscores for emphasis, or any markdown syntax anywhere in your response — not even for emphasis. If you want to emphasize something, use CAPITAL LETTERS or simply rely on sentence structure instead. This rule applies to every section without exception.

Your task is to write a complete, specific, immediately teachable lesson plan. Vague activities like "discuss the topic in pairs" are not acceptable. Every activity must have a named format, clear step-by-step instructions, and example language.

Use this exact structure with these exact headings:

LESSON TITLE
A specific, engaging title for this lesson. Not generic. Reflect the topic and activity type.

LEARNING OBJECTIVES
Exactly 3 objectives. Each must start with a measurable action verb: identify, produce, compare, describe, explain, argue, write, distinguish. Never use vague verbs like "understand", "learn", or "know about". Format as a numbered list.

MATERIALS NEEDED
Bullet list only. Include any specific vocabulary items, handouts, or board work needed. Keep it brief.

TARGET LANGUAGE
The specific grammar structure, vocabulary set, or functional language this lesson focuses on. Write 3 to 4 example sentences demonstrating this language at ${level} level. This section anchors the whole lesson.

WARM-UP
Timing: [X minutes — must fit within ${duration} total]
Activity name: [Named activity format]
Instructions: Step by step what the teacher does and says. Include exact example questions or prompts to use with students. This must connect directly to the lesson topic.

PRESENTATION
Timing: [X minutes]
Step by step instructions for introducing the target language. Include what to write on the board. Include exactly 3 concept checking questions (CCQs) to confirm student understanding. CCQs must be answerable with yes, no, or a single short word — never ask "do you understand?"

PRACTICE
Timing: [X minutes]
Activity 1 — [Name and type, e.g. "Gap Fill — Controlled Practice"]: Full instructions. Write an example item showing exactly what students produce.
Activity 2 — [Name and type, e.g. "Information Gap — Semi-Controlled"]: Full instructions. Write an example exchange or item.

PRODUCTION
Timing: [X minutes]
A free communicative task where students use the target language naturally without prompting. Give the exact task setup, the prompt or scenario students receive, and any support materials like question cards or role cards.

WRAP-UP
Timing: [X minutes]
A specific closing activity — not just "ask students what they learned." Include 3 questions the teacher uses to check whether the learning objectives were met.

HOMEWORK
One realistic independent task. Must be completable without a teacher or other students. Directly reinforces what was studied today.

DIFFERENTIATION
Support: One specific scaffold, sentence frame, word bank, or modification for students who are struggling.
Extension: One specific additional challenge or task for students who finish early or need more.

TEACHER NOTES
Two or three common errors or misconceptions students typically have with this language point or topic at ${level} level. For each one write a brief suggested correction technique.

STRICT RULES — follow all of these without exception:
- Plain text only. No asterisks, no hash symbols, no bullet symbols, no markdown of any kind.
- Use the exact section headings listed above, nothing else.
- Every timing must be realistic and all timings must add up to exactly ${duration}.
- Never write placeholder text like "[add example here]" or "etc." — write the actual content.
- Every activity must be specific enough that a substitute teacher with no context could deliver it.
- Vocabulary, sentence length, and grammar complexity must strictly match the level guidance above.`;
}

export function worksheetPrompt({
  level, focus, topic, exerciseCount, includeAnswers, notes
}: {
  level: string;
  focus: string;
  topic: string;
  exerciseCount: string;
  includeAnswers: boolean;
  notes?: string;
}): string {
  const count = exerciseCount.replace(' exercises', '');
  return `You are an expert ESL materials writer with experience writing for Cambridge University Press and Pearson publications. Every worksheet you produce is immediately printable and usable in class with zero editing.

  CRITICAL FORMATTING RULE: Output plain text only. Never use asterisks (*), hashtags (#), backticks, underscores for emphasis, or any markdown syntax anywhere in your response — not even for emphasis. If you want to emphasize something, use CAPITAL LETTERS or simply rely on sentence structure instead. This rule applies to every section without exception.

WORKSHEET SPECIFICATIONS:
- Student level: ${level}
- Level guidance: ${levelGuide(level)}
- Exercise focus: ${focus}
- Topic: ${topic}
- Number of exercises: ${count}
${notes ? `- Additional instructions: ${notes}` : ''}

CORE RULES — these are non-negotiable:
- All instructions are written directly to the student, not the teacher. Use "you" and imperatives: "Read the text", "Choose the correct word", "Complete the sentences."
- Vocabulary must be consistent across the whole worksheet. If a word appears in exercise 1, reuse it in later exercises to reinforce it.
- Difficulty increases progressively. Exercise 1 is the most controlled and supported. The final exercise is the most open and challenging.
- Every gap fill must have exactly one correct answer. Ambiguous gaps are not acceptable.
- No item should be answerable by guessing or without language knowledge.
- Sentence length and grammar complexity must strictly match the level guidance above.
- Write all exercise content in full. Never use "etc.", "[add more]", or placeholder text of any kind.
- For multiple choice questions, the full sentence with the blank must be grammatically complete and readable on its own — read each question sentence aloud mentally before finalizing. A sentence like "I ever seen such a storm" is missing the word "have" and is broken; it must read "I have never seen such a storm" with the blank correctly placed so each answer option fits naturally into it.
- Never write a meta-instruction like "(choose one word for each blank)" as part of an answer option. Each option must be a complete, standalone word or short phrase only.
- Before finalizing each multiple choice item, verify: does inserting option A, B, and C each produce a complete, grammatically correct sentence? If any option breaks the sentence, rewrite the question.

Use this exact structure:

WORKSHEET TITLE
[Topic] — [Focus type] — [Level]. Example: "Daily Routines — Gap Fill and Discussion — B1"

Name: _______________ Date: _______________ Class: _______________

INTRODUCTION
One sentence written to the student explaining what they will practise in this worksheet.

${Array.from({length: parseInt(count)}, (_, i) => `EXERCISE ${i + 1}: [Exercise type name]
Skill: [The specific language skill or knowledge this exercise practises — one line, for teacher reference]
Instructions: [Student-facing instruction — clear, direct, unambiguous]
[Full exercise content — completely written out with all items, blanks, options, or prompts]`).join('\n\n')}

${includeAnswers ? `ANSWER KEY
[For each exercise, list the exercise number and then the numbered answers only. Do not repeat the questions.]` : ''}

SELF-CHECK before finishing — mentally verify each of these:
- Can any item be answered by guessing without English knowledge? If yes, rewrite it.
- Does every gap fill have exactly one correct answer? If not, rewrite it.
- Does vocabulary stay within the ${level} level guidance? If not, simplify or elevate accordingly.
- Do the exercises build progressively in difficulty? If not, reorder them.
- Is all content written in full with no placeholders? If not, complete it.`;
}

export function checkerPrompt(lessonText: string): string {
  return `You are a senior ESL teacher trainer and materials evaluator with experience assessing lessons for accredited language schools. You are rigorous, specific, and constructive.

Evaluate the following lesson plan against professional ESL teaching standards.

LESSON TO EVALUATE:
${lessonText}

Assess across these four dimensions:
- Structure: Does the lesson follow a logical pedagogical sequence? Are timings realistic and balanced? Is there a clear progression from controlled to free practice?
- Level fit: Is the language, vocabulary, and cognitive demand genuinely appropriate for the stated CEFR level? Are instructions pitched correctly?
- Engagement: Are activities varied and genuinely interesting? Would real students stay engaged? Is there meaningful student talking time?
- Timing: Do all activity timings add up correctly? Are individual timings realistic for the activity described?

Respond with valid JSON only. No text before or after. No markdown code fences. Exactly this structure:

{
  "scores": {
    "structure": 85,
    "level_fit": 88,
    "engagement": 76,
    "timing": 82
  },
  "overall": 83,
  "summary": "One sentence overall assessment of the lesson quality.",
  "feedback": [
    {"type": "ok", "text": "Specific strength with detail about why it works"},
    {"type": "ok", "text": "Another specific strength"},
    {"type": "warn", "text": "Specific weakness with explanation of the problem"},
    {"type": "warn", "text": "Another specific issue if present"},
    {"type": "tip", "text": "Concrete actionable suggestion to improve the lesson"},
    {"type": "tip", "text": "Another specific improvement suggestion"}
  ]
}

Rules:
- Scores are integers 0 to 100
- overall is the weighted average — weight engagement and level_fit more heavily than timing
- feedback must have between 4 and 6 items
- type must be exactly ok, warn, or tip
- Every feedback item must be specific to THIS lesson — no generic comments like "good use of timing"
- warn and tip items must be actionable — tell the teacher exactly what to change`;
}

export async function callOpenRouter({
  prompt,
  isPro,
  retries = 1
}: {
  prompt: string;
  isPro: boolean;
  retries?: number;
}): Promise<string> {
  const model = isPro
    ? 'anthropic/claude-3.5-haiku'
    : 'openai/gpt-oss-120b:free';

  try {
    const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'https://eslify.io',
        'X-Title': 'ESLify'
      },
      body: JSON.stringify({
        model,
        max_tokens: isPro ? 1800 : 1200,
        temperature: 0.7,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error?.message || `HTTP ${res.status}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content || '';

    if (!text || text.length < 150) {
      throw new Error('Response too short or empty');
    }

    return text;

  } catch (e) {
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1000));
      return callOpenRouter({ prompt, isPro, retries: retries - 1 });
    }
    throw e;
  }
}