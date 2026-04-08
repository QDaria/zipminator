import 'package:flutter/material.dart';
import 'package:flutter_animate/flutter_animate.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:zipminator/core/providers/ratchet_provider.dart';
import 'package:zipminator/core/services/messenger_service.dart';
import 'package:zipminator/core/theme/quantum_theme.dart';
import 'package:zipminator/shared/widgets/widgets.dart';

/// Pillar 2: PQC Messenger — Double Ratchet encrypted chat.
class MessengerScreen extends ConsumerStatefulWidget {
  const MessengerScreen({super.key});

  @override
  ConsumerState<MessengerScreen> createState() => _MessengerScreenState();
}

class _MessengerScreenState extends ConsumerState<MessengerScreen> {
  final _controller = TextEditingController();
  final _scrollController = ScrollController();
  final _searchController = TextEditingController();
  String _searchQuery = '';

  @override
  void dispose() {
    _controller.dispose();
    _scrollController.dispose();
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final ratchet = ref.watch(ratchetProvider);
    final hasActiveConversation = ratchet.activeConversationId != null;

    return GestureDetector(
      onTap: () => FocusScope.of(context).unfocus(),
      child: Scaffold(
      resizeToAvoidBottomInset: true,
      body: GradientBackground(
        child: hasActiveConversation
            ? _ChatView(
                ratchet: ratchet,
                controller: _controller,
                scrollController: _scrollController,
                onSend: _sendMessage,
                onBack: _leaveConversation,
              )
            : _ConversationListView(
                ratchet: ratchet,
                searchQuery: _searchQuery,
                searchController: _searchController,
                onSearchChanged: (q) => setState(() => _searchQuery = q),
                onSelectConversation: _selectConversation,
                onNewConversation: _showNewConversationSheet,
                onReconnect: () {
                  ref.read(ratchetProvider.notifier).connectToSignaling();
                },
              ),
      ),
      floatingActionButton: hasActiveConversation
          ? null
          : FloatingActionButton(
              onPressed: _showNewConversationSheet,
              backgroundColor: QuantumTheme.quantumPurple,
              child: const Icon(Icons.edit, color: Colors.white),
            ),
    ));
  }

  void _sendMessage() {
    final text = _controller.text.trim();
    if (text.isEmpty) return;
    ref.read(ratchetProvider.notifier).sendMessage(text);
    _controller.clear();
    _scrollToBottom();
  }

  void _selectConversation(String conversationId) {
    ref.read(ratchetProvider.notifier).selectConversation(conversationId);
  }

  void _leaveConversation() {
    ref.read(ratchetProvider.notifier).leaveConversation();
  }

  void _scrollToBottom() {
    WidgetsBinding.instance.addPostFrameCallback((_) {
      if (_scrollController.hasClients) {
        _scrollController.animateTo(
          _scrollController.position.maxScrollExtent,
          duration: const Duration(milliseconds: 300),
          curve: Curves.easeOut,
        );
      }
    });
  }

  void _showNewConversationSheet() {
    final ratchet = ref.read(ratchetProvider);
    showModalBottomSheet(
      context: context,
      backgroundColor: QuantumTheme.surfaceCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (ctx) => _NewConversationSheet(
        contacts: ratchet.contacts,
        onSelect: (contact) {
          Navigator.pop(ctx);
          ref.read(ratchetProvider.notifier).startNewConversation(contact);
        },
      ),
    );
  }
}

// ── Conversation List View ──────────────────────────────────────────────

class _ConversationListView extends StatelessWidget {
  final RatchetState ratchet;
  final String searchQuery;
  final TextEditingController searchController;
  final ValueChanged<String> onSearchChanged;
  final ValueChanged<String> onSelectConversation;
  final VoidCallback onNewConversation;
  final VoidCallback onReconnect;

  const _ConversationListView({
    required this.ratchet,
    required this.searchQuery,
    required this.searchController,
    required this.onSearchChanged,
    required this.onSelectConversation,
    required this.onNewConversation,
    required this.onReconnect,
  });

