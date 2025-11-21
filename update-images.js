const Database = require('better-sqlite3');
const db = new Database('florist.db');

const updates = [
  { name: 'Роза белая', url: '/white_rose_elegant_f_10c0d59a.jpg' },
  { name: 'Тюльпан черный', url: '/black_tulip_flower_be52fdd6.jpg' },
  { name: 'Лилия белая', url: '/white_lily_flower_d9bb2678.jpg' },
  { name: 'Орхидея', url: '/orchid_flower_elegan_b61ea98d.jpg' },
  { name: 'Пион белый', url: '/white_peony_flower_4c85e244.jpg' },
  { name: 'Гортензия', url: '/hydrangea_flower_54c17b2c.jpg' },
  { name: 'Каллы', url: '/calla_lily_white_flo_a6578f9c.jpg' },
  { name: 'Хризантема', url: '/chrysanthemum_flower_df2a651c.jpg' }
];

const updateStmt = db.prepare('UPDATE flowers SET image_url = ? WHERE name = ?');

updates.forEach(({ name, url }) => {
  updateStmt.run(url, name);
  console.log(`Updated ${name}`);
});

console.log('All images updated successfully!');
db.close();
