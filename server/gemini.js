import { GoogleGenerativeAI } from '@google/generative-ai';

/**
 * Clean & extract JSON from LLM output even if wrapped in markdown ```json ... ```
 */
export function extractAndParseJSON(text) {
  if (!text || typeof text !== 'string') {
    throw new Error('Empty text received from AI model');
  }

  // 1. Try direct parse
  try {
    return JSON.parse(text.trim());
  } catch (e) {
    // Continue to regex extraction
  }

  // 2. Try code fence regex: ```json ... ``` or ``` ... ```
  const fenceMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (fenceMatch && fenceMatch[1]) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch (e) {
      // Continue
    }
  }

  // 3. Try finding outer JSON array or object bracket
  const arrayMatch = text.match(/\[\s*\{[\s\S]*\}\s*\]/);
  if (arrayMatch) {
    try {
      return JSON.parse(arrayMatch[0]);
    } catch (e) {
      // Continue
    }
  }

  const objMatch = text.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      return JSON.parse(objMatch[0]);
    } catch (e) {
      // Continue
    }
  }

  throw new Error(`Unable to parse valid JSON from AI response: ${text.slice(0, 150)}...`);
}

/**
 * Helper to call Gemini with retry and fallback
 */
async function callGeminiWithRetry(apiKey, modelName, prompt, systemInstruction = '', jsonMode = false, retries = 2) {
  const genAI = new GoogleGenerativeAI(apiKey);
  const generationConfig = {
    temperature: 0.4,
  };

  if (jsonMode) {
    generationConfig.responseMimeType = 'application/json';
  }

  const model = genAI.getGenerativeModel({
    model: modelName,
    systemInstruction: systemInstruction || undefined,
    generationConfig,
  });

  let lastError = null;
  for (let attempt = 1; attempt <= retries + 1; attempt++) {
    try {
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      return text;
    } catch (err) {
      lastError = err;
      console.warn(`[Gemini Attempt ${attempt}/${retries + 1} Failed]:`, err.message || err);
      if (attempt <= retries) {
        // Exponential backoff
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    }
  }
  throw lastError;
}

/**
 * 1. AI LEAD SCORING (0-100)
 * Evaluates: likely need for automation, business size signals, digital maturity
 * Returns: { score, reason, pain_points[], suggested_service }
 */
export async function scoreLeadWithAI(lead, apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    console.warn('[Gemini] No GEMINI_API_KEY found, generating intelligent heuristic score.');
    return generateHeuristicScore(lead);
  }

  const systemInstruction = `You are an elite B2B Sales Engineering AI specializing in B2B lead qualification, automation ROI modeling, and high-conversion agency outreach.
Your task is to analyze local & SMB businesses and calculate a quantitative Lead Score (0 to 100) based on:
1. Likely Need for Automation (manual scheduling, phone bottlenecks, inventory, repetitive paperwork)
2. Business Size & Purchasing Power signals (ticket size, staff size, customer volume)
3. Digital Maturity (website presence, modern tools vs manual phone/paper friction)

Scoring Criteria:
- 75-100 (HOT): High customer volume or high job value, heavy manual friction (phone calls, lost leads, scheduling), clear budget.
- 45-74 (WARM): Moderate transaction volume, noticeable operational friction, medium digital maturity.
- 0-44 (COLD): Very small sole proprietor or low-frequency business, minimal digital footprint, or low ROI for custom automation.

Output STRICT JSON only matching this schema:
{
  "score": <number between 0 and 100>,
  "reason": "<1-2 concise sentences explaining why this score was awarded based on operational signals>",
  "pain_points": [
    "<Pain point 1: specific operational bottleneck>",
    "<Pain point 2: lost revenue or high-friction task>",
    "<Pain point 3: customer communication gap>"
  ],
  "suggested_service": "<Specific high-value service name, e.g., '24/7 AI WhatsApp Booking & No-Show Reduction Bot' or 'Automated Dispatch & Quote Intake System'>"
}`;

  const prompt = `FEW-SHOT EXAMPLES:

Example 1:
Lead: {
  "business_name": "Metro Urgent Care & Diagnostics",
  "business_type": "Medical Clinic",
  "city": "Phoenix, AZ",
  "notes": "Walk-in clinic with 5 exam rooms. Receptionist constantly on phone taking insurance questions and appointment requests."
}
Response:
{
  "score": 91,
  "reason": "High patient intake with front-desk telephone bottlenecks creates patient attrition. Immediate ROI from automated patient intake and insurance triage.",
  "pain_points": [
    "Front desk spending 4+ hours per shift answering repetitive triage & insurance questions",
    "Long patient hold times causing frustrated walk-aways",
    "Manual paperwork leading to registration delays and delayed charts"
  ],
  "suggested_service": "AI Patient Triage & Automated Insurance Intake WhatsApp/SMS Bot"
}

Example 2:
Lead: {
  "business_name": "Corner Kiosk Newsstand",
  "business_type": "Street Newsstand / Snacks",
  "city": "Boston, MA",
  "notes": "Single person cash-and-carry retail stand."
}
Response:
{
  "score": 22,
  "reason": "Cash-and-carry walk-up model with low transaction sizes and zero customer re-engagement cycle makes custom software low ROI.",
  "pain_points": [
    "Limited square footage and inventory capacity",
    "Cash-heavy transactions without customer database capture",
    "No digital presence or appointment/lead workflow"
  ],
  "suggested_service": "Basic Square POS & Google Business Profile Setup"
}

NOW EVALUATE THIS TARGET LEAD:
Business Name: ${lead.business_name}
Business Type: ${lead.business_type}
City: ${lead.city}
Website: ${lead.website || 'None / Not provided'}
Notes/Context: ${lead.notes || 'None provided'}

Respond ONLY with valid JSON.`;

  try {
    // Try gemini-2.0-flash first, fallback to gemini-1.5-flash
    let rawText;
    try {
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-2.0-flash', prompt, systemInstruction, true);
    } catch (e2) {
      console.warn('Falling back to gemini-1.5-flash for scoring...');
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-1.5-flash', prompt, systemInstruction, true);
    }

    const parsed = extractAndParseJSON(rawText);
    const scoreNum = Math.min(100, Math.max(0, Math.round(Number(parsed.score) || 50)));

    return {
      score: scoreNum,
      reason: parsed.reason || 'Lead evaluated based on business signals and automation need.',
      pain_points: Array.isArray(parsed.pain_points) && parsed.pain_points.length > 0
        ? parsed.pain_points
        : ['Manual customer communication bottleneck', 'Time-consuming administrative workflow'],
      suggested_service: parsed.suggested_service || 'AI Workflow Automation & Lead Response Assistant'
    };
  } catch (error) {
    console.error('[Gemini Scoring Error]:', error.message || error);
    // Graceful fallback to heuristic score
    const fallback = generateHeuristicScore(lead);
    fallback.reason += ' (Generated via smart fallback due to AI API limit)';
    return fallback;
  }
}

