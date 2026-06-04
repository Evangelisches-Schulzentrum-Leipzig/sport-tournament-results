export function convertUnitToFloat(value, unit) {
    if (unit === 'minutes') {
        const parts = value.split(':');
        if (parts.length === 2) {
            const minutes = parseInt(parts[0]) || 0;
            const seconds = parseInt(parts[1]) || 0;
            return minutes * 60 + seconds;
        }
        return parseFloat(value) || 0; // fallback to raw number if format is incorrect
    } else if (unit === 'meters') {
        return parseFloat(value.replace(',', '.')) || 0; // convert comma to dot for decimal and parse
    } else {
        return parseFloat(value) || 0; // default parsing for other units
    }
}

export function convertFloatToUnit(value, unit) {
    if (unit === 'minutes') {
        const minutes = Math.floor(value / 60);
        const seconds = Math.round(value % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    } else if (unit === 'meters') {
        return value.toString().replace('.', ','); // convert dot to comma for decimal
    } else {
        return value.toString(); // default string conversion for other units
    }
}

export function unitLabel(unit) {
    if (unit === 'minutes') {
        return '(mm:ss)';
    } else if (unit === 'meters') {
        return '(m)';
    } else {
        return unit; // default to showing the unit as is
    }
}

export function unitOrder(unit) {
    if (unit === 'minutes') {
        return 1; // Time-based disciplines should be ranked with lower values better
    } else if (unit === 'meters') {
        return -1; // Distance-based disciplines should be ranked with higher values better
    } else {
        return 0; // Default order for unknown units
    }
}

/**
 * Returns a human-readable relative time string (in German) for a given date.
 * @param {Date} date
 * @returns {string}
 */
export function timeAgo(date) {
    const diff = Date.now() - date.getTime();
    if (diff < 60 * 1000) return `Vor ${Math.floor(diff / 1000)} Sekunden`;
    if (diff < 60 * 60 * 1000) return `Vor ${Math.floor(diff / (60 * 1000))} Minuten`;
    if (diff < 24 * 60 * 60 * 1000) return `Vor ${Math.floor(diff / (60 * 60 * 1000))} Stunden`;
    return `Vor ${Math.floor(diff / (24 * 60 * 60 * 1000))} Tagen`;
}