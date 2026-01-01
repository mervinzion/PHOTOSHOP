import replicate
import os

# Set your API token
os.environ["REPLICATE_API_TOKEN"] = "your_api_token_here"

# Initialize Replicate client
client = replicate.Client()

# Run the model
output = client.run(
    "piddnad/ddcolor:ca494ba129e44e45f661d6ece83c4c98a9a7c774309beca01429b58fce8aa695",
    input={
        "image": "data:image/png;base64,...",  # Replace with base64 string
        "model_size": "tiny"
    }
)

print("Output:", output)