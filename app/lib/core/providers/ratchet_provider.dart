import 'dart:async';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/config.dart';
import 'package:zipminator/core/providers/auth_provider.dart';
import 'package:zipminator/core/services/messenger_service.dart';
import 'package:zipminator/src/rust/api/simple.dart' as rust;

/// A contact in the PQC Messenger.
class Contact {
  final String id;
  final String name;
  final String email;
  final bool isOnline;

  const Contact({
    required this.id,
    required this.name,
    required this.email,
    required this.isOnline,
  });

  Contact copyWith({
    String? id,
    String? name,
    String? email,
    bool? isOnline,
  }) =>
      Contact(
        id: id ?? this.id,
        name: name ?? this.name,
        email: email ?? this.email,
        isOnline: isOnline ?? this.isOnline,
      );
}

/// A conversation thread between the user and a contact.
class Conversation {
  final String id;
  final String contactId;
  final String contactName;
  final String lastMessage;
  final DateTime lastMessageAt;
  final int unreadCount;

  const Conversation({
    required this.id,
    required this.contactId,
    required this.contactName,
    this.lastMessage = '',
    required this.lastMessageAt,
    this.unreadCount = 0,
  });

  Conversation copyWith({
    String? id,
    String? contactId,
    String? contactName,
    String? lastMessage,
    DateTime? lastMessageAt,
    int? unreadCount,
  }) =>
      Conversation(
        id: id ?? this.id,
        contactId: contactId ?? this.contactId,
        contactName: contactName ?? this.contactName,
        lastMessage: lastMessage ?? this.lastMessage,
        lastMessageAt: lastMessageAt ?? this.lastMessageAt,
        unreadCount: unreadCount ?? this.unreadCount,
      );
}

class ChatMessage {
  final String text;
  final bool isMine;
  final DateTime timestamp;
  final bool isRead;

  ChatMessage({
    required this.text,
    required this.isMine,
    DateTime? timestamp,
    this.isRead = false,
  }) : timestamp = timestamp ?? DateTime.now();

  ChatMessage copyWith({
    String? text,
    bool? isMine,
    DateTime? timestamp,
    bool? isRead,
  }) =>
      ChatMessage(
        text: text ?? this.text,
        isMine: isMine ?? this.isMine,
        timestamp: timestamp ?? this.timestamp,
        isRead: isRead ?? this.isRead,
      );
}

/// State for a ratchet messaging session.
class RatchetState {
  final BigInt? sessionId;
  final bool isConnected;
  final List<ChatMessage> messages;
  final String? error;
  final List<Contact> contacts;
  final List<Conversation> conversations;
  final String? activeConversationId;
  final bool isTyping;

  /// Whether the signaling server is live (true) or demo mode (false).
  final bool isLive;

  /// Signaling connection state for UI display.
  final SignalingConnectionState signalingState;

  const RatchetState({
    this.sessionId,
    this.isConnected = false,
    this.messages = const [],
    this.error,
    this.contacts = const [],
    this.conversations = const [],
    this.activeConversationId,
    this.isTyping = false,
    this.isLive = false,
    this.signalingState = SignalingConnectionState.disconnected,
  });

  RatchetState copyWith({
    BigInt? sessionId,
    bool? isConnected,
    List<ChatMessage>? messages,
    String? error,
    List<Contact>? contacts,
    List<Conversation>? conversations,
    String? activeConversationId,
    bool? isTyping,
    bool? isLive,
    SignalingConnectionState? signalingState,
    bool clearActiveConversation = false,
    bool clearError = false,
  }) =>
      RatchetState(
        sessionId: sessionId ?? this.sessionId,
        isConnected: isConnected ?? this.isConnected,
        messages: messages ?? this.messages,
        error: clearError ? null : (error ?? this.error),
        contacts: contacts ?? this.contacts,
        conversations: conversations ?? this.conversations,
        activeConversationId: clearActiveConversation
            ? null
            : (activeConversationId ?? this.activeConversationId),
        isTyping: isTyping ?? this.isTyping,
        isLive: isLive ?? this.isLive,
        signalingState: signalingState ?? this.signalingState,
      );

  /// Get the active conversation object, if any.
  Conversation? get activeConversation {
    if (activeConversationId == null) return null;
    try {
      return conversations
          .firstWhere((c) => c.id == activeConversationId);
    } catch (_) {
      return null;
    }
  }

  /// Get the contact for the active conversation.
  Contact? get activeContact {
    final conv = activeConversation;
    if (conv == null) return null;
    try {
      return contacts.firstWhere((c) => c.id == conv.contactId);
    } catch (_) {
      return null;
    }
  }

