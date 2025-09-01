r"""Export trained MNIST MLP weights from mnist_pytorch.py checkpoint to a JSON file
usable directly in the Next.js frontend (pure JS inference).

Steps:
 1. Ensure you've trained or downloaded models/mnist_best.pt (already present).
 2. Activate your venv (adjust path):
     PowerShell:  C:\\Users\\asusb\\Desktop\\pytorch\\ai\\Scripts\\Activate.ps1
 3. Install deps if needed:
      pip install torch torchvision
 4. Run this script (from repo root or mnist/ folder):
      python mnist/export_mnist_weights.py --checkpoint mnist/models/mnist_best.pt --out frontend/public/mnist_mlp.json
 5. Start the Next.js frontend; the /learn-ai/mnist page will fetch mnist_mlp.json and perform real-time inference while you draw.

You can re-run after retraining to update weights.
"""
from __future__ import annotations
import argparse, json, torch, os, sys
from pathlib import Path
from mnist_pytorch import load_model, get_device

DEFAULT_MEAN = 0.1307
DEFAULT_STD = 0.3081

def tensor_to_list(t: torch.Tensor):
    return t.detach().cpu().numpy().tolist()

def export(checkpoint: Path, out_path: Path):
    device = get_device()
    model = load_model(checkpoint, device)
    model.eval()
    # Unwrap sequential layers: Flatten, Linear, ReLU, Linear, ReLU, Linear
    layers = [m for m in model.net if isinstance(m, torch.nn.Linear)]
    if len(layers) != 3:
        raise RuntimeError(f"Expected 3 Linear layers, found {len(layers)}")
    w1, b1 = layers[0].weight, layers[0].bias
    w2, b2 = layers[1].weight, layers[1].bias
    w3, b3 = layers[2].weight, layers[2].bias
    payload = {
        "architecture": "MLP(784-256-128-10)",
        "input_size": 28*28,
        "layers": [
            {"W": tensor_to_list(w1), "b": tensor_to_list(b1)},
            {"W": tensor_to_list(w2), "b": tensor_to_list(b2)},
            {"W": tensor_to_list(w3), "b": tensor_to_list(b3)},
        ],
        "normalization": {"mean": DEFAULT_MEAN, "std": DEFAULT_STD},
    }
    out_path.parent.mkdir(parents=True, exist_ok=True)
    with out_path.open('w', encoding='utf-8') as f:
        json.dump(payload, f)
    print(f"Exported weights to {out_path}")

if __name__ == "__main__":
    p = argparse.ArgumentParser()
    p.add_argument('--checkpoint', type=Path, default=Path('mnist/models/mnist_best.pt'))
    p.add_argument('--out', type=Path, default=Path('frontend/public/mnist_mlp.json'))
    args = p.parse_args()
    export(args.checkpoint, args.out)
