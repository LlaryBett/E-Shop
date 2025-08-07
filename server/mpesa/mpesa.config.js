import dotenv from 'dotenv';
dotenv.config();

const mpesaConfig = {
  consumerKey: process.env.MPESA_CONSUMER_KEY,
  consumerSecret: process.env.MPESA_CONSUMER_SECRET,
  passKey: process.env.MPESA_PASSKEY,
  shortCode: process.env.MPESA_SHORTCODE,
  initiatorName: process.env.MPESA_INITIATOR_NAME,
  securityCredential: process.env.MPESA_SECURITY_CREDENTIAL,
  lipaNaMpesaShortcode: process.env.LIPA_NA_MPESA_SHORTCODE,
  lipaNaMpesaPasskey: process.env.LIPA_NA_MPESA_PASSKEY,
  callbackURL: process.env.MPESA_CALLBACK_URL,
  env: process.env.MPESA_ENV || 'sandbox',
  
  // API Endpoints
  endpoints: {
    auth: process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials'
      : 'https://api.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    stkPush: process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest'
      : 'https://api.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
    stkQuery: process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query'
      : 'https://api.safaricom.co.ke/mpesa/stkpushquery/v1/query',
    b2c: process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/b2c/v1/paymentrequest'
      : 'https://api.safaricom.co.ke/mpesa/b2c/v1/paymentrequest',
    c2bRegister: process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/registerurl'
      : 'https://api.safaricom.co.ke/mpesa/c2b/v1/registerurl',
    c2bSimulate: process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/c2b/v1/simulate'
      : 'https://api.safaricom.co.ke/mpesa/c2b/v1/simulate',
    transactionStatus: process.env.MPESA_ENV === 'sandbox'
      ? 'https://sandbox.safaricom.co.ke/mpesa/transactionstatus/v1/query'
      : 'https://api.safaricom.co.ke/mpesa/transactionstatus/v1/query'
  }
};

export default mpesaConfig;