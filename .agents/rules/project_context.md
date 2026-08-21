# АРМ «Розклади» — КП «Одесміськелектротранс» (Контекст, Архітектура та Правила)

Цей документ фіксує контекст системи, правила дизайну, архітектурні рішення та статус розробки для забезпечення безперервності контексту між усіма сесіями та чекпоінтами.

---

## 1. Стек технологій та Архітектура

- **Frontend**: React 18, Vite 6, TypeScript (strict), Tailwind CSS v4, TanStack Query v5, Zustand, Lucide React, Leaflet (React-Leaflet), Sonner (Toasts).
- **Backend**: Python 3.11, FastAPI, SQLAlchemy (Async/Sync), Pydantic v2, Uvicorn, Celery/Redis.
- **Database**: PostgreSQL 15, Redis 7, Wialon GPS Telemetry Integration.
- **Containerization**: Docker Compose (`omet_frontend` на порту 80, `omet_backend` на порту 8000, `omet_postgres` на 5433, `omet_redis` на 6379, `omet_pgadmin` на 5050).

---

## 2. Дизайн-система: Преміальна Світла Тема (ОМЕТ Clean)

- **Кольорова палітра за замовчуванням**:
  - Головний фон сторінок: `bg-slate-50` / `bg-[#F8FAFC]`
  - Поверхні карток та контейнерів: `bg-white` (виключно чисто білий)
  - Рамки та розділювачі: `border-slate-200` (`#E2E8F0`)
  - Текст: `text-slate-900` (заголовки/акценти), `text-slate-700` (основний), `text-slate-500` (підписи/мета)
  - Акцентний фірмовий колір (КП «ОМЕТ»): `text-blue-600` / `bg-blue-600` / `hover:bg-blue-700` / `from-blue-600 to-indigo-600`
  - Інтерактивні ховери: `hover:bg-blue-50/80`, `hover:border-blue-400`, `hover:text-blue-700`
  - Статуси:
    - Зелений (В графіку / Успіх): `bg-emerald-50 text-emerald-800 border-emerald-200`
    - Бурштиновий (Незначне відхилення / Обід / Попередження): `bg-amber-50 text-amber-800 border-amber-200`
    - Червоний (Критичне запізнення / Аварія / Зхід / Оперативний розворот): `bg-red-50 text-red-800 border-red-200`

- **Заборонені патерни у світлій темі**:
  - ❌ Жодних темних плашок (`bg-slate-900`, `bg-slate-800`) у заголовках чи навігації світлої теми.
  - ❌ Жодних агресивних суцільних синіх фонів для блоків (синій використовується як акцент для кнопок, бейджів, рамок та ховерів).
  - ❌ Не допускати витоку `prefers-color-scheme: dark` з ОС (для цього в `src/index.css` налаштовано `@custom-variant dark (&:where(.dark, .dark *));`).

---

## 3. Доменна структура модулів

1. **Диспетчерська (`/dispatch/*`)**:
   - `LiveMapView.tsx` (`/dispatch/map`): Інтерактивна карта руху Wialon GPS + GTFS-RT геометрія.
   - `DispatcherLiveView.tsx` (`/dispatch/matrix`): CAD/AVL матриця відхилень ($\pm\Delta t$), лічильники випуску, активні розвороти, виклик оперативних скорочень (`ShortTurnModal`).
   - `OperationalGanttView.tsx` (`/dispatch/gantt`): Діаграма Ґантта фактичного руху та нарядів (05:00 — 23:00).
   - `OperationalScheduleGenerator.tsx` (`/dispatch/generator`): Оперативний генератор табелів з фізичними параметрами (довжина, швидкість, інтервал).

2. **Робочий стіл розкладів (`/planning/*`)**:
   - `ScheduleWorkspaceView.tsx`: 5 вкладок — Сітка рейсів, Конструктор змін, Гарячий резерв, Синхронізація пересадок, Duty Builder.

3. **Бригади та Водії (`/crew/*`, `/driver`)**:
   - `CrewScheduleView.tsx`, `DriverRouteBookView.tsx`, `DriverMobileTerminal.tsx`.

4. **Мережа та Конфігурація (`/network/*`, `/admin`)**:
   - `NetworkTopologyView.tsx`, `AnalyticsDashboardView.tsx`, `AuditLogView.tsx`.

---

## 4. Статус виконання спринтів

- [x] **Спринт 1 (Дизайн-система & Light Theme Bootstrap)**: 100% Завершено та затверджено.
- [x] **Спринт 2 (Frontend Диспетчерської)**: 100% Завершено (стилізація карти, матриці, ґантта, генератора).
- [ ] **Спринт 2.1 (Backend & DB Диспетчерської)**: Розширення структури бази даних, інтеграція всіх маршрутів і геометрії, наскрізне збереження.
- [ ] **Спринт 3 (Робочий стіл розкладів)**: Конструктор змін, сітка, резерв, пересадки.
- [ ] **Спринт 4 (Водії, Бригади, Адміністрування)**.
