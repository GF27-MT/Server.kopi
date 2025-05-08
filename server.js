
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');
const app = express();

// Oversætter garnmærke til garnkategori 
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

// oversætter køn fra engelsk til dansk
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

  // Forsøger at finde en oversættelse af kønnet ved at konvertere det til små bogstaver og fjerne unødvendige mellemrum. 
  // Hvis der findes en oversættelse, returneres den; ellers returneres den oprindelige værdi af 'gender'.
  return oversættelser[gender.trim().toLowerCase()] || gender;
}

//oversætter produkttyper fra engelsk til dansk
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
  // Forsøger at finde en oversættelse af projektetype i 'oversættelser' objektet.
  // Hvis en oversættelse findes, returneres den; ellers returneres den oprindelige værdi af 'projectType'.
  return oversættelser[projectType] || projectType;
}

// Hent opskrifter fra serveren via en GET-anmodning
axios.get("https://server-kopi.onrender.com/opskrifter")
  .then(response => {
    // Gem opskrifterne, som blev hentet fra serveren
    const opskrifter = response.data;

    // Opret et sæt til at gemme unikke produkttyper
    const typer = new Set();
    // Gennemgå alle opskrifter og tilføj deres produkttype til sættet, hvis den findes
    opskrifter.forEach(o => {
      if (o.produkttype) {
        typer.add(o.produkttype); // Tilføj produkttype til sættet, hvis den eksisterer
      }
    });

    // På dette punkt er 'typer' nu et sæt med alle unikke produkttyper fra opskrifterne
  })
  .catch(error => {
    // Hvis der opstår en fejl under GET-anmodningen, vis fejlinformationen i konsollen
    console.error("Fejl ved hentning af data:", error);
  });


// Opret en ny version af garnKategoriMap, hvor alle nøgler er gjort til lowercase og trimmet
// Dette gør det muligt at sammenligne nøgler uden at være afhængig af store/små bogstaver eller mellemrum
const garnKategoriMapLower = {};
for (const key in garnKategoriMap) {
  garnKategoriMapLower[key.toLowerCase().trim()] = garnKategoriMap[key];
}

// Funktion der oversætter garnmærker til kategorier 
// Funktion der oversætter en liste af garnmærker til garnkategorier ved at bruge en map
function oversætGarnKategori(mærker) {
  // Opret et set (unik liste) for at holde styr på de oversatte kategorier
  const set = new Set();

  // Gennemgå hver garnmærke i den modtagne liste
  mærker.forEach(mærke => {
    // Trim mellemrum og konverter garnmærket til små bogstaver for at sikre korrekt sammenligning
    const clean = mærke.trim().toLowerCase();

    // Find den oversatte kategori fra 'garnKategoriMapLower' ved at bruge det rengjorte garnmærke
    const kategori = garnKategoriMapLower[clean];

    // Hvis der findes en kategori, tilføj den til sættet
    if (kategori) {
      set.add(kategori);
    } else {
      // Hvis ingen kategori findes, log en advarsel i konsollen og tilføj "Ukendt" til sættet
      console.warn("⚠️ Ukendt garnmærke:", mærke);
      set.add("Ukendt");
    }
  });

  // Konverter set til et array og returner det
  return Array.from(set);
}

// Definerer porten, som serveren skal lytte på. Hvis miljøvariablen PORT er sat (fx af en cloud-service som Heroku), bruges den.
// Hvis ikke, bruges port 3000 som standard under udvikling.
const PORT = process.env.PORT || 3000;  // Brug den dynamiske PORT eller 3000 som fallback

// Definerer URI'en til MongoDB-databasen. Hvis miljøvariablen MONGODB_URI er sat (fx på en cloud-service), bruges den.
// Hvis ikke, bruges en hardkodet URI til databasen under udvikling.
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://GryFanth:Wester1484@cluster0.pc5nf0o.mongodb.net/opskriftDB?retryWrites=true&w=majority";  // Din MongoDB URI

// Middleware
// Brug CORS middleware for at tillade cross-origin requests (f.eks. hvis frontend og backend er på forskellige domæner)
app.use(cors());

// Brug body-parser middleware for at kunne håndtere JSON data i request body'en
// Dette gør det muligt at parse JSON-data, som sendes i POST, PUT, PATCH requests
app.use(bodyParser.json());

// Mongoose model (til opskrifter)
// Definerer en Mongoose model for opskrifter, som repræsenterer opskrifterne i databasen
const Opskrift = mongoose.model('Opskrift', {
  titel: { type: String, required: true }, // Titel på opskriften (krævet)
  produkttype: { type: String, required: true }, // Type af produkt (krævet)
  kategori: String, // Kategori (kan være tom)
  garn: [String], // Liste af garn (kan være tom)
  image: String, // URL til billede af opskriften
  url: String, // Link til opskriftens hjemmeside
  fibers: [String], // Liste over fiber typer
});

// GET: Hent alle opskrifter fra databasen
app.get('/opskrifter', async (req, res) => {
  try {
    const opskrifter = await Opskrift.find(); // Hent alle opskrifter fra databasen

    // Debug: Log antallet af opskrifter
    console.log('Antal opskrifter i databasen:', opskrifter.length);

    res.json(opskrifter); // Send opskrifterne som JSON respons
  } catch (err) {
    res.status(500).json({ message: 'Fejl ved hentning af opskrifter' }); // Fejl ved hentning
  }
});

