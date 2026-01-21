import React from "react";

export default function ProjectContent({ content }) {
  return (
    <div
      className="ck-content"
      dangerouslySetInnerHTML={{ __html: content }}
    />
  );
}