  /// Messages for the active conversation only (keyed by conversationId).
  /// In this demo, all messages live in a flat list since we simulate
  /// one active session at a time.
  List<ChatMessage> get activeMessages => messages;
}

/// Demo auto-reply phrases, cycling through quantum-themed responses.
const _demoReplies = [
  'Quantum-safe channel confirmed. Your message was decrypted successfully.',
  'ML-KEM-768 ratchet step complete. Forward secrecy maintained.',
  'Copy that. Running PQ key rotation on my end.',
  'Entropy pool replenished. Ready for next exchange.',
  'Acknowledged. The lattice holds strong against Shor.',
  'Message received through the quantum mesh. All clear.',
  'PQ handshake verified. Continuing on the secure channel.',
  'Got it. My CRYSTALS are aligned with yours.',
];

/// Per-conversation message store (in-memory only for demo).
final Map<String, List<ChatMessage>> _conversationMessages = {};

/// Manages PQ Double Ratchet messaging sessions with live signaling support.
class RatchetNotifier extends Notifier<RatchetState> {
  Timer? _autoReplyTimer;
  int _replyIndex = 0;
  MessengerService? _messengerService;
  StreamSubscription<Map<String, dynamic>>? _messageSubscription;
  StreamSubscription<SignalingConnectionState>? _connectionSubscription;

  @override
  RatchetState build() {
    ref.onDispose(() {
      _autoReplyTimer?.cancel();
      _messageSubscription?.cancel();
      _connectionSubscription?.cancel();
      _messengerService?.dispose();
    });

    // Seed demo contacts
    const demoContacts = [
      Contact(
        id: 'alice-q',
        name: 'Alice Quantum',
        email: 'alice@qdaria.com',
        isOnline: true,
      ),
      Contact(
        id: 'bob-c',
        name: 'Bob Cipher',
        email: 'bob@qdaria.com',
        isOnline: true,
      ),
      Contact(
        id: 'charlie-m',
        name: 'Charlie Mesh',
        email: 'charlie@qdaria.com',
        isOnline: false,
      ),
    ];

    // Seed demo conversations with recent messages
    final now = DateTime.now();
    final demoConversations = [
      Conversation(
        id: 'conv-alice',
        contactId: 'alice-q',
        contactName: 'Alice Quantum',
        lastMessage: 'Lattice keys exchanged successfully',
        lastMessageAt: now.subtract(const Duration(minutes: 5)),
        unreadCount: 2,
      ),
      Conversation(
        id: 'conv-bob',
        contactId: 'bob-c',
        contactName: 'Bob Cipher',
        lastMessage: 'PQ handshake complete',
        lastMessageAt: now.subtract(const Duration(hours: 1)),
        unreadCount: 0,
      ),
    ];

    // Seed message history for demo conversations
    _conversationMessages['conv-alice'] = [
      ChatMessage(
        text: 'Initiating PQ-Double Ratchet session...',
        isMine: false,
        timestamp: now.subtract(const Duration(minutes: 10)),
      ),
      ChatMessage(
        text: 'Session established. ML-KEM-768 keys exchanged.',
        isMine: true,
        timestamp: now.subtract(const Duration(minutes: 9)),
      ),
      ChatMessage(
        text: 'Lattice keys exchanged successfully',
        isMine: false,
        timestamp: now.subtract(const Duration(minutes: 5)),
      ),
    ];
    _conversationMessages['conv-bob'] = [
      ChatMessage(
        text: 'Hey Bob, ready for quantum-safe comms?',
        isMine: true,
        timestamp: now.subtract(const Duration(hours: 1, minutes: 5)),
      ),
      ChatMessage(
        text: 'PQ handshake complete',
        isMine: false,
        timestamp: now.subtract(const Duration(hours: 1)),
      ),
    ];

    return RatchetState(
      contacts: demoContacts,
      conversations: demoConversations,
    );
  }

  // ── Signaling server connection ─────────────────────────────────────────

