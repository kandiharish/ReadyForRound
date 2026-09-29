// The fixed lists students choose from during onboarding.
// Kept on the server as the single source of truth: the frontend fetches it,
// and the backend uses it to reject values that aren't on the list.

export const ROLES = [
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
    id: 'data_analyst',
    label: 'Data Analyst',
    description: 'Finds useful answers in data using spreadsheets, SQL and charts.',
    skills: ['Excel', 'SQL', 'Python', 'Statistics', 'Power BI', 'Tableau', 'Pandas'],
  },
] as const

export const EXPERIENCE_LEVELS = [
  { id: '2nd_year', label: '2nd year student' },
  { id: '3rd_year', label: '3rd year student' },
  { id: 'final_year', label: 'Final year student' },
  { id: 'graduate', label: 'Graduate, looking for a job' },
  { id: 'working', label: 'Working, switching jobs' },
] as const

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
}

const ids = <T extends readonly { id: string }[]>(list: T) =>
  list.map((item) => item.id) as [T[number]['id'], ...T[number]['id'][]]

export const roleIds = ids(ROLES)
export const experienceIds = ids(EXPERIENCE_LEVELS)
export const companyTypeIds = ids(COMPANY_TYPES)
export const timelineIds = ids(PLACEMENT_TIMELINES)
