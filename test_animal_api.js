const page = Math.floor(Math.random() * 1000) + 1;
// taxon_id=1 means Animalia
const url = `https://api.inaturalist.org/v1/observations?photos=true&taxon_id=1&quality_grade=research&per_page=1&page=${page}`;

fetch(url)
  .then(res => res.json())
  .then(data => {
      const obs = data.results[0];
      if (obs && obs.taxon && obs.photos && obs.photos.length > 0) {
          const scientificName = obs.taxon.name;
          const commonNameEn = obs.taxon.preferred_common_name;
          let imageUrl = obs.photos[0].url.replace('square', 'medium'); // Get higher res image
          
          console.log('Scientific Name:', scientificName);
          console.log('Common Name (EN):', commonNameEn);
          console.log('Image URL:', imageUrl);
      } else {
          console.log('No valid data found');
      }
  })
  .catch(err => console.error(err));
