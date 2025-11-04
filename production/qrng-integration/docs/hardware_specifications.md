# QRNG Hardware Specifications for Zipminator Production

## Executive Summary

This document specifies the hardware QRNG devices selected for Zipminator production deployment, providing certified quantum entropy sources for NIST PQC standards implementation (FIPS 203/ML-KEM and FIPS 204/ML-DSA).

## Primary Device: ID Quantique Quantis QRNG USB

### Specifications
- **Model**: Quantis QRNG USB (IDQ250C2 variant)
- **Form Factor**: USB Device (plug-and-play)
- **Throughput**: 4 Mbps (500 KB/s)
- **Entropy Source**: Quantum optical process (photon detection)
- **Interface**: USB 2.0/3.0 compatible
- **Power**: Bus-powered via USB
- **Operating Temperature**: 0°C to 70°C

### Certifications
- **NIST SP 800-90B**: Validated entropy source
- **METAS**: Swiss Federal Institute of Metrology certification
- **CTL**: Common Criteria Testing Laboratory approval

### Performance Analysis
- **Kyber-768 Requirements**: ~1 KB per operation (KeyGen + Encaps)
- **Device Capacity**: 500 KB/s = 500 operations/second
- **Typical Usage**: 10-50 operations/second
- **Overhead**: <10^-5 latency impact (negligible)
- **Margin**: 10-50x overcapacity for production loads

### Use Cases
- Desktop applications
- IoT devices with USB interface
- Development and testing environments
- Edge computing nodes
- Small to medium-scale deployments

## Secondary Device: ID Quantique Quantis QRNG PCIe

### Specifications
- **Model**: Quantis QRNG PCIe
- **Form Factor**: PCIe x1 card
- **Throughput**:
  - Standard: 40 Mbps (5 MB/s)
  - High-performance: 240 Mbps (30 MB/s)
- **Entropy Source**: Quantum optical process
- **Interface**: PCIe Gen 2 x1
- **Power**: PCIe bus-powered
- **Operating Temperature**: 0°C to 70°C

### Certifications
- **NIST SP 800-90B**: Validated entropy source
- **BSI AIS 31**: German Federal Office certification (PTG.3)
- **METAS**: Swiss metrology certification
- **CTL**: Common Criteria approval

### Performance Analysis
- **Capacity**: 5,000-30,000 operations/second
- **Server Deployment**: Handles 100+ concurrent TLS connections
- **Batch Processing**: Efficient for bulk key generation
- **Latency**: Sub-millisecond response time

### Use Cases
- Server deployments
- Data centers
- High-throughput applications
- Cloud infrastructure
- Enterprise key management systems
- HSM (Hardware Security Module) integration

## Embedded Option: ID Quantique IDQ20MC1

### Specifications
- **Model**: IDQ20MC1 Chip
- **Form Factor**: Surface-mount chip (embedded)
- **Throughput**: 20 Mbps (2.5 MB/s)
- **Entropy Source**: Quantum optical process
- **Interface**: SPI or I2C
- **Power**: Low-power (<100 mW)
- **Operating Temperature**: -40°C to +125°C (automotive-grade)

### Certifications
- **NIST SP 800-90B**: Validated entropy source
- **BSI AIS 31**: PTG.3 certification
- **AEC-Q100**: Automotive electronics qualification

### Performance Analysis
- **Capacity**: 2,500 operations/second
- **Power Efficiency**: Optimal for battery-powered devices
- **Integration**: Direct SoC/MCU integration

### Use Cases
- Embedded systems
- Automotive applications (V2X, secure boot)
- Industrial IoT
- Mobile devices
- Custom hardware platforms

## Health Monitoring Features

All ID Quantique QRNG devices include:

1. **Real-time Health Checks**
   - Continuous statistical testing (NIST SP 800-90B tests)
   - Entropy source monitoring
   - Failure detection within milliseconds

2. **Tamper Detection**
   - Physical tampering alerts
   - Environmental monitoring
   - Power supply anomaly detection

3. **Automatic Failsafe**
   - Stops output on failure detection
   - Error signaling to host system
   - Diagnostic information reporting

