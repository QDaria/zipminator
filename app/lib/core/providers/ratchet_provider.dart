import 'dart:async';
import 'dart:math';
import 'dart:typed_data';
import 'package:flutter_riverpod/flutter_riverpod.dart';
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

  ChatMessage({required this.text, required this.isMine, DateTime? timestamp})
      : timestamp = timestamp ?? DateTime.now();
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

  const RatchetState({
    this.sessionId,
    this.isConnected = false,
    this.messages = const [],
    this.error,
    this.contacts = const [],
    this.conversations = const [],
    this.activeConversationId,
    this.isTyping = false,
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

/// Manages PQ Double Ratchet messaging sessions.
class RatchetNotifier extends Notifier<RatchetState> {
  Timer? _autoReplyTimer;
  int _replyIndex = 0;

  @override
  RatchetState build() {
    ref.onDispose(() {
      _autoReplyTimer?.cancel();
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

    final convId = 'conv-${contact.id}-${DateTime.now().millisecondsSinceEpoch}';
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

  /// Send an encrypted message.
  Future<rust.RatchetMessage?> sendMessage(String text) async {
    if (state.sessionId == null || !state.isConnected) {
      // In demo mode without a real Rust session, still add the message
      _addOutgoingMessage(text);
      _scheduleAutoReply();
      return null;
    }
    try {
      final enc = await rust.ratchetEncrypt(
        sessionId: state.sessionId!,
        plaintext: Uint8List.fromList(text.codeUnits),
      );
      _addOutgoingMessage(text);
      _scheduleAutoReply();
      return enc;
    } catch (e) {
      // Fallback: still show the message in demo mode
      _addOutgoingMessage(text);
      _scheduleAutoReply();
      return null;
    }
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

  /// Schedule an auto-reply to simulate a live conversation.
  void _scheduleAutoReply() {
    _autoReplyTimer?.cancel();
    final delay = Duration(milliseconds: 1000 + Random().nextInt(1500));

    // Show typing indicator
    state = state.copyWith(isTyping: true);

    _autoReplyTimer = Timer(delay, () {
      if (state.activeConversationId == null) return;

      final replyText = _demoReplies[_replyIndex % _demoReplies.length];
      _replyIndex++;

      final msg = ChatMessage(text: replyText, isMine: false);
      final updatedMessages = [...state.messages, msg];

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
    if (state.sessionId != null) {
      rust.ratchetDestroy(sessionId: state.sessionId!);
    }
    state = const RatchetState();
  }
}

final ratchetProvider =
    NotifierProvider<RatchetNotifier, RatchetState>(RatchetNotifier.new);
