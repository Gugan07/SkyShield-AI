"""
Standalone Training Script for Micro-Doppler CNN Classifier
Can be run to train the 224x224x1 ConvNet on simulated synthetic radar signals
or real Micro-Doppler spectrogram datasets (e.g. RadProc, DIAT-uSat).

Usage:
    python -m app.ml.train_cnn --epochs 10 --samples 300 --output weights/micro_doppler_cnn.pt
"""
import os
import argparse
import numpy as np

def generate_synthetic_dataset(num_samples: int = 300):
    from app.services.radar_simulator import RadarSimulator
    from app.services.signal_processor import SignalProcessor
    from app.ml.preprocessing import preprocess_spectrogram_for_cnn
    
    sim = RadarSimulator()
    sp = SignalProcessor()
    
    X = []
    y = []
    classes = ["drone", "bird", "unknown"]
    samples_per_class = num_samples // 3
    
    print(f"Generating {num_samples} synthetic micro-Doppler spectrograms...")
    for label_idx, cls in enumerate(classes):
        for _ in range(samples_per_class):
            sig, meta = sim.acquire_frame(target_type_hint=cls)
            f, t, spec_db, spec_norm = sp.compute_stft(sig)
            tensor_np = preprocess_spectrogram_for_cnn(spec_norm, target_shape=(224, 224))
            X.append(tensor_np.squeeze(0))  # (1, 224, 224)
            y.append(label_idx)
            
    return np.array(X, dtype=np.float32), np.array(y, dtype=np.int64)

def train_model(epochs: int = 10, samples: int = 300, batch_size: int = 16, output_path: str = "weights/micro_doppler_cnn.pt"):
    try:
        import torch
        import torch.nn as nn
        import torch.optim as optim
        from torch.utils.data import TensorDataset, DataLoader
        from app.ml.cnn_model import MicroDopplerCNN
    except ImportError:
        print("PyTorch is not installed. To train the CNN, install PyTorch: pip install torch")
        return

    os.makedirs(os.path.dirname(output_path) or ".", exist_ok=True)
    
    X, y = generate_synthetic_dataset(samples)
    dataset = TensorDataset(torch.from_numpy(X), torch.from_numpy(y))
    dataloader = DataLoader(dataset, batch_size=batch_size, shuffle=True)
    
    model = MicroDopplerCNN(num_classes=3)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=0.001)
    
    print(f"Starting CNN training: {epochs} epochs, batch size {batch_size}...")
    model.train()
    for epoch in range(epochs):
        total_loss = 0.0
        correct = 0
        total = 0
        for batch_x, batch_y in dataloader:
            optimizer.zero_grad()
            outputs = model(batch_x)
            loss = criterion(outputs, batch_y)
            loss.backward()
            optimizer.step()
            
            total_loss += loss.item() * batch_x.size(0)
            preds = torch.argmax(outputs, dim=1)
            correct += (preds == batch_y).sum().item()
            total += batch_y.size(0)
            
        epoch_loss = total_loss / total
        epoch_acc = (correct / total) * 100.0
        print(f"Epoch [{epoch+1}/{epochs}] - Loss: {epoch_loss:.4f}, Accuracy: {epoch_acc:.1f}%")
        
    torch.save(model.state_dict(), output_path)
    print(f"Trained CNN weights successfully saved to: {output_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train Micro-Doppler CNN Classifier")
    parser.add_argument("--epochs", type=int, default=10, help="Number of training epochs")
    parser.add_argument("--samples", type=int, default=300, help="Number of synthetic samples to generate")
    parser.add_argument("--batch_size", type=int, default=16, help="Batch size")
    parser.add_argument("--output", type=str, default="weights/micro_doppler_cnn.pt", help="Path to save weights")
    args = parser.parse_args()
    
    train_model(epochs=args.epochs, samples=args.samples, batch_size=args.batch_size, output_path=args.output)
