const dayjs = require('dayjs');
const relativeTime = require('dayjs/plugin/relativeTime');
const localeData = require('dayjs/plugin/localeData');
const hu = require('dayjs/locale/hu');

dayjs.extend(relativeTime);
dayjs.extend(localeData);
dayjs.locale(hu);

/** Egy Date-t típust átalakít egy magyar szöveggé, mely a megadott dátum és a jelengi dátum közötti időeltolódást jelzi ki.
 @param {Date} date - Dátum
 @returns {string} - időeltolódás a két dátum között (pl. 2 perce, 6 órája, 1 év múlva stb.)
 */
const convertDateToRelativeTime = (date) => {
    return dayjs(date).fromNow();
}

const convertDateToHtmlFormat = (timestamp) => {
    const date = new Date(timestamp);
    return date.toISOString().split('T')[0];
}


module.exports = { convertDateToRelativeTime, convertDateToHtmlFormat };