  @override
  Widget build(BuildContext context) {
    final filtered = searchQuery.isEmpty
        ? List<Conversation>.from(ratchet.conversations)
        : ratchet.conversations.where((c) {
            final q = searchQuery.toLowerCase();
            return c.contactName.toLowerCase().contains(q) ||
                c.lastMessage.toLowerCase().contains(q);
          }).toList();

    // Sort by most recent first
    filtered.sort((a, b) => b.lastMessageAt.compareTo(a.lastMessageAt));

    return Column(
      children: [
        // AppBar area
        SafeArea(
          bottom: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
            child: Row(
              children: [
                Icon(Icons.chat_bubble_outline,
                    color: QuantumTheme.quantumPurple, size: 28),
                const SizedBox(width: 12),
                Expanded(
                  child: Text(
                    'PQC Messenger',
                    style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                          fontWeight: FontWeight.w700,
                        ),
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                const SizedBox(width: 8),
                _SignalingBadge(
                  signalingState: ratchet.signalingState,
                  isLive: ratchet.isLive,
                  onReconnect: onReconnect,
                ),
              ],
            ),
          ),
        ),

        // Search bar
        Padding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 8),
          child: TextField(
            controller: searchController,
            onChanged: onSearchChanged,
            decoration: InputDecoration(
              hintText: 'Search conversations...',
              prefixIcon: Icon(Icons.search,
                  color: QuantumTheme.textSecondary, size: 20),
              suffixIcon: searchQuery.isNotEmpty
                  ? IconButton(
                      icon: Icon(Icons.close,
                          color: QuantumTheme.textSecondary, size: 18),
                      onPressed: () {
                        searchController.clear();
                        onSearchChanged('');
                      },
                    )
                  : null,
              filled: true,
              fillColor: QuantumTheme.surfaceElevated,
              contentPadding:
                  const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
              border: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.1),
                ),
              ),
              enabledBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.1),
                ),
              ),
              focusedBorder: OutlineInputBorder(
                borderRadius: BorderRadius.circular(12),
                borderSide: BorderSide(
                  color: QuantumTheme.quantumCyan.withValues(alpha: 0.4),
                ),
              ),
            ),
          ),
        ),

        // Encryption status banner
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 16),
          child: Row(
            children: [
              Icon(Icons.lock, size: 12, color: QuantumTheme.quantumGreen),
              const SizedBox(width: 6),
              Expanded(
                child: Text(
                  'All conversations are PQ-encrypted with ML-KEM-768',
                  style: Theme.of(context).textTheme.labelSmall?.copyWith(
                        color: QuantumTheme.quantumGreen.withValues(alpha: 0.8),
                      ),
                  overflow: TextOverflow.ellipsis,
                ),
              ),
            ],
          ),
        ),

        const SizedBox(height: 8),

        // Conversation list
        Expanded(
          child: filtered.isEmpty
              ? _EmptyConversations(onNew: onNewConversation)
              : ListView.builder(
                  padding: const EdgeInsets.symmetric(horizontal: 12),
                  itemCount: filtered.length,
                  itemBuilder: (context, index) {
                    final conv = filtered[index];
                    final contact = ratchet.contacts
                        .where((c) => c.id == conv.contactId)
                        .toList();
                    final isOnline =
                        contact.isNotEmpty && contact.first.isOnline;

                    return _ConversationTile(
                      conversation: conv,
                      isOnline: isOnline,
                      onTap: () => onSelectConversation(conv.id),
                    )
                        .animate()
                        .fadeIn(duration: 200.ms, delay: (index * 60).ms)
                        .slideX(begin: -0.05);
                  },
                ),
        ),
      ],
    );
  }
}

class _EmptyConversations extends StatelessWidget {
  final VoidCallback onNew;