/**
 * 2. AI OUTREACH GENERATOR
 * Produces personalized WhatsApp message and cold email for friendly and professional tones
 */
export async function generateOutreachWithAI(lead, tone = 'friendly', apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    console.warn('[Gemini] No GEMINI_API_KEY found, generating heuristic outreach.');
    return generateHeuristicOutreach(lead, tone);
  }

  const systemInstruction = `You are a world-class B2B copywriter specializing in personalized cold outreach for digital agencies and automation consultants.
You craft messages that:
1. Reference the exact business name, type, city, and pain points naturally.
2. WhatsApp Message: Concise (3-4 sentences max), conversational, emojis used tastefully, clear low-friction call-to-action (e.g., "Open to a 2-min demo?", "Mind if I send a quick video?").
3. Cold Email: Punchy subject line (includes company name/hook), personalized opening compliment/observation, identifies 1 core bottleneck, introduces the solution, low-pressure CTA (5-min chat or brief video).
4. Matches the requested tone: 'friendly' (warm, casual, enthusiastic, conversational) OR 'professional' (polished, executive, ROI-focused, consultative).

Output STRICT JSON only:
{
  "whatsapp": "<whatsapp message text>",
  "email": "<full email with Subject: ... on line 1, followed by body>"
}`;

  const painPointsStr = lead.score_details?.pain_points?.join(', ') || lead.notes || 'reducing manual customer follow-ups and lost leads';
  const suggestedService = lead.score_details?.suggested_service || 'Automated WhatsApp Customer & Booking Concierge';

  const prompt = `Target Lead Details:
Business Name: ${lead.business_name}
Business Type: ${lead.business_type}
City: ${lead.city}
Website: ${lead.website || 'N/A'}
Notes: ${lead.notes || 'Local business seeking growth'}
Lead Score: ${lead.score || 75}/100
Identified Pain Points: ${painPointsStr}
Recommended Service: ${suggestedService}
Selected Tone: ${tone}

Generate high-converting personalized WhatsApp and Cold Email copy for this lead in the requested tone (${tone}).
Return strictly valid JSON with keys "whatsapp" and "email".`;

  try {
    let rawText;
    try {
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-2.0-flash', prompt, systemInstruction, true);
    } catch (e) {
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-1.5-flash', prompt, systemInstruction, true);
    }

    const parsed = extractAndParseJSON(rawText);
    return {
      whatsapp: parsed.whatsapp?.trim() || generateHeuristicOutreach(lead, tone).whatsapp,
      email: parsed.email?.trim() || generateHeuristicOutreach(lead, tone).email
    };
  } catch (err) {
    console.error('[Gemini Outreach Error]:', err.message || err);
    return generateHeuristicOutreach(lead, tone);
  }
}

