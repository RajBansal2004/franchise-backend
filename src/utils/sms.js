const axios = require('axios');
const SmsLog = require('../models/SmsLog');

const sendSMS = async ({ mobile, message, purpose }) => {
  try {
    // ✅ MOBILE FORMAT (INDIA)
    if (!mobile.startsWith('91')) {
      mobile = '91' + mobile;
    }

    const payload = {
      route: 'v3',            // ✅ correct
      sender_id: process.env.SMS_SENDER_ID,
      message: message,
      numbers: mobile
    };

    const response = await axios.post(
      process.env.SMS_API_URL,
      payload,
      {
        headers: {
          authorization: process.env.FAST2SMS_API_KEY,
          'Content-Type': 'application/json'
        }
      }
    );

    // ✅ SAVE SUCCESS LOG
    await SmsLog.create({
      mobile,
      message,
      purpose,
      status: 'SUCCESS',
      response: response.data
    });

    return response.data;

  } catch (error) {

    // ❌ SAVE FAILURE LOG
    await SmsLog.create({
      mobile,
      message,
      purpose,
      status: 'FAILED',
      response: error.response?.data || error.message
    });

    console.error('❌ FAST2SMS ERROR:', error.response?.data || error.message);
    throw new Error('SMS sending failed');
  }
};

module.exports = { sendSMS };
