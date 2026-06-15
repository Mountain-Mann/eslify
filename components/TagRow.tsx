"use client";

interface TagRowProps {
  tags: string[];
  selected: string;
  onSelect: (value: string) => void;
}

export function TagRow({ tags, selected, onSelect }: TagRowProps) {
  return (
    <div className="tag-row">
      {tags.map((tag) => (
        <button
          key={tag}
          type="button"
          className={`tag${selected === tag ? " on" : ""}`}
          onClick={() => onSelect(tag)}
        >
          {tag.split(" & ")[0].split(" ")[0]}
        </button>
      ))}
    </div>
  );
}