/**
 * 3. AUTO-GENERATE SAMPLE LEADS
 * Uses Gemini to produce 10 realistic leads for a given industry + city
 */
export async function autoGenerateLeadsWithAI(industry, city, apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    console.warn('[Gemini] No GEMINI_API_KEY found, returning curated realistic leads.');
    return generateSampleLeadsOffline(industry, city);
  }

  const systemInstruction = `You are a B2B sales intelligence data generator.
Your task is to generate realistic, convincing local business leads for a target industry and city.
Include realistic company names (sounds like real local businesses), specific realistic notes describing their current operations, phone friction, staff size, or bottlenecks, and realistic website domains.

Output STRICT JSON Array of exactly 10 lead objects with this schema:
[
  {
    "business_name": "Realistic Local Name",
    "business_type": "${industry}",
    "city": "${city}",
    "website": "https://example.com",
    "notes": "Realistic operational context and pain point description."
  }
]`;

  const prompt = `Generate 10 realistic, diverse business leads for:
Industry: ${industry}
City / Market: ${city}

Ensure each lead has:
- A believable, authentic business name
- Accurate business_type
- City: "${city}"
- A realistic website URL or empty string
- 1-2 sentences of realistic operational notes (e.g., number of staff, booking channels, phone bottlenecks, order volume)

Return strictly a JSON array with 10 objects.`;

  try {
    let rawText;
    try {
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-2.0-flash', prompt, systemInstruction, true);
    } catch (e) {
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-1.5-flash', prompt, systemInstruction, true);
    }

    const parsed = extractAndParseJSON(rawText);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.slice(0, 10).map((item, idx) => ({
        business_name: item.business_name || `${industry} Business #${idx + 1}`,
        business_type: item.business_type || industry,
        city: item.city || city,
        website: item.website || '',
        notes: item.notes || `Local business in ${city}`
      }));
    }
    return generateSampleLeadsOffline(industry, city);
  } catch (err) {
    console.error('[Gemini Auto-Generate Error]:', err.message || err);
    return generateSampleLeadsOffline(industry, city);
  }
}

/**
 * 4. AI CHAT ASSISTANT WITH RETRIEVAL-STYLE CONTEXT INJECTION
 * Injects current leads JSON into prompt to answer user questions
 */
export async function chatWithLeadsContextAI(message, history = [], currentLeads = [], apiKey) {
  const effectiveKey = apiKey || process.env.GEMINI_API_KEY;

  if (!effectiveKey) {
    return generateHeuristicChatResponse(message, currentLeads);
  }

  // Create compact lead summary for context injection
  const leadsSummary = currentLeads.map((l) => ({
    id: l.id,
    name: l.business_name,
    type: l.business_type,
    city: l.city,
    score: l.score ?? 'unscored',
    category: l.score_category ?? 'Unscored',
    status: l.status,
    service: l.score_details?.suggested_service || 'N/A',
    pain_points: l.score_details?.pain_points || [l.notes].filter(Boolean),
    notes: l.notes
  }));

  const systemInstruction = `You are the AI Sales Director & Lead Analyst for an agency.
You have immediate access to the user's active CRM database of leads provided in the context below.
Always refer to specific leads by name, reference their scores, pain points, cities, and statuses when answering.
Format your responses with clear markdown, bullet points, and bold text for readability.
If asked who to contact first: prioritize Hot leads (scores >= 75) that have status 'New' and clear high-ROI pain points.

CONTEXT OF CURRENT LEADS IN DATABASE (${currentLeads.length} leads total):
${JSON.stringify(leadsSummary, null, 2)}`;

  // Format conversation history
  const prompt = `Conversation history:
${history.map((h) => `${h.role === 'user' ? 'User' : 'Assistant'}: ${h.content}`).join('\n')}

User: ${message}
Assistant:`;

  try {
    let rawText;
    try {
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-2.0-flash', prompt, systemInstruction, false);
    } catch (e) {
      rawText = await callGeminiWithRetry(effectiveKey, 'gemini-1.5-flash', prompt, systemInstruction, false);
    }
    return rawText;
  } catch (err) {
    console.error('[Gemini Chat Error]:', err.message || err);
    return generateHeuristicChatResponse(message, currentLeads);
  }
}

