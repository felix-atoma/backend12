 
const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: `"École Saint Pierre Claver" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
        text: text || this.htmlToText(html),
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }
  }

  htmlToText(html) {
    return html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<p>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  // Application confirmation email
  async sendApplicationConfirmation(email, applicationNumber, studentName) {
    const subject = 'Application Received - École Saint Pierre Claver';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .footer { background: #ddd; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>École Saint Pierre Claver</h1>
            <p>Application Received</p>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian,</h2>
            <p>Thank you for submitting the application for <strong>${studentName}</strong>.</p>
            <p>Your application has been received and is currently under review.</p>
            
            <div style="background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #8B4513;">
              <p><strong>Application Number:</strong> ${applicationNumber}</p>
              <p><strong>Date Submitted:</strong> ${new Date().toLocaleDateString()}</p>
            </div>
            
            <p><strong>What happens next?</strong></p>
            <ul>
              <li>Our admissions team will review your application</li>
              <li>You may be contacted for additional information</li>
              <li>We will notify you of the decision via email</li>
              <li>The review process typically takes 5-7 business days</li>
            </ul>
            
            <p>If you have any questions, please contact our admissions office at 
            <a href="mailto:admissions@stpierreclaver.edu.gh">admissions@stpierreclaver.edu.gh</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} École Saint Pierre Claver. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // Message reply email
  async sendMessageReply(email, originalSubject, replyMessage, adminName) {
    const subject = `Re: ${originalSubject}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .reply { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #8B4513; }
          .footer { background: #ddd; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>École Saint Pierre Claver</h1>
            <p>Response to Your Inquiry</p>
          </div>
          <div class="content">
            <p>Thank you for contacting École Saint Pierre Claver.</p>
            
            <div class="reply">
              <p><strong>Response from ${adminName}:</strong></p>
              <p>${replyMessage.replace(/\n/g, '<br>')}</p>
            </div>
            
            <p>If you have any further questions, please don't hesitate to contact us.</p>
            
            <p>Best regards,<br>
            The Administration Team<br>
            École Saint Pierre Claver<br>
            <a href="mailto:contact@stpierreclaver.edu.gh">contact@stpierreclaver.edu.gh</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} École Saint Pierre Claver. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }

  // Application status update email
  async sendApplicationStatusUpdate(email, applicationNumber, studentName, status, additionalNotes = '') {
    const statusMessages = {
      under_review: 'is currently under review',
      accepted: 'has been accepted',
      rejected: 'could not be accepted at this time',
      waiting_list: 'has been placed on our waiting list'
    };

    const subject = `Application Update - ${applicationNumber}`;
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: #8B4513; color: white; padding: 20px; text-align: center; }
          .content { background: #f9f9f9; padding: 20px; }
          .status { background: white; padding: 15px; margin: 20px 0; border-left: 4px solid #8B4513; }
          .footer { background: #ddd; padding: 10px; text-align: center; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>École Saint Pierre Claver</h1>
            <p>Application Status Update</p>
          </div>
          <div class="content">
            <h2>Dear Parent/Guardian,</h2>
            
            <div class="status">
              <p><strong>Application Number:</strong> ${applicationNumber}</p>
              <p><strong>Student:</strong> ${studentName}</p>
              <p><strong>Status:</strong> Your application ${statusMessages[status] || 'has been updated'}.</p>
              ${additionalNotes ? `<p><strong>Additional Notes:</strong> ${additionalNotes}</p>` : ''}
            </div>
            
            ${status === 'accepted' ? `
            <p><strong>Next Steps:</strong></p>
            <ul>
              <li>You will receive an acceptance package via email within 3 business days</li>
              <li>Complete and return the required forms by the specified deadline</li>
              <li>Submit any outstanding documents</li>
              <li>Pay the enrollment fee to secure your spot</li>
            </ul>
            ` : ''}
            
            <p>If you have any questions, please contact our admissions office at 
            <a href="mailto:admissions@stpierreclaver.edu.gh">admissions@stpierreclaver.edu.gh</a></p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} École Saint Pierre Claver. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    return await this.sendEmail(email, subject, html);
  }
}

module.exports = new EmailService();