  /// Connect to the live signaling server. Call when messenger screen opens.
  Future<void> connectToSignaling() async {
    // Derive username from Supabase auth or fall back to a random guest ID.
    final authState = ref.read(authProvider);
    final user = authState.user;
    String username;
    if (user != null) {
      // Use email prefix or user ID.
      final email = user.email;
      if (email != null && email.contains('@')) {
        username = email.split('@').first;
      } else {
        username = user.id.substring(0, 8);
      }
    } else {
      username = 'guest-${DateTime.now().millisecondsSinceEpoch % 100000}';
    }

    // Clean up any previous connection.
    _messageSubscription?.cancel();
    _connectionSubscription?.cancel();
    _messengerService?.dispose();

    _messengerService = MessengerService(
      signalingUrl: AppConfig.signalingUrl,
      username: username,
    );

    // Listen to connection state changes.
    _connectionSubscription =
        _messengerService!.connectionState.listen(_onConnectionStateChanged);

    // Listen to incoming messages.
    _messageSubscription =
        _messengerService!.messages.listen(_onSignalingMessage);

    // Attempt connection.
    await _messengerService!.connect();
  }

  /// Disconnect from the signaling server.
  void disconnectFromSignaling() {
    _messageSubscription?.cancel();
    _connectionSubscription?.cancel();
    _messengerService?.disconnect();
    state = state.copyWith(
      isLive: false,
      signalingState: SignalingConnectionState.disconnected,
    );
  }

  void _onConnectionStateChanged(SignalingConnectionState newState) {
    final isLive = newState == SignalingConnectionState.connected;
    state = state.copyWith(
      isLive: isLive,
      signalingState: newState,
    );
  }

  void _onSignalingMessage(Map<String, dynamic> msg) {
    final type = msg['type'] as String? ?? '';

    switch (type) {
      case 'message':
        _handleIncomingMessage(msg);
      case 'peer_joined':
        _handlePeerJoined(msg);
      case 'peer_left':
        _handlePeerLeft(msg);
      case 'error':
        final detail = msg['detail'] as String? ?? 'Unknown signaling error';
        state = state.copyWith(error: detail);
      default:
        // Ignore other types (room_created, joined, left, room_list, etc.)
        break;
    }
  }

  void _handleIncomingMessage(Map<String, dynamic> msg) {
    final fromId = msg['from'] as String? ?? 'unknown';
    final ciphertext = msg['ciphertext'] as String? ?? '';

    if (ciphertext.isEmpty) return;

    // Find or create conversation for this sender.
    final contactId = _findContactIdByUsername(fromId);

    // If the active conversation matches this sender, add the message directly.
    final activeConv = state.activeConversation;
    if (activeConv != null && activeConv.contactId == contactId) {
      final chatMsg = ChatMessage(text: ciphertext, isMine: false);
      final updatedMessages = [...state.messages, chatMsg];

      final updatedConversations = state.conversations.map((c) {
        if (c.id == state.activeConversationId) {
          return c.copyWith(
            lastMessage: ciphertext,
            lastMessageAt: DateTime.now(),
          );
        }
        return c;
      }).toList();

      if (state.activeConversationId != null) {
        _conversationMessages[state.activeConversationId!] = updatedMessages;
      }

      state = state.copyWith(
        messages: updatedMessages,
        conversations: updatedConversations,
        isTyping: false,
      );
    } else {
      // Message is for a different conversation; increment unread.
      final convId = _findConversationIdByContactId(contactId);
      if (convId != null) {
        final updatedConversations = state.conversations.map((c) {
          if (c.id == convId) {
            // Add message to stored messages.
            final stored = _conversationMessages[convId] ?? [];
            stored.add(ChatMessage(text: ciphertext, isMine: false));
            _conversationMessages[convId] = stored;

            return c.copyWith(
              lastMessage: ciphertext,
              lastMessageAt: DateTime.now(),
              unreadCount: c.unreadCount + 1,
            );
          }
          return c;
        }).toList();
        state = state.copyWith(conversations: updatedConversations);
      } else {
        // Unknown sender; create a new contact and conversation.
        _createConversationFromIncoming(fromId, ciphertext);
      }
    }
  }

  void _handlePeerJoined(Map<String, dynamic> msg) {
    final peerId = msg['peer_id'] as String? ?? '';
    if (peerId.isEmpty) return;

    // Update contact online status if we recognize the peer.
    final contactId = _findContactIdByUsername(peerId);
    final updatedContacts = state.contacts.map((c) {
      if (c.id == contactId) {
        return c.copyWith(isOnline: true);
      }
      return c;
    }).toList();
    state = state.copyWith(contacts: updatedContacts);
  }

  void _handlePeerLeft(Map<String, dynamic> msg) {
    final peerId = msg['peer_id'] as String? ?? '';
    if (peerId.isEmpty) return;

    final contactId = _findContactIdByUsername(peerId);
    final updatedContacts = state.contacts.map((c) {
      if (c.id == contactId) {
        return c.copyWith(isOnline: false);
      }
      return c;
    }).toList();
    state = state.copyWith(contacts: updatedContacts);
  }

