import nodemailer from "nodemailer";

interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  private isConfigured: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize() {
    const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS, SMTP_SECURE } = process.env;

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASS) {
      console.log("⚠️  Email service not configured (missing SMTP credentials)");
      return;
    }

    this.transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: parseInt(SMTP_PORT || "587"),
      secure: SMTP_SECURE === "true",
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASS,
      },
    });

    this.isConfigured = true;
    console.log("✅ Email service initialized");
  }

  async send(options: EmailOptions): Promise<boolean> {
    if (!this.isConfigured || !this.transporter) {
      console.log("Email not sent (service not configured):", options.subject);
      return false;
    }

    try {
      await this.transporter.sendMail({
        from: process.env.SMTP_FROM || "LLModel-Forge <noreply@llmodel-forge.com>",
        to: Array.isArray(options.to) ? options.to.join(", ") : options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      });
      console.log(`Email sent: ${options.subject} to ${options.to}`);
      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  // Pre-built email templates
  async sendWelcome(email: string, name: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: "Welcome to LLModel-Forge! 🚀",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to LLModel-Forge</h1>
            </div>
            <div class="content">
              <h2>Hello ${name}! 👋</h2>
              <p>Thank you for joining LLModel-Forge, your enterprise MLOps platform.</p>
              <p>With LLModel-Forge, you can:</p>
              <ul>
                <li>📊 Manage and version your ML models</li>
                <li>🔄 Orchestrate training pipelines</li>
                <li>🧪 Track experiments and metrics</li>
                <li>🏷️ Label data efficiently</li>
                <li>🚀 Deploy models to production</li>
              </ul>
              <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">Get Started</a>
            </div>
            <div class="footer">
              <p>© 2024 LLModel-Forge. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendPipelineComplete(email: string, name: string, pipelineName: string, status: "completed" | "failed"): Promise<boolean> {
    const isSuccess = status === "completed";
    return this.send({
      to: email,
      subject: `Pipeline ${isSuccess ? "Completed ✅" : "Failed ❌"}: ${pipelineName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: ${isSuccess ? '#10b981' : '#ef4444'}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .status { font-size: 24px; font-weight: bold; color: ${isSuccess ? '#10b981' : '#ef4444'}; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>${isSuccess ? '✅ Pipeline Completed' : '❌ Pipeline Failed'}</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Your pipeline <strong>${pipelineName}</strong> has ${status}.</p>
              <p class="status">Status: ${status.toUpperCase()}</p>
              <a href="${process.env.APP_URL || 'http://localhost:5000'}/pipelines" class="button">View Pipeline Details</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendModelDeployed(email: string, name: string, modelName: string, stage: string): Promise<boolean> {
    return this.send({
      to: email,
      subject: `Model Deployed to ${stage}: ${modelName} 🚀`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .badge { display: inline-block; background: #6366f1; color: white; padding: 4px 12px; border-radius: 20px; font-size: 14px; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🚀 Model Deployed</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <p>Great news! Your model <strong>${modelName}</strong> has been deployed.</p>
              <p>Stage: <span class="badge">${stage.toUpperCase()}</span></p>
              <a href="${process.env.APP_URL || 'http://localhost:5000'}/model-registry" class="button">View Model</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendDriftAlert(email: string, name: string, modelName: string, driftScore: number): Promise<boolean> {
    return this.send({
      to: email,
      subject: `⚠️ Data Drift Alert: ${modelName}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .alert-box { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 8px; padding: 20px; margin: 20px 0; }
            .button { display: inline-block; background: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⚠️ Data Drift Detected</h1>
            </div>
            <div class="content">
              <h2>Hi ${name},</h2>
              <div class="alert-box">
                <p><strong>Model:</strong> ${modelName}</p>
                <p><strong>Drift Score:</strong> ${(driftScore * 100).toFixed(2)}%</p>
                <p>We've detected significant data drift that may affect model performance.</p>
              </div>
              <p>Recommended actions:</p>
              <ul>
                <li>Review recent data distributions</li>
                <li>Consider retraining the model</li>
                <li>Check for data pipeline issues</li>
              </ul>
              <a href="${process.env.APP_URL || 'http://localhost:5000'}" class="button">Investigate</a>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }

  async sendWeeklyDigest(email: string, name: string, stats: any): Promise<boolean> {
    return this.send({
      to: email,
      subject: "📊 Your Weekly LLModel-Forge Digest",
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 8px 8px; }
            .stat-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px; margin: 20px 0; }
            .stat-card { background: white; padding: 20px; border-radius: 8px; text-align: center; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
            .stat-value { font-size: 32px; font-weight: bold; color: #6366f1; }
            .stat-label { color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📊 Weekly Digest</h1>
            </div>
            <div class="content">
              <h2>Hi ${name}!</h2>
              <p>Here's your weekly summary from LLModel-Forge:</p>
              <div class="stat-grid">
                <div class="stat-card">
                  <div class="stat-value">${stats.predictions || 0}</div>
                  <div class="stat-label">Predictions Made</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats.experiments || 0}</div>
                  <div class="stat-label">Experiments Run</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats.pipelines || 0}</div>
                  <div class="stat-label">Pipelines Executed</div>
                </div>
                <div class="stat-card">
                  <div class="stat-value">${stats.modelsDeployed || 0}</div>
                  <div class="stat-label">Models Deployed</div>
                </div>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    });
  }
}

export const emailService = new EmailService();

