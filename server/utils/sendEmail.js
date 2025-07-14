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
          background-color: #2563eb;
          padding: 20px;
          text-align: center;
        }
        .logo {
          display: inline-flex;
          align-items: center;
          gap: 8px;
          color: white;
          text-decoration: none;
          font-weight: bold;
          font-size: 20px;
        }
        .logo-icon {
          width: 32px;
          height: 32px;
          background-color: white;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #2563eb;
          font-weight: bold;
          font-size: 18px;
        }
        .content {
          padding: 24px;
        }
        .message {
          margin-bottom: 24px;
          color: #4b5563;
        }
        .button {
          display: inline-block;
          padding: 12px 24px;
          background-color: #2563eb;
          color: white;
          text-decoration: none;
          border-radius: 6px;
          font-weight: 500;
          margin: 16px 0;
        }
        .button:hover {
          background-color: #1d4ed8;
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
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <a href="#" class="logo">
            <div class="logo-icon">E</div>
            <span>E-Shop</span>
          </a>
        </div>
        
        <div class="content">
          <h2>${options.subject}</h2>
          <div class="message">
            ${options.message.replace(/\n/g, '<br>')}
          </div>
          
          ${options.actionUrl ? `
            <a href="${options.actionUrl}" class="button">
              ${options.actionText || 'Take Action'}
            </a>
          ` : ''}
        </div>
        
        <div class="footer">
          <p>© ${new Date().getFullYear()} E-Shop. All rights reserved.</p>
          <p>
            <a href="#" style="color: #2563eb; text-decoration: none;">Privacy Policy</a> | 
            <a href="#" style="color: #2563eb; text-decoration: none;">Terms of Service</a>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
};