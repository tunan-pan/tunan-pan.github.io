const fetch = require("node-fetch");
const fs = require("fs");
const path = require("path");

async function fetchAndSave() {
  try {
    const res = await fetch("http://localhost:1337/api/articles?populate=*");
    const json = await res.json();

    const projects = json.data.map((p) => ({
      title: p.title,
      url: `/projects/${p.slug}/`,
      image: p.cover.formats.medium.url || null,
      category: p.category.name || [],
      tags: p.tags || []
    }));

    const sortedProjects = projects.sort((a, b) => a.title.localeCompare(b.title));

    // Save to _data/projects.json
    fs.writeFileSync(
      path.join(__dirname, "../_data/projects.json"),
      JSON.stringify(sortedProjects, null, 2)
    );

    console.log(`✅ Saved ${sortedProjects.length} projects to _data/projects.json`);
  } catch (err) {
    console.error("❌ Error fetching projects:", err);
    process.exit(1);
  }
}

fetchAndSave();