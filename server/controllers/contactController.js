import ContactMessage from '../models/ContactMessage.js';
import User from '../models/User.js'; // <-- Add this import
import { sendContactReplyNotification } from './notificationsController.js';

// @desc    Submit contact form
// @route   POST /api/contact
// @access  Public
export const submitContactForm = async (req, res) => {
  try {
    const { name, email, subject, message, category } = req.body;

    if (!name || !email || !subject || !message) {
      return res.status(400).json({ success: false, message: 'All fields are required.' });
    }

    const newMessage = await ContactMessage.create({
      name,
      email,
      subject,
      message,
      category,
    });

    res.status(201).json({
      success: true,
      message: 'Message submitted successfully.',
      data: newMessage,
    });
  } catch (error) {
    console.error('❌ Contact form error:', error);
    res.status(500).json({ success: false, message: 'Something went wrong. Please try again.' });
  }
};

// @desc    Get all contact messages (admin)
// @route   GET /api/contact
// @access  Private/Admin
export const getAllMessages = async (req, res) => {
  try {
    const messages = await ContactMessage.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: messages.length, data: messages });
  } catch (error) {
    console.error('❌ Fetch contact messages error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch contact messages' });
  }
};

// @desc    Update contact message status
// @route   PATCH /api/contact/:id
// @access  Private/Admin
export const updateMessageStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reply } = req.body;

    const contactMessage = await ContactMessage.findByIdAndUpdate(
      id,
      { status, ...(reply && { reply }) },
      { new: true }
    );

    // Send notification if reply is present and status is 'replied'
    if (reply && status === 'replied' && contactMessage) {
      // Find userId by email or from contactMessage.userId if available
      const user = await User.findOne({ email: contactMessage.email });
      if (user) {
        console.log(
          `[ADMIN REPLY NOTIFICATION] To: ${user.email} (userId: ${user._id}) | Subject: ${contactMessage.subject} | Reply: ${reply}`
        );
        await sendContactReplyNotification(user._id, {
          subject: contactMessage.subject,
          reply
        });
      }
    }

    res.json({
      success: true,
      message: 'Message updated',
      data: contactMessage
    });
  } catch (error) {
    console.error('❌ Update message error:', error);
    res.status(500).json({ success: false, message: 'Failed to update message' });
  }
};

// @desc    Delete a contact message
// @route   DELETE /api/contact/:id
// @access  Private/Admin
export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await ContactMessage.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    res.status(200).json({ success: true, message: 'Message deleted' });
  } catch (error) {
    console.error('❌ Delete message error:', error);
    res.status(500).json({ success: false, message: 'Failed to delete message' });
  }
};
