# Email Automation Setup Guide

This guide will help you set up automatic invoice processing from emails.

## 🚀 Features

- **Automatic Email Monitoring**: Checks for new emails every 5 minutes
- **Smart Invoice Detection**: Identifies invoice-related emails using keywords
- **PDF Extraction**: Automatically extracts PDF attachments
- **Seamless Integration**: Works with your existing invoice processing pipeline
- **Real-time Status**: Monitor the system status from the web interface

## 📧 Supported Email Providers

- **Gmail** (recommended)
- **Outlook/Hotmail**
- **Yahoo Mail**
- **Custom IMAP servers**

## ⚙️ Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Email Settings

Create a `.env` file in your project root:

```env
# Email Monitoring Configuration
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
EMAIL_HOST=imap.gmail.com
EMAIL_PORT=993

# Server Configuration
PORT=3000
NODE_ENV=development
```

### 3. Gmail Setup (Recommended)

If using Gmail, you'll need to:

1. **Enable 2-Factor Authentication** on your Google account
2. **Generate an App Password**:
   - Go to Google Account settings
   - Security → 2-Step Verification → App passwords
   - Generate a password for "Mail"
   - Use this password in your `.env` file

### 4. Start the System

```bash
# Start both frontend and backend
npm run start-all

# Or start individually
npm run server    # Backend
npm run dev       # Frontend
```

## 🔧 Configuration

### Email Keywords

The system automatically detects invoice emails using these keywords:
- `invoice`, `bill`, `payment`, `receipt`, `statement`
- `amount due`, `total due`, `balance due`, `payment due`

### Monitoring Frequency

- **Check Interval**: Every 5 minutes
- **Status Updates**: Every 30 seconds in the UI
- **Email Processing**: Real-time when new emails arrive

## 📱 Using the Interface

1. **Navigate to Invoices page** (`/invoices`)
2. **Configure your email settings**:
   - Enter email address and password
   - Set IMAP host and port (defaults work for most providers)
3. **Test the connection** to ensure everything works
4. **Start monitoring** to begin automatic processing

## 🔍 How It Works

1. **Email Detection**: System scans for unread emails containing invoice keywords
2. **Attachment Extraction**: PDF attachments are automatically downloaded
3. **File Processing**: Extracted files are moved to your processing pipeline
4. **Pipeline Integration**: Files are processed using your existing invoice parsing system
5. **Status Updates**: Real-time updates on processing status

## 🛠️ Troubleshooting

### Connection Issues

- **Check credentials**: Ensure email and password are correct
- **Verify IMAP settings**: Confirm host and port for your email provider
- **2FA accounts**: Use App Password, not your regular password
- **Firewall**: Ensure port 993 (IMAP) is not blocked

### Processing Issues

- **File permissions**: Ensure the `uploads/` directory is writable
- **Python dependencies**: Verify your invoice processing pipeline works
- **Logs**: Check server console for detailed error messages

### Performance

- **Email volume**: System handles hundreds of emails efficiently
- **File size**: Large PDFs may take longer to process
- **Memory usage**: Monitor system resources during heavy processing

## 🔒 Security Considerations

- **App Passwords**: Use dedicated app passwords, not account passwords
- **Environment Variables**: Never commit `.env` files to version control
- **Network Security**: Ensure your server is behind a firewall
- **Access Control**: Limit access to the monitoring interface

## 📊 Monitoring & Logs

### Real-time Status
- Active/Inactive monitoring status
- Last check timestamp
- Connection health indicators

### Server Logs
- Email connection attempts
- File processing status
- Error messages and debugging info

### Email Processing Logs
- Number of emails processed
- Attachments extracted
- Processing pipeline status

## 🚀 Advanced Configuration

### Custom Email Providers

For custom IMAP servers, modify the configuration:

```javascript
const emailConfig = {
  user: 'your-email@company.com',
  password: 'your-password',
  host: 'mail.company.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};
```

### Custom Keywords

Modify the `isInvoiceEmail` function in `server.js`:

```javascript
isInvoiceEmail(parsed) {
  const customKeywords = [
    'invoice', 'bill', 'payment', 'receipt',
    'your-custom-keyword', 'company-specific-term'
  ];
  
  // Your custom logic here
}
```

### Processing Rules

Customize email processing rules in the `processEmailContent` method:

```javascript
// Add custom filtering logic
if (parsed.from?.text?.includes('specific-vendor@domain.com')) {
  // Process vendor-specific emails differently
}
```

## 📞 Support

If you encounter issues:

1. Check the server console for error messages
2. Verify email configuration settings
3. Test email connection using the interface
4. Review the troubleshooting section above

## 🔄 Updates & Maintenance

- **Regular Updates**: Keep dependencies updated
- **Email Provider Changes**: Update configuration if switching providers
- **Security Updates**: Regularly rotate app passwords
- **Backup**: Backup your email configuration and processing rules

---

**Happy Automating! 🎉**

Your invoice processing is now fully automated - just sit back and let the system handle everything!
