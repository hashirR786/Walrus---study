import express from 'express';
import Flashcard from '../models/Flashcard.js';
import { safeCache } from '../config/cache.js';

const router = express.Router();


const SYSTEM_PROMPT = `You are an expert AI tutor and academic assistant built exclusively for Indian students studying in CBSE Grades 11 and 12. Your knowledge spans all CBSE subjects: Physics, Chemistry, Mathematics, Biology, Accountancy, Business Studies, Economics, History, Political Science, Geography, English Core, Computer Science, and Informatics Practices.

Your primary knowledge sources (in order of authority):
1. NCERT Textbooks and Exemplar Problems (Grades 11 & 12)
2. CBSE Board Examination Papers (2015–2024, all sets)
3. CBSE Sample Question Papers and Marking Schemes
4. CBSE Curriculum and Syllabus documents

How you must behave:
- **Strict Syllabus-Focus & Grounding**: Keep all explanations strictly aligned with the CBSE Grade 11 & 12 NCERT curriculum. Do NOT include college-level, research-level, or advanced lab-procedural details (e.g., flow cytometry, viral envelopes, chromosomal fusion details) that are outside the CBSE syllabus, unless the user explicitly requests advanced context.
- **Descriptive & Structured by Default**: Your answers must always be highly detailed, descriptive, and comprehensive. Provide the deep background theory and conceptual context of a question before jumping into the solution. Never provide brief or single-line answers unless the student explicitly asks for a quick summary or short tip.
- Always ground your answers in NCERT content first. If a concept is explained differently in NCERT vs. other sources, follow NCERT.
- For every solution, show full step-by-step working. Never skip steps that a student might not understand.
- **Strict Response Structure**: Format your explanations into these distinct sections:
  1. 🧪 **Subject Focus & Theoretical Context**: Explain the background science or theory behind the topic.
  2. 📝 **Detailed Step-by-Step Solution**: Write out full calculations, derivations, or essay outlines.
  3. ⚡ **Core Formulas & Definitions**: State the key mathematical relations or definitions explicitly.
  4. 🏫 **Board Exam Alert & Common Pitfalls**: Point out how many marks this type of question carries, PYQ years it appeared, and common mistakes students make.
- **CBSE Answer Focus**: Ensure that the "Detailed Step-by-Step Solution" is directly relevant to the question asked. Avoid out-of-syllabus lab preparation steps unless the question is specifically about a practical lab procedure.
- **Focus on CBSE/NCERT Terminology**: Prioritize core CBSE concepts and board-examiner keywords (e.g., in Biology, when asked about "types of fusion", focus on Syngamy/Gametic fusion, Triple fusion, and Protoplast fusion rather than general scientific classifications).
- Calibrate your language to a 16–18 year old Indian student. Be clear, friendly, and encouraging — never condescending.
- If a question is from a scanned image or OCR-extracted text, first restate what you understood the question to be, then solve it. If the OCR text seems garbled, make reasonable inferences and flag uncertainty.
- For Mathematics and Sciences: use LaTeX formatting for all equations (enclose with $ for inline and $$ for block equations).
- For theory/essay questions (History, Economics, etc.): structure answers with intro, key points, and conclusion — matching CBSE answer-writing format.
- Always be aware of CBSE marking schemes. For a 3-mark question, provide a 3-point answer. For a 5-mark question, write a full structured answer.
- If a student shows you their attempted answer, first acknowledge what they got right, then gently correct errors, then explain the concept behind the correction.
- For doubt-solving mode: ask one clarifying question if the query is ambiguous before answering.
- For Socratic mode (when enabled): never give the final answer directly. Ask guiding questions that lead the student to the answer themselves.
- Never answer questions unrelated to academics, career counseling, or CBSE exam preparation. Politely redirect.
- When generating mock questions, strictly follow the current CBSE question paper design: Section A (MCQ/assertion-reason), Section B (very short answer), Section C (short answer), Section D (long answer), Section E (case-based/source-based).
- **FORMATTING INSTRUCTIONS**:
  - Structure all explanations to be descriptive, visual, and highly organized using standard Markdown headers, bullet points, and numbered lists.
  - Use expressive emojis for each section header.
  - Explicitly wrap critical NCERT definitions, exam callouts, or warnings in GitHub alert blockquotes (e.g. > [!NOTE], > [!TIP], > [!WARNING], or > [!BOARD-EXAM]).
  - Render all mathematical relations, equations, and expressions in clean LaTeX block ($$ ... $$) or inline ($ ... $) formatting.`;

// Utility to contact Groq API via Fetch
async function callGroqAPI(messages, temperature = 0.2, responseFormat = null) {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error('GROQ_API_KEY is not defined');

  const payload = { model: 'llama-3.3-70b-versatile', messages, temperature };
  if (responseFormat) payload.response_format = responseFormat;

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${apiKey}` },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Groq API status ${response.status}`);
  }
  const data = await response.json();
  return data.choices[0].message.content;
}

// Utility to contact Google Gemini 1.5 Flash via REST
async function callGeminiAPI(systemPrompt, chatHistory = [], userMessage, temperature = 0.2) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error('GEMINI_API_KEY is not defined');

  // Convert OpenAI-style history to Gemini's alternating user/model format
  // Gemini requires strict alternation: user → model → user → model ...
  const contents = [];
  for (const msg of chatHistory) {
    const geminiRole = msg.role === 'assistant' ? 'model' : 'user';
    // Merge consecutive same-role messages (Gemini doesn't allow them)
    if (contents.length > 0 && contents[contents.length - 1].role === geminiRole) {
      contents[contents.length - 1].parts[0].text += '\n' + msg.content;
    } else {
      contents.push({ role: geminiRole, parts: [{ text: msg.content }] });
    }
  }
  // Append current user message
  if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
    contents[contents.length - 1].parts[0].text += '\n' + userMessage;
  } else {
    contents.push({ role: 'user', parts: [{ text: userMessage }] });
  }

  const payload = {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents,
    generationConfig: {
      temperature,
      maxOutputTokens: 8192,
    }
  };

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) }
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error?.message || `Gemini API status ${response.status}`);
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error('Gemini returned empty response');
  return text;
}

