export type FacultyRegistry = {
  name: string;
  nameKey: string;
  majors: string[];
  majorKeys: string[];
  interests: string[];
  logoExtension?: string;
};
export type UniversityRegistry = {
  name: string;
  nameKey: string;
  logoExtension?: string;
  faculties: Record<string, FacultyRegistry>;
};
const BLOB_BASE_PATH = "universities";
export const UNIVERSITIES: Record<string, UniversityRegistry> = {
  // 1. Київський політехнічний інститут
  "kpi.ua": {
    name: "КПІ ім. Ігоря Сікорського",
    nameKey: "university.kpi.name",
    faculties: {
      FIOT: {
        name: "Факультет інформатики та обчислювальної техніки",
        nameKey: "faculty.kpi.fiot.name",
        majors: [
          "Комп'ютерні науки",
          "Інженерія програмного забезпечення",
          "Кібербезпека",
        ],
        majorKeys: [
          "major.computer-science",
          "major.software-engineering",
          "major.cybersecurity",
        ],
        interests: [
          "tech",
          "programming",
          "it",
          "cybersecurity",
          "software engineering",
        ],
      },
      IASA: {
        name: "Навчально-науковий інститут прикладного системного аналізу",
        nameKey: "faculty.kpi.iasa.name",
        majors: ["Системний аналіз", "Комп'ютерні науки", "Штучний інтелект"],
        majorKeys: [
          "major.system-analysis",
          "major.computer-science",
          "major.artificial-intelligence",
        ],
        interests: ["tech", "programming", "it", "data science", "ai"],
      },
      FEL: {
        name: "Факультет електроніки",
        nameKey: "faculty.kpi.fel.name",
        majors: [
          "Електроніка",
          "Мікро- та наносистемна техніка",
          "Телекомунікації",
        ],
        majorKeys: [
          "major.electronics",
          "major.micro-nanosystems",
          "major.telecommunications",
        ],
        interests: ["tech", "programming", "it", "electronics", "hardware"],
      },
      FMM: {
        name: "Факультет менеджменту та маркетингу",
        nameKey: "faculty.kpi.fmm.name",
        majors: ["Менеджмент", "Економіка", "Маркетинг"],
        majorKeys: ["major.management", "major.economics", "major.marketing"],
        interests: [
          "business",
          "economics",
          "management",
          "marketing",
          "startups",
        ],
      },
    },
  },
  // 2. Львівський національний університет
  "lnu.edu.ua": {
    name: "ЛНУ ім. Івана Франка",
    nameKey: "university.lnu.name",
    logoExtension: "jpg",
    faculties: {
      Bio: {
        name: "Біологічний факультет",
        nameKey: "faculty.lnu.bio.name",
        majors: ["Біологія", "Екологія"],
        majorKeys: ["major.biology", "major.ecology"],
        interests: ["science", "research", "biology", "ecology", "genetics"],
      },
      Geo: {
        name: "Географічний факультет",
        nameKey: "faculty.lnu.geo.name",
        majors: ["Географія", "Туризм", "Науки про Землю"],
        majorKeys: ["major.geography", "major.tourism", "major.earth-sciences"],
        interests: [
          "science",
          "research",
          "geography",
          "tourism",
          "earth sciences",
        ],
      },
      Geology: {
        name: "Геологічний факультет",
        nameKey: "faculty.lnu.geology.name",
        majors: ["Геологія"],
        majorKeys: ["major.geology"],
        interests: ["science", "research", "geology", "earth sciences"],
      },
      Economics: {
        name: "Економічний факультет",
        nameKey: "faculty.lnu.economics.name",
        majors: ["Економіка", "Менеджмент", "Маркетинг", "Фінанси"],
        majorKeys: [
          "major.economics",
          "major.management",
          "major.marketing",
          "major.finance",
        ],
        interests: [
          "business",
          "economics",
          "management",
          "finance",
          "analytics",
        ],
      },
      Electronics: {
        name: "Факультет електроніки та комп'ютерних технологій",
        nameKey: "faculty.lnu.electronics.name",
        majors: [
          "Інженерія програмного забезпечення",
          "Комп'ютерні науки",
          "Мікро- та наносистемна техніка",
        ],
        majorKeys: [
          "major.software-engineering",
          "major.computer-science",
          "major.micro-nanosystems",
        ],
        interests: [
          "tech",
          "programming",
          "it",
          "electronics",
          "software engineering",
        ],
      },
      Journalism: {
        name: "Факультет журналістики",
        nameKey: "faculty.lnu.journalism.name",
        majors: ["Журналістика"],
        majorKeys: ["major.journalism"],
        interests: [
          "humanities",
          "research",
          "journalism",
          "media",
          "communications",
        ],
      },
      ForeignLangs: {
        name: "Факультет іноземних мов",
        nameKey: "faculty.lnu.foreign-langs.name",
        majors: ["Філологія (переклад)", "Прикладна лінгвістика"],
        majorKeys: ["major.philology-translation", "major.applied-linguistics"],
        interests: [
          "humanities",
          "research",
          "languages",
          "translation",
          "linguistics",
        ],
      },
      History: {
        name: "Історичний факультет",
        nameKey: "faculty.lnu.history.name",
        majors: ["Історія", "Археологія", "Соціологія"],
        majorKeys: ["major.history", "major.archeology", "major.sociology"],
        interests: [
          "humanities",
          "research",
          "history",
          "archeology",
          "culture",
        ],
      },
      CultureArts: {
        name: "Факультет культури і мистецтв",
        nameKey: "faculty.lnu.culture-arts.name",
        majors: [
          "Культурологія",
          "Хореографія",
          "Сценічне мистецтво",
          "Музичне мистецтво",
        ],
        majorKeys: [
          "major.cultural-studies",
          "major.choreography",
          "major.performing-arts",
          "major.music",
        ],
        interests: ["humanities", "research", "arts", "culture", "music"],
      },
      MechMath: {
        name: "Механіко-математичний факультет",
        nameKey: "faculty.lnu.mech-math.name",
        majors: ["Математика", "Статистика", "Середня освіта (Математика)"],
        majorKeys: [
          "major.mathematics",
          "major.statistics",
          "major.secondary-education-math",
        ],
        interests: [
          "science",
          "research",
          "mathematics",
          "statistics",
          "modeling",
        ],
      },
      IntRelations: {
        name: "Факультет міжнародних відносин",
        nameKey: "faculty.lnu.int-relations.name",
        majors: [
          "Міжнародні відносини",
          "Міжнародне право",
          "Міжнародна економіка",
        ],
        majorKeys: [
          "major.international-relations",
          "major.international-law",
          "major.international-economics",
        ],
        interests: [
          "humanities",
          "research",
          "international relations",
          "diplomacy",
          "politics",
        ],
      },
      Pedagogy: {
        name: "Факультет педагогічної освіти",
        nameKey: "faculty.lnu.pedagogy.name",
        majors: ["Початкова освіта", "Дошкільна освіта", "Спеціальна освіта"],
        majorKeys: [
          "major.primary-education",
          "major.preschool-education",
          "major.special-education",
        ],
        interests: [
          "humanities",
          "research",
          "education",
          "teaching",
          "pedagogy",
        ],
      },
      AMI: {
        name: "Факультет прикладної математики та інформатики",
        nameKey: "faculty.lnu.ami.name",
        majors: [
          "Прикладна математика",
          "Комп'ютерні науки",
          "Системний аналіз",
          "Кібербезпека",
        ],
        majorKeys: [
          "major.applied-mathematics",
          "major.computer-science",
          "major.system-analysis",
          "major.cybersecurity",
        ],
        interests: ["tech", "programming", "it", "ai", "data science"],
        logoExtension: "jpg",
      },
      FinancialManagement: {
        name: "Факультет управління фінансами та бізнесу",
        nameKey: "faculty.lnu.financial-management.name",
        majors: [
          "Фінанси, банківська справа та страхування",
          "Облік і оподаткування",
          "Публічне управління",
        ],
        majorKeys: [
          "major.finance-banking-insurance",
          "major.accounting-taxation",
          "major.public-administration",
        ],
        interests: [
          "business",
          "economics",
          "management",
          "finance",
          "banking",
        ],
      },
      Physics: {
        name: "Фізичний факультет",
        nameKey: "faculty.lnu.physics.name",
        majors: ["Фізика", "Астрономія", "Прикладна фізика"],
        majorKeys: [
          "major.physics",
          "major.astronomy",
          "major.applied-physics",
        ],
        interests: [
          "science",
          "research",
          "physics",
          "astronomy",
          "quantum mechanics",
        ],
      },
      Philology: {
        name: "Філологічний факультет",
        nameKey: "faculty.lnu.philology.name",
        majors: ["Українська мова та література", "Слов'янські мови"],
        majorKeys: [
          "major.ukrainian-language-literature",
          "major.slavic-languages",
        ],
        interests: [
          "humanities",
          "research",
          "philology",
          "literature",
          "linguistics",
        ],
      },
      Philosophy: {
        name: "Філософський факультет",
        nameKey: "faculty.lnu.philosophy.name",
        majors: ["Філософія", "Політологія", "Психологія", "Культурологія"],
        majorKeys: [
          "major.philosophy",
          "major.political-science",
          "major.psychology",
          "major.cultural-studies",
        ],
        interests: [
          "humanities",
          "research",
          "philosophy",
          "psychology",
          "politics",
        ],
      },
      Chemistry: {
        name: "Хімічний факультет",
        nameKey: "faculty.lnu.chemistry.name",
        majors: ["Хімія"],
        majorKeys: ["major.chemistry"],
        interests: [
          "science",
          "research",
          "chemistry",
          "lab work",
          "materials",
        ],
      },
      Law: {
        name: "Юридичний факультет",
        nameKey: "faculty.lnu.law.name",
        majors: ["Право"],
        majorKeys: ["major.law"],
        interests: ["law", "humanities", "legal", "human rights", "debate"],
      },
    },
  },
  // 3. Київський національний університет
  "knu.ua": {
    name: "КНУ ім. Тараса Шевченка",
    nameKey: "university.knu.name",
    faculties: {
      FIT: {
        name: "Факультет інформаційних технологій",
        nameKey: "faculty.knu.fit.name",
        majors: [
          "Інженерія програмного забезпечення",
          "Комп'ютерні науки",
          "Кібербезпека",
          "Телекомунікації",
        ],
        majorKeys: [
          "major.software-engineering",
          "major.computer-science",
          "major.cybersecurity",
          "major.telecommunications",
        ],
        interests: ["tech", "programming", "it", "cybersecurity", "networks"],
      },
      Cybernetics: {
        name: "Факультет комп'ютерних наук та кібернетики",
        nameKey: "faculty.knu.cybernetics.name",
        majors: ["Прикладна математика", "Інформаційні системи та технології"],
        majorKeys: ["major.applied-mathematics", "major.information-systems"],
        interests: ["tech", "programming", "it", "ai", "machine learning"],
      },
      Economics: {
        name: "Економічний факультет",
        nameKey: "faculty.knu.economics.name",
        majors: ["Економіка", "Облік і оподаткування", "Підприємництво"],
        majorKeys: [
          "major.economics",
          "major.accounting-taxation",
          "major.entrepreneurship",
        ],
        interests: [
          "business",
          "economics",
          "management",
          "finance",
          "entrepreneurship",
        ],
      },
    },
  },
  // 4. Львівська політехніка
  "lpnu.ua": {
    name: "Національний університет «Львівська політехніка»",
    nameKey: "university.lpnu.name",
    faculties: {
      IADU: {
        name: "Інститут адміністрування, державного управління та професійного розвитку",
        nameKey: "faculty.lpnu.iadu.name",
        majors: ["Публічне управління та адміністрування"],
        majorKeys: ["major.public-administration"],
        interests: [
          "business",
          "economics",
          "management",
          "public administration",
          "leadership",
        ],
      },
      IARD: {
        name: "Інститут архітектури та дизайну",
        nameKey: "faculty.lpnu.iard.name",
        majors: ["Архітектура та містобудування", "Дизайн"],
        majorKeys: ["major.architecture-urban-planning", "major.design"],
        interests: [
          "humanities",
          "research",
          "architecture",
          "design",
          "urban planning",
        ],
      },
      IBIB: {
        name: "Інститут будівництва, інфраструктури та безпеки життєдіяльності",
        nameKey: "faculty.lpnu.ibib.name",
        majors: ["Будівництво та цивільна інженерія", "Цивільна безпека"],
        majorKeys: ["major.civil-engineering", "major.civil-safety"],
        interests: [
          "tech",
          "it",
          "civil engineering",
          "infrastructure",
          "safety",
        ],
      },
      IGDG: {
        name: "Інститут геодезії",
        nameKey: "faculty.lpnu.igdg.name",
        majors: ["Геодезія та землеустрій", "Науки про Землю"],
        majorKeys: ["major.geodesy-land-management", "major.earth-sciences"],
        interests: [
          "science",
          "research",
          "geodesy",
          "mapping",
          "earth sciences",
        ],
      },
      IGSN: {
        name: "Інститут гуманітарних та соціальних наук",
        nameKey: "faculty.lpnu.igsn.name",
        majors: ["Соціологія", "Соціальна робота", "Міжнародні відносини"],
        majorKeys: [
          "major.sociology",
          "major.social-work",
          "major.international-relations",
        ],
        interests: [
          "humanities",
          "research",
          "social sciences",
          "sociology",
          "international relations",
        ],
      },
      INEM: {
        name: "Інститут економіки і менеджменту",
        nameKey: "faculty.lpnu.inem.name",
        majors: ["Економіка", "Менеджмент", "Маркетинг"],
        majorKeys: ["major.economics", "major.management", "major.marketing"],
        interests: [
          "business",
          "economics",
          "management",
          "marketing",
          "analytics",
        ],
      },
      IESK: {
        name: "Інститут енергетики та систем керування",
        nameKey: "faculty.lpnu.iesk.name",
        majors: ["Електроенергетика", "Теплоенергетика"],
        majorKeys: [
          "major.electrical-power-engineering",
          "major.thermal-power-engineering",
        ],
        interests: [
          "tech",
          "it",
          "energy",
          "power engineering",
          "control systems",
        ],
      },
      IKTE: {
        name: "Інститут інформаційно-комунікаційних технологій та електронної інженерії",
        nameKey: "faculty.lpnu.ikte.name",
        majors: [
          "Телекомунікації",
          "Електроніка",
          "Мікро- та наносистемна техніка",
        ],
        majorKeys: [
          "major.telecommunications",
          "major.electronics",
          "major.micro-nanosystems",
        ],
        interests: [
          "tech",
          "programming",
          "it",
          "telecommunications",
          "electronics",
        ],
      },
      IKNI: {
        name: "Інститут комп'ютерних наук та інформаційних технологій",
        nameKey: "faculty.lpnu.ikni.name",
        majors: [
          "Комп'ютерні науки",
          "Інформаційні системи та технології",
          "Системний аналіз",
        ],
        majorKeys: [
          "major.computer-science",
          "major.information-systems",
          "major.system-analysis",
        ],
        interests: ["tech", "programming", "it", "data science", "ai"],
      },
      IKTA: {
        name: "Інститут комп'ютерних технологій, автоматики та метрології",
        nameKey: "faculty.lpnu.ikta.name",
        majors: [
          "Кібербезпека",
          "Автоматизація та комп'ютерно-інтегровані технології",
          "Метрологія",
        ],
        majorKeys: [
          "major.cybersecurity",
          "major.automation-computer-integrated",
          "major.metrology",
        ],
        interests: ["tech", "programming", "it", "cybersecurity", "automation"],
      },
      IMIT: {
        name: "Інститут механічної інженерії та транспорту",
        nameKey: "faculty.lpnu.imit.name",
        majors: [
          "Галузеве машинобудування",
          "Транспортні технології",
          "Автомобільний транспорт",
        ],
        majorKeys: [
          "major.mechanical-engineering",
          "major.transport-technologies",
          "major.automotive-transport",
        ],
        interests: [
          "tech",
          "it",
          "mechanical engineering",
          "transport",
          "automotive",
        ],
      },
      IPMT: {
        name: "Інститут поліграфії та медійних технологій",
        nameKey: "faculty.lpnu.ipmt.name",
        majors: ["Видавництво та поліграфія", "Журналістика"],
        majorKeys: ["major.publishing-printing", "major.journalism"],
        interests: [
          "humanities",
          "research",
          "publishing",
          "media",
          "journalism",
        ],
      },
      IPPT: {
        name: "Інститут просторового планування та перспективних технологій",
        nameKey: "faculty.lpnu.ippt.name",
        majors: ["Комп'ютерні науки", "Економіка", "Геодезія"],
        majorKeys: [
          "major.computer-science",
          "major.economics",
          "major.geodesy",
        ],
        interests: [
          "tech",
          "it",
          "spatial planning",
          "technology",
          "development",
        ],
      },
      IPPO: {
        name: "Інститут права, психології та інноваційної освіти",
        nameKey: "faculty.lpnu.ippo.name",
        majors: ["Право", "Психологія", "Журналістика"],
        majorKeys: ["major.law", "major.psychology", "major.journalism"],
        interests: ["law", "humanities", "psychology", "education", "legal"],
      },
      IMFN: {
        name: "Інститут прикладної математики та фундаментальних наук",
        nameKey: "faculty.lpnu.imfn.name",
        majors: ["Прикладна математика", "Прикладна фізика", "Математика"],
        majorKeys: [
          "major.applied-mathematics",
          "major.applied-physics",
          "major.mathematics",
        ],
        interests: [
          "science",
          "research",
          "mathematics",
          "physics",
          "fundamental sciences",
        ],
      },
      ISTR: {
        name: "Інститут сталого розвитку імені В'ячеслава Чорновола",
        nameKey: "faculty.lpnu.istr.name",
        majors: [
          "Екологія",
          "Туризм",
          "Технології захисту навколишнього середовища",
        ],
        majorKeys: [
          "major.ecology",
          "major.tourism",
          "major.environmental-protection",
        ],
        interests: [
          "science",
          "research",
          "sustainable development",
          "ecology",
          "tourism",
        ],
      },
      IHHT: {
        name: "Інститут хімії та хімічних технологій",
        nameKey: "faculty.lpnu.ihht.name",
        majors: [
          "Хімічні технології та інженерія",
          "Харчові технології",
          "Фармація",
        ],
        majorKeys: [
          "major.chemical-engineering",
          "major.food-technology",
          "major.pharmacy",
        ],
        interests: [
          "science",
          "research",
          "chemistry",
          "chemical engineering",
          "pharmacy",
        ],
      },
      MIOK: {
        name: "Міжнародний інститут освіти, культури та зв'язків з діаспорою",
        nameKey: "faculty.lpnu.miok.name",
        majors: ["Освітні та культурні програми"],
        majorKeys: ["major.educational-cultural-programs"],
        interests: [
          "humanities",
          "research",
          "education",
          "culture",
          "diaspora",
        ],
      },
    },
  },
  // 5. Києво-Могилянська академія
  "ukma.edu.ua": {
    name: "Національний університет «Києво-Могилянська академія»",
    nameKey: "university.ukma.name",
    faculties: {
      FI: {
        name: "Факультет інформатики",
        nameKey: "faculty.ukma.fi.name",
        majors: ["Інженерія програмного забезпечення", "Комп'ютерні науки"],
        majorKeys: ["major.software-engineering", "major.computer-science"],
        interests: ["tech", "programming", "it", "software engineering", "ai"],
      },
      FEN: {
        name: "Факультет економічних наук",
        nameKey: "faculty.ukma.fen.name",
        majors: ["Економіка", "Маркетинг", "Фінанси"],
        majorKeys: ["major.economics", "major.marketing", "major.finance"],
        interests: [
          "business",
          "economics",
          "management",
          "marketing",
          "startups",
        ],
      },
      FSP: {
        name: "Факультет правничих наук",
        nameKey: "faculty.ukma.fsp.name",
        majors: ["Право"],
        majorKeys: ["major.law"],
        interests: ["law", "humanities", "legal", "debate", "human rights"],
      },
    },
  },
  // 6. Український католицький університет
  "ucu.edu.ua": {
    name: "Український католицький університет",
    nameKey: "university.ucu.name",
    faculties: {
      Theology: {
        name: "Богословсько-філософський факультет",
        nameKey: "faculty.ucu.theology.name",
        majors: ["Богослов'я", "Філософія"],
        majorKeys: ["major.theology", "major.philosophy"],
        interests: [
          "humanities",
          "research",
          "theology",
          "philosophy",
          "ethics",
        ],
      },
      Humanities: {
        name: "Гуманітарний факультет",
        nameKey: "faculty.ucu.humanities.name",
        majors: ["Історія", "Філологія", "Культурологія"],
        majorKeys: [
          "major.history",
          "major.philology",
          "major.cultural-studies",
        ],
        interests: [
          "humanities",
          "research",
          "history",
          "linguistics",
          "culture",
        ],
      },
      HealthSciences: {
        name: "Факультет наук про здоров'я",
        nameKey: "faculty.ucu.health-sciences.name",
        majors: ["Клінічна психологія", "Фізична терапія та ерготерапія"],
        majorKeys: ["major.clinical-psychology", "major.physical-therapy"],
        interests: [
          "science",
          "research",
          "health sciences",
          "psychology",
          "healthcare",
        ],
      },
      SocialSciences: {
        name: "Факультет суспільних наук",
        nameKey: "faculty.ucu.social-sciences.name",
        majors: ["Соціологія", "Соціальна робота", "Політологія"],
        majorKeys: [
          "major.sociology",
          "major.social-work",
          "major.political-science",
        ],
        interests: [
          "humanities",
          "research",
          "social sciences",
          "sociology",
          "politics",
        ],
      },
      AppliedSciences: {
        name: "Факультет прикладних наук",
        nameKey: "faculty.ucu.applied-sciences.name",
        majors: [
          "Комп'ютерні науки",
          "ІТ та бізнес-аналітика",
          "Наука про дані",
        ],
        majorKeys: [
          "major.computer-science",
          "major.it-business-analytics",
          "major.data-science",
        ],
        interests: ["tech", "programming", "it", "data science", "ai"],
      },
      Law: {
        name: "Правничий факультет",
        nameKey: "faculty.ucu.law.name",
        majors: ["Право"],
        majorKeys: ["major.law"],
        interests: [
          "law",
          "humanities",
          "legal",
          "human rights",
          "jurisprudence",
        ],
      },
      BusinessSchool: {
        name: "Бізнес-школа УКУ",
        nameKey: "faculty.ucu.business-school.name",
        majors: ["Менеджмент", "Бізнес-адміністрування", "Інновації"],
        majorKeys: [
          "major.management",
          "major.business-administration",
          "major.innovations",
        ],
        interests: [
          "business",
          "economics",
          "management",
          "entrepreneurship",
          "startups",
        ],
      },
    },
  },
  // 7. ХНУ ім. Каразіна
  "karazin.ua": {
    name: "ХНУ ім. В. Н. Каразіна",
    nameKey: "university.karazin.name",
    faculties: {
      CS: {
        name: "Факультет комп'ютерних наук",
        nameKey: "faculty.karazin.cs.name",
        majors: ["Комп'ютерні науки", "Кібербезпека", "Комп'ютерна інженерія"],
        majorKeys: [
          "major.computer-science",
          "major.cybersecurity",
          "major.computer-engineering",
        ],
        interests: ["tech", "programming", "it", "cybersecurity", "algorithms"],
      },
      Physics: {
        name: "Фізичний факультет",
        nameKey: "faculty.karazin.physics.name",
        majors: ["Фізика", "Астрономія", "Прикладна фізика"],
        majorKeys: [
          "major.physics",
          "major.astronomy",
          "major.applied-physics",
        ],
        interests: [
          "science",
          "research",
          "physics",
          "astronomy",
          "quantum mechanics",
        ],
      },
      Econ: {
        name: "Економічний факультет",
        nameKey: "faculty.karazin.econ.name",
        majors: ["Економіка", "Міжнародні економічні відносини", "Фінанси"],
        majorKeys: [
          "major.economics",
          "major.international-economic-relations",
          "major.finance",
        ],
        interests: [
          "business",
          "economics",
          "management",
          "finance",
          "international relations",
        ],
      },
    },
  },
  // 8. НТУ ХПІ
  "kpi.kharkov.ua": {
    name: "НТУ «Харківський політехнічний інститут»",
    nameKey: "university.khpi.name",
    faculties: {
      KNTE: {
        name: "Навчально-науковий інститут комп'ютерних наук",
        nameKey: "faculty.khpi.knte.name",
        majors: ["Комп'ютерні науки", "Інформаційні системи та технології"],
        majorKeys: ["major.computer-science", "major.information-systems"],
        interests: ["tech", "programming", "it", "web development", "ai"],
      },
      Mech: {
        name: "Навчально-науковий інститут механічної інженерії",
        nameKey: "faculty.khpi.mech.name",
        majors: [
          "Прикладна механіка",
          "Матеріалознавство",
          "Галузеве машинобудування",
        ],
        majorKeys: [
          "major.applied-mechanics",
          "major.materials-science",
          "major.mechanical-engineering",
        ],
        interests: [
          "tech",
          "it",
          "mechanical engineering",
          "manufacturing",
          "materials",
        ],
      },
    },
  },
  // 9. СумДУ
  "sumdu.edu.ua": {
    name: "Сумський державний університет",
    nameKey: "university.sumdu.name",
    faculties: {
      ELIT: {
        name: "Факультет електроніки та інформаційних технологій",
        nameKey: "faculty.sumdu.elit.name",
        majors: [
          "Комп'ютерні науки",
          "Кібербезпека",
          "Електроніка",
          "Прикладна математика",
        ],
        majorKeys: [
          "major.computer-science",
          "major.cybersecurity",
          "major.electronics",
          "major.applied-mathematics",
        ],
        interests: [
          "tech",
          "programming",
          "it",
          "cybersecurity",
          "electronics",
        ],
      },
      BiEM: {
        name: "Навчально-науковий інститут бізнесу, економіки та менеджменту",
        nameKey: "faculty.sumdu.biem.name",
        majors: [
          "Економіка",
          "Менеджмент",
          "Маркетинг",
          "Міжнародні економічні відносини",
        ],
        majorKeys: [
          "major.economics",
          "major.management",
          "major.marketing",
          "major.international-economic-relations",
        ],
        interests: [
          "business",
          "economics",
          "management",
          "marketing",
          "finance",
        ],
      },
      Med: {
        name: "Медичний інститут",
        nameKey: "faculty.sumdu.med.name",
        majors: ["Медицина", "Стоматологія", "Фізична терапія"],
        majorKeys: [
          "major.medicine",
          "major.dentistry",
          "major.physical-therapy",
        ],
        interests: ["science", "research", "medicine", "healthcare", "biology"],
      },
    },
  },
};
// Helper functions
export function getUniversityByDomain(
  email: string,
): UniversityRegistry | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  // Check exact match first
  if (UNIVERSITIES[domain]) {
    return UNIVERSITIES[domain];
  }
  // Check if domain ends with any university domain (for subdomains like student.kpi.ua)
  for (const [uniDomain, university] of Object.entries(UNIVERSITIES)) {
    if (domain.endsWith(uniDomain)) {
      return university;
    }
  }
  return null;
}
export function getUniversityDomain(email: string): string | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  if (UNIVERSITIES[domain]) {
    return domain;
  }
  for (const uniDomain of Object.keys(UNIVERSITIES)) {
    if (domain.endsWith(uniDomain)) {
      return uniDomain;
    }
  }
  return null;
}
export function isStudentEmail(email: string): boolean | null {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return null;
  // Known student subdomains
  return true;
}
export function getFacultyByCode(
  universityDomain: string,
  facultyCode: string,
): FacultyRegistry | null {
  const university = UNIVERSITIES[universityDomain];
  if (!university) return null;
  return university.faculties[facultyCode] || null;
}
export function getAllUniversities(): Array<{
  domain: string;
  university: UniversityRegistry;
}> {
  return Object.entries(UNIVERSITIES).map(([domain, university]) => ({
    domain,
    university,
  }));
}
export function getAllFaculties(
  universityDomain: string,
): Array<{ code: string; faculty: FacultyRegistry }> {
  const university = UNIVERSITIES[universityDomain];
  if (!university) return [];
  return Object.entries(university.faculties).map(([code, faculty]) => ({
    code,
    faculty,
  }));
}

