//! Topological Mesh Authentication: derives network keys from mesh topology.
//!
//! The network key incorporates the graph structure of the mesh, not just
//! individual node identities. When topology changes (node added/removed),
//! the network key changes, forcing re-authentication. Stable across node
//! restarts as long as topology remains the same.
//!
//! Inspired by topological invariants (Architecture #8, Physical Cryptography plan).

use std::collections::BTreeMap;

use hkdf::Hkdf;
use petgraph::graph::UnGraph;
use sha2::{Digest, Sha256};
use crate::mesh_key::MeshKey;

/// HKDF info string for topology key derivation.
const HKDF_INFO_TOPOLOGY: &[u8] = b"zipminator-topology-key-v1";

/// Errors from topology authentication operations.
#[derive(Debug, thiserror::Error)]
pub enum TopologyError {
    /// Insufficient nodes for key derivation.
    #[error("insufficient nodes: need at least {needed}, got {got}")]
    InsufficientNodes { needed: usize, got: usize },

    /// Key derivation failure.
    #[error("key derivation failed")]
    KeyDerivationFailed,

    /// Duplicate node ID in the topology.
    #[error("duplicate node ID: {0}")]
    DuplicateNode(String),
}

/// Unique identifier for a mesh node.
pub type NodeId = [u8; 16];

/// Quality metric for a link between two nodes.
#[derive(Debug, Clone, Copy)]
pub struct LinkQuality {
    /// Signal strength indicator (0.0-1.0).
    pub signal_strength: f32,
    /// Packet loss ratio (0.0-1.0, lower is better).
    pub packet_loss: f32,
}

impl Default for LinkQuality {
    fn default() -> Self {
        Self {
            signal_strength: 1.0,
            packet_loss: 0.0,
        }
    }
}

/// Mesh topology graph with nodes, edges, and link quality metrics.
impl Default for MeshTopology {
    fn default() -> Self {
        Self::new()
    }
}

pub struct MeshTopology {
    /// Internal graph representation.
    graph: UnGraph<NodeId, LinkQuality>,
    /// Map from NodeId to graph index for fast lookup.
    node_indices: BTreeMap<NodeId, petgraph::graph::NodeIndex>,
}

impl MeshTopology {
    /// Create an empty topology.
    pub fn new() -> Self {
        Self {
            graph: UnGraph::new_undirected(),
            node_indices: BTreeMap::new(),
        }
    }

    /// Add a node to the topology.
    pub fn add_node(&mut self, id: NodeId) -> Result<(), TopologyError> {
        if self.node_indices.contains_key(&id) {
            return Err(TopologyError::DuplicateNode(hex::encode(id)));
        }
        let idx = self.graph.add_node(id);
        self.node_indices.insert(id, idx);
        Ok(())
    }

    /// Add an edge (link) between two nodes.
    pub fn add_edge(
        &mut self,
        a: &NodeId,
        b: &NodeId,
        quality: LinkQuality,
    ) -> Result<(), TopologyError> {
        let idx_a = self.node_indices.get(a).ok_or_else(|| {
            TopologyError::DuplicateNode(format!("node not found: {}", hex::encode(a)))
        })?;
        let idx_b = self.node_indices.get(b).ok_or_else(|| {
            TopologyError::DuplicateNode(format!("node not found: {}", hex::encode(b)))
        })?;
        self.graph.add_edge(*idx_a, *idx_b, quality);
        Ok(())
    }

    /// Number of nodes in the topology.
    pub fn node_count(&self) -> usize {
        self.graph.node_count()
    }

    /// Number of edges in the topology.
    pub fn edge_count(&self) -> usize {
        self.graph.edge_count()
    }