// 1. Solve Doubt / Chat endpoint  — Gemini primary, Groq fallback
router.post('/solve', async (req, res) => {
  const { subject, chapter, mode, studentInput, studentAttempt, chatHistory = [] } = req.body;

  if (!subject || !studentInput) {
    return res.status(400).json({ error: 'Subject and student input are required.' });
  }

  const userPrompt = `
[SUBJECT]: ${subject}
[CHAPTER]: ${chapter || 'Unknown'}
[MODE]: ${mode || 'Doubt Solver'}
[STUDENT_INPUT]: ${studentInput}
${studentAttempt ? `[STUDENT_ATTEMPT]: ${studentAttempt}` : ''}
  `.trim();

  // 1. Check RedVER Cache first
  const cacheKey = `ai:doubt:${subject.toLowerCase().trim()}:${(chapter || 'unknown').toLowerCase().trim()}:${(mode || 'solve').toLowerCase().trim()}:${studentInput.toLowerCase().trim()}${studentAttempt ? ':' + studentAttempt.toLowerCase().trim() : ''}${chatHistory.length > 0 ? ':hist:' + JSON.stringify(chatHistory.slice(-2)) : ''}`;

  try {
    const cachedResponse = await safeCache.get(cacheKey);
    if (cachedResponse) {
      console.log('⚡ RedVER Cache Hit! Saving API tokens.');
      const parsed = JSON.parse(cachedResponse);
      return res.json({ ...parsed, cached: true });
    }
  } catch (err) {
    console.error('RedVER read error for /solve:', err);
  }

  // ── Try Gemini 1.5 Flash first ─────────────────────────────────────────────
  try {
    const reply = await callGeminiAPI(
      SYSTEM_PROMPT,
      chatHistory.slice(-8), // Gemini supports large context — send last 8 turns
      userPrompt,
      0.2
    );
    console.log('✅ Gemini answered successfully');
    const successResponse = { response: reply, model: 'gemini-2.5-flash' };
    try {
      await safeCache.set(cacheKey, JSON.stringify(successResponse), { EX: 86400 });
    } catch (e) {
      console.warn('RedVER write error for /solve:', e.message);
    }
    return res.json(successResponse);
  } catch (geminiError) {
    console.warn('⚠️  Gemini failed, trying Groq fallback:', geminiError.message);
  }

  // ── Groq fallback ──────────────────────────────────────────────────────────
  try {
    const messages = [
      { role: 'system', content: SYSTEM_PROMPT },
      ...chatHistory.slice(-6),
      { role: 'user', content: userPrompt }
    ];
    const reply = await callGroqAPI(messages);
    console.log('✅ Groq fallback answered successfully');
    const successResponse = { response: reply, model: 'groq-llama' };
    try {
      await safeCache.set(cacheKey, JSON.stringify(successResponse), { EX: 86400 });
    } catch (e) {
      console.warn('RedVER write error for /solve:', e.message);
    }
    return res.json(successResponse);
  } catch (groqError) {
    console.warn('⚠️  Groq also failed, returning static fallback:', groqError.message);
  }

  // ── Static offline fallback ────────────────────────────────────────────────
  let mockResponse = `### AI Tutor (Offline Mode)\n\nBoth Gemini and Groq are currently unavailable. Here is a template response for **${subject} — ${chapter || 'General'}**:\n\n`;
  if (mode === 'Socratic') {
    mockResponse += `**Guiding Hint:** Think about the fundamental principle in **NCERT Chapter: ${chapter || 'Core Concepts'}**.\n\n1. What happens when we apply this principle?\n2. Can you find an intermediate value first?\n\n*What do you think is the next step?*`;
  } else if (mode === 'Why am I wrong') {
    mockResponse += `**Feedback:** Check your Step 2 carefully. You may have divided instead of multiplied.\n\n**NCERT Reference:** Re-read the formula derivation in your textbook.`;
  } else {
    mockResponse += `**Step-by-step approach:**\n1. Identify the given quantities and what is asked.\n2. Write the relevant NCERT formula.\n3. Substitute values with correct SI units.\n4. Solve and verify the answer matches expected order of magnitude.\n\n> [!TIP]\n> For board exams, always write the formula before substituting — it earns a ½ mark even if the final answer is wrong.`;
  }
  return res.json({ response: mockResponse, fallback: true });
});


// ── BATCH HELPER: generate Section A (MCQs / Assertion-Reason) ────────────
async function generateSectionA(subject, chapter, count = 20) {
  if (count <= 0) return [];
  const prompt = `You are a CBSE Class 12 question paper setter.
Generate EXACTLY ${count} objective questions for a mock test.
Subject: "${subject}"
Chapter/Scope: "${chapter || 'All Chapters (Full Syllabus)'}"

Composition:
- Questions 1 to ~75% of count: straightforward MCQs with 4 options. Cover numericals, definitions, applications.
- Remaining questions: Assertion-Reason questions. Use ONLY these 4 fixed options for every A-R question:
  ["Both A and R are true and R is the correct explanation of A",
   "Both A and R are true but R is NOT the correct explanation of A",
   "A is true but R is false",
   "A is false but R is true"]

Quality rules:
- Board-exam level, drawn from NCERT syllabus.
- Cover diverse topics — do not repeat the same concept twice.
- Each question is worth 1 mark.

Return ONLY a valid JSON object with key "questions" containing an array of exactly ${count} items:
{
  "questions": [
    { "id": "A1",  "question": "...", "options": ["...", "...", "...", "..."], "answer": "<exact option text>", "marks": 1 },
    ...all ${count} items, no truncation...
  ]
}`;

  const text = await callGroqAPI([
    { role: 'system', content: `Return only a valid JSON object with key "questions" containing an array of exactly ${count} items. No markdown, no extra text.` },
    { role: 'user', content: prompt }
  ], 0.2, { type: 'json_object' });

  const parsed = JSON.parse(text);
  const arr = parsed.questions || parsed.A || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]) || [];
  return arr.map((q, i) => ({ ...q, id: `A${i + 1}`, marks: 1 }));
}

