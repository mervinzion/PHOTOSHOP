from pathlib import Path


model_path = Path("D:\1.magic_eraiser\server\app\models\Deliberate_v2-inpainting.safetensors")
print(f"Model path exists: {model_path.exists()}")
print(f"Full absolute path: {model_path.absolute()}")