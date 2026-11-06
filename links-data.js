// THE UNDERWEB — link archive
// one source of truth for links.html (directory) and linksindex.html (a–z).
// add a site by adding an object. `url: '#'` renders the card as "awaiting coordinates".
//   cat:   art | curiosities | tools | forums | archives
//   added: yyyy-mm-dd (drives newest/oldest sorting)
window.UNDERWEB_CATEGORIES = {
    art:         { name: 'Digital Art',         depth: '-040m' },
    curiosities: { name: 'Digital Curiosities', depth: '-090m' },
    tools:       { name: 'Tools & Utilities',   depth: '-150m' },
    forums:      { name: 'Forums & Communities', depth: '-210m' },
    archives:    { name: 'Archives',            depth: '-300m' }
};

window.UNDERWEB_LINKS = [
    { name: 'Pixel Dreams',        url: '#', cat: 'art',         added: '2024-09-14',
      desc: 'A collective of pixel artists creating dreamlike landscapes and surreal animations.',
      tags: ['pixelart', 'animation', 'surreal'] },
    { name: 'Glitch Gallery',      url: '#', cat: 'art',         added: '2024-11-02',
      desc: 'An online exhibition space for artists exploring data corruption as an art form.',
      tags: ['glitchart', 'databending', 'digitalart'] },
    { name: 'Void Canvas',         url: '#', cat: 'art',         added: '2025-01-19',
      desc: 'Experimental net.art projects exploring the liminal spaces of the web.',
      tags: ['netart', 'experimental', 'void'] },

    { name: 'Forgotten Protocols', url: '#', cat: 'curiosities', added: '2024-06-21',
      desc: 'Archive of obsolete internet protocols and abandoned network technologies.',
      tags: ['protocols', 'retronet', 'webhistory'] },
    { name: 'Lost Web',            url: '#', cat: 'curiosities', added: '2024-03-08',
      desc: 'Collection of websites that exist in forgotten corners of the internet, untouched for decades.',
      tags: ['geocities', 'abandonware', 'webring'] },
    { name: 'Digital Ephemera',    url: '#', cat: 'curiosities', added: '2025-02-27',
      desc: 'Museum of transient digital artifacts from the early web era.',
      tags: ['webhistory', 'netnostalgia', 'artifacts'] },

    { name: 'NeoCities Navigator', url: '#', cat: 'tools',       added: '2024-08-03',
      desc: 'Discover and explore the vibrant world of independent websites on NeoCities.',
      tags: ['neocities', 'webtool', 'discovery'] },
    { name: 'Retro Web Studio',    url: '#', cat: 'tools',       added: '2024-12-11',
      desc: 'Online editor for creating websites with vintage aesthetics and old-school HTML.',
      tags: ['retrocomputing', 'webdesign', 'editor'] },
    { name: 'ASCII Art Generator', url: '#', cat: 'tools',       added: '2023-10-30',
      desc: 'Convert images into ASCII art with various styles and character sets.',
      tags: ['ascii', 'textart', 'generator'] },

    { name: 'Digital Wasteland',   url: '#', cat: 'forums',      added: '2023-07-17',
      desc: 'Community dedicated to internet archaeology and digital preservation.',
      tags: ['forum', 'preservation', 'community'] },
    { name: 'Web Obscura',         url: '#', cat: 'forums',      added: '2025-03-05',
      desc: 'Forum for sharing and discussing obscure and unusual websites.',
      tags: ['obscure', 'weird', 'discussion'] },
    { name: 'Retro Web Ring',      url: '#', cat: 'forums',      added: '2024-05-26',
      desc: 'Revival of the classic web ring concept, connecting sites with retro aesthetics.',
      tags: ['webring', 'community', 'retroweb'] }
];