// ── BATCH HELPER: generate Sections B, C, D, E ───────────────────────────────
async function generateSectionsBCDE(subject, chapter, counts = { B: 6, C: 4, D: 2, E: 3 }) {
  const { B = 0, C = 0, D = 0, E = 0 } = counts;
  if (B === 0 && C === 0 && D === 0 && E === 0) {
    return { B: [], C: [], D: [], E: [] };
  }

  const sectionsToGenerate = [];
  if (B > 0) sectionsToGenerate.push(`- Section B: EXACTLY ${B} Very Short Answer questions (2 marks each) — definitions, short numericals, one-concept explanations.`);
  if (C > 0) sectionsToGenerate.push(`- Section C: EXACTLY ${C} Short Answer questions (3 marks each) — derivations, numericals with 2-3 steps, short explanations.`);
  if (D > 0) sectionsToGenerate.push(`- Section D: EXACTLY ${D} Long Answer / Derivation questions (5 marks each) — full derivations or two-part questions with diagram + numerical.`);
  if (E > 0) sectionsToGenerate.push(`- Section E: EXACTLY ${E} Case-Study questions (4 marks each) — each must have a 4-6 line reading passage, then sub-questions below it.`);

  const jsonTemplate = {};
  if (B > 0) {
    jsonTemplate.B = Array.from({ length: B }, (_, i) => ({ id: `B${i+1}`, question: '...', marks: 2 }));
  }
  if (C > 0) {
    jsonTemplate.C = Array.from({ length: C }, (_, i) => ({ id: `C${i+1}`, question: '...', marks: 3 }));
  }
  if (D > 0) {
    jsonTemplate.D = Array.from({ length: D }, (_, i) => ({ id: `D${i+1}`, question: '...', marks: 5 }));
  }
  if (E > 0) {
    jsonTemplate.E = Array.from({ length: E }, (_, i) => ({ id: `E${i+1}`, question: 'Case Study: <4-6 line passage>\\n\\nQuestion: <sub-question(s)>', marks: 4 }));
  }

  const prompt = `You are a CBSE Class 12 question paper setter.
Generate the subjective sections of a mock test.
Subject: "${subject}"
Chapter/Scope: "${chapter || 'All Chapters (Full Syllabus)'}"

Required sections and counts:
${sectionsToGenerate.join('\n')}

Rules:
- CBSE board quality, drawn from NCERT syllabus.
- Do NOT repeat concepts covered in Section A.
- Cover breadth of the chapter/syllabus.

Return ONLY a valid JSON object (no markdown, no code fences) with the exact keys: ${Object.keys(jsonTemplate).join(', ')}:
${JSON.stringify(jsonTemplate, null, 2)}`;

  const text = await callGroqAPI([
    { role: 'system', content: `Return only a valid JSON object with keys ${Object.keys(jsonTemplate).join(', ')}. Each must be a complete array. No markdown, no truncation.` },
    { role: 'user', content: prompt }
  ], 0.2, { type: 'json_object' });

  const parsed = JSON.parse(text);
  return {
    B: (parsed.B || []).map((q, i) => ({ ...q, id: `B${i + 1}`, marks: 2 })),
    C: (parsed.C || []).map((q, i) => ({ ...q, id: `C${i + 1}`, marks: 3 })),
    D: (parsed.D || []).map((q, i) => ({ ...q, id: `D${i + 1}`, marks: 5 })),
    E: (parsed.E || []).map((q, i) => ({ ...q, id: `E${i + 1}`, marks: 4 })),
  };
}