    /// Compute a topology fingerprint using graph invariants.
    ///
    /// The fingerprint is a SHA-256 hash of:
    /// - Sorted node IDs
    /// - Node degree sequence (sorted)
    /// - Edge count
    /// - Connected component count
    ///
    /// This is stable across node restarts and ordering changes,
    /// but changes when topology changes.
    pub fn topology_fingerprint(&self) -> [u8; 32] {
        let mut hasher = Sha256::new();

        // 1. Node count
        hasher.update((self.graph.node_count() as u64).to_le_bytes());

        // 2. Edge count
        hasher.update((self.graph.edge_count() as u64).to_le_bytes());

        // 3. Sorted node IDs (deterministic ordering via BTreeMap)
        for node_id in self.node_indices.keys() {
            hasher.update(node_id);
        }

        // 4. Degree sequence (sorted for graph invariance)
        let mut degrees: Vec<usize> = self
            .node_indices
            .values()
            .map(|idx| self.graph.edges(*idx).count())
            .collect();
        degrees.sort();
        for d in &degrees {
            hasher.update((*d as u64).to_le_bytes());
        }

        // 5. Connected components
        let components = petgraph::algo::connected_components(&self.graph);
        hasher.update((components as u64).to_le_bytes());

        let result = hasher.finalize();
        let mut fingerprint = [0u8; 32];
        fingerprint.copy_from_slice(&result);
        fingerprint
    }

