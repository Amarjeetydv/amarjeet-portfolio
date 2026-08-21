const DB_NAME = 'portfolio_chat_db';
const DB_VERSION = 1;

export const openDb = () => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = e.target.result;
      if (!db.objectStoreNames.contains('conversations')) {
        db.createObjectStore('conversations', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('messages')) {
        db.createObjectStore('messages', { keyPath: 'conversationId' });
      }
      if (!db.objectStoreNames.contains('offline_queue')) {
        db.createObjectStore('offline_queue', { keyPath: 'tempId' });
      }
    };
    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
};

export const saveCachedConversations = async (conversations, userId) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('conversations', 'readwrite');
    const store = tx.objectStore('conversations');
    
    // Clear old conversations first
    const clearReq = store.clear();
    
    clearReq.onsuccess = () => {
      conversations.forEach((c) => {
        store.put({
          id: c.id,
          userId, // Scope to the current visitor ID
          visitorName: c.visitorName || c.visitor_name,
          visitorEmail: c.visitorEmail || c.visitor_email,
          lastMessage: c.lastMessage || c.last_message || '',
          updatedAt: c.updatedAt || c.updated_at || c.created_at,
        });
      });
    };
    
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedConversations = async (userId) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('conversations', 'readonly');
    const store = tx.objectStore('conversations');
    const request = store.getAll();
    request.onsuccess = () => {
      const all = request.result || [];
      // Filter cached conversations by userId to prevent cross-user leakage
      resolve(all.filter((c) => c.userId === userId));
    };
    request.onerror = () => reject(request.error);
  });
};

export const saveCachedMessages = async (conversationId, messages, visitorName) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    store.put({ conversationId, messages, visitorName });
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const getCachedMessages = async (conversationId) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readonly');
    const store = tx.objectStore('messages');
    const request = store.get(conversationId);
    request.onsuccess = () => resolve(request.result || null);
    request.onerror = () => reject(request.error);
  });
};

export const deleteCachedMessages = async (conversationId) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('messages', 'readwrite');
    const store = tx.objectStore('messages');
    store.delete(conversationId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const addOfflineMessage = async (conversationId, messageText, extraData = null) => {
  const db = await openDb();
  const tempId = `temp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;
  const idempotencyId = self.crypto?.randomUUID ? self.crypto.randomUUID() : `idemp_${Date.now()}_${Math.floor(Math.random() * 1000000)}`;

  const offlineMsg = {
    tempId,
    idempotencyId,
    conversationId,
    sender: 'visitor',
    message_text: messageText,
    created_at: new Date().toISOString(),
    status: 'pending',
    retryCount: 0,
    extraData, // contains contact form data (name, email) if it's a new conversation
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    store.add(offlineMsg);
    tx.oncomplete = () => resolve(offlineMsg);
    tx.onerror = () => reject(tx.error);
  });
};

export const getOfflineQueue = async () => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readonly');
    const store = tx.objectStore('offline_queue');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = () => reject(request.error);
  });
};

export const removeOfflineMessage = async (tempId) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    store.delete(tempId);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};

export const updateOfflineMessage = async (msg) => {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('offline_queue', 'readwrite');
    const store = tx.objectStore('offline_queue');
    store.put(msg);
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
  });
};