  /// Map a signaling username to a contact ID.
  /// For demo contacts, we use a simple mapping. For unknown users,
  /// the username itself becomes the contact ID.
  String _findContactIdByUsername(String username) {
    // Demo contact mapping.
    const usernameToContactId = {
      'alice': 'alice-q',
      'bob': 'bob-c',
      'charlie': 'charlie-m',
    };
    return usernameToContactId[username.toLowerCase()] ?? username;
  }

  String? _findConversationIdByContactId(String contactId) {
    try {
      return state.conversations
          .firstWhere((c) => c.contactId == contactId)
          .id;
    } catch (_) {
      return null;
    }
  }

  /// Create a new conversation from an incoming message from an unknown sender.
  void _createConversationFromIncoming(String fromUsername, String text) {
    final contactId = fromUsername;
    final convId = 'conv-$contactId-${DateTime.now().millisecondsSinceEpoch}';

    final newContact = Contact(
      id: contactId,
      name: fromUsername,
      email: '$fromUsername@signaling',
      isOnline: true,
    );

    final newConversation = Conversation(
      id: convId,
      contactId: contactId,
      contactName: fromUsername,
      lastMessage: text,
      lastMessageAt: DateTime.now(),
      unreadCount: 1,
    );

    _conversationMessages[convId] = [
      ChatMessage(text: text, isMine: false),
    ];

    state = state.copyWith(
      contacts: [...state.contacts, newContact],
      conversations: [...state.conversations, newConversation],
    );
  }

  /// Resolve a contact ID to the signaling server username.
  String _contactIdToUsername(String contactId) {
    const contactIdToUsername = {
      'alice-q': 'alice',
      'bob-c': 'bob',
      'charlie-m': 'charlie',
    };
    return contactIdToUsername[contactId] ?? contactId;
  }

  // ── Conversation management ──────────────────────────────────────────

  /// Select a conversation and load its messages.
  void selectConversation(String conversationId) {
    final conv = state.conversations.firstWhere(
      (c) => c.id == conversationId,
      orElse: () => throw StateError('Conversation not found'),
    );

    // Clear unread count
    final updatedConversations = state.conversations.map((c) {
      if (c.id == conversationId) {
        return c.copyWith(unreadCount: 0);
      }
      return c;
    }).toList();

    // Load messages for this conversation
    final messages = _conversationMessages[conversationId] ?? [];

    state = state.copyWith(
      activeConversationId: conversationId,
      conversations: updatedConversations,
      messages: messages,
      isConnected: true,
      clearError: true,
    );

    // Auto-init Rust session for the conversation
    _initSessionForConversation(conv);
  }

  /// Leave the active conversation and return to the list view.
  void leaveConversation() {
    // Persist current messages before leaving
    if (state.activeConversationId != null) {
      _conversationMessages[state.activeConversationId!] =
          List.from(state.messages);
    }
    _autoReplyTimer?.cancel();
    state = state.copyWith(
      clearActiveConversation: true,
      messages: const [],
      isConnected: false,
      isTyping: false,
    );
  }

  /// Start a new conversation with a contact.
  void startNewConversation(Contact contact) {
    // Check if conversation already exists for this contact
    final existing = state.conversations
        .where((c) => c.contactId == contact.id)
        .toList();

    if (existing.isNotEmpty) {
      selectConversation(existing.first.id);
      return;
    }

    final convId =
        'conv-${contact.id}-${DateTime.now().millisecondsSinceEpoch}';
    final newConversation = Conversation(
      id: convId,
      contactId: contact.id,
      contactName: contact.name,
      lastMessage: '',
      lastMessageAt: DateTime.now(),
    );

    _conversationMessages[convId] = [];

    state = state.copyWith(
      conversations: [...state.conversations, newConversation],
      activeConversationId: convId,
      messages: const [],
      isConnected: true,
      clearError: true,
    );

    // Init Rust session
    _initSessionForConversation(newConversation);
  }

  Future<void> _initSessionForConversation(Conversation conv) async {
    try {
      await initAlice();
    } catch (_) {
      // Session init may fail in demo mode; that's OK, we still show the UI
    }
  }

  // ── Original Rust bridge methods (preserved) ────────────────────────

  /// Start a new session as Alice (initiator).
  Future<Uint8List> initAlice() async {
    final result = await rust.ratchetInitAlice();
    state = state.copyWith(sessionId: result.sessionId);
    return Uint8List.fromList(result.publicKey);
  }

