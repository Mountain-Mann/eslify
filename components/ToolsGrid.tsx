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
    href: null,
    icon: "📚",
    name: "Vocabulary Builder",
    desc: "Generate level-appropriate word lists with definitions, collocations and example sentences.",
    active: false,
    badge: "soon" as const,
  },
  {
    href: null,
    icon: "✍️",
    name: "Error Corrector",
    desc: "Paste student writing and get annotated corrections with clear teacher explanations.",
    active: false,
    badge: "soon" as const,
  },
  {
    href: null,
    icon: "🎓",
    name: "Exam Prep Builder",
    desc: "Generate IELTS and TOEFL style tasks, mock questions and practice materials.",
    active: false,
    badge: "soon" as const,
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
    href: null,
    icon: "📝",
    name: "Progress Reports",
    desc: "Turn your notes into professional student progress reports for parents and schools.",
    active: false,
    badge: "soon" as const,
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
    </>
  );
}