    /// Derive a network key that incorporates both node keys and topology.
    ///
    /// Same node keys + different topology = different network key.
    /// Same topology + different node keys = different network key.
    pub fn derive_topology_key(
        &self,
        node_keys: &[(NodeId, MeshKey)],
        salt: &[u8],
    ) -> Result<MeshKey, TopologyError> {
        if self.node_count() < 2 {
            return Err(TopologyError::InsufficientNodes {
                needed: 2,
                got: self.node_count(),
            });
        }

        // Build IKM from topology fingerprint + sorted node key material
        let mut ikm = Vec::new();

        // Include topology fingerprint
        ikm.extend_from_slice(&self.topology_fingerprint());

        // Include node keys in deterministic order (sorted by NodeId)
        let mut sorted_keys: Vec<_> = node_keys.to_vec();
        sorted_keys.sort_by_key(|(id, _)| *id);
        for (node_id, key) in &sorted_keys {
            ikm.extend_from_slice(node_id);
            ikm.extend_from_slice(key.as_bytes());
        }

        // HKDF derive
        let hk = Hkdf::<Sha256>::new(Some(salt), &ikm);
        let mut okm = [0u8; 16];
        hk.expand(HKDF_INFO_TOPOLOGY, &mut okm)
            .map_err(|_| TopologyError::KeyDerivationFailed)?;

        MeshKey::from_bytes(&okm).ok_or(TopologyError::KeyDerivationFailed)
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    fn make_node_id(seed: u8) -> NodeId {
        let mut id = [0u8; 16];
        id[0] = seed;
        id[15] = seed;
        id
    }

    fn make_mesh_key(seed: u8) -> MeshKey {
        MeshKey::from_bytes(&[seed; 16]).unwrap()
    }

    fn build_triangle() -> (MeshTopology, NodeId, NodeId, NodeId) {
        let mut topo = MeshTopology::new();
        let a = make_node_id(1);
        let b = make_node_id(2);
        let c = make_node_id(3);
        topo.add_node(a).unwrap();
        topo.add_node(b).unwrap();
        topo.add_node(c).unwrap();
        topo.add_edge(&a, &b, LinkQuality::default()).unwrap();
        topo.add_edge(&b, &c, LinkQuality::default()).unwrap();
        topo.add_edge(&a, &c, LinkQuality::default()).unwrap();
        (topo, a, b, c)
    }

    #[test]
    fn test_add_nodes_and_edges() {
        let (topo, _, _, _) = build_triangle();
        assert_eq!(topo.node_count(), 3);
        assert_eq!(topo.edge_count(), 3);
    }

    #[test]
    fn test_duplicate_node_rejected() {
        let mut topo = MeshTopology::new();
        let a = make_node_id(1);
        topo.add_node(a).unwrap();
        assert!(topo.add_node(a).is_err());
    }

    #[test]
    fn test_fingerprint_deterministic() {
        let (topo1, _, _, _) = build_triangle();
        let (topo2, _, _, _) = build_triangle();
        assert_eq!(
            topo1.topology_fingerprint(),
            topo2.topology_fingerprint(),
            "same topology must produce same fingerprint"
        );
    }

    #[test]
    fn test_fingerprint_changes_on_topology_change() {
        let (topo1, _, _, _) = build_triangle();

        // Build a line instead of triangle
        let mut topo2 = MeshTopology::new();
        let a = make_node_id(1);
        let b = make_node_id(2);
        let c = make_node_id(3);
        topo2.add_node(a).unwrap();
        topo2.add_node(b).unwrap();
        topo2.add_node(c).unwrap();
        topo2.add_edge(&a, &b, LinkQuality::default()).unwrap();
        topo2.add_edge(&b, &c, LinkQuality::default()).unwrap();
        // No a-c edge

        assert_ne!(
            topo1.topology_fingerprint(),
            topo2.topology_fingerprint(),
            "different topology must produce different fingerprint"
        );
    }

    #[test]
    fn test_fingerprint_changes_on_node_addition() {
        let (topo1, _, _, _) = build_triangle();

        let mut topo2 = MeshTopology::new();
        let a = make_node_id(1);
        let b = make_node_id(2);
        let c = make_node_id(3);
        let d = make_node_id(4);
        topo2.add_node(a).unwrap();
        topo2.add_node(b).unwrap();
        topo2.add_node(c).unwrap();
        topo2.add_node(d).unwrap();
        topo2.add_edge(&a, &b, LinkQuality::default()).unwrap();
        topo2.add_edge(&b, &c, LinkQuality::default()).unwrap();
        topo2.add_edge(&a, &c, LinkQuality::default()).unwrap();

        assert_ne!(topo1.topology_fingerprint(), topo2.topology_fingerprint());
    }

    #[test]
    fn test_derive_topology_key() {
        let (topo, a, b, c) = build_triangle();
        let node_keys = vec![
            (a, make_mesh_key(0x11)),
            (b, make_mesh_key(0x22)),
            (c, make_mesh_key(0x33)),
        ];

        let key = topo.derive_topology_key(&node_keys, b"test-salt").unwrap();
        assert!(!key.is_zero());
    }

    #[test]
    fn test_topology_key_deterministic() {
        let (topo1, a, b, c) = build_triangle();
        let (topo2, a2, b2, c2) = build_triangle();

        let keys1 = vec![(a, make_mesh_key(0x11)), (b, make_mesh_key(0x22)), (c, make_mesh_key(0x33))];
        let keys2 = vec![(a2, make_mesh_key(0x11)), (b2, make_mesh_key(0x22)), (c2, make_mesh_key(0x33))];

        let k1 = topo1.derive_topology_key(&keys1, b"salt").unwrap();
        let k2 = topo2.derive_topology_key(&keys2, b"salt").unwrap();
        assert_eq!(k1, k2, "same topology + keys + salt must produce same key");
    }

    #[test]
    fn test_different_topology_different_key() {
        let (topo1, a1, b1, c1) = build_triangle();
        let keys1 = vec![
            (a1, make_mesh_key(0x11)),
            (b1, make_mesh_key(0x22)),
            (c1, make_mesh_key(0x33)),
        ];

        // Line topology
        let mut topo2 = MeshTopology::new();
        let a = make_node_id(1);
        let b = make_node_id(2);
        let c = make_node_id(3);
        topo2.add_node(a).unwrap();
        topo2.add_node(b).unwrap();
        topo2.add_node(c).unwrap();
        topo2.add_edge(&a, &b, LinkQuality::default()).unwrap();
        topo2.add_edge(&b, &c, LinkQuality::default()).unwrap();

        let keys2 = vec![
            (a, make_mesh_key(0x11)),
            (b, make_mesh_key(0x22)),
            (c, make_mesh_key(0x33)),
        ];

        let k1 = topo1.derive_topology_key(&keys1, b"salt").unwrap();
        let k2 = topo2.derive_topology_key(&keys2, b"salt").unwrap();
        assert_ne!(k1, k2, "different topology must produce different key");
    }

    #[test]
    fn test_insufficient_nodes() {
        let mut topo = MeshTopology::new();
        topo.add_node(make_node_id(1)).unwrap();
        let keys = vec![(make_node_id(1), make_mesh_key(0x11))];
        let result = topo.derive_topology_key(&keys, b"salt");
        assert!(result.is_err());
    }
}
