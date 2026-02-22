export type AlternativeVendorCard = {
  slug: string;
  name: string;
  protocols: string;
  ruggedization: string;
  strongestFit: string;
  tradeoffs: string;
  sourceHref: string;
  sourceLabel: string;
};

type ScenarioGuidance = {
  scenario: string;
  recommendation: string;
  reason: string;
};

type MatrixRow = {
  criteria: string;
  competitorBaseline: string;
  betterWhen: string;
};

type FaqItem = {
  question: string;
  answer: string;
};

export type CompetitorAlternativePage = {
  slug: string;
  competitorName: string;
  primaryQuery: string;
  secondaryKeywords: string[];
  summary: string;
  decisionAxis: string;
  watchFor: string;
  switchWhen: string;
  stayWhen: string;
  protocolSnapshot: string;
  ruggedizationSnapshot: string;
  scenarioGuidance: ScenarioGuidance[];
  matrixRows: MatrixRow[];
  faqItems: FaqItem[];
  checklist: string[];
  alternativeSlugs: string[];
  references: Array<{ label: string; href: string }>;
  legacyPage?: boolean;
};

const VENDOR_CARDS: AlternativeVendorCard[] = [
  {
    slug: 'blink-marine',
    name: 'Blink Marine',
    protocols: 'CANopen and J1939 product positioning',
    ruggedization: 'Marine and vehicle-focused keypad platform',
    strongestFit: 'Teams prioritizing removable inserts and programmable keypad workflows.',
    tradeoffs: 'Validate software/tooling fit and lifecycle support model before rollout.',
    sourceHref: 'https://shop.blinkmarine.com/',
    sourceLabel: 'Blink Marine product shop',
  },
  {
    slug: 'hed',
    name: 'HED',
    protocols: 'Programmable keypads with J1939/CAN ecosystem fit',
    ruggedization: 'Raptor keypad family positioned for harsh-duty environments',
    strongestFit: 'OEM and fleet programs that need repeatable vehicle-network keypad deployments.',
    tradeoffs: 'Model-level filtering matters because portfolio breadth can over-spec simple projects.',
    sourceHref: 'https://www.hedonline.com/product/raptor-programmable-keypads/',
    sourceLabel: 'HED Raptor programmable keypads',
  },
  {
    slug: 'marlin-technologies',
    name: 'Marlin Technologies',
    protocols: 'M-Flex product line with J1939/CANopen references',
    ruggedization: 'Marine and heavy-duty keypad positioning with sealed options',
    strongestFit: 'Teams that need custom face and workflow variations across multiple programs.',
    tradeoffs: 'Confirm configuration workflow and support coverage before multi-site standardization.',
    sourceHref: 'https://www.marlintechnologies.com/product/m-flex-keypads/',
    sourceLabel: 'Marlin M-Flex keypads',
  },
  {
    slug: 'czone',
    name: 'CZone',
    protocols: 'NMEA 2000 marine digital switching ecosystem',
    ruggedization: 'Marine control interfaces and keypad options for onboard switching',
    strongestFit: 'Marine platforms already committed to CZone-centric electrical architecture.',
    tradeoffs: 'Ecosystem coupling can reduce flexibility for mixed-vendor control stacks.',
    sourceHref: 'https://www.czone.net/products/keypads',
    sourceLabel: 'CZone keypads',
  },
  {
    slug: 'carling-technologies',
    name: 'Carling Technologies',
    protocols: 'CKP line positioned for SAE J1939 CAN communication',
    ruggedization: 'IP-focused heavy-duty control switch/keypad positioning',
    strongestFit: 'Programs requiring durability-first procurement language and long lifecycle components.',
    tradeoffs: 'Validate customization and lead-time windows for non-standard icon sets.',
    sourceHref: 'https://www.carlingtech.com/ckp-series',
    sourceLabel: 'Carling CKP series',
  },
  {
    slug: 'grayhill',
    name: 'Grayhill',
    protocols: 'CANbus keypads with J1939/CANopen product references',
    ruggedization: 'Industrial and transit-focused keypad durability positioning',
    strongestFit: 'Vehicle and equipment teams balancing protocol support with long-duty-cycle use.',
    tradeoffs: 'Confirm connector, enclosure, and firmware assumptions early in validation.',
    sourceHref: 'https://grayhill.com/products/controls/human-interface-solutions/canbus-keypads/',
    sourceLabel: 'Grayhill CANbus keypads',
  },
  {
    slug: 'apem',
    name: 'APEM',
    protocols: 'KP6 CAN bus keypad product family',
    ruggedization: 'Sealed keypad options for specialty vehicle and industrial controls',
    strongestFit: 'Teams needing compact CAN keypad options from a global switch supplier.',
    tradeoffs: 'Check software integration effort and messaging behavior against current architecture.',
    sourceHref: 'https://www.apem.com/int/keypads/372-kp6.html',
    sourceLabel: 'APEM KP6 CAN bus keypad',
  },
  {
    slug: 'eaton',
    name: 'Eaton',
    protocols: 'M-CAN keypad modules for distributed vehicle controls',
    ruggedization: 'Vehicle-electrical-grade control modules with CAN network positioning',
    strongestFit: 'Programs standardizing around Eaton electrical architecture and supplier footprint.',
    tradeoffs: 'Validate module-level customization and deployment tooling for icon-rich workflows.',
    sourceHref: 'https://www.eaton.com/us/en-us/catalog/electronic-controls-connectivity/m-can-keypad-modules.html',
    sourceLabel: 'Eaton M-CAN keypad modules',
  },
  {
    slug: 'aim-shop',
    name: 'AiM Shop',
    protocols: 'Sim racing and motorsport control interfaces with button-box product lines',
    ruggedization: 'Motorsport-oriented hardware and control interface positioning',
    strongestFit: 'Sim and motorsport teams prioritizing race-control workflow and cockpit integration.',
    tradeoffs: 'Validate compatibility and software workflow for non-racing vehicle-control deployments.',
    sourceHref: 'https://www.aimshop.com/collections/button-boxes',
    sourceLabel: 'AiM Shop button boxes',
  },
];

