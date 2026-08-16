import { useRef, useState, useCallback, useEffect, useLayoutEffect } from 'react';

const DEFAULT_THRESHOLD = 100;

const getNewMessages = (prev, next) => {
  if (!prev.length) return next;
  const prevIds = new Set(prev.map((m) => m.id));
  return next.filter((m) => !prevIds.has(m.id));
};

const messagesAreEqual = (prev, next) => {
  if (prev.length !== next.length) return false;
  return prev.every((m, i) => m.id === next[i]?.id);
};

export function useChatScroll(messages, options = {}) {
  const { threshold = DEFAULT_THRESHOLD, unreadSeparatorRef } = options;

  const containerRef = useRef(null);
  const messagesEndRef = useRef(null);
  const prevMessagesRef = useRef([]);
  const isInitialLoadRef = useRef(true);

  // Refs to capture scrolling state before layout changes during the render phase
  const prevScrollHeightRef = useRef(null);
  const prevScrollTopRef = useRef(null);

  // Refs for tracking near-bottom state without triggering re-renders on every scroll
  const isNearBottomRef = useRef(true);

  // States
  const [isNearBottom, setIsNearBottom] = useState(true);
  const [unreadCount, setUnreadCount] = useState(0);

  // Capture DOM measurements during the render phase (before DOM update/layout)
  // when the messages prop changes. At this point, containerRef still contains the old DOM.
  if (prevMessagesRef.current !== messages) {
    if (containerRef.current) {
      prevScrollHeightRef.current = containerRef.current.scrollHeight;
      prevScrollTopRef.current = containerRef.current.scrollTop;
    }
  }

  const checkIsNearBottom = useCallback(() => {
    const el = containerRef.current;
    if (!el) return true;
    // We add 1px threshold tolerance for mobile sub-pixel scaling issues
    return el.scrollHeight - el.scrollTop - el.clientHeight <= threshold + 1;
  }, [threshold]);

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = containerRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior });
    setUnreadCount(0);
    isNearBottomRef.current = true;
    setIsNearBottom(true);
  }, []);

  const resetScroll = useCallback(() => {
    isInitialLoadRef.current = true;
    isNearBottomRef.current = true;
    setIsNearBottom(true);
    prevMessagesRef.current = [];
    prevScrollHeightRef.current = null;
    prevScrollTopRef.current = null;
    setUnreadCount(0);
  }, []);

  // Handle scroll events with animation frame throttling
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    let rafId = null;
    const onScroll = () => {
      if (rafId !== null) return;
      rafId = requestAnimationFrame(() => {
        rafId = null;
        const nearBottom = checkIsNearBottom();
        
        isNearBottomRef.current = nearBottom;
        setIsNearBottom(nearBottom);

        if (nearBottom) {
          setUnreadCount((prev) => (prev > 0 ? 0 : prev));
        }
      });
    };

    el.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      el.removeEventListener('scroll', onScroll);
      if (rafId !== null) cancelAnimationFrame(rafId);
    };
  }, [checkIsNearBottom]);

  // Handle image load events using capturing to adjust scroll if near bottom
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleLoad = (e) => {
      // Check if an image inside the container finished loading
      if (e.target && e.target.tagName === 'IMG') {
        if (isNearBottomRef.current) {
          // If we were near the bottom, scroll down to incorporate the image size
          el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
        }
      }
    };

    el.addEventListener('load', handleLoad, true); // use capture phase
    return () => {
      el.removeEventListener('load', handleLoad, true);
    };
  }, []);

  // Sync logic when messages change (runs synchronously before painting)
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const prevMessages = prevMessagesRef.current;

    // 1. Initial Load: Scroll instantly to bottom (or to unread separator)
    if (isInitialLoadRef.current && messages.length > 0) {
      isInitialLoadRef.current = false;
      if (unreadSeparatorRef && unreadSeparatorRef.current) {
        unreadSeparatorRef.current.scrollIntoView({ block: 'center', behavior: 'auto' });
        isNearBottomRef.current = false;
        setIsNearBottom(false);
      } else {
        el.scrollTo({ top: el.scrollHeight, behavior: 'auto' });
        isNearBottomRef.current = true;
        setIsNearBottom(true);
      }
      prevMessagesRef.current = messages;
      return;
    }

    // No changes, do nothing
    if (messagesAreEqual(prevMessages, messages)) return;

    // 2. Check if messages were prepended (loading older messages)
    const prevFirstMsgId = prevMessages[0]?.id;
    const newFirstMsgIndex = prevFirstMsgId ? messages.findIndex((m) => m.id === prevFirstMsgId) : -1;

    if (newFirstMsgIndex > 0) {
      // Older messages prepended. Restore scroll position to prevent jumping.
      if (prevScrollHeightRef.current !== null && prevScrollTopRef.current !== null) {
        const heightDiff = el.scrollHeight - prevScrollHeightRef.current;
        el.scrollTop = prevScrollTopRef.current + heightDiff;
      }
      prevMessagesRef.current = messages;
      return;
    }

    // 3. Handle newly appended messages (sending / receiving)
    const newMessages = getNewMessages(prevMessages, messages);
    prevMessagesRef.current = messages;

    if (newMessages.length === 0) return;

    const incomingFromOthers = newMessages.filter((m) => m.sender !== 'visitor');

    if (isNearBottomRef.current) {
      // Scroll to bottom smoothly if the user was already near the bottom
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      setUnreadCount(0);
    } else if (incomingFromOthers.length > 0) {
      // If user is scrolled up and a message arrives from another user, increment unread count
      setUnreadCount((count) => count + incomingFromOthers.length);
    }
  }, [messages]);

  return {
    containerRef,
    messagesEndRef,
    unreadCount,
    isNearBottom,
    scrollToBottom,
    resetScroll,
  };
}

export { messagesAreEqual };

