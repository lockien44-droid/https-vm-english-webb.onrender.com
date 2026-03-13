const animal = "elephant";
const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${animal}&prop=pageimages&format=json&pithumbsize=500&origin=*`;

fetch(url)
  .then(res => res.json())
  .then(data => {
      const pages = data.query.pages;
      const pageId = Object.keys(pages)[0];
      if (pages[pageId].thumbnail) {
          console.log("Image URL:", pages[pageId].thumbnail.source);
      } else {
          console.log("No image found");
      }
  })
  .catch(console.error);