  const _EmptyConversations({required this.onNew});

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            Container(
              width: 80,
              height: 80,
              decoration: BoxDecoration(
                shape: BoxShape.circle,
                color: QuantumTheme.quantumGreen.withValues(alpha: 0.1),
                border: Border.all(
                  color: QuantumTheme.quantumGreen.withValues(alpha: 0.3),
                ),
              ),
              child: Icon(
                Icons.lock_outline,
                size: 36,
                color: QuantumTheme.quantumGreen.withValues(alpha: 0.8),
              ),
            ),
            const SizedBox(height: 20),
            Text(
              'Start a quantum-safe conversation',
              style: Theme.of(context).textTheme.titleMedium?.copyWith(
                    color: QuantumTheme.textPrimary,
                    fontWeight: FontWeight.w600,
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 8),
            Text(
              'Your messages are protected by\nML-KEM-768 Double Ratchet encryption',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: QuantumTheme.textSecondary.withValues(alpha: 0.7),
                  ),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 24),
            FilledButton.icon(
              onPressed: onNew,
              icon: const Icon(Icons.add, size: 18),
              label: const Text('New Conversation'),
              style: FilledButton.styleFrom(
                backgroundColor: QuantumTheme.quantumPurple,
                foregroundColor: Colors.white,
                padding:
                    const EdgeInsets.symmetric(horizontal: 20, vertical: 12),
              ),
            ),
            const SizedBox(height: 24),
            const PillarFooter(pillarName: 'Messenger'),
          ],
        ),
      ),
    );
  }
}

class _ConversationTile extends StatelessWidget {
  final Conversation conversation;
  final bool isOnline;
  final VoidCallback onTap;

