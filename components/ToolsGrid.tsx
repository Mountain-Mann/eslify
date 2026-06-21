import Link from "next/link";

const TOOLS = [
  {
    href: "/lesson",
    icon: "📋",
    name: "Lesson Planner",
    desc: "Generate structured, CEFR-aligned lesson plans in seconds. Warm-up to wrap-up, fully ready to teach.",
    active: true,
    badge: null,
  },
  {
    href: "/worksheet",
    icon: "📄",
    name: "Worksheet Generator",
    desc: "Create printable student worksheets with exercises, gap fills, discussion questions and more.",
    active: false,
    badge: "new" as const,
  },
  {
    href: "/vocabulary",
    icon: "📚",
    name: "Vocabulary Builder",
    desc: "Generate level-appropriate word lists with definitions, collocations and example sentences.",
    active: true,
    badge: "new" as const,
  },
  {
    href: "/corrector",
    icon: "✍️",
    name: "Error Corrector",
    desc: "Paste student writing and get annotated corrections with clear teacher explanations.",
    active: true,
    badge: "new" as const,
  },
  {
    href: "/exam-prep",
    icon: "🎓",
    name: "Exam Prep Builder",
    desc: "Generate IELTS and TOEFL style tasks, mock questions and practice materials.",
    active: true,
    badge: "new" as const,
  },
  {
    href: null,
    icon: "📅",
    name: "Syllabus Planner",
    desc: "Plan full courses across weeks. Set goals, sequence topics and track coverage.",
    active: false,
    badge: "soon" as const,
  },
  {
    href: "/progress-reports",
    icon: "📝",
    name: "Progress Reports",
    desc: "Turn your notes into professional student progress reports for parents and schools.",
    active: true,
    badge: "new" as const,
  },
];

export default function ToolsGrid() {
  return (
    <>
      <div className="dash-hero">
        <p className="dash-eyebrow">AI Tools for ESL Teachers</p>
        <h1>Your ESL teaching toolkit</h1>
        <p>
          Purpose-built AI tools for ESL teachers. No generic nonsense — every
          tool is built around how you actually teach.
        </p>
      </div>
      <div className="tools-grid">
        {TOOLS.map((tool) => {
          const className = `tool-card${tool.active ? " active-tool" : ""}${!tool.href ? " coming" : ""}`;
          const content = (
            <>
              {tool.badge === "soon" && (
                <div className="coming-badge">Soon</div>
              )}
              {tool.badge === "new" && <div className="new-badge">New</div>}
              <div className="tool-icon">{tool.icon}</div>
              <div className="tool-name">{tool.name}</div>
              <div className="tool-desc">{tool.desc}</div>
            </>
          );

          if (tool.href) {
            return (
              <Link key={tool.name} href={tool.href} className={className}>
                {content}
              </Link>
            );
          }

          return (
            <div key={tool.name} className={className}>
              {content}
            </div>
          );
        })}
      </div>
      <section className="seo-intro">
        <h2>AI lesson plans and worksheets for ESL teachers</h2>
        <p>
          ESLify is a free AI lesson plan generator built specifically for
          ESL and EFL teachers. Create a complete, CEFR-aligned lesson plan
          in seconds — just choose a level, topic, and lesson type, and get
          a ready-to-teach plan with warm-up, presentation, practice, and
          production activities included.
        </p>
        <p>
          Need printable materials instead? The worksheet generator creates
          classroom-ready ESL worksheets with gap fills, multiple choice
          questions, reading comprehension, and discussion prompts, complete
          with an answer key and a one-click PDF download. Every lesson plan
          can also be checked by our built-in AI quality checker, which
          scores structure, level-appropriateness, and engagement before you
          walk into class.
        </p>
        <p>
          Whether you teach online, in a private language school, or run
          your own tutoring business, ESLify saves hours of lesson
          preparation time. Start with 10 free generations per month, no credit
          card required.
        </p>
      </section>
    </>
  );
}