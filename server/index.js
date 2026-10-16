import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  scoreLeadWithAI,
  generateOutreachWithAI,
  autoGenerateLeadsWithAI,
  chatWithLeadsContextAI
} from './gemini.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const isVercel = Boolean(process.env.VERCEL);
const BUNDLED_DATA_FILE = path.join(__dirname, 'data', 'leads.json');
const DATA_FILE = isVercel ? path.join('/tmp', 'leads.json') : BUNDLED_DATA_FILE;

// In-memory cache for ultra-fast response and serverless fallback
let inMemoryLeads = null;

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Helper: Read leads from disk or in-memory cache
function readLeads() {
  if (inMemoryLeads && inMemoryLeads.length > 0) {
    return inMemoryLeads;
  }

  try {
    if (fs.existsSync(DATA_FILE)) {
      const data = fs.readFileSync(DATA_FILE, 'utf8');
      inMemoryLeads = JSON.parse(data || '[]');
      return inMemoryLeads;
    }

    // If on Vercel and /tmp doesn't exist yet, seed from bundled file
    if (isVercel && fs.existsSync(BUNDLED_DATA_FILE)) {
      const bundledData = fs.readFileSync(BUNDLED_DATA_FILE, 'utf8');
      inMemoryLeads = JSON.parse(bundledData || '[]');
      try {
        fs.writeFileSync(DATA_FILE, JSON.stringify(inMemoryLeads, null, 2), 'utf8');
      } catch (e) {
        // Continue with memory cache
      }
      return inMemoryLeads;
    }

    return [];
  } catch (err) {
    console.error('Error reading leads:', err);
    return inMemoryLeads || [];
  }
}

// Helper: Write leads to disk and update memory cache
function writeLeads(leads) {
  inMemoryLeads = leads;
  try {
    fs.mkdirSync(path.dirname(DATA_FILE), { recursive: true });
    fs.writeFileSync(DATA_FILE, JSON.stringify(leads, null, 2), 'utf8');
    return true;
  } catch (err) {
    console.error('Error writing leads to disk (using memory cache):', err.message);
    return true;
  }
}

// Helper: derive score category
function getCategory(score) {
  if (score === null || score === undefined) return 'Unscored';
  if (score >= 75) return 'Hot';
  if (score >= 45) return 'Warm';
  return 'Cold';
}

// Extract API key from request header or environment
function getApiKey(req) {
  const headerKey = req.headers['x-gemini-key'];
  if (headerKey && typeof headerKey === 'string' && headerKey.trim().length > 5) {
    return headerKey.trim();
  }
  return process.env.GEMINI_API_KEY || '';
}

// ---------------- API ROUTES ----------------

// Health check
app.get('/api/health', (req, res) => {
  const leads = readLeads();
  const apiKey = getApiKey(req);
  res.json({
    status: 'ok',
    hasApiKey: Boolean(apiKey),
    totalLeads: leads.length,
    timestamp: new Date().toISOString()
  });
});

