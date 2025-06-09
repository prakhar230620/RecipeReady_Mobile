import nodemailer from 'nodemailer';

// SMTP transporter setup
const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USERNAME || 'toolminesai@gmail.com',
    pass: process.env.SMTP_PASSWORD || 'rsrv vohq yfox hskv'
  }
});

// Email templates
export const emailTemplates = {
  welcome: (name: string) => ({
    subject: 'Welcome to RecipeReady - Your Culinary Journey Begins!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a5568;">Welcome to RecipeReady!</h1>
        </div>
        <div style="margin-bottom: 20px;">
          <p>Hello ${name},</p>
          <p>Thank you for joining RecipeReady! We're excited to have you on board.</p>
          <p>With RecipeReady, you can:</p>
          <ul>
            <li>Generate personalized recipes based on ingredients you have</li>
            <li>Save your favorite recipes for quick access</li>
            <li>Explore a world of culinary possibilities</li>
          </ul>
          <p>Get started by exploring recipes or creating your first AI-generated recipe!</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0;">If you have any questions or need assistance, feel free to reply to this email or contact our support team.</p>
        </div>
        <div style="text-align: center; color: #718096; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RecipeReady. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  accountDeletion: (name: string) => ({
    subject: 'Your RecipeReady Account Deletion Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a5568;">Account Deletion Confirmation</h1>
        </div>
        <div style="margin-bottom: 20px;">
          <p>Hello ${name},</p>
          <p>We've received your request to delete your RecipeReady account.</p>
          <p>Your account has been scheduled for deletion. Please note:</p>
          <ul>
            <li>Your account data will be retained for 30 days before permanent deletion.</li>
            <li>If you change your mind, you can sign up again with the same email within this 30-day period to restore your account.</li>
            <li>After 30 days, all your data will be permanently deleted and cannot be recovered.</li>
          </ul>
          <p>We're sorry to see you go and hope to welcome you back in the future!</p>
        </div>
        <div style="background-color: #f7fafc; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
          <p style="margin: 0;">If you did not request this deletion or have any questions, please contact our support team immediately.</p>
        </div>
        <div style="text-align: center; color: #718096; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RecipeReady. All rights reserved.</p>
        </div>
      </div>
    `
  }),
  bulkEmail: (subject: string, content: string) => ({
    subject,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #4a5568;">RecipeReady</h1>
        </div>
        <div style="margin-bottom: 20px;">
          ${content}
        </div>
        <div style="text-align: center; color: #718096; font-size: 12px;">
          <p>© ${new Date().getFullYear()} RecipeReady. All rights reserved.</p>
          <p>You're receiving this email because you're a member of RecipeReady.</p>
        </div>
      </div>
    `
  })
};

// Send email function
export async function sendEmail(to: string, template: any) {
  try {
    const info = await transporter.sendMail({
      from: '"RecipeReady" <toolminesai@gmail.com>',
      to,
      subject: template.subject,
      html: template.html
    });
    
    console.log('Email sent:', info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error };
  }
}