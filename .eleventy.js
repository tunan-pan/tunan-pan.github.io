module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy("admin");

  
  // Add slug filter
  eleventyConfig.addFilter("slug", function(str) {
    return str
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  });
  
  // Create projects collection
  eleventyConfig.addCollection("projects", function(collectionApi) {
    return collectionApi.getFilteredByGlob("projects/*.md");
  });

  eleventyConfig.addCollection("sortedProjects", function(collectionApi) {
  const projectOrder = require('./_data/projectOrder.json');
  const projects = collectionApi.getFilteredByGlob("projects/*.md");
  
  // Log the slugs so you can see them
  projects.forEach(p => console.log("File slug:", p.fileSlug));
  
  return projects.sort((a, b) => {
    const aSlug = a.fileSlug;
    const bSlug = b.fileSlug;
    const aIndex = projectOrder.indexOf(aSlug);
    const bIndex = projectOrder.indexOf(bSlug);
    
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    
    return aIndex - bIndex;
  });
});
  
  return {
    dir: {
      input: ".",
      output: "_site",
      includes: "_includes"
    }
  };
};