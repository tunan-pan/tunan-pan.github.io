module.exports = function(eleventyConfig) {
  eleventyConfig.addPassthroughCopy("css");
  eleventyConfig.addPassthroughCopy("fonts");
  eleventyConfig.addPassthroughCopy("images");
  eleventyConfig.addPassthroughCopy("js");
  eleventyConfig.addPassthroughCopy({
    "backend/public/uploads": "images"
  })
  eleventyConfig.ignores.add("backend/**");

  return {
    dir: {
      input: ".",
      output: "_site"
    }
  };
};