  const _ConversationTile({
    required this.conversation,
    required this.isOnline,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    final initial = conversation.contactName.isNotEmpty
        ? conversation.contactName[0].toUpperCase()
        : '?';
    final hasUnread = conversation.unreadCount > 0;
    final timeAgo = _formatTimeAgo(conversation.lastMessageAt);

    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: QuantumCard(
        glowColor: hasUnread
            ? QuantumTheme.quantumCyan
            : QuantumTheme.quantumPurple.withValues(alpha: 0.3),
        borderRadius: 14,
        padding: EdgeInsets.zero,
        child: InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(14),
          child: Padding(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 12),
            child: Row(
              children: [
                // Avatar
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 24,
                      backgroundColor:
                          QuantumTheme.quantumPurple.withValues(alpha: 0.2),
                      child: Text(
                        initial,
                        style: const TextStyle(
                          color: QuantumTheme.quantumPurple,
                          fontWeight: FontWeight.w700,
                          fontSize: 18,
                        ),
                      ),
                    ),
                    if (isOnline)
                      Positioned(
                        right: -2,
                        bottom: -2,
                        child: Container(
                          width: 16,
                          height: 16,
                          decoration: BoxDecoration(
                            color: const Color(0xFF00E676),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white,
                              width: 2.5,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF00E676).withValues(alpha: 0.6),
                                blurRadius: 4,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 14),

                // Name + last message
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        conversation.contactName,
                        style:
                            Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight:
                                      hasUnread ? FontWeight.w700 : FontWeight.w500,
                                ),
                        maxLines: 1,
                        overflow: TextOverflow.ellipsis,
                      ),
                      const SizedBox(height: 3),
                      if (conversation.lastMessage.isNotEmpty)
                        Row(
                          children: [
                            Icon(Icons.lock,
                                size: 10,
                                color: QuantumTheme.quantumGreen
                                    .withValues(alpha: 0.6)),
                            const SizedBox(width: 4),
                            Expanded(
                              child: Text(
                                conversation.lastMessage,
                                style: Theme.of(context)
                                    .textTheme
                                    .bodySmall
                                    ?.copyWith(
                                      color: hasUnread
                                          ? QuantumTheme.textPrimary
                                          : QuantumTheme.textSecondary,
                                    ),
                                maxLines: 1,
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                          ],
                        ),
                    ],
                  ),
                ),
                const SizedBox(width: 8),

                // Timestamp + unread badge
                Column(
                  crossAxisAlignment: CrossAxisAlignment.end,
                  children: [
                    Text(
                      timeAgo,
                      style: Theme.of(context).textTheme.labelSmall?.copyWith(
                            color: hasUnread
                                ? QuantumTheme.quantumCyan
                                : QuantumTheme.textSecondary,
                          ),
                    ),
                    if (hasUnread) ...[
                      const SizedBox(height: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(
                            horizontal: 7, vertical: 3),
                        decoration: BoxDecoration(
                          color: QuantumTheme.quantumCyan,
                          borderRadius: BorderRadius.circular(10),
                        ),
                        child: Text(
                          '${conversation.unreadCount}',
                          style: const TextStyle(
                            color: Colors.black,
                            fontSize: 11,
                            fontWeight: FontWeight.w700,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTimeAgo(DateTime dt) {
    final diff = DateTime.now().difference(dt);
    if (diff.inMinutes < 1) return 'now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m';
    if (diff.inHours < 24) return '${diff.inHours}h';
    if (diff.inDays < 7) return '${diff.inDays}d';
    return '${dt.month}/${dt.day}';
  }
}

// ── Chat View ───────────────────────────────────────────────────────────

class _ChatView extends StatelessWidget {
  final RatchetState ratchet;
  final TextEditingController controller;
  final ScrollController scrollController;
  final VoidCallback onSend;
  final VoidCallback onBack;

  const _ChatView({
    required this.ratchet,
    required this.controller,
    required this.scrollController,
    required this.onSend,
    required this.onBack,
  });

  @override
  Widget build(BuildContext context) {
    final contact = ratchet.activeContact;
    final contactName = contact?.name ?? 'Unknown';
    final isOnline = contact?.isOnline ?? false;

    return Column(
      children: [
        // Custom AppBar
        SafeArea(
          bottom: false,
          child: Container(
            padding: const EdgeInsets.fromLTRB(4, 8, 12, 8),
            decoration: BoxDecoration(
              border: Border(
                bottom: BorderSide(
                  color: QuantumTheme.quantumPurple.withValues(alpha: 0.15),
                ),
              ),
            ),
            child: Row(
              children: [
                IconButton(
                  icon: const Icon(Icons.arrow_back),
                  onPressed: onBack,
                ),
                // Contact avatar
                Stack(
                  children: [
                    CircleAvatar(
                      radius: 18,
                      backgroundColor:
                          QuantumTheme.quantumPurple.withValues(alpha: 0.2),
                      child: Text(
                        contactName[0].toUpperCase(),
                        style: const TextStyle(
                          color: QuantumTheme.quantumPurple,
                          fontWeight: FontWeight.w700,
                          fontSize: 14,
                        ),
                      ),
                    ),
                    if (isOnline)
                      Positioned(
                        right: -1,
                        bottom: -1,
                        child: Container(
                          width: 12,
                          height: 12,
                          decoration: BoxDecoration(
                            color: const Color(0xFF00E676),
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white,
                              width: 2,
                            ),
                            boxShadow: [
                              BoxShadow(
                                color: const Color(0xFF00E676).withValues(alpha: 0.6),
                                blurRadius: 4,
                                spreadRadius: 1,
                              ),
                            ],
                          ),
                        ),
                      ),
                  ],
                ),
                const SizedBox(width: 10),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        contactName,
                        style:
                            Theme.of(context).textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                      ),
                      Text(
                        ratchet.isLive
                            ? (isOnline ? 'Online (Live)' : 'Offline (Live)')
                            : (isOnline ? 'Online (Demo)' : 'Offline (Demo)'),
                        style:
                            Theme.of(context).textTheme.labelSmall?.copyWith(
                                  color: isOnline
                                      ? QuantumTheme.quantumGreen
                                      : QuantumTheme.textSecondary,
                                ),
                      ),
                    ],
                  ),
                ),
                PqcBadge(
                  label: ratchet.isLive ? 'Live' : 'Demo',
                  isActive: ratchet.isLive,
                  color: ratchet.isLive
                      ? QuantumTheme.quantumGreen
                      : QuantumTheme.quantumOrange,
                ),
              ],
            ),
          ),
        ),

        // Messages
        Expanded(
          child: ratchet.messages.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.lock,
                          size: 32,
                          color:
                              QuantumTheme.quantumGreen.withValues(alpha: 0.5)),
                      const SizedBox(height: 8),
                      Text(
                        'PQ-Double Ratchet session established.\nSend your first quantum-safe message!',
                        textAlign: TextAlign.center,
                        style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                              color: QuantumTheme.textSecondary,
                            ),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  controller: scrollController,
                  padding: const EdgeInsets.all(8),
                  itemCount: ratchet.messages.length,
                  itemBuilder: (context, index) {
                    final msg = ratchet.messages[index];
                    return _MessageBubble(message: msg)
                        .animate()
                        .fadeIn(duration: 200.ms)
                        .slideY(begin: 0.1);
                  },
                ),
        ),

        // Typing indicator
        if (ratchet.isTyping)
          Padding(
            padding: const EdgeInsets.only(left: 12, bottom: 4, right: 12),
            child: Align(
              alignment: Alignment.centerLeft,
              child: Container(
                padding:
                    const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                decoration: BoxDecoration(
                  color: QuantumTheme.surfaceElevated,
                  borderRadius: BorderRadius.circular(16),
                  border: Border.all(
                    color:
                        QuantumTheme.quantumPurple.withValues(alpha: 0.15),
                  ),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock,
                        size: 10,
                        color: QuantumTheme.quantumGreen
                            .withValues(alpha: 0.6)),
                    const SizedBox(width: 6),
                    Text(
                      '${ratchet.activeContact?.name ?? "Contact"} is typing',
                      style:
                          Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: QuantumTheme.textSecondary,
                                fontStyle: FontStyle.italic,
                              ),
                    ),
                    const SizedBox(width: 6),
                    _TypingIndicator(),
                  ],
                ),
              ),
            ),
          ),

        // Error
        if (ratchet.error != null)
          Container(
            padding: const EdgeInsets.all(8),
            color: QuantumTheme.quantumRed.withValues(alpha: 0.1),
            child: Text(ratchet.error!,
                style: TextStyle(color: QuantumTheme.quantumRed)),
          ),

        // Input
        QuantumCard(
          glowColor: QuantumTheme.quantumCyan,
          borderRadius: 0,
          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
          child: SafeArea(
            top: false,
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: controller,
                    decoration: const InputDecoration(
                      hintText: 'Type a message...',
                      border: InputBorder.none,
                    ),
                    onSubmitted: (_) => onSend(),
                    textInputAction: TextInputAction.send,
                  ),
                ),
                IconButton(
                  icon: Icon(Icons.send, color: QuantumTheme.quantumCyan),
                  onPressed: onSend,
                ),
              ],
            ),
          ),
        ),
      ],
    );
  }
}

