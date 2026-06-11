import { useState, useEffect, useCallback } from "react";

// ─── ТИПЫ ────────────────────────────────────────────────────────────────────

interface GameState {
  screen: "menu" | "game" | "result";
  round: number;
  dilemma: number;
  budget: number;
  hse: number;
  schedule: number;
  log: LogEntry[];
  pendingPenalty: PendingPenalty | null;
  gameOver: boolean;
  choiceHistory: boolean[];
}

interface LogEntry {
  id: number;
  text: string;
  type: "safe" | "unsafe" | "penalty" | "bonus" | "info";
  emoji: string;
}

interface PendingPenalty {
  text: string;
  budgetDelta: number;
  scheduleDelta: number;
  hseDelta: number;
  emoji: string;
  image?: string;
}

interface Choice {
  label: string;
  tag: string;
  safe: boolean;
  budgetDelta: number;
  scheduleDelta: number;
  hseDelta: number;
  result: string;
  resultEmoji: string;
  resultImage?: string;
  pendingPenalty?: PendingPenalty;
}

interface Dilemma {
  title: string;
  description: string;
  situation: string;
  image?: string;
  choices: Choice[];
}

interface Round {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  dilemmas: Dilemma[];
}

// ─── ИГРОВЫЕ ДАННЫЕ ───────────────────────────────────────────────────────────