// GET all leads (with sorting and optional filters)
app.get('/api/leads', (req, res) => {
  try {
    let leads = readLeads();
    const { category, status, search, city, type } = req.query;

    if (category && category !== 'All') {
      leads = leads.filter((l) => (l.score_category || getCategory(l.score)) === category);
    }
    if (status && status !== 'All') {
      leads = leads.filter((l) => l.status === status);
    }
    if (city && city !== 'All') {
      leads = leads.filter((l) => l.city.toLowerCase().includes(city.toLowerCase()));
    }
    if (type && type !== 'All') {
      leads = leads.filter((l) => l.business_type.toLowerCase().includes(type.toLowerCase()));
    }
    if (search) {
      const q = search.toLowerCase();
      leads = leads.filter(
        (l) =>
          l.business_name.toLowerCase().includes(q) ||
          l.business_type.toLowerCase().includes(q) ||
          l.city.toLowerCase().includes(q) ||
          (l.notes && l.notes.toLowerCase().includes(q))
      );
    }

    // Default sort by score descending, then newest
    leads.sort((a, b) => {
      const scoreA = a.score ?? -1;
      const scoreB = b.score ?? -1;
      if (scoreB !== scoreA) return scoreB - scoreA;
      return new Date(b.created_at || 0) - new Date(a.created_at || 0);
    });

    res.json({ success: true, count: leads.length, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// GET stats summary
app.get('/api/stats', (req, res) => {
  try {
    const leads = readLeads();
    const total = leads.length;
    const hot = leads.filter((l) => (l.score || 0) >= 75).length;
    const warm = leads.filter((l) => (l.score || 0) >= 45 && (l.score || 0) < 75).length;
    const cold = leads.filter((l) => l.score !== null && l.score !== undefined && l.score < 45).length;
    const unscored = leads.filter((l) => l.score === null || l.score === undefined).length;

    const contacted = leads.filter((l) => ['Contacted', 'Replied', 'Converted'].includes(l.status)).length;
    const replied = leads.filter((l) => ['Replied', 'Converted'].includes(l.status)).length;
    const converted = leads.filter((l) => l.status === 'Converted').length;

    // Buckets for chart
    const buckets = [
      { range: '0-25', count: 0, label: 'Low (<25)' },
      { range: '26-50', count: 0, label: 'Cool (26-50)' },
      { range: '51-75', count: 0, label: 'Warm (51-75)' },
      { range: '76-100', count: 0, label: 'Hot (76-100)' }
    ];

    leads.forEach((l) => {
      if (typeof l.score === 'number') {
        if (l.score <= 25) buckets[0].count++;
        else if (l.score <= 50) buckets[1].count++;
        else if (l.score <= 75) buckets[2].count++;
        else buckets[3].count++;
      }
    });

    res.json({
      total,
      hot,
      warm,
      cold,
      unscored,
      contacted,
      replied,
      converted,
      conversionRate: total > 0 ? Math.round((converted / total) * 100) : 0,
      buckets
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST single lead
app.post('/api/leads', (req, res) => {
  try {
    const { business_name, business_type, city, website, notes } = req.body;
    if (!business_name || !business_type || !city) {
      return res.status(400).json({ success: false, error: 'Business name, type, and city are required' });
    }

    const leads = readLeads();
    const newLead = {
      id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      business_name: business_name.trim(),
      business_type: business_type.trim(),
      city: city.trim(),
      website: (website || '').trim(),
      notes: (notes || '').trim(),
      status: 'New',
      score: null,
      score_category: 'Unscored',
      score_details: null,
      outreach: {},
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    leads.unshift(newLead);
    writeLeads(leads);

    res.status(201).json({ success: true, lead: newLead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST bulk leads (e.g. from CSV)
app.post('/api/leads/bulk', (req, res) => {
  try {
    const { leads: incomingLeads } = req.body;
    if (!Array.isArray(incomingLeads) || incomingLeads.length === 0) {
      return res.status(400).json({ success: false, error: 'Expected non-empty array of leads' });
    }

    const currentLeads = readLeads();
    const addedLeads = [];

    for (const item of incomingLeads) {
      if (!item.business_name || !item.business_type) continue;
      const leadObj = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        business_name: String(item.business_name).trim(),
        business_type: String(item.business_type).trim(),
        city: String(item.city || 'Unknown').trim(),
        website: String(item.website || '').trim(),
        notes: String(item.notes || '').trim(),
        status: item.status || 'New',
        score: null,
        score_category: 'Unscored',
        score_details: null,
        outreach: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      addedLeads.push(leadObj);
    }

    const updated = [...addedLeads, ...currentLeads];
    writeLeads(updated);

    res.json({ success: true, count: addedLeads.length, leads: addedLeads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// PUT update lead (status, notes, etc.)
app.put('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    const leads = readLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(400).json({ success: false, error: 'Lead not found' });
    }

    const current = leads[index];
    const updated = {
      ...current,
      ...req.body,
      id: current.id, // prevent overwriting ID
      updated_at: new Date().toISOString()
    };

    if (updated.score !== undefined) {
      updated.score_category = getCategory(updated.score);
    }

    leads[index] = updated;
    writeLeads(leads);

    res.json({ success: true, lead: updated });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// DELETE single lead
app.delete('/api/leads/:id', (req, res) => {
  try {
    const { id } = req.params;
    let leads = readLeads();
    const beforeCount = leads.length;
    leads = leads.filter((l) => l.id !== id);

    if (leads.length === beforeCount) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    writeLeads(leads);
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST score single lead with AI
app.post('/api/leads/:id/score', async (req, res) => {
  try {
    const { id } = req.params;
    const leads = readLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const lead = leads[index];
    const apiKey = getApiKey(req);

    const scoreResult = await scoreLeadWithAI(lead, apiKey);
    lead.score = scoreResult.score;
    lead.score_category = getCategory(scoreResult.score);
    lead.score_details = scoreResult;
    lead.updated_at = new Date().toISOString();

    leads[index] = lead;
    writeLeads(leads);

    res.json({ success: true, lead });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST score all unscored leads
app.post('/api/leads/score-all', async (req, res) => {
  try {
    const leads = readLeads();
    const apiKey = getApiKey(req);
    const unscored = leads.filter((l) => l.score === null || l.score === undefined);

    if (unscored.length === 0) {
      return res.json({ success: true, message: 'All leads already scored', count: 0, leads });
    }

    let processedCount = 0;
    for (const lead of unscored) {
      try {
        const scoreResult = await scoreLeadWithAI(lead, apiKey);
        lead.score = scoreResult.score;
        lead.score_category = getCategory(scoreResult.score);
        lead.score_details = scoreResult;
        lead.updated_at = new Date().toISOString();
        processedCount++;
      } catch (err) {
        console.error(`Failed to score lead ${lead.id}:`, err);
      }
    }

    writeLeads(leads);
    res.json({ success: true, message: `Scored ${processedCount} leads`, count: processedCount, leads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST generate personalized outreach (WhatsApp + Cold Email)
app.post('/api/leads/:id/outreach', async (req, res) => {
  try {
    const { id } = req.params;
    const { tone = 'friendly' } = req.body;
    const leads = readLeads();
    const index = leads.findIndex((l) => l.id === id);
    if (index === -1) {
      return res.status(404).json({ success: false, error: 'Lead not found' });
    }

    const lead = leads[index];
    const apiKey = getApiKey(req);

    const outreachCopy = await generateOutreachWithAI(lead, tone, apiKey);
    if (!lead.outreach) lead.outreach = {};
    lead.outreach[tone] = outreachCopy;
    lead.updated_at = new Date().toISOString();

    leads[index] = lead;
    writeLeads(leads);

    res.json({ success: true, lead, outreach: outreachCopy });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST auto-generate 10 realistic leads
app.post('/api/leads/auto-generate', async (req, res) => {
  try {
    const { industry, city } = req.body;
    if (!industry || !city) {
      return res.status(400).json({ success: false, error: 'Industry and city are required' });
    }

    const apiKey = getApiKey(req);
    const generatedRaw = await autoGenerateLeadsWithAI(industry, city, apiKey);
    const currentLeads = readLeads();

    const newLeads = [];
    for (const item of generatedRaw) {
      const leadObj = {
        id: `lead_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        business_name: item.business_name,
        business_type: item.business_type || industry,
        city: item.city || city,
        website: item.website || '',
        notes: item.notes || `Generated lead for ${industry} in ${city}`,
        status: 'New',
        score: null,
        score_category: 'Unscored',
        score_details: null,
        outreach: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
      newLeads.push(leadObj);
    }

    const updated = [...newLeads, ...currentLeads];
    writeLeads(updated);

    res.json({ success: true, count: newLeads.length, leads: newLeads });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST chat with leads context
app.post('/api/chat', async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) {
      return res.status(400).json({ success: false, error: 'Message is required' });
    }

    const leads = readLeads();
    const apiKey = getApiKey(req);

    const reply = await chatWithLeadsContextAI(message, history, leads, apiKey);
    res.json({ success: true, reply });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// POST reset demo data
app.post('/api/leads/reset-demo', (req, res) => {
  try {
    const demoPath = path.join(__dirname, 'data', 'leads.json');
    // Read or restore 5 demo leads
    const initialDemoLeads = [
      {
        id: "lead_demo_1",
        business_name: "Apex Dental Studio",
        business_type: "Dental Clinic",
        city: "Austin, TX",
        website: "https://apexdentalstudio.com",
        notes: "Cosmetic & family dental practice with 4 operatories. Uses phone calls for reminder scheduling.",
        status: "New",
        score: 88,
        score_category: "Hot",
        score_details: {
          score: 88,
          reason: "High chair downtime cost ($800/hr) with 18% no-show rate. Extreme ROI for automated WhatsApp reminders.",
          pain_points: [
            "Front desk spends 15+ hours weekly playing phone tag for appointment confirmations",
            "18% Monday morning no-show rate causing $12k+ monthly chair revenue leak",
            "Zero after-hours emergency triage booking on website"
          ],
          suggested_service: "AI Patient Concierge (WhatsApp/SMS 24/7 Booking & No-Show Recovery)"
        },
        outreach: {
          friendly: {
            whatsapp: "Hi Dr. Carter! 👋 Saw Apex Dental's stellar reviews in Austin. We noticed many dental clinics lose 15+ hours a week playing phone tag with patient reminders. We built an automated AI WhatsApp concierge that recovers chair revenue and fills cancellations 24/7. Open to a 2-minute video demo?",
            email: "Subject: Reducing no-shows at Apex Dental Studio 🦷\n\nHi Dr. Carter,\n\nLove the patient-first approach at Apex Dental in Austin!\n\nDental clinics typically lose 15-20% of operator capacity due to manual scheduling friction. Our AI Patient Concierge automates appointment confirmations and fills cancellations over WhatsApp and SMS 24/7.\n\nClinics using this regularly recover $12k+ in monthly chair revenue.\n\nCould we connect for 7 minutes this Thursday?\n\nBest,\nAlex Vance\nApex Automations"
          }
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "lead_demo_2",
        business_name: "Lone Star Poultry & Farm Supply",
        business_type: "Poultry Farm & Distribution",
        city: "Waco, TX",
        website: "https://lonestarpoultry.com",
        notes: "Wholesale supplier of poultry feed, broilers, and agricultural equipment to 60+ regional farms.",
        status: "Contacted",
        score: 79,
        score_category: "Hot",
        score_details: {
          score: 79,
          reason: "High recurring wholesale orders over SMS/paper orders. Immediate operational savings through automated WhatsApp B2B ordering.",
          pain_points: [
            "Wholesale farm orders arriving as messy late-night text messages",
            "Manual paper invoice generation causing order fulfillment errors",
            "No structured inventory reorder alerts for high-volume accounts"
          ],
          suggested_service: "Automated WhatsApp B2B Order Desk & Inventory Reorder Assistant"
        },
        outreach: {
          professional: {
            whatsapp: "Hello Lone Star Poultry team,\n\nWe specialize in automating wholesale agricultural order intake. We deploy automated WhatsApp order desks that capture repeat feed and equipment orders 24/7 with zero human transcription errors. May I share a 1-page overview?",
            email: "Subject: Streamlining B2B wholesale orders for Lone Star Poultry\n\nDear Management,\n\nManaging bulk feed and equipment orders across dozens of regional accounts often causes administrative bottlenecks and order inaccuracies.\n\nOur WhatsApp B2B Order Desk automates catalog lookup, purchase order validation, and invoice generation 24/7.\n\nWould you be open to a 10-minute briefing on Thursday to discuss your order intake workflow?\n\nSincerely,\nAlex Vance\nApex Automations"
          }
        },
        created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "lead_demo_3",
        business_name: "IronForge Performance Gym",
        business_type: "Fitness Center & Crossfit",
        city: "Dallas, TX",
        website: "https://ironforgegym.example.com",
        notes: "CrossFit and athletic facility with 250 active members. High web traffic but slow follow-up on trial passes.",
        status: "Replied",
        score: 84,
        score_category: "Hot",
        score_details: {
          score: 84,
          reason: "High membership LTV. 65% of fitness trial leads drop off if not contacted within 5 minutes.",
          pain_points: [
            "Inbound trial pass requests sit unanswered for hours while trainers are on the floor",
            "High drop-off between trial bookings and paid memberships",
            "No automated re-engagement for members missing workouts"
          ],
          suggested_service: "Instant Speed-to-Lead AI Member Acquisition & Retention Bot"
        },
        outreach: {
          friendly: {
            whatsapp: "Hey Marcus! 💪 Loved seeing IronForge's community hype in Dallas. Quick question: when someone requests a trial pass on your site, how fast do they hear back? We built a 60-second speed-to-lead bot that books prospect gym tours instantly and doubles trial conversions. Worth a 2-min demo?",
            email: "Subject: Converting more IronForge trial passes into paid members 🏋️‍♂️\n\nHey Marcus,\n\nHuge fan of what you've built with IronForge in Dallas!\n\nFitness leads go cold rapidly—leads responded to in 5 minutes are 9x more likely to convert. Our AI Speed-to-Lead agent instantly texts incoming prospects, answers membership questions, and locks them into trainer calendars.\n\nWould you be open to a quick 5-minute call Thursday morning?\n\nCheers,\nAlex Vance\nApex Automations"
          }
        },
        created_at: new Date(Date.now() - 86400000 * 3).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "lead_demo_4",
        business_name: "Heritage Oak Custom Woodwork",
        business_type: "Custom Carpentry & Cabinetry",
        city: "Austin, TX",
        website: "https://heritageoakwoodwork.com",
        notes: "Bespoke cabinetry and architectural woodwork. Spends entire weekends drafting estimates.",
        status: "New",
        score: 62,
        score_category: "Warm",
        score_details: {
          score: 62,
          reason: "High ticket size ($10k+) but low inquiry frequency. High need for budget pre-qualification.",
          pain_points: [
            "Master carpenters wasting 10+ hours weekly on unbudgeted tire-kicker inquiries",
            "No standardized intake to collect dimensions and wood preferences",
            "Disorganized blueprint & photo sharing over fragmented email chains"
          ],
          suggested_service: "AI Project Intake & Budget Pre-Qualification Assistant"
        },
        outreach: {},
        created_at: new Date(Date.now() - 86400000 * 4).toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: "lead_demo_5",
        business_name: "Trattoria Bella Napoli",
        business_type: "Italian Restaurant & Catering",
        city: "Houston, TX",
        website: "",
        notes: "Busy trattoria. Missing high-margin private party catering requests during evening rush.",
        status: "Converted",
        score: 42,
        score_category: "Cold",
        score_details: {
          score: 42,
          reason: "Regular dining handled by reservations, but valuable private dining & catering inquiries drop during peak dinner hours.",
          pain_points: [
            "Unanswered phone during dinner service causing lost catering bookings",
            "No 24/7 catering deposit intake workflow",
            "Manual paper booking calendar for private dining room"
          ],
          suggested_service: "AI After-Hours Catering & Private Event Inquiry Desk"
        },
        outreach: {},
        created_at: new Date(Date.now() - 86400000 * 5).toISOString(),
        updated_at: new Date().toISOString()
      }
    ];

    writeLeads(initialDemoLeads);
    res.json({ success: true, message: 'Demo leads reset successfully', count: initialDemoLeads.length });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

if (!isVercel) {
  app.listen(PORT, () => {
    console.log(`[Lead Gen AI Server] running on http://localhost:${PORT}`);
    console.log(`[Gemini API] Key configured: ${Boolean(process.env.GEMINI_API_KEY)}`);
  });
}

export default app;
