import nodemailer from 'nodemailer';

export const sendEmail = async (options) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: Number(process.env.EMAIL_PORT),
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const mailOptions = {
      from: `E-Shop <${process.env.EMAIL_FROM}>`,
      to: options.email,
      subject: options.subject,
      text: options.message,
      html: options.html || generateEmailTemplate(options),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent: %s', info.messageId);
  } catch (error) {
    console.error('❌ Error sending email:', error);
    throw error;
  }
};

const generateEmailTemplate = (options) => {
  // Extract additional options with defaults
  const {
    greeting = 'Hello',
    name = 'User',
    actionUrl,
    actionText,
    footerText,
    showContactSupport = false
  } = options;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${options.subject}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          line-height: 1.6;
          color: #374151;
          background-color: #f9fafb;
          margin: 0;
          padding: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background-color: #ffffff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
        }
        .header {
          background-color: #4f46e5;
          padding: 20px;
          text-align: center;
        }
        .logo {
          display: inline-block;
          text-align: center;
          text-decoration: none;
        }
        .logo-container {
          position: relative;
          display: inline-block;
          vertical-align: middle;
          margin-right: 10px;
        }
        .logo-icon {
          width: 48px;
          height: 48px;
          background-color: #4f46e5;
          border-radius: 12px;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 24px;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .sparkle-dot {
          position: absolute;
          top: -4px;
          right: -4px;
          width: 16px;
          height: 16px;
          background-color: #fbbf24;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .logo-text-container {
          display: inline-block;
          vertical-align: middle;
          text-align: left;
        }
        .logo-text {
          font-size: 28px;
          font-weight: bold;
          color: #4f46e5;
          margin: 0;
          padding: 0;
        }
        .logo-subtitle {
          font-size: 14px;
          color: #f3f4f6;
          margin: 0;
          padding: 0;
        }
        .content {
          padding: 24px;
        }
        .greeting {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 16px;
        }
        .message {
          margin-bottom: 24px;
          color: #4b5563;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white !important;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 16px 0;
          text-align: center;
        }
        .button:hover {
          background-color: #1d4ed8;
        }
        .button-container {
          text-align: center;
          margin: 24px 0;
        }
        .footer {
          padding: 16px;
          text-align: center;
          font-size: 14px;
          color: #6b7280;
          border-top: 1px solid #e5e7eb;
        }
        .highlight {
          color: #2563eb;
          font-weight: 500;
        }
        .note {
          font-size: 14px;
          color: #6b7280;
          padding: 12px;
          background-color: #f3f4f6;
          border-radius: 6px;
          margin-top: 16px;
        }
        .url-display {
          word-break: break-all;
          font-size: 14px;
          color: #4b5563;
          padding: 12px;
          background-color: #f3f4f6;
          border-radius: 6px;
          margin-top: 12px;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header" style="background-color: #4f46e5; padding: 20px; text-align: center;">
          <table cellpadding="0" cellspacing="0" border="0" align="center" width="100%" style="max-width: 200px;">
            <tr>
              <td width="60" valign="middle">
                <div class="logo-container">
                  <div class="logo-icon">
                    E
                    <div class="sparkle-dot">
                      <span style="font-size: 10px; color: #92400e;">✦</span>
                    </div>
                  </div>
                </div>
              </td>
              <td valign="middle" style="text-align: left;">
                <div class="logo-text-container">
                  <div class="logo-text" style="color: white;">E-Shop</div>
                  <div class="logo-subtitle" style="color: #f3f4f6;">Premium Store</div>
                </div>
              </td>
            </tr>
          </table>
        </div>
        
        <div class="content">
          <div class="greeting">${greeting}${name ? ` ${name}` : ''},</div>
          
          <div class="message">
            ${
              // Replace all $ amounts with Ksh in the message
              options.message.replace(/\$/g, 'Ksh').replace(/\n/g, '<br>')
            }
          </div>
          
          ${actionUrl ? `
            <div class="button-container">
              <a href="${actionUrl}" class="button">
                ${actionText || 'Click Here'}
              </a>
            </div>
            
            <div class="url-display">
              If the button above doesn't work, copy and paste this URL into your browser: <br>
              <a href="${actionUrl}">${actionUrl}</a>
            </div>
          ` : ''}

          ${showContactSupport ? `
            <div class="note">
              If you have any questions or need help, please contact our support team at <a href="mailto:support@eshop.com">support@eshop.com</a>.
            </div>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>${footerText || `This email was sent to you because you have an account with E-Shop.`}</p>
          <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
          <p>
            <a href="${process.env.CLIENT_URL}/privacy" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> | 
            <a href="${process.env.CLIENT_URL}/terms" style="color: #2563eb; text-decoration: none;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};