// ---------------------------------------------------------------------------
// SMART OFFLINE HEURISTICS (Guarantees zero crashes even with no API key)
// ---------------------------------------------------------------------------

function generateHeuristicScore(lead) {
  const text = `${lead.business_name} ${lead.business_type} ${lead.notes || ''}`.toLowerCase();
  let score = 55;

  if (text.includes('clinic') || text.includes('dental') || text.includes('doctor') || text.includes('hospital')) score += 30;
  else if (text.includes('poultry') || text.includes('wholesale') || text.includes('supply') || text.includes('distributor')) score += 24;
  else if (text.includes('gym') || text.includes('fitness') || text.includes('salon') || text.includes('spa')) score += 26;
  else if (text.includes('carpentry') || text.includes('contractor') || text.includes('hvac') || text.includes('roofing')) score += 20;
  else if (text.includes('kiosk') || text.includes('street') || text.includes('corner')) score -= 25;

  if (text.includes('manual') || text.includes('phone') || text.includes('bottleneck') || text.includes('call')) score += 10;
  if (lead.website) score += 5;

  score = Math.min(96, Math.max(25, score));

  return {
    score,
    reason: `Evaluated high operational leverage in ${lead.business_type} with opportunity to automate intake and customer communication.`,
    pain_points: [
      `High volume of inbound calls causing staff distraction and lost leads`,
      `Lack of 24/7 automated booking and lead qualification on digital channels`,
      `Manual follow-ups resulting in estimated 15-20% dropped customer inquiries`
    ],
    suggested_service: `AI Conversational Assistant for ${lead.business_type} (WhatsApp & Web Booking)`
  };
}

function generateHeuristicOutreach(lead, tone = 'friendly') {
  const service = lead.score_details?.suggested_service || 'AI Customer Booking & Response Assistant';
  if (tone === 'friendly') {
    return {
      whatsapp: `Hi ${lead.business_name} team! 👋 Noticed your great work in ${lead.city}. Many ${lead.business_type} businesses lose 10+ hours a week fielding repetitive customer inquiries and calls. We built a custom WhatsApp concierge that automates bookings and replies instantly 24/7. Would you be open to a 2-minute video showing how it works?`,
      email: `Subject: Quick question about ${lead.business_name}'s customer inquiry workflow 🚀\n\nHi ${lead.business_name} Team,\n\nI came across your business in ${lead.city} and was really impressed with your services.\n\nWe recently built an automation for similar ${lead.business_type} businesses that eliminates manual phone bottlenecks and answers customer booking questions instantly via WhatsApp and web.\n\nOur clients typically see a 35% jump in booked appointments within 3 weeks.\n\nWould you be open to a quick 5-minute chat this Thursday to see if it makes sense for ${lead.business_name}?\n\nBest regards,\nAlex Vance\nGrowth Lead, Apex Automations`
    };
  } else {
    return {
      whatsapp: `Hello ${lead.business_name} management,\n\nWe implement enterprise conversational AI solutions tailored for ${lead.business_type} firms in ${lead.city}. Our systems automate appointment scheduling and lead triage to capture 100% of after-hours opportunities. May I share a 1-page overview of our implementation?`,
      email: `Subject: Enhancing operational efficiency and lead conversion for ${lead.business_name}\n\nDear Leadership Team,\n\nI am contacting you regarding workflow automation opportunities tailored for ${lead.business_type} operations in ${lead.city}.\n\nHigh-touch businesses frequently incur significant administrative costs managing incoming customer inquiries and appointment scheduling manually.\n\nOur solution, ${service}, operates 24/7 to pre-qualify leads, answer operational inquiries, and sync confirmed appointments directly to your management software.\n\nCould we schedule a brief 10-minute briefing on Thursday or Friday to review the projected ROI for ${lead.business_name}?\n\nSincerely,\nAlex Vance\nManaging Director, Apex Automations`
    };
  }
}

