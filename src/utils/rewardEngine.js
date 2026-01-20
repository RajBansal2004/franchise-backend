module.exports = function rewardEngine(user) {
  const rewards = {
    1: 'BIKE',
    5: 'NEPAL TRIP',
    9: 'MALAYSIA TRIP',
    13: 'CAR FUND',
    15: 'SWITZERLAND TRIP'
  };

  if (rewards[user.level]) {
    const already = user.rewards.find(
      r => r.level === user.level
    );

    if (!already) {
      user.rewards.push({
        level: user.level,
        name: rewards[user.level],
        achievedAt: new Date()
      });
    }
  }
};
