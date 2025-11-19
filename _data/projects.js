// _data/projects.js

const projects = require("./projects_build.json");

module.exports = projects;



/* ----- 
The below is basically now moved to scripts/fetch-strapi-data.js 
so a script is made in package.json to fetch the data. 
-----

const fetch = require("node-fetch");

module.exports = async function () {
  try {
    // Fetch projects from Strapi API
    const res = await fetch("http://localhost:1337/api/articles?populate=*");
    const json = await res.json();

    console.log(json.data[0])
    // json.data is an array of project objects
    // Map them to the structure your template expects
    const projects = json.data.map((p) => ({
      title: p.title,
      url: `/projects/${p.slug}/`,
      image: p.cover.formats.medium.url || null,
      category: p.category.name || [],
      tags: p.tags || []
    }));

    // Optionally sort projects by title or a date field
    const sortedProjects = projects.sort((a, b) => a.title.localeCompare(b.title));

    console.log(sortedProjects)
    return sortedProjects
  } catch (err) {
    console.error("Error fetching projects:", err);
    return []
  }
};
*/