const VENDOR_CARD_BY_SLUG = new Map(VENDOR_CARDS.map((item) => [item.slug, item]));

const COMPETITOR_SLUG_ALIASES: Record<string, string> = {
  aim: 'aim-shop',
  aimshop: 'aim-shop',
  aimshopcom: 'aim-shop',
  carling: 'carling-technologies',
  marlin: 'marlin-technologies',
};

const COMPETITOR_PAGES: CompetitorAlternativePage[] = [
  {
    slug: 'blink-marine',
    competitorName: 'Blink Marine',
    primaryQuery: 'blink marine alternatives',
    secondaryKeywords: [
      'blink marine competitors',
      'blink marine replacement keypad',
      'blink marine keypad alternative',
      'marine keypad alternatives',
      'j1939 keypad alternatives',
    ],
    summary:
      'Compare Blink Marine alternatives with scenario-first guidance for protocol fit, environmental durability, and deployment workflow across marine and vehicle-control programs.',
    decisionAxis: 'Open protocol flexibility vs ecosystem lock-in and customization throughput.',
    watchFor: 'Lead-time, configuration workflow maturity, and long-term service model.',
    switchWhen: 'You need broader supplier choice or stricter procurement-grade durability documentation.',
    stayWhen: 'Your team depends on Blink-specific workflow speed for custom legends and fast variation cycles.',
    protocolSnapshot: 'Blink positioning emphasizes CANopen/J1939-enabled keypad workflows.',
    ruggedizationSnapshot: 'Marine and harsh-use positioning with configurable interface options.',
    scenarioGuidance: [
      {
        scenario: 'Marine retrofit with established digital switching architecture',
        recommendation: 'Shortlist CZone first, then benchmark Blink and HED for migration flexibility.',
        reason: 'CZone can reduce integration friction on NMEA-centric platforms while HED/Blink preserve open migration options.',
      },
      {
        scenario: 'OEM production line standardization across mixed vehicles',
        recommendation: 'Compare HED, Carling, and Grayhill against Blink baseline before lock-in.',
        reason: 'These vendors align with recurring durability/procurement requirements common in multi-platform programs.',
      },
      {
        scenario: 'Customization-heavy controls with frequent legend updates',
        recommendation: 'Keep Blink and Marlin in final shortlist and validate software/tooling effort side by side.',
        reason: 'Both brands are commonly evaluated for custom workflow flexibility in operator interface programs.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Protocol flexibility',
        competitorBaseline: 'Blink focuses on CANopen/J1939 pathways.',
        betterWhen: 'Use HED/Grayhill when procurement requires broader enterprise channel options.',
      },
      {
        criteria: 'Marine ecosystem coupling',
        competitorBaseline: 'Blink supports open architecture decisions.',
        betterWhen: 'Use CZone when your architecture is tightly anchored to marine digital switching stacks.',
      },
      {
        criteria: 'Customization velocity',
        competitorBaseline: 'Blink is often selected for configurable legend workflows.',
        betterWhen: 'Use Marlin when software and support process fit your team better.',
      },
      {
        criteria: 'Heavy-duty procurement fit',
        competitorBaseline: 'Blink is strong in marine/vehicle controls.',
        betterWhen: 'Use Carling or Grayhill when RFP language is dominated by ruggedized lifecycle criteria.',
      },
    ],
    faqItems: [
      {
        question: 'What is the closest alternative to Blink Marine for J1939 keypads?',
        answer:
          'HED, Grayhill, and Carling are common alternatives for J1939-heavy programs, but best fit depends on integration tooling, durability requirements, and supplier model.',
      },
      {
        question: 'Is CZone a direct Blink Marine replacement?',
        answer:
          'CZone is a strong option when your project is centered on marine digital switching ecosystems; it may be less flexible for mixed non-marine stacks.',
      },
      {
        question: 'Should teams switch from Blink Marine only on unit price?',
        answer:
          'No. Teams should score protocol behavior, deployment workflow effort, lead-time risk, and lifecycle support before making a supplier change.',
      },
      {
        question: 'Where should I test alternatives quickly?',
        answer:
          'Start with a shortlist and run one common message-map and icon workflow validation against each vendor before procurement sign-off.',
      },
    ],
    checklist: [
      'Validate CAN/J1939 message-map behavior against your existing controller logic.',
      'Check ingress and lifecycle assumptions at model level, not brand level.',
      'Compare configuration workflow effort, including support response path.',
      'Run a pilot build before committing to full migration.',
    ],
    alternativeSlugs: ['hed', 'marlin-technologies', 'czone', 'carling-technologies', 'grayhill'],
    references: [
      {
        label: 'Blink Marine product shop',
        href: 'https://shop.blinkmarine.com/',
      },
      {
        label: 'Blink Marine PKP 2000 series',
        href: 'https://www.blinkmarine.com/products/products-detail/professional-keypad-pkp-2000-series',
      },
    ],
    legacyPage: true,
  },
  {
    slug: 'hed',
    competitorName: 'HED',
    primaryQuery: 'hed keypad alternatives',
    secondaryKeywords: [
      'hed raptor alternatives',
      'hed keypad competitors',
      'j1939 keypad alternatives',
      'programmable keypad alternatives',
    ],
    summary:
      'Evaluate HED keypad alternatives with deployment-focused guidance across CAN/J1939 compatibility, ruggedization posture, and production rollout constraints.',
    decisionAxis: 'Ruggedized OEM fit vs customization depth and integration workflow speed.',
    watchFor: 'Over-spec risk, software onboarding, and supplier responsiveness by region.',
    switchWhen: 'You need faster customization cycles or tighter marine-specific ecosystem alignment.',
    stayWhen: 'Your project depends on HED-like heavy-duty deployment posture and established procurement pathways.',
    protocolSnapshot: 'HED Raptor lines are commonly evaluated in J1939/CAN vehicle control programs.',
    ruggedizationSnapshot: 'Positioned for harsh-duty field use with durability-first messaging.',
    scenarioGuidance: [
      {
        scenario: 'Fleet upfitter standardization across mixed chassis',
        recommendation: 'Keep HED baseline, then benchmark Carling and Grayhill for procurement redundancy.',
        reason: 'These alternatives can align with enterprise-grade sourcing and durability requirements.',
      },
      {
        scenario: 'Marine-focused project with digital switching priorities',
        recommendation: 'Compare CZone and Blink before finalizing around HED.',
        reason: 'Marine ecosystem coupling and configuration workflow differences can change total effort significantly.',
      },
      {
        scenario: 'UI-heavy program with frequent legend variants',
        recommendation: 'Benchmark Marlin and Blink against HED implementation speed.',
        reason: 'Customization throughput often matters more than nominal protocol support in these deployments.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Ruggedized program fit',
        competitorBaseline: 'HED emphasizes heavy-duty and OEM deployment posture.',
        betterWhen: 'Use Carling/Grayhill when lifecycle spec language dominates buying decisions.',
      },
      {
        criteria: 'Customization flexibility',
        competitorBaseline: 'HED supports programmable workflows with model-level constraints.',
        betterWhen: 'Use Blink or Marlin when frequent custom legend cycles are primary.',
      },
      {
        criteria: 'Marine ecosystem fit',
        competitorBaseline: 'HED is flexible but not marine-ecosystem-specific by default.',
        betterWhen: 'Use CZone when architecture is anchored to marine switching stack integration.',
      },
      {
        criteria: 'Supplier diversification',
        competitorBaseline: 'HED is a strong baseline in many heavy-equipment programs.',
        betterWhen: 'Use Eaton or APEM when corporate sourcing prefers broader electrical supplier alignment.',
      },
    ],
    faqItems: [
      {
        question: 'Who competes with HED for J1939 keypad projects?',
        answer:
          'Common alternatives include Carling, Grayhill, Blink Marine, and Eaton, depending on lifecycle, procurement, and integration workflow constraints.',
      },
      {
        question: 'Is HED best for marine-only builds?',
        answer:
          'HED is often considered in broader vehicle programs; marine-only projects may also compare CZone and Blink for ecosystem fit.',
      },
      {
        question: 'What usually drives a switch away from HED?',
        answer:
          'Teams typically switch for customization workflow fit, sourcing strategy, or tighter architecture-specific integration needs.',
      },
      {
        question: 'How should teams compare alternatives fairly?',
        answer:
          'Run the same protocol message-map and operator workflow test across shortlisted vendors before price-only negotiation.',
      },
    ],
    checklist: [
      'Document controller protocol requirements at message-map level.',
      'Score each vendor on durability, sourcing path, and support responsiveness.',
      'Validate icon/configuration workflow effort with your actual engineering team.',
      'Pilot one production-like build cycle before fleet-wide commitment.',
    ],
    alternativeSlugs: ['blink-marine', 'carling-technologies', 'grayhill', 'marlin-technologies', 'eaton'],
    references: [],
  },
  {
    slug: 'marlin-technologies',
    competitorName: 'Marlin Technologies',
    primaryQuery: 'marlin keypad alternatives',
    secondaryKeywords: [
      'm-flex keypad alternatives',
      'marlin technologies competitors',
      'custom keypad alternatives',
      'canopen keypad alternatives',
    ],
    summary:
      'Compare Marlin keypad alternatives for teams balancing custom interface workflows against rugged deployment and protocol compatibility requirements.',
    decisionAxis: 'Customization-first workflow fit vs high-volume procurement and long lifecycle control.',
    watchFor: 'Programming workflow fit, support bandwidth, and production lead-time consistency.',
    switchWhen: 'You need broader sourcing channels or stricter enterprise durability qualification paths.',
    stayWhen: 'Your program prioritizes rapid customization and frequent variation across control interfaces.',
    protocolSnapshot: 'Marlin M-Flex lines are compared in CANopen/J1939 control keypad evaluations.',
    ruggedizationSnapshot: 'Durability positioning targets marine and heavy-use operating conditions.',
    scenarioGuidance: [
      {
        scenario: 'Operator interfaces with high icon variation by customer program',
        recommendation: 'Keep Marlin and Blink in final shortlist for workflow speed benchmarking.',
        reason: 'Both are commonly selected when interface customization throughput is critical.',
      },
      {
        scenario: 'Procurement-driven platform standardization initiative',
        recommendation: 'Compare HED, Carling, and Grayhill before selecting Marlin baseline.',
        reason: 'Those vendors may align better with procurement templates focused on lifecycle and channel depth.',
      },
      {
        scenario: 'Marine controls tied to digital switching ecosystem',
        recommendation: 'Evaluate CZone and Marlin side by side with integration effort scoring.',
        reason: 'Ecosystem coupling can outweigh nominal hardware parity in total deployment effort.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Custom interface throughput',
        competitorBaseline: 'Marlin is often shortlisted for configuration-heavy programs.',
        betterWhen: 'Use Blink when your team prefers its specific removable-insert workflow cadence.',
      },
      {
        criteria: 'Enterprise procurement fit',
        competitorBaseline: 'Marlin supports specialized control-interface programs.',
        betterWhen: 'Use HED/Carling when procurement requires broad channel and lifecycle templates.',
      },
      {
        criteria: 'Protocol pathway confidence',
        competitorBaseline: 'Marlin is compared in CANopen/J1939 contexts.',
        betterWhen: 'Use Grayhill/Eaton when electrical architecture alignment is the primary decision axis.',
      },
      {
        criteria: 'Marine ecosystem integration',
        competitorBaseline: 'Marlin supports marine-focused control programs.',
        betterWhen: 'Use CZone when NMEA ecosystem coupling is non-negotiable.',
      },
    ],
    faqItems: [
      {
        question: 'What is the best alternative to Marlin M-Flex for customization-heavy projects?',
        answer:
          'Blink Marine is commonly compared for customization speed, while HED and Carling are often reviewed when procurement criteria dominate.',
      },
      {
        question: 'Are Marlin alternatives mostly marine-focused?',
        answer:
          'No. Alternatives span marine, heavy equipment, specialty vehicles, and industrial controls depending on architecture requirements.',
      },
      {
        question: 'When should teams avoid switching from Marlin?',
        answer:
          'Avoid switching when your current team workflow is already optimized around Marlin tooling and delivery cadence.',
      },
      {
        question: 'How can teams reduce migration risk?',
        answer:
          'Use a controlled pilot with one shared specification and message map across all shortlisted vendors.',
      },
    ],
    checklist: [
      'Test configuration workflow with your real icon-change cadence.',
      'Score vendor support model for firmware, diagnostics, and rollout windows.',
      'Compare lifecycle and lead-time assumptions with procurement.',
      'Run a pre-production trial before full supplier migration.',
    ],
    alternativeSlugs: ['blink-marine', 'hed', 'carling-technologies', 'grayhill', 'czone'],
    references: [],
  },
  {
    slug: 'czone',
    competitorName: 'CZone',
    primaryQuery: 'czone keypad alternatives',
    secondaryKeywords: [
      'czone contact keypad alternatives',
      'marine digital switching keypad alternatives',
      'nmea keypad alternatives',
      'marine keypad competitors',
    ],
    summary:
      'Compare CZone keypad alternatives for marine teams that need to balance NMEA ecosystem integration against open protocol flexibility and sourcing options.',
    decisionAxis: 'Marine ecosystem coupling vs open architecture flexibility for mixed-platform deployments.',
    watchFor: 'Architecture lock-in, long-term service model, and non-marine expansion requirements.',
    switchWhen: 'You need broader protocol and vendor flexibility across mixed fleet or equipment programs.',
    stayWhen: 'Your build is tightly aligned to marine digital switching architecture and onboard ecosystem tooling.',
    protocolSnapshot: 'CZone keypads align strongly with NMEA-centered marine control environments.',
    ruggedizationSnapshot: 'Marine control focus with environment-ready hardware positioning.',
    scenarioGuidance: [
      {
        scenario: 'New-build marine program already standardized on CZone switching',
        recommendation: 'Keep CZone baseline and benchmark Blink for open migration contingency.',
        reason: 'CZone ecosystem alignment can reduce immediate integration effort while Blink offers flexibility backup.',
      },
      {
        scenario: 'Mixed land/sea equipment portfolio',
        recommendation: 'Evaluate HED and Carling alternatives before committing to CZone-only strategy.',
        reason: 'Mixed portfolios often benefit from suppliers with broader non-marine deployment footprint.',
      },
      {
        scenario: 'Customization-heavy marine dashboards',
        recommendation: 'Compare Marlin and Blink against CZone for UI workflow efficiency.',
        reason: 'Interface update speed and customization tools can materially affect lifecycle cost.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Marine ecosystem integration',
        competitorBaseline: 'CZone is strong when NMEA ecosystem alignment is primary.',
        betterWhen: 'Use Blink when you need open architecture flexibility beyond one marine stack.',
      },
      {
        criteria: 'Cross-domain deployment',
        competitorBaseline: 'CZone is primarily marine oriented.',
        betterWhen: 'Use HED/Carling when portfolio extends heavily into off-road or industrial programs.',
      },
      {
        criteria: 'Customization workflow',
        competitorBaseline: 'CZone works well inside its integrated ecosystem.',
        betterWhen: 'Use Marlin/Blink when custom interface variation pace is a leading requirement.',
      },
      {
        criteria: 'Supplier diversification',
        competitorBaseline: 'CZone may be selected for ecosystem coherence.',
        betterWhen: 'Use Eaton/Grayhill when procurement strategy favors wider electrical supplier coverage.',
      },
    ],
    faqItems: [
      {
        question: 'What is a common alternative to CZone keypads?',
        answer:
          'Blink Marine is a frequent alternative when teams need more open architecture options, while HED and Carling are common in mixed fleet programs.',
      },
      {
        question: 'Should marine teams always choose CZone?',
        answer:
          'Not always. CZone is often best when the rest of the platform is already aligned to its ecosystem; otherwise open alternatives can reduce lock-in.',
      },
      {
        question: 'Can CZone alternatives still support marine durability needs?',
        answer:
          'Yes. Several alternatives position products for harsh marine or heavy-duty environments, but model-level validation is still required.',
      },
      {
        question: 'How should teams evaluate migration from CZone?',
        answer:
          'Map the full architecture impact first, then run pilot tests for protocol behavior, diagnostics flow, and deployment tooling effort.',
      },
    ],
    checklist: [
      'Audit current digital switching dependencies before evaluating alternatives.',
      'Compare protocol, diagnostics, and commissioning workflow impact.',
      'Validate ruggedization and enclosure assumptions at model level.',
      'Pilot one vessel or platform before broad migration planning.',
    ],
    alternativeSlugs: ['blink-marine', 'hed', 'marlin-technologies', 'carling-technologies', 'eaton'],
    references: [],
  },
  {
    slug: 'carling-technologies',
    competitorName: 'Carling Technologies',
    primaryQuery: 'carling keypad alternatives',
    secondaryKeywords: [
      'carling ckp alternatives',
      'carling keypad competitors',
      'j1939 keypad alternatives',
      'rugged keypad alternatives',
    ],
    summary:
      'Review Carling keypad alternatives with practical guidance for programs comparing durability-first procurement fit against customization speed and architecture flexibility.',
    decisionAxis: 'Durability and procurement confidence vs interface customization agility.',
    watchFor: 'Customization path, firmware workflow, and lead-time windows for project-specific variants.',
    switchWhen: 'You need higher customization velocity or tighter fit with existing platform software workflow.',
    stayWhen: 'Your buying process prioritizes ruggedized lifecycle consistency and established supplier footprint.',
    protocolSnapshot: 'Carling CKP lines are positioned around SAE J1939 CAN communication use cases.',
    ruggedizationSnapshot: 'Ruggedization and lifecycle durability are major Carling comparison signals.',
    scenarioGuidance: [
      {
        scenario: 'High-volume vehicle platform with strict durability requirements',
        recommendation: 'Keep Carling baseline and compare Grayhill/HED for secondary sourcing.',
        reason: 'These alternatives support similar ruggedized procurement discussions in many programs.',
      },
      {
        scenario: 'Program with frequent icon and layout iteration',
        recommendation: 'Benchmark Blink and Marlin against Carling workflow effort.',
        reason: 'Customization throughput can drive total engineering cost more than hardware list price.',
      },
      {
        scenario: 'Electrical architecture consolidation under one supplier',
        recommendation: 'Compare Eaton and Carling for procurement and systems alignment.',
        reason: 'Supplier consolidation strategies often prioritize ecosystem and support consistency.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Durability-first procurement',
        competitorBaseline: 'Carling is strong in ruggedized procurement language.',
        betterWhen: 'Use Grayhill when model-level integration options better match enclosure and connector constraints.',
      },
      {
        criteria: 'Customization pace',
        competitorBaseline: 'Carling can support custom projects with planning.',
        betterWhen: 'Use Blink or Marlin when rapid interface iteration is a core requirement.',
      },
      {
        criteria: 'Protocol confidence',
        competitorBaseline: 'Carling emphasizes J1939 CAN positioning.',
        betterWhen: 'Use HED when broader programmable deployment posture is preferred.',
      },
      {
        criteria: 'Supplier alignment strategy',
        competitorBaseline: 'Carling offers strong standalone rugged keypad positioning.',
        betterWhen: 'Use Eaton when enterprise strategy favors broader electrical controls consolidation.',
      },
    ],
    faqItems: [
      {
        question: 'Who are common Carling keypad competitors?',
        answer:
          'Grayhill, HED, Blink Marine, and Eaton are common comparison points depending on durability, customization, and sourcing requirements.',
      },
      {
        question: 'When should teams avoid replacing Carling?',
        answer:
          'Avoid switching when your program already meets durability and lifecycle targets with acceptable lead-time and support performance.',
      },
      {
        question: 'Are Carling alternatives cheaper by default?',
        answer:
          'Not always. Total cost depends on integration effort, customization process, support model, and lifecycle reliability.',
      },
      {
        question: 'What is the first step in evaluating alternatives?',
        answer:
          'Create a shared validation matrix with protocol behavior, ingress targets, workflow effort, and supplier risk scoring.',
      },
    ],
    checklist: [
      'Map lifecycle and durability requirements to each shortlisted model.',
      'Compare customization workflow effort and engineering throughput.',
      'Score supplier response model for deployment and post-launch support.',
      'Validate one pilot lot before broad procurement transition.',
    ],
    alternativeSlugs: ['grayhill', 'hed', 'blink-marine', 'eaton', 'apem'],
    references: [],
  },
  {
    slug: 'grayhill',
    competitorName: 'Grayhill',
    primaryQuery: 'grayhill keypad alternatives',
    secondaryKeywords: [
      'grayhill 3kg1 alternatives',
      'grayhill keypad competitors',
      'canbus keypad alternatives',
      'j1939 canopen keypad alternatives',
    ],
    summary:
      'Compare Grayhill keypad alternatives for teams balancing CANbus protocol versatility with procurement strategy, customization needs, and deployment risk.',
    decisionAxis: 'Protocol breadth and industrial fit vs customization speed and supply strategy.',
    watchFor: 'Model-specific integration details, connector fit, and support process for program scale.',
    switchWhen: 'You need tighter supplier consolidation or more customization-focused UI workflow speed.',
    stayWhen: 'Your project benefits from Grayhill-style CANbus and industrial deployment posture.',
    protocolSnapshot: 'Grayhill CANbus keypads are compared in J1939 and CANopen-centric applications.',
    ruggedizationSnapshot: 'Industrial and transit-oriented durability positioning is a frequent selection signal.',
    scenarioGuidance: [
      {
        scenario: 'Transit or specialty vehicle lifecycle program',
        recommendation: 'Keep Grayhill baseline and benchmark Carling/HED for sourcing resilience.',
        reason: 'All three are often evaluated in durability-driven procurement frameworks.',
      },
      {
        scenario: 'Customization-heavy operator panel standardization',
        recommendation: 'Compare Blink and Marlin against Grayhill workflow effort.',
        reason: 'UI iteration cadence can become the dominant operational cost over time.',
      },
      {
        scenario: 'Electrical architecture consolidation initiative',
        recommendation: 'Evaluate Eaton and Grayhill side by side with support/SLA scoring.',
        reason: 'Consolidation plans often prioritize long-term supplier ecosystem fit.',
      },
    ],
    matrixRows: [
      {
        criteria: 'CANbus deployment breadth',
        competitorBaseline: 'Grayhill is often selected for CANbus-focused industrial programs.',
        betterWhen: 'Use HED when program needs align better with its programmable deployment posture.',
      },
      {
        criteria: 'Customization throughput',
        competitorBaseline: 'Grayhill can support configurable programs with planning.',
        betterWhen: 'Use Blink/Marlin when rapid legend and interface iteration is central.',
      },
      {
        criteria: 'Procurement durability narrative',
        competitorBaseline: 'Grayhill supports lifecycle-focused procurement conversations.',
        betterWhen: 'Use Carling when specific ruggedization language aligns better with buyer standards.',
      },
      {
        criteria: 'Supplier ecosystem strategy',
        competitorBaseline: 'Grayhill is strong as a dedicated control-interface supplier.',
        betterWhen: 'Use Eaton when broader electrical supplier consolidation is required.',
      },
    ],
    faqItems: [
      {
        question: 'What alternatives should teams evaluate against Grayhill keypads?',
        answer:
          'Common alternatives include Carling, HED, Blink Marine, and Eaton depending on protocol, procurement, and workflow priorities.',
      },
      {
        question: 'Is Grayhill mainly for transit and industrial use?',
        answer:
          'Grayhill is frequently evaluated in those segments, but suitability depends on your exact protocol and environment requirements.',
      },
      {
        question: 'When does switching from Grayhill make sense?',
        answer:
          'Switching is often considered when customization speed, supplier strategy, or tooling fit becomes more important than current baseline benefits.',
      },
      {
        question: 'How can teams avoid selection mistakes?',
        answer:
          'Use a pilot test that includes protocol validation, environmental assumptions, and operator workflow simulation.',
      },
    ],
    checklist: [
      'Validate protocol behavior for your exact controller and message-map design.',
      'Compare customization process effort with actual engineering users.',
      'Review lifecycle and supplier risk assumptions with procurement.',
      'Run staged pilot deployments before broad replacement.',
    ],
    alternativeSlugs: ['carling-technologies', 'hed', 'blink-marine', 'eaton', 'apem'],
    references: [],
  },
  {
    slug: 'apem',
    competitorName: 'APEM',
    primaryQuery: 'apem keypad alternatives',
    secondaryKeywords: [
      'apem kp6 alternatives',
      'apem can bus keypad alternatives',
      'apem keypad competitors',
      'compact can keypad alternatives',
    ],
    summary:
      'Assess APEM keypad alternatives for teams comparing compact CAN keypad options against rugged lifecycle requirements and system integration complexity.',
    decisionAxis: 'Compact CAN keypad fit vs heavy-duty lifecycle positioning and configuration workflow maturity.',
    watchFor: 'Protocol behavior detail, long-term availability, and customization process overhead.',
    switchWhen: 'You need stronger heavy-duty procurement posture or richer customization workflow support.',
    stayWhen: 'Your use case values compact CAN keypad integration with straightforward requirements.',
    protocolSnapshot: 'APEM KP6 family is positioned for CAN bus keypad use cases.',
    ruggedizationSnapshot: 'Sealed keypad positioning supports specialty vehicle and industrial environments.',
    scenarioGuidance: [
      {
        scenario: 'Compact control panel retrofit with limited enclosure room',
        recommendation: 'Keep APEM baseline and benchmark Grayhill for protocol/deployment depth.',
        reason: 'Physical fit and integration complexity often trade off in compact retrofits.',
      },
      {
        scenario: 'Heavy-duty fleet deployment requiring strict lifecycle posture',
        recommendation: 'Compare HED and Carling against APEM before standardization.',
        reason: 'Lifecycle and procurement criteria can favor vendors with heavier-duty positioning.',
      },
      {
        scenario: 'Electrical supplier consolidation program',
        recommendation: 'Evaluate Eaton alternatives alongside APEM and Grayhill.',
        reason: 'Consolidation strategy can shift value from unit design to broader supplier ecosystem fit.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Compact CAN integration',
        competitorBaseline: 'APEM KP6 is often chosen for compact CAN keypad use cases.',
        betterWhen: 'Use Grayhill when broader CANbus deployment flexibility is needed.',
      },
      {
        criteria: 'Heavy-duty procurement fit',
        competitorBaseline: 'APEM can fit sealed specialty use cases.',
        betterWhen: 'Use HED/Carling when procurement standards emphasize ruggedized lifecycle language.',
      },
      {
        criteria: 'Customization workflow',
        competitorBaseline: 'APEM supports project-based control requirements.',
        betterWhen: 'Use Blink/Marlin when frequent interface changes are expected.',
      },
      {
        criteria: 'Supplier strategy',
        competitorBaseline: 'APEM fits focused keypad sourcing strategies.',
        betterWhen: 'Use Eaton when enterprise plans favor broader electrical supplier alignment.',
      },
    ],
    faqItems: [
      {
        question: 'What is a common alternative to APEM KP6?',
        answer:
          'Grayhill, HED, and Carling are common alternatives depending on protocol detail, ruggedization requirements, and sourcing strategy.',
      },
      {
        question: 'Are APEM alternatives only for large heavy-duty programs?',
        answer:
          'No. Alternatives can also fit compact or specialty applications, but integration effort and workflow fit must still be validated.',
      },
      {
        question: 'When should teams keep APEM as baseline?',
        answer:
          'Keep APEM when compact fit, acceptable protocol behavior, and support model already align with project constraints.',
      },
      {
        question: 'How should teams compare APEM competitors?',
        answer:
          'Use the same enclosure, protocol test, and operator workflow in each vendor evaluation to remove bias.',
      },
    ],
    checklist: [
      'Confirm compact fit and connector assumptions in final enclosure layout.',
      'Validate CAN behavior against your exact controller stack.',
      'Compare support response path and long-term availability assumptions.',
      'Pilot one production-equivalent build before migration decisions.',
    ],
    alternativeSlugs: ['grayhill', 'hed', 'carling-technologies', 'blink-marine', 'eaton'],
    references: [],
  },
  {
    slug: 'eaton',
    competitorName: 'Eaton',
    primaryQuery: 'eaton keypad alternatives',
    secondaryKeywords: [
      'eaton m-can keypad alternatives',
      'eaton can keypad competitors',
      'vehicle can keypad alternatives',
      'distributed control keypad alternatives',
    ],
    summary:
      'Compare Eaton keypad alternatives for teams evaluating M-CAN modules against customization workflows, protocol confidence, and supplier strategy.',
    decisionAxis: 'Electrical supplier consolidation benefits vs specialist keypad workflow flexibility.',
    watchFor: 'Module-level customization options, software process fit, and support handoff clarity.',
    switchWhen: 'You need specialist interface customization or different procurement/delivery behavior.',
    stayWhen: 'Your enterprise strategy is built around Eaton electrical ecosystem consolidation.',
    protocolSnapshot: 'Eaton M-CAN modules are positioned for distributed vehicle CAN control environments.',
    ruggedizationSnapshot: 'Vehicle-electrical-grade module positioning supports control network integration use cases.',
    scenarioGuidance: [
      {
        scenario: 'Enterprise electrical architecture consolidation',
        recommendation: 'Keep Eaton baseline and benchmark Carling/Grayhill for specialized control interfaces.',
        reason: 'Consolidation goals can coexist with selective specialist sourcing if capability gaps appear.',
      },
      {
        scenario: 'Program needing rapid icon/layout variation',
        recommendation: 'Compare Blink and Marlin against Eaton workflow effort.',
        reason: 'Customization cycle speed can dominate long-term engineering effort.',
      },
      {
        scenario: 'Heavy-duty off-road or fleet control deployment',
        recommendation: 'Evaluate HED and Carling alongside Eaton baseline.',
        reason: 'Ruggedized procurement and lifecycle narratives may align better with those suppliers in some projects.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Supplier ecosystem alignment',
        competitorBaseline: 'Eaton is strong when electrical supplier consolidation is a priority.',
        betterWhen: 'Use specialist keypad vendors when interface workflow flexibility is more important than consolidation.',
      },
      {
        criteria: 'Customization speed',
        competitorBaseline: 'Eaton can fit structured module programs.',
        betterWhen: 'Use Blink/Marlin when rapid interface iteration is core to your workflow.',
      },
      {
        criteria: 'Ruggedized deployment fit',
        competitorBaseline: 'Eaton supports vehicle control module scenarios.',
        betterWhen: 'Use HED/Carling when ruggedized keypad procurement criteria are dominant.',
      },
      {
        criteria: 'Protocol-focused specialist depth',
        competitorBaseline: 'Eaton fits broad vehicle CAN control architecture goals.',
        betterWhen: 'Use Grayhill when CANbus keypad specialist depth is the top decision axis.',
      },
    ],
    faqItems: [
      {
        question: 'What are common Eaton M-CAN keypad alternatives?',
        answer:
          'Common alternatives include HED, Carling, Grayhill, and Blink Marine, depending on architecture and customization requirements.',
      },
      {
        question: 'Should teams replace Eaton modules for every custom interface need?',
        answer:
          'Not always. Some teams keep Eaton for architecture alignment and use specialist alternatives only where workflow gaps are material.',
      },
      {
        question: 'How should teams compare Eaton vs specialist keypad vendors?',
        answer:
          'Use a weighted matrix that scores integration effort, customization throughput, lifecycle risk, and supplier strategy fit.',
      },
      {
        question: 'What is the main migration risk from Eaton?',
        answer:
          'The main risk is underestimating architecture and tooling changes required outside the consolidated supplier model.',
      },
    ],
    checklist: [
      'Align architecture team and procurement on consolidation vs specialization goals.',
      'Measure configuration workflow effort with representative tasks.',
      'Validate controller protocol behavior and diagnostics flow for shortlisted vendors.',
      'Execute controlled pilot before broad supplier diversification.',
    ],
    alternativeSlugs: ['hed', 'carling-technologies', 'grayhill', 'blink-marine', 'apem'],
    references: [],
  },
  {
    slug: 'aim-shop',
    competitorName: 'AiM Shop',
    primaryQuery: 'aim shop alternatives',
    secondaryKeywords: [
      'aim button box alternatives',
      'aim motorsport keypad alternatives',
      'sim racing button box alternatives',
      'motorsport keypad competitors',
    ],
    summary:
      'Compare AiM Shop alternatives for teams evaluating motorsport button boxes and keypad interfaces against broader vehicle-control and industrial deployment requirements.',
    decisionAxis: 'Motorsport workflow specialization vs broader CAN keypad deployment flexibility.',
    watchFor: 'Controller compatibility, firmware/tooling fit, and non-racing environment requirements.',
    switchWhen: 'You need broader CAN/J1939-style ecosystem compatibility or rugged field deployment posture.',
    stayWhen: 'Your program is heavily centered on sim or motorsport control workflow with AiM-compatible stack.',
    protocolSnapshot: 'AiM product lines emphasize race-control and cockpit integration workflows.',
    ruggedizationSnapshot: 'Motorsport-oriented control hardware with interface-focused product positioning.',
    scenarioGuidance: [
      {
        scenario: 'Sim-racing cockpit control stack with AiM ecosystem familiarity',
        recommendation: 'Keep AiM baseline, then benchmark APEM and Blink for wider keypad options.',
        reason: 'This keeps workflow continuity while testing broader keypad ecosystem flexibility.',
      },
      {
        scenario: 'Off-road or utility vehicle program outside motorsport context',
        recommendation: 'Compare HED, Carling, and Grayhill against AiM before rollout.',
        reason: 'Heavy-duty vehicle programs often require different durability and protocol validation posture.',
      },
      {
        scenario: 'Supplier consolidation and lifecycle procurement review',
        recommendation: 'Evaluate Eaton and Carling alternatives alongside AiM controls.',
        reason: 'Enterprise lifecycle and support strategy can outweigh cockpit-focused feature fit.',
      },
    ],
    matrixRows: [
      {
        criteria: 'Motorsport workflow fit',
        competitorBaseline: 'AiM aligns strongly with race and sim control use cases.',
        betterWhen: 'Use Blink/APEM when you need broader keypad deployment outside motorsport stack assumptions.',
      },
      {
        criteria: 'Heavy-duty vehicle posture',
        competitorBaseline: 'AiM is optimized around motorsport and cockpit-oriented controls.',
        betterWhen: 'Use HED/Carling for procurement paths focused on industrial and fleet durability language.',
      },
      {
        criteria: 'Protocol and ecosystem flexibility',
        competitorBaseline: 'AiM integration is often evaluated inside motorsport toolchains.',
        betterWhen: 'Use Grayhill/Eaton when enterprise CAN architecture flexibility is the priority.',
      },
      {
        criteria: 'Long-term supplier strategy',
        competitorBaseline: 'AiM can be strong in performance-focused deployments.',
        betterWhen: 'Use Eaton or Carling when broader supplier footprint and lifecycle programs are required.',
      },
    ],
    faqItems: [
      {
        question: 'What are common alternatives to AiM button boxes?',
        answer:
          'Common alternatives include APEM, Blink Marine, HED, Carling, and Grayhill depending on whether your use case is motorsport, marine, or heavy-duty vehicle control.',
      },
      {
        question: 'Should non-racing teams still evaluate AiM alternatives?',
        answer:
          'Yes. Teams outside motorsport should compare protocol fit, durability requirements, and support model before selecting a cockpit-oriented vendor.',
      },
      {
        question: 'When should teams keep AiM as baseline?',
        answer:
          'Keep AiM when your workflow is tightly coupled to motorsport control tooling and compatibility is already validated.',
      },
      {
        question: 'What is the fastest way to compare AiM competitors?',
        answer:
          'Run one shared control workflow and protocol validation test across all shortlisted vendors with the same acceptance criteria.',
      },
    ],
    checklist: [
      'Validate controller and software compatibility for your exact deployment stack.',
      'Compare ruggedization and lifecycle assumptions against real operating environment.',
      'Score configuration workflow effort for both engineering and operators.',
      'Pilot one representative build before committing to vendor transition.',
    ],
    alternativeSlugs: ['apem', 'blink-marine', 'hed', 'carling-technologies', 'grayhill', 'eaton'],
    references: [
      {
        label: 'AiM Shop homepage',
        href: 'https://www.aimshop.com/',
      },
      {
        label: 'AiM Shop button boxes',
        href: 'https://www.aimshop.com/collections/button-boxes',
      },
    ],
  },
];

