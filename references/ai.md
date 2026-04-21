# AI Layer Reference

## Chatbot với conversation memory

```python
# Giữ history trong Redis (tránh lưu trong RAM server)
import redis.asyncio as redis
import json

redis_client = redis.from_url("redis://localhost:6379/1")

async def get_chat_history(session_id: str, max_turns: int = 10) -> list:
    raw = await redis_client.get(f"chat:{session_id}")
    if raw:
        history = json.loads(raw)
        return history[-max_turns * 2:]  # Giữ N turns gần nhất
    return []

async def save_chat_history(session_id: str, history: list):
    await redis_client.setex(
        f"chat:{session_id}",
        86400,  # Expire sau 24h
        json.dumps(history)
    )
```

## Tool Use — Chatbot tìm kiếm database

```python
# Cho Claude biết nó có thể gọi search để tìm việc thực tế
TOOLS = [
    {
        "name": "search_jobs",
        "description": "Tìm kiếm việc làm trong database dựa trên từ khóa, địa điểm, mức lương",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Từ khóa tìm kiếm"},
                "location": {"type": "string", "description": "Địa điểm"},
                "salary_min": {"type": "integer", "description": "Lương tối thiểu (VND)"},
                "job_type": {"type": "string", "enum": ["fulltime","parttime","remote","internship"]}
            },
            "required": ["query"]
        }
    },
    {
        "name": "search_scholarships",
        "description": "Tìm kiếm học bổng phù hợp",
        "input_schema": {
            "type": "object",
            "properties": {
                "query": {"type": "string"},
                "level": {"type": "string", "enum": ["bachelor","master","phd"]},
                "country": {"type": "string"}
            },
            "required": ["query"]
        }
    }
]

async def chat_with_tools(message: str, history: list, user_profile: dict | None = None):
    client = anthropic.AsyncAnthropic()
    messages = history + [{"role": "user", "content": message}]
    
    response = await client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=2048,
        system=SYSTEM_PROMPT,
        tools=TOOLS,
        messages=messages,
    )
    
    # Xử lý tool calls nếu có
    if response.stop_reason == "tool_use":
        tool_results = []
        for block in response.content:
            if block.type == "tool_use":
                result = await execute_tool(block.name, block.input)
                tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": block.id,
                    "content": json.dumps(result, ensure_ascii=False)
                })
        
        # Gửi lại kết quả tool cho Claude
        messages.append({"role": "assistant", "content": response.content})
        messages.append({"role": "user", "content": tool_results})
        
        final_response = await client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=2048,
            system=SYSTEM_PROMPT,
            messages=messages,
        )
        return final_response.content[0].text
    
    return response.content[0].text

async def execute_tool(tool_name: str, tool_input: dict):
    from services.search_service import MeilisearchService
    svc = MeilisearchService()
    if tool_name == "search_jobs":
        return await svc.search(index="jobs", **tool_input)
    elif tool_name == "search_scholarships":
        return await svc.search(index="scholarships", **tool_input)
```

## Local Embedding (Free — không cần API)

```python
# Dùng sentence-transformers, hỗ trợ tiếng Việt tốt
from sentence_transformers import SentenceTransformer
import numpy as np

# Model multilingual hỗ trợ tiếng Việt
model = SentenceTransformer('paraphrase-multilingual-MiniLM-L12-v2')
# Hoặc model tốt hơn: 'intfloat/multilingual-e5-small'

def get_embedding_local(text: str) -> list[float]:
    embedding = model.encode(text, normalize_embeddings=True)
    return embedding.tolist()

def batch_embed(texts: list[str]) -> list[list[float]]:
    """Embed nhiều text cùng lúc — hiệu quả hơn loop."""
    embeddings = model.encode(texts, batch_size=32, normalize_embeddings=True)
    return embeddings.tolist()
```

## Job Matching Score

```python
async def calculate_match_score(user_profile: dict, job: dict) -> float:
    """Tính điểm phù hợp giữa user và job (0-1)."""
    
    # Skill overlap
    user_skills = set(s.lower() for s in user_profile.get("skills", []))
    job_skills = set(s.lower() for s in job.get("skills", []))
    
    if job_skills:
        skill_score = len(user_skills & job_skills) / len(job_skills)
    else:
        skill_score = 0.5  # Không có yêu cầu cụ thể
    
    # Experience level match
    exp_map = {"fresher": 0, "junior": 1, "mid": 2, "senior": 3}
    user_exp = exp_map.get(user_profile.get("experience", "junior"), 1)
    job_exp = exp_map.get(job.get("experience", "junior"), 1)
    exp_score = 1.0 - min(abs(user_exp - job_exp) / 3, 1.0)
    
    # Semantic similarity (vector)
    if user_profile.get("cv_summary") and job.get("description"):
        user_vec = np.array(get_embedding_local(user_profile["cv_summary"]))
        job_vec = np.array(get_embedding_local(job["description"][:500]))
        semantic_score = float(np.dot(user_vec, job_vec))
    else:
        semantic_score = 0.5
    
    # Weighted average
    return 0.4 * skill_score + 0.2 * exp_score + 0.4 * semantic_score
```