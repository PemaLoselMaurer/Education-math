r"""MNIST classifier using PyTorch.

Features:
 - Simple fully-connected network (easily replaceable with CNN).
 - Reproducible seeds.
 - Command line arguments for epochs, batch size, lr, model path.
 - Automatic device selection (CUDA / MPS / CPU).
 - Progress + final test accuracy.
 - Saves best model (by test accuracy) and final model.

Usage (PowerShell, after activating your venv):
  python mnist_pytorch.py --epochs 5

To activate your venv (adjust path if different):
  # PowerShell
  C:\Users\asusb\Desktop\pytorch\ai\Scripts\Activate.ps1

Install deps inside venv (first time only):
  pip install torch torchvision
"""

from __future__ import annotations

import argparse
import os
import random
from pathlib import Path
from typing import Tuple

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms


def set_seed(seed: int = 42):
	random.seed(seed)
	torch.manual_seed(seed)
	if torch.cuda.is_available():
		torch.cuda.manual_seed_all(seed)
	torch.backends.cudnn.deterministic = True
	torch.backends.cudnn.benchmark = False


def get_device() -> torch.device:
	if torch.cuda.is_available():
		return torch.device("cuda")
	# Apple MPS (if running on macOS with M-series); harmless on Windows
	if getattr(torch.backends, "mps", None) and torch.backends.mps.is_available():
		return torch.device("mps")
	return torch.device("cpu")


class MLP(nn.Module):
	def __init__(self):
		super().__init__()
		self.net = nn.Sequential(
			nn.Flatten(),
			nn.Linear(28 * 28, 256),
			nn.ReLU(),
			nn.Linear(256, 128),
			nn.ReLU(),
			nn.Linear(128, 10),
		)

	def forward(self, x: torch.Tensor) -> torch.Tensor:  # type: ignore[override]
		return self.net(x)


def accuracy(logits: torch.Tensor, targets: torch.Tensor) -> float:
	preds = logits.argmax(dim=1)
	return (preds == targets).float().mean().item()


def build_loaders(batch_size: int, data_dir: Path) -> Tuple[DataLoader, DataLoader]:
	transform = transforms.Compose([
		transforms.ToTensor(),
		transforms.Normalize((0.1307,), (0.3081,)),
	])
	train_ds = datasets.MNIST(str(data_dir), train=True, download=True, transform=transform)
	test_ds = datasets.MNIST(str(data_dir), train=False, download=True, transform=transform)
	train_loader = DataLoader(train_ds, batch_size=batch_size, shuffle=True, num_workers=0)
	test_loader = DataLoader(test_ds, batch_size=batch_size, shuffle=False, num_workers=0)
	return train_loader, test_loader


def evaluate(model: nn.Module, loader: DataLoader, device: torch.device, loss_fn: nn.Module) -> Tuple[float, float]:
	model.eval()
	total_loss = 0.0
	total_correct = 0
	total_items = 0
	with torch.no_grad():
		for x, y in loader:
			x, y = x.to(device), y.to(device)
			out = model(x)
			loss = loss_fn(out, y)
			total_loss += loss.item() * y.size(0)
			total_correct += (out.argmax(1) == y).sum().item()
			total_items += y.size(0)
	return total_loss / total_items, total_correct / total_items


def save_checkpoint(path: Path, model: nn.Module, optimizer: optim.Optimizer, epoch: int, acc: float, args):
	"""Save training state so it can be correctly restored later."""
	path.parent.mkdir(parents=True, exist_ok=True)
	torch.save({
		"model_state": model.state_dict(),
		"optimizer_state": optimizer.state_dict(),
		"epoch": epoch,
		"acc": acc,
		"args": vars(args),
		"arch": "MLP",
		"seed": args.seed,
	}, path)