function generateSampleLeadsOffline(industry, city) {
  const templates = [
    { name: `Apex ${industry} Hub`, notes: `Established regional provider with 4 staff members. Receives 30+ daily booking calls.` },
    { name: `Premier ${industry} Specialists`, notes: `Growing commercial team. Inquiries arriving through website contact form and Instagram.` },
    { name: `Metro ${city} ${industry} Co.`, notes: `Family-owned operation with loyal client base. Currently using paper calendars.` },
    { name: `Horizon ${industry} Solutions`, notes: `High-end boutique firm. Spends 2 hours daily on customer quotes and confirmations.` },
    { name: `Summit ${industry} Partners`, notes: `Multi-location operation. Experiencing phone hold times during morning peak hours.` },
    { name: `Vanguard ${city} ${industry}`, notes: `Modern service shop with active social presence, but slow response to incoming DMs.` },
    { name: `Elite ${industry} Center`, notes: `High ticket services with 15-20% no-show cancellation rate on appointments.` },
    { name: `NextGen ${industry} Labs`, notes: `Rapidly scaling team seeking to automate repeat re-orders and client reminders.` },
    { name: `Central ${city} ${industry}`, notes: `Walk-in and call-in volume causing front desk backlog during business hours.` },
    { name: `Starlight ${industry} Group`, notes: `Long-standing market leader looking to modernize digital intake and WhatsApp support.` }
  ];

  return templates.map((t, idx) => ({
    business_name: t.name,
    business_type: industry,
    city: city,
    website: `https://${t.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
    notes: t.notes
  }));
}

function generateHeuristicChatResponse(message, leads) {
  const lower = message.toLowerCase();
  const hotLeads = leads.filter((l) => (l.score || 0) >= 75);
  const contacted = leads.filter((l) => l.status === 'Contacted' || l.status === 'Replied' || l.status === 'Converted');

  if (lower.includes('contact first') || lower.includes('priority') || lower.includes('start')) {
    if (hotLeads.length === 0) {
      return `You currently have **${leads.length} leads**, but none are yet scored as Hot (>=75). I recommend scoring your leads first using the **Score All** button!`;
    }
    const top3 = [...hotLeads].sort((a, b) => (b.score || 0) - (a.score || 0)).slice(0, 3);
    return `### 🎯 Recommended Priority Leads to Contact First:

${top3.map((lead, idx) => `**${idx + 1}. ${lead.business_name}** (${lead.business_type} • ${lead.city})
- **Score:** 🔥 **${lead.score}/100** (Hot)
- **Status:** \`${lead.status}\`
- **Why contact now:** ${lead.score_details?.reason || lead.notes || 'High automation ROI potential'}
- **Recommended Pitch:** *${lead.score_details?.suggested_service || 'WhatsApp Booking & Automation'}*
`).join('\n')}

💡 *Action Tip: Click "Generate Outreach" on these leads in the dashboard to copy a customized WhatsApp message or cold email with one click!*`;
  }

  if (lower.includes('pain') || lower.includes('common') || lower.includes('problem')) {
    return `### 🔍 Common Pain Points Across Your Current Leads:
1. **Manual Phone Scheduling & Bottlenecks:** Front desk staff spending 3-5 hours daily on calls rather than closing or servicing clients.
2. **High After-Hours Drop-Off:** Inbound inquiries arriving past 6 PM go unanswered, resulting in prospects booking with competitors.
3. **No-Shows & Cancellations:** Dental, health, and appointment-based businesses suffering 15-20% revenue leakage due to lack of automated SMS/WhatsApp reminders.
4. **Disorganized Order Intake:** Wholesale and distributor leads (like poultry/supply) taking repeat orders over unstructured text messages.`;
  }

  return `### 📊 Lead Pipeline Intelligence
- **Total Leads in Database:** ${leads.length}
- **Hot Leads (>=75 Score):** 🔥 ${hotLeads.length}
- **Outreach In-Progress:** 📨 ${contacted.length}
- **Conversion Opportunities:** High-ticket service providers (${leads.filter((l) => l.score_category === 'Hot').map((l) => l.business_name).slice(0, 3).join(', ')})

Ask me specific questions such as:
- *"Which leads should I contact first?"*
- *"What's the best service to pitch to Apex Dental?"*
- *"Summarize common pain points in Texas leads"*`;
}
