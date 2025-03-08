import { Sequelize } from 'sequelize';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, '../../server/database.sqlite');

console.log('Database path:', dbPath);
console.log('Current directory:', process.cwd());
console.log('Script directory:', __dirname);

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: dbPath,
  logging: false
});

export default sequelize; 