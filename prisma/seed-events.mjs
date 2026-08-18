import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Events sourced from docs/event-details.md. Every field in the markdown is mapped
// onto a column of the Event table. Multi-day events are stored as a single
// top-level row (isMultiDay = true); day-by-day breakdowns live in `description`.
const events = [
  {
    name: "ACM Core VerteX",
    type: ["Seminar or Talk", "Workshop"],
    statusOverride: "FINISHED",
    eventSemester: "SECOND",
    startDate: new Date("2026-01-15T00:00:00"),
    endDate: new Date("2026-01-17T23:59:59"),
    dayOfWeek: "Thursday",
    venue: "Student Plaza - 2nd Floor, Case Room - 16th Floor",
    isMultiDay: true,
    overview:
      '"ACM Core VerteX" is a 2-day event consisting of seminars in Artificial Intelligence, Data Science, and Software Engineering and a workshop in AI prompt engineering. With informative talks and an interactive workshop, the event combines learning, teamwork, and enjoyment—empowering the students to discover different fields in Computer Science, and to provide career pathways in line with the modern industry.',
    mainObjective:
      "To provide the participants with an insightful understanding of the various fields of Computer Science, mainly Software Engineering, Data Science, and Artificial Intelligence, preparing them with the right skillset and reliable resources as they venture into the industry in their own career pathways.",
    specificObjectives: [
      "To educate the participants about the differences between Artificial Intelligence, Data Science, and Software Engineering in the context of pursuing Computer Science careers.",
      "To inform and explore the participants' knowledge about the rising trends, innovations, technologies, and challenges in the industry.",
      "To promote ACMX as a student-led initiative creating software solutions for students, encouraging innovation and hands-on tech experience.",
      "To instruct participants in ethically leveraging the use of Artificial Intelligence in the industry.",
    ],
    description:
      "ACM Core VerteX is a two-day learning experience that bridges foundational knowledge with practical skills in the field of Computer Science. The event is to help students explore modern industry trends, develop relevant competencies, and gain exposure to career pathways in technology.\n\nDay 1: Convergence\nConvergence features a seminar composed of two major segments. The morning session focuses on Data Science and Artificial Intelligence, offering insights into how these fields intersect to drive innovation and solve real-world problems. The afternoon session shifts towards Artificial Intelligence in Software Engineering, shedding light on the role of AI in reshaping software development practices, tools, and methodologies. With expert speakers and engaging discussions, Convergence allows participants to see how different disciplines align and overlap within the field of technology.\n\nDay 2: Expedition\nExpedition transitions from theory to application through a hands-on AI Prompt Engineering Workshop. Designed to complement the themes of the seminar, this interactive session enables participants to practice crafting effective prompts, understand the nuances of working with AI systems, and explore practical use cases. The workshop emphasizes teamwork, creativity, and problem-solving, ensuring that attendees not only absorb knowledge but also apply it in meaningful ways.\n\nTogether, Convergence and Expedition provide a balanced blend of information and application, empowering students to connect concepts, strengthen skills, and discover their place in the ever-evolving tech industry.",
    targetParticipants: null,
    feeNote: null,
  },
  {
    name: "ACM Gradient FORGE: Shaping the First Metal",
    type: ["Workshop"],
    statusOverride: "FINISHED",
    eventSemester: "SECOND",
    startDate: new Date("2026-02-20T00:00:00"),
    endDate: new Date("2026-02-20T23:59:59"),
    dayOfWeek: "Friday",
    venue: "TBA",
    isMultiDay: false,
    overview:
      'ACM Gradient FORGE: Shaping the First Metal" is the inaugural event of the ACM Gradient FORGE series. It is a 4-hour, inclusive, data science workshop designed to take students from zero coding knowledge to producing their first data investigation report. Instead of traditional lectures or seminars, this event uses a student-led code-along workshop paradigm. Participants will act as "Data Detectives," using Python to solve a mystery within a dataset while actively manipulating it.',
    mainObjective:
      "To demystify data science for absolute beginners by equipping them with the fundamental ability to transform raw, messy information into visual insights using industry-standard Python libraries. The participants will be working with real datasets that are available for academic use.",
    specificObjectives: [
      "To transition individuals from \"zero coding\" to confident and adept users of Jupyter notebook, a set of python libraries, who can clean, filter, and visualize datasets without being lost.",
      "Develop a foundational understanding of the data science lifestyle, shifting from passive observation to active manipulation of raw datasets.",
      "Demonstrate the ability to transform unstructured or messy information into meaningful visual narratives that drive decision-making.",
      "As an optional plus, completing this event gears the participant with prerequisite skills in data preprocessing and feature engineering to engage with neural networks.",
    ],
    description:
      '"ACM Gradient FORGE: Shaping the First Metal" serves as the opening chapter of the ACM Gradient FORGE series, designed to be a high-impact, low-barrier entry point into the world of Data Science. This 4-hour immersive workshop favors a dynamic "fill-in-the-blanks" code-along session, ensuring that participants—regardless of their prior programming experience—can successfully navigate a Jupyter Notebook environment without technical friction.\n\nThe event focuses on the critical "Data" component of the Artificial Intelligence pipeline. Participants will step into the role of data investigators, tackling a real-world messy dataset to uncover hidden patterns regarding the datasets. The curriculum is divided into three distinct parts:\n\n1. "The Blacksmith": where students learn the logic of data hygiene by repairing missing values and engineering new features;\n2. "The Artist": where they master visual storytelling using data plotting tools to generate heatmaps and distribution plots; and\n3. "Final Challenge": a gamified independent challenge where participants apply their newly forged skills to a completely different dataset.\n\nWhile this event stands as a complete, self-contained workshop on Exploratory Data Analysis (EDA), it also sets the stage for the upcoming sequel, "ACM Gradient FORGE: Into the Fire." Where this session focuses on mastering the raw material (the data), the next phase will focus on building machinery (Neural Networks). Participants who attend this session will gain a deeper appreciation for the data preprocessing steps used in modern AI, though the subsequent event remains open and accessible to all aspiring developers ready to dive straight into Deep Learning.\n\nThe workshop curriculum utilizes a dual-dataset approach to ensure participants can adapt their skills to different scenarios. The guided modules introduce a classic, well-structured dataset, allowing participants to learn the essentials of organizing and interpreting information in a supportive environment. This transitions into an independent challenge using a relatable, interest-based dataset, encouraging participants to apply their newly acquired logic to a fresh context without the safety net of a step-by-step guide.',
    targetParticipants: "25 - 40 FEU Tech CS students.",
    feeNote: null,
  },
  {
    name: "ACM Into the Code F++ 6.0",
    type: ["Seminar or Talk", "Workshop", "Competition"],
    statusOverride: "FINISHED",
    eventSemester: "SECOND",
    startDate: new Date("2026-03-02T00:00:00"),
    endDate: new Date("2026-03-06T23:59:59"),
    dayOfWeek: "Monday",
    venue: "TBA",
    isMultiDay: true,
    priceOfficer: 50,
    priceMember: 0,
    priceNonMember: 60,
    overview:
      "ACM Into the Code F++ 6.0 is an ACM flagship event, now in its 6th year, celebrating Women and its history. It is designed to empower women in the technological field through a series of enlightening talks, thought-provoking panel discussion, and engaging breakout sessions.",
    mainObjective:
      "To celebrate and empower women in technology by providing them a platform to learn, network, and share their experiences and ideas freely through several talks and a panel discussion.",
    specificObjectives: [
      "To provide a platform for women in the technological field to share their experiences and insights.",
      "To foster a sense of community and mutual support among women in the technological field.",
      "To provide learning opportunities for participants through talks and discussions led by experienced professionals.",
      "To inspire and motivate participants to pursue their passions and goals in the technological field.",
    ],
    description:
      "Into the Code F++: 6.0 is an initiative that aims to celebrate Women's History month by empowering women in the technological field. Taking place on March 2, 6 and 7, 2026, this event provides a platform for women to share their experiences, learn from industry experts, and network with like-minded individuals. Through a series of talks, panel discussion, and workshop sessions, participants will have an opportunity to gain valuable insights, develop new skills, and form meaningful connections. This event embodies our commitment to promoting diversity and inclusion in the technological field.\n\nThe specific activities that will be held are the following:\n\nDay 1 (March 2, 2026): The event kicks off with an inspiring keynote speech from an influential woman in tech and leadership. Panel discussions will follow, featuring experts sharing their experiences, challenges, and insights on breaking barriers and driving innovation in the digital space.\n\nDay 2 (March 6, 2026): The second day will feature a workshop hosted by a community partner or the academics committee. The session will provide the participants with an opportunity to delve to specific topics and engage in interactive discussions, as well as mini games to add an exciting element to the event.\n\nDay 3 (March 7, 2026): The final day concludes with a Game Development workshop designed to blend creativity with technical skills. This session will be guided by expert speakers, to help participants through the basics and fundamentals of game development, allowing them to release their creative and logical thinking.",
    targetParticipants: "150 CS Students",
    feeNote:
      "3-day Seminar:\n- Free for ACM Member and PRISM Members (Major Partnership Package)\n- Php 50.00 for non-ACM member and non-partnered org\n- Php 60.00 non-partner organization external participants",
  },
  {
    name: "ACM Developers Week",
    type: ["Workshop", "Hackathon"],
    statusOverride: "FINISHED",
    eventSemester: "THIRD",
    startDate: new Date("2026-05-05T00:00:00"),
    endDate: new Date("2026-05-07T23:59:59"),
    dayOfWeek: "Tuesday",
    venue: "F1604 Case Room",
    isMultiDay: true,
    priceOfficer: 50,
    priceMember: 0,
    priceNonMember: 60,
    overview: null,
    mainObjective: null,
    specificObjectives: [],
    description:
      'ACM Developers Week is a three-day interactive development program designed to bridge the gap between theoretical concepts and practical software engineering for the FEU Tech ACM community. Through a blend of technical seminars, a simulation-based micro-hackathon, and a project showcase, participants will master the modern development lifecycle, from system architecture to deployment, in a high-energy, collaborative setting. This event not only cultivates technical proficiency and soft skills but also fosters a culture of mentorship and fearless innovation, uniting students across different year levels to build creative, unconventional web solutions.\n\nDay 1: The Full-Stack Crash Course\nA comprehensive seminar and workshop series designed to level the playing field for all participants. The day focuses on equipping students with the necessary technical toolkit, specifically System Architecture, Git/GitHub collaboration, and API utilization—supplemented by industry talks on overcoming "Impostor Syndrome" to prepare them mentally and technically for the upcoming challenge.\n\nDay 2: The Mini-Hackathon\nA high-intensity, five-hour micro-hackathon where teams collaborate to build a creative web application from scratch. Without the restrictions of traditional lectures, students will dive straight into coding, utilizing the skills learned on Day 1 to brainstorm, architect, and develop a functional "Minimum Viable Product" (MVP) under time pressure, fostering quick decision-making and teamwork.\n\nDay 3: Demo Day\nA celebratory exhibition where teams pitch their deployed projects to the community and a panel of judges. This day shifts focus from the pressure of development to the joy of creation, highlighting technical ingenuity, user experience design, and presentation skills, culminating in an awards ceremony that recognizes the most innovative and well-executed solutions.',
    targetParticipants: "50 CS Students.",
    feeNote:
      "0 php for ACM members\n50 php for non-ACM members but participants from partnered organizations\n60 php for non-ACM members and non-participants from partnered organizations",
  },
  {
    name: "ACM 19th Anniversary - TechSprint: Asteria",
    type: ["Hackathon"],
    statusOverride: "FINISHED",
    eventSemester: "THIRD",
    startDate: new Date("2026-06-25T00:00:00"),
    endDate: new Date("2026-06-27T23:59:59"),
    dayOfWeek: "Thursday",
    venue: "FTIC, Online",
    isMultiDay: true,
    overview:
      "ACM TechSprint: Asteria is a three-day hybrid hackathon organized by the ACM FEU Tech Student Chapter. The event brings together college and senior high school students to collaboratively design, develop, and present technology-driven solutions to real-world problems. Guided by faculty members and industry practitioners, students will apply their academic knowledge in a competitive yet educational environment that emphasizes innovation, teamwork, and technical excellence.",
    mainObjective:
      "To provide students with a structured, experiential learning opportunity where they can apply computer science and information technology concepts to real-world problem-solving through collaborative software development.",
    specificObjectives: [
      "To enhance students' technical skills in software development, system design, and problem-solving through hands-on project creation.",
      "To promote collaboration, critical thinking, and innovation by working in multidisciplinary teams under time constraints.",
      "To expose students to academic and industry mentorship, fostering professional growth and awareness of real-world technology applications.",
    ],
    description:
      "ACM TechSprint: Asteria is a flagship hackathon that features a competitive yet educational environment where student teams design and develop innovative software solutions addressing socially relevant and technology-driven challenges. The event consists of structured phases including orientation, ideation, development, mentoring, evaluation, and final presentations.\n\nThe activity aims to strengthen students' academic learning by translating theoretical knowledge into practical applications. It also promotes collaboration, innovation, and exposure to faculty and industry expertise, aligning with the institution's outcomes-based education framework.",
    targetParticipants: "80 - 120 College and Senior High Students",
    feeNote: "TBA (subject to sponsorship support).",
  },
  {
    name: "ACM 19th Anniversary - CS Night",
    type: ["Grand Ball"],
    statusOverride: "FINISHED",
    eventSemester: "THIRD",
    startDate: new Date("2026-06-27T00:00:00"),
    endDate: new Date("2026-06-27T23:59:59"),
    dayOfWeek: "Saturday",
    venue: "Gymnasium-17th Floor",
    isMultiDay: false,
    priceMember: 899,
    priceOfficer: 999,
    priceNonMember: 1099,
    overview:
      "CS Night 2026 is a formal masquerade ball in celebration of the organization's 19th anniversary. The event is designed as a social and recognition night for Computer Science students and associates, providing a well deserved opportunity to enjoy and celebrate the end of the academic year. This will bring CS Students in a professionally managed evening which also features a buffet, performances, awarding, and formal turnover of the ACM Student Chapter officers",
    mainObjective:
      "To conduct a formal and well-organized celebration that will strengthen community engagement, recognizes student achievements, both national and international, and through an elegant masquerade-themed evening, the event seeks to foster camaraderie and a sense of community among CS students, recognize their academic journey, and create a once-in-a-college-life milestone that embodies the spirit, excellence, and unity of the CS community.",
    specificObjectives: [
      "To provide a celebratory social event for Computer Science students, faculty, and associates before the conclusion of the academic year.",
      "To conduct the official turnover ceremony of the ACM Student Chapter officers in a professional and ceremonial setting.",
      "To promote camaraderie and strong relationships among CS students, faculty, and associates through shared social experience.",
      "To recognize participation and creativity through themed awards aligned with the event's masquerade concept.",
    ],
    description:
      "ACM CS Night 2026 is a formal masquerade ball organized in celebration of the FEU Tech ACM Student Chapter's 19th anniversary. The event will be conducted as a professionally managed social gathering for Computer Science students, faculty, associates, and external participants, providing an opportunity to relax and celebrate before the conclusion of the academic year.\n\nThis activity will feature a buffet dinner, live performances, themed awarding, and the formal turnover ceremony of the ACM Student Chapter officers. Attendees will also be able to participate in social and recreational segments designed to encourage interaction and fun within the Computer Science community.\n\nThrough this event, the organization aims to strengthen the community engagement through providing a celebratory social experience, formally recognizing leadership with the official turnover of officers, promote camaraderie and stronger relationships among students, faculty, and associates, and acknowledge participation and creativity through themed awards aligned with the event's masquerade concept.",
    targetParticipants:
      "170 CS Students, 50 External Participants, 20 Associates.",
    feeNote:
      "ACM Students: P899\nNon-ACM CS Students: P999\nExternal Participants: P1,099",
  },
];

async function main() {
  let created = 0;
  let skipped = 0;

  for (const e of events) {
    const existing = await prisma.event.findFirst({ where: { name: e.name } });
    if (existing) {
      console.log(`⏭️  Skipping (already exists): ${e.name}`);
      skipped++;
      continue;
    }

    await prisma.event.create({ data: e });
    console.log(`✅ Created: ${e.name}`);
    created++;
  }

  console.log(`\n🎉 Done. Created ${created}, skipped ${skipped}.`);
}

main()
  .catch((err) => {
    console.error("❌ Seeder error:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