export function getUniversityLogoBasePath(universityDomain: string): string {
  const uni = UNIVERSITIES[universityDomain];
  if (!uni) return "";
  return `${BLOB_BASE_PATH}/${universityDomain}/logo`;
}

export function getFacultyLogoBasePath(
  universityDomain: string,
  facultyCode: string,
): string {
  const faculty = getFacultyByCode(universityDomain, facultyCode);
  if (!faculty) return "";
  return `${BLOB_BASE_PATH}/${universityDomain}/${facultyCode}/logo`;
}

// Major abbreviations mapping
const MAJOR_ABBREVIATIONS: Record<string, string> = {
  "major.computer-science": "CS",
  "major.software-engineering": "SE",
  "major.cybersecurity": "CB",
  "major.system-analysis": "SA",
  "major.artificial-intelligence": "AI",
  "major.electronics": "EL",
  "major.micro-nanosystems": "MN",
  "major.telecommunications": "TC",
  "major.management": "MG",
  "major.economics": "E",
  "major.marketing": "MK",
  "major.finance": "FN",
  "major.biology": "BI",
  "major.ecology": "EC",
  "major.geography": "GE",
  "major.tourism": "TR",
  "major.earth-sciences": "ES",
  "major.geology": "GL",
  "major.journalism": "JR",
  "major.philology": "PH",
  "major.history": "HI",
  "major.philosophy": "PL",
  "major.psychology": "PS",
  "major.sociology": "SO",
  "major.political-science": "PO",
  "major.law": "LW",
  "major.international-relations": "IR",
  "major.physics": "PY",
  "major.mathematics": "MA",
  "major.chemistry": "CH",
  "major.applied-mathematics": "AM",
  "major.data-science": "DS",
};

export function getMajorAbbreviation(
  majorKey: string | null | undefined,
): string | null {
  if (!majorKey) return null;
  return MAJOR_ABBREVIATIONS[majorKey] || null;
}

export function getMajorWithYear(
  majorKey: string | null | undefined,
  yearOfStudy: number | null | undefined,
): { major: string | null; majorYear: string | null } {
  const abbr = getMajorAbbreviation(majorKey);
  if (!abbr) return { major: null, majorYear: null };

  const majorYear = yearOfStudy ? `${abbr}${yearOfStudy}` : null;
  return { major: abbr, majorYear };
}
