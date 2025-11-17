const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

async function fetchAndSave() {
  try {
    const res = await fetch("http://localhost:1337/api/articles?populate=*");
    const json = await res.json();

    const projects = json.data.map(p => {
      let image = p.thumbnail?.formats?.thumbnail?.url || p.cover?.url || null
      if (image) {
        image = image.replace("/uploads", "../images")
      }
      return {
        title: p.title,
        slug: p.slug,
        url: `/projects/${p.slug}/`,
        image: image,
        category: p.category?.name || null,
        tags: p.tags?.map(tag => tag.name) || []
      };
    });

    const sortedProjects = projects.sort((a, b) => a.title.localeCompare(b.title));

    // Save to _data/projects.json
    fs.writeFileSync(
      path.join(__dirname, "../_data/projects_build.json"),
      JSON.stringify(sortedProjects, null, 2)
    );

    console.log(`✅ Saved ${sortedProjects.length} projects to _data/projects_build.json`);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    process.exit(1);
  }
}

fetchAndSave();