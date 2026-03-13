const sourceText = 'follow';
const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=en&tl=vi&dt=t&dt=bd&q=${encodeURIComponent(sourceText)}`;
fetch(url).then(res => res.json()).then(data => {
  console.log(JSON.stringify(data, null, 2));
});
