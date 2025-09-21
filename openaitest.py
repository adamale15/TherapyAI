import openai
import os

    # Replace 'YOUR_API_KEY' with your actual OpenAI API key,
    # or ensure it's set as an environment variable named OPENAI_API_KEY
    # openai.api_key = os.getenv("OPENAI_API_KEY")
openai.api_key = "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" # For direct testing, replace with your key

try:
        # Attempt to list available models as a simple test
        response = openai.models.list()
        print("API Key is working! Available models:")
        for model in response.data:
            print(f"- {model.id}")
except openai.AuthenticationError:
        print("API Key is invalid or expired. Authentication failed.")
except openai.RateLimitError:
        print("Rate limit exceeded. Your key is likely valid but usage limits are met.")
except openai.APITimeoutError:
        print("API request timed out. Check network connection or OpenAI status.")
except openai.APIError as e:
        print(f"An OpenAI API error occurred: {e}")
except Exception as e:
        print(f"An unexpected error occurred: {e}")