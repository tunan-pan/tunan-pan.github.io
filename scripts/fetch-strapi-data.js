const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");
const React = require("react")
const { renderToString } = require('react-dom/server');
const { BlocksRenderer } = require('@strapi/blocks-react-renderer');


function convertContent(content) {
  if (content == null) return "";
  return renderToString(
    React.createElement(BlocksRenderer, { content })
  )
}


async function fetchAndSave() {
  try {
    const res = await fetch("http://localhost:1337/api/articles?populate=*"); // Rich text fields like content and description are automatically included so don't need to be included here - you only need to populate relations (like images, categories, tags, etc.).
    const json = await res.json();

    if (json.error) {
      console.error("❌ Strapi error:", json.error);
      process.exit(1);
    }

    console.log("✅ Fetched", json.data?.length, "articles");


    const projects = json.data.map(p => {
      let image = "../images/thumb-placeholder.png";

      if (p.thumbnail?.formats?.large?.url) {
        image = p.thumbnail.formats.large.url.replace("/uploads", "../images");
      }

      // Process images
      const images = (p.images || []).map(img => ({
        url: img.url?.replace("/uploads", "../images"),
        alternativeText: img.alternativeText,
        name: img.name,
        caption: img.caption, 
        formats: img.formats, // Keep formats in case you want different sizes
      }));

      return {
        title: p.title,
        slug: p.slug,
        url: `/projects/${p.slug}/`,
        image: image,
        category: p.category?.name || null,
        tags: p.tags?.map(tag => tag.name) || [],
        order: p.order,
        description: p.description || null,
        content: convertContent(p.content),
        images: images,
        stuff: p.stuff
      };
    });

    const sortedProjects = projects.sort((a, b) => b.order - a.order);

    fs.writeFileSync(
      path.join(__dirname, "../_data/projects_build.json"),
      JSON.stringify(sortedProjects, null, 2)
    );

    console.log("✅ Saved", sortedProjects.length, "projects to _data/projects_build.json");
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    process.exit(1);
  }
}

fetchAndSave();