function dedupeReferences(references: Array<{ label: string; href: string }>) {
  const seen = new Set<string>();
  const output: Array<{ label: string; href: string }> = [];

  for (const reference of references) {
    const href = reference.href.trim();
    if (!href || seen.has(href)) continue;
    seen.add(href);
    output.push({ label: reference.label.trim() || href, href });
  }

  return output;
}

function resolveAlternativeCards(slugs: string[]) {
  const cards: AlternativeVendorCard[] = [];
  for (const slug of slugs) {
    const card = VENDOR_CARD_BY_SLUG.get(slug);
    if (card) cards.push(card);
  }
  return cards;
}

function resolveReferences(entry: CompetitorAlternativePage) {
  const competitorCard = VENDOR_CARD_BY_SLUG.get(entry.slug);
  const competitorReferences = competitorCard
    ? [{ label: competitorCard.sourceLabel, href: competitorCard.sourceHref }]
    : [];

  const alternativeReferences = resolveAlternativeCards(entry.alternativeSlugs).map((card) => ({
    label: card.sourceLabel,
    href: card.sourceHref,
  }));

  return dedupeReferences([
    ...entry.references,
    ...competitorReferences,
    ...alternativeReferences,
  ]);
}

export function listCompetitorAlternatives(options?: { includeLegacy?: boolean }) {
  const includeLegacy = options?.includeLegacy ?? true;
  return COMPETITOR_PAGES.filter((entry) => includeLegacy || entry.legacyPage !== true);
}

export function listProgrammaticAlternativeSlugs() {
  return listCompetitorAlternatives({ includeLegacy: false }).map((entry) => entry.slug);
}

export function getCompetitorAlternative(slug: string) {
  const normalizedSlug = slug.trim().toLowerCase();
  const canonicalSlug = COMPETITOR_SLUG_ALIASES[normalizedSlug] ?? normalizedSlug;
  const match = COMPETITOR_PAGES.find((entry) => entry.slug === canonicalSlug);
  if (!match) return null;

  const alternatives = resolveAlternativeCards(match.alternativeSlugs);
  return {
    ...match,
    alternatives,
    references: resolveReferences(match),
  };
}
