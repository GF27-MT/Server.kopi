
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

// Mapping af garnmærker → kategorier
const garnKategoriMap = {

  "Drops Air": "Alpaka",
  "Drops Alpaca": "Alpaka",
  "Drops Alpaca Bouclét": "Alpaka",
  "Drops Andes": "Alpaka",
  "Drops Brushed Alpaca Silk": "Alpaka",
  "Drops Flora": "Alpaka",
  "Drops Lima": "Alpaka",
  "Drops Melody": "Alpaka",
  "Drops Nepal": "Alpaka",
  "Drops Nord": "Alpaka",
  "Drops Puna": "Alpaka",
  "Drops Sky": "Alpaka",
  "Drops  Soft Tweed": "Alpaka",

  "Drops Belle": "Bomuld",
  "Drops Bomull-Lin": "Bomuld",
  "Drops Cotton Light": "Bomuld",
  "Drops Cotton Merino": "Bomuld",
  "Drops Loves You 7": "Bomuld",
  "Drops Loves You 9": "Bomuld",
  "Drops Muskat": "Bomuld",
  "Drops Paris": "Bomuld",
  "Drops Safran": "Bomuld",

  "Drops Belle": "Hør",
  "Drops Bomull-Lin": "Hør",

  "Drops Air": "Merino",
  "Drops Baby Merino": "Merino",
  "Drops Big Merino": "Merino",
  "Drops Cotton Merino": "Merino",
  "Drops Daisy": "Merino",
  "Drops Melody": "Merino",
  "Drops Merino Extra Fine": "Merino",
  "Drops Sky": "Merino",

  "Drops Kid-Silk": "Mohair",

  "Drops Brushed Alpaca Silk": "Silke",
  "Drops Kid-Silk": "Silke",

  "Drops Air": "Uld",
  "Drops Alaska": "Uld",
  "Drops Alpaca Bouclét": "Uld",
  "Drops Andes": "Uld",
  "Drops Baby Merino": "Uld",
  "Drops Big Merino": "Uld",
  "Drops Cotton Merino": "Uld",
  "Drops Daisy": "Uld",
  "Drops Fabel": "uld",
  "Drops fiesta": "Uld",
  "Drops Flora": "Uld",
  "Drops Karisma": "Uld",
  "Drops Lima": "Uld",
  "Drops Melody": "Uld",
  "Drops Merino Extra Fine": "Uld",
  "Drops Nepal": "Uld",
  "Drops Nord": "Uld",
  "Drops Polaris": "Uld",
  "Drops Puna": "Uld",
  "Drops Sky": "Uld",
  "Drops Snow": "Uld",
  "Drops Soft Tweed": "Uld",

  "Drops Glitter": "Glitter"
};

function oversætGender(gender) {
  if (!gender) return "Ukendt";

  const oversættelser = {
    men: "Mand",
    women: "Kvinde",
    home: "Hjem",
    ukendt: "Højtider",
    children: "Børn",
    "children (2-14)": "Børn (2-14 år)",
    baby: "Baby",
    "baby (0-4)": "Baby (0-4 år)",
  };

  return oversættelser[gender.trim().toLowerCase()] || gender;
}


function oversætProjectType(projectType) {
  if (!projectType) return "Ukendt";

  const oversættelser = {
    "Dresses & Tunics": "Kjoler og Tunikaer",
    "Jumpers": "Sweater",
    "Cardigans": "Cardigans",
    "Easter": "Påske",
    "Tops": "Toppe",
    "Socks & Slippers": "Strømper og Futsko",
    "Kids Room": "Børneværelse",
    "Vests & Tops": "Veste og Toppe",
    "Vests": "Veste",
    "Shirts & Blouses": "Skjorter og Bluser",
    "Pants & Shorts": "Bukser og Shorts",
    "Skirts": "Nederdele",
    "Hats": "Huer",
    "Scarves": "Tørklæder",
    "Mittens & Gloves": "Vanter og Handsker",
    "Baby Blankets": "Babytæpper",
    "Blankets": "Tæpper",
    "Unknown": "Andet",
    "Dresses & Skirts": "Kjoler og nederdele",
    "Baskets": "kurve",
    "Newborn Sets": "Hentesæt",
    "Trousers & Shorts": "Bukser og shorts",
    "Washcloths": "Karklude",
    "Egg Warmers": "Æggevarmer",
    "Bunting Bags": "Køreposer",
    "Socks & Booties": "Strømper og Støvler",
    "Shawls": "Sjaler",
    "Ponchos": "Ponchoer",
    "Ornaments & Decor": "Dekorationer",
    "Potholders & Trivets": "Gryddelapper o.lign.",
    "Pets": "Kæledyr",
    "Rompers & Onesies": "Sparkedragter o.lign",
    "Bikinis": "Bikinier",
    "Coasters & Placemats": "Glasunderlag o.lign.",
    "Pillows & Cushions": "Puder og Puffer",
    "Seat Pads": "Siddeunderlag",
    "Trousers & Overalls": "Bukser og Overalls",
    "Bookmarks": "Bogmærker",
    "Christmas": "Jul",
    "Carpets": "Tæpper",
    "Covers": "Betræk",
    "Halloween & Carnival": "Halloween og Karnival",
    "Decorative Flowers": "Dekorative Blomster"

  };

  return oversættelser[projectType] || projectType;
}