// 2. Generate Mock Paper — BATCHED (two parallel API calls merged server-side)
// Scales dynamically based on testDuration: 30m = 15m, 60m = 25m, 120m = 50m, 180m = 80m
router.post('/generate-test', async (req, res) => {
  const { subject, chapter, duration = 60 } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject is required.' });

  // Map duration to counts and target marks
  let countA = 5;
  let countB = 4;
  let countC = 4;
  let countD = 0;
  let countE = 0;
  let totalTargetMarks = 25;

  if (duration === 30) {
    countA = 15;
    countB = 0;
    countC = 0;
    countD = 0;
    countE = 0;
    totalTargetMarks = 15;
  } else if (duration === 60) {
    countA = 5;
    countB = 4;
    countC = 4;
    countD = 0;
    countE = 0;
    totalTargetMarks = 25;
  } else if (duration === 120) {
    countA = 10;
    countB = 5;
    countC = 5;
    countD = 3;
    countE = 0;
    totalTargetMarks = 50;
  } else if (duration === 180) {
    countA = 20;
    countB = 6;
    countC = 7;
    countD = 3;
    countE = 3;
    totalTargetMarks = 80;
  }

  try {
    // Fire both calls in parallel to save time
    const [secAArr, secBCDE] = await Promise.all([
      generateSectionA(subject, chapter, countA),
      generateSectionsBCDE(subject, chapter, { B: countB, C: countC, D: countD, E: countE })
    ]);

    const secA = secAArr;
    const secB = secBCDE.B || [];
    const secC = secBCDE.C || [];
    const secD = secBCDE.D || [];
    const secE = secBCDE.E || [];

    const totalMarks =
      secA.reduce((s, q) => s + (q.marks || 1), 0) +
      secB.reduce((s, q) => s + (q.marks || 2), 0) +
      secC.reduce((s, q) => s + (q.marks || 3), 0) +
      secD.reduce((s, q) => s + (q.marks || 5), 0) +
      secE.reduce((s, q) => s + (q.marks || 4), 0);

    return res.json({
      title: `CBSE Class 12 Mock Examination — ${subject} (${chapter || 'Full Syllabus'})`,
      subject,
      chapter: chapter || 'All Chapters',
      totalMarks,
      sections: { A: secA, B: secB, C: secC, D: secD, E: secE }
    });

  } catch (error) {
    console.warn('Batched mock paper generation failed, using offline fallback:', error.message);

    const fallbackSecA = [
      { id:'A1',  marks:1, question:'An electric dipole is placed in a uniform electric field. The net force on it is:', options:['Always zero','Never zero','Depends on its orientation','Depends on field magnitude'], answer:'Always zero' },
      { id:'A2',  marks:1, question:'The capacitance of a parallel plate capacitor increases when:', options:['Area of plates is decreased','Distance between plates is increased','A dielectric is inserted between plates','Voltage across it is increased'], answer:'A dielectric is inserted between plates' },
      { id:'A3',  marks:1, question:'Assertion (A): Equipotential surfaces are always perpendicular to electric field lines.\nReason (R): Work done in moving a charge along an equipotential surface is zero.', options:['Both A and R are true and R is the correct explanation of A','Both A and R are true but R is NOT the correct explanation of A','A is true but R is false','A is false but R is true'], answer:'Both A and R are true and R is the correct explanation of A' },
      { id:'A4',  marks:1, question:'Which of the following has the highest resistivity at room temperature?', options:['Silver','Copper','Nichrome','Aluminium'], answer:'Nichrome' },
      { id:'A5',  marks:1, question:'The SI unit of magnetic flux is:', options:['Tesla','Weber','Gauss','Oersted'], answer:'Weber' },
      { id:'A6',  marks:1, question:'Assertion (A): A current-carrying conductor placed parallel to a magnetic field experiences no force.\nReason (R): Force on a conductor F = BIL sinθ is zero when θ = 0°.', options:['Both A and R are true and R is the correct explanation of A','Both A and R are true but R is NOT the correct explanation of A','A is true but R is false','A is false but R is true'], answer:'Both A and R are true and R is the correct explanation of A' },
      { id:'A7',  marks:1, question:'In a moving coil galvanometer, the deflection is proportional to:', options:['Resistance of the coil','Square of the current','Current through the coil','Voltage squared'], answer:'Current through the coil' },
      { id:'A8',  marks:1, question:'The phenomenon of electromagnetic induction was discovered by:', options:['Maxwell','Faraday','Oersted','Ampere'], answer:'Faraday' },
      { id:'A9',  marks:1, question:'Which type of wave does not require a medium for propagation?', options:['Sound wave','Water wave','Electromagnetic wave','Seismic wave'], answer:'Electromagnetic wave' },
      { id:'A10', marks:1, question:'Critical angle for total internal reflection depends on:', options:['Wavelength only','Refractive index only','Both wavelength and refractive indices','Neither'], answer:'Both wavelength and refractive indices' },
      { id:'A11', marks:1, question:'Assertion (A): Concave mirrors are used as shaving mirrors.\nReason (R): A concave mirror forms an enlarged, erect, virtual image when the object is within the focal length.', options:['Both A and R are true and R is the correct explanation of A','Both A and R are true but R is NOT the correct explanation of A','A is true but R is false','A is false but R is true'], answer:'Both A and R are true and R is the correct explanation of A' },
      { id:'A12', marks:1, question:"In Young's double slit experiment, if slit separation is halved and screen distance is doubled, fringe width becomes:", options:['Unchanged','Halved','Doubled','Four times'], answer:'Four times' },
      { id:'A13', marks:1, question:'Photoelectric effect establishes the:', options:['Wave nature of light','Particle nature of light','Dual nature of light','Transverse nature of light'], answer:'Particle nature of light' },
      { id:'A14', marks:1, question:'The de Broglie wavelength of a particle is inversely proportional to its:', options:['Mass','Speed','Momentum','Kinetic energy'], answer:'Momentum' },
      { id:'A15', marks:1, question:'Which series of hydrogen spectrum lies in the visible region?', options:['Lyman series','Balmer series','Paschen series','Brackett series'], answer:'Balmer series' },
      { id:'A16', marks:1, question:'Assertion (A): Alpha particles are deflected more than beta particles in a magnetic field.\nReason (R): Alpha particles have greater charge-to-mass ratio than beta particles.', options:['Both A and R are true and R is the correct explanation of A','Both A and R are true but R is NOT the correct explanation of A','A is true but R is false','A is false but R is true'], answer:'A is false but R is true' },
      { id:'A17', marks:1, question:'The number of electrons in the valence band of an insulator at 0 K is:', options:['Zero','Very large','Small but finite','Equal to conduction band'], answer:'Very large' },
      { id:'A18', marks:1, question:'A p-n junction diode conducts when:', options:['Forward biased','Reverse biased','Both biasing conditions','Unbiased'], answer:'Forward biased' },
      { id:'A19', marks:1, question:'The output of a NAND gate is HIGH when:', options:['All inputs are HIGH','All inputs are LOW','At least one input is LOW','At least one input is HIGH'], answer:'At least one input is LOW' },
      { id:'A20', marks:1, question:'Assertion (A): Optical fibres are used for transmission of signals.\nReason (R): Optical fibres work on the principle of total internal reflection.', options:['Both A and R are true and R is the correct explanation of A','Both A and R are true but R is NOT the correct explanation of A','A is true but R is false','A is false but R is true'], answer:'Both A and R are true and R is the correct explanation of A' }
    ];

    const fallbackSecB = [
      { id:'B1', marks:2, question:'A wire of resistance $12\\,\\Omega$ is bent into a circle. Calculate the effective resistance between the two ends of any diameter.' },
      { id:'B2', marks:2, question:"State Lenz's Law. How is it consistent with the law of conservation of energy?" },
      { id:'B3', marks:2, question:'Define the term "stopping potential" in the photoelectric effect. On what factors does it depend?' },
      { id:'B4', marks:2, question:'Draw the logic symbol for a NOR gate and write its truth table for two inputs A and B.' },
      { id:'B5', marks:2, question:'Two point charges $+4\\,\\mu C$ and $-4\\,\\mu C$ are placed $20\\,\\text{cm}$ apart. Calculate the electric potential at the midpoint of the line joining them.' },
      { id:'B6', marks:2, question:'Define "critical temperature" in superconductivity. Name one superconducting material and state one application.' }
    ];

    const fallbackSecC = [
      { id:'C1', marks:3, question:"Using Gauss' Law, derive an expression for the electric field due to an infinitely long straight uniformly charged wire of linear charge density $\\lambda$. Draw the Gaussian surface used." },
      { id:'C2', marks:3, question:"In Young's double slit experiment, slits are separated by $0.5\\,\\text{mm}$ and the screen is $1.5\\,\\text{m}$ away. Wavelength of light is $600\\,\\text{nm}$. Calculate (i) fringe width and (ii) angular fringe width." },
      { id:'C3', marks:3, question:'Explain the working principle of a transformer. Why is its core laminated? Write the turns-ratio equation relating primary and secondary voltages.' },
      { id:'C4', marks:3, question:'A radioactive nucleus $^{238}_{92}\\text{U}$ emits one alpha and two beta particles. Determine the atomic number and mass number of the resulting daughter nucleus.' },
      { id:'C5', marks:3, question:'Explain the differences between step-up and step-down transformers. Draw the schematic representation of each.' },
      { id:'C6', marks:3, question:'Define mutual inductance. Derive the expression for mutual inductance of two long coaxial solenoids.' },
      { id:'C7', marks:3, question:'Explain the phenomenon of dispersion of light. Derive the relation between refractive index, angle of prism, and angle of minimum deviation.' }
    ];

    const fallbackSecD = [
      { id:'D1', marks:5, question:'(a) State the Biot-Savart Law. Using it, derive an expression for the magnetic field at a point on the axis of a circular current-carrying loop of radius $R$ at distance $x$ from its centre.\n(b) Show that for $x >> R$, the loop behaves like a magnetic dipole. Determine the equivalent magnetic moment.' },
      { id:'D2', marks:5, question:'(a) Draw a neat, labelled diagram of a compound microscope. Derive an expression for its magnifying power when the final image is formed at the near point.\n(b) The objective and eyepiece focal lengths are $2\\,\\text{cm}$ and $5\\,\\text{cm}$ respectively. The object is placed $2.2\\,\\text{cm}$ from the objective. If the final image is at the near point ($25\\,\\text{cm}$), find the magnifying power.' },
      { id:'D3', marks:5, question:'(a) Derive the mirror formula for a concave mirror forming a real, inverted image. State all the sign conventions used.\n(b) An object is placed at $15\\,\\text{cm}$ in front of a concave mirror of focal length $10\\,\\text{cm}$. Find the position, nature, and magnification of the image.' }
    ];

    const fallbackSecE = [
      { id:'E1', marks:4, question:"Case Study: A cell of emf $\\varepsilon$ and internal resistance $r$ is connected to an external resistance $R$. Terminal voltage when discharging: $V = \\varepsilon - Ir$. When charging: $V = \\varepsilon + Ir$. This principle is critical in electric vehicle battery management systems.\n\nQuestion: A cell of emf $2.0\\,\\text{V}$ and internal resistance $0.5\\,\\Omega$ is connected to $9.5\\,\\Omega$. Calculate (i) current in the circuit, (ii) terminal voltage of the cell, and (iii) potential difference across the external resistance." },
      { id:'E2', marks:4, question:"Case Study: In a p-type semiconductor, holes are majority carriers; in n-type, electrons are majority carriers. When a p-n junction forms, carrier diffusion creates a depletion region with a built-in potential barrier. Forward bias reduces the barrier enabling large current; reverse bias widens it allowing only a tiny leakage current.\n\nQuestion: (i) Define the 'depletion region' in a p-n junction. (ii) Why is the resistance of a p-n junction diode low in forward bias and high in reverse bias? (iii) Sketch the I-V characteristic curve of a p-n junction diode and label its key features." },
      { id:'E3', marks:4, question:"Case Study: When light travels from a denser medium (refractive index $n_1$) to a rarer medium ($n_2 < n_1$), total internal reflection occurs if the angle of incidence exceeds the critical angle $\\theta_c = \\sin^{-1}(n_2/n_1)$. Optical fibres exploit this principle to carry data as light pulses over thousands of kilometres with minimal signal loss.\n\nQuestion: (i) Calculate the critical angle for a glass-air interface where $n_{glass} = 1.5$. (ii) What is the role of the cladding in an optical fibre? (iii) State one advantage of optical fibre communication over conventional copper wire." }
    ];

    const getSlicedQuestions = (arr, count, prefix) => {
      if (count <= 0) return [];
      const sliced = arr.slice(0, count);
      while (sliced.length < count) {
        const original = arr[sliced.length % arr.length];
        sliced.push({ ...original, id: `${prefix}${sliced.length + 1}` });
      }
      return sliced.map((q, i) => ({ ...q, id: `${prefix}${i + 1}` }));
    };

    const finalA = getSlicedQuestions(fallbackSecA, countA, 'A');
    const finalB = getSlicedQuestions(fallbackSecB, countB, 'B');
    const finalC = getSlicedQuestions(fallbackSecC, countC, 'C');
    const finalD = getSlicedQuestions(fallbackSecD, countD, 'D');
    const finalE = getSlicedQuestions(fallbackSecE, countE, 'E');

    const totalMarks =
      finalA.reduce((s, q) => s + (q.marks || 1), 0) +
      finalB.reduce((s, q) => s + (q.marks || 2), 0) +
      finalC.reduce((s, q) => s + (q.marks || 3), 0) +
      finalD.reduce((s, q) => s + (q.marks || 5), 0) +
      finalE.reduce((s, q) => s + (q.marks || 4), 0);

    return res.json({
      title: `CBSE Class 12 Mock Examination — ${subject} (${chapter || 'Full Syllabus'})`,
      subject,
      chapter: chapter || 'All Chapters',
      totalMarks,
      sections: { A: finalA, B: finalB, C: finalC, D: finalD, E: finalE },
      fallback: true
    });
  }
});

