# Orla — сайт веб-студии и демо-сайты

Сайт студии и три демо для вымышленных бизнесов. Всё статическое: обычные HTML-файлы без сборки, открываются где угодно.

| Путь | Что это | Языки |
|---|---|---|
| `index.html` | Сайт студии: 3D-камень, портфолио в телефоне, конструктор брифа, форма заявки | EN · PT · RU |
| `demos/barbearia/` | Барбершоп: прайс, правила, часы с живым статусом, запись на кресло | PT · EN |
| `demos/tasca/` | Таверна в Лиссабоне: меню по вкладкам, блюдо дня на доске, бронь стола | PT · EN |
| `demos/pilates/` | Пилатес-студия: расписание со свободными местами, цены, пробное занятие | PT · EN |
| `concepts/leto/` | Концепт для настоящего кафе LETO (Cascais) — для предложения владельцам. Закрыт от Google (`noindex`), на странице плашка «Conceito» | PT · EN · RU |
| `concepts/melt/` | Концепт для настоящей пекарни Melt (Cascais): витрина с ценами, бронь выпечки к самовывозу, торт на заказ с учётом 48 ч и выходного понедельника. `noindex`, плашка «Conceito» | PT · EN |
| `concepts/murmur/` | Концепт для студии реквизита и фуд-стайлинга Mur Mur (Лиссабон): работы с фильтром, услуги, процесс, конструктор брифа. `noindex`, плашка «Concept» | EN · PT · UA |
| `assets/` | Скриншоты демо для экрана телефона в портфолио, `og.jpg` — картинка для превью ссылки | |

## Включить сайт по ссылке (GitHub Pages)

1. Репозиторий должен быть **Public** (на бесплатном аккаунте Pages работает только с публичными).
2. **Settings → Pages → Build and deployment**: Source = *Deploy from a branch*, Branch = `main`, папка `/ (root)` → **Save**.
3. Через 1–2 минуты сайт будет здесь: `https://vvvseva3-maker.github.io/orla-studio/`
   Демо: `…/orla-studio/demos/barbearia/`, `…/demos/tasca/`, `…/demos/pilates/`.

Свой домен потом подключается там же: **Settings → Pages → Custom domain**.

## Чтобы сайт нашёлся в Google

Уже сделано в коде: заголовок и описание на трёх языках, отдельные адреса языков (`?lang=pt`, `?lang=ru`) с `hreflang`, разметка `ProfessionalService`, картинка превью `assets/og.jpg`, `sitemap.xml`, `robots.txt`. Концепты закрыты от индексации.

1. Включи GitHub Pages (раздел выше) и проверь, что сайт открывается.
2. [Google Search Console](https://search.google.com/search-console) → **Добавить ресурс** → тип **«Префикс URL»** → `https://vvvseva3-maker.github.io/orla-studio/`.
3. Подтверждение: способ **«Тег HTML»**. Скопируй строку `<meta name="google-site-verification" …>` и вставь её в `index.html` на место комментария `Google Search Console` → залей → нажми **Подтвердить**.
4. **Файлы Sitemap** → добавь `sitemap.xml`. Затем **Проверка URL** → главная → **Запросить индексирование**.
5. При подключении своего домена замени `https://vvvseva3-maker.github.io/orla-studio/` на новый адрес в `index.html`, `sitemap.xml`, `robots.txt` и добавь новый ресурс в Search Console.

## Почта и форма заявки

Настройки студии — в начале скрипта в `index.html`:

```js
window.STUDIO = {
  name: 'Orla',
  email: 'orla.webstudio@gmail.com',
  whatsapp: '',   // например '351912345678' — появится кнопка «Отправить в WhatsApp»
  formEndpoint: 'https://formsubmit.co/ajax/orla.webstudio@gmail.com'
};
```

- Адрес `orla.webstudio@gmail.com` нужно **зарегистрировать в Gmail**. Если он занят, возьми другой и замени его в двух местах: `email` и `formEndpoint`.
- Форма отправляет заявки через FormSubmit (бесплатно, без регистрации). Первая заявка придёт письмом с кнопкой **Activate** — нажми её один раз, дальше заявки будут приходить сразу на почту.
- Если отправка не сработала, посетитель видит готовый текст заявки с кнопкой «Скопировать» и адрес почты.

## Добавить новое демо в портфолио

1. Положи сайт в `demos/<имя>/index.html`.
2. Сделай скриншот всей страницы шириной 390 px, сохрани как `assets/work-<имя>.webp`.
3. В `index.html` добавь строку в `window.PROJECTS` и тексты `k…` (тип) и `w…` (описание) в словари `en`, `pt`, `ru`.