function sortByLengthPattern(array) {
  const sorted = [...array].sort((a, b) => a.length - b.length);

  const total = sorted.length;
  const chunkSize = Math.ceil(total / 3);

  const short = sorted.slice(0, chunkSize);
  const medium = sorted.slice(chunkSize, 2 * chunkSize);
  const long = sorted.slice(2 * chunkSize);

  const result = [];

  for (let i = 0; i < total; i++) {
    if (short.length) result.push(short.shift());
    if (medium.length) result.push(medium.shift());
    if (long.length) result.push(long.shift());
  }

  return result;
}



axios.get("https://server-kopi.onrender.com/opskrifter")
  .then(response => {
    const opskrifter = response.data;

    const typer = new Set();
    opskrifter.forEach(o => {
      if (o.produkttype) {
        typer.add(o.produkttype);
      }
    });

    console.log("Produkttyper:");
    console.log([...typer]);
  })
  .catch(error => {
    console.error("Fejl ved hentning af data:", error);
  });


// Lav en lowercase-version af garnKategoriMap (kør kun én gang)
const garnKategoriMapLower = {};
for (const key in garnKategoriMap) {
  garnKategoriMapLower[key.toLowerCase().trim()] = garnKategoriMap[key];
}

// Funktion der oversætter mærker til kategorier (med rensning)
function oversætGarnKategori(mærker) {
  const set = new Set();

  mærker.forEach(mærke => {
    const clean = mærke.trim().toLowerCase();
    const kategori = garnKategoriMapLower[clean];

    if (kategori) {
      set.add(kategori);
    } else {
      console.warn("⚠️ Ukendt garnmærke:", mærke);
      set.add("Ukendt");
    }
  });

  return Array.from(set);
}

const app = express();
const PORT = process.env.PORT || 3000;  // Brug den dynamiske PORT eller 3000 som fallback
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://GryFanth:Wester1484@cluster0.pc5nf0o.mongodb.net/opskriftDB?retryWrites=true&w=majority";  // Din MongoDB URI

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Mongoose model (til opskrifter)
const Opskrift = mongoose.model('Opskrift', {
  titel: { type: String, required: true },
  produkttype: { type: String, required: true },
  kategori: String,
  garn: [String],
  image: String,
  url: String,
  fibers: [String],
});

// GET: Hent alle opskrifter
app.get('/opskrifter', async (req, res) => {
  try {
    const opskrifter = await Opskrift.find().limit(4168);
    res.json(opskrifter);
  } catch (err) {
    res.status(500).json({ message: 'Fejl ved hentning af opskrifter' });
  }
});

app.post('/importer', async (req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync('./opskrifter.json', 'utf8'));

    const klarTilDatabase = data
      .filter(opskrift => opskrift.title && opskrift.project_type)
      .map(opskrift => ({
        titel: opskrift.title,
        produkttype: opskrift.project_type,
        kategori: opskrift.gender || "Ukendt", // ← HER
        garn: oversætGarnKategori(opskrift.yarns || []),
        image: opskrift.image || '',
        url: opskrift.url || '',
        fibers: opskrift.fibers || [],
      }));

    await Opskrift.deleteMany({});
    await Opskrift.insertMany(klarTilDatabase);

    res.status(201).json({ message: 'Opskrifter importeret uden tomme!' });
  } catch (err) {
    console.error('Fejl:', err);
    res.status(500).json({ message: 'Fejl ved import' });
  }
});

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(async () => {

    const data = JSON.parse(fs.readFileSync('./opskrifter.json', 'utf8'));
    console.log('Antal opskrifter i JSON:', data.length);


    const klarTilDatabase = data
      .filter(opskrift => opskrift.title && opskrift.project_type)
      .map(opskrift => ({
        titel: opskrift.title,
        produkttype: oversætProjectType(opskrift.project_type),
        kategori: oversætGender(opskrift.gender),
        garn: oversætGarnKategori(opskrift.yarns || []),
        image: opskrift.image || '',
        url: opskrift.url || '',
        fibers: opskrift.fibers || [],
      }));

    await Opskrift.deleteMany({});
    await Opskrift.insertMany(klarTilDatabase);

    // Gruppér og udskriv produkttyper efter kategori (køn)
    const opskrifter = await Opskrift.find();
    const grupperet = {};

    opskrifter.forEach(opskrift => {
      const kategori = opskrift.kategori || "Ukendt";
      const produkttype = opskrift.produkttype || "Ukendt";

      if (!grupperet[kategori]) {
        grupperet[kategori] = new Set();
      }

      grupperet[kategori].add(produkttype);
    });

    console.log("📦 Produkttyper pr. kategori (køn):");
    for (const kategori in grupperet) {
      const sorteretTyper = sortByLengthPattern([...grupperet[kategori]]);
      const typerMedAnførselstegn = sorteretTyper.map(type => `"${type}"`);
      console.log(`- ${kategori}: ${typerMedAnførselstegn.join(", ")}`);
    }    
    
    console.log('✅ Opskrifter importeret!');
  })
  .then(() => console.log('🟢 Forbundet til MongoDB Atlas'))
  .catch(err => console.error('🔴 Fejl ved forbindelse til MongoDB:', err));




// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server kører på http://0.0.0.0:${PORT}`);
});