// 2b. Quick Practice / PYQ Drill — user picks subject, chapters, type & count
router.post('/quick-practice', async (req, res) => {
  const { subject, chapters, questionType, count } = req.body;
  if (!subject) return res.status(400).json({ error: 'Subject is required.' });

  const safeCount = Math.min(Math.max(parseInt(count) || 10, 3), 25);
  const chapterScope = (chapters && chapters.length > 0)
    ? chapters.join(', ')
    : 'All Chapters (Full Syllabus)';

  const typeInstructions = {
    MCQ:   `All ${safeCount} questions must be MCQs with exactly 4 options. Include Assertion-Reason MCQs. Each worth 1 mark.`,
    VSA:   `All ${safeCount} questions must be Very Short Answer (2 marks each). No options. Expect 2-3 sentence answers.`,
    SA:    `All ${safeCount} questions must be Short Answer (3 marks each). No options. Expect 3-5 step solutions or 3-point definitions.`,
    LA:    `All ${safeCount} questions must be Long Answer or derivation (5 marks each). No options. Expect full derivations or two-part questions.`,
    Mixed: `Mix the ${safeCount} questions: ~40% MCQ (1m), ~25% VSA (2m), ~25% SA (3m), ~10% LA (5m). Include some Assertion-Reason.`
  };

  const rule = typeInstructions[questionType] || typeInstructions.Mixed;

  const prompt = `You are a CBSE Class 12 expert question setter.
Generate exactly ${safeCount} PYQ-style CBSE practice questions.

Subject: "${subject}"
Chapter(s): "${chapterScope}"
Question type rule: ${rule}

Rules:
- Draw from NCERT and actual CBSE board papers (2015-2024).
- Board-exam quality: clear language, precise wording.
- Cover diverse concepts — no two questions on the same sub-topic.
- For MCQs: provide exactly 4 options and the correct answer text.
- For subjective questions: omit "options" and "answer" fields entirely.

Return ONLY a valid JSON object with key "questions" containing an array of exactly ${safeCount} items:
{
  "questions": [
    { "id": "Q1", "question": "<question>", "marks": <number>, "options": ["A","B","C","D"], "answer": "<correct option text>" },
    { "id": "Q2", "question": "<question>", "marks": <number> }
  ]
}
Omit "options" and "answer" for subjective questions. No markdown.`;

  try {
    const text = await callGroqAPI([
      { role: 'system', content: `Return only a valid JSON object with key "questions" — an array of exactly ${safeCount} items. No markdown.` },
      { role: 'user', content: prompt }
    ], 0.25, { type: 'json_object' });

    const parsed = JSON.parse(text);
    const raw = parsed.questions || (Array.isArray(parsed) ? parsed : Object.values(parsed)[0]) || [];
    const questions = raw.map((q, i) => ({ ...q, id: `Q${i + 1}` }));
    const totalMarks = questions.reduce((s, q) => s + (q.marks || (q.options ? 1 : 3)), 0);

    return res.json({ subject, chapters: chapterScope, questionType, questions, totalMarks });

  } catch (err) {
    console.warn('Quick practice generation failed:', err.message);
    return res.status(500).json({ error: 'Could not generate questions. Please try again.' });
  }
});

