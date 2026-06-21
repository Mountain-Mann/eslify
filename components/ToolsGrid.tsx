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
    active: true,
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
    href: "/syllabus",
    icon: "📅",
    name: "Syllabus Planner",
    desc: "Plan full courses across weeks. Set goals, sequence topics and track coverage.",
    active: true,
    badge: "new" as const,
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
        <h2>AI tools for ESL and EFL teachers — lesson plans, worksheets, vocab, exam prep, and more</h2>
        <p>
          ESLify is a free suite of AI tools built specifically for ESL and EFL
          teachers. The <strong>AI lesson plan generator</strong> creates
          complete, CEFR-aligned plans in seconds — choose a level, topic, and
          lesson type and get a ready-to-teach structure with warm-up,
          presentation, practice, and production stages included. Every plan can
          be scored by the built-in quality checker for structure,
          level-appropriateness, and engagement before you walk into class.
        </p>
        <p>
          The <strong>ESL worksheet generator</strong> produces classroom-ready
          printable worksheets with gap fills, multiple choice questions, reading
          comprehension tasks, and discussion prompts — complete with an answer
          key and one-click PDF export. The <strong>vocabulary builder</strong>{" "}
          generates level-appropriate word lists with definitions, collocations,
          and example sentences so students always have the right language for
          the topic.
        </p>
        <p>
          Preparing students for high-stakes tests? The{" "}
          <strong>exam prep builder</strong> generates IELTS and TOEFL-style
          tasks, mock questions, and practice materials at the right level. The{" "}
          <strong>AI error corrector</strong> lets you paste student writing and
          get annotated corrections with clear teacher explanations — ideal for
          homework feedback and writing classes. And when it&apos;s time to
          report to parents or school management, the{" "}
          <strong>progress report generator</strong> turns your rough notes into
          polished, professional student progress reports in seconds.
        </p>
        <p>
          Whether you teach online, in a private language school, or run your
          own tutoring business, ESLify replaces hours of lesson preparation
          with a few clicks. Start free with 10 generations per month — no
          credit card required.
        </p>
      </section>
    </>
  );
}