// ── New Conversation Bottom Sheet ────────────────────────────────────────

class _NewConversationSheet extends StatelessWidget {
  final List<Contact> contacts;
  final ValueChanged<Contact> onSelect;

  const _NewConversationSheet({
    required this.contacts,
    required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 32),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Center(
            child: Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: QuantumTheme.textSecondary.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
          ),
          const SizedBox(height: 16),
          Text(
            'New Conversation',
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  fontWeight: FontWeight.w700,
                ),
          ),
          const SizedBox(height: 4),
          Text(
            'Select a contact to start a PQ-encrypted chat',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
                  color: QuantumTheme.textSecondary,
                ),
          ),
          const SizedBox(height: 12),
          // Add contact by username
          _AddContactField(onAdd: onSelect),
          const Divider(height: 24),
          Text('Contacts', style: Theme.of(context).textTheme.labelLarge),
          const SizedBox(height: 8),
          ...contacts.map((contact) => _ContactTile(
                contact: contact,
                onTap: () => onSelect(contact),
              )),
        ],
      ),
    );
  }
}

class _AddContactField extends StatefulWidget {
  final ValueChanged<Contact> onAdd;
  const _AddContactField({required this.onAdd});
  @override
  State<_AddContactField> createState() => _AddContactFieldState();
}

