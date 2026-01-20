const cron = require('node-cron');
const runMatchingCron = require('./matching.cron');
const runRoyaltyCron = require('./royalty.cron');

// Weekly – Sunday 11:59 PM
cron.schedule('59 23 * * 0', async () => {
  console.log('Matching Cron Started');
  await runMatchingCron();
  console.log('Matching Cron Completed');
});

// Monthly – 1st day 12:10 AM
cron.schedule('10 0 1 * *', async () => {
  console.log('Royalty Cron Started');
  await runRoyaltyCron();
  console.log('Royalty Cron Completed');
});
