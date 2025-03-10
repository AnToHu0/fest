# Дизайн системы
Система предназначена для управления фестивалями, пользователями и их размещением. Она включает в себя функциональность для регистрации пользователей, управления фестивалями, департаментами и размещением.

# Архитектурный паттерн
Используется паттерн MVC (Model-View-Controller) для разделения логики приложения, пользовательского интерфейса и управления данными.

# Управление состоянием
Состояние приложения управляется с помощью Pinia для централизованного хранения данных и управления состоянием.

# Поток данных
Данные поступают от пользователя через формы, обрабатываются на сервере и сохраняются в базе данных. Обновления данных отображаются в реальном времени на клиенте.

# Технический стек
- Frontend: Nuxt.js, Tailwind css, TypeScript
- Backend: Nuxt.js
- База данных: sqlite с использованием Sequelize
- Управление состоянием: Pinia

# Процесс аутентификации
Аутентификация пользователей осуществляется через форму входа с подтверждением электронной почты. После регистрации пользователь получает письмо для подтверждения. Есть возможность сброса пароля.

# Дизайн маршрутов
- Главная страница: отображает логотип и форму авторизации/регистрации/сброса пароля.
- Личный кабинет: доступен после авторизации, содержит разделы в зависимости от роли пользователя: Управление пользователями, фестивалями, департаментами и размещением: доступно для администраторов и менеджеров. Личный кабинет включает в себя подстраницы.

# Дизайн API
API предоставляет доступ к функциональности управления пользователями, фестивалями и размещением. Для работы с API исплользуется встроенный механизм Nuxt.js

# Дизайн базы данных (ERD)
- Пользователи: хранит информацию о пользователях, включая роли и привязку детей.
- Фестивали: хранит информацию о фестивалях, включая даты и доступные корпуса.
- Размещение: хранит информацию о размещении пользователей на фестивалях.
- Платежи: хранит информацию о платежах пользователей.
- Комнаты: хранит информацию о комнатах
