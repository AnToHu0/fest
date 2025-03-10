import { defineEventHandler, createError, getQuery } from 'h3';
import { getServerSession } from '#auth';
import { PaymentTransaction } from '~/server/models/PaymentTransaction';
import { User } from '~/server/models/User';
import { Festival } from '~/server/models/Festival';
import { Op, Order } from 'sequelize';
import sequelize from '~/server/database';

export default defineEventHandler(async (event) => {
  try {
    // Проверяем авторизацию
    const session = await getServerSession(event);
    if (!session?.user) {
      throw createError({
        statusCode: 401,
        message: 'Необходима авторизация'
      });
    }

    // Проверяем роль администратора
    if (!session.user.roles?.includes('admin')) {
      throw createError({
        statusCode: 403,
        message: 'Недостаточно прав'
      });
    }

    // Получаем параметры запроса
    const query = getQuery(event);
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 10;
    const offset = (page - 1) * limit;
    const searchField = query.searchField as string;
    const festivalId = Number(query.festivalId);
    const managerId = Number(query.managerId);
    const paymentDest = query.paymentDest as string;
    const sortField = query.sortField || 'date';
    const sortOrder = query.sortOrder === 'desc' ? 'DESC' : 'ASC';

    // Формируем условия поиска
    const whereConditions: any = {};
    
    // Если указан ID фестиваля, добавляем его в условия
    if (festivalId) {
      whereConditions.festivalId = festivalId;
    }

    // Если указан ID менеджера, добавляем его в условия
    if (managerId) {
      whereConditions.adminId = managerId;
    }

    // Если указано назначение платежа, добавляем его в условия
    if (paymentDest) {
      whereConditions.paymentDest = paymentDest;
    }

    // Если есть поисковый запрос, ищем по имени или телефону пользователя
    if (searchField) {
      const searchValue = searchField.toLowerCase();
      whereConditions[Op.and] = [{
        [Op.or]: [
          { '$User.searchField$': { [Op.like]: `%${searchValue}%` } },
          { '$User.phone$': { [Op.like]: `%${searchField}%` } }
        ]
      }];
    }

    // Получаем список менеджеров, которые обрабатывали платежи
    const uniqueAdminIds = await PaymentTransaction.findAll({
      attributes: [
        [sequelize.fn('DISTINCT', sequelize.col('adminId')), 'adminId']
      ],
      where: sequelize.where(
        sequelize.col('adminId'),
        { [Op.ne]: null }
      ),
      raw: true
    });

    const managers = await User.findAll({
      attributes: ['id', 'fullName'],
      where: {
        id: {
          [Op.in]: uniqueAdminIds.map(admin => admin.adminId)
        }
      },
      order: [['fullName', 'ASC']],
      raw: true
    });

    // Определяем поле для сортировки
    const orderArray: Order = [];
    
    if (sortField === 'user') {
      orderArray.push(['User', 'fullName', sortOrder]);
    } else if (sortField === 'amount') {
      orderArray.push(['amount', sortOrder]);
    } else {
      orderArray.push(['date', sortOrder]);
    }

    // Получаем платежи с пагинацией и всеми связанными данными
    const { rows: payments, count } = await PaymentTransaction.findAndCountAll({
      where: whereConditions,
      include: [
        {
          model: User,
          as: 'User',
          attributes: ['id', 'fullName', 'phone']
        },
        {
          model: User,
          as: 'Registrator',
          attributes: ['id', 'fullName']
        },
        {
          model: Festival,
          as: 'Festival',
          attributes: ['id', 'year']
        }
      ],
      order: orderArray,
      limit,
      offset,
      distinct: true
    });

    return {
      success: true,
      payments,
      managers,
      pagination: {
        total: count,
        page,
        limit,
        totalPages: Math.ceil(count / limit)
      }
    };
  } catch (error: any) {
    console.error('Ошибка при получении платежей:', error);
    throw createError({
      statusCode: error.statusCode || 500,
      message: error.message || 'Ошибка при получении платежей'
    });
  }
}); 