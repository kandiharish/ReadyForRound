import { COMPLETE_SEQUENCES, ROUNDS } from './interview/rounds.js'
import { publicCompanies } from './companies.js'

// The fixed lists students choose from during onboarding.
// Kept on the server as the single source of truth: the frontend fetches it,
// and the backend uses it to reject values that aren't on the list.

export const ROLES = [
  {
    id: 'sde',
    label: 'Software Development Engineer (SDE)',
    description: 'Solves problems with code: data structures, algorithms and clean, scalable software.',
    skills: ['DSA', 'Java', 'C++', 'Python', 'Object-Oriented Programming', 'System Design', 'SQL', 'Git'],
  },
  {
    id: 'frontend',
    label: 'Frontend Developer',
    description: 'Builds the parts of websites and apps that people see and click.',
    skills: ['HTML', 'CSS', 'JavaScript', 'TypeScript', 'React', 'Tailwind CSS', 'Git', 'REST APIs'],
  },
  {
    id: 'backend',
    label: 'Backend Developer',
    description: 'Builds servers, databases and APIs that power apps behind the scenes.',
    skills: ['Java', 'Python', 'Node.js', 'SQL', 'REST APIs', 'Spring Boot', 'Git', 'DSA'],
  },
  {
    id: 'fullstack',
    label: 'Full-Stack Developer',
    description: 'Works on both the visible frontend and the backend server.',
    skills: ['JavaScript', 'React', 'Node.js', 'SQL', 'MongoDB', 'REST APIs', 'Git', 'DSA'],
  },
  {
    id: 'fde',
    label: 'Forward Deployed Engineer (FDE)',
    description: 'Works directly with customers to build, integrate and deploy software that solves their real problems.',
    skills: ['Python', 'SQL', 'REST APIs', 'JavaScript', 'Amazon Web Services', 'Problem Solving', 'Communication', 'Git'],
  },
  {
    id: 'ai_engineer',
    label: 'AI / ML Engineer',
    description: 'Builds products with machine learning and large language models, from training to deployment.',
    skills: ['Python', 'Machine Learning', 'Deep Learning', 'PyTorch', 'Large Language Models', 'Retrieval-Augmented Generation', 'NumPy', 'MLOps'],
  },
  {
    id: 'data_scientist',
    label: 'Data Scientist',
    description: 'Uses statistics and machine learning to find insights and make predictions from data.',
    skills: ['Python', 'Statistics', 'Machine Learning', 'Pandas', 'SQL', 'Scikit-learn', 'Data Visualization', 'Probability'],
  },
  {
    id: 'data_engineer',
    label: 'Data Engineer',
    description: 'Builds the pipelines and warehouses that move and prepare data at scale.',
    skills: ['SQL', 'Python', 'Apache Spark', 'Apache Airflow', 'ETL', 'Data Warehousing', 'Apache Kafka', 'Amazon Web Services'],
  },
  {
    id: 'data_analyst',
    label: 'Data Analyst',
    description: 'Finds useful answers in data using spreadsheets, SQL and charts.',
    skills: ['Microsoft Excel', 'SQL', 'Python', 'Statistics', 'Power BI', 'Tableau', 'Pandas'],
  },
  {
    id: 'devops',
    label: 'DevOps / Cloud Engineer',
    description: 'Automates how software is built, deployed and kept running in the cloud.',
    skills: ['Linux', 'Docker', 'Kubernetes', 'Amazon Web Services', 'CI/CD', 'Terraform', 'Bash', 'Git'],
  },
  {
    id: 'mobile',
    label: 'Mobile App Developer',
    description: 'Builds Android and iOS apps people use every day.',
    skills: ['Kotlin', 'Swift', 'Flutter', 'React Native', 'Android Development', 'Firebase', 'REST APIs', 'Git'],
  },
  {
    id: 'qa',
    label: 'QA / Test Automation Engineer',
    description: 'Makes sure software works, by designing tests and automating them.',
    skills: ['Software Testing', 'Selenium', 'Java', 'Python', 'API Testing', 'Postman', 'SQL', 'Automation Testing'],
  },
  {
    id: 'cybersecurity',
    label: 'Cybersecurity Analyst',
    description: 'Protects systems and data by finding weaknesses and responding to threats.',
    skills: ['Network Security', 'Linux', 'Computer Networks', 'Ethical Hacking', 'Wireshark', 'OWASP Top 10', 'Python', 'Cryptography'],
  },
] as const

export const EXPERIENCE_LEVELS = [
  { id: '2nd_year', label: '2nd year student' },
  { id: '3rd_year', label: '3rd year student' },
  { id: 'final_year', label: 'Final year student' },
  { id: 'graduate', label: 'Graduate, looking for a job' },
  { id: 'working_1_2', label: 'Working, 1 to 2 years' },
  { id: 'working_3_5', label: 'Working, 3 to 5 years' },
  { id: 'working_5_plus', label: 'Working, 5+ years' },
] as const

// Placement timeline answers from onboarding become a target date on the student's goal.
export function timelineToTargetDate(timeline: string): string | null {
  const weeks = { lt_1_month: 3, '1_3_months': 8, '3_plus_months': 16 }[timeline]
  if (!weeks) return null
  return new Date(Date.now() + weeks * 7 * 86_400_000).toISOString().slice(0, 10)
}

export const COMPANY_TYPES = [
  { id: 'service', label: 'Service company', description: 'e.g. TCS, Infosys, Wipro. Mass hiring, fundamentals + HR.' },
  { id: 'product', label: 'Product company', description: 'e.g. Amazon, Flipkart. Deeper technical and problem-solving.' },
  { id: 'startup', label: 'Startup', description: 'Practical skills, projects, and learning fast.' },
  { id: 'any', label: 'Not decided', description: 'A balanced mix of everything.' },
] as const

export const PLACEMENT_TIMELINES = [
  { id: 'lt_1_month', label: 'In less than 1 month' },
  { id: '1_3_months', label: 'In 1 to 3 months' },
  { id: '3_plus_months', label: 'In more than 3 months' },
  { id: 'not_sure', label: "I'm not sure yet" },
] as const

export const catalog = {
  roles: ROLES,
  experienceLevels: EXPERIENCE_LEVELS,
  companyTypes: COMPANY_TYPES,
  placementTimelines: PLACEMENT_TIMELINES,
  rounds: ROUNDS.map(({ id, label, description }) => ({ id, label, description })),
  completeSequences: COMPLETE_SEQUENCES,
  companies: publicCompanies,
}

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((item) => item.id) as [T[number]['id'], ...T[number]['id'][]]

export const roleIds = ids(ROLES)
export const experienceIds = ids(EXPERIENCE_LEVELS)
export const companyTypeIds = ids(COMPANY_TYPES)
export const timelineIds = ids(PLACEMENT_TIMELINES)