def load_model(checkpoint_path: str | Path, device: torch.device | None = None) -> nn.Module:
	"""Load a trained model for inference.

	Usage:
		from mnist_pytorch import load_model, get_device
		device = get_device()
		model = load_model('models/mnist_best.pt', device)
		model.eval()
	"""
	if device is None:
		device = get_device()
	ckpt = torch.load(checkpoint_path, map_location=device)
	model = MLP().to(device)
	# Backward compatibility with old key name 'model'
	state = ckpt.get("model_state") or ckpt.get("model")
	model.load_state_dict(state)
	return model


def train(args):
	set_seed(args.seed)
	device = get_device()
	print(f"Device: {device}")

	data_dir = Path(args.data_dir)
	data_dir.mkdir(parents=True, exist_ok=True)
	train_loader, test_loader = build_loaders(args.batch_size, data_dir)

	model = MLP().to(device)
	optimizer = optim.Adam(model.parameters(), lr=args.lr)
	loss_fn = nn.CrossEntropyLoss()

	best_acc = 0.0
	model_dir = Path(args.model_dir)
	model_dir.mkdir(parents=True, exist_ok=True)
	best_path = model_dir / "mnist_best.pt"
	last_path = model_dir / "mnist_last.pt"

	start_epoch = 1
	if args.resume:
		resume_path = Path(args.resume)
		if resume_path.is_file():
			print(f"Resuming from checkpoint: {resume_path}")
			ckpt = torch.load(resume_path, map_location=device)
			state = ckpt.get("model_state") or ckpt.get("model")
			model.load_state_dict(state)
			if "optimizer_state" in ckpt:
				optimizer.load_state_dict(ckpt["optimizer_state"])
			start_epoch = ckpt.get("epoch", 0) + 1
			best_acc = ckpt.get("acc", 0.0)
			print(f"  -> Resumed at epoch {start_epoch} (prev best acc {best_acc*100:.2f}%)")
		else:
			print(f"--resume specified but file not found: {resume_path}")

	for epoch in range(start_epoch, args.epochs + 1):
		model.train()
		running_loss = 0.0
		running_acc = 0.0
		count = 0
		for x, y in train_loader:
			x, y = x.to(device), y.to(device)
			optimizer.zero_grad()
			out = model(x)
			loss = loss_fn(out, y)
			loss.backward()
			optimizer.step()
			batch_size_actual = y.size(0)
			running_loss += loss.item() * batch_size_actual
			running_acc += accuracy(out, y) * batch_size_actual
			count += batch_size_actual
		train_loss = running_loss / count
		train_acc = running_acc / count
		test_loss, test_acc = evaluate(model, test_loader, device, loss_fn)
		print(f"Epoch {epoch:02d}/{args.epochs} | Train Loss {train_loss:.4f} Acc {train_acc*100:5.2f}% | Test Loss {test_loss:.4f} Acc {test_acc*100:5.2f}%")
		# Save last
		save_checkpoint(last_path, model, optimizer, epoch, test_acc, args)
		# Save best
		if test_acc > best_acc:
			best_acc = test_acc
			save_checkpoint(best_path, model, optimizer, epoch, best_acc, args)
			print(f"  -> New best saved ({best_acc*100:.2f}%)")

	print("Training complete.")
	print(f"Best Test Accuracy: {best_acc*100:.2f}%")
	return model, device, test_loader, loss_fn


def parse_args():
	p = argparse.ArgumentParser(description="Train MNIST MLP with PyTorch")
	p.add_argument("--epochs", type=int, default=5, help="Number of training epochs")
	p.add_argument("--batch-size", type=int, default=64, help="Batch size")
	p.add_argument("--lr", type=float, default=1e-3, help="Learning rate")
	p.add_argument("--data-dir", type=str, default="data", help="Directory to store MNIST data")
	p.add_argument("--model-dir", type=str, default="models", help="Directory to save models")
	p.add_argument("--seed", type=int, default=42, help="Random seed")
	p.add_argument("--resume", type=str, default="", help="Path to checkpoint to resume training")
	return p.parse_args()


def main():
	args = parse_args()
	train(args)



if __name__ == "__main__":
	main()

