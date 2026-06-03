import { unitOrder } from "./utils.js";

/**
 * Compute rankings for participants based on their measurements in various disciplines.
 * @param {{id: number, name: string, forename: string, class: string}[]} participants 
 * @param {{id: number, name: string, unit: string, attempts: number, timer: boolean}[]} disciplines 
 * @param {{id: number, participant_id: number, discipline_id: number, attempt_number: number, value: number, created_at: string}[]} measurements 
 */
export function computeRankings(participants, disciplines, measurements) {
    // Create a map of discipline_id to discipline for easy lookup
    const disciplineMap = new Map(disciplines.map(d => [d.id, d]));
    
    // Create a map of participant_id to their measurements for easy lookup
    const participantMeasurements = new Map();
    measurements.forEach(m => {
        if (!participantMeasurements.has(m.participant_id)) {
            participantMeasurements.set(m.participant_id, []);
        }
        participantMeasurements.get(m.participant_id).push(m);
    });
    
    // Map of participant with their best performance in each discipline
    const participantBestPerformances = new Map();
    participantMeasurements.forEach((measList, participantId) => {
        measList.sort((a, b) => {
            const discipline = disciplineMap.get(a.discipline_id);
            if (!discipline) return 0;
            const order = unitOrder(discipline.unit);
            return order * (a.value - b.value);
        });
        participantBestPerformances.set(participantId, measList[0]);
    });

    // Create a ranking of participants based on their best performances in each discipline
    const disciplineRankings = new Map();
    participantBestPerformances.forEach((bestMeas, participantId) => {
        const discipline = disciplineMap.get(bestMeas.discipline_id);
        if (!discipline) return;
        if (!disciplineRankings.has(discipline.id)) {
            disciplineRankings.set(discipline.id, []);
        }
        disciplineRankings.get(discipline.id).push({
            participantId,
            value: bestMeas.value
        });
    });

    // Add all disciplines to the rankings map, even if no participant has a measurement for it
    // Also add all participants to the rankings, even if they have no measurements
    // Assign them the value null
    disciplines.forEach(discipline => {
        if (!disciplineRankings.has(discipline.id)) {
            disciplineRankings.set(discipline.id, []);
        }
        const rankings = disciplineRankings.get(discipline.id);
        participants.forEach(participant => {
            if (!rankings.some(r => r.participantId === participant.id)) {
                rankings.push({
                    participantId: participant.id,
                    value: null
                });
            }
        });
    });

    // Sort each discipline's rankings
    disciplineRankings.forEach((rankings, disciplineId) => {
        const discipline = disciplineMap.get(disciplineId);
        const order = unitOrder(discipline.unit);
        rankings.sort((a, b) => order * (a.value - b.value));
    });

    // Create a final ranking list for each participant based on their best performances across all disciplines
    // Assign in each discipline a score based on their rank (e.g., 1st place = (length) point, 2nd place = (length -1) points, etc.) and sum these scores for an overall ranking
    // Participants who did not participate in a discipline get the worst score for that discipline 0
    const overallRankings = [];
    participants.forEach(participant => {
        let totalPoints = 0;
        disciplineRankings.forEach((rankings, disciplineId) => {
            const rank = rankings.findIndex(r => r.participantId === participant.id);
            if (rank !== -1 && rankings[rank].value !== null) {
                // rank is 0-based, so add 1 to get the actual rank, and then calculate points as (length - rank)
                totalPoints += rankings.length - rank;
            } else {
                totalPoints += 0; // If participant did not participate, assign worst score
            }
        });
        overallRankings.push({
            participantId: participant.id,
            totalPoints
        });
    });

    // Sort overall rankings by total points (higher is better)
    overallRankings.sort((a, b) => b.totalPoints - a.totalPoints);

    return {
        disciplineRankings,
        overallRankings
    };
}