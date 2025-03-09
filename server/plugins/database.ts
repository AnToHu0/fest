import { initDatabase } from '../database';

export default defineNitroPlugin(async () => {
  try {
    await initDatabase();
    console.log('База данных успешно инициализирована при старте сервера');
  } catch (error) {
    console.error('Ошибка при инициализации базы данных:', error);
  }
}); 