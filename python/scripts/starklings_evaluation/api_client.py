"""API client for Cairo Coder service."""

import asyncio
import json
import time
from typing import Dict, Any, Optional

import aiohttp
import structlog

logger = structlog.get_logger(__name__)


class CairoCoderAPIClient:
    """Async client for Cairo Coder API."""
    
    def __init__(
        self,
        base_url: str = "http://localhost:3001",
        model: str = "cairo-coder",
        timeout: int = 120,
    ):
        """Initialize API client.
        
        Args:
            base_url: Base URL for the API
            model: Model name to use
            timeout: Request timeout in seconds
        """
        self.base_url = base_url.rstrip("/")
        self.model = model
        self.timeout = aiohttp.ClientTimeout(total=timeout)
        self.session: Optional[aiohttp.ClientSession] = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        self.session = aiohttp.ClientSession(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.session:
            await self.session.close()
    
    async def generate_solution(
        self,
        prompt: str,
        max_retries: int = 3,
        retry_delay: float = 1.0,
    ) -> Dict[str, Any]:
        """Generate a solution for the given prompt.
        
        Args:
            prompt: Exercise prompt including code and hint
            max_retries: Maximum number of retry attempts
            retry_delay: Delay between retries in seconds
            
        Returns:
            API response dictionary
            
        Raises:
            Exception: If API call fails after retries
        """
        if not self.session:
            raise RuntimeError("Client not initialized. Use 'async with' context manager.")
        
        url = f"{self.base_url}/v1/chat/completions"
        
        payload = {
            "model": self.model,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "stream": False
        }
        
        for attempt in range(max_retries):
            try:
                start_time = time.time()
                
                async with self.session.post(
                    url,
                    json=payload,
                    headers={"Content-Type": "application/json"}
                ) as response:
                    response.raise_for_status()
                    result = await response.json()
                    
                generation_time = time.time() - start_time
                
                logger.debug(
                    "API call successful",
                    attempt=attempt + 1,
                    generation_time=generation_time
                )
                
                return {
                    "response": result,
                    "generation_time": generation_time,
                    "attempts": attempt + 1
                }
                
            except aiohttp.ClientError as e:
                logger.warning(
                    "API call failed",
                    attempt=attempt + 1,
                    error=str(e),
                    will_retry=attempt < max_retries - 1
                )
                
                if attempt < max_retries - 1:
                    await asyncio.sleep(retry_delay * (attempt + 1))
                else:
                    raise Exception(f"API call failed after {max_retries} attempts: {str(e)}")
            
            except Exception as e:
                logger.error("Unexpected error in API call", error=str(e))
                raise


def extract_code_from_response(response: Dict[str, Any]) -> Optional[str]:
    """Extract code from API response.
    
    Args:
        response: API response dictionary
        
    Returns:
        Extracted code or None if not found
    """
    try:
        # Navigate the response structure
        if "response" in response:
            response = response["response"]
        
        # Get the content from the first choice
        if "choices" in response and response["choices"]:
            content = response["choices"][0]["message"]["content"]
            return content
        
        return None
        
    except (KeyError, IndexError, TypeError) as e:
        logger.error("Failed to extract code from response", error=str(e))
        return None