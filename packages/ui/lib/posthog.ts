import { posthog } from 'posthog-js';

/**
 * Types for PostHog events
 */
type FocusModeContext = 'new_conversation' | 'mid_conversation';
type FeedbackRating = 'positive' | 'negative';

/**
 * Track when a conversation starts
 * @param focusMode - The focus mode being used
 * @param conversationId - The ID of the conversation
 */
export const trackConversationStart = (
  focusMode: string,
  conversationId: string,
) => {
  if (typeof window === 'undefined') return;

  try {
    posthog.capture('conversation_started', {
      focus_mode: focusMode,
      conversation_id: conversationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking conversation start:', error);
  }
};

/**
 * Track when a user message is sent
 * @param messageLength - The length of the message
 */
export const trackUserMessage = (messageLength: number) => {
  if (typeof window === 'undefined') return;

  try {
    posthog.capture('user_message_sent', {
      message_length: messageLength,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking user message:', error);
  }
};

/**
 * Track feedback on an LLM answer
 * @param rating - Whether the feedback is positive or negative
 * @param conversationId - The ID of the conversation
 * @param messageId - The ID of the message
 * @param content - The content of the message (will be truncated)
 * @param conversationHistory - The history of the conversation for context (optional)
 * @param comment - Optional detailed feedback comment
 * @param sources - Optional sources used in the response
 */
export const trackFeedback = (
  rating: FeedbackRating,
  conversationId: string,
  messageId: string,
  content: string,
  conversationHistory?: string,
  comment?: string,
  sources?: any[],
) => {
  if (typeof window === 'undefined') return;

  try {
    // Prepare common properties
    const eventProperties = {
      rating,
      conversation_id: conversationId,
      message_id: messageId,
      content_snippet: content,
      has_sources: sources && sources.length > 0,
      source_count: sources?.length || 0,
      has_comment: !!comment && comment.trim().length > 0,
      timestamp: new Date().toISOString(),
    };

    // Add comment and conversation history if provided
    if (comment && comment.trim()) {
      Object.assign(eventProperties, {
        comment,
        conversation_history: conversationHistory || '',
      });
    }

    // Capture a single feedback event with all relevant data
    posthog.capture('feedback_submitted', eventProperties);

    // Update user properties for feedback statistics
    updateUserFeedbackStats(rating);
  } catch (error) {
    console.error('Error tracking feedback:', error);
  }
};

/**
 * Track when a user views the history page
 * @param sessionId - The ID of the current session
 */
export const trackHistoryPageViewed = (sessionId: string) => {
  if (typeof window === 'undefined') return;

  try {
    posthog.capture('history_page_viewed', {
      session_id: sessionId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking history page view:', error);
  }
};

/**
 * Track when a user clicks on a history item
 * @param conversationId - The ID of the conversation that was clicked
 */
export const trackHistoryItemClicked = (conversationId: string) => {
  if (typeof window === 'undefined') return;

  try {
    posthog.capture('history_item_clicked', {
      conversation_id: conversationId,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error tracking history item click:', error);
  }
};

/**
 * Initialize a PostHog user property for tracking feedback statistics
 */
export const initUserFeedbackStats = () => {
  if (typeof window === 'undefined') return;

  try {
    // Set initial feedback statistics if they don't exist
    posthog.people.set_once({
      feedback_given_count: 0,
      positive_feedback_count: 0,
      negative_feedback_count: 0,
      last_feedback_at: null,
    });
  } catch (error) {
    console.error('Error initializing user feedback stats:', error);
  }
};

/**
 * Update user properties when feedback is given
 * @param rating - Whether the feedback was positive or negative
 */
export const updateUserFeedbackStats = (rating: FeedbackRating) => {
  if (typeof window === 'undefined') return;

  try {
    // Increment the total feedback count
    posthog.people.set({
      feedback_given_count:
        posthog.get_property('feedback_given_count') + 1 || 1,
    });

    // Set the last feedback timestamp
    posthog.people.set({
      last_feedback_at: new Date().toISOString(),
    });

    // Increment the appropriate counter based on rating
    if (rating === 'positive') {
      posthog.people.set({
        positive_feedback_count:
          posthog.get_property('positive_feedback_count') + 1 || 1,
      });
    } else {
      posthog.people.set({
        negative_feedback_count:
          posthog.get_property('negative_feedback_count') + 1 || 1,
      });
    }
  } catch (error) {
    console.error('Error updating user feedback stats:', error);
  }
};

// For backward compatibility
export const trackFeedbackSubmitted = trackFeedback;
export const trackDetailedFeedback = (
  conversationId: string,
  messageId: string,
  comment: string,
  conversationHistory: string,
) =>
  trackFeedback(
    'negative',
    conversationId,
    messageId,
    '',
    conversationHistory,
    comment,
  );