const ROUNDS: Round[] = [
  {
    id: 1,
    title: "Котлован",
    subtitle: "Земляные работы",
    icon: "🏗️",
    dilemmas: [
      {
        title: "Откосы котлована плывут",
        situation: "Ситуация 1 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/8874c1cc-4f4b-48c4-a381-c838fc376875.jpg",
        description:
          'После трёх дней дождей откосы котлована начали сползать. Прораб Петрович смотрит на это философски: "Земля — она живая, начальник". Подрядчик предлагает продолжить копку без шпунтового ограждения, сэкономив 800 тыс. руб. и 3 дня.',
        choices: [
          {
            label: "Продолжить без шпунта",
            tag: "Авось пронесёт",
            safe: false,
            budgetDelta: 3,
            scheduleDelta: 5,
            hseDelta: -15,
            result:
              'Сэкономили! Петрович доволен. Но на следующий день откос сполз прямо на экскаватор. Михалыч цел (чудо), экскаватор — нет. Штраф Ростехнадзора, аварийное восстановление и простой бригады обошлись втрое дороже.',
            resultEmoji: "💸",
            resultImage: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/017a5b53-6fa3-4da4-9d71-19738d52bdc8.jpg",
            pendingPenalty: {
              text: "Откос сполз на экскаватор Михалыча. Аварийное восстановление, штраф Ростехнадзора, простой бригады 5 дней.",
              budgetDelta: -12,
              scheduleDelta: -10,
              hseDelta: -10,
              emoji: "🚨",
              image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/017a5b53-6fa3-4da4-9d71-19738d52bdc8.jpg",
            },
          },
          {
            label: "Установить шпунтовое ограждение",
            tag: "По регламенту",
            safe: true,
            budgetDelta: -5,
            scheduleDelta: -3,
            hseDelta: 8,
            result:
              "Потратили 800 тыс. и 3 дня. Зато котлован стабилен, Михалыч копает уверенно, инспектор приехал с проверкой и написал в акте «молодцы». HSE-культура растёт, следующий подрядчик придёт уже с корочками.",
            resultEmoji: "✅",
          },
        ],
      },
      {
        title: "Кабель под землёй",
        situation: "Ситуация 2 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/27fc3439-c20b-4e86-9111-df67c1870503.jpg",
        description:
          'Экскаваторщик Михалыч копает в зоне прохождения кабеля высокого напряжения. Схемы коммуникаций "где-то есть, но их ищут". Подрядчик успокаивает: "Да мы всегда так копаем, чуйка у Михалыча отменная, 20 лет на машине."',
        choices: [
          {
            label: 'Копать "на ощупь"',
            tag: "Михалыч не подведёт",
            safe: false,
            budgetDelta: 2,
            scheduleDelta: 3,
            hseDelta: -20,
            result:
              'Михалыч нашёл кабель. Ковшом. Взрыв дуги, авария в энергосистеме района. Три улицы без света на 8 часов. Михалыч жив — защитная дуга ушла в землю. Но иск от электросетей и штраф...',
            resultEmoji: "⚡",
            resultImage: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/d28eaa6b-5be4-41d5-bf1a-32c49e56c8b6.jpg",
            pendingPenalty: {
              text: "Повреждение кабеля ВН. Иск от энергосетей, штраф, простой + оплата аварийной бригады электриков.",
              budgetDelta: -18,
              scheduleDelta: -8,
              hseDelta: -15,
              emoji: "⚡",
              image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/d28eaa6b-5be4-41d5-bf1a-32c49e56c8b6.jpg",
            },
          },
          {
            label: "Вызвать геодезиста, получить ситплан",
            tag: "Без сюрпризов",
            safe: true,
            budgetDelta: -3,
            scheduleDelta: -2,
            hseDelta: 10,
            result:
              "Геодезист нашёл кабель в 40 см от маршрута Михалыча. Копаем объездным путём. Дополнительные 2 дня и 200 тыс. — но Михалыч цел, и энергосеть тоже. Бонус: инвестор узнал — впечатлён профессионализмом.",
            resultEmoji: "🗺️",
          },
        ],
      },
      {
        title: "Украли ограждение котлована",
        situation: "Ситуация 3 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/1a40cea8-09eb-4305-9f16-c4cd84e871ce.jpg",
        description:
          'Ночью местные дачники разобрали временное ограждение котлована "на нужды хозяйства". Рядом тротуар, по которому ходят люди. Котлован 6 метров глубиной. Прораб предлагает растянуть сигнальную ленточку и "повесить таблички".',
        choices: [
          {
            label: "Ленточка и таблички — норм",
            tag: "И так сойдёт",
            safe: false,
            budgetDelta: 1,
            scheduleDelta: 1,
            hseDelta: -25,
            result:
              'Ленточку не заметила бабушка Нина с пакетами. Упала в котлован. Выжила, но перелом. Уголовное дело на прораба, приостановка стройки. "Так сойдёт" обошлось в 15 раз дороже нового забора.',
            resultEmoji: "🚑",
            pendingPenalty: {
              text: "Несчастный случай с посторонним лицом. Уголовное дело, приостановка стройки, компенсация пострадавшей, репутационный ущерб.",
              budgetDelta: -25,
              scheduleDelta: -20,
              hseDelta: -20,
              emoji: "🚔",
            },
          },
          {
            label: "Новый забор + ЧОП на ночь",
            tag: "Безопасность прежде всего",
            safe: true,
            budgetDelta: -4,
            scheduleDelta: 0,
            hseDelta: 12,
            result:
              "Поставили нормальный забор за ночь, наняли охранника. Дачники больше не приходят. Инспектор труда при плановой проверке отметил «образцовое ограждение». График не пострадал — работы продолжались.",
            resultEmoji: "🛡️",
          },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "Монолит",
    subtitle: "Монолитный каркас",
    icon: "🏢",
    dilemmas: [
      {
        title: "Зима. 12 этаж без ограждений",
        situation: "Ситуация 1 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/a8572619-af6f-47a5-9552-8e5c05df442a.jpg",
        description:
          "Зима, -15°C, ветер. На 12 этаже не установлены ветрозащита и ограждения лифтовых шахт. Бригада монолитчиков отказывается выходить без страховочных привязей. Генподрядчик кричит в трубку: «Заливка бетона через 2 часа или штраф за простой!»",
        choices: [
          {
            label: "Заставить выйти, залить бетон",
            tag: "Сроки дороже",
            safe: false,
            budgetDelta: 5,
            scheduleDelta: 8,
            hseDelta: -25,
            result:
              "Бетон залили. Арматурщик Джамал поскользнулся у шахты лифта. Успел схватиться. Не упал, но порвал сухожилие. «Производственная травма» — это уже уголовка для прораба и остановка объекта на проверку.",
            resultEmoji: "🩹",
            pendingPenalty: {
              text: "Производственная травма. Следственный комитет, остановка объекта на 2 недели, штраф, компенсация работнику.",
              budgetDelta: -20,
              scheduleDelta: -18,
              hseDelta: -15,
              emoji: "🚨",
            },
          },
          {
            label: "Установить ограждения, дать привязи",
            tag: "Люди важнее бетона",
            safe: true,
            budgetDelta: -4,
            scheduleDelta: -5,
            hseDelta: 15,
            result:
              "Потеряли полдня на установку ограждений. Зато бригада вышла уверенно, бетон залили качественно без спешки. Джамал спел что-то народное — значит, доволен. HSE-офицер занёс в реестр «образцовой практики».",
            resultEmoji: "🏆",
          },
        ],
      },
      {
        title: "Кран несёт арматуру над бытовкой",
        situation: "Ситуация 2 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/b2d68e71-9450-4dbc-a51d-c51c0f82f95c.jpg",
        description:
          "Башенный кран переносит пачку арматуры весом 2 тонны прямо над крышей бытового городка, где 15 прорабов обедают борщом. Крановщик говорит: «Да я так всегда делаю, ни разу не ронял». Перенос городка — 1 день и 200 тыс. руб.",
        choices: [
          {
            label: "Пусть несёт как есть",
            tag: "Ни разу не ронял",
            safe: false,
            budgetDelta: 2,
            scheduleDelta: 2,
            hseDelta: -20,
            result:
              "Стропа лопнула. 2 тонны арматуры упали в 3 метрах от бытовки. Прорабы живы — успели выбежать на шум. Но бытовка всмятку. Теперь придётся покупать новую и объяснять инспектору, почему «ни разу не ронял» не является методом оценки риска.",
            resultEmoji: "💥",
            pendingPenalty: {
              text: "Падение груза. Уничтожен бытовой городок, приостановка работы крана на расследование, покупка нового модуля.",
              budgetDelta: -15,
              scheduleDelta: -12,
              hseDelta: -12,
              emoji: "💥",
            },
          },
          {
            label: "Перенести бытовой городок",
            tag: "Зона безопасности",
            safe: true,
            budgetDelta: -3,
            scheduleDelta: -1,
            hseDelta: 10,
            result:
              "Городок перенесли за день. Прорабы поворчали, но согласились. Крановщик теперь работает по утверждённым маршрутам. Через неделю та самая стропа лопнула — арматура упала на пустое место. Все живы. Все довольны.",
            resultEmoji: "🙏",
          },
        ],
      },
      {
        title: "Каменщик без каски",
        situation: "Ситуация 3 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/21a3a872-adf2-4db2-86b5-e8a6d9450f06.jpg",
        description:
          "Инспектор ОТ поймал каменщика Ваню без каски на 8 этаже. Ваня объясняет: «Каска давит на чакры и мешает творческому потоку. Я 30 лет кладу без каски — и ничего.» Выбор: жёсткий штраф всей бригаде или провести задушевный разговор (ПАБ)?",
        choices: [
          {
            label: "Оштрафовать всю бригаду жёстко",
            tag: "Закон суров",
            safe: false,
            budgetDelta: -2,
            scheduleDelta: -3,
            hseDelta: -5,
            result:
              "Бригада обиделась коллективно. Ваня написал жалобу в трудовую инспекцию «на самодурство». Инспекция приехала с проверкой и нашла ещё 12 нарушений, которые никто не замечал. Штраф вышел куда больше.",
            resultEmoji: "😤",
            pendingPenalty: {
              text: "Жалоба в ГИТ. Внеплановая проверка выявила 12 нарушений. Штраф за каждое.",
              budgetDelta: -8,
              scheduleDelta: -5,
              hseDelta: -8,
              emoji: "📋",
            },
          },
          {
            label: "Провести ПАБ — поговорить по душам",
            tag: "Культура важнее штрафа",
            safe: true,
            budgetDelta: -1,
            scheduleDelta: 0,
            hseDelta: 20,
            result:
              "Инспектор ОТ сел с Ваней за чай, показал фотографии черепно-мозговых травм на стройках. Ваня надел каску. Через неделю сам напоминал коллегам. Ваня теперь ходит в каске и говорит, что «чакры встали на место».",
            resultEmoji: "🤝",
          },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "Отделка",
    subtitle: "Внутренняя отделка и сети",
    icon: "🔧",
    dilemmas: [
      {
        title: "Щиток из картона и надежды",
        situation: "Ситуация 1 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/8a30a071-2c63-4fe6-b7e0-40487457e3f4.jpg",
        description:
          "Электрик Серёга соорудил временный распределительный щиток из картонной коробки, изоленты и «чистой совести». От него запитаны 10 перфораторов одновременно. Коробка тёплая на ощупь. Серёга говорит: «Нормально, я её ногой придерживаю для надёжности».",
        choices: [
          {
            label: "Пусть стоит, работают же",
            tag: "Работает — не трогай",
            safe: false,
            budgetDelta: 1,
            scheduleDelta: 2,
            hseDelta: -20,
            result:
              "Коробка загорелась в 23:00. Серёга ушёл домой в 18:00. Пожар уничтожил отделку трёх квартир на этаже. Страховая отказала — «несоблюдение норм пожарной безопасности». Серёга искренне удивлён.",
            resultEmoji: "🔥",
            pendingPenalty: {
              text: "Пожар из-за самодельного щитка. Уничтожена отделка 3 квартир, отказ страховой, штраф пожарной инспекции.",
              budgetDelta: -22,
              scheduleDelta: -15,
              hseDelta: -15,
              emoji: "🚒",
            },
          },
          {
            label: "Заменить на ГОСТ-щиток за день",
            tag: "Нормы — не для галочки",
            safe: true,
            budgetDelta: -2,
            scheduleDelta: -1,
            hseDelta: 12,
            result:
              "Потратили день и 50 тыс. руб. Серёга обиделся, но смирился. Новый щиток с автоматами, заземлением и маркировкой. Пожарный инспектор при проверке написал «годится».",
            resultEmoji: "⚡",
          },
        ],
      },
      {
        title: "Костёр в пентхаусе",
        situation: "Ситуация 2 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/613b7d7b-7a57-4cec-9ac5-1787cc6d77e4.jpg",
        description:
          "Маляры Гиви и Нодар жгут костёр в металлическом ведре прямо в будущей пентхаус-квартире на 24 этаже. Цель благородная — согреться и подсушить штукатурку. Вентиляция ещё не работает. Дым клубится по коридорам. «Зато сохнет быстро, начальник!»",
        choices: [
          {
            label: "Пусть греются, работа идёт",
            tag: "Инициатива снизу",
            safe: false,
            budgetDelta: 1,
            scheduleDelta: 3,
            hseDelta: -22,
            result:
              "Угарный газ. Гиви потерял сознание, Нодар успел вытащить. «Скорая», госпитализация. Следователь осматривает место. Штукатурка высохла — это правда. Но теперь надо объяснить, почему на объекте жгли костры без вентиляции.",
            resultEmoji: "😶",
            pendingPenalty: {
              text: "Отравление угарным газом. Госпитализация 2 рабочих, уголовное дело по охране труда, приостановка объекта.",
              budgetDelta: -20,
              scheduleDelta: -14,
              hseDelta: -18,
              emoji: "🏥",
            },
          },
          {
            label: "Тепловые пушки + временная вентиляция",
            tag: "Тепло без дыма",
            safe: true,
            budgetDelta: -3,
            scheduleDelta: -1,
            hseDelta: 12,
            result:
              "Арендовали 2 тепловые пушки и пробросили временный воздуховод. Гиви и Нодар довольны — тепло без дыма. Штукатурка сохнет равномернее, качество лучше. Гиви рассказал всем коллегам, что «здесь по-человечески».",
            resultEmoji: "♨️",
          },
        ],
      },
      {
        title: "Мусор на путях эвакуации",
        situation: "Ситуация 3 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/e34e9fca-7f27-48ea-b497-3483bbb81780.jpg",
        description:
          "Пути эвакуации завалены строительным мусором — обрезки гипсокартона, мешки из-под смеси, поддоны. Подрядчик успокаивает: «Вывезем всё в конце месяца, людей лишних нет». Послезавтра плановая проверка Стройнадзора.",
        choices: [
          {
            label: "Пусть лежит до конца месяца",
            tag: "Потом вывезем",
            safe: false,
            budgetDelta: 1,
            scheduleDelta: 1,
            hseDelta: -15,
            result:
              "Стройнадзор пришёл на день раньше. Инспектор сфотографировал всё детально. Выдано предписание, стройка остановлена на 3 дня до устранения. «В конце месяца» обошлось в 10 раз дороже срочного вывоза.",
            resultEmoji: "📸",
            pendingPenalty: {
              text: "Предписание Стройнадзора. Остановка стройки на 3 дня, штраф за нарушение требований пожарной безопасности.",
              budgetDelta: -10,
              scheduleDelta: -8,
              hseDelta: -10,
              emoji: "🛑",
            },
          },
          {
            label: "Срочный вывоз мусора сегодня",
            tag: "Чистота — сестра порядка",
            safe: true,
            budgetDelta: -2,
            scheduleDelta: -1,
            hseDelta: 10,
            result:
              "Вывезли мусор за вечер, вызвали 2 машины. Стройнадзор пришёл, посмотрел, написал «удовлетворительно». Один из инспекторов заметил: «Редко вижу такое на объекте». Репутация растёт.",
            resultEmoji: "🧹",
          },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "Финал",
    subtitle: "Фасад, мойка окон и сдача",
    icon: "🏁",
    dilemmas: [
      {
        title: "Альпинисты с просроченными корочками",
        situation: "Ситуация 1 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/b12d4229-db41-4397-b8d7-cc1f35ceb88c.jpg",
        description:
          "Клининговый подрядчик пригнал промышленных альпинистов для финальной мойки окон. Проблема: удостоверения просрочены у троих, а верёвки закреплены за вентиляционные грибки на крыше (SWL: 50 кг, альпинист: 90 кг). Завтра визит Инвестора и приёмочная комиссия.",
        choices: [
          {
            label: "Мыть окна сегодня, всё равно",
            tag: "Инвестор не ждёт",
            safe: false,
            budgetDelta: 2,
            scheduleDelta: 5,
            hseDelta: -30,
            result:
              "Грибок вырвало. Альпинист Алексей упал с 18 этажа. Выжил — зацепился за леса на 12. Сломал ноги. Уголовное дело. Инвестор не просто не приехал — он расторг договор. Окна чистые. Всё остальное нет.",
            resultEmoji: "😱",
            pendingPenalty: {
              text: "Падение промышленного альпиниста. Тяжёлые травмы, уголовное дело, расторжение договора с инвестором.",
              budgetDelta: -35,
              scheduleDelta: -30,
              hseDelta: -25,
              emoji: "⚖️",
            },
          },
          {
            label: "Отложить, найти нормальных альпинистов",
            tag: "Жизнь важнее графика",
            safe: true,
            budgetDelta: -3,
            scheduleDelta: -3,
            hseDelta: 15,
            result:
              "Перенесли визит на 2 дня, нашли сертифицированную бригаду с анкерными точками. Окна блестят. Инвестор приехал, увидел — «профессионалы!». Сделка закрыта. Алексей работает на другом объекте — живой и здоровый.",
            resultEmoji: "✨",
          },
        ],
      },
      {
        title: "Салют во дворе стройки",
        situation: "Ситуация 2 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/56332068-3f1d-405e-8ebf-9ec0a69c0605.jpg",
        description:
          "Торжественное открытие ЖК. Инвестор Аркадий Борисович хочет запустить профессиональный салют прямо во дворе, где ещё стоит строительная техника, лежат материалы и есть незакрытые недоделки. «Я за всё плачу, хочу эффектно!»",
        choices: [
          {
            label: "Дать добро, инвестор хочет",
            tag: "Клиент всегда прав",
            safe: false,
            budgetDelta: 0,
            scheduleDelta: 0,
            hseDelta: -20,
            result:
              "Искра от салюта попала в бытовку с остатками ЛКМ. Пожар. Техника обгорела. Аркадий Борисович смотрел на это с видом человека, который не ожидал такого поворота. Страховая смеётся.",
            resultEmoji: "🎆",
            pendingPenalty: {
              text: "Пожар от салюта на незачищенной стройплощадке. Уничтожена техника и материалы, страховая отказала.",
              budgetDelta: -18,
              scheduleDelta: -10,
              hseDelta: -15,
              emoji: "🔥",
            },
          },
          {
            label: "Салют только после расчистки двора",
            tag: "Праздник без последствий",
            safe: true,
            budgetDelta: -2,
            scheduleDelta: -1,
            hseDelta: 10,
            result:
              "Попросили Аркадия Борисовича подождать 4 часа — убрали технику, вывезли остатки материалов. Салют был великолепен. Аркадий Борисович растрогался. Фото разошлись по соцсетям с хэштегом «безопасный праздник».",
            resultEmoji: "🎊",
          },
        ],
      },
      {
        title: "Неиспользованный бюджет на безопасность",
        situation: "Ситуация 3 из 3",
        image: "https://cdn.poehali.dev/projects/a0e25bcd-99a5-4ccf-ba65-51a3b8ee9869/files/5cb52847-f63c-4e74-acea-97d1c8f55196.jpg",
        description:
          "Финальный аудит. На счету остались 3 миллиона рублей из бюджета на HSE — сэкономлены благодаря грамотным решениям. Главный бухгалтер намекает: «Можно оформить как премию РП за успешное завершение». Или вложить в обучение ИТР на следующий проект.",
        choices: [
          {
            label: "Взять как премию за РП",
            tag: "Заработал — возьми",
            safe: false,
            budgetDelta: 3,
            scheduleDelta: 0,
            hseDelta: -10,
            result:
              "Премию взяли. Следующий проект начнётся с теми же необученными людьми, теми же ошибками и первым штрафом уже на этапе котлована. «Сто лет так делали, начальник.» Цикл продолжается.",
            resultEmoji: "💰",
            pendingPenalty: {
              text: "На следующем проекте необученная команда — первый же штраф Ростехнадзора в двойном размере.",
              budgetDelta: -5,
              scheduleDelta: 0,
              hseDelta: -20,
              emoji: "📉",
            },
          },
          {
            label: "Вложить в обучение ИТР",
            tag: "Инвестиция в будущее",
            safe: true,
            budgetDelta: -3,
            scheduleDelta: 0,
            hseDelta: 25,
            result:
              "Провели обучение 40 ИТР по охране труда, промышленной безопасности и экологии. На следующем проекте первый котлован прошёл без единого замечания. HSE-культура — это не статья расходов. Это конкурентное преимущество.",
            resultEmoji: "🎓",
          },
        ],
      },
    ],
  },
];

const INITIAL_STATE: GameState = {
  screen: "menu",
  round: 0,
  dilemma: 0,
  budget: 100,
  hse: 100,
  schedule: 100,
  log: [],
  pendingPenalty: null,
  gameOver: false,
  choiceHistory: [],
};

const SAVE_KEY = "hse_game_save_v1";

function clamp(v: number, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function saveGame(state: GameState) {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
  } catch (e) {
    void e;
  }
}

function loadGame(): GameState | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw) as GameState;
    if (s.screen !== "game") return null;
    return s;
  } catch {
    return null;
  }
}

function hasSave(): boolean {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return false;
    const s = JSON.parse(raw) as GameState;
    return s.screen === "game";
  } catch {
    return false;
  }
}

// ─── КОМПОНЕНТЫ ──────────────────────────────────────────────────────────────

function MetricBar({ label, value, color, icon }: { label: string; value: number; color: string; icon: string }) {
  const pct = clamp(value);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4, minWidth: 120 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6 }}>
        <span style={{ fontSize: 12, color: "#64748b", display: "flex", alignItems: "center", gap: 4 }}>
          <span>{icon}</span><span style={{ fontWeight: 600, letterSpacing: "0.01em" }}>{label}</span>
        </span>
        <span style={{ fontSize: 13, fontWeight: 700, color: pct < 30 ? "#ef4444" : "#1e40af" }}>{Math.round(pct)}%</span>
      </div>
      <div style={{ height: 6, background: "#e2e8f0", borderRadius: 99, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, borderRadius: 99, transition: "width 0.5s ease, background 0.3s ease" }} />
      </div>
    </div>
  );
}

// ─── ОСНОВНОЙ КОМПОНЕНТ ───────────────────────────────────────────────────────

export default function Index() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [showResult, setShowResult] = useState<{ text: string; emoji: string; image?: string; safe: boolean; hasPenalty: boolean } | null>(null);
  const [showPenalty, setShowPenalty] = useState<PendingPenalty | null>(null);
  const [animKey, setAnimKey] = useState(0);
  const [savedExists] = useState(hasSave);
  const [logEntries, setLogEntries] = useState<LogEntry[]>([]);

  useEffect(() => {
    if (state.screen === "game") saveGame(state);
  }, [state]);

  const currentRound = ROUNDS[state.round];
  const currentDilemma = currentRound?.dilemmas[state.dilemma];

  const addLog = useCallback((text: string, type: LogEntry["type"], emoji: string) => {
    setLogEntries(prev => [...prev, { id: Date.now() + Math.random(), text, type, emoji }]);
  }, []);

  function startNewGame() {
    localStorage.removeItem(SAVE_KEY);
    setShowResult(null);
    setShowPenalty(null);
    setLogEntries([]);
    setAnimKey(k => k + 1);
    setState({ ...INITIAL_STATE, screen: "game" });
  }

  function continueGame() {
    const saved = loadGame();
    if (saved) {
      setState(saved);
      setAnimKey(k => k + 1);
    }
  }

  function makeChoice(choice: Choice) {
    if (showResult || showPenalty) return;

    const roundLabel = `Раунд ${state.round + 1}, ${currentDilemma?.situation}`;
    addLog(`${roundLabel}: «${choice.label}»`, choice.safe ? "safe" : "unsafe", choice.resultEmoji);

    setShowResult({
      text: choice.result,
      emoji: choice.resultEmoji,
      image: choice.resultImage,
      safe: choice.safe,
      hasPenalty: !choice.safe && !!choice.pendingPenalty,
    });

    setState(prev => {
      let newBudget = prev.budget;
      let newHse = prev.hse;
      let newSchedule = prev.schedule;

      if (prev.pendingPenalty) {
        newBudget += prev.pendingPenalty.budgetDelta;
        newHse += prev.pendingPenalty.hseDelta;
        newSchedule += prev.pendingPenalty.scheduleDelta;
      }

      newBudget = clamp(newBudget + choice.budgetDelta);
      newHse = clamp(newHse + choice.hseDelta);
      newSchedule = clamp(newSchedule + choice.scheduleDelta);

      return {
        ...prev,
        budget: newBudget,
        hse: newHse,
        schedule: newSchedule,
        pendingPenalty: choice.pendingPenalty || null,
        choiceHistory: [...prev.choiceHistory, choice.safe],
        gameOver: newBudget <= 0 || newSchedule <= 0,
      };
    });
  }

  function proceedAfterResult() {
    if (showPenalty) {
      addLog(showPenalty.text, "penalty", showPenalty.emoji);
      setState(prev => ({
        ...prev,
        budget: clamp(prev.budget + showPenalty.budgetDelta),
        hse: clamp(prev.hse + showPenalty.hseDelta),
        schedule: clamp(prev.schedule + showPenalty.scheduleDelta),
        pendingPenalty: null,
        gameOver: clamp(prev.budget + showPenalty.budgetDelta) <= 0 || clamp(prev.schedule + showPenalty.scheduleDelta) <= 0,
      }));
      setShowPenalty(null);
      advanceDilemma();
      return;
    }

    if (!showResult?.safe && showResult?.hasPenalty && state.pendingPenalty) {
      setShowResult(null);
      setShowPenalty(state.pendingPenalty);
    } else {
      setShowResult(null);
      advanceDilemma();
    }
  }

  function advanceDilemma() {
    setState(prev => {
      if (prev.gameOver) return { ...prev, screen: "result" };
      const nextDilemma = prev.dilemma + 1;
      if (nextDilemma >= ROUNDS[prev.round].dilemmas.length) {
        const nextRound = prev.round + 1;
        if (nextRound >= ROUNDS.length) return { ...prev, screen: "result" };
        setAnimKey(k => k + 1);
        return { ...prev, round: nextRound, dilemma: 0 };
      }
      setAnimKey(k => k + 1);
      return { ...prev, dilemma: nextDilemma };
    });
  }

  // ─── МЕНЮ ────────────────────────────────────────────────────────────────────
  if (state.screen === "menu") {
    return (
      <div className="hse-root">
        <div className="hse-menu">
          <div className="hse-menu-inner">
            <div className="hse-badge">HSE СИМУЛЯТОР </div>
            <h1 className="hse-menu-title">Безопасность<br /><span>экономит деньги</span></h1>
            <p className="hse-menu-desc">
              Вы — Директор проекта Технического заказчика. Стройте курорт, принимайте решения и не разоряйтесь на штрафах.
            </p>
            <div className="hse-rounds-preview">
              {ROUNDS.map(r => (
                <div key={r.id} className="hse-round-chip">
                  <span>{r.icon}</span>
                  <span>{r.title}</span>
                </div>
              ))}
            </div>
            <div className="hse-menu-btns">
              <button className="hse-btn hse-btn-primary" onClick={startNewGame}>
                🚀 Новая игра
              </button>
              {savedExists && (
                <button className="hse-btn hse-btn-secondary" onClick={continueGame}>
                  💾 Продолжить
                </button>
              )}
            </div>
            <div className="hse-menu-hint">💡 Каждый дешёвый выбор аукнется на следующем шаге.</div>
          </div>
          <div className="hse-menu-decoration">
            <div className="hse-deco-circle hse-deco-1" />
            <div className="hse-deco-circle hse-deco-2" />
            <div className="hse-deco-circle hse-deco-3" />
          </div>
        </div>
      </div>
    );
  }

  // ─── ИТОГИ ────────────────────────────────────────────────────────────────────
  if (state.screen === "result") {
    const safeCount = state.choiceHistory.filter(Boolean).length;
    const total = state.choiceHistory.length;
    const safePct = total > 0 ? Math.round((safeCount / total) * 100) : 0;
    const won = state.budget > 0 && !state.gameOver;
    const savedM = won ? Math.max(0, Math.round((state.budget - 20) * 0.8)) : 0;

    return (
      <div className="hse-root">
        <div className="hse-result">
          <div className={`hse-result-badge ${won ? "hse-result-win" : "hse-result-lose"}`}>
            {won ? "🏆 ПРОЕКТ СДАН" : "💸 БАНКРОТСТВО"}
          </div>
          <h1 className="hse-result-title">
            {won ? "Поздравляем, Директор!" : "Проект закрыт. Михалыч жив — и то хлеб."}
          </h1>
          <p className="hse-result-subtitle">
            {won
              ? `Грамотные HSE-решения сохранили компании примерно ${savedM} млн руб. Безопасность окупается.`
              : "Бюджет обнулён. Зато получен бесценный опыт. Ростехнадзор шлёт привет."}
          </p>
          <div className="hse-result-stats">
            <div className="hse-result-stat">
              <span className="hse-stat-num">{Math.round(state.budget)}%</span>
              <span className="hse-stat-lbl">Бюджет</span>
            </div>
            <div className="hse-result-stat">
              <span className="hse-stat-num">{Math.round(state.hse)}%</span>
              <span className="hse-stat-lbl">HSE Индекс</span>
            </div>
            <div className="hse-result-stat">
              <span className="hse-stat-num">{safePct}%</span>
              <span className="hse-stat-lbl">Безопасных решений</span>
            </div>
            <div className="hse-result-stat">
              <span className="hse-stat-num">{total}</span>
              <span className="hse-stat-lbl">Всего решений</span>
            </div>
          </div>
          <div className="hse-verdict">
            {safePct >= 80
              ? "🎓 Образцовый директор. Рекомендуем на следующий ЖК."
              : safePct >= 50
              ? "⚠️ Есть над чем поработать. Михалыч помнит всё."
              : "🚨 Ростехнадзор уже набирает ваш номер."}
          </div>
          <button className="hse-btn hse-btn-primary" onClick={() => {
            localStorage.removeItem(SAVE_KEY);
            setLogEntries([]);
            setShowResult(null);
            setShowPenalty(null);
            setState(INITIAL_STATE);
          }}>
            🔄 Сыграть снова
          </button>
        </div>
      </div>
    );
  }

  // ─── ИГРА ────────────────────────────────────────────────────────────────────
  const budgetColor = state.budget > 60 ? "#2563eb" : state.budget > 30 ? "#f59e0b" : "#ef4444";
  const hseColor = state.hse > 60 ? "#10b981" : state.hse > 30 ? "#f59e0b" : "#ef4444";
  const scheduleColor = state.schedule > 60 ? "#2563eb" : state.schedule > 30 ? "#f59e0b" : "#ef4444";

  const dilemmaProgress = state.round * 3 + state.dilemma + 1;
  const totalDilemmas = ROUNDS.length * 3;

  return (
    <div className="hse-root">
      {/* ШАПКА */}
      <header className="hse-header">
        <div className="hse-header-left">
          <span className="hse-header-icon">{currentRound?.icon}</span>
          <div>
            <div className="hse-header-round">Раунд {state.round + 1} / {ROUNDS.length} — {currentRound?.title}</div>
            <div className="hse-header-sub">{currentRound?.subtitle}</div>
          </div>
        </div>
        <div className="hse-metrics">
          <MetricBar label="Бюджет" value={state.budget} color={budgetColor} icon="💰" />
          <MetricBar label="HSE" value={state.hse} color={hseColor} icon="🛡️" />
          <MetricBar label="График" value={state.schedule} color={scheduleColor} icon="📅" />
        </div>
        <div className="hse-progress-bar">
          <div className="hse-progress-fill" style={{ width: `${(dilemmaProgress / totalDilemmas) * 100}%` }} />
        </div>
      </header>

      {/* ОСНОВНАЯ ЗОНА */}
      <main className="hse-main">
        <div className="hse-game-layout">
          {/* КАРТОЧКА ДИЛЕММЫ */}
          <div className="hse-center">
            {!showResult && !showPenalty && currentDilemma && (
              <div className="hse-dilemma" key={animKey}>
                {currentDilemma.image && (
                  <div className="hse-dilemma-img-wrap">
                    <img src={currentDilemma.image} alt="" className="hse-dilemma-img" />
                    <div className="hse-dilemma-img-overlay" />
                  </div>
                )}
                <div className="hse-dilemma-body">
                <div className="hse-dilemma-situation">{currentDilemma.situation}</div>
                <h2 className="hse-dilemma-title">{currentDilemma.title}</h2>
                <p className="hse-dilemma-desc">{currentDilemma.description}</p>
                <div className="hse-choices">
                  {currentDilemma.choices.map((choice, i) => (
                    <button
                      key={i}
                      className={`hse-choice ${choice.safe ? "hse-choice-safe" : "hse-choice-risk"}`}
                      onClick={() => makeChoice(choice)}
                    >
                      <div className="hse-choice-tag">{choice.tag}</div>
                      <div className="hse-choice-label">{choice.label}</div>
                      <div className="hse-choice-deltas">
                        <span className={choice.budgetDelta >= 0 ? "hse-pos" : "hse-neg"}>
                          💰 {choice.budgetDelta > 0 ? "+" : ""}{choice.budgetDelta}%
                        </span>
                        <span className={choice.scheduleDelta >= 0 ? "hse-pos" : "hse-neg"}>
                          📅 {choice.scheduleDelta > 0 ? "+" : ""}{choice.scheduleDelta}%
                        </span>
                        <span className={choice.hseDelta >= 0 ? "hse-pos" : "hse-neg"}>
                          🛡️ {choice.hseDelta > 0 ? "+" : ""}{choice.hseDelta}%
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
                </div>
              </div>
            )}

            {showResult && !showPenalty && (
              <div className={`hse-result-card ${showResult.safe ? "hse-rc-safe" : "hse-rc-risk"}`} key="result">
                {showResult.image && (
                  <div className="hse-rc-img-wrap">
                    <img src={showResult.image} alt="" className="hse-rc-img" />
                    <div className="hse-rc-img-overlay" />
                  </div>
                )}
                <div className="hse-rc-body">
                  <div className="hse-rc-emoji">{showResult.emoji}</div>
                  <div className={`hse-rc-badge ${showResult.safe ? "hse-rb-safe" : "hse-rb-risk"}`}>
                    {showResult.safe ? "✅ Правильное решение" : "⚠️ Рискованное решение"}
                  </div>
                  <p className="hse-rc-text">{showResult.text}</p>
                  {showResult.hasPenalty && (
                    <div className="hse-rc-warning">⏳ Последствия наступят на следующем шаге…</div>
                  )}
                  <button className="hse-btn hse-btn-primary" onClick={proceedAfterResult}>
                    {showResult.hasPenalty ? "Посмотреть последствия →" : "Продолжить →"}
                  </button>
                </div>
              </div>
            )}

            {showPenalty && (
              <div className="hse-penalty-card" key="penalty">
                {showPenalty.image && (
                  <div className="hse-rc-img-wrap">
                    <img src={showPenalty.image} alt="" className="hse-rc-img" />
                    <div className="hse-rc-img-overlay" />
                  </div>
                )}
                <div className="hse-rc-body">
                  <div className="hse-penalty-emoji">{showPenalty.emoji}</div>
                  <div className="hse-penalty-badge">🚨 Последствия наступили</div>
                  <p className="hse-penalty-text">{showPenalty.text}</p>
                  <div className="hse-penalty-deltas">
                    <span className="hse-neg">💰 {showPenalty.budgetDelta}%</span>
                    <span className="hse-neg">📅 {showPenalty.scheduleDelta}%</span>
                    <span className="hse-neg">🛡️ {showPenalty.hseDelta}%</span>
                  </div>
                  <div className="hse-penalty-moral">
                    Дешёвое решение обошлось втрое дороже.<br />
                    <strong>Безопасность экономит деньги.</strong>
                  </div>
                  <button className="hse-btn hse-btn-primary" onClick={proceedAfterResult}>
                    Принять и двигаться дальше →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ЛОГ */}
          <aside className="hse-log">
            <div className="hse-log-title">📋 Журнал событий</div>
            <div className="hse-log-entries">
              {logEntries.length === 0 && (
                <div className="hse-log-empty">Пока тихо. Принимайте первое решение.</div>
              )}
              {[...logEntries].reverse().map(e => (
                <div key={e.id} className={`hse-log-entry hse-log-${e.type}`}>
                  <span className="hse-log-emoji">{e.emoji}</span>
                  <span>{e.text}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
}