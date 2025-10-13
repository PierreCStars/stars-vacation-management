#!/bin/bash

# Add SMTP configuration to .env file
echo "" >> .env
echo "# Email Configuration (SMTP)" >> .env
echo "GMAIL_USER=pierre@stars.mc" >> .env
echo "SMTP_HOST=smtp.gmail.com" >> .env
echo "SMTP_PORT=587" >> .env
echo "SMTP_SECURE=false" >> .env
echo "SMTP_USER=pierre@stars.mc" >> .env
echo "SMTP_FROM=hr@stars.mc" >> .env
echo "FROM_EMAIL=hr@stars.mc" >> .env
echo "SMTP_PASSWORD=ftbhgfgeuhuzrtks" >> .env

echo "✅ SMTP configuration added to .env file"
echo "📧 You can now test the email functionality with: node test-email-simple.cjs"
echo "📧 Emails will be sent from hr@stars.mc (using pierre@stars.mc credentials)" 