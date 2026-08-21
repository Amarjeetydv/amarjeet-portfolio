import { useState, useEffect, useRef, useCallback, Fragment } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getApiBaseUrl } from './utils/api';
import { useChatScroll, messagesAreEqual } from './hooks/useChatScroll';
import ChatMessageBubble from './components/ChatMessageBubble';
import {
  FaGithub,
  FaLinkedin,
  FaFacebook,
  FaTwitter,
  FaInstagram,
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaHistory
} from 'react-icons/fa';
import { SiLeetcode } from 'react-icons/si';
import {
  saveCachedConversations,
  getCachedConversations,
  saveCachedMessages,
  getCachedMessages,
  deleteCachedMessages,
  addOfflineMessage,
  getOfflineQueue,
  removeOfflineMessage,
  updateOfflineMessage
} from './utils/indexedDb';

const CHAT_STORAGE_KEY = 'portfolio_chat_conversation_id';

const getUserId = () => {
  let storedUserId = localStorage.getItem('portfolio_chat_user_id');
  if (!storedUserId) {
    storedUserId = self.crypto?.randomUUID
      ? self.crypto.randomUUID()
      : 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('portfolio_chat_user_id', storedUserId);
  }
  return storedUserId;
};

const Contact = () => {
  const { conversationId: routeConversationId } = useParams();
  const navigate = useNavigate();

  const [mode, setMode] = useState('form');
  const [conversationId, setConversationId] = useState(null);
  const [visitorName, setVisitorName] = useState('');
  const [messages, setMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [status, setStatus] = useState({ type: '', message: '' });
  const [isSending, setIsSending] = useState(false);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSyncing, setIsSyncing] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [conversationsLoading, setConversationsLoading] = useState(false);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const currentActiveIdRef = useRef(null);
  const chatFileInputRef = useRef(null);
  const formFileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const chatContainerRef = useRef(null);
  const unreadSeparatorRef = useRef(null);

  const [isChatVisible, setIsChatVisible] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(document.visibilityState === 'visible');
  const [sessionFirstUnreadId, setSessionFirstUnreadId] = useState(null);
  const hasInitializedFirstUnread = useRef(false);

  const {
    containerRef: messagesContainerRef,
    messagesEndRef,
    unreadCount,
    isNearBottom,
    scrollToBottom,
    resetScroll,
  } = useChatScroll(messages, { unreadSeparatorRef });

  // Auto-resize the chat input textarea based on content
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  }, [chatInput]);

  const fetchConversationsList = useCallback(async () => {
    const uid = getUserId();
    if (navigator.onLine) {
      setConversationsLoading(true);
      try {
        const res = await fetch(`${getApiBaseUrl()}/api/conversations?userId=${uid}`);
        if (res.ok) {
          const data = await res.json();
          const list = data.conversations || [];
          setConversations(list);
          await saveCachedConversations(list, uid);
        }
      } catch (error) {
        console.error('Failed to fetch online conversations:', error);
      } finally {
        setConversationsLoading(false);
      }
    } else {
      const cached = await getCachedConversations(uid);
      setConversations(cached);
    }
  }, []);

  const fetchMessages = useCallback(async (id) => {
    const uid = getUserId();
    
    // Local offline temporary conversation loading
    if (id.startsWith('local-')) {
      const cached = await getCachedMessages(id);
      if (cached) {
        setVisitorName(cached.visitorName || '');
        setMessages(cached.messages || []);
      }
      return true;
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/chat/${id}/messages?userId=${uid}`);
      if (!res.ok) {
        if (res.status === 403) {
          setStatus({ type: 'error', message: 'Access denied: Conversation belongs to another user.' });
        }
        return false;
      }

      const data = await res.json();

      // Race condition protection: Check if the loaded ID matches the currently active ID
      if (currentActiveIdRef.current !== id) {
        console.log(`Discarding responses for obsolete conversation ID: ${id}`);
        return false;
      }

      setVisitorName(data.visitorName || '');
      setMessages((prev) => {
        const next = data.messages || [];
        return messagesAreEqual(prev, next) ? prev : next;
      });
      
      // Save loaded messages to IndexedDB cache
      await saveCachedMessages(id, data.messages || [], data.visitorName || '');
      return true;
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      return false;
    }
  }, []);

  const loadActiveChat = useCallback(
    async (id) => {
      currentActiveIdRef.current = id;
      setConversationId(id);
      localStorage.setItem(CHAT_STORAGE_KEY, id);
      setMode('chat');

      // 1. Load from IndexedDB cache immediately (offline-friendly)
      const cached = await getCachedMessages(id);
      let cachedList = [];
      if (cached) {
        setVisitorName(cached.visitorName || '');
        cachedList = cached.messages || [];
        setMessages(cachedList);
      }

      // 2. Fetch fresh data from API if online
      if (navigator.onLine && !id.startsWith('local-')) {
        setMessagesLoading(true);
        await fetchMessages(id);
        setMessagesLoading(false);
      }

      // 3. Append offline queued messages for this conversation
      const queue = await getOfflineQueue();
      const queuedMsgs = queue.filter((q) => q.conversationId === id);
      if (queuedMsgs.length > 0) {
        setMessages((prev) => {
          const merged = [...prev];
          queuedMsgs.forEach((q) => {
            if (!merged.some((m) => m.id === q.tempId)) {
              merged.push({
                id: q.tempId,
                sender: 'visitor',
                message_text: q.message_text,
                created_at: q.created_at,
                status: q.status,
              });
            }
          });
          return merged;
        });
      }
    },
    [fetchMessages]
  );

  // Background offline queue synchronizer
  const syncOfflineQueue = useCallback(async () => {
    if (isSyncing || !navigator.onLine) return;
    setIsSyncing(true);
    setStatus({ type: 'info', message: 'Synchronizing offline messages...' });

    try {
      const queue = await getOfflineQueue();
      if (queue.length === 0) {
        setIsSyncing(false);
        return;
      }

      // Sort chronologically so messages are sent in order
      queue.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      const tempToRealConvId = {};

      for (const item of queue) {
        // Mark status as sending in IndexedDB and UI
        item.status = 'sending';
        await updateOfflineMessage(item);
        setMessages((prev) =>
          prev.map((m) => (m.id === item.tempId ? { ...m, status: 'sending' } : m))
        );

        let convId = item.conversationId;
        if (convId.startsWith('local-')) {
          convId = tempToRealConvId[convId] || convId;
        }

        // Case A: Queued new conversation creation
        if (convId.startsWith('local-')) {
          const { name, email } = item.extraData || {};
          const formData = new FormData();
          formData.append('name', name);
          formData.append('email', email);
          formData.append('message', item.message_text);
          formData.append('userId', getUserId());
          formData.append('clientMessageId', item.idempotencyId);
          formData.append('conversationId', item.conversationId.replace('local-', ''));

          try {
            const res = await fetch(`${getApiBaseUrl()}/api/contact`, {
              method: 'POST',
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              const realId = data.conversationId;
              tempToRealConvId[item.conversationId] = realId;

              await removeOfflineMessage(item.tempId);
              await deleteCachedMessages(item.conversationId);

              if (currentActiveIdRef.current === item.conversationId) {
                currentActiveIdRef.current = realId;
                setConversationId(realId);
                localStorage.setItem(CHAT_STORAGE_KEY, realId);
                navigate(`/contact/chat/${realId}`, { replace: true });
              }
            } else {
              throw new Error('Sync contact form rejected by server');
            }
          } catch (e) {
            console.error('Failed to sync offline new conversation:', e);
            item.status = 'failed';
            item.retryCount = (item.retryCount || 0) + 1;
            await updateOfflineMessage(item);
            setMessages((prev) =>
              prev.map((m) => (m.id === item.tempId ? { ...m, status: 'failed' } : m))
            );
            throw e; // Break loop to retry later
          }
        }
        // Case B: Queued follow-up message
        else {
          const formData = new FormData();
          formData.append('message', item.message_text);
          formData.append('userId', getUserId());
          formData.append('clientMessageId', item.idempotencyId);

          try {
            const res = await fetch(`${getApiBaseUrl()}/api/chat/${convId}/messages`, {
              method: 'POST',
              body: formData,
            });

            if (res.ok) {
              const data = await res.json();
              await removeOfflineMessage(item.tempId);

              // Update UI: change status pending/sending -> sent
              setMessages((prev) =>
                prev.map((msg) => (msg.id === item.tempId ? data.chatMessage : msg))
              );
            } else {
              throw new Error('Sync follow-up message rejected by server');
            }
          } catch (e) {
            console.error('Failed to sync offline message:', e);
            item.status = 'failed';
            item.retryCount = (item.retryCount || 0) + 1;
            await updateOfflineMessage(item);
            setMessages((prev) =>
              prev.map((m) => (m.id === item.tempId ? { ...m, status: 'failed' } : m))
            );
            throw e; // Break loop
          }
        }
      }

      setStatus({ type: 'success', message: 'Synchronization completed!' });
      await fetchConversationsList();
      if (currentActiveIdRef.current) {
        await fetchMessages(currentActiveIdRef.current);
      }
    } catch (error) {
      console.error('Synchronization loop failed:', error);
      setStatus({ type: 'error', message: 'Sync paused. Some messages failed.' });
    } finally {
      setIsSyncing(false);
    }
  }, [conversationId, fetchConversationsList, fetchMessages, isSyncing, navigate]);

  const handleRetryMessage = async (tempId) => {
    if (!navigator.onLine) {
      setStatus({ type: 'error', message: 'Still offline. Please check your connection.' });
      return;
    }
    await syncOfflineQueue();
  };

  // Handle browser connectivity listeners
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      syncOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Run sync on load if online
    if (navigator.onLine) {
      syncOfflineQueue();
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [syncOfflineQueue]);

  // Initial load
  useEffect(() => {
    const initChat = async () => {
      await fetchConversationsList();

      const storedId = localStorage.getItem(CHAT_STORAGE_KEY);
      const idToLoad = routeConversationId || storedId;

      if (!idToLoad) return;

      await loadActiveChat(idToLoad);
    };

    initChat();
  }, [routeConversationId, fetchConversationsList, loadActiveChat]);

  // Polling for new admin replies
  useEffect(() => {
    if (mode !== 'chat' || !conversationId || conversationId.startsWith('local-')) return;

    const poll = setInterval(() => {
      if (navigator.onLine) {
        fetchMessages(conversationId);
      }
    }, 4000);

    return () => clearInterval(poll);
  }, [mode, conversationId, fetchMessages]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      setIsTabVisible(document.visibilityState === 'visible');
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  useEffect(() => {
    if (mode !== 'chat' || !conversationId) {
      setIsChatVisible(false);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsChatVisible(entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    const el = chatContainerRef.current;
    if (el) {
      observer.observe(el);
    }

    return () => {
      if (el) observer.unobserve(el);
      observer.disconnect();
    };
  }, [mode, conversationId]);

  useEffect(() => {
    if (mode !== 'chat') {
      hasInitializedFirstUnread.current = false;
      setSessionFirstUnreadId(null);
      setInitialUnreadCount(0);
    }
  }, [mode]);

  const [initialUnreadCount, setInitialUnreadCount] = useState(0);

  useEffect(() => {
    if (messages.length > 0 && !hasInitializedFirstUnread.current) {
      const unreadMsgs = messages.filter((m) => m.sender === 'admin' && !m.read_at);
      if (unreadMsgs.length > 0) {
        setSessionFirstUnreadId(unreadMsgs[0].id);
        setInitialUnreadCount(unreadMsgs.length);
      }
      hasInitializedFirstUnread.current = true;
    }
  }, [messages]);

  const currentUnreadCount = messages.filter((m) => m.sender === 'admin' && !m.read_at).length;

  const markAsRead = useCallback(async (id) => {
    if (id.startsWith('local-') || !navigator.onLine) return;
    try {
      const res = await fetch(`${getApiBaseUrl()}/api/chat/${id}/read`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        if (data.markedReadCount > 0) {
          window.dispatchEvent(
            new CustomEvent('portfolio_chat_read', { detail: { conversationId: id } })
          );
        }
      }
    } catch (error) {
      console.error('Failed to mark messages as read:', error);
    }
  }, []);

  useEffect(() => {
    if (mode === 'chat' && conversationId && isChatVisible && isTabVisible) {
      const hasUnread = messages.some((msg) => msg.sender === 'admin' && !msg.read_at);
      if (hasUnread) {
        markAsRead(conversationId);
        setMessages((prev) =>
          prev.map((msg) =>
            msg.sender === 'admin' && !msg.read_at
              ? { ...msg, read_at: new Date().toISOString() }
              : msg
          )
        );
      }
    }
  }, [mode, conversationId, isChatVisible, isTabVisible, messages, markAsRead]);

  useEffect(() => {
    if (status.message && status.type !== 'info') {
      const timer = setTimeout(() => {
        setStatus({ type: '', message: '' });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setAttachment(null);
      return;
    }
    // Block attachments if browser is offline
    if (!navigator.onLine) {
      setStatus({
        type: 'error',
        message: 'Attachments require internet connectivity. Please upload when online.',
      });
      e.target.value = null;
      return;
    }
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    const maxSize = 5 * 1024 * 1024;
    if (!allowedTypes.includes(file.type)) {
      setStatus({ type: 'error', message: 'Invalid file type. Please upload a PDF, JPG, or PNG.' });
      e.target.value = null;
      return;
    }
    if (file.size > maxSize) {
      setStatus({ type: 'error', message: 'File is too large. Maximum size is 5MB.' });
      e.target.value = null;
      return;
    }
    setStatus({ type: '', message: '' });
    setAttachment(file);
  };

  const clearAttachment = () => {
    setAttachment(null);
    if (chatFileInputRef.current) {
      chatFileInputRef.current.value = '';
    }
    if (formFileInputRef.current) {
      formFileInputRef.current.value = '';
    }
  };

  const renderPendingAttachment = () => {
    if (!attachment) return null;

    return (
      <div className="attachment-pending">
        <span className="attachment-pending-name" title={attachment.name}>
          📎 {attachment.name}
        </span>
        <button
          type="button"
          className="attachment-pending-remove"
          onClick={clearAttachment}
          aria-label="Remove attachment"
        >
          ✕
        </button>
      </div>
    );
  };

  const startChat = (id, name, initialMessage) => {
    resetScroll();
    setConversationId(id);
    currentActiveIdRef.current = id;
    setVisitorName(name);
    setMessages([initialMessage]);
    setMode('chat');
    localStorage.setItem(CHAT_STORAGE_KEY, id);
    navigate(`/contact/chat/${id}`, { replace: true });
    fetchConversationsList();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const name = formData.get('name');
    const email = formData.get('email');
    const message = formData.get('message');

    // Offline new conversation submission
    if (!navigator.onLine) {
      setIsSending(true);
      const tempConvId = `local-${crypto.randomUUID()}`;

      try {
        const queued = await addOfflineMessage(tempConvId, message, { name, email });
        const initialMsg = {
          id: queued.tempId,
          sender: 'visitor',
          message_text: message,
          created_at: queued.created_at,
          status: 'pending',
        };

        // Cache local state immediately
        const localConversations = await getCachedConversations(getUserId());
        const newLocalConv = {
          id: tempConvId,
          userId: getUserId(),
          visitorName: name,
          visitorEmail: email,
          lastMessage: message,
          updatedAt: new Date().toISOString(),
        };
        const updatedConvs = [newLocalConv, ...localConversations];
        setConversations(updatedConvs);
        
        await saveCachedConversations(updatedConvs, getUserId());
        await saveCachedMessages(tempConvId, [initialMsg], name);

        startChat(tempConvId, name, initialMsg);
        setStatus({
          type: 'info',
          message: 'Offline. Message queued and will sync when connection returns.',
        });
        e.target.reset();
        setAttachment(null);
      } catch (err) {
        console.error('Failed to queue new offline conversation:', err);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Online submission path
    setStatus({ type: 'info', message: 'Sending...' });
    setIsSending(true);

    formData.delete('attachment');
    if (attachment) {
      formData.append('attachment', attachment);
    }
    formData.append('userId', getUserId());

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/contact`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        startChat(data.conversationId, name, data.chatMessage);
        setStatus({ type: 'success', message: 'Message sent! Stay on this page to see replies.' });
        e.target.reset();
        setAttachment(null);
      } else {
        const errorData = await res.json().catch(() => null);
        setStatus({
          type: 'error',
          message: errorData?.message || 'Failed to send message. Please try again.',
        });
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setStatus({ type: 'error', message: 'Failed to connect to the server. Queueing offline.' });

      // Fallback to queueing offline
      const tempConvId = `local-${crypto.randomUUID()}`;
      const queued = await addOfflineMessage(tempConvId, message, { name, email });
      const initialMsg = {
        id: queued.tempId,
        sender: 'visitor',
        message_text: message,
        created_at: queued.created_at,
        status: 'pending',
      };

      const localConversations = await getCachedConversations(getUserId());
      const newLocalConv = {
        id: tempConvId,
        userId: getUserId(),
        visitorName: name,
        visitorEmail: email,
        lastMessage: message,
        updatedAt: new Date().toISOString(),
      };
      const updatedConvs = [newLocalConv, ...localConversations];
      setConversations(updatedConvs);
      
      await saveCachedConversations(updatedConvs, getUserId());
      await saveCachedMessages(tempConvId, [initialMsg], name);

      startChat(tempConvId, name, initialMsg);
      e.target.reset();
      setAttachment(null);
    } finally {
      setIsSending(false);
    }
  };

  const sendChatMessage = async () => {
    if (!conversationId || (!chatInput.trim() && !attachment)) return;

    const tempMsgText = chatInput.trim() || '(attachment)';

    // Queue follow-up message when offline
    if (!navigator.onLine) {
      setIsSending(true);
      try {
        const queued = await addOfflineMessage(conversationId, tempMsgText);
        const localPendingMsg = {
          id: queued.tempId,
          sender: 'visitor',
          message_text: tempMsgText,
          created_at: queued.created_at,
          status: 'pending',
        };
        setMessages((prev) => [...prev, localPendingMsg]);
        setChatInput('');
        setAttachment(null);
        if (chatFileInputRef.current) {
          chatFileInputRef.current.value = '';
        }
      } catch (e) {
        console.error('Failed to queue follow-up message:', e);
      } finally {
        setIsSending(false);
      }
      return;
    }

    // Online path
    setIsSending(true);
    const formData = new FormData();
    formData.append('message', tempMsgText);
    formData.append('userId', getUserId());

    if (attachment) {
      formData.append('attachment', attachment);
    }

    try {
      const res = await fetch(`${getApiBaseUrl()}/api/chat/${conversationId}/messages`, {
        method: 'POST',
        body: formData,
      });

      if (res.ok) {
        const data = await res.json();
        if (currentActiveIdRef.current === conversationId) {
          setMessages((prev) => [...prev, data.chatMessage]);
          setChatInput('');
          setAttachment(null);
          if (chatFileInputRef.current) {
            chatFileInputRef.current.value = '';
          }
        }
        fetchConversationsList();
      } else {
        const errorData = await res.json().catch(() => null);
        setStatus({ type: 'error', message: errorData?.message || 'Failed to send message.' });
      }
    } catch (error) {
      console.error('Error sending chat message:', error);
      setStatus({ type: 'error', message: 'Failed to connect. Queueing offline.' });

      // Fallback queueing
      const queued = await addOfflineMessage(conversationId, tempMsgText);
      const localPendingMsg = {
        id: queued.tempId,
        sender: 'visitor',
        message_text: tempMsgText,
        created_at: queued.created_at,
        status: 'pending',
      };
      setMessages((prev) => [...prev, localPendingMsg]);
      setChatInput('');
      setAttachment(null);
      if (chatFileInputRef.current) {
        chatFileInputRef.current.value = '';
      }
    } finally {
      setIsSending(false);
    }
  };

  const handleChatSubmit = (e) => {
    e.preventDefault();
    sendChatMessage();
  };

  const handleNewConversation = () => {
    localStorage.removeItem(CHAT_STORAGE_KEY);
    resetScroll();
    setMode('form');
    setConversationId(null);
    currentActiveIdRef.current = null;
    setMessages([]);
    setChatInput('');
    setAttachment(null);
    navigate('/contact', { replace: true });
  };

  return (
    <section
      className="my-work-section w-full max-w-full overflow-hidden px-4 box-border"
      id="contact"
      style={{
        width: '100%',
        maxWidth: '100%',
        overflow: 'hidden',
        boxSizing: 'border-box',
        paddingLeft: '1rem',
        paddingRight: '1rem',
      }}
    >
      <h1 className="work-title">Contact</h1>
      <p className="work-desc">
        {mode === 'chat'
          ? 'Your conversation is live. Stay on this page — replies from Amarjeet will appear here.'
          : "Get in touch with me! I'm always interested in new opportunities and collaborations."}
      </p>

      {mode === 'form' ? (
        <div className="contact-grid-container">
          <div className="contact-info-column">
            <h2>Let's Connect</h2>
            <p className="contact-info-subtitle">
              Have a question, opportunity, or project idea? Feel free to reach out via the form, or
              connect through the details below.
            </p>
            <div className="contact-details-list">
              <div className="contact-detail-item" style={{ flexWrap: 'wrap' }}>
                <span className="contact-detail-icon">
                  <FaEnvelope />
                </span>
                <div
                  className="min-w-0 flex-1 overflow-hidden"
                  style={{ flex: '1', minWidth: '0', overflow: 'hidden' }}
                >
                  <strong>Email</strong>
                  <a
                    href="mailto:amarjeetyadav043590@gmail.com"
                    style={{
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'normal',
                      display: 'block',
                      maxWidth: '100%',
                    }}
                  >
                    amarjeetyadav043590@gmail.com
                  </a>
                </div>
              </div>
              <div className="contact-detail-item" style={{ flexWrap: 'wrap' }}>
                <span className="contact-detail-icon">
                  <FaPhoneAlt />
                </span>
                <div
                  className="min-w-0 flex-1 overflow-hidden"
                  style={{ flex: '1', minWidth: '0', overflow: 'hidden' }}
                >
                  <strong>Phone</strong>
                  <a
                    href="tel:+919305917283"
                    style={{
                      wordBreak: 'break-all',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'normal',
                      display: 'block',
                      maxWidth: '100%',
                    }}
                  >
                    +91 93059 17283
                  </a>
                </div>
              </div>
              <div className="contact-detail-item" style={{ flexWrap: 'wrap' }}>
                <span className="contact-detail-icon">
                  <FaMapMarkerAlt />
                </span>
                <div
                  className="min-w-0 flex-1 overflow-hidden"
                  style={{ flex: '1', minWidth: '0', overflow: 'hidden' }}
                >
                  <strong>Location</strong>
                  <span
                    style={{
                      wordBreak: 'break-word',
                      overflowWrap: 'anywhere',
                      whiteSpace: 'normal',
                      display: 'block',
                      maxWidth: '100%',
                    }}
                  >
                    Mau, Uttar Pradesh, India
                  </span>
                </div>
              </div>
            </div>
            <div className="contact-info-socials">
              <strong>Follow Me</strong>
              <div className="contact-social-icons">
                <a
                  href="https://github.com/Amarjeetydv"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="GitHub"
                >
                  <FaGithub />
                </a>
                <a
                  href="https://linkedin.com/in/amarjeet-yadav-978820291"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LinkedIn"
                >
                  <FaLinkedin />
                </a>
                <a
                  href="https://www.facebook.com/profile.php?id=100083695459596"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                >
                  <FaFacebook />
                </a>
                <a
                  href="https://x.com/YadavPrade66061?t=YaB_XMLECI7jmVnaloxduQ&s=09"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Twitter"
                >
                  <FaTwitter />
                </a>
                <a
                  href="https://www.instagram.com/_amarjeet_30/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                >
                  <FaInstagram />
                </a>
                <a
                  href="https://leetcode.com/u/Amarjeet__Yadav/"
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="LeetCode"
                >
                  <SiLeetcode />
                </a>
              </div>
            </div>

            {/* Scoped chat history panel in form mode */}
            {conversations.length > 0 && (
              <div className="recent-chats-container">
                <div className="recent-chats-title">
                  <FaHistory style={{ marginRight: '6px', verticalAlign: 'middle' }} />
                  Your Conversations
                </div>
                {conversationsLoading ? (
                  <div className="chat-loading" style={{ padding: '1rem' }}>
                    <span className="spinner"></span> Loading history...
                  </div>
                ) : (
                  conversations.slice(0, 3).map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      className="recent-chat-card"
                      onClick={() => {
                        loadActiveChat(conv.id);
                        navigate(`/contact/chat/${conv.id}`);
                      }}
                    >
                      <div className="chat-history-meta">
                        <span className="chat-history-name">Chat Session</span>
                        <span className="chat-history-time">
                          {new Date(conv.updatedAt || conv.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {conv.lastMessage && (
                        <div className="chat-history-snippet">{conv.lastMessage}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="contact-form-column">
            <form className="contact-form" onSubmit={handleSubmit}>
              <label>
                Name:
                <input
                  type="text"
                  name="name"
                  placeholder="Enter your full name"
                  required
                  autoComplete="name"
                />
              </label>
              <label>
                Email:
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email address"
                  required
                  autoComplete="email"
                />
              </label>
              <label>
                Message:
                <textarea name="message" placeholder="Write your message here..." required />
              </label>
              <label className="file-upload-wrapper">
                Attach a file (optional)
                <input
                  ref={formFileInputRef}
                  type="file"
                  name="attachment"
                  onChange={handleFileChange}
                  className="file-upload-input"
                />
                <small
                  style={{
                    color: 'var(--text-muted-color)',
                    marginTop: '0.5rem',
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                    display: 'block',
                  }}
                >
                  Allowed types: PDF, JPG, PNG. Max size: 5MB.
                </small>
                {renderPendingAttachment()}
              </label>
              <button type="submit" disabled={isSending}>
                {isSending ? (
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                    }}
                  >
                    <span className="spinner"></span> Sending...
                  </span>
                ) : (
                  'Send Message'
                )}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div className="chat-container" ref={chatContainerRef}>
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
              <button
                type="button"
                className="chat-history-sidebar-toggle"
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                aria-label="Toggle chat history"
              >
                History
              </button>
              <strong>Chat with Amarjeet</strong>
              {visitorName && <span className="chat-visitor-name"> · {visitorName}</span>}
              {!isOnline && <span className="chat-status-indicator offline">Offline</span>}
              {isSyncing && <span className="chat-status-indicator syncing">Syncing...</span>}
            </div>
            <button type="button" className="chat-new-btn" onClick={handleNewConversation}>
              New conversation
            </button>
          </div>

          <div className="chat-body-wrapper">
            <aside className={`chat-sidebar ${isSidebarOpen ? 'open' : ''}`}>
              <div className="chat-sidebar-header">
                <span>Conversations</span>
              </div>
              <div className="chat-history-list">
                {conversationsLoading ? (
                  <div className="chat-loading">
                    <span className="spinner"></span>
                  </div>
                ) : conversations.length === 0 ? (
                  <p
                    style={{
                      padding: '1rem',
                      color: 'var(--text-muted-color)',
                      fontSize: '0.85rem',
                      textAlign: 'center',
                    }}
                  >
                    No previous chats
                  </p>
                ) : (
                  conversations.map((conv) => (
                    <button
                      key={conv.id}
                      type="button"
                      className={`chat-history-item ${conversationId === conv.id ? 'active' : ''}`}
                      onClick={() => {
                        loadActiveChat(conv.id);
                        navigate(`/contact/chat/${conv.id}`);
                      }}
                    >
                      <div className="chat-history-meta">
                        <span className="chat-history-name">Chat Session</span>
                        <span className="chat-history-time">
                          {new Date(conv.updatedAt || conv.created_at).toLocaleDateString([], {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      {conv.lastMessage && (
                        <div className="chat-history-snippet">{conv.lastMessage}</div>
                      )}
                    </button>
                  ))
                )}
              </div>
            </aside>

            <div className="chat-main">
              <div
                className="chat-body"
                ref={messagesContainerRef}
                role="log"
                aria-live="polite"
                aria-relevant="additions"
              >
                {messagesLoading && (
                  <div className="chat-loading">
                    <span className="spinner"></span> Loading messages...
                  </div>
                )}
                {messages.length === 0 && !messagesLoading && (
                  <p className="chat-empty">
                    No messages yet. Send a message to start the conversation.
                  </p>
                )}
                {messages.map((msg) => (
                  <Fragment key={msg.id}>
                    {msg.id === sessionFirstUnreadId && (
                      <div className="chat-unread-separator" ref={unreadSeparatorRef}>
                        <span>New Messages · {initialUnreadCount}</span>
                      </div>
                    )}
                    <ChatMessageBubble
                      msg={
                        msg.status === 'failed'
                          ? { ...msg, onRetry: handleRetryMessage }
                          : msg
                      }
                    />
                  </Fragment>
                ))}
                <div ref={messagesEndRef} className="chat-messages-end" aria-hidden="true" />
              </div>

              {!isNearBottom && (
                <button
                  type="button"
                  className="chat-new-messages-btn"
                  onClick={() => scrollToBottom('smooth')}
                  aria-label={`${unreadCount} new message${
                    unreadCount === 1 ? '' : 's'
                  }. Scroll to latest.`}
                >
                  <span className="chat-new-messages-icon" aria-hidden="true">
                    ↓
                  </span>
                  {unreadCount > 0 && <span className="chat-unread-badge">{unreadCount}</span>}
                </button>
              )}

              <form className="chat-input-form" onSubmit={handleChatSubmit}>
                {renderPendingAttachment()}
                <textarea
                  ref={textareaRef}
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Type a message..."
                  rows={1}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      sendChatMessage();
                    }
                  }}
                />
                <div className="chat-input-actions">
                  <label className="chat-file-label">
                    📎 Attach
                    <input
                      ref={chatFileInputRef}
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </label>
                  <button
                    type="submit"
                    disabled={isSending || (!chatInput.trim() && !attachment)}
                  >
                    {isSending ? 'Sending...' : 'Send'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {status.message && status.type !== 'info' && (
        <div className="contact-toast" data-type={status.type}>
          <span style={{ fontSize: '1.5rem' }}>
            {status.type === 'success' ? '✅' : '⚠️'}
          </span>
          <span style={{ fontWeight: 500 }}>{status.message}</span>
        </div>
      )}

      <style>{`
        @keyframes slideIn {
          from { transform: translateY(100px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spinner {
          width: 18px;
          height: 18px;
          border: 2px solid rgba(255,255,255,0.3);
          border-radius: 50%;
          border-top-color: #fff;
          animation: spin 0.8s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }

        /* --- Split Layout Chat Wrapper --- */
        .chat-body-wrapper {
          display: flex;
          flex: 1;
          overflow: hidden;
          position: relative;
        }

        .chat-sidebar {
          width: 260px;
          border-right: 1px solid var(--glass-border);
          display: flex;
          flex-direction: column;
          background-color: rgba(255, 255, 255, 0.015);
          transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          z-index: 10;
        }

        .chat-sidebar-header {
          padding: 1rem;
          border-bottom: 1px solid var(--glass-border);
          font-weight: 700;
          font-size: 0.95rem;
          color: var(--text-color);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chat-history-list {
          flex: 1;
          overflow-y: auto;
          padding: 0.5rem;
        }

        .chat-history-item {
          width: 100%;
          padding: 0.85rem;
          border-radius: 8px;
          background: transparent;
          border: none;
          text-align: left;
          cursor: pointer;
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          margin-bottom: 0.25rem;
          color: var(--text-color);
        }

        .chat-history-item:hover {
          background-color: rgba(255, 255, 255, 0.04);
        }

        .chat-history-item.active {
          background-color: rgba(6, 182, 212, 0.08);
          border: 1px solid rgba(6, 182, 212, 0.15);
        }

        .chat-history-meta {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.82rem;
          width: 100%;
        }

        .chat-history-name {
          font-weight: 600;
          color: var(--text-color);
        }

        .chat-history-time {
          color: var(--text-muted-color);
          font-size: 0.72rem;
        }

        .chat-history-snippet {
          font-size: 0.8rem;
          color: var(--text-muted-color);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
        }

        .chat-main {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          height: 100%;
        }

        .chat-status-indicator {
          font-size: 0.7rem;
          font-weight: 600;
          padding: 2px 8px;
          border-radius: 50px;
          margin-left: 8px;
          display: inline-flex;
          align-items: center;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .chat-status-indicator.offline {
          background-color: rgba(245, 158, 11, 0.1);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.2);
        }

        .chat-status-indicator.syncing {
          background-color: rgba(59, 130, 246, 0.1);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.2);
          animation: pulse 1.5s infinite;
        }

        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }

        .chat-loading {
          padding: 2rem;
          text-align: center;
          color: var(--text-muted-color);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.75rem;
          font-size: 0.9rem;
        }

        .chat-history-sidebar-toggle {
          background-color: rgba(255, 255, 255, 0.03);
          border: 1px solid var(--glass-border);
          color: var(--text-muted-color);
          padding: 6px 14px;
          border-radius: 50px;
          cursor: pointer;
          font-weight: 600;
          font-size: 0.8rem;
          transition: all 0.25s ease;
          display: inline-flex;
          align-items: center;
          height: 32px;
        }

        .chat-history-sidebar-toggle:hover {
          background-color: var(--primary-color);
          color: white;
          border-color: var(--primary-color);
        }

        .recent-chats-container {
          margin-top: 1.5rem;
          padding-top: 1.5rem;
          border-top: 1px solid var(--glass-border);
          text-align: left;
        }

        .recent-chats-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-color);
          margin-bottom: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          display: flex;
          align-items: center;
        }

        .recent-chat-card {
          width: 100%;
          border: 1px solid var(--glass-border);
          border-radius: var(--border-radius);
          background-color: rgba(255, 255, 255, 0.015);
          padding: 0.85rem 1rem;
          cursor: pointer;
          transition: all 0.25s ease;
          margin-bottom: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          color: var(--text-color);
        }

        .recent-chat-card:hover {
          transform: translateY(-2px);
          border-color: var(--primary-color);
          background-color: rgba(255, 255, 255, 0.03);
        }

        @media (max-width: 768px) {
          .chat-sidebar {
            position: absolute;
            left: 0;
            top: 0;
            bottom: 0;
            width: 220px;
            transform: translateX(-100%);
            background-color: #0f172a; /* Solid background on mobile overlay */
            box-shadow: 10px 0 25px rgba(0, 0, 0, 0.5);
            display: flex;
          }

          .chat-sidebar.open {
            transform: translateX(0);
          }
        }
      `}</style>
    </section>
  );
};

export default Contact;
