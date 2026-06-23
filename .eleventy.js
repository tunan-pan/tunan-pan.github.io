const markdownIt = require("markdown-it");
/* const projects = require("./_data/projects_build.json"); */
const { parse } = require("node-html-parser"); 

// Shared slugify function — used by both the filter and transform
function slugify(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/&amp;/g, "and")   // encoded ampersand
    .replace(/&/g, "and")       // bare ampersand — MUST be before the [^\w\s-] strip
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

  module.exports = function(eleventyConfig) {
    eleventyConfig.addPassthroughCopy("CNAME");
    eleventyConfig.addPassthroughCopy("css");
    eleventyConfig.addPassthroughCopy("fonts");
    eleventyConfig.addPassthroughCopy("images");
    eleventyConfig.addPassthroughCopy("js");
    eleventyConfig.addPassthroughCopy("sandbox");
    eleventyConfig.addPassthroughCopy("favicon.ico");
    eleventyConfig.addPassthroughCopy("favicon-16x16.png");
    eleventyConfig.addPassthroughCopy("favicon-32x32.png");
    eleventyConfig.addPassthroughCopy("apple-touch-icon.png");
    eleventyConfig.addPassthroughCopy("android-chrome-192x192.png");
    eleventyConfig.addPassthroughCopy("android-chrome-512x512.png");
    eleventyConfig.addPassthroughCopy({
      "backend/public/uploads": "images"
    })
    eleventyConfig.ignores.add("backend/**");

    // FILTER — extracts section list from HTML string
    eleventyConfig.addFilter("extractSections", function(htmlString) {
      if (!htmlString) return [];
      const root = parse(htmlString);
      const headings = root.querySelectorAll("h2");
      const seen = {};
      return headings.map((h2) => {
        const title = h2.textContent.trim();
        let id = slugify(title);
        if (seen[id]) { seen[id]++; id = `${id}-${seen[id]}`; }
        else { seen[id] = 1; }
        return { title, id };
      });
    });

    // TRANSFORM — injects IDs into h2 elements in the rendered HTML
    eleventyConfig.addTransform("injectSectionIds", function(content, outputPath) {
      if (!outputPath || !outputPath.endsWith(".html")) return content;
      if (!content.includes('class="project-content"')) return content;

      const seen = {};

      return content.replace(
        /<h2([^>]*)>([\s\S]*?)<\/h2>/gi,
        (match, attrs, inner) => {
          if (/\bid=/.test(attrs)) return match;
          const text = inner.replace(/<[^>]+>/g, "").trim();
          let id = slugify(text);
          if (seen[id]) { seen[id]++; id = `${id}-${seen[id]}`; }
          else { seen[id] = 1; }
          return `<h2${attrs} id="${id}">${inner}</h2>`;
        }
      );
    });

    // markdown filter
    eleventyConfig.addFilter("markdown", (content) => {
      if (!content || typeof content !== 'string') return "";
      const md = new markdownIt();
      return md.render(content);
    });


  // next/previous project logic
  eleventyConfig.addFilter("findProjectIndex", (projects, slug) => {
    return projects.findIndex(p => p.slug === slug);
  });

  eleventyConfig.addFilter("whereCategory", (projects, category) => {
    return (projects || []).filter(p => p.category === category);
  });

  // to filter for projects that aren't hidden
  eleventyConfig.addFilter("navProjects", (projects) => {
    return projects.filter(p => !p.hideFromNav);
  });


  return {
    dir: {
      input: ".",
      output: "_site",
      data: "_data"
    }
  };
};