// POST: Importér opskrifter fra JSON-fil til databasen
app.post('/importer', async (req, res) => {
  try {
    // Læs opskrifterne fra JSON-filen
    const data = JSON.parse(fs.readFileSync('./opskrifter.json', 'utf8'));

    // Forbered dataene til at blive gemt i databasen
    const klarTilDatabase = data
      .filter(opskrift => opskrift.title && opskrift.project_type) // Filtrer kun opskrifter med titel og produkttype
      .map(opskrift => ({
        titel: opskrift.title,
        produkttype: opskrift.project_type,
        kategori: opskrift.gender || "Ukendt", // Hvis køn mangler, sæt til "Ukendt"
        garn: oversætGarnKategori(opskrift.yarns || []), // Oversæt garnkategorierne
        image: opskrift.image || '', // Hvis billede mangler, sæt til tom
        url: opskrift.url || '', // Hvis URL mangler, sæt til tom
        fibers: opskrift.fibers || [], // Hvis fibers mangler, sæt til tom liste
      }));

    // Ryd tidligere opskrifter fra databasen og indsæt de nye
    await Opskrift.deleteMany({});
    await Opskrift.insertMany(klarTilDatabase); // Indsæt de validerede opskrifter i databasen

    res.status(201).json({ message: 'Opskrifter importeret uden tomme!' }); // Bekræftelse på succes
  } catch (err) {
    console.error('Fejl:', err); // Log fejl i konsollen
    res.status(500).json({ message: 'Fejl ved import' }); // Fejl ved import
  }
});

// MongoDB connection
// Opretter forbindelse til MongoDB og håndterer fejl
mongoose.connect(MONGODB_URI)
  .then(async () => {

    // Læs opskrifterne fra JSON-filen
    const data = JSON.parse(fs.readFileSync('./opskrifter.json', 'utf8'));
    console.log('Antal opskrifter i JSON:', data.length); // Udskriv antal opskrifter i filen

    // Forbered dataene til at blive gemt i databasen
    const klarTilDatabase = data
      .filter(opskrift => opskrift.title && opskrift.project_type) // Filtrer opskrifter med titel og produkttype
      .map(opskrift => ({
        titel: opskrift.title,
        produkttype: oversætProjectType(opskrift.project_type), // Oversæt projekt type
        kategori: oversætGender(opskrift.gender), // Oversæt køn
        garn: oversætGarnKategori(opskrift.yarns || []), // Oversæt garnkategorierne
        image: opskrift.image || '', // Hvis billede mangler, sæt til tom
        url: opskrift.url || '', // Hvis URL mangler, sæt til tom
        fibers: opskrift.fibers || [], // Hvis fibers mangler, sæt til tom liste
      }));

    // Ryd tidligere opskrifter fra databasen og indsæt de nye
    await Opskrift.deleteMany({});
    await Opskrift.insertMany(klarTilDatabase); // Indsæt de validerede opskrifter i databasen

    // Gruppér opskrifter efter kategori (køn) og produkttype
    const opskrifter = await Opskrift.find();
    const grupperet = {};

    opskrifter.forEach(opskrift => {
      const kategori = opskrift.kategori || "Ukendt"; // Hvis kategori mangler, sæt til "Ukendt"
      const produkttype = opskrift.produkttype || "Ukendt"; // Hvis produkttype mangler, sæt til "Ukendt"

      if (!grupperet[kategori]) {
        grupperet[kategori] = new Set(); // Opret en ny kategori, hvis den ikke eksisterer
      }

      grupperet[kategori].add(produkttype); // Tilføj produkttype til den relevante kategori
    });

    console.log('✅ Opskrifter importeret!'); // Bekræftelse på succes
  })
  .then(() => console.log('🟢 Forbundet til MongoDB Atlas')) // Bekræftelse på, at forbindelsen til MongoDB er oprettet
  .catch(err => console.error('🔴 Fejl ved forbindelse til MongoDB:', err)); // Fejl ved forbindelse til MongoDB

// POST: Tilføj en ny opskrift til databasen
app.post('/opskrifter', async (req, res) => {
  try {
    // Hent data fra request body'en
    const { titel, garn, kategori, produkttype, image, url, fibers } = req.body;

    // Opret en ny opskrift
    const nyOpskrift = new Opskrift({
      titel,
      garn: garn || [], // Hvis garn mangler, sæt til tom liste
      kategori: kategori || "Ukendt", // Hvis kategori mangler, sæt til "Ukendt"
      produkttype: produkttype || "Ukendt", // Hvis produkttype mangler, sæt til "Ukendt"
      image: image || "", // Hvis billede mangler, sæt til tom
      url: url || "", // Hvis URL mangler, sæt til tom
      fibers: fibers || [], // Hvis fibers mangler, sæt til tom liste
    });

    // Gem den nye opskrift i databasen
    await nyOpskrift.save();
    res.status(201).json({ message: "Opskrift gemt i databasen!" }); // Bekræftelse på succes
  } catch (err) {
    console.error("Fejl ved indsættelse:", err); // Log fejl i konsollen
    res.status(500).json({ message: "Kunne ikke gemme opskriften." }); // Fejl ved gemning
  }
});

// Start serveren og lyt på den angivne port
app.listen(PORT, () => {
  console.log(`Server kører på http://localhost:${PORT}`); // Bekræftelse på, at serveren kører
});
