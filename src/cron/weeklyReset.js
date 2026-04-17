cron.schedule('0 0 * * 0', async () => {
  await User.updateMany({}, {
    weeklyIncome: 0,
  });
});