"""
Heterogeneous Graph Transformer (HGT) Model for Fraud Detection
Implements node-type-specific and relation-type-specific attention mechanisms
"""
import torch
import torch.nn as nn
import torch.nn.functional as F
from torch import Tensor
from typing import Dict, Tuple, Optional, List
import numpy as np


class HGTConv(nn.Module):
    """
    Heterogeneous Graph Transformer Convolution Layer
    
    Implements type-specific transformations and attention mechanisms
    for heterogeneous graphs with multiple node and edge types.
    """
    
    def __init__(
        self,
        in_channels: int,
        out_channels: int,
        metadata: Tuple[List[str], List[Tuple[str, str, str]]],
        heads: int = 4,
        dropout: float = 0.3
    ):
        super().__init__()
        
        self.in_channels = in_channels
        self.out_channels = out_channels
        self.heads = heads
        self.dropout = dropout
        
        # Parse metadata
        self.node_types = metadata[0]
        self.edge_types = metadata[1]
        
        # Type-specific linear projections for Q, K, V
        self.q_linears = nn.ModuleDict({
            node_type: nn.Linear(in_channels, out_channels * heads)
            for node_type in self.node_types
        })
        
        self.k_linears = nn.ModuleDict()
        self.v_linears = nn.ModuleDict()
        
        for edge_type in self.edge_types:
            src_type, _, dst_type = edge_type
            # Key projection for source node type
            key = f"{src_type}__{dst_type}"
            if key not in self.k_linears:
                self.k_linears[key] = nn.Linear(in_channels, out_channels * heads)
            # Value projection for destination node type
            if key not in self.v_linears:
                self.v_linears[key] = nn.Linear(in_channels, out_channels * heads)
        
        # Type-specific output projections
        self.out_linears = nn.ModuleDict({
            node_type: nn.Linear(out_channels * heads, out_channels)
            for node_type in self.node_types
        })
        
        # Skip connection projections
        self.skip_linears = nn.ModuleDict({
            node_type: nn.Linear(in_channels, out_channels)
            for node_type in self.node_types
        })
        
        # Layer normalization
        self.layer_norms = nn.ModuleDict({
            node_type: nn.LayerNorm(out_channels)
            for node_type in self.node_types
        })
        
        # Attention scaling
        self.scale = out_channels ** -0.5
        
        self.reset_parameters()
    
    def reset_parameters(self):
        """Initialize parameters"""
        for linear in self.q_linears.values():
            nn.init.xavier_uniform_(linear.weight)
            nn.init.zeros_(linear.bias)
        for linear in self.k_linears.values():
            nn.init.xavier_uniform_(linear.weight)
            nn.init.zeros_(linear.bias)
        for linear in self.v_linears.values():
            nn.init.xavier_uniform_(linear.weight)
            nn.init.zeros_(linear.bias)
        for linear in self.out_linears.values():
            nn.init.xavier_uniform_(linear.weight)
            nn.init.zeros_(linear.bias)
    
    def forward(
        self,
        x_dict: Dict[str, Tensor],
        edge_index_dict: Dict[Tuple[str, str, str], Tensor]
    ) -> Dict[str, Tensor]:
        """
        Forward pass through HGT layer
        
        Args:
            x_dict: Dictionary mapping node types to feature tensors
            edge_index_dict: Dictionary mapping edge types to edge indices
        
        Returns:
            Dictionary of updated node embeddings
        """
        out_dict = {}
        
        # Process each node type
        for dst_type in self.node_types:
            # Collect messages from all edge types pointing to this node type
            messages = []
            
            for edge_type in self.edge_types:
                src_type, rel_type, dt = edge_type
                
                if dt != dst_type:
                    continue
                
                if edge_type not in edge_index_dict:
                    continue
                
                edge_index = edge_index_dict[edge_type]
                src_x = x_dict[src_type]
                
                # Get number of nodes
                num_dst = x_dict[dst_type].size(0)
                
                # Compute Q for destination nodes
                Q = self.q_linears[dst_type](x_dict[dst_type])
                Q = Q.view(-1, self.heads, self.out_channels)
                
                # Compute K and V for source nodes
                key = f"{src_type}__{dst_type}"
                K = self.k_linears[key](src_x)
                K = K.view(-1, self.heads, self.out_channels)
                
                V = self.v_linears[key](src_x)
                V = V.view(-1, self.heads, self.out_channels)
                
                # Compute attention for each destination node
                # Aggregate source features
                src_idx = edge_index[0]
                dst_idx = edge_index[1]
                
                # Gather source K and V
                K_gathered = K[src_idx]  # [num_edges, heads, head_dim]
                V_gathered = V[src_idx]  # [num_edges, heads, head_dim]
                
                # Compute attention scores
                Q_dst = Q[dst_idx]  # [num_edges, heads, head_dim]
                attn = (Q_dst * K_gathered).sum(dim=-1) * self.scale
                attn = F.softmax(attn, dim=-1)
                attn = F.dropout(attn, p=self.dropout, training=self.training)
                
                # Weighted sum of values
                attn = attn.unsqueeze(-1)  # [num_edges, heads, 1]
                msg = (attn * V_gathered).view(-1, self.heads * self.out_channels)
                
                # Aggregate messages for each destination node
                aggr = torch.zeros(num_dst, msg.size(1), device=msg.device)
                aggr.scatter_add_(0, dst_idx.unsqueeze(-1).expand_as(msg), msg)
                
                # Normalize by degree
                degree = torch.zeros(num_dst, device=msg.device)
                degree.scatter_add_(0, dst_idx, torch.ones(len(dst_idx), device=msg.device))
                degree = degree.clamp(min=1).unsqueeze(-1)
                aggr = aggr / degree
                
                messages.append(aggr)
            
            if messages:
                # Sum all messages
                h = sum(messages)
                
                # Output projection
                h = self.out_linears[dst_type](h)
                
                # Skip connection
                skip = self.skip_linears[dst_type](x_dict[dst_type])
                h = h + skip
                
                # Layer normalization
                h = self.layer_norms[dst_type](h)
                h = F.relu(h)
                
                out_dict[dst_type] = h
            else:
                # No incoming edges, just transform
                out_dict[dst_type] = self.skip_linears[dst_type](x_dict[dst_type])
                out_dict[dst_type] = self.layer_norms[dst_type](out_dict[dst_type])
                out_dict[dst_type] = F.relu(out_dict[dst_type])
        
        return out_dict


