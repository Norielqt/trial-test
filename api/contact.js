// api/contact.js — Vercel Serverless Function

import { createClient } from '@supabase/supabase-js';

export default async function handler(req, res) {
  try {
    // Only allow POST
    if (req.method !== 'POST') {
      return res.status(405).json({ success: false, message: 'Method not allowed.' });
    }

    const { fullName, email, inquiryType, message } = req.body || {};

    // ---- Server-side validation ----
    const fieldErrors = {};

    if (!fullName || fullName.trim() === '') {
      fieldErrors.fullName = 'Full name is required.';
    }

    if (!email || email.trim() === '') {
      fieldErrors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      fieldErrors.email = 'Please enter a valid email address.';
    }

    if (!inquiryType || inquiryType.trim() === '') {
      fieldErrors.inquiryType = 'Please select a type of inquiry.';
    }

    if (!message || message.trim() === '') {
      fieldErrors.message = 'Message is required.';
    }

    if (Object.keys(fieldErrors).length > 0) {
      return res.status(400).json({ success: false, errors: fieldErrors });
    }

    // ---- Check env vars ----
    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error('Missing Supabase environment variables.');
      return res.status(500).json({ success: false, message: 'Server configuration error. Please contact us directly.' });
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
      message: "Thank you! Your message has been received. We'll be in touch shortly.",
    });

  } catch (err) {
    console.error('Unhandled error:', err.message);
    return res.status(500).json({ success: false, message: 'An unexpected error occurred. Please try again.' });
  }
}