class _AddContactFieldState extends State<_AddContactField> {
  final _ctrl = TextEditingController();

  void _add() {
    final input = _ctrl.text.trim();
    if (input.isEmpty) return;
    // Derive username from email (before @) or use as-is
    final username = input.contains('@') ? input.split('@').first : input;
    final contact = Contact(
      id: 'live-$username',
      name: username,
      email: input.contains('@') ? input : '$input@zipminator.zip',
      isOnline: true,
    );
    widget.onAdd(contact);
  }

  @override
  void dispose() {
    _ctrl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        Expanded(
          child: TextField(
            controller: _ctrl,
            decoration: const InputDecoration(
              hintText: 'Enter email or username...',
              prefixIcon: Icon(Icons.person_add, size: 20),
              isDense: true,
            ),
            onSubmitted: (_) => _add(),
          ),
        ),
        const SizedBox(width: 8),
        IconButton.filled(
          onPressed: _add,
          icon: const Icon(Icons.send, size: 18),
          style: IconButton.styleFrom(
            backgroundColor: QuantumTheme.quantumCyan,
            foregroundColor: Colors.black,
          ),
        ),
      ],
    );
  }
}

class _ContactTile extends StatelessWidget {
  final Contact contact;
  final VoidCallback onTap;

  const _ContactTile({required this.contact, required this.onTap});