// 3. Evaluate Student Mock Test answers
router.post('/evaluate-test', async (req, res) => {
  const { subject, generatedPaper, answers } = req.body;

  if (!subject || !generatedPaper || !answers) {
    return res.status(400).json({ error: 'Missing evaluation data.' });
  }

  const totalMarks = generatedPaper.totalMarks ||
    Object.values(generatedPaper.sections || {}).flat().reduce((s, q) => s + (q.marks || 0), 0);

  const prompt = `You are a senior CBSE board examiner evaluating a Class 12 mock test paper.

Subject: ${subject}
Total Marks of this paper: ${totalMarks}

All Questions (with correct answers where available):
${JSON.stringify(generatedPaper.sections, null, 2)}

Student's Answers:
${JSON.stringify(answers, null, 2)}

Evaluation Instructions:
1. Grade Section A (MCQ/Assertion-Reason) automatically — full mark if answer matches exactly, zero otherwise.
2. For Sections B, C, D, E (subjective): evaluate based on CBSE marking scheme keywords and concepts.
   - Award partial marks generously where the student shows partial understanding.
   - For blank/empty answers, award 0 marks.
3. Calculate total score accurately.
4. In the feedback markdown:
   - List every question ID with marks awarded and a brief examiner remark.
   - Use ✅ for correct, ❌ for wrong, 🟡 for partial credit.
   - End with an overall performance summary and 3 specific improvement tips.
5. Return ONLY valid JSON:
{
  "score": <number>,
  "totalMarks": ${totalMarks},
  "feedback": "<markdown string with full question-by-question evaluation>"
}`;

  try {
    const responseText = await callGroqAPI([
      { role: 'system', content: 'You are a strict JSON-generating CBSE examiner. Return valid JSON only.' },
      { role: 'user', content: prompt }
    ], 0.1, { type: 'json_object' });

    const evaluation = JSON.parse(responseText);
    return res.json(evaluation);
  } catch (error) {
    console.warn('Evaluation LLM connection failed, using default evaluation:', error.message);

    let correctCount = 0;
    let total = 0;

    if (generatedPaper.sections?.A) {
      generatedPaper.sections.A.forEach(q => {
        total += q.marks;
        if (answers[q.id] === q.answer) correctCount += q.marks;
      });
    }

    ['B', 'C', 'D', 'E'].forEach(sec => {
      if (generatedPaper.sections?.[sec]) {
        generatedPaper.sections[sec].forEach(q => {
          total += q.marks;
          if (answers[q.id] && answers[q.id].length > 10) {
            correctCount += Math.round(q.marks * 0.7);
          }
        });
      }
    });

    return res.json({
      score: correctCount,
      totalMarks: total,
      feedback: `### CBSE Board Evaluation Report (Offline Mode)\n\nThank you for completing the simulation!\n\n- **Section A**: Automatically graded.\n- **Section B–E**: Estimated based on response length.\n\n**Examiner's Remarks:**\n- Good attempt overall! Focus on writing NCERT keyword phrases for full marks.\n- For Section D derivations, always state assumptions and draw a clean labelled diagram.\n- For 3-mark questions, write exactly 3 clear points matching the mark weightage.`,
      fallback: true
    });
  }
});