class HGTModel(nn.Module):
    """
    Full Heterogeneous Graph Transformer Model for Fraud Detection
    
    Architecture:
    - Type-specific feature encoders
    - Multiple HGT convolution layers
    - Classification head for fraud prediction
    """
    
    def __init__(
        self,
        hidden_dim: int = 128,
        num_heads: int = 4,
        num_layers: int = 2,
        dropout: float = 0.3,
        node_types: List[str] = ['user', 'review', 'product'],
        edge_types: List[Tuple[str, str, str]] = None,
        text_dim: int = 256,
        num_classes: int = 2
    ):
        super().__init__()
        
        self.hidden_dim = hidden_dim
        self.num_heads = num_heads
        self.num_layers = num_layers
        self.dropout = dropout
        
        # Default edge types for fraud detection
        if edge_types is None:
            edge_types = [
                ('user', 'writes', 'review'),
                ('review', 'belongs_to', 'product'),
                ('user', 'purchases', 'product')
            ]
        
        self.metadata = (node_types, edge_types)
        
        # Feature projection layers for each node type
        self.feature_projections = nn.ModuleDict({
            'user': nn.Sequential(
                nn.Linear(6, hidden_dim),  # User behavioral features
                nn.ReLU(),
                nn.Dropout(dropout)
            ),
            'review': nn.Sequential(
                nn.Linear(text_dim + 6, hidden_dim),  # Text + metadata features
                nn.ReLU(),
                nn.Dropout(dropout)
            ),
            'product': nn.Sequential(
                nn.Linear(4, hidden_dim),  # Product features
                nn.ReLU(),
                nn.Dropout(dropout)
            )
        })
        
        # HGT layers
        self.hgt_layers = nn.ModuleList()
        for _ in range(num_layers):
            self.hgt_layers.append(
                HGTConv(hidden_dim, hidden_dim, self.metadata, num_heads, dropout)
            )
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim // 2, num_classes)
        )
        
        # Auxiliary classifier for training
        self.aux_classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 4),
            nn.ReLU(),
            nn.Linear(hidden_dim // 4, num_classes)
        )
    
    def forward(
        self,
        x_dict: Dict[str, Tensor],
        edge_index_dict: Dict[Tuple[str, str, str], Tensor]
    ) -> Tuple[Tensor, Dict[str, Tensor]]:
        """
        Forward pass
        
        Args:
            x_dict: Dictionary of input features per node type
            edge_index_dict: Dictionary of edge indices per edge type
        
        Returns:
            Tuple of (classification logits, node embeddings dict)
        """
        # Project features to common dimension
        h_dict = {}
        for node_type, x in x_dict.items():
            if node_type in self.feature_projections:
                h_dict[node_type] = self.feature_projections[node_type](x)
        
        # Apply HGT layers
        for layer in self.hgt_layers:
            h_dict = layer(h_dict, edge_index_dict)
        
        # Get review embeddings for classification
        review_embeddings = h_dict.get('review', torch.zeros(1, self.hidden_dim, device=next(self.parameters()).device))
        
        # Classification
        logits = self.classifier(review_embeddings)
        
        return logits, h_dict
    
    def predict(self, x_dict, edge_index_dict) -> Tuple[Tensor, Tensor]:
        """Make predictions with confidence scores"""
        self.eval()
        with torch.no_grad():
            logits, _ = self.forward(x_dict, edge_index_dict)
            probs = F.softmax(logits, dim=-1)
            predictions = torch.argmax(probs, dim=-1)
            confidence = probs.max(dim=-1)[0]
        return predictions, confidence


