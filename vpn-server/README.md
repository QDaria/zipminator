# Zipminator Q-VPN Server

StrongSwan IKEv2 server matching the Flutter app's NEVPNManager configuration.

## Client Parameters (from AppDelegate.swift)

| Parameter | Value |
|-----------|-------|
| Protocol | IKEv2 |
| IKE encryption | AES-256-GCM |
| IKE DH group | 20 (ECP-384 / secp384r1) |
| IKE integrity | SHA-384 |
| ESP encryption | AES-256-GCM |
| ESP DH group | 20 (ECP-384) |
| ESP integrity | SHA-384 |
| Auth method | EAP-MSCHAPv2 (shared secret + extended auth) |
| Server identity | `vpn.zipminator.zip` |
| Client identity | `zipminator-user` |
| VPN subnet | `10.14.0.0/24` |

## Quick Start (Local Docker)

```bash
chmod +x deploy.sh
./deploy.sh local
```

This builds the container and runs it with `NET_ADMIN` capabilities. The default
test credentials are `zipminator:localtest123`.

Verify it's running:

```bash
docker logs zipminator-vpn
# Should show "Starting StrongSwan IKEv2..." and charon startup
```

Stop:

```bash
./deploy.sh local-stop
```

## Deploy to Fly.io

```bash
./deploy.sh fly
```

The script handles:

1. Creating the app if it does not exist
2. Allocating a dedicated IPv4 (required for UDP)
3. Prompting for VPN credentials (stored as Fly.io secrets)
4. Deploying the container

After deployment, point `vpn.zipminator.zip` DNS to the allocated IPv4 address.

### Fly.io Limitations and Alternatives

Fly.io supports UDP services and works for IKEv2, but has constraints:

| Concern | Status |
|---------|--------|
| UDP ports 500/4500 | Supported via `[[services]]` with `protocol = "udp"` |
| Dedicated IPv4 | Required; `fly ips allocate-v4` ($2/mo) |
| `NET_ADMIN` capability | Granted by default |
| `sysctl` (ip_forward) | May fail silently; entrypoint handles gracefully |
| ESP (IP protocol 50) | Works through NAT-T (UDP 4500) encapsulation |

If Fly.io proves unreliable for IPsec, these alternatives work well:

| Provider | Monthly Cost | Notes |
|----------|-------------|-------|
| **Hetzner Cloud** (CX22) | ~4 EUR | Full root, dedicated IPv4, Nuremberg/Helsinki |
| **DigitalOcean** (basic droplet) | $6 | Full root, Amsterdam/Frankfurt available |
| **Vultr** (Cloud Compute) | $6 | Full root, 32 global locations |
| **Oracle Cloud** (free tier) | $0 | ARM instance, always-free, Amsterdam |

For any VPS alternative, deploy with:

```bash
# On the VPS:
apt install -y docker.io
git clone <repo> && cd zipminator/vpn-server
docker build -t zipminator-vpn .
docker run -d --name zipminator-vpn \
    --cap-add NET_ADMIN --cap-add NET_RAW \
    --sysctl net.ipv4.ip_forward=1 \
    -p 500:500/udp -p 4500:4500/udp \
    -e VPN_SERVER_ID="vpn.zipminator.zip" \
    -e VPN_USERS="zipminator:YourSecurePassword" \
    zipminator-vpn
```

## Production Checklist

- [ ] Replace self-signed certs with Let's Encrypt or CA-signed certs
- [ ] Set strong passwords via `VPN_USERS` env var (never use defaults)
- [ ] Point DNS `vpn.zipminator.zip` to server IPv4
- [ ] Test from iOS/macOS Flutter app with real server address
- [ ] Set up monitoring (StrongSwan logs via `ipsec statusall`)
- [ ] Configure firewall to only allow UDP 500/4500 inbound
- [ ] For multi-region: deploy one server per region, use DNS-based routing

## Architecture

```
Flutter App (iOS/macOS)              VPN Server (StrongSwan)
========================             ========================
NEVPNProtocolIKEv2                   ipsec.conf
  serverAddress ──────────────────>  left=%any, leftid=vpn.zipminator.zip
  .algorithmAES256GCM ────────────>  ike=aes256gcm16-sha384-ecp384!
  .group20 (ECP-384) ────────────>   esp=aes256gcm16-sha384-ecp384!
  .SHA384 ────────────────────────>  (included in gcm16 + sha384)
  useExtendedAuthentication ──────>  rightauth=eap-mschapv2
  username: "zipminator" ────────>   zipminator : EAP "password"
  authenticationMethod: .sharedSecret  leftauth=pubkey (cert-based on server)
                                     
  NEVPNManager tunnel ◀──── UDP 500/4500 ────▶ charon IKE daemon
                                     
  Virtual IP: 10.14.0.x ◀── rightsourceip=10.14.0.0/24
  DNS: 1.1.1.1 ◀──────────── rightdns=1.1.1.1,8.8.8.8
```

## File Structure

```
vpn-server/
  Dockerfile           # Alpine + StrongSwan
  entrypoint.sh        # Cert generation, credential loading, NAT, start
  fly.toml             # Fly.io deployment config (UDP services)
  deploy.sh            # One-command deploy (fly or local)
  README.md            # This file
  config/
    ipsec.conf         # IKEv2 connection definition
    ipsec.secrets      # Credentials placeholder (overwritten at startup)
    strongswan.conf    # Global charon settings
    charon/
      eap-mschapv2.conf  # EAP-MSCHAPv2 plugin
      eap-identity.conf  # EAP-Identity plugin
```

## Client Certificate Trust

The server generates a self-signed CA at first boot. For the Flutter client to
trust it, you have two options:

1. **Install the CA cert on the device** (development): Export
   `/etc/ipsec.d/cacerts/ca-cert.pem` from the container and install it as a
   trusted root on your Mac/iPhone.

2. **Use a real CA** (production): Get a certificate from Let's Encrypt or
   another CA for `vpn.zipminator.zip` and mount it into the container.

For iOS/macOS, `NEVPNProtocolIKEv2` with `authenticationMethod = .sharedSecret`
falls back to PSK-based auth when the server cert is not trusted. The current
Flutter code sets `sharedSecretReference = nil` (placeholder), so the full
cert-based flow needs the Keychain integration documented in the iOS bridge.

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VPN_SERVER_ID` | `vpn.zipminator.zip` | Server identity (CN and SAN in cert) |
| `VPN_USERS` | (none) | Comma-separated `user:pass` pairs for EAP auth |
| `VPN_DEFAULT_PASSWORD` | `changeme-in-production` | Fallback password if `VPN_USERS` is not set |