// 3b. Analyze mock test errors and compile weak topics
router.post('/analyze-errors', async (req, res) => {
  const { subject, generatedPaper, answers, evaluation } = req.body;

  if (!subject || !generatedPaper || !answers || !evaluation) {
    return res.status(400).json({ error: 'Missing analysis data.' });
  }

  const totalMarks = generatedPaper.totalMarks ||
    Object.values(generatedPaper.sections || {}).flat().reduce((s, q) => s + (q.marks || 0), 0);

  const prompt = `You are a CBSE board examiner and learning scientist.
  Analyze the student's performance on this mock test to identify their exact conceptual errors and list the weak topics they must revise.

  Subject: ${subject}
  Paper: ${JSON.stringify(generatedPaper.sections)}
  Student's Answers: ${JSON.stringify(answers)}
  Evaluation Score: ${evaluation.score} / ${totalMarks}
  Evaluation Feedback: ${evaluation.feedback}

  Identify:
  1. Which specific questions the student got wrong, lost marks on, or left blank.
  2. The underlying conceptual gaps based on their answer and the CBSE marking guidelines.
  3. A clean list of exactly 3 to 6 weak sub-topics (e.g. "Gauss' Law Derivation", "Resistance in circular loops") that need urgent revision.

  Return ONLY a valid JSON object (do not wrap in markdown):
  {
    "weakTopics": ["Topic 1", "Topic 2", ...],
    "detailedAnalysis": "<markdown string detailing each error, the conceptual mistake, the correct NCERT approach, and custom study tips>"
  }`;

  // Try Gemini 1.5 Flash first
  try {
    const replyText = await callGeminiAPI(
      "You are an expert CBSE learning analyst. Return valid JSON only with keys 'weakTopics' (array of strings) and 'detailedAnalysis' (markdown string). Do not wrap in markdown blocks.",
      [],
      prompt,
      0.15
    );
    let cleanText = replyText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    const analysis = JSON.parse(cleanText);
    console.log('✅ Gemini error analysis successful');
    return res.json(analysis);
  } catch (geminiError) {
    console.warn('⚠️ Gemini error analysis failed, falling back to Groq:', geminiError.message);
  }

  // Fallback to Groq
  try {
    const responseText = await callGroqAPI([
      { role: 'system', content: 'You are an expert CBSE learning analyst. Return valid JSON only with keys "weakTopics" and "detailedAnalysis".' },
      { role: 'user', content: prompt }
    ], 0.1, { type: 'json_object' });

    const analysis = JSON.parse(responseText);
    console.log('✅ Groq error analysis successful');
    return res.json(analysis);
  } catch (error) {
    console.warn('Error analysis LLM connection failed:', error.message);
    
    // Offline fallback
    return res.json({
      weakTopics: [
        "Syllabus Derivations & Diagrams",
        "SI Unit Accuracy",
        "CBSE Marking Scheme Keyword Usage"
      ],
      detailedAnalysis: `### AI Error Analysis (Offline Mode)
      
We could not connect to the AI analysis engine. Based on standard grading guidelines for **${subject}**:
      
1. **Conceptual Accuracy**: Double check if you are writing formulas before calculating.
2. **Diagrams**: CBSE marking schemes allocate 0.5 to 1.5 marks for neat, labelled diagrams (especially for Microscope/Telescope or Gauss law surfaces).
3. **Keywords**: Focus on writing specific NCERT standard definitions (e.g., drift velocity definitions).`
    });
  }
});

// 4. Generate Formula Sheets & Revision Notes
router.post('/generate-notes', async (req, res) => {
  const { subject, chapter } = req.body;

  if (!subject || !chapter) {
    return res.status(400).json({ error: 'Subject and chapter are required.' });
  }

  const cacheKey = `ai:notes:${subject.toLowerCase().trim()}:${chapter.toLowerCase().trim()}`;
  try {
    const cachedResponse = await safeCache.get(cacheKey);
    if (cachedResponse) {
      console.log('⚡ RedVER Cache Hit for Formula Sheet/Notes! Saving API tokens.');
      const parsed = JSON.parse(cachedResponse);
      return res.json({ ...parsed, cached: true });
    }
  } catch (err) {
    console.error('RedVER read error for /generate-notes:', err);
  }

  const prompt = `Generate a high-yield Formula Sheet and Revision Note for Grade 12/11 CBSE:
Subject: ${subject}
Chapter: ${chapter}

Include:
1. Core Definitions (using strict NCERT definitions).
2. Key Formulas (rendered in clean LaTeX $$ formatting).
3. Critical NCERT Exemplar focus areas.
4. CBSE PYQ Tips (common mistakes students make in exams).
5. Quick summary mind map structure in text layout.`;

  try {
    const notesText = await callGroqAPI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ], 0.2);

    const successResponse = { notes: notesText };
    try {
      await safeCache.set(cacheKey, JSON.stringify(successResponse), { EX: 86400 });
    } catch (e) {
      console.warn('RedVER write error for /generate-notes:', e.message);
    }
    return res.json(successResponse);
  } catch (error) {
    console.warn('Groq notes connection failed, generating fallback notes:', error.message);

    const fallbackNotes = `# CBSE Quick Revision & Formula Sheet
## Subject: ${subject} | Chapter: ${chapter}

> [!NOTE]
> *This is an offline fallback formula sheet because the Groq API key is not currently set.*

### 1. Key Definitions & Concepts
- **Core Concept 1:** Defined strictly according to NCERT textbook standards.
- **Core Concept 2:** Important conceptual keyword phrases that board checkers search for in responses.

### 2. High-Yield Formulas
- **Primary Formula:**
  $$X = Y \\times Z$$
- **Relation Constant:**
  $$K = \\frac{1}{4\\pi \\varepsilon_0} \\approx 9 \\times 10^9 \\text{ N m}^2/\\text{C}^2$$

### 3. Common Exam Mistakes
- Writing formulas without stating units (always use SI units!).
- Forgetting to show a clean sketch diagram for derivation questions (CBSE awards 0.5 to 1 mark specifically for diagrams).
- Mixing up radius values in circular loop magnetic equations.
`;
    return res.json({ notes: fallbackNotes, fallback: true });
  }
});