  @override
  Widget build(BuildContext context) {
    final initial = contact.name.isNotEmpty ? contact.name[0].toUpperCase() : '?';

    return ListTile(
      onTap: onTap,
      contentPadding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
      leading: Stack(
        children: [
          CircleAvatar(
            radius: 22,
            backgroundColor:
                QuantumTheme.quantumPurple.withValues(alpha: 0.2),
            child: Text(
              initial,
              style: const TextStyle(
                color: QuantumTheme.quantumPurple,
                fontWeight: FontWeight.w700,
                fontSize: 16,
              ),
            ),
          ),
          if (contact.isOnline)
            Positioned(
              right: -1,
              bottom: -1,
              child: Container(
                width: 14,
                height: 14,
                decoration: BoxDecoration(
                  color: const Color(0xFF00E676),
                  shape: BoxShape.circle,
                  border: Border.all(
                    color: Colors.white,
                    width: 2,
                  ),
                  boxShadow: [
                    BoxShadow(
                      color: const Color(0xFF00E676).withValues(alpha: 0.6),
                      blurRadius: 4,
                      spreadRadius: 1,
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
      title: Text(
        contact.name,
        style: Theme.of(context).textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w500,
            ),
      ),
      subtitle: Text(
        contact.email,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: QuantumTheme.textSecondary,
            ),
      ),
      trailing: Icon(
        Icons.chat_bubble_outline,
        color: QuantumTheme.quantumCyan.withValues(alpha: 0.6),
        size: 20,
      ),
    );
  }
}

// ── Shared Widgets (preserved from original) ────────────────────────────

class _MessageBubble extends StatelessWidget {
  final ChatMessage message;

  const _MessageBubble({required this.message});

  @override
  Widget build(BuildContext context) {
    final isMine = message.isMine;
    final timeStr = _formatTime(message.timestamp);

    return Align(
      alignment: isMine ? Alignment.centerRight : Alignment.centerLeft,
      child: Padding(
        padding: const EdgeInsets.symmetric(vertical: 4),
        child: ConstrainedBox(
          constraints: BoxConstraints(
              maxWidth: MediaQuery.sizeOf(context).width * 0.75),
          child: QuantumCard(
            glowColor: isMine
                ? QuantumTheme.quantumCyan
                : QuantumTheme.quantumPurple,
            borderRadius: 16,
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 10),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(message.text),
                const SizedBox(height: 4),
                Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(Icons.lock,
                        size: 10, color: QuantumTheme.quantumGreen),
                    const SizedBox(width: 4),
                    Text(
                      timeStr,
                      style:
                          Theme.of(context).textTheme.labelSmall?.copyWith(
                                color: QuantumTheme.textSecondary
                                    .withValues(alpha: 0.6),
                              ),
                    ),
                    if (isMine) ...[
                      const SizedBox(width: 6),
                      _ReadReceipt(isRead: message.isRead),
                    ],
                  ],
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }

  String _formatTime(DateTime dt) {
    final h = dt.hour.toString().padLeft(2, '0');
    final m = dt.minute.toString().padLeft(2, '0');
    return '$h:$m';
  }
}

/// Double-checkmark read receipt indicator (Signal/WhatsApp style).
class _ReadReceipt extends StatelessWidget {
  final bool isRead;

  const _ReadReceipt({required this.isRead});

  @override
  Widget build(BuildContext context) {
    final color = isRead
        ? QuantumTheme.quantumCyan
        : QuantumTheme.textSecondary.withValues(alpha: 0.5);

    return SizedBox(
      width: 16,
      height: 12,
      child: Stack(
        children: [
          Positioned(
            left: 0,
            child: Icon(Icons.check, size: 12, color: color),
          ),
          Positioned(
            left: 5,
            child: Icon(Icons.check, size: 12, color: color),
          ),
        ],
      ),
    );
  }
}

/// Badge that shows Live / Connecting / Demo based on signaling server state.
class _SignalingBadge extends StatelessWidget {
  final SignalingConnectionState signalingState;
  final bool isLive;
  final VoidCallback onReconnect;

  const _SignalingBadge({
    required this.signalingState,
    required this.isLive,
    required this.onReconnect,
  });

  @override
  Widget build(BuildContext context) {
    final String label;
    final Color color;
    final IconData icon;

    switch (signalingState) {
      case SignalingConnectionState.connected:
        label = 'Live';
        color = QuantumTheme.quantumGreen;
        icon = Icons.wifi;
      case SignalingConnectionState.connecting:
        label = 'Connecting...';
        color = QuantumTheme.quantumOrange;
        icon = Icons.sync;
      case SignalingConnectionState.error:
        label = 'Demo';
        color = QuantumTheme.quantumOrange;
        icon = Icons.wifi_off;
      case SignalingConnectionState.disconnected:
        label = 'Demo';
        color = QuantumTheme.textSecondary;
        icon = Icons.wifi_off;
    }

    return GestureDetector(
      onTap: isLive ? null : onReconnect,
      child: Container(
        padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
        decoration: BoxDecoration(
          borderRadius: BorderRadius.circular(20),
          color: color.withValues(alpha: 0.15),
          border: Border.all(color: color.withValues(alpha: 0.3)),
        ),
        child: Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(icon, size: 12, color: color),
            const SizedBox(width: 4),
            Text(
              label,
              style: TextStyle(
                color: color,
                fontSize: 11,
                fontWeight: FontWeight.w600,
              ),
            ),
          ],
        ),
      ),
    );
  }
}

class _TypingIndicator extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Row(
      mainAxisSize: MainAxisSize.min,
      children: List.generate(3, (i) {
        return Container(
          margin: const EdgeInsets.symmetric(horizontal: 2),
          width: 6,
          height: 6,
          decoration: BoxDecoration(
            color: QuantumTheme.quantumPurple.withValues(alpha: 0.5),
            shape: BoxShape.circle,
          ),
        )
            .animate(
              onPlay: (controller) => controller.repeat(reverse: true),
            )
            .fadeIn(duration: 400.ms, delay: (i * 150).ms)
            .slideY(
                begin: 0.0,
                end: -0.5,
                duration: 400.ms,
                delay: (i * 150).ms);
      }),
    );
  }
}