4. **Quality Assurance**
   - Min-entropy rate verification
   - Output distribution validation
   - Long-term drift monitoring

## Compliance and Regulatory Status

### NIST SP 800-90B
- Entropy source validation
- Min-entropy assessment
- Approved for FIPS 140-3 modules

### BSI AIS 31 PTG.3
- Highest functional security class
- Physical and mathematical quality criteria
- Online testing requirements met

### FIPS 140-3 Integration
- Validated entropy source for FIPS modules
- Meets requirements for ML-KEM and ML-DSA implementations
- Compatible with CAVP (Cryptographic Algorithm Validation Program)

## Supply Chain and Availability

### Vendor Information
- **Manufacturer**: ID Quantique SA (Geneva, Switzerland)
- **Established**: 2001 (20+ years quantum technology experience)
- **Market Position**: Leading commercial QRNG vendor
- **Geographic Coverage**: Worldwide distribution

### Procurement
- **Lead Time**:
  - USB devices: 2-4 weeks
  - PCIe cards: 4-6 weeks
  - Chip components: 8-12 weeks
- **Volume Pricing**: Available for 100+ units
- **Support**: Technical support and integration assistance
- **Warranty**: 2-year standard warranty

### Alternative Vendors (Risk Mitigation)
- **Quintessence Labs**: QRNG solutions (Australia)
- **Quantum eMotion**: Quantum entropy chip (Canada)
- **Whitewood**: Entropy-as-a-Service (USA)

## Cost Analysis

### Bill of Materials (BOM) Impact
- **USB Device**: $1,200-$1,500 per unit (list price)
- **PCIe Card**: $3,500-$5,000 per unit (varies by throughput)
- **Chip Component**: $200-$400 per unit (volume pricing)

### Target Market Justification
- **High-Assurance Markets**: Cost justified by security requirements
- **CNSA 2.0 Compliance**: Regulatory mandate overrides cost sensitivity
- **Competitive Advantage**: Only integrated QRNG+PQC solution
- **TCO Benefit**: Reduced vulnerability remediation costs

### Volume Discount Estimates
- 100-500 units: 15-20% discount
- 500-1000 units: 25-30% discount
- 1000+ units: Negotiable (OEM partnership)

## Integration Recommendations

### Desktop/Edge Deployments
- **Primary**: Quantis USB
- **Rationale**: Plug-and-play, sufficient throughput, certified
- **Cost**: Moderate upfront, no infrastructure changes

### Server/Data Center Deployments
- **Primary**: Quantis PCIe (240 Mbps variant)
- **Rationale**: High throughput, direct PCIe integration, scalable
- **Cost**: Higher upfront, lowest per-operation cost

### Embedded/Custom Hardware
- **Primary**: IDQ20MC1 chip
- **Rationale**: Automotive-grade, power-efficient, smallest footprint
- **Cost**: Lowest per-unit, requires custom PCB design

### Development and Testing
- **Primary**: Quantis USB
- **Rationale**: Easy development integration, portable
- **Cost**: Single unit purchase acceptable

## Technical Support and Resources

### Documentation
- Hardware datasheets
- Integration guides
- API documentation
- Certification documents

### Software Support
- Linux kernel drivers (mainline)
- Windows drivers (certified)
- SDK for C/C++, Python, Java
- OpenSSL integration examples

### Training and Professional Services
- Integration consulting
- Performance optimization
- Certification assistance
- Custom firmware development

## Conclusion

The ID Quantique Quantis product line provides mature, certified, production-ready QRNG hardware suitable for all Zipminator deployment scenarios. The USB variant is recommended as the primary device for initial market entry due to its balance of performance, certification, cost, and ease of integration. The architecture supports seamless scaling to higher-performance PCIe devices for server deployments and embedded chips for custom hardware without software changes.

## References

1. ID Quantique Product Specifications: https://www.idquantique.com/random-number-generation/
2. NIST SP 800-90B: https://csrc.nist.gov/publications/detail/sp/800-90b/final
3. BSI AIS 31: https://www.bsi.bund.de/EN/Topics/ElectrSignature/Accreditation/accreditation_node.html
4. QSNP QRNG+PQC Integration Study (2024)
5. QDaria Zipminator Validation Report (2025)
