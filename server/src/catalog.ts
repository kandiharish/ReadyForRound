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
  // Core engineering roles for ECE, EEE and IT students
  {
    id: 'vlsi_design',
    label: 'VLSI Design Engineer',
    description: 'Designs the digital circuits inside chips: logic, RTL code and timing.',
    skills: ['Digital Electronics', 'Verilog', 'RTL Design', 'CMOS', 'Static Timing Analysis', 'Computer Architecture', 'Logic Synthesis', 'FPGA'],
    group: 'core',
    focus: 'digital electronics (logic gates, flip-flops, FSMs, counters), CMOS basics, Verilog/RTL coding, setup and hold time and static timing analysis, clock domain crossing, FPGA vs ASIC, and the ASIC design flow',
  },
  {
    id: 'vlsi_verification',
    label: 'VLSI Verification Engineer',
    description: 'Proves chip designs work before they are made, with testbenches and simulations.',
    skills: ['Digital Electronics', 'SystemVerilog', 'UVM', 'Verilog', 'Functional Verification', 'SystemVerilog Assertions', 'C++', 'Python'],
    group: 'core',
    focus: 'digital electronics, Verilog vs SystemVerilog, OOP in SystemVerilog (classes, randomisation, constraints), UVM components and phases, functional coverage, assertions, writing a testbench for a simple design (FIFO, counter, FSM)',
  },
  {
    id: 'embedded',
    label: 'Embedded Systems Engineer',
    description: 'Writes the software that runs inside devices: microcontrollers, sensors and firmware.',
    skills: ['Embedded C', 'Microcontrollers', 'RTOS', 'I2C', 'SPI Protocol', 'UART', 'Embedded Linux', 'Digital Electronics'],
    group: 'core',
    focus: 'Embedded C (pointers, bit manipulation, volatile, memory layout), microcontroller basics (GPIO, timers, interrupts, ADC), communication protocols (UART, SPI, I2C, CAN), RTOS concepts (tasks, scheduling, semaphores), and debugging hardware/firmware issues',
  },
  {
    id: 'electrical',
    label: 'Electrical Engineer (Power & Design)',
    description: 'Designs and maintains electrical systems: power distribution, machines and protection.',
    skills: ['Power Systems', 'Electrical Machines', 'Power Electronics', 'Electrical Design', 'Switchgear', 'AutoCAD Electrical', 'MATLAB', 'Electrical Safety'],
    group: 'core',
    focus: 'circuit theory (KVL/KCL, AC circuits, power factor), electrical machines (transformers, induction and DC motors), power systems (transmission, faults, protection relays), power electronics (rectifiers, inverters), electrical safety and earthing, and design calculations like cable sizing',
  },
  {
    id: 'network_engineer',
    label: 'Network Engineer',
    description: 'Builds and runs the networks that connect offices, data centres and the cloud.',
    skills: ['Computer Networks', 'TCP/IP', 'Routing and Switching', 'Subnetting', 'CCNA', 'Firewalls', 'Linux', 'Network Troubleshooting'],
    group: 'core',
    focus: 'the OSI and TCP/IP models, IP addressing and subnetting, switching and VLANs, routing (static, OSPF, BGP basics), DNS and DHCP, firewalls and VPNs, and step-by-step troubleshooting of connectivity problems',
  },
  {
    id: 'pcb_design',
    label: 'PCB / Hardware Design Engineer',
    description: 'Designs the circuit boards inside products, from schematic to a working board.',
    skills: ['PCB Design', 'Circuit Design', 'Analog Electronics', 'Altium Designer', 'Schematic Design', 'Signal Integrity', 'Microcontrollers', 'Oscilloscope'],
    group: 'core',
    focus: 'analog and digital circuit basics (resistors, capacitors, op-amps, transistors, power supplies), schematic to PCB flow, component selection, layout rules (grounding, decoupling, trace width, high-speed routing), signal integrity and EMI basics, and board bring-up and testing',
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
