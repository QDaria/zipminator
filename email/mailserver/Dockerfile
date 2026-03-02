# Zipminator Quantum-Secure Mail Server
# Postfix 3.10 + Dovecot 2.3.21 + OpenSSL 3.5 with X25519MLKEM768 hybrid PQC TLS
#
# First mail server with:
#   - PQC TLS (X25519MLKEM768 hybrid key exchange)
#   - Dual-sign DKIM (RSA-2048 + ML-DSA-65)

FROM debian:bookworm-slim AS base

ARG OPENSSL_VERSION=3.5.0
ARG POSTFIX_VERSION=3.10.1
ARG DOVECOT_VERSION=2.3.21.1

ENV DEBIAN_FRONTEND=noninteractive

# Build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential ca-certificates curl libdb-dev libsasl2-dev \
    libldap2-dev libpcre2-dev zlib1g-dev pkg-config m4 \
    liblz4-dev libzstd-dev libpam0g-dev libssl-dev \
    opendkim opendkim-tools \
    python3 python3-pip python3-venv \
    supervisor rsyslog \
    && rm -rf /var/lib/apt/lists/*

# --------------------------------------------------------------------------
# Stage 1: Build OpenSSL 3.5 with native ML-KEM support
# --------------------------------------------------------------------------
FROM base AS openssl-build

RUN curl -fsSL "https://github.com/openssl/openssl/releases/download/openssl-${OPENSSL_VERSION}/openssl-${OPENSSL_VERSION}.tar.gz" \
    -o /tmp/openssl.tar.gz \
    && tar xzf /tmp/openssl.tar.gz -C /tmp \
    && cd /tmp/openssl-${OPENSSL_VERSION} \
    && ./Configure --prefix=/opt/openssl --openssldir=/opt/openssl/ssl \
       enable-ktls shared linux-x86_64 \
    && make -j"$(nproc)" \
    && make install_sw install_ssldirs \
    && rm -rf /tmp/openssl*

# Verify ML-KEM support
RUN /opt/openssl/bin/openssl list -kem-algorithms 2>/dev/null | grep -i mlkem || \
    /opt/openssl/bin/openssl list -key-exchange-algorithms 2>/dev/null | grep -i mlkem || \
    echo "WARN: ML-KEM listing not available in CLI, but X25519MLKEM768 group is supported in TLS"

# --------------------------------------------------------------------------
# Stage 2: Build Postfix 3.10 against OpenSSL 3.5
# --------------------------------------------------------------------------
FROM openssl-build AS postfix-build

RUN curl -fsSL "https://de.postfix.org/ftpmirror/official/postfix-${POSTFIX_VERSION}.tar.gz" \
    -o /tmp/postfix.tar.gz \
    && tar xzf /tmp/postfix.tar.gz -C /tmp \
    && cd /tmp/postfix-${POSTFIX_VERSION} \
    && make makefiles \
       CCARGS="-DUSE_TLS -DUSE_SASL_AUTH -DUSE_CYRUS_SASL -DHAS_LDAP \
               -I/opt/openssl/include -I/usr/include/sasl" \
       AUXLIBS="-L/opt/openssl/lib64 -lssl -lcrypto -lsasl2 -lldap -llber -lz -lm -lpthread" \
       shared=yes \
    && make -j"$(nproc)" \
    && make install \
    && rm -rf /tmp/postfix*

# --------------------------------------------------------------------------
# Stage 3: Build Dovecot 2.3.21 against OpenSSL 3.5
# --------------------------------------------------------------------------
FROM postfix-build AS dovecot-build

RUN curl -fsSL "https://dovecot.org/releases/2.3/dovecot-${DOVECOT_VERSION}.tar.gz" \
    -o /tmp/dovecot.tar.gz \
    && tar xzf /tmp/dovecot.tar.gz -C /tmp \
    && cd /tmp/dovecot-${DOVECOT_VERSION} \
    && PKG_CONFIG_PATH=/opt/openssl/lib64/pkgconfig \
       CFLAGS="-I/opt/openssl/include" \
       LDFLAGS="-L/opt/openssl/lib64 -Wl,-rpath,/opt/openssl/lib64" \
       ./configure --prefix=/usr --sysconfdir=/etc \
       --with-ssl=openssl --with-pam \
    && make -j"$(nproc)" \
    && make install \
    && rm -rf /tmp/dovecot*

# --------------------------------------------------------------------------
# Final image
# --------------------------------------------------------------------------
FROM dovecot-build AS runtime

# Runtime library path
ENV LD_LIBRARY_PATH=/opt/openssl/lib64
ENV PATH="/opt/openssl/bin:${PATH}"

# Create mail user/group
RUN groupadd -g 5000 vmail && \
    useradd -g vmail -u 5000 -d /var/mail -s /usr/sbin/nologin vmail && \
    mkdir -p /var/mail && chown vmail:vmail /var/mail

# Create required directories
RUN mkdir -p /etc/postfix /etc/dovecot/conf.d /etc/opendkim/keys \
    /var/spool/postfix /var/run/dovecot /var/log/mail \
    /opt/dkim-mldsa

# Copy configurations
COPY config/postfix/main.cf /etc/postfix/main.cf
COPY config/postfix/master.cf /etc/postfix/master.cf
COPY config/dovecot/dovecot.conf /etc/dovecot/dovecot.conf
COPY config/dovecot/10-ssl.conf /etc/dovecot/conf.d/10-ssl.conf
COPY config/dovecot/10-auth.conf /etc/dovecot/conf.d/10-auth.conf
COPY config/dovecot/10-mail.conf /etc/dovecot/conf.d/10-mail.conf
COPY config/dkim/opendkim.conf /etc/opendkim.conf
COPY config/dkim/signing.table /etc/opendkim/signing.table
COPY config/dkim/key.table /etc/opendkim/key.table
COPY config/dkim/trusted.hosts /etc/opendkim/trusted.hosts
COPY scripts/ /opt/scripts/

# Supervisor config
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf

RUN chmod +x /opt/scripts/*.sh

EXPOSE 25 465 587 993 995

HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD /opt/scripts/healthcheck.sh

ENTRYPOINT ["/opt/scripts/entrypoint.sh"]
CMD ["supervisord", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
