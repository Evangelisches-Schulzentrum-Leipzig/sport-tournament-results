import { unitOrder } from "./utils.js";

/**
 * Compute rankings for participants based on their measurements in various disciplines.
 * @param {{name: string, level: number}[]} classes
 * @param {{id: number, name: string, forename: string, class: string}[]} participants 
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines 
 * @param {{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]} measurements 
 * @param {{discipline_id: number, class_level: number, gender: string, mark: string, min_value: number}[]} markRanges
 * @return {{disciplineRankings: Map<number, Array<{participantId: number, value: number, mark: string|null}>>, overallRankings: Array<{participantId: number, totalPoints: number}>}} Rankings for each discipline and overall rankings
 */
export function computeRankings(classes, participants, disciplines, measurements, markRanges) {
    const disciplineMap = new Map(disciplines.map(d => [d.id, d]));
    const participantMap = new Map(participants.map(p => [p.id, p]));
    const classMap = new Map(classes.map(c => [c.name, c]));

    // Build mark lookup: markMap[discipline_id][class_level][gender][mark] = min_value
    const markMap = {};
    markRanges.forEach(mr => {
        if (!markMap[mr.discipline_id]) markMap[mr.discipline_id] = {};
        if (!markMap[mr.discipline_id][mr.class_level]) markMap[mr.discipline_id][mr.class_level] = {};
        if (!markMap[mr.discipline_id][mr.class_level][mr.gender]) markMap[mr.discipline_id][mr.class_level][mr.gender] = {};
        markMap[mr.discipline_id][mr.class_level][mr.gender][mr.mark] = mr.min_value;
    });

    // Find the best measurement per participant per discipline
    // bestPerDiscipline: Map<participantId, Map<disciplineId, bestMeasurement>>
    const bestPerDiscipline = new Map();
    measurements.forEach(m => {
        const discipline = disciplineMap.get(m.discipline_id);
        if (!discipline) return;
        const order = unitOrder(discipline.unit);
        if (!bestPerDiscipline.has(m.participant_id)) {
            bestPerDiscipline.set(m.participant_id, new Map());
        }
        const disciplineBests = bestPerDiscipline.get(m.participant_id);
        const existing = disciplineBests.get(m.discipline_id);
        // order=-1 (meters): keep higher value; order=1 (minutes): keep lower value
        if (!existing || order * m.value < order * existing.value) {
            disciplineBests.set(m.discipline_id, m);
        }
    });

    // Build per-discipline rankings
    const disciplineRankings = new Map();
    disciplines.forEach(d => disciplineRankings.set(d.id, []));

    bestPerDiscipline.forEach((disciplineBests, participantId) => {
        const participant = participantMap.get(participantId);
        if (!participant) return;
        const class_level = classMap.get(participant.class)?.level;

        disciplineBests.forEach((bestMeas, disciplineId) => {
            const discipline = disciplineMap.get(disciplineId);
            if (!discipline) return;
            const order = unitOrder(discipline.unit);
            const markInfo = markMap[disciplineId]?.[class_level]?.[participant.gender];

            let mark = null;
            if (markInfo) {
                // Sort marks most-demanding-first so the first qualifying entry is the best achievable mark.
                // For meters (order=-1): descending threshold order (highest min_value = hardest = best mark).
                // For minutes (order=1): ascending threshold order (lowest min_value = hardest = best mark).
                const sortedEntries = Object.entries(markInfo)
                    .sort((a, b) => order * (parseFloat(a[1]) - parseFloat(b[1])));
                for (const [m, minValue] of sortedEntries) {
                    const qualifies = order === 1
                        ? bestMeas.value <= minValue  // time: lower is better
                        : bestMeas.value >= minValue; // distance: higher is better
                    if (qualifies) {
                        mark = parseInt(m);
                        break;
                    }
                }
            }

            disciplineRankings.get(disciplineId).push({ participantId, value: bestMeas.value, mark });
        });
    });

    // Fill in participants who have no measurement for a given discipline
    disciplines.forEach(discipline => {
        const rankings = disciplineRankings.get(discipline.id);
        participants.forEach(participant => {
            if (!rankings.some(r => r.participantId === participant.id)) {
                rankings.push({ participantId: participant.id, value: null, mark: null });
            }
        });
    });

    // Sort each discipline's rankings (null values go last)
    disciplineRankings.forEach((rankings, disciplineId) => {
        const discipline = disciplineMap.get(disciplineId);
        const order = unitOrder(discipline.unit);
        rankings.sort((a, b) => {
            if (a.value === null && b.value === null) return 0;
            if (a.value === null) return 1;
            if (b.value === null) return -1;
            return order * (a.value - b.value);
        });
    });

    // Compute overall rankings: rank score = (discipline length - rank position), summed across disciplines
    const overallRankings = [];
    participants.forEach(participant => {
        let totalPoints = 0;
        disciplineRankings.forEach(rankings => {
            const rank = rankings.findIndex(r => r.participantId === participant.id);
            if (rank !== -1 && rankings[rank].value !== null) {
                totalPoints += rankings.length - rank;
            }
        });
        overallRankings.push({ participantId: participant.id, totalPoints });
    });
    overallRankings.sort((a, b) => b.totalPoints - a.totalPoints);

    return { disciplineRankings, overallRankings };
}

