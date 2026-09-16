"""
CNN Model Architecture for Micro-Doppler Spectrogram Classification
Input shape: 224 x 224 x 1 (Single channel grayscale spectrogram)
Classes: 0: Drone, 1: Bird, 2: Unknown

Architecture per specification:
  Conv2D -> BatchNormalization -> ReLU -> MaxPooling
  Conv2D -> BatchNormalization -> ReLU -> MaxPooling
  Conv2D -> ReLU -> MaxPooling
  Flatten
  Dense -> Dropout
  Dense(3) -> Softmax
"""
from typing import Dict, Any, Tuple
import numpy as np

# We provide a clean PyTorch module if PyTorch is installed,
# plus an architecture specification dictionary for metadata/UI.

CNN_ARCHITECTURE_SPECS = {
    "input_shape": [224, 224, 1],
    "classes": ["DRONE", "BIRD", "UNKNOWN"],
    "layers": [
        {"name": "conv1", "type": "Conv2D", "filters": 32, "kernel_size": [3, 3], "padding": "same"},
        {"name": "bn1", "type": "BatchNormalization"},
        {"name": "relu1", "type": "ReLU"},
        {"name": "pool1", "type": "MaxPooling2D", "pool_size": [2, 2]},
        
        {"name": "conv2", "type": "Conv2D", "filters": 64, "kernel_size": [3, 3], "padding": "same"},
        {"name": "bn2", "type": "BatchNormalization"},
        {"name": "relu2", "type": "ReLU"},
        {"name": "pool2", "type": "MaxPooling2D", "pool_size": [2, 2]},
        
        {"name": "conv3", "type": "Conv2D", "filters": 128, "kernel_size": [3, 3], "padding": "same"},
        {"name": "relu3", "type": "ReLU"},
        {"name": "pool3", "type": "MaxPooling2D", "pool_size": [2, 2]},
        
        {"name": "flatten", "type": "Flatten", "output_dim": 128 * 28 * 28},
        {"name": "dense1", "type": "Dense", "units": 128, "activation": "relu"},
        {"name": "dropout", "type": "Dropout", "rate": 0.5},
        {"name": "dense_out", "type": "Dense", "units": 3, "activation": "softmax"}
    ]
}

try:
    import torch
    import torch.nn as nn
    import torch.nn.functional as F

    class MicroDopplerCNN(nn.Module):
        def __init__(self, num_classes: int = 3):
            super().__init__()
            # Block 1
            self.conv1 = nn.Conv2d(in_channels=1, out_channels=32, kernel_size=3, padding=1)
            self.bn1 = nn.BatchNorm2d(32)
            self.pool1 = nn.MaxPool2d(kernel_size=2, stride=2)  # 224 -> 112
            
            # Block 2
            self.conv2 = nn.Conv2d(in_channels=32, out_channels=64, kernel_size=3, padding=1)
            self.bn2 = nn.BatchNorm2d(64)
            self.pool2 = nn.MaxPool2d(kernel_size=2, stride=2)  # 112 -> 56
            
            # Block 3
            self.conv3 = nn.Conv2d(in_channels=64, out_channels=128, kernel_size=3, padding=1)
            self.pool3 = nn.MaxPool2d(kernel_size=2, stride=2)  # 56 -> 28
            
            # Classifier Head
            self.fc1 = nn.Linear(128 * 28 * 28, 128)
            self.dropout = nn.Dropout(p=0.5)
            self.fc2 = nn.Linear(128, num_classes)

        def forward(self, x: torch.Tensor) -> torch.Tensor:
            # x shape: (B, 1, 224, 224)
            x = self.pool1(F.relu(self.bn1(self.conv1(x))))
            x = self.pool2(F.relu(self.bn2(self.conv2(x))))
            x = self.pool3(F.relu(self.conv3(x)))
            x = torch.flatten(x, 1)
            x = F.relu(self.fc1(x))
            x = self.dropout(x)
            logits = self.fc2(x)
            return F.softmax(logits, dim=1)

    TORCH_AVAILABLE = True
except ImportError:
    TORCH_AVAILABLE = False
    MicroDopplerCNN = None
