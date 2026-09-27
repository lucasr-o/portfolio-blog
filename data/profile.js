export const site = {
  name: "Lucas Reis",
  legalName: "Lucas Reis de Oliveira da Silva",
  url: "https://lucas-reis.com",
  title: "Application Security Engineer",
  description:
    "Application Security Engineer focused on penetration testing, threat modeling, secure product development, and practical collaboration with engineering teams.",
};

export const profile = {
  name: site.legalName,
  shortName: site.name,
  role: site.title,
  location: "Santo André, SP",
  objective:
    "I am growing as a security engineer by going deeper into penetration testing, strengthening how security supports product delivery, and building toward technical leadership.",
  photo: "/lucas-reis-profile.jpeg",
  summary:
    "I work across security reviews, threat modeling, vulnerability management, and offensive testing to help teams turn security findings into product decisions they can act on.",
  contact: {
    email: "contato@lucas-reis.com",
    emailHref: "mailto:contato@lucas-reis.com",
    linkedIn: "https://www.linkedin.com/in/lucas-reis-o",
    github: "https://github.com/lucasr-o",
    x: "https://x.com/lucasreis_lk",
  },
};

const organizationLogos = {
  mercadoLivre: {
    src: "/brands/mercado-livre.png",
  },
  pagBank: {
    src: "/brands/pagbank.svg",
  },
  goAhead: {
    src: "/brands/go-ahead.png",
  },
  ufabc: {
    src: "/brands/ufabc.png",
  },
  greenTeam: {
    src: "/brands/green-team.png",
  },
  senai: {
    src: "/brands/senai.svg",
  },
};

export const experience = [
  {
    role: "Cybersecurity Engineer",
    organization: "Mercado Livre",
    location: "São Paulo, SP",
    start: "2026-09",
    end: null,
    period: "Sep 2026 — Present",
    logo: organizationLogos.mercadoLivre,
    highlights: [
      "Manage security risk for Point devices across product and engineering contexts.",
      "Lead security reviews and threat-modeling sessions for product changes.",
      "Coordinate vulnerability remediation with product and engineering teams.",
    ],
  },
  {
    role: "Application Security Engineer",
    organization: "PagBank",
    location: "São Paulo, SP",
    start: "2024-10",
    end: "2026-09",
    period: "Oct 2024 — Sep 2026",
    logo: organizationLogos.pagBank,
    highlights: [
      "Performed mobile, API, web, and GraphQL penetration tests guided by OWASP practices.",
      "Applied threat modeling, SAST, DAST, DevSecOps, and cloud-security techniques.",
      "Worked with a security team specialized in iOS and Android products.",
    ],
  },
  {
    role: "Cyber Security Trainee",
    organization: "Go Ahead IT",
    location: "São Paulo, SP",
    start: "2023-11",
    end: "2024-07",
    period: "Nov 2023 — Jul 2024",
    logo: organizationLogos.goAhead,
    highlights: [
      "Administered IBM QRadar SIEM and developed Python-based security playbooks.",
      "Applied MITRE ATT&CK knowledge and AWS fundamentals in operational security work.",
      "Built a broader business view through rotations across networks, data center, collaboration, contracts, and security.",
    ],
  },
  {
    role: "Scholarship Research (PDPD)",
    organization: "Federal University of ABC (UFABC)",
    location: "Santo André, SP",
    start: "2022-11",
    end: "2023-11",
    period: "Nov 2022 — Nov 2023",
    logo: organizationLogos.ufabc,
    highlights: [
      "Analyzed cryptographic blocks across algorithms and modes of operation.",
      "Implemented AES and TEA experiments in C using ECB, CTR, and CBC modes.",
    ],
  },
  {
    role: "Information Security Coordinator",
    organization: "Green Team Hacker Club — UFABC",
    location: "Santo André, SP",
    start: "2022-09",
    end: null,
    period: "Sep 2022 — Present",
    logo: organizationLogos.greenTeam,
    highlights: [
      "Coordinate the team and teach web hacking, cryptography, forensics, binary exploitation, and reverse engineering.",
      "Compete in capture-the-flag challenges and help new members build practical security skills.",
    ],
  },
];

export const education = [
  {
    credential: "Bachelor of Computer Science",
    institution: "Federal University of ABC",
    period: "Expected 2026",
    logo: organizationLogos.ufabc,
  },
  {
    credential: "Computer Networks Technician",
    institution: "SENAI-SP",
    period: "2019 — 2020",
    logo: organizationLogos.senai,
  },
];

export const credentials = [
  {
    name: "Certified in Cybersecurity",
    issuer: "ISC2",
    date: "Mar 2023",
  },
  {
    name: "Networking and cybersecurity learning paths",
    issuer: "Cisco",
    date: null,
    details:
      "CCNA, Junior Cybersecurity Analyst, Network Technician, Cloud Security, CyberOps, Introduction to Cybersecurity, and Learn-A-Thon 2020.",
  },
  {
    name: "B1 English Certificate",
    issuer: "University of Cambridge",
    date: "Dec 2019",
  },
];

export const terminalSteps = [
  {
    command: "nmap -sV --script http-title app.test",
    output: ["443/tcp  open  https  nginx 1.24.0", "|_http-title: Product Gateway"],
  },
  {
    command: 'sqlmap -u "https://app.test/item?id=1" --batch --level=1',
    output: ["[INFO] testing GET parameter 'id'", "[WARNING] parameter 'id' does not appear to be injectable"],
  },
  {
    command: "semgrep scan --config auto src/",
    output: ["Scanning 42 files with 1,248 Code rules", "Ran 1,248 rules on 42 files: 0 findings"],
  },
];
