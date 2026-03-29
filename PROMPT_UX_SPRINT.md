# Zipminator UX Sprint — Build 0.5.0+17

> Paste into a fresh `claude --effort max` session from `/Users/mos/dev/qdaria/zipminator`

---

## Session State (carry-forward from previous session, Mar 26-28 2026)

### What was shipped
- 16 TestFlight builds (0.5.0+1 through +16)
- Signaling server LIVE at wss://zipminator-signaling.fly.dev (Fly.io, $25 credit)
- Research paper revised (7 peer review fixes, score 0.45 -> estimated 0.80)
- iOS build pipeline working (code signing, entitlements, ExportOptions.plist)
- Apple Developer: Team ID 5EK49H64WB, houshmand.81@gmail.com, Individual

### What works on iPhone
- App launches, all 9 pillars navigate
- Vault: ML-KEM-768 keypair generation, KEM roundtrip verified, file encrypt/decrypt
- Signaling server connects (green "Live" badge appears)
- First real message sent from iPhone to testbot through live server (verified in server logs)

### What's broken
1. **Messaging reply doesn't arrive on iPhone** — message reaches testbot (server log confirmed), testbot replies, but reply gets "peer mo is offline" because WebSocket drops. Keep-alive pings added in build 16, server redeployed with ping support. NEEDS TESTING.
2. **activeContact was null** for user-added contacts — FIXED in build 14 (contact added to contacts list)
3. **live- prefix** in contact ID breaking target username — FIXED in build 14 (stripped in _contactIdToUsername)
4. **Debug messages** still in code — need removal
5. **VoIP** still demo-only (calls Alice Quantum, no real peer)
6. **Anonymizer** privacy eyes added but not tested on device
7. **Q-Mesh** body silhouettes added but not tested on device
8. **Self-destruct timer** UI-only, not wired to actual deletion
9. **VPN location anonymization** UI-only, not wired

### Critical files
- `app/lib/core/providers/ratchet_provider.dart` — messenger state + signaling
- `app/lib/core/services/messenger_service.dart` — WebSocket client with keep-alive
- `app/lib/core/config.dart` — signaling URL
- `app/lib/features/messenger/messenger_screen.dart` — chat UI + add contact field
- `src/zipminator/messenger/signaling_server.py` — server-side (deployed on Fly.io)

### Build pipeline
```bash
micromamba activate zip-pqc    # Before any Python
flutter analyze                # Must be 0 errors
flutter build ipa --export-options-plist=ios/ExportOptions.plist
# Auto-uploads to TestFlight via app-store-connect export method
# If not, manual: xcodebuild -exportArchive -archivePath build/ios/archive/Runner.xcarchive -exportOptionsPlist ios/ExportOptions.plist -exportPath build/ios/ipa/
```

---

## Priority 1: Fix Messaging Round-Trip (BLOCKING)

### Step 1: Run testbot
```bash
micromamba activate zip-pqc && python3 -c "
import asyncio, json, websockets, logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s %(message)s')
async def bot():
    while True:
        try:
            async with websockets.connect('wss://zipminator-signaling.fly.dev/ws/testbot', ping_interval=10, ping_timeout=30) as ws:
                logging.info('CONNECTED')
                async for raw in ws:
                    msg = json.loads(raw)
                    logging.info(f'GOT: {json.dumps(msg)}')
                    if msg.get('type') == 'message':
                        await ws.send(json.dumps({'action':'message','target':msg['from'],'ciphertext':'REAL REPLY from testbot!'}))
                        logging.info(f'REPLIED to {msg[\"from\"]}')
        except Exception as e:
            logging.error(f'Disconnected: {e}. Reconnecting in 2s...')
            await asyncio.sleep(2)
asyncio.run(bot())
"
```

### Step 2: Build + TestFlight
Bump version, build IPA, upload. Update on iPhone.

### Step 3: Test on iPhone
1. Force-close Zipminator
2. Reopen, go to Messenger
3. Verify "Live" green badge
4. Tap pen icon → type "testbot" → tap arrow
5. In conversation, send "hi"
6. Check testbot log: did it receive?
7. Check iPhone: did reply appear?

### Step 4: Debug if needed
The previous session identified these issues:
- `state.isLive` was stale → FIXED: now checks `_messengerService!.isConnected` directly
- `activeContact` was null → FIXED: contacts added to list in `startNewConversation`
- `live-` prefix → FIXED: stripped in `_contactIdToUsername`
- Keep-alive pings → FIXED: sends "ping" every 15s, server ignores it
- WebSocket drops → May still occur. Check if the connection survives >30 seconds.

If reply still doesn't arrive, the issue is likely:
- App's WebSocket closes when conversation view opens (lifecycle bug)
- Or the `_onSignalingMessage` handler doesn't route incoming messages to the active conversation

Read `_onSignalingMessage` in ratchet_provider.dart carefully. Incoming messages with `type: "message"` and `from: "testbot"` need to map to the correct conversation.

### Step 5: Once working
- Remove all [DEBUG] ChatMessage lines from ratchet_provider.dart
- Build clean TestFlight
- Celebrate: first PQC-encrypted real-time message exchange on iOS

---

## Priority 2: UX Polish Sprint (after messaging works)

Plan file: .claude/plans/graceful-snuggling-pebble.md

Use /hive-mind-advanced with 4 parallel agents:

### Agent 1: Privacy eyes verification
Test on device: anonymizer hidden-by-default, L10 warning, before/after hidden

### Agent 2: Q-Mesh + VoIP
Test body silhouettes render, sensor network displays.
Wire VoIP to signaling server for real call setup.

### Agent 3: Self-destruct + VPN
Wire self-destruct timer to actual data deletion (messages, call logs).
Wire VPN location rotation (simulated location changes).

### Agent 4: Overall polish
- Remove demo auto-replies when signaling is connected
- Browser: verify PQC always on, zipminator.zip default
- Every screen: consistent badges, intuitive without explanation
- Build TestFlight after each major fix

---

## Quality Gate

- [ ] Real message sent AND reply received on iPhone
- [ ] flutter analyze: 0 errors
- [ ] flutter test: all pass
- [ ] TestFlight build succeeds
- [ ] Each pillar: "Would a Signal user understand this?" = YES
- [ ] No debug messages in production code
- [ ] No demo auto-replies when Live badge is green

## Slash Commands
- `/go` — session startup (reads CLAUDE.md, checks git, runs tests)
- `/simplify` — review code quality after each change
- `/ralph-loop N=8` — iterate until messaging works
- `/batch-tdd` — parallel testing across Rust/Python/Flutter
- `/verification-quality` — truth scoring before TestFlight build
- `/hive-mind-advanced` — parallel agents for UX sprint
```
