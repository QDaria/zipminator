FROM alpine:3.20

LABEL maintainer="mo@qdaria.com"
LABEL description="Zipminator Q-VPN Server (StrongSwan IKEv2)"

# Install StrongSwan and dependencies
RUN apk add --no-cache \
    strongswan \
    openssl \
    iptables \
    ip6tables \
    bash \
    curl \
    && rm -rf /var/cache/apk/*

# Copy configuration files
COPY config/ipsec.conf /etc/ipsec.conf
COPY config/ipsec.secrets /etc/ipsec.secrets
COPY config/strongswan.conf /etc/strongswan.conf
COPY config/charon/ /etc/strongswan.d/charon/
COPY entrypoint.sh /entrypoint.sh

RUN chmod +x /entrypoint.sh \
    && chmod 600 /etc/ipsec.secrets

# IKEv2 requires UDP 500 (IKE) and UDP 4500 (NAT-T)
EXPOSE 500/udp 4500/udp

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
    CMD ipsec statusall 2>/dev/null | grep -q "Security Associations" || ipsec status > /dev/null 2>&1

ENTRYPOINT ["/entrypoint.sh"]
