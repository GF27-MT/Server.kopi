const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const mongoose = require('mongoose');
const axios = require('axios');
const cheerio = require('cheerio');

const app = express();
const PORT = process.env.PORT || 3000;  // Brug den dynamiske PORT eller 3000 som fallback
const MONGODB_URI = process.env.MONGODB_URI || "mongodb+srv://GryFanth:Wester1484@cluster0.pc5nf0o.mongodb.net/opskriftDB?retryWrites=true&w=majority";  // Din MongoDB URI

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect(MONGODB_URI)
  .then(() => console.log('🟢 Forbundet til MongoDB Atlas'))
  .catch(err => console.error('🔴 Fejl ved forbindelse til MongoDB:', err));

// Mongoose model (til opskrifter)
const Opskrift = mongoose.model('Opskrift', {
  titel: { type: String, required: true },
  produkttype: { type: String, required: true },
  sværhedsgrad: { type: String, default: 'Ukendt' },
  garn: [String],
  image: String,
  url: String,
  fibers: [String],
});

// GET: Hent alle opskrifter
app.get('/opskrifter', async (req, res) => {
  try {
    const opskrifter = await Opskrift.find().limit(20);
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
        sværhedsgrad: 'Ukendt',
        garn: opskrift.yarns || [],
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


// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server kører på http://0.0.0.0:${PORT}`);
});
