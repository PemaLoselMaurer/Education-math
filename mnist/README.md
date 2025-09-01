# MNIST PyTorch Classifier

This project trains a simple neural network to classify handwritten digits (0-9) from the **MNIST** dataset using **PyTorch**. It downloads the dataset automatically, trains a multilayer perceptron (MLP), reports accuracy per epoch, and saves model checkpoints.

---

## ✅ Features

- Fully-connected (MLP) architecture (easy to swap for CNN)
- Deterministic runs via seeding
- Automatic device selection (CUDA / MPS / CPU)
- Command-line arguments for key hyperparameters
- Saves both last and best (highest test accuracy) model checkpoints
- Clean modular functions (easy to extend)

---

## 📂 Files

| File               | Purpose                                                                               |
| ------------------ | ------------------------------------------------------------------------------------- |
| `mnist_pytorch.py` | Main training script with model, data pipeline, training loop, evaluation, and saving |
| `models/`          | Created after training; stores `mnist_best.pt` and `mnist_last.pt`                    |
| `data/`            | Created automatically; MNIST raw + processed tensors                                  |

---

## 🧠 Model Architecture (MLP)

```
Flatten(28x28) -> Linear(784 → 256) -> ReLU -> Linear(256 → 128) -> ReLU -> Linear(128 → 10)
```

Output = raw class logits (CrossEntropyLoss handles softmax internally).

---

## 🔧 Environment Setup (Windows / PowerShell)

Create (or reuse) a virtual environment (you already have one at `C:\Users\asusb\Desktop\pytorch\ai`).

```powershell
# Activate existing venv
C:\Users\asusb\Desktop\pytorch\ai\Scripts\Activate.ps1

# (Optional) Create a new one
py -3.12 -m venv C:\Users\asusb\Desktop\pytorch\ai312
C:\Users\asusb\Desktop\pytorch\ai312\Scripts\Activate.ps1
```

Install dependencies:

```powershell
pip install --upgrade pip
pip install torch torchvision
```

---

## ▶️ Run Training

```powershell
python mnist_pytorch.py --epochs 5 --batch-size 64 --lr 0.001
```

All arguments are optional. Default values:
| Argument | Default | Description |
|----------|---------|-------------|
| `--epochs` | 5 | Number of passes over training data |
| `--batch-size` | 64 | Mini-batch size |
| `--lr` | 0.001 | Learning rate (Adam) |
| `--data-dir` | `data` | Where MNIST is stored/downloaded |
| `--model-dir` | `models` | Where checkpoints are saved |
| `--seed` | 42 | Reproducibility seed |

Example output line per epoch:

```
Epoch 01/5 | Train Loss 0.3201 Acc 90.45% | Test Loss 0.1802 Acc 94.52%
  -> New best saved (94.52%)
```

---

## 📦 Saved Models

After training:

- `models/mnist_last.pt` – last epoch checkpoint
- `models/mnist_best.pt` – best test accuracy checkpoint

Checkpoint format (dictionary):

```python
{
  'model': state_dict,
  'epoch': int,
  'acc': float  # test accuracy when saved
}
```

### Load and Use for Inference

```python
import torch
from mnist_pytorch import MLP, get_device

device = get_device()
ckpt = torch.load('models/mnist_best.pt', map_location=device)
model = MLP().to(device)
model.load_state_dict(ckpt['model'])
model.eval()

# Suppose img is a single MNIST image tensor shape [1, 28, 28]
with torch.no_grad():
    logits = model(img.unsqueeze(0).to(device))  # -> [1,10]
    pred = logits.argmax(1).item()
    print('Prediction:', pred)
```

---

## 🔍 Code Walkthrough (Key Functions)

| Function        | Role                                          |
| --------------- | --------------------------------------------- |
| `set_seed`      | Makes results reproducible across runs        |
| `get_device`    | Selects GPU (CUDA/MPS) if available, else CPU |
| `MLP`           | The neural network class (fully connected)    |
| `accuracy`      | Computes batch-wise top-1 accuracy            |
| `build_loaders` | Prepares `DataLoader`s with normalization     |
| `evaluate`      | Aggregates loss & accuracy over a loader      |
| `train`         | Full training loop + checkpoint logic         |
| `parse_args`    | CLI argument parsing                          |
| `main`          | Entry point wiring everything together        |

---

## 📊 Dataset (MNIST)

- 60,000 training images
- 10,000 test images
- Grayscale 28×28
- Normalized using mean = 0.1307, std = 0.3081 (standard MNIST stats)

---

## 🔁 Reproducibility

`set_seed` sets Python + PyTorch seeds and configures deterministic mode (may reduce some backend speed but ensures repeatability).

---

## 🧪 Quick Sanity Check

Add temporarily inside the script after `build_loaders` call:

```python
print(len(train_loader.dataset), len(test_loader.dataset))  # Expect: 60000 10000
images, labels = next(iter(train_loader))
print(images.shape, labels.shape)  # torch.Size([64,1,28,28]) torch.Size([64])
```

Remove after verifying.

---

## 🚀 Extending: Replace MLP with a CNN

In `MLP`, swap with:

```python
class CNN(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv = nn.Sequential(
            nn.Conv2d(1, 32, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),  # 14x14
            nn.Conv2d(32, 64, 3, padding=1), nn.ReLU(),
            nn.MaxPool2d(2),  # 7x7
        )
        self.fc = nn.Sequential(
            nn.Flatten(),
            nn.Linear(64 * 7 * 7, 128), nn.ReLU(),
            nn.Linear(128, 10),
        )
    def forward(self, x):
        return self.fc(self.conv(x))
```

Then replace `model = MLP().to(device)` with `model = CNN().to(device)`.

---

## 🛠 Troubleshooting

| Issue                                  | Cause                                              | Fix                                                                |
| -------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------ |
| `SyntaxError: unicodeescape ...`       | Raw Windows path inside normal string              | Use raw string (`r"..."`) or escape backslashes                    |
| `Import "torch" could not be resolved` | VS Code using wrong interpreter                    | Select the venv interpreter; ensure `pip show torch` works         |
| Very low accuracy                      | Forgot normalization or using untrained checkpoint | Re-run training; confirm `models/mnist_best.pt` updated            |
| Slow CPU training                      | No GPU available                                   | Reduce `--batch-size` or switch to CNN for better feature learning |

---

## ✅ Next Ideas

- Add learning rate scheduling (`torch.optim.lr_scheduler`)
- Early stopping based on validation loss
- Export to ONNX or TorchScript
- Add unit tests for `accuracy` and model shape
- Visualize misclassified samples

---

## 📜 License

Educational use. Adapt freely.

---

## 🙋 FAQ

**Q: Does it really download MNIST?** Yes — via `torchvision.datasets.MNIST(download=True)`.

**Q: Where are the tensors stored?** `data/MNIST/processed/training.pt` and `test.pt`.

**Q: How do I resume training?** Load the last checkpoint and continue looping (can add logic easily).

---

Happy experimenting!
