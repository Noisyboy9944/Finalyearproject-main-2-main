import asyncio
from groq import AsyncGroq
import os
from dotenv import load_dotenv

load_dotenv()
api_key = os.environ.get("GROQ_API_KEY", "") or os.environ.get("OPENAI_API_KEY", "")

async def main():
    try:
        client = AsyncGroq(api_key=api_key)
        response = await client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[{"role": "user", "content": "hello"}],
            max_tokens=500
        )
        print("Success:", response.choices[0].message.content)
    except Exception as e:
        print("Error:", str(e))

asyncio.run(main())
