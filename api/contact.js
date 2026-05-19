// api/contact.js — Vercel Serverless Function

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, message: 'Method not allowed.' });
  }

  const { fullName, email, inquiryType, message } = req.body;

  // ---- Server-side validation ----
  const errors = [];

  if (!fullName || fullName.trim() === '') {
    errors.push('Full name is required.');
  }

  if (!email || email.trim() === '') {
    errors.push('Email address is required.');
  } else {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      errors.push('Please enter a valid email address.');
    }
  }

  if (!inquiryType || inquiryType.trim() === '') {
    errors.push('Please select a type of inquiry.');
  }

  if (!message || message.trim() === '') {
    errors.push('Message is required.');
  }

  if (errors.length > 0) {
    return res.status(400).json({ success: false, message: errors.join(' ') });
  }

  // ---- Store in Supabase ----
  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  const { error } = await supabase.from('contact_submissions').insert([{
    full_name:    fullName.trim(),
    email:        email.trim(),
    inquiry_type: inquiryType.trim(),
    message:      message.trim(),
  }]);

  if (error) {
    console.error('Supabase insert error:', error.message);
    return res.status(500).json({ success: false, message: 'Failed to save your message. Please try again.' });
  }

  return res.status(200).json({
    success: true,
    message: 'Thank you! Your message has been received. We\'ll be in touch shortly.',
  });
}
