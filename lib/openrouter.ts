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
- Is all content written in full with no placeholders? If not, complete it.

Do not write "self-check completed" or any meta-commentary about this 
process in the output. The self-check is for your own internal verification 
only and should never appear in the final text.`;
}

export function correctorPrompt({
  level,
  writingType,
  errorFocus,
  studentText,
  notes,
}: {
  level: string;
  writingType: string;
  errorFocus: string;
  studentText: string;
  notes?: string;
}): string {
  const focusInstruction =
    errorFocus === "All errors"
      ? "Identify and correct all error types: grammar, vocabulary, spelling, punctuation, and register."
      : `Focus specifically on ${errorFocus.toLowerCase()} errors. Note other error types only if they significantly impede meaning.`;

  return `You are an experienced ESL teacher and writing coach with expertise in CEFR-aligned feedback. You give corrections that are clear, encouraging, and immediately actionable.

STUDENT LEVEL: ${level}
LEVEL GUIDANCE: ${levelGuide(level)}
WRITING TYPE: ${writingType}
ERROR FOCUS: ${focusInstruction}
${notes ? `TEACHER NOTES: ${notes}` : ""}

STUDENT WRITING TO CORRECT:
${studentText}

CRITICAL FORMATTING RULE: Output plain text only. Never use asterisks (*), hashtags (#), backticks, underscores for emphasis, or any markdown syntax anywhere in your response. If you want to emphasise something, use CAPITAL LETTERS only. This rule applies to every section without exception.

Use this exact structure with these exact headings:

CORRECTED VERSION
Rewrite the full student text with all targeted errors silently corrected. Preserve the student's ideas, voice, and structure. Do not add new sentences or change meaning. Do not add any commentary inside this section.

SUMMARY
2 to 3 sentences. Describe the student's overall written proficiency, the most frequent error patterns found, and whether the writing achieves its communicative purpose. Be honest but constructive. Reference the ${level} level standard.

ERROR TABLE
List every correction made. One error per line. Use exactly this pipe-separated format with no header row:
[sentence number] | [error type] | [original phrase] | [corrected phrase] | [plain-English explanation for the student]

Error types to use: Grammar, Vocabulary, Spelling, Punctuation, Register, Word order, Missing word, Extra word.
Sentence numbers must match the order of sentences in the original text. Number them 1, 2, 3 and so on.
The explanation column must be written so a ${level} student can understand it. Keep explanations under 15 words.

LANGUAGE STRENGTHS
Exactly 2 or 3 bullet points (use a plain hyphen, not a dash or asterisk). Each must identify something specific and genuine that the student did well. Do not write generic praise. If the writing has fewer than 2 genuine strengths at ${level} level, note what the closest strengths are.

TEACHER TIPS
Exactly 2 or 3 numbered suggestions (write 1. 2. 3. not bullet points) for what the teacher should address next with this student based on the error patterns. Each tip must name a specific grammar point, vocabulary area, or writing skill, and suggest a concrete activity type or approach. Do not repeat the errors from the table — synthesise the patterns.

STRICT RULES — follow all of these without exception:
- Plain text only. No asterisks, hash symbols, markdown, or formatting characters of any kind.
- Use the exact five section headings listed above, nothing else.
- The ERROR TABLE must use the pipe format. Every row must have exactly 5 fields separated by 4 pipe characters.
- Never write placeholder text like "[add example here]" — write the actual content.
- Do not add any introduction, preamble, or closing remarks outside the five sections.
- If the student text contains no errors in the specified focus area, write "No errors found in this focus area." in the ERROR TABLE section and still complete all other sections.`;
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

export function vocabularyPrompt({
  level,
  topic,
  wordCount,
  focusType,
  includes,
}: {
  level: string;
  topic: string;
  wordCount: string;
  focusType: string;
  includes: string[];
}): string {
  const count = parseInt(wordCount);

  const includesInstructions = [
    includes.includes("Definitions") &&
      "Definition: one clear, student-friendly definition",
    includes.includes("Example sentences") &&
      "Example: one natural example sentence using the word in context",
    includes.includes("Collocations") &&
      "Collocations: 2 to 3 common collocations (word combinations)",
    includes.includes("Part of speech") &&
      "Part of speech: noun, verb, adjective, adverb, etc.",
    includes.includes("Pronunciation guide") &&
      "Pronunciation: phonetic transcription using IPA",
  ]
    .filter(Boolean)
    .join("\n");

  return `You are an expert ESL materials writer with deep knowledge of CEFR-aligned vocabulary instruction. You create vocabulary lists that teachers can use immediately in class.

STUDENT LEVEL: ${level}
LEVEL GUIDANCE: ${levelGuide(level)}
TOPIC: ${topic}
VOCABULARY FOCUS: ${focusType}
NUMBER OF WORDS: ${count}
INFORMATION TO INCLUDE FOR EACH WORD: ${includes.join(", ")}

CRITICAL FORMATTING RULE: Output plain text only. Never use asterisks (*), hashtags (#), backticks, underscores for emphasis, or any markdown syntax anywhere in your response. If you want to emphasise something, use CAPITAL LETTERS only. This rule applies to every section without exception.

WORD SELECTION RULES:
- Every word must be genuinely useful for the topic "${topic}" at ${level} level
- Words must be strictly appropriate for the CEFR level described above — do not include words above or below this level
- For "${focusType}" focus: select words that genuinely fit this category
- Do not pad with obvious or overly simple filler words
- No two words should be synonyms of each other unless contrast is the pedagogical point

For each word entry, use this exact format — include only the sub-fields specified above:
[NUMBER]. [WORD]
${includesInstructions}

Use this exact four-section structure with these exact headings:

VOCABULARY LIST
${count} numbered entries using the format above. Each entry is complete and specific. No placeholders.

TEACHING NOTES
Practical advice on how to present this vocabulary set in class. Include: the best order to introduce the words, any groupings or semantic fields the teacher should highlight, and one specific technique suited to this focus type (${focusType}). 3 to 5 sentences.

PRACTICE IDEAS
Exactly 3 quick classroom activities for practising this vocabulary set. Each activity must be named, take no longer than 10 minutes, and be immediately usable without any additional preparation. Write the activity name followed by a colon, then 2 to 3 sentences of instructions.

EXTENSION WORDS
Exactly 5 additional words on the same topic that advanced or fast-finishing students can explore. For each one write: the word, its part of speech in parentheses, and a one-line definition. Format as a numbered list.

STRICT RULES:
- Plain text only. No markdown, no asterisks, no bullet symbols.
- Use the exact four section headings above.
- Write all ${count} vocabulary entries in full — never truncate with "etc." or "[continued]".
- Every example sentence must be original and natural. No template sentences.
- Vocabulary, sentence complexity, and definitions must match ${level} level guidance precisely.
- Do not add any introduction, preamble, or closing remarks outside the four sections.`;
}

export function examPrepPrompt({
  examType,
  taskType,
  level,
  topic,
  notes,
}: {
  examType: string;
  taskType: string;
  level: string;
  topic: string;
  notes?: string;
}): string {
  const isIELTS = examType === 'IELTS';

  const taskInstructions: Record<string, string> = {
    'Reading (True/False/NG)': `Write a reading passage of approximately 250–300 words on the topic. Then write exactly 8 True/False/Not Given questions. Each question must be a complete statement. Clearly label each question T, F, or NG in the ANSWER KEY. Include a brief explanation for each answer.`,
    'Reading (Multiple Choice)': `Write a reading passage of approximately 250–300 words on the topic. Then write exactly 6 multiple-choice questions, each with options A, B, C, and D. Only one option is correct per question. Include the full passage and all questions under the TASK CONTENT heading. List answers with brief justifications in the ANSWER KEY.`,
    'Listening (Gap Fill)': `Write a transcript of a short monologue or dialogue (approximately 200 words) on the topic. Then write a gap-fill summary with 8 blanks. The summary is a separate shorter text — not the transcript verbatim — and each blank must be fillable with one to three words from the transcript. Present the transcript first, then the gap-fill summary. List answers in the ANSWER KEY.`,
    'Writing Task 1 (Academic)': `Write a realistic IELTS Academic Writing Task 1 prompt. Describe a chart, graph, diagram or process related to the topic. The prompt must specify exactly what visual data the student is responding to (e.g. "The bar chart shows…"). Write a model answer of approximately 160–180 words in the ANSWER KEY. The model answer must include an overview and must not express personal opinion.`,
    'Writing Task 1 (General)': `Write a realistic IELTS General Training Writing Task 1 prompt asking the student to write a letter (formal, semi-formal, or informal) related to the topic. Include three bullet points of content the letter must address. Write a model answer of approximately 160–180 words in the ANSWER KEY. The model answer must match the appropriate register for the letter type.`,
    'Writing Task 2 Essay': `Write a realistic IELTS Writing Task 2 essay prompt related to the topic. Use one of these standard question types: opinion (agree/disagree), discussion (both views + opinion), problem/solution, or advantage/disadvantage. Write a model answer of approximately 250–280 words in the ANSWER KEY. The model answer must have a clear introduction, developed body paragraphs, and a conclusion.`,
    'Speaking Part 1': `Write 8 realistic IELTS Speaking Part 1 questions related to the topic. Questions should be personal, everyday, and answerable by anyone. Group them into 2 sets of 4 related questions. For each question, write a model answer of 2 to 3 sentences at ${level} level in the ANSWER KEY.`,
    'Speaking Part 2': `Write a realistic IELTS Speaking Part 2 cue card on the topic. Include the main prompt and exactly 3 bullet points the student should cover. Write a model answer of approximately 150 words (1–2 minute speaking time) in the ANSWER KEY.`,
    'Speaking Part 3': `Write 6 realistic IELTS Speaking Part 3 questions related to the topic. These must be abstract, analytical, and require extended opinion responses. Write a model answer of 3 to 5 sentences for each question in the ANSWER KEY.`,
    'Reading (Multiple Choice)_TOEFL': `Write an academic reading passage of approximately 300 words on the topic. Then write 6 multiple-choice questions, each with options A, B, C, and D. Questions should test comprehension, inference, and vocabulary in context. List answers with brief justifications in the ANSWER KEY.`,
    'Listening (Note-taking)': `Write a transcript of a short academic lecture or conversation (approximately 250 words) on the topic. Then write a note-taking template with 8 blanks the student fills in while listening. Present the transcript first, then the template. List answers in the ANSWER KEY.`,
    'Integrated Writing': `Write a short academic reading passage (approximately 150 words) presenting one position on the topic. Then write a brief lecture prompt (3 to 4 sentences) that contradicts or complicates the reading. The student must summarize how the lecture relates to the reading. Write a model response of approximately 200 words in the ANSWER KEY.`,
    'Independent Writing': `Write a realistic TOEFL Independent Writing prompt on the topic. The prompt must ask the student to support, challenge, or qualify a position or claim. Write a model response of approximately 250 words in the ANSWER KEY with a clear thesis, body paragraphs, and conclusion.`,
    'Speaking (Independent)': `Write a realistic TOEFL Independent Speaking prompt on the topic. The student must state and support a preference or opinion. Write a model response of approximately 80 words (45-second speaking time) in the ANSWER KEY.`,
    'Speaking (Integrated)': `Write a short reading passage (approximately 100 words) on the topic. Then write a listening prompt (3 to 4 sentences describing what a professor says that adds to or complicates the reading). The student must integrate both sources in their response. Write a model response of approximately 80 words in the ANSWER KEY.`,
  };

  const taskKey = isIELTS ? taskType : (taskType === 'Reading (Multiple Choice)' ? 'Reading (Multiple Choice)_TOEFL' : taskType);
  const taskDetail = taskInstructions[taskKey] || `Write a realistic ${examType} ${taskType} task on the topic. Follow official ${examType} format guidelines exactly.`;

  return `You are a senior ${examType} examiner and ESL materials writer with over 15 years of experience writing official-standard ${examType} practice materials used in accredited test preparation courses.

EXAM: ${examType}
TASK TYPE: ${taskType}
STUDENT LEVEL: ${level}
LEVEL GUIDANCE: ${levelGuide(level)}
TOPIC: ${topic}
${notes ? `ADDITIONAL INSTRUCTIONS: ${notes}` : ''}

CRITICAL FORMATTING RULE: Output plain text only. Never use asterisks (*), hashtags (#), backticks, underscores for emphasis, or any markdown syntax anywhere in your response. If you want to emphasise something, use CAPITAL LETTERS only. This rule applies to every section without exception.

TASK CONSTRUCTION INSTRUCTIONS:
${taskDetail}

Use this exact structure with these exact headings:

TASK TITLE
A specific, descriptive title for this practice task. Include the exam type, task type, and topic. Example: "IELTS Writing Task 2 — Technology and Society"

EXAM OVERVIEW
Two to three sentences explaining what this task type tests, how it is scored in the real ${examType}, and any key timing or length requirements a student must know. Write this as advice directly to the student.

INSTRUCTIONS
The exact student-facing instructions for this task, written as they would appear in the real ${examType} exam. Include any time limits, word counts, or format requirements. Write these in the second person (you, your).

TASK CONTENT
The full task content: the passage, prompt, cue card, transcript, questions, or whatever the task type requires. Write it completely — no placeholders. All questions must be numbered. All options must be labelled A, B, C, D if applicable.

ANSWER KEY
Complete answers for all questions. For writing or speaking tasks, include a full model answer. For multiple choice or gap fill, list the question number and correct answer with a one-line justification.

TEACHER NOTES
Three to four sentences of practical advice for the teacher. Include: the most common mistakes students make on this task type at ${level} level, one specific preparation strategy to share with students, and any marking or feedback tips.

STRICT RULES — follow all without exception:
- Plain text only. No asterisks, hash symbols, bullet symbols, or markdown of any kind.
- Use the exact six section headings listed above.
- All content must match official ${examType} format and difficulty standards.
- Language complexity in passages and prompts must match ${level} level guidance.
- Never write placeholder text. Write all content in full.
- Do not add any introduction or closing remarks outside the six sections.`;
}

export function progressReportPrompt({
  studentName,
  level,
  reportType,
  reportTone,
  teacherNotes,
}: {
  studentName?: string;
  level: string;
  reportType: string;
  reportTone: string;
  teacherNotes: string;
}): string {
  return `You are an experienced ESL teacher and education professional skilled at writing clear, constructive, and professional student progress reports for parents and schools.

STUDENT LEVEL: ${level}
LEVEL GUIDANCE: ${levelGuide(level)}
REPORT TYPE: ${reportType}
REPORT TONE: ${reportTone}
${studentName ? `STUDENT NAME: ${studentName}` : ''}

TEACHER NOTES AND OBSERVATIONS:
${teacherNotes}

CRITICAL FORMATTING RULE: Output plain text only. Never use asterisks (*), hashtags (#), backticks, underscores for emphasis, or any markdown syntax anywhere in your response. If you want to emphasise something, use CAPITAL LETTERS only. This rule applies to every section without exception.

Use this exact structure with these exact headings:

STUDENT OVERVIEW
One or two sentences describing the student's current level and general learning context. If details are not in the notes, infer naturally from the level and context.

LANGUAGE PROGRESS
A paragraph (4 to 6 sentences) covering the student's overall progress across relevant skill areas mentioned in the notes. Be specific — reference actual improvements, recurring patterns, or milestones. Write in the ${reportTone.toLowerCase()} register appropriate for ${reportType.toLowerCase()} communication with parents or school administrators.

STRENGTHS
Three to five specific strengths drawn directly from the teacher's notes. Each strength should be a full sentence. Be concrete — name the skill, the behaviour, or the improvement, not a generic compliment.

AREAS FOR DEVELOPMENT
Two to four areas where the student needs to improve. Frame these constructively and honestly. For each area, include one brief, practical suggestion for how the student can address it.

NEXT STEPS
Two to three clear, actionable goals for the coming term or period. Each should be measurable and realistic for a ${level} student.

CLOSING COMMENT
One warm, professional closing sentence appropriate for ${reportTone.toLowerCase()} communication with parents or schools.

STRICT RULES:
- Plain text only. No asterisks, hash symbols, bullet symbols, or markdown of any kind.
- Use the exact section headings listed above, nothing else.
- Never write placeholder text like "[add example here]" — write the actual content.
- All content must be drawn from or consistent with the teacher notes provided.
- Vocabulary and expectations must reflect the ${level} CEFR level.
- Do not add any introduction or closing remarks outside the defined sections.`;
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