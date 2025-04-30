const mongoose = require('mongoose');
const fs = require('fs');

const MONGODB_URI = 'mongodb+srv://GryFanth:Wester1484@cluster0.pc5nf0o.mongodb.net/opskriftDB?retryWrites=true&w=majority';

const Opskrift = mongoose.model('Opskrift', {
  titel: { type: String, required: true },
  produkttype: { type: String, required: true },
  sværhedsgrad: { type: String, default: 'Ukendt' },
  garn: [String],
  image: String,
  url: String,
  fibers: [String],
});

mongoose.connect(MONGODB_URI)
  .then(async () => {
    console.log('🟢 Forbundet til MongoDB');

    const data = JSON.parse(fs.readFileSync('./opskrifter.json', 'utf8'));
    console.log('Antal opskrifter i JSON:', data.length);
    console.log('Første opskrift:', data[0]);

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

    console.log('✅ Opskrifter importeret!');
    mongoose.disconnect();
  })
  .catch(err => {
    console.error('❌ Fejl:', err);
  });