/**
 * Format measurement conflicts to include participant, discipline, and class information.
 * @param {Array<Array>} conflictGroups - Array of conflict groups from API response
 * @param {{id: number, name: string, forename: string, class: string}[]} participants
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines
 * @param {{name: string, level: number}[]} classes
 * @returns {Array} Formatted conflicts with enriched data
 */
export function formatConflicts(conflictGroups, participants, disciplines, classes) {
    const participantMap = new Map(participants.map(p => [p.id, p]));
    const disciplineMap = new Map(disciplines.map(d => [d.id, d]));
    const classMap = new Map(classes.map(c => [c.name, c]));

    return conflictGroups.map(group => {
        if (!group || group.length === 0) return null;
        
        const firstMeasurement = group[0];
        const participant = participantMap.get(firstMeasurement.participant_id);
        const discipline = disciplineMap.get(firstMeasurement.discipline_id);
        
        if (!participant || !discipline) return null;

        const participantClass = classMap.get(participant.class);

        return {
            participantId: firstMeasurement.participant_id,
            disciplineId: firstMeasurement.discipline_id,
            attemptNumber: firstMeasurement.attempt_number,
            participantName: `${participant.forename} ${participant.name}`,
            disciplineName: discipline.name,
            className: participant.class,
            classLevel: participantClass?.level,
            unit: discipline.unit,
            values: group.map(m => ({
                id: m.id,
                value: m.value,
                createdAt: m.created_at
            }))
        };
    }).filter(conflict => conflict !== null);
}

/**
 * Compute a matrix showing the progress of participants in each discipline for each class.
 * @param {{name: string, level: number}[]} classes - Array of class objects
 * @param {{id: number, name: string, forename: string, class: string}[]} participants - Array of participant objects
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines - Array of discipline objects
 * @param {{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]} measurements - Array of measurement objects
 * @returns {{[className: string]: {[disciplineName: string]: number, total: number}}} Matrix of participant counts for each class and discipline, including total participants in each class
 */
export function computeDisciplineProgressMatrix(classes, participants, disciplines, measurements) {
    // Create a map of classes with number of participants in each class
    const classMap = new Map();
    classes.forEach(cls => {
        classMap.set(cls.name, {
            name: cls.name,
            level: cls.level,
            participantCount: participants.filter(p => p.class === cls.name).length
        });
    });

    // Create a map of discipline_id to discipline for easy lookup
    const disciplineMap = new Map(disciplines.map(d => [d.id, d]));

    // Create a map of participant_id to their class and measurements by discipline
    const participantProgress = new Map();
    participants.forEach(p => {
        participantProgress.set(p.id, {
            class: p.class,
            disciplines: new Set()
        });
    });

    // Add discipline measurements for each participant
    measurements.forEach(m => {
        if (participantProgress.has(m.participant_id)) {
            participantProgress.get(m.participant_id).disciplines.add(m.discipline_id);
        }
    });
    
    // Create a matrix for each class and discipline, indicating how many participants in that class have a measurement for that discipline
    // matrix[className][disciplineName] = count
    const matrix = {};
    classMap.forEach((cls, className) => {
        matrix[className] = {};
        disciplineMap.forEach((discipline, disciplineId) => {
            const count = participants.filter(p => 
                p.class === className && 
                participantProgress.get(p.id)?.disciplines.has(disciplineId)
            ).length;
            matrix[className][discipline.name] = count;
        });
    });

    // Add total participants in each class to the matrix
    Object.keys(matrix).forEach(className => {
        matrix[className]['total'] = classMap.get(className).participantCount;
    });

    return matrix;
}