class SimpleHGTDetector(nn.Module):
    """
    Simplified HGT-like detector for inference when full graph is not available
    Uses attention mechanisms to weight different feature types
    """
    
    def __init__(
        self,
        text_dim: int = 256,
        hidden_dim: int = 128,
        num_heads: int = 4,
        num_classes: int = 2,
        dropout: float = 0.3
    ):
        super().__init__()
        
        self.hidden_dim = hidden_dim
        self.num_heads = num_heads
        
        # Feature encoders
        self.text_encoder = nn.Sequential(
            nn.Linear(text_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout)
        )
        
        # Self-attention layers
        self.attention_layers = nn.ModuleList([
            nn.MultiheadAttention(hidden_dim, num_heads, dropout=dropout, batch_first=True)
            for _ in range(2)
        ])
        
        # Layer norms
        self.layer_norms = nn.ModuleList([
            nn.LayerNorm(hidden_dim),      # For attention block 1
            nn.LayerNorm(hidden_dim),      # For attention block 2
            nn.LayerNorm(hidden_dim),      # For global pooling
        ])
        
        # Classification head
        self.classifier = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim),
            nn.LayerNorm(hidden_dim),
            nn.ReLU(),
            nn.Dropout(dropout),
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, num_classes)
        )
        
        # Risk factor detector
        self.risk_detector = nn.Sequential(
            nn.Linear(hidden_dim, hidden_dim // 2),
            nn.ReLU(),
            nn.Linear(hidden_dim // 2, 5)  # 5 risk factors
        )
    
    def forward(self, text_features: Tensor) -> Tuple[Tensor, Tensor]:
        """
        Forward pass
        
        Args:
            text_features: TF-IDF or other text embeddings
        
        Returns:
            Tuple of (classification logits, risk scores)
        """
        # Encode features
        h = self.text_encoder(text_features)  # [batch, hidden]
        
        # Add dimension for attention (sequence length 1)
        h = h.unsqueeze(1)  # [batch, 1, hidden]
        
        # Apply self-attention layers with residual connections
        for i, attn_layer in enumerate(self.attention_layers):
            h_norm = self.layer_norms[i](h)
            h_attn, _ = attn_layer(h_norm, h_norm, h_norm)
            h = h + h_attn
        
        # Global features (remove sequence dim)
        h_global = self.layer_norms[2](h).squeeze(1)  # [batch, hidden]
        
        # Simple features for classification
        h_combined = h_global
        
        # Classification
        logits = self.classifier(h_combined)
        
        # Risk factors
        risk_scores = torch.sigmoid(self.risk_detector(h_combined))
        
        return logits, risk_scores
    
    def predict_with_explanation(self, text_features: Tensor) -> Dict:
        """Make prediction with detailed explanation"""
        self.eval()
        with torch.no_grad():
            logits, risk_scores = self.forward(text_features)
            probs = F.softmax(logits, dim=-1)
            predictions = torch.argmax(probs, dim=-1)
            confidence = probs.max(dim=-1)[0]
            
            return {
                'predictions': predictions,
                'confidence': confidence,
                'fraud_probability': probs[:, 1],
                'risk_scores': risk_scores,
                'logits': logits
            }


def create_model(config: Dict) -> nn.Module:
    """Factory function to create HGT model"""
    return SimpleHGTDetector(
        text_dim=config.get('text_dim', 256),
        hidden_dim=config.get('hidden_dim', 128),
        num_heads=config.get('num_heads', 4),
        dropout=config.get('dropout', 0.3)
    )
