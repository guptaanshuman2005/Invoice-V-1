import React, { useState } from 'react';
import Modal from './common/Modal';
import Button from './common/Button';
import Input from './common/Input';
import { supabase } from '../supabase';
import { trackEvent } from '../utils/analytics';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
}

const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose, userId }) => {
  const [type, setType] = useState('bug');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim() || !message.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { error: submitError } = await supabase
        .from('feedback')
        .insert([
          {
            user_id: userId,
            type,
            subject,
            message,
          }
        ]);

      if (submitError) throw submitError;

      trackEvent('submit_feedback', { type, userId });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setSubject('');
        setMessage('');
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Error submitting feedback:', err);
      setError(err.message || 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Help & Feedback">
      <div className="p-6">
        {success ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Thank You!</h3>
            <p className="text-slate-600 dark:text-slate-400">Your feedback has been submitted successfully. Our team will review it shortly.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Feedback Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all dark:text-white"
              >
                <option value="bug">Report a Bug</option>
                <option value="feature">Feature Request</option>
                <option value="support">General Support / Contact</option>
              </select>
            </div>
            
            <Input 
              label="Subject" 
              value={subject} 
              onChange={(e) => setSubject(e.target.value)} 
              placeholder="Brief summary of your issue or request"
              required
            />

            <div>
              <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">Message</label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={5}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-accent/20 focus:border-accent outline-none transition-all dark:text-white resize-none"
                placeholder="Please provide as much detail as possible..."
                required
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <div className="pt-4 flex justify-end gap-4">
              <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </Button>
            </div>
          </form>
        )}
      </div>
    </Modal>
  );
};

export default FeedbackModal;
