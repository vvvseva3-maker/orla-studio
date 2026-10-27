/* =========================================================================
   СОЛНЦЕ: рассвет, закат, золотой и синий час
   Считается прямо в браузере, без интернета, по стандартным
   астрономическим формулам (тот же подход, что в библиотеке SunCalc).
   Точность — около минуты, этого достаточно для планирования съёмки.

   Границы, принятые в фотографии:
     синий час   — солнце от −6° до −4° под горизонтом
     золотой час — солнце от −4° до +6°
   ========================================================================= */

(function () {
  const rad = Math.PI / 180;
  const dayMs = 864e5;
  const J1970 = 2440588;
  const J2000 = 2451545;
  const J0 = 0.0009;
  const obliquity = rad * 23.4397; // наклон земной оси

  const toJulian = (date) => date.valueOf() / dayMs - 0.5 + J1970;
  const fromJulian = (j) => new Date((j + 0.5 - J1970) * dayMs);
  const toDays = (date) => toJulian(date) - J2000;

  const declination = (l) => Math.asin(Math.sin(obliquity) * Math.sin(l));
  const solarMeanAnomaly = (d) => rad * (357.5291 + 0.98560028 * d);
  const eclipticLongitude = (M) => {
    const C = rad * (1.9148 * Math.sin(M) + 0.02 * Math.sin(2 * M) + 0.0003 * Math.sin(3 * M));
    const perihelion = rad * 102.9372;
    return M + C + perihelion + Math.PI;
  };
  const julianCycle = (d, lw) => Math.round(d - J0 - lw / (2 * Math.PI));
  const approxTransit = (Ht, lw, n) => J0 + (Ht + lw) / (2 * Math.PI) + n;
  const solarTransitJ = (ds, M, L) => J2000 + ds + 0.0053 * Math.sin(M) - 0.0069 * Math.sin(2 * L);
  const hourAngle = (h, phi, d) => Math.acos((Math.sin(h) - Math.sin(phi) * Math.sin(d)) / (Math.cos(phi) * Math.cos(d)));

  /**
   * Время, когда солнце проходит заданную высоту утром и вечером.
   * @returns {[Date|null, Date|null]} [утро, вечер]; null — если в этот день
   *          солнце не опускается или не поднимается до этой высоты (полярные широты).
   */
  function crossing(angleDeg, ctx) {
    const { lw, phi, dec, n, M, L, Jnoon } = ctx;
    const w = hourAngle(angleDeg * rad, phi, dec);
    if (Number.isNaN(w)) return [null, null];
    const Jset = solarTransitJ(approxTransit(w, lw, n), M, L);
    const Jrise = Jnoon - (Jset - Jnoon);
    return [fromJulian(Jrise), fromJulian(Jset)];
  }

  /**
   * Все световые периоды на день.
   * @param {string} isoDate  дата в формате 'YYYY-MM-DD' (местная дата локации)
   * @param {number} lat      широта
   * @param {number} lng      долгота
   */
  function getDay(isoDate, lat, lng) {
    const [y, m, d] = isoDate.split('-').map(Number);
    // полдень по местному солнечному времени — от него ищем ближайшие события
    const noon = new Date(Date.UTC(y, m - 1, d, 12) - (lng / 15) * 36e5);

    const lw = rad * -lng;
    const phi = rad * lat;
    const days = toDays(noon);
    const n = julianCycle(days, lw);
    const ds = approxTransit(0, lw, n);
    const M = solarMeanAnomaly(ds);
    const L = eclipticLongitude(M);
    const dec = declination(L);
    const Jnoon = solarTransitJ(ds, M, L);
    const ctx = { lw, phi, dec, n, M, L, Jnoon };

    const [sunrise, sunset] = crossing(-0.833, ctx); // −0.833° учитывает рефракцию и диск солнца
    const [up6, down6] = crossing(6, ctx);
    const [up4, down4] = crossing(-4, ctx);
    const [civilDawn, civilDusk] = crossing(-6, ctx);

    return {
      solarNoon: fromJulian(Jnoon),
      sunrise,
      sunset,
      blueMorning: [civilDawn, up4],
      goldenMorning: [up4, up6],
      goldenEvening: [down6, down4],
      blueEvening: [down4, civilDusk],
      // для полярных дней/ночей, когда солнце не поднимается выше 6°
      hasGolden: !!(up4 && up6),
      polar: !sunrise
    };
  }

  window.Sun = { getDay };
})();
