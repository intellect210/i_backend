// FILE: routes/waitlistRoutes.js
const express = require('express');
const router = express.Router();
const Waitlist = require('../models/waitlistModel');
const logger = require('../utils/logger');
const EmailService = require('../services/emailService');
const Feedback = require('../models/feedbackModel');

const emailService = new EmailService();

// POST /api/waitlist/join
router.post('/join', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const existingEntry = await Waitlist.findOne({ email });

    if (existingEntry) {
          if (existingEntry.accessGranted) {
              return res.status(200).json({ message: 'You might have received an email with a link to subscribe to the play store early access, check your inbox.' });
          } else {
        return res.status(200).json({ message: 'You are already in the waitlist, keep checking your inbox if access is given.' });
      }
    }

    const waitlistEntry = new Waitlist({ email });
    await waitlistEntry.save();

    res.status(201).json({ message: 'You have been added to the waitlist successfully' });
  } catch (error) {
    if (error.name === 'ValidationError') {
         return res.status(400).json({ message: error.message });
        } else if (error.code === 11000) {
          return res.status(400).json({ message: 'Email address already exists in the waitlist' });
        }
     console.error('Error adding email to waitlist:', error);
     res.status(500).json({ message: 'Error adding email to waitlist', error: error.message });
  }
});

// POST /api/waitlist/grantaccess
router.post('/grantaccess', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }

        let waitlistEntry = await Waitlist.findOne({ email });

        if (!waitlistEntry) {
            waitlistEntry = new Waitlist({ email });
        }

        const accessLink = 'https://play.google.com/apps/testing/project.aio.project24';
        const emailSubject = 'Early Access Granted';
        const emailText = `Congratulations! You've been granted ̥early access. Use this link to subscribe: ${accessLink}. Make sure to use the same email address. \n Thank you for being our early tester, your feedback is invaluable, please provide the feedback on our website!`;
        const emailHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            margin: 0;
            padding: 20px;
            background-color: #f4f4f4;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            background: white;
            padding: 20px;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        }
        h1 {
            color: #333;
            font-size: 24px;
        }
        p {
            color: #555;
            margin: 10px 0;
        }
        a {
            color: #0066cc;
            text-decoration: none;
        }
        a:hover {
            text-decoration: underline;
        }
        .footer {
            margin-top: 20px;
            font-size: 12px;
            color: #888;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>Congratulations!</h1>
        <p>We are thrilled to inform you that you have been granted early access to our platform. To get started, please use the following <a href="${accessLink}">link</a> to subscribe. Kindly ensure that you use the same email address you registered with.</p>
        <p>We sincerely appreciate your participation as an early tester. Your feedback is invaluable to us, so please take a moment to share your thoughts on our website.</p>
        <p>Thank you for your support! We look forward to your insights.</p>
        <p class="footer">Best regards,<br>The Team</p>
    </div>
</body>
</html>`;

        try {
            await emailService.sendEmail(email, emailSubject, emailText, emailHtml);
            waitlistEntry.accessGranted = true;
            await waitlistEntry.save();
            res.status(200).json({ message: 'Access granted successfully, email sent with link.', accessLink });
        } catch (emailError) {
            console.error('Error sending email:', emailError);
            res.status(500).json({ message: 'Error sending email, access not granted.', error: emailError.message });
        }
    } catch (error) {
        console.error('Error granting access:', error);
        res.status(500).json({ message: 'Error granting access', error: error.message });
    }
});

// POST /api/waitlist/feedback
router.post('/feedback', async (req, res) => {
    try {
        const { email, feedback } = req.body;
  
        if (!email) {
            return res.status(400).json({ message: 'Email is required' });
        }
          
        if (!feedback) {
            return res.status(400).json({ message: 'Feedback is required' });
        }
      
      const newFeedback = new Feedback({ email, feedback });
      await newFeedback.save();
      
      const feedbackSubject = 'Feedback Received';
const feedbackText = 'Thank you for your feedback! We greatly appreciate your input, as it helps us improve our services. Stay tuned for updates on our Play Store and website. We’re working hard to enhance your experience!';

const feedbackHtml = `
  <html>
    <head>
      <style>
        body {
          font-family: Arial, sans-serif;
          background-color: #f8f9fa;
          color: #343a40;
          padding: 20px;
          margin: 0;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #ffffff;
          border-radius: 8px;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
          padding: 20px;
        }
        h1 {
          color: #007bff;
        }
        p {
          font-size: 16px;
          line-height: 1.5;
        }
        .footer {
          margin-top: 20px;
          font-size: 14px;
          color: #6c757d;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>${feedbackSubject}</h1>
        <p>${feedbackText}</p>
        <div class="footer">
          If you have any more questions or suggestions, feel free to reach out to us!
        </div>
      </div>
    </body>
  </html>
`;

  
          try {
             await emailService.sendEmail(email, feedbackSubject, feedbackText, feedbackHtml);
              res.status(200).json({ message: 'Feedback submitted successfully, confirmation email sent.' });
          } catch (emailError) {
            console.error('Error sending feedback confirmation email:', emailError);
            res.status(200).json({ message: 'Feedback submitted successfully'});
        }
  
    } catch (error) {
        console.error('Error submitting feedback:', error);
        res.status(500).json({ message: 'Error submitting feedback', error: error.message });
    }
  });

module.exports = router;