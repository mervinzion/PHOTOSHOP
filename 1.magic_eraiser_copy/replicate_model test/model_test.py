import replicate
import os
import base64
from PIL import Image
import io

# Set your API token
os.environ["REPLICATE_API_TOKEN"] = "your_api_token_here"  # Replace with your token
client = replicate.Client()

def validate_image(image_input):
    """Validate if the input is a valid base64 string or URL."""
    if image_input.startswith("data:image/"):
        try:
            # Extract base64 data
            base64_string = image_input.split(",")[1]
            image_data = base64.b64decode(base64_string)
            # Try loading as an image
            Image.open(io.BytesIO(image_data))
            return True
        except Exception as e:
            print(f"Invalid base64 image: {e}")
            return False
    elif image_input.startswith("http"):
        return True  # Assume URL is valid; Replicate will handle validation
    else:
        print("Input must be a base64 string or URL")
        return False

# Example input (replace with your image)
image_input = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAACklEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg=="  # 1x1 grayscale pixel
model_size = "tiny"

# Validate input
if not validate_image(image_input):
    print("Exiting due to invalid image input")
    exit(1)

try:
    # Run the model
    print(f"Running model with model_size: {model_size}")
    output = client.run(
        "piddnad/ddcolor:ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695",
        input={
            "image": image_input,
            "model_size": model_size
        }
    )
    print("Raw output:", output)
    print("Output type:", type(output))

    # Handle output
    if isinstance(output, str):
        print("Output is a URL:", output)
    elif isinstance(output, list):
        print("Output is a list:", output)
    elif isinstance(output, dict):
        print("Output is a dictionary:", output)
    else:
        print("Unexpected output format:", output)

except replicate.exceptions.ModelError as e:
    print(f"Model error: {e}")
except Exception as e:
    print(f"General error: {e}")