// 5. Generate Weekly AI Study Planner
router.post('/generate-schedule', async (req, res) => {
  const { subjectProgress, examDate, targetScore } = req.body;

  const prompt = `Generate a highly customisable weekly AI study schedule for a CBSE student with:
Syllabus Status: ${JSON.stringify(subjectProgress)}
Exam Target Date: ${examDate || 'Next month'}
Target Board Score: ${targetScore || '95%'}

Return a structured markdown output detailing which subjects/chapters they need to focus on this week, daily recommended Pomodoro slots, and PYQ challenges. Include encouragement!`;

  try {
    const schedule = await callGroqAPI([
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt }
    ]);
    return res.json({ schedule });
  } catch (error) {
    console.warn('Groq schedule generation failed, returning fallback planner:', error.message);

    const fallbackSchedule = `### Weekly AI Study Plan (Offline Draft)
Based on your checklist completion of subjects, here is your customized plan:

#### Day-by-Day Study Schedule
- **Monday & Tuesday**: Focus on your **In Progress** chapters. Complete 2 Pomodoro sessions (50 mins total) doing textbook exercises.
- **Wednesday**: Mock Test Challenge! Solve 1 subjective practice paper on your completed chapters.
- **Thursday & Friday**: Spaced Repetition day. Review flashcards for formulas and definitions.
- **Saturday**: Socratic doubt clearing. Use the AI Doubt Solver to test your knowledge on weak areas.
- **Sunday**: Rest, review, and organize notes for the upcoming week.

*Keep up the hard work! Consistency builds a 95%+ score!*`;

    return res.json({ schedule: fallbackSchedule, fallback: true });
  }
});

// 6. Voice-to-Text Transcription endpoint using Groq Whisper
router.post('/transcribe', async (req, res) => {
  const { audio } = req.body;

  if (!audio) {
    return res.status(400).json({ error: 'Audio data is required' });
  }

  try {
    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error('GROQ_API_KEY is not defined in environment variables');
    }

    let base64Data = audio;
    if (audio.includes('base64,')) {
      base64Data = audio.split('base64,')[1];
    }

    const buffer = Buffer.from(base64Data, 'base64');
    const audioBlob = new Blob([buffer], { type: 'audio/webm' });

    const formData = new FormData();
    formData.append('file', audioBlob, 'query.webm');
    formData.append('model', 'whisper-large-v3');
    formData.append('language', 'en');

    const groqResponse = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${apiKey}` },
      body: formData
    });

    if (!groqResponse.ok) {
      const errorText = await groqResponse.text();
      throw new Error(`Groq Whisper API responded with: ${groqResponse.status} - ${errorText}`);
    }

    const result = await groqResponse.json();
    return res.json({ text: result.text });

  } catch (error) {
    console.error('Groq Whisper transcription failed:', error.message);
    return res.status(500).json({ error: 'Transcription failed: ' + error.message });
  }
});

// 9. Generate Flashcards for a specific subject and chapter
router.post('/generate-flashcards', async (req, res) => {
  const { userId = 'default-student', subject, chapter } = req.body;

  if (!subject || !chapter) {
    return res.status(400).json({ error: 'Subject and chapter are required.' });
  }

  const prompt = `You are a CBSE board examiner and learning scientist.
  Generate exactly 5 high-yield study flashcards (Question & Answer) for a Grade 11/12 student studying:
  Subject: ${subject}
  Chapter: ${chapter}

  Guidelines:
  1. Ground all questions and answers strictly in the NCERT syllabus.
  2. Questions (key "q") should be clear definitions, key conceptual check questions, or formula recollections.
  3. Answers (key "a") should be concise (1-3 sentences) but precise, containing the exact keywords required in CBSE marking schemes.
  4. Render mathematical expressions or chemical formulas in clean LaTeX formatting ($...$ or $$...$$).

  Return ONLY a valid JSON array of objects, containing "q" and "a" keys. Do not wrap in markdown block formatting:
  [
    { "q": "Question 1", "a": "Answer 1" },
    ...
  ]`;

  // Try Gemini first
  try {
    const replyText = await callGeminiAPI(
      "You are an expert CBSE learning scientist. Return valid JSON only containing a list of flashcard objects, each having keys 'q' (question) and 'a' (answer). Do not wrap in markdown blocks.",
      [],
      prompt,
      0.2
    );
    let cleanText = replyText.trim();
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```json\s*/i, '').replace(/```$/, '').trim();
    }
    const cards = JSON.parse(cleanText);

    // Save cards to DB
    const savedCards = [];
    for (const card of cards) {
      if (!card.q || !card.a) continue;
      const newCard = new Flashcard({
        userId,
        subject,
        chapter,
        question: card.q,
        answer: card.a
      });
      await newCard.save();
      savedCards.push(newCard);
    }

    console.log(`✅ Gemini generated ${savedCards.length} flashcards`);
    return res.json(savedCards);
  } catch (geminiError) {
    console.warn('⚠️ Gemini flashcard generation failed, falling back to Groq:', geminiError.message);
  }

  // Fallback to Groq
  try {
    const responseText = await callGroqAPI([
      { role: 'system', content: 'You are an expert CBSE learning scientist. Return valid JSON only containing an array of flashcard objects with keys "q" and "a".' },
      { role: 'user', content: prompt }
    ], 0.2, { type: 'json_object' });

    let cleanText = responseText.trim();
    const parsed = JSON.parse(cleanText);
    const cards = Array.isArray(parsed) ? parsed : (parsed.flashcards || parsed.cards || []);

    const savedCards = [];
    for (const card of cards) {
      const qText = card.q || card.question;
      const aText = card.a || card.answer;
      if (!qText || !aText) continue;
      
      const newCard = new Flashcard({
        userId,
        subject,
        chapter,
        question: qText,
        answer: aText
      });
      await newCard.save();
      savedCards.push(newCard);
    }

    console.log(`✅ Groq generated ${savedCards.length} flashcards`);
    return res.json(savedCards);
  } catch (error) {
    console.error('Flashcard LLM generation failed:', error.message);
    return res.status(500).json({ error: 'Failed to generate flashcards: ' + error.message });
  }
});

export default router;

