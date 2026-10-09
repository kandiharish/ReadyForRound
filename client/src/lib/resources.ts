// Learning resources: a hand-picked library of free, trusted places to learn each topic.
// The AI never writes links (it can invent ones that don't exist). Instead, report and roadmap topics are
// matched to this list, and every link here is checked by `npm run check-links` (server) before release.

export type ResourceKind = 'docs' | 'course' | 'practice' | 'article' | 'book'
export type Resource = { site: string; title: string; url: string; kind: ResourceKind }
type Entry = { name: string; match: RegExp; links: Resource[] }

const r = (site: string, title: string, url: string, kind: ResourceKind): Resource => ({ site, title, url, kind })

export const LIBRARY: Entry[] = [
  // ---------- Web and software ----------
  { name: 'JavaScript', match: /\b(java ?script|js\b|es6|closures?|promises?|async\/await|event loop|hoisting)/i, links: [
    r('javascript.info', 'The Modern JavaScript Tutorial', 'https://javascript.info/', 'course'),
    r('MDN', 'JavaScript Guide', 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide', 'docs'),
  ] },
  { name: 'TypeScript', match: /\btypescript\b/i, links: [
    r('typescriptlang.org', 'TypeScript Handbook', 'https://www.typescriptlang.org/docs/handbook/intro.html', 'docs'),
  ] },
  { name: 'React', match: /\breact(\.?js)?\b(?! native)|\bhooks?\b|use(State|Effect|Memo|Callback|Context)|\bjsx\b|virtual dom/i, links: [
    r('react.dev', 'Learn React (official)', 'https://react.dev/learn', 'docs'),
    r('react.dev', 'Thinking in React', 'https://react.dev/learn/thinking-in-react', 'article'),
  ] },
  { name: 'HTML', match: /\bhtml5?\b|semantic markup|accessibility|\ba11y\b/i, links: [
    r('MDN', 'HTML: structuring content', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content', 'course'),
    r('web.dev', 'Learn Accessibility', 'https://web.dev/learn/accessibility', 'course'),
  ] },
  { name: 'CSS', match: /\bcss\b|flexbox|css grid|responsive design|media quer|tailwind/i, links: [
    r('web.dev', 'Learn CSS', 'https://web.dev/learn/css', 'course'),
    r('Flexbox Froggy', 'Flexbox practice game', 'https://flexboxfroggy.com/', 'practice'),
  ] },
  { name: 'Web performance', match: /web performance|core web vitals|page speed|lazy[- ]loading|code[- ]splitting|bundl(e|ing|er)|webpack|\bvite\b|split ?chunks/i, links: [
    r('web.dev', 'Learn Performance', 'https://web.dev/learn/performance', 'course'),
  ] },
  { name: 'Node.js', match: /\bnode(\.?js)?\b|express(\.js)?\b/i, links: [
    r('nodejs.org', 'Learn Node.js (official)', 'https://nodejs.org/en/learn/getting-started/introduction-to-nodejs', 'docs'),
    r('MDN', 'Express tutorial', 'https://developer.mozilla.org/en-US/docs/Learn_web_development/Extensions/Server-side/Express_Nodejs', 'course'),
  ] },
  { name: 'REST APIs', match: /\brest(ful)?\b|\bapis?\b|http methods|status codes|endpoints?/i, links: [
    r('MDN', 'An overview of HTTP', 'https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/Overview', 'docs'),
  ] },
  { name: 'Java', match: /\bjava\b(?!script)|\bjvm\b|spring( boot)?\b/i, links: [
    r('dev.java', 'Learn Java (official)', 'https://dev.java/learn/', 'docs'),
    r('spring.io', 'Spring guides', 'https://spring.io/guides', 'docs'),
  ] },
  { name: 'Python', match: /\bpython\b/i, links: [
    r('python.org', 'The Python Tutorial', 'https://docs.python.org/3/tutorial/', 'docs'),
  ] },
  { name: 'C and C++', match: /^c$|\bc language|\bc\+\+|\bcpp\b|\bc programming|pointers?\b|memory management|\bstl\b/i, links: [
    r('learncpp.com', 'Learn C++', 'https://www.learncpp.com/', 'course'),
    r('cppreference', 'C and C++ reference', 'https://en.cppreference.com/w/', 'docs'),
  ] },
  { name: 'Data structures & algorithms', match: /\bdsa\b|data structures?|algorithms?|time complexity|space complexity|big[- ]?o\b|recursion|dynamic programming|linked lists?|binary (search|trees?)|graphs?\b|sorting|hash ?(maps?|tables?)/i, links: [
    r('NeetCode', 'DSA roadmap with practice problems', 'https://neetcode.io/roadmap', 'practice'),
    r('takeUforward', "Striver's A2Z DSA sheet", 'https://takeuforward.org/strivers-a2z-dsa-course/strivers-a2z-dsa-course-sheet-2', 'practice'),
  ] },
  { name: 'Object-oriented programming', match: /\boop\b|object[- ]oriented|inheritance|polymorphism|encapsulation|abstraction|solid principles|design patterns?/i, links: [
    r('refactoring.guru', 'Design patterns explained', 'https://refactoring.guru/design-patterns', 'article'),
  ] },
  { name: 'System design', match: /system design|scalab|load balanc|caching|microservices?|high[- ]level design/i, links: [
    r('GitHub', 'The System Design Primer', 'https://github.com/donnemartin/system-design-primer', 'book'),
  ] },
  { name: 'SQL & databases', match: /\bsql\b|\bjoins?\b|database|dbms|normali[sz]ation|indexing|transactions?|acid\b|postgres|mysql/i, links: [
    r('SQLBolt', 'Interactive SQL lessons', 'https://sqlbolt.com/', 'practice'),
    r('PostgreSQL', 'PostgreSQL tutorial (official)', 'https://www.postgresql.org/docs/current/tutorial.html', 'docs'),
  ] },
  { name: 'Git', match: /\bgit(hub)?\b|version control|branching|merge conflicts?/i, links: [
    r('git-scm.com', 'Pro Git (free book)', 'https://git-scm.com/book/en/v2', 'book'),
    r('Learn Git Branching', 'Interactive Git practice', 'https://learngitbranching.js.org/', 'practice'),
  ] },
  { name: 'Testing', match: /unit test|testing|\bjest\b|test cases?|selenium|playwright|cypress|automation testing|\bqa\b/i, links: [
    r('Playwright', 'Playwright docs', 'https://playwright.dev/docs/intro', 'docs'),
    r('Selenium', 'Selenium documentation', 'https://www.selenium.dev/documentation/', 'docs'),
  ] },
  { name: 'Mobile apps', match: /android|kotlin|\bios\b|swift(ui)?\b|flutter|react native/i, links: [
    r('Android Developers', 'Android courses (official)', 'https://developer.android.com/courses', 'course'),
    r('Flutter', 'Get started with Flutter', 'https://docs.flutter.dev/get-started', 'docs'),
  ] },

  // ---------- Cloud, DevOps, security ----------
  { name: 'Linux', match: /\blinux\b|\bbash\b|shell script|command line/i, links: [
    r('LinuxCommand.org', 'The Linux Command Line (free book)', 'https://linuxcommand.org/tlcl.php', 'book'),
  ] },
  { name: 'Docker & Kubernetes', match: /docker|containers?\b|kubernetes|\bk8s\b/i, links: [
    r('Docker', 'Docker: get started', 'https://docs.docker.com/get-started/', 'docs'),
    r('Kubernetes', 'Kubernetes basics tutorial', 'https://kubernetes.io/docs/tutorials/kubernetes-basics/', 'docs'),
  ] },
  { name: 'Cloud & CI/CD', match: /\baws\b|amazon web services|azure|\bgcp\b|cloud|ci\/cd|continuous integration|terraform|devops/i, links: [
    r('AWS', 'AWS Skill Builder (free courses)', 'https://skillbuilder.aws/', 'course'),
    r('GitHub Docs', 'GitHub Actions: understanding CI/CD', 'https://docs.github.com/en/actions/about-github-actions/understanding-github-actions', 'docs'),
  ] },
  { name: 'Web security', match: /security|owasp|xss|sql injection|csrf|authentication|authori[sz]ation|jwt|tokens?\b|cookies?|httponly|sessions?\b|cryptograph|encryption|hashing passwords/i, links: [
    r('PortSwigger', 'Web Security Academy (free labs)', 'https://portswigger.net/web-security', 'practice'),
    r('OWASP', 'OWASP Top 10', 'https://owasp.org/www-project-top-ten/', 'docs'),
  ] },

  // ---------- Data and AI ----------
  { name: 'Machine learning', match: /machine learning|\bml\b|regression|classification|overfitting|bias[- ]variance|gradient descent|scikit|model evaluation/i, links: [
    r('Google', 'Machine Learning Crash Course', 'https://developers.google.com/machine-learning/crash-course', 'course'),
    r('scikit-learn', 'scikit-learn user guide', 'https://scikit-learn.org/stable/user_guide.html', 'docs'),
  ] },
  { name: 'Deep learning', match: /deep learning|neural networks?|backpropagation|pytorch|tensorflow|cnn\b|transformer (models?|architecture)|attention mechanism/i, links: [
    r('fast.ai', 'Practical Deep Learning (free course)', 'https://course.fast.ai/', 'course'),
    r('PyTorch', 'PyTorch tutorials', 'https://docs.pytorch.org/tutorials/', 'docs'),
  ] },
  { name: 'LLMs & generative AI', match: /\bllms?\b|large language models?|generative ai|genai|prompt engineering|\brag\b|retrieval[- ]augmented|embeddings?|vector databases?|ai agents?/i, links: [
    r('Hugging Face', 'LLM course (free)', 'https://huggingface.co/learn/llm-course', 'course'),
  ] },
  { name: 'Statistics & probability', match: /statistic|probability|hypothesis test|p[- ]values?|distributions?\b|a\/b test/i, links: [
    r('Khan Academy', 'Statistics and probability', 'https://www.khanacademy.org/math/statistics-probability', 'course'),
  ] },
  { name: 'Data analysis with Python', match: /pandas|numpy|data cleaning|data analysis|data visuali[sz]ation|matplotlib|exploratory/i, links: [
    r('pandas', 'pandas getting-started tutorials', 'https://pandas.pydata.org/docs/getting_started/intro_tutorials/index.html', 'docs'),
    r('Kaggle Learn', 'Free micro-courses (Pandas, ML, SQL)', 'https://www.kaggle.com/learn', 'course'),
  ] },
  { name: 'Excel & BI tools', match: /excel|power bi|tableau|dashboards?|pivot tables?|business intelligence/i, links: [
    r('Microsoft Learn', 'Power BI training', 'https://learn.microsoft.com/en-us/training/powerplatform/power-bi', 'course'),
    r('Tableau', 'Free Tableau training videos', 'https://www.tableau.com/learn/training', 'course'),
  ] },
  { name: 'Data engineering', match: /\betl\b|data pipelines?|spark|pyspark|airflow|kafka|data warehous|snowflake|databricks/i, links: [
    r('Apache Spark', 'Spark quick start', 'https://spark.apache.org/docs/latest/quick-start.html', 'docs'),
    r('GitHub', 'Data Engineering Zoomcamp (free)', 'https://github.com/DataTalksClub/data-engineering-zoomcamp', 'course'),
  ] },

  // ---------- Electronics and VLSI ----------
  { name: 'Digital electronics', match: /digital (electronics|logic|design)|logic gates?|flip[- ]?flops?|latch(es)?\b|fsms?\b|finite state machines?|counters?\b|multiplexer|combinational|sequential (logic|circuits?)|karnaugh|k[- ]map/i, links: [
    r('Electronics Tutorials', 'Logic gates and sequential circuits', 'https://www.electronics-tutorials.ws/sequential/seq_1.html', 'article'),
    r('HDLBits', 'Practice digital logic in Verilog', 'https://hdlbits.01xz.net/wiki/Main_Page', 'practice'),
  ] },
  { name: 'Verilog & RTL', match: /verilog|\brtl\b|always[_ ]?(comb|ff|@)|blocking|non[- ]blocking|hdl\b|vhdl/i, links: [
    r('ChipVerify', 'Verilog tutorial', 'https://www.chipverify.com/tutorials/verilog', 'course'),
    r('HDLBits', 'Verilog practice problems', 'https://hdlbits.01xz.net/wiki/Main_Page', 'practice'),
  ] },
  { name: 'SystemVerilog & UVM', match: /systemverilog|\buvm\b|testbench|functional coverage|constraints?\b|randomi[sz]ation|assertions?|\bsva\b|verification/i, links: [
    r('ChipVerify', 'SystemVerilog tutorial', 'https://www.chipverify.com/tutorials/systemverilog', 'course'),
    r('ChipVerify', 'UVM tutorial', 'https://www.chipverify.com/tutorials/uvm', 'course'),
  ] },
  { name: 'Timing & CMOS', match: /setup (and|&) hold|static timing|\bsta\b|clock domain crossing|\bcdc\b|metastability|cmos|transistor level|mosfet|asic flow|synthesis|physical design/i, links: [
    r('ChipVerify', 'Digital design and timing concepts', 'https://www.chipverify.com/tutorials/verilog', 'article'),
    r('Electronics Tutorials', 'Transistors explained', 'https://www.electronics-tutorials.ws/transistor/tran_1.html', 'article'),
  ] },
  { name: 'Computer architecture', match: /computer architecture|pipelin|cache(s|\b)|memory hierarchy|instruction set|\brisc[- ]?v\b|\bisa\b/i, links: [
    r('Nand2Tetris', 'Build a computer from first principles', 'https://www.nand2tetris.org/', 'course'),
  ] },
  { name: 'Analog electronics', match: /analog|op[- ]?amps?|operational amplifier|transistors?|\bbjt\b|diodes?|rc circuits?|filters?\b|amplifiers?|adc|dac\b|power supply|voltage regulator/i, links: [
    r('Electronics Tutorials', 'Op-amp basics', 'https://www.electronics-tutorials.ws/opamp/opamp_1.html', 'article'),
    r('Khan Academy', 'Electrical engineering', 'https://www.khanacademy.org/science/electrical-engineering', 'course'),
  ] },
  { name: 'Embedded C & microcontrollers', match: /embedded|microcontrollers?|firmware|\bmcu\b|interrupts?|gpio|timers?\b|volatile|bit manipulation|arduino|stm32|esp32|8051|\barm\b cortex/i, links: [
    r('Arduino', 'Arduino learning hub', 'https://docs.arduino.cc/learn/', 'docs'),
    r('Interrupt (Memfault)', 'Embedded engineering articles', 'https://interrupt.memfault.com/', 'article'),
  ] },
  { name: 'Communication protocols', match: /\bi2c\b|\bspi\b|\buart\b|serial communication|\bcan\b bus|can protocol|communication protocols?/i, links: [
    r('SparkFun', 'I2C explained', 'https://learn.sparkfun.com/tutorials/i2c/all', 'article'),
    r('SparkFun', 'SPI explained', 'https://learn.sparkfun.com/tutorials/serial-peripheral-interface-spi/all', 'article'),
    r('SparkFun', 'Serial (UART) explained', 'https://learn.sparkfun.com/tutorials/serial-communication/all', 'article'),
  ] },
  { name: 'RTOS', match: /\brtos\b|freertos|real[- ]time operating|task scheduling/i, links: [
    r('FreeRTOS', 'FreeRTOS documentation', 'https://www.freertos.org/Documentation/00-Overview', 'docs'),
  ] },
  { name: 'PCB design', match: /\bpcb\b|schematic|layout|signal integrity|\bemi\b|\bemc\b|decoupling|grounding|altium|kicad|orcad/i, links: [
    r('KiCad', 'KiCad getting started', 'https://docs.kicad.org/', 'docs'),
    r('Altium', 'PCB design resources', 'https://resources.altium.com/', 'article'),
  ] },

  // General OS concepts come after RTOS, so embedded topics like "RTOS scheduling" match RTOS first
  { name: 'Operating systems', match: /operating systems?|\bos\b concepts|processes and threads|threads?\b|deadlocks?|scheduling|virtual memory|paging|semaphores?|mutex/i, links: [
    r('OSTEP', 'Operating Systems: Three Easy Pieces (free book)', 'https://pages.cs.wisc.edu/~remzi/OSTEP/', 'book'),
  ] },

  // ---------- Electrical and power ----------
  { name: 'Circuit theory', match: /\bkvl\b|\bkcl\b|kirchhoff|ohm'?s law|circuit theory|network theorems?|thevenin|norton|ac circuits?|power factor|phasors?/i, links: [
    r('Electronics Tutorials', 'DC circuit theory', 'https://www.electronics-tutorials.ws/dccircuits/dcp_1.html', 'article'),
    r('Khan Academy', 'Circuit analysis', 'https://www.khanacademy.org/science/electrical-engineering/ee-circuit-analysis-topic', 'course'),
  ] },
  { name: 'Electrical machines & power', match: /electrical machines?|transformers?\b|induction motors?|dc motors?|generators?|power systems?|transmission|faults?\b|protection relays?|switchgear|earthing|power electronics|rectifiers?|inverters?/i, links: [
    r('NPTEL', 'Free IIT courses on electrical engineering', 'https://nptel.ac.in/courses', 'course'),
    r('Electrical4U', 'Electrical engineering concepts', 'https://www.electrical4u.com/', 'article'),
  ] },

  // ---------- Networking ----------
  // (the more specific entry first: ties go to the earlier one)
  { name: 'Routing, switching & subnetting', match: /subnet|routing|switching|vlans?\b|ospf|bgp|ccna|routers?\b|switch(es)?\b|firewalls?|vpn/i, links: [
    r('Subnetting Practice', 'Subnetting practice questions', 'https://subnettingpractice.com/', 'practice'),
    r('Cisco NetAcad', 'Networking Basics (free)', 'https://www.netacad.com/courses/networking-basics', 'course'),
  ] },
  { name: 'Computer networks', match: /networks?\b|networking|osi model|tcp\/?ip|\btcp\b|\budp\b|dns\b|dhcp|http(s)?\b handshake|ip address/i, links: [
    r('Cisco NetAcad', 'Free networking courses', 'https://www.netacad.com/', 'course'),
    r('Cloudflare', 'Learning Center: how the internet works', 'https://www.cloudflare.com/learning/', 'article'),
  ] },

  // ---------- Interview skills ----------
  { name: 'Behavioural answers (STAR)', match: /\bstar\b|behaviou?ral|tell me about a time|situation.*task.*action|conflict|teamwork|leadership|ownership/i, links: [
    r('MIT CAPD', 'Using the STAR method', 'https://capd.mit.edu/resources/the-star-method-for-behavioral-interviews/', 'article'),
  ] },
  { name: 'Communication', match: /communicat|explain (clearly|simply)|structure (your|the) answer|filler words|speaking|presentation|confidence/i, links: [
    r('Toastmasters', 'Public speaking tips', 'https://www.toastmasters.org/resources/public-speaking-tips', 'article'),
  ] },
  { name: 'Resume & projects', match: /resume|\bcv\b|project (description|explanation)|quantif|impact metrics|achievements?/i, links: [
    r('Harvard OCS', 'Resume and cover letter guide', 'https://careerservices.fas.harvard.edu/resources/create-a-strong-resume/', 'article'),
  ] },
]

// Up to `limit` hand-picked resources for a topic (best match first), or none if nothing fits.
// The entry whose keywords appear most often in the topic wins (ties go to the earlier, more specific entry).
export function resourcesFor(topic: string, limit = 3): { name: string; links: Resource[] } | null {
  let best: Entry | null = null
  let bestScore = 0
  for (const e of LIBRARY) {
    const score = topic.match(new RegExp(e.match.source, 'gi'))?.length ?? 0
    if (score > bestScore) { best = e; bestScore = score }
  }
  return best ? { name: best.name, links: best.links.slice(0, limit) } : null
}

// A YouTube search for the topic: always works, never a dead link.
export const videoSearch = (topic: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(`${topic} explained`)}`

// Every distinct URL in the library (for the link checker)
export const ALL_URLS = [...new Set(LIBRARY.flatMap((e) => e.links.map((l) => l.url)))]