  /// Complete Alice's handshake with Bob's response.
  Future<void> aliceFinish(Uint8List kemCt, Uint8List bobPk) async {
    if (state.sessionId == null) return;
    await rust.ratchetAliceFinish(
      sessionId: state.sessionId!,
      kemCiphertext: kemCt,
      bobPublicKey: bobPk,
    );
    state = state.copyWith(isConnected: true);
  }

  /// Send a message. Routes through signaling server when live, falls back
  /// to demo auto-replies when offline.
  Future<rust.RatchetMessage?> sendMessage(String text) async {
    // Always add the outgoing message to the UI immediately.
    _addOutgoingMessage(text);

    // Route through live signaling if connected.
    if (state.isLive && _messengerService != null) {
      final contact = state.activeContact;
      if (contact != null) {
        final targetUsername = _contactIdToUsername(contact.id);
        _messengerService!.sendMessageToPeer(
          target: targetUsername,
          plaintext: text,
        );
      }
      // No auto-reply in live mode; real messages come through WebSocket.
      return null;
    }

    // Offline / demo fallback: schedule auto-reply.
    _scheduleAutoReply();

    // Attempt Rust ratchet encryption (best-effort).
    if (state.sessionId != null && state.isConnected) {
      try {
        return await rust.ratchetEncrypt(
          sessionId: state.sessionId!,
          plaintext: Uint8List.fromList(text.codeUnits),
        );
      } catch (_) {
        return null;
      }
    }
    return null;
  }

  void _addOutgoingMessage(String text) {
    final msg = ChatMessage(text: text, isMine: true);
    final updatedMessages = [...state.messages, msg];

    // Update conversation's last message
    final updatedConversations = state.conversations.map((c) {
      if (c.id == state.activeConversationId) {
        return c.copyWith(lastMessage: text, lastMessageAt: DateTime.now());
      }
      return c;
    }).toList();

    // Persist to per-conversation store
    if (state.activeConversationId != null) {
      _conversationMessages[state.activeConversationId!] = updatedMessages;
    }

    state = state.copyWith(
      messages: updatedMessages,
      conversations: updatedConversations,
    );
  }

  /// Schedule an auto-reply to simulate a live conversation (demo fallback).
  void _scheduleAutoReply() {
    _autoReplyTimer?.cancel();
    final delay = Duration(milliseconds: 1000 + Random().nextInt(1500));

    // Show typing indicator
    state = state.copyWith(isTyping: true);

    _autoReplyTimer = Timer(delay, () {
      if (state.activeConversationId == null) return;

      final replyText = _demoReplies[_replyIndex % _demoReplies.length];
      _replyIndex++;

      // Mark all our outgoing messages as read (simulated read receipt)
      final readMessages = state.messages.map((m) {
        if (m.isMine && !m.isRead) return m.copyWith(isRead: true);
        return m;
      }).toList();

      final msg = ChatMessage(text: replyText, isMine: false);
      final updatedMessages = [...readMessages, msg];

      final updatedConversations = state.conversations.map((c) {
        if (c.id == state.activeConversationId) {
          return c.copyWith(
            lastMessage: replyText,
            lastMessageAt: DateTime.now(),
          );
        }
        return c;
      }).toList();

      if (state.activeConversationId != null) {
        _conversationMessages[state.activeConversationId!] = updatedMessages;
      }

      state = state.copyWith(
        messages: updatedMessages,
        conversations: updatedConversations,
        isTyping: false,
      );
    });
  }

  /// Decrypt a received message.
  Future<void> receiveMessage(Uint8List header, Uint8List ciphertext) async {
    if (state.sessionId == null) return;
    try {
      final plaintext = await rust.ratchetDecrypt(
        sessionId: state.sessionId!,
        header: header,
        ciphertext: ciphertext,
      );
      final msg = ChatMessage(
        text: String.fromCharCodes(plaintext),
        isMine: false,
      );
      final updatedMessages = [...state.messages, msg];

      if (state.activeConversationId != null) {
        _conversationMessages[state.activeConversationId!] = updatedMessages;
      }

      state = state.copyWith(messages: updatedMessages);
    } catch (e) {
      state = state.copyWith(error: e.toString());
    }
  }

  void destroy() {
    _autoReplyTimer?.cancel();
    _messageSubscription?.cancel();
    _connectionSubscription?.cancel();
    _messengerService?.dispose();
    if (state.sessionId != null) {
      rust.ratchetDestroy(sessionId: state.sessionId!);
    }
    state = const RatchetState();
  }
}

final ratchetProvider =
    NotifierProvider<RatchetNotifier, RatchetState>(RatchetNotifier.new);
