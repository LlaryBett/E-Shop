import NewsletterSubscriber from '../models/NewsletterSubscriber.js';
import { sendEmail } from '../utils/sendEmail.js'; // Make sure this exists

export const subscribe = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  try {
    // Check if already subscribed
    const existing = await NewsletterSubscriber.findOne({ email: email.toLowerCase() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already subscribed' });
    }
    // Save new subscriber
    const subscriber = await NewsletterSubscriber.create({ email: email.toLowerCase() });

    // Send welcome email
    try {
      await sendEmail({
        email: subscriber.email,
        subject: 'Welcome to E-Shop Newsletter!',
        message: `Thank you for subscribing to our newsletter. You'll now receive exclusive offers and updates from E-Shop!`
      });
    } catch (emailError) {
      // Log but don't fail subscription
      console.error('Failed to send newsletter welcome email:', emailError);
    }

    res.status(201).json({ success: true, message: 'Subscribed successfully', subscriber });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};
