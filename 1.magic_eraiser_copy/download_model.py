import os
from pathlib import Path
from huggingface_hub import HfApi
from diffusers import StableDiffusionInpaintPipeline
import torch
import shutil

def download_model():
    # Set target directory
    target_dir = Path("D:/1.magic_eraiser/server/app/models/stable-diffusion-inpainting")
    
    print("Starting model download...")
    
    # Create target directory if it doesn't exist
    target_dir.mkdir(parents=True, exist_ok=True)
    
    # Download model directly to target directory
    pipe = StableDiffusionInpaintPipeline.from_pretrained(
        "runwayml/stable-diffusion-inpainting",
        torch_dtype=torch.float16,
        cache_dir=str(target_dir)
    )
    
    # Move files from cache subfolder to target directory
    cache_dir = list(target_dir.glob("snapshots/*"))[0]
    for item in cache_dir.iterdir():
        if item.is_file():
            shutil.move(str(item), str(target_dir / item.name))
        else:
            # For directories like 'vae', 'text_encoder', etc.
            shutil.move(str(item), str(target_dir / item.name))
    
    # Clean up temporary directories
    snapshots_dir = target_dir / "snapshots"
    if snapshots_dir.exists():
        shutil.rmtree(str(snapshots_dir))
    
    refs_dir = target_dir / "refs"
    if refs_dir.exists():
        shutil.rmtree(str(refs_dir))
    
    # Clear HuggingFace cache
    cache_path = Path.home() / ".cache" / "huggingface"
    if cache_path.exists():
        print(f"Clearing HuggingFace cache at {cache_path}")
        shutil.rmtree(str(cache_path))
        print("Cache cleared successfully")
    
    print(f"Model downloaded successfully to {target_dir}")
    print("\nFiles in target directory:")
    for item in target_dir.rglob("*"):
        if item.is_file():
            print(f"- {item.relative_to(target_dir)}")

if __name__ == "__main__":
    download_model()