import type { RoundId } from './interview/rounds.js'

// Company-style interviews. Each company is modelled on its PUBLICLY REPORTED hiring process
// (candidate experiences and prep guides). We use company names only to describe whose process we simulate:
// no logos, no claim of partnership, and the AI never pretends to be a real employee.

export type Company = {
  id: string
  name: string
  monogram: string // shown in a neutral tile instead of the company's logo
  tint: 'sky' | 'lavender' | 'peach' | 'sage' | 'blush'
  type: 'service' | 'product'
  tagline: string
  hiring: string[] // the publicly reported stages, for display
  rounds: { id: RoundId; label: string; focus: string }[] // what our mock interview simulates, in order
  style: string // overall interviewer style
  lookFor: string // what the feedback should check against
  roles: string[] // role ids from catalog.ts
}

export const COMPANIES: Company[] = [
  {
    id: 'tcs', name: 'TCS', monogram: 'TCS', tint: 'sky', type: 'service',
    tagline: 'One panel interview: technical, managerial and HR together.',
    hiring: ['NQT online test (aptitude + coding)', 'Technical interview', 'Managerial interview', 'HR interview'],
    rounds: [
      { id: 'technical', label: 'Technical', focus: 'Core CS fundamentals (OOP, DBMS/SQL, one programming language), simple logic or coding questions, and questions about their final-year project.' },
      { id: 'behavioural', label: 'Managerial', focus: 'Situational questions: handling pressure and deadlines, working in a team, learning a new technology quickly, and how they would handle a difficult client or teammate.' },
      { id: 'hr', label: 'HR', focus: 'Introduce yourself, why TCS, willingness to relocate and work in shifts, comfort with the service agreement, and career goals.' },
    ],
    style: 'Large service-company campus hiring: friendly but thorough, checks fundamentals, clarity and flexibility rather than advanced algorithms.',
    lookFor: 'clear fundamentals, ability to explain their project, confident communication, and flexibility (relocation, shifts, learning new tech)',
    roles: ['sde', 'fullstack', 'backend', 'data_analyst', 'qa', 'devops'],
  },
  {
    id: 'infosys', name: 'Infosys', monogram: 'In', tint: 'lavender', type: 'service',
    tagline: 'Fundamentals, your projects, then a friendly HR round.',
    hiring: ['Online assessment (reasoning, maths, verbal, pseudocode)', 'Technical interview', 'HR interview'],
    rounds: [
      { id: 'technical', label: 'Technical', focus: 'Programming fundamentals in their main language, OOP concepts, DBMS and SQL queries, and one simple live-coding style question explained out loud.' },
      { id: 'project', label: 'Project discussion', focus: 'Their final-year or best project: what it does, their own role, the tech stack and why, and a problem they solved.' },
      { id: 'hr', label: 'HR', focus: 'Tell me about yourself, why Infosys, relocation and shift flexibility, awareness of the service agreement and training at Mysuru, and a simple behavioural question.' },
    ],
    style: 'Service-company campus hiring: checks basics and communication, polite and structured.',
    lookFor: 'solid basics (OOP, DBMS, SQL), a clearly explained project, and positive, flexible attitude',
    roles: ['sde', 'fullstack', 'backend', 'frontend', 'data_analyst', 'qa'],
  },
  {
    id: 'wipro', name: 'Wipro', monogram: 'W', tint: 'peach', type: 'service',
    tagline: 'Aptitude, essay and coding online, then technical and HR.',
    hiring: ['Online assessment (aptitude, essay writing, coding)', 'Technical interview', 'HR interview'],
    rounds: [
      { id: 'technical', label: 'Technical', focus: 'Basics of one programming language, OOP, DBMS, operating systems and simple coding logic explained verbally.' },
      { id: 'project', label: 'Project discussion', focus: 'Their academic project: purpose, their contribution, technologies and challenges.' },
      { id: 'hr', label: 'HR', focus: 'Self introduction, why Wipro, relocation and shifts, strengths and weaknesses, and long-term goals.' },
    ],
    style: 'Service-company campus hiring: fundamentals and communication over hard problem solving.',
    lookFor: 'clear fundamentals, honest and structured communication, and flexibility',
    roles: ['sde', 'fullstack', 'qa', 'devops', 'data_analyst', 'cybersecurity'],
  },
  {
    id: 'accenture', name: 'Accenture', monogram: 'Ac', tint: 'blush', type: 'service',
    tagline: 'A dedicated communication check before technical and HR.',
    hiring: ['Cognitive and technical assessment', 'Coding assessment', 'Communication assessment', 'Technical and HR interview'],
    rounds: [
      { id: 'technical', label: 'Technical', focus: 'Fundamentals for the role, cloud and agile basics, and their project, with practical "how would you" questions.' },
      { id: 'behavioural', label: 'Communication', focus: 'Communication skills: explain a technical idea simply to a non-technical client, describe a situation clearly, and summarise their experience in structured English.' },
      { id: 'hr', label: 'HR', focus: 'Why Accenture, teamwork, adaptability, relocation and shifts, and career goals.' },
    ],
    style: 'Consulting-style service company: values clear communication and client-facing confidence as much as technical basics.',
    lookFor: 'clear, structured English communication, client-friendly explanations, solid basics and adaptability',
    roles: ['sde', 'fullstack', 'data_analyst', 'devops', 'cybersecurity', 'qa'],
  },
  {
    id: 'cognizant', name: 'Cognizant', monogram: 'Co', tint: 'sage', type: 'service',
    tagline: 'Fundamentals and projects, then HR fit.',
    hiring: ['Online assessment (aptitude + coding)', 'Technical interview', 'HR interview'],
    rounds: [
      { id: 'technical', label: 'Technical', focus: 'Programming basics, OOP, SQL queries and joins, and simple problem solving explained out loud.' },
      { id: 'project', label: 'Project discussion', focus: 'Their project in depth: architecture, their part, and what they would improve.' },
      { id: 'hr', label: 'HR', focus: 'Introduction, why Cognizant, relocation and shifts, handling pressure, and goals.' },
    ],
    style: 'Service-company campus hiring: fundamentals, project clarity and attitude.',
    lookFor: 'solid basics, project ownership and a positive, flexible attitude',
    roles: ['sde', 'fullstack', 'data_analyst', 'qa', 'devops'],
  },
  {
    id: 'hcltech', name: 'HCLTech', monogram: 'HCL', tint: 'sky', type: 'service',
    tagline: 'Technical depth on your stack, then HR.',
    hiring: ['Online assessment', 'Technical interview', 'HR interview'],
    rounds: [
      { id: 'technical', label: 'Technical', focus: 'Fundamentals of their main skills, networking or cloud basics where relevant, and practical troubleshooting questions.' },
      { id: 'project', label: 'Project discussion', focus: 'Their project: design choices, their own work and challenges.' },
      { id: 'hr', label: 'HR', focus: 'Introduction, why HCLTech, flexibility, strengths and goals.' },
    ],
    style: 'Service-company hiring with a practical, infrastructure-aware technical round.',
    lookFor: 'practical understanding, clear explanations and flexibility',
    roles: ['sde', 'devops', 'cybersecurity', 'qa', 'fullstack'],
  },
  {
    id: 'capgemini', name: 'Capgemini', monogram: 'Cg', tint: 'lavender', type: 'service',
    tagline: 'Game-based and communication tests, then interviews.',
    hiring: ['Online assessment (pseudocode, English, game-based aptitude)', 'Behavioural / communication assessment', 'Technical and HR interview'],
    rounds: [
      { id: 'technical', label: 'Technical', focus: 'Programming fundamentals, OOP, DBMS, and their project explained clearly.' },
      { id: 'behavioural', label: 'Behavioural', focus: 'Teamwork, adaptability and learning: "tell me about a time" questions answered with clear structure.' },
      { id: 'hr', label: 'HR', focus: 'Why Capgemini, relocation, career goals and expectations.' },
    ],
    style: 'Service-company hiring that weighs communication and behaviour alongside basics.',
    lookFor: 'clear communication, structured behavioural answers and solid basics',
    roles: ['sde', 'fullstack', 'data_analyst', 'devops', 'qa'],
  },
  {
    id: 'zoho', name: 'Zoho', monogram: 'Z', tint: 'peach', type: 'product',
    tagline: 'Hands-on programming and a build-an-app round.',
    hiring: ['Written test (aptitude + C output prediction)', 'Basic programming round', 'Advanced / machine programming round (build a small app)', 'Technical HR', 'HR'],
    rounds: [
      { id: 'technical', label: 'Programming', focus: 'Logic and programming questions on arrays, strings, patterns and number problems: ask them to explain their approach step by step, edge cases and complexity.' },
      { id: 'project', label: 'App design (machine round)', focus: 'A machine-round style task such as designing a railway reservation, parking lot or inventory system: ask how they would structure classes and data, handle key features and edge cases, and keep code modular.' },
      { id: 'hr', label: 'Technical HR + HR', focus: 'Walk through their design choices, OOP and DBMS basics, why Zoho, and willingness to relocate to Chennai or other Zoho campuses.' },
    ],
    style: 'Product company that values hands-on coding ability and clean, modular design over degrees and marks.',
    lookFor: 'strong logic, clear step-by-step problem solving, modular design thinking and genuine interest in building products',
    roles: ['sde', 'fullstack', 'backend', 'frontend', 'mobile', 'qa'],
  },
  {
    id: 'amazon', name: 'Amazon', monogram: 'A', tint: 'peach', type: 'product',
    tagline: 'DSA and design, with Leadership Principles in every round.',
    hiring: ['Online assessment (coding + work-style survey)', 'Phone screen', '3 to 5 interviews: coding, design and behavioural', 'Bar Raiser'],
    rounds: [
      { id: 'technical', label: 'Data structures & algorithms', focus: 'A DSA problem (arrays, hashing, trees, graphs or dynamic programming): ask for their approach out loud, time and space complexity, and edge cases, then a follow-up variation.' },
      { id: 'project', label: 'Design & dive deep', focus: 'Dive deep into a project or system they built: design decisions, trade-offs, scaling, and what broke. For experienced candidates, a small system design question.' },
      { id: 'behavioural', label: 'Leadership Principles', focus: 'Amazon Leadership Principles stories (Customer Obsession, Ownership, Dive Deep, Bias for Action, Learn and Be Curious, Deliver Results). Expect STAR answers with data and their own actions.' },
      { id: 'hr', label: 'Bar Raiser', focus: 'A senior-style Bar Raiser conversation: mixes Leadership Principles with probing follow-ups about judgement, failures and long-term potential.' },
    ],
    style: 'Product company with a high bar: every round probes Leadership Principles, expects specifics, numbers and personal ownership ("I", not "we").',
    lookFor: 'Leadership Principles shown through specific STAR stories with measurable results, strong DSA reasoning with complexity analysis, and ownership',
    roles: ['sde', 'frontend', 'data_engineer', 'data_scientist', 'ai_engineer', 'devops'],
  },
  {
    id: 'microsoft', name: 'Microsoft', monogram: 'M', tint: 'sky', type: 'product',
    tagline: 'Coding, design and a growth-mindset conversation.',
    hiring: ['Online assessment', 'Technical interviews (coding + design)', 'Final "as appropriate" interview with a senior leader'],
    rounds: [
      { id: 'technical', label: 'Coding', focus: 'A DSA problem: clarify requirements, explain the approach, complexity and testing with examples.' },
      { id: 'project', label: 'Design', focus: 'Design discussion: object-oriented or small system design based on their experience, with trade-offs.' },
      { id: 'behavioural', label: 'Growth mindset', focus: 'Collaboration, learning from failure and growth mindset: how they learned something hard, handled feedback, or helped a teammate.' },
      { id: 'hr', label: 'As-appropriate', focus: 'A senior leader conversation: motivation for the role, impact they want to have, and judgement questions.' },
    ],
    style: 'Product company that values clear problem solving, testing your own code, collaboration and a growth mindset.',
    lookFor: 'clear problem decomposition, testing and edge cases, collaboration and a learn-it-all growth mindset',
    roles: ['sde', 'ai_engineer', 'data_scientist', 'data_engineer', 'devops', 'fullstack'],
  },
  {
    id: 'google', name: 'Google', monogram: 'G', tint: 'sage', type: 'product',
    tagline: 'Rising-difficulty coding plus a Googleyness round.',
    hiring: ['Recruiter screen', 'Technical phone screen', 'Onsite: 3 to 4 coding rounds + Googleyness & leadership', 'Hiring committee'],
    rounds: [
      { id: 'technical', label: 'Coding', focus: 'An algorithms problem of rising difficulty: discuss approaches, optimise, analyse complexity and handle edge cases, thinking out loud.' },
      { id: 'project', label: 'Role knowledge', focus: 'Role-related knowledge and design: how they would build or scale something from their own projects, with trade-offs.' },
      { id: 'behavioural', label: 'Googleyness & leadership', focus: 'Googleyness: intellectual humility, comfort with ambiguity, bias to action and collaboration; leading without authority.' },
    ],
    style: 'Product company focused on structured problem solving and how the candidate thinks, plus collaborative, humble behaviour.',
    lookFor: 'structured thinking out loud, optimisation and complexity analysis, comfort with ambiguity and collaborative humility',
    roles: ['sde', 'ai_engineer', 'data_scientist', 'data_engineer', 'devops', 'mobile'],
  },
  {
    id: 'flipkart', name: 'Flipkart', monogram: 'F', tint: 'blush', type: 'product',
    tagline: 'A signature machine-coding round, DSA and culture fit.',
    hiring: ['Online assessment (DSA + CS fundamentals)', 'Machine coding round', 'Technical interviews (DSA, low-level design)', 'Hiring manager / culture fit'],
    rounds: [
      { id: 'technical', label: 'DSA', focus: 'A DSA problem with follow-ups: approach, complexity and edge cases.' },
      { id: 'project', label: 'Machine coding & design', focus: 'Machine-coding style: design a small working system (e.g. a parking lot, splitwise or cab booking) with clean classes, extensibility and low-level design trade-offs.' },
      { id: 'behavioural', label: 'Culture fit', focus: 'Ownership, handling ambiguity and conflict, and what they built and learned.' },
    ],
    style: 'Product company that values working, extensible code and practical design as much as algorithms.',
    lookFor: 'clean, extensible design thinking, solid DSA reasoning and ownership',
    roles: ['sde', 'backend', 'frontend', 'data_engineer', 'data_scientist', 'mobile'],
  },
]

export const companyById = (id: string) => COMPANIES.find((c) => c.id === id)
export const companyIds = COMPANIES.map((c) => c.id) as [string, ...string[]]

// What the website shows (no interviewer instructions needed there).
export const publicCompanies = COMPANIES.map(({ style: _style, ...c }) => c)
