/**
 * Process bids and calculate rewards for each participant.
 * @param {Array} rankings - The list of ranking objects.
 * @returns {Array} The list of ranking objects with DPoints.
 */
const processBidsAndCalculateRewards = (rankings) => {
    if (!Array.isArray(rankings)) {
        console.error('Rankings is not an array:', rankings);
        return [];
    }

    const updatedRankings = rankings.map(ranking => ({
        ...ranking,
        dPoints: 0 // Initialize DPoints for each ranking
    }));

    updatedRankings.forEach(ranking => {
        console.log(`Processing ranking for address: ${ranking.addr}`);

        // Process bids
        if (ranking.nbBids > 0) {
            console.log(`Address ${ranking.addr} has ${ranking.nbBids} bids.`);
            let previousBidAmount = 0;

            Object.entries(ranking.currenciesAmounts || {}).forEach(([currency, amounts]) => {
                const bidSpent = parseFloat(amounts.bidSpent || 0);
                console.log(`Bid spent in ${currency}: ${bidSpent}`);

                // Reward prior bidders
                if (previousBidAmount > 0) {
                    const bidIncrement = bidSpent - previousBidAmount;
                    if (bidIncrement > 0) {
                        const reward = bidIncrement * 0.5;
                        ranking.dPoints += reward;
                        console.log(`Rewarding prior bidder: ${ranking.addr} with ${reward} DPoints for bid increment.`);
                    }
                }

                previousBidAmount = bidSpent;

                // Calculate potential reward if the bid were to stop now
                const potentialReward = bidSpent * 0.5;
                ranking.dPoints += potentialReward;
                console.log(`Potential reward for ${ranking.addr}: ${potentialReward} DPoints.`);
            });
        }

        // Check if this bidder won any bids
        if (ranking.nbWinningBids > 0) {
            Object.entries(ranking.currenciesAmounts || {}).forEach(([currency, amounts]) => {
                const bidSpent = parseFloat(amounts.bidSpent || 0);
                ranking.dPoints += bidSpent; // Reward equivalent to the cost
                console.log(`Rewarding last bidder: ${ranking.addr} with ${bidSpent} DPoints for winning bid.`);
            });
        }

        // Process direct buys
        if (ranking.nbBuys > 0) {
            console.log(`Address ${ranking.addr} has ${ranking.nbBuys} buys.`);
            Object.entries(ranking.currenciesAmounts || {}).forEach(([currency, amounts]) => {
                const buySpent = parseFloat(amounts.buySpent || 0);
                ranking.dPoints += buySpent; // Reward equivalent to the cost
                console.log(`Rewarding buyer: ${ranking.addr} with ${buySpent} DPoints for direct buy.`);
            });
        }
    });

    console.log('Updated Rankings with DPoints:', updatedRankings);
    return updatedRankings;
};

export default processBidsAndCalculateRewards;
