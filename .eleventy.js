const markdownIt = require("markdown-it");
/* const projects = require("./_data/projects_build.json"); */

module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("CNAME");
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("js");
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


// Add markdown filter
eleventyConfig.addFilter("markdown", (content) => {
  if (!content || typeof content !== 'string') return "";
  return md.render(content);
});

// next/previous project logic
eleventyConfig.addFilter("findProjectIndex", (projects, slug) => {
  return projects.findIndex(p => p.slug === slug);
});

/*
eleventyConfig.addCollection("projects", function() {
    return projects.map(p => ({
      ...p,
      tags: ["projects", ...(p.tags || [])],
      url: `/projects/${p.slug}/`
    }));
  });
  */


  return {
    dir: {
      input: ".",
      output: "_site",
      data: "_data"
    }
  };
};