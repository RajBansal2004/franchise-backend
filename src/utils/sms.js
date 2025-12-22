// integrate Twilio or other provider here
exports.sendSMS = async ({ to, text }) => {
  console.log('SMS sent to', to, text);
  return true;
};
