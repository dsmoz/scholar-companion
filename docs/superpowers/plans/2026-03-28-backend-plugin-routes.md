# Backend Plugin Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a `plugin_routes.py` Flask blueprint to the existing MCP server that exposes 9 REST + SSE endpoints consumed by the Zotero plugin.

**Architecture:** New Flask blueprint registered at `/api/plugin/*`. Each route is a thin wrapper over existing MCP module functions in `src/`. SSE streaming for chat uses Flask's `Response(stream_with_context(...))`. No changes to existing routes or modules — additive only.

**Tech Stack:** Python 3.12, Flask, existing `src/` MCP modules (`documents`, `qdrant`, `synctracker`, `jobs_api`, `zotero`, `graph`), `requests` for PubMed/Semantic Scholar/OpenAlex, `flask-cors` (already present).

**MCP server root:** `/Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant`

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `src/api/__init__.py` | Create | Empty package marker |
| `src/api/plugin_routes.py` | Create | All 9 `/api/plugin/*` endpoints |
| `src/api/discovery.py` | Create | PubMed, Semantic Scholar, OpenAlex search logic |
| `src/api/cascade_delete.py` | Create | Orchestrates multi-store delete |
| `main.py` | Modify | Register blueprint |
| `tests/test_plugin_routes.py` | Create | Integration tests for all endpoints |

---

## Task 1: Scaffold the blueprint and register it

**Files:**
- Create: `src/api/__init__.py`
- Create: `src/api/plugin_routes.py`
- Modify: `main.py`

- [ ] **Step 1: Read main.py to understand how Flask app is created and existing blueprints are registered**

```bash
cat /Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant/main.py
```

- [ ] **Step 2: Create the package marker**

```python
# src/api/__init__.py
# (empty)
```

- [ ] **Step 3: Create the blueprint scaffold with a health endpoint**

```python
# src/api/plugin_routes.py
from flask import Blueprint, jsonify
import time

plugin_bp = Blueprint("plugin", __name__, url_prefix="/api/plugin")


@plugin_bp.route("/health", methods=["GET"])
def health():
    """Connection check — returns status and server timestamp."""
    return jsonify({"status": "ok", "timestamp": time.time()})
```

- [ ] **Step 4: Register the blueprint in main.py**

Find the block where Flask app is created (look for `app = Flask(...)`) and add after existing blueprint registrations:

```python
from src.api.plugin_routes import plugin_bp
app.register_blueprint(plugin_bp)
```

- [ ] **Step 5: Start the server and verify health endpoint**

```bash
cd /Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant
python main.py &
sleep 2
curl -s http://localhost:6500/api/plugin/health | python -m json.tool
```

Expected output:
```json
{"status": "ok", "timestamp": 1711000000.0}
```

- [ ] **Step 6: Commit**

```bash
git add src/api/__init__.py src/api/plugin_routes.py main.py
git commit -m "feat: add plugin blueprint scaffold with health endpoint"
```

---

## Task 2: Write the test harness

**Files:**
- Create: `tests/test_plugin_routes.py`

- [ ] **Step 1: Create the test file with a Flask test client fixture**

```python
# tests/test_plugin_routes.py
import pytest
import json
from unittest.mock import patch, MagicMock

# Import the Flask app — adjust import path if main.py uses a different app factory
import sys
sys.path.insert(0, "/Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant")
from main import app


@pytest.fixture
def client():
    app.config["TESTING"] = True
    with app.test_client() as c:
        yield c


def test_health(client):
    r = client.get("/api/plugin/health")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert data["status"] == "ok"
    assert "timestamp" in data
```

- [ ] **Step 2: Run the test to confirm it passes**

```bash
cd /Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant
pytest tests/test_plugin_routes.py::test_health -v
```

Expected: `PASSED`

- [ ] **Step 3: Commit**

```bash
git add tests/test_plugin_routes.py
git commit -m "test: add plugin routes test harness"
```

---

## Task 3: Semantic search endpoint

**Files:**
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_search_returns_results(client):
    mock_results = [
        {"zotero_key": "ABC123", "title": "Test Paper", "score": 0.95, "date": "2023", "creators": []}
    ]
    with patch("src.api.plugin_routes.semantic_search", return_value=mock_results):
        r = client.get("/api/plugin/search?q=PrEP+MSM&limit=6")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert len(data["results"]) == 1
    assert data["results"][0]["zotero_key"] == "ABC123"


def test_search_requires_q(client):
    r = client.get("/api/plugin/search")
    assert r.status_code == 400
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_plugin_routes.py::test_search_returns_results tests/test_plugin_routes.py::test_search_requires_q -v
```

Expected: both FAIL

- [ ] **Step 3: Implement the search endpoint**

```python
# Add to src/api/plugin_routes.py (after imports, add):
from flask import request

# Add this import near the top — wraps the existing MCP search function
def semantic_search(query: str, limit: int = 6) -> list:
    """Thin wrapper over existing qdrant search module."""
    from src.qdrant.search import SemanticSearch
    results = SemanticSearch(query=query, top_k=limit)
    # Normalise to dicts if needed
    if hasattr(results, "__iter__") and not isinstance(results, list):
        results = list(results)
    return results


@plugin_bp.route("/search", methods=["GET"])
def search():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "q parameter required"}), 400
    limit = min(int(request.args.get("limit", 6)), 20)
    results = semantic_search(q, limit)
    return jsonify({"results": results, "query": q})
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_plugin_routes.py::test_search_returns_results tests/test_plugin_routes.py::test_search_requires_q -v
```

Expected: both PASSED

- [ ] **Step 5: Commit**

```bash
git add src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add /api/plugin/search endpoint"
```

---

## Task 4: Similar items endpoint

**Files:**
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_similar_returns_results(client):
    mock_results = [
        {"zotero_key": "DEF456", "title": "Similar Paper", "score": 0.91}
    ]
    with patch("src.api.plugin_routes.similar_items", return_value=mock_results):
        r = client.get("/api/plugin/similar/ABC123")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert data["source_key"] == "ABC123"
    assert len(data["results"]) == 1
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_plugin_routes.py::test_similar_returns_results -v
```

Expected: FAIL

- [ ] **Step 3: Implement the endpoint**

```python
# Add to src/api/plugin_routes.py

def similar_items(zotero_key: str, limit: int = 6) -> list:
    """Find semantically similar items by Zotero key."""
    from src.qdrant.search import Search_by_zotero_key
    results = Search_by_zotero_key(zotero_key=zotero_key, top_k=limit + 1)
    # Exclude the source item itself from results
    return [r for r in results if r.get("zotero_key") != zotero_key][:limit]


@plugin_bp.route("/similar/<zotero_key>", methods=["GET"])
def similar(zotero_key: str):
    limit = min(int(request.args.get("limit", 6)), 20)
    results = similar_items(zotero_key, limit)
    return jsonify({"source_key": zotero_key, "results": results})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_plugin_routes.py::test_similar_returns_results -v
```

Expected: PASSED

- [ ] **Step 5: Commit**

```bash
git add src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add /api/plugin/similar/:key endpoint"
```

---

## Task 5: Author endpoint

**Files:**
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_author_returns_profile(client):
    mock_items = [{"key": "ABC123", "title": "Paper 1", "date": "2022"}]
    mock_coauthors = ["Jane Smith", "Carlos Rojas"]
    with patch("src.api.plugin_routes.get_author_items", return_value=mock_items), \
         patch("src.api.plugin_routes.get_coauthors", return_value=mock_coauthors):
        r = client.get("/api/plugin/author/Bekker%20LG")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert data["author"] == "Bekker LG"
    assert len(data["items"]) == 1
    assert "Jane Smith" in data["coauthors"]
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_plugin_routes.py::test_author_returns_profile -v
```

Expected: FAIL

- [ ] **Step 3: Implement the endpoint**

```python
# Add to src/api/plugin_routes.py

def get_author_items(author_name: str) -> list:
    """Search Zotero library for items by this author."""
    from src.zotero.items import Search_zotero_items
    results = Search_zotero_items(query=author_name, qmode="creator")
    return results if isinstance(results, list) else []


def get_coauthors(author_name: str) -> list:
    """Get co-authors from Neo4j graph, fall back to empty list."""
    try:
        from src.graph.operations import get_coauthors as neo4j_coauthors
        return neo4j_coauthors(author_name)
    except Exception:
        return []


@plugin_bp.route("/author/<path:author_name>", methods=["GET"])
def author(author_name: str):
    items = get_author_items(author_name)
    coauthors = get_coauthors(author_name)
    return jsonify({"author": author_name, "items": items, "coauthors": coauthors})
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_plugin_routes.py::test_author_returns_profile -v
```

Expected: PASSED

- [ ] **Step 5: Commit**

```bash
git add src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add /api/plugin/author/:name endpoint"
```

---

## Task 6: Graph nodes endpoint

**Files:**
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_graph_nodes_structure(client):
    mock_graph = {
        "nodes": [{"id": "ABC123", "title": "Paper 1", "collection": "HIV", "citation_count": 5}],
        "edges": [{"source": "ABC123", "target": "DEF456", "type": "semantic", "weight": 0.91}]
    }
    with patch("src.api.plugin_routes.build_graph_data", return_value=mock_graph):
        r = client.get("/api/plugin/graph/nodes?collection=HIV&threshold=0.7")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert "nodes" in data
    assert "edges" in data
    assert data["nodes"][0]["id"] == "ABC123"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_plugin_routes.py::test_graph_nodes_structure -v
```

Expected: FAIL

- [ ] **Step 3: Implement the endpoint**

```python
# Add to src/api/plugin_routes.py

def build_graph_data(collection: str | None, threshold: float) -> dict:
    """
    Build D3-compatible node/edge graph from Qdrant similarity + Neo4j.
    Returns {"nodes": [...], "edges": [...]}.
    """
    from src.zotero.items import Search_zotero_items, Get_zotero_item
    from src.qdrant.search import SemanticSearch, Search_by_zotero_key

    # Fetch items from Zotero (optionally filtered by collection)
    if collection:
        from src.zotero.collections import Get_collection_items
        items = Get_collection_items(collection_name=collection)
    else:
        items = Search_zotero_items(query="", qmode="everything")[:200]  # cap at 200 nodes

    nodes = []
    for item in items:
        key = item.get("key") or item.get("zotero_key")
        if not key:
            continue
        nodes.append({
            "id": key,
            "title": item.get("title", "Untitled"),
            "collection": item.get("collection", ""),
            "date": item.get("date", ""),
            "creators": item.get("creators", []),
            "citation_count": item.get("numChildren", 0),
            "in_library": True,
        })

    # Build semantic similarity edges
    edges = []
    node_ids = {n["id"] for n in nodes}
    for node in nodes[:50]:  # limit expensive similarity calls
        try:
            similar = Search_by_zotero_key(zotero_key=node["id"], top_k=5)
            for s in similar:
                target = s.get("zotero_key")
                score = s.get("score", 0)
                if target and target != node["id"] and score >= threshold:
                    edges.append({
                        "source": node["id"],
                        "target": target,
                        "type": "semantic",
                        "weight": round(score, 3),
                        "target_in_library": target in node_ids,
                    })
        except Exception:
            continue

    return {"nodes": nodes, "edges": edges}


@plugin_bp.route("/graph/nodes", methods=["GET"])
def graph_nodes():
    collection = request.args.get("collection") or None
    threshold = float(request.args.get("threshold", 0.75))
    threshold = max(0.5, min(1.0, threshold))
    data = build_graph_data(collection, threshold)
    return jsonify(data)
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_plugin_routes.py::test_graph_nodes_structure -v
```

Expected: PASSED

- [ ] **Step 5: Commit**

```bash
git add src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add /api/plugin/graph/nodes endpoint"
```

---

## Task 7: Health and jobs endpoints

**Files:**
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing tests**

```python
# Add to tests/test_plugin_routes.py

def test_library_health(client):
    mock_health = {"indexed": 1204, "unindexed": 43, "failed": 12, "missing_pdf": 27, "issues": []}
    with patch("src.api.plugin_routes.get_library_health", return_value=mock_health):
        r = client.get("/api/plugin/health/library")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert data["indexed"] == 1204
    assert "issues" in data


def test_jobs_list(client):
    mock_jobs = {"pending": [], "processing": None, "failed": [], "completed_count": 1204}
    with patch("src.api.plugin_routes.get_jobs_status", return_value=mock_jobs):
        r = client.get("/api/plugin/jobs")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert "pending" in data
    assert "failed" in data


def test_jobs_retry(client):
    with patch("src.api.plugin_routes.retry_job", return_value={"queued": True}):
        r = client.post("/api/plugin/jobs/abc-123/retry")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert data["queued"] is True
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_plugin_routes.py::test_library_health tests/test_plugin_routes.py::test_jobs_list tests/test_plugin_routes.py::test_jobs_retry -v
```

Expected: all FAIL

- [ ] **Step 3: Implement the endpoints**

```python
# Add to src/api/plugin_routes.py

def get_library_health() -> dict:
    from src.synctracker.health import Get_health_status, Check_sync_health
    stats = Get_health_status()
    issues = Check_sync_health()
    return {
        "indexed": stats.get("synced_count", 0),
        "unindexed": stats.get("pending_count", 0),
        "failed": stats.get("failed_count", 0),
        "missing_pdf": stats.get("missing_pdf_count", 0),
        "issues": issues if isinstance(issues, list) else [],
    }


def get_jobs_status() -> dict:
    from src.jobs_api.queue import Get_queue_status, Get_pending_jobs
    status = Get_queue_status()
    pending = Get_pending_jobs()
    return {
        "pending": pending if isinstance(pending, list) else [],
        "processing": status.get("current_job"),
        "failed": status.get("failed_jobs", []),
        "completed_count": status.get("completed_count", 0),
        "processor_running": status.get("running", False),
    }


def retry_job(job_id: str) -> dict:
    from src.jobs_api.queue import Process_next_job
    Process_next_job(job_id=job_id)
    return {"queued": True, "job_id": job_id}


@plugin_bp.route("/health/library", methods=["GET"])
def library_health():
    return jsonify(get_library_health())


@plugin_bp.route("/jobs", methods=["GET"])
def jobs_list():
    return jsonify(get_jobs_status())


@plugin_bp.route("/jobs/<job_id>/retry", methods=["POST"])
def job_retry(job_id: str):
    result = retry_job(job_id)
    return jsonify(result)
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
pytest tests/test_plugin_routes.py::test_library_health tests/test_plugin_routes.py::test_jobs_list tests/test_plugin_routes.py::test_jobs_retry -v
```

Expected: all PASSED

- [ ] **Step 5: Commit**

```bash
git add src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add /api/plugin/health/library and /api/plugin/jobs endpoints"
```

---

## Task 8: Cascade delete endpoint

**Files:**
- Create: `src/api/cascade_delete.py`
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_cascade_delete(client):
    with patch("src.api.plugin_routes.cascade_delete_item", return_value={"deleted": True, "zotero_key": "ABC123"}):
        r = client.delete("/api/plugin/items/ABC123")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert data["deleted"] is True
    assert data["zotero_key"] == "ABC123"


def test_cascade_delete_missing_key(client):
    with patch("src.api.plugin_routes.cascade_delete_item", side_effect=ValueError("Item not found")):
        r = client.delete("/api/plugin/items/NOTEXIST")
    assert r.status_code == 404
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
pytest tests/test_plugin_routes.py::test_cascade_delete tests/test_plugin_routes.py::test_cascade_delete_missing_key -v
```

Expected: both FAIL

- [ ] **Step 3: Create cascade_delete.py**

```python
# src/api/cascade_delete.py


def cascade_delete_item(zotero_key: str) -> dict:
    """
    Delete an item from all data stores in order:
    1. Qdrant vector chunks
    2. Synctracker PostgreSQL record
    3. Neo4j nodes and edges
    4. Zotero item (last — so we have the key throughout)

    Raises ValueError if item does not exist in Zotero.
    """
    errors = []

    # 1. Delete from Qdrant
    try:
        from src.qdrant.collections import Delete_item_from_qdrant
        Delete_item_from_qdrant(zotero_key=zotero_key)
    except Exception as e:
        errors.append(f"qdrant: {e}")

    # 2. Delete synctracker record
    try:
        from src.synctracker.delete import Delete_sync_record
        Delete_sync_record(zotero_key=zotero_key)
    except Exception as e:
        errors.append(f"synctracker: {e}")

    # 3. Delete Neo4j nodes
    try:
        from src.graph.operations import delete_item_node
        delete_item_node(zotero_key=zotero_key)
    except Exception as e:
        errors.append(f"neo4j: {e}")

    # 4. Delete from Zotero (raises ValueError if not found)
    from src.zotero.delete import Delete_zotero_item
    Delete_zotero_item(zotero_key=zotero_key)

    return {"deleted": True, "zotero_key": zotero_key, "warnings": errors}
```

- [ ] **Step 4: Wire into plugin_routes.py**

```python
# Add to src/api/plugin_routes.py

from src.api.cascade_delete import cascade_delete_item


@plugin_bp.route("/items/<zotero_key>", methods=["DELETE"])
def delete_item(zotero_key: str):
    try:
        result = cascade_delete_item(zotero_key)
        return jsonify(result)
    except ValueError as e:
        return jsonify({"error": str(e)}), 404
```

- [ ] **Step 5: Run tests to verify they pass**

```bash
pytest tests/test_plugin_routes.py::test_cascade_delete tests/test_plugin_routes.py::test_cascade_delete_missing_key -v
```

Expected: both PASSED

- [ ] **Step 6: Commit**

```bash
git add src/api/cascade_delete.py src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add cascade delete endpoint DELETE /api/plugin/items/:key"
```

---

## Task 9: Chat SSE streaming endpoint

**Files:**
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_chat_stream_returns_sse(client):
    def mock_stream(zotero_key, question, max_chunks):
        yield "data: {\"token\": \"The \"}\n\n"
        yield "data: {\"token\": \"answer\"}\n\n"
        yield "data: {\"done\": true, \"sources\": [{\"page\": 4}]}\n\n"

    with patch("src.api.plugin_routes.stream_chat", return_value=mock_stream("k", "q", 8)):
        r = client.post(
            "/api/plugin/chat/stream",
            json={"zotero_key": "ABC123", "question": "What are the barriers?", "max_chunks": 8}
        )
    assert r.status_code == 200
    assert r.content_type == "text/event-stream; charset=utf-8"
    body = r.data.decode()
    assert "token" in body
    assert "done" in body
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_plugin_routes.py::test_chat_stream_returns_sse -v
```

Expected: FAIL

- [ ] **Step 3: Implement the SSE chat endpoint**

```python
# Add to src/api/plugin_routes.py
import json as _json
from flask import Response, stream_with_context


def stream_chat(zotero_key: str, question: str, max_chunks: int = 8):
    """
    Generator yielding SSE-formatted strings.
    Wraps the existing documents.chat() function.
    Each yield: "data: <json>\n\n"
    Final yield: "data: {\"done\": true, \"sources\": [...]}\n\n"
    """
    from src.documents.chat import chat_with_document
    try:
        result = chat_with_document(
            zotero_key=zotero_key,
            question=question,
            max_chunks=max_chunks,
            stream=True,
        )
        # If result is a generator (streaming), yield tokens
        if hasattr(result, "__iter__") and not isinstance(result, str):
            sources = []
            for chunk in result:
                if isinstance(chunk, dict):
                    if "token" in chunk:
                        yield f"data: {_json.dumps({'token': chunk['token']})}\n\n"
                    if "sources" in chunk:
                        sources = chunk["sources"]
                elif isinstance(chunk, str):
                    yield f"data: {_json.dumps({'token': chunk})}\n\n"
            yield f"data: {_json.dumps({'done': True, 'sources': sources})}\n\n"
        else:
            # Non-streaming fallback: emit whole answer as one token
            answer = result if isinstance(result, str) else str(result)
            yield f"data: {_json.dumps({'token': answer})}\n\n"
            yield f"data: {_json.dumps({'done': True, 'sources': []})}\n\n"
    except Exception as e:
        yield f"data: {_json.dumps({'error': str(e)})}\n\n"


@plugin_bp.route("/chat/stream", methods=["POST"])
def chat_stream():
    body = request.get_json(force=True) or {}
    zotero_key = body.get("zotero_key", "")
    question = body.get("question", "")
    max_chunks = int(body.get("max_chunks", 8))

    if not zotero_key or not question:
        return jsonify({"error": "zotero_key and question required"}), 400

    return Response(
        stream_with_context(stream_chat(zotero_key, question, max_chunks)),
        content_type="text/event-stream; charset=utf-8",
        headers={"X-Accel-Buffering": "no", "Cache-Control": "no-cache"},
    )
```

- [ ] **Step 4: Run test to verify it passes**

```bash
pytest tests/test_plugin_routes.py::test_chat_stream_returns_sse -v
```

Expected: PASSED

- [ ] **Step 5: Commit**

```bash
git add src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add POST /api/plugin/chat/stream SSE endpoint"
```

---

## Task 10: Discovery endpoint (PubMed + Semantic Scholar + OpenAlex)

**Files:**
- Create: `src/api/discovery.py`
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_discovery_pubmed(client):
    mock_results = [
        {"title": "PrEP in MSM", "authors": ["Smith J"], "journal": "Lancet", "year": "2023",
         "doi": "10.1000/xyz", "source": "pubmed", "pmid": "12345678"}
    ]
    with patch("src.api.plugin_routes.discovery_search", return_value=mock_results):
        r = client.get("/api/plugin/discovery/search?q=PrEP+MSM&sources=pubmed")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert len(data["results"]) == 1
    assert data["results"][0]["source"] == "pubmed"
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_plugin_routes.py::test_discovery_pubmed -v
```

Expected: FAIL

- [ ] **Step 3: Create discovery.py**

```python
# src/api/discovery.py
import requests


PUBMED_SEARCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esearch.fcgi"
PUBMED_FETCH_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils/esummary.fcgi"
SEMANTIC_SCHOLAR_URL = "https://api.semanticscholar.org/graph/v1/paper/search"
OPENALEX_URL = "https://api.openalex.org/works"


def search_pubmed(query: str, limit: int = 10) -> list:
    # Step 1: get PMIDs
    search_resp = requests.get(PUBMED_SEARCH_URL, params={
        "db": "pubmed", "term": query, "retmax": limit, "retmode": "json"
    }, timeout=10)
    search_resp.raise_for_status()
    ids = search_resp.json().get("esearchresult", {}).get("idlist", [])
    if not ids:
        return []

    # Step 2: fetch summaries
    summary_resp = requests.get(PUBMED_FETCH_URL, params={
        "db": "pubmed", "id": ",".join(ids), "retmode": "json"
    }, timeout=10)
    summary_resp.raise_for_status()
    result_data = summary_resp.json().get("result", {})

    results = []
    for pmid in ids:
        item = result_data.get(pmid, {})
        authors = [a.get("name", "") for a in item.get("authors", [])]
        results.append({
            "title": item.get("title", ""),
            "authors": authors,
            "journal": item.get("fulljournalname", ""),
            "year": item.get("pubdate", "")[:4],
            "doi": item.get("elocationid", ""),
            "source": "pubmed",
            "pmid": pmid,
        })
    return results


def search_semantic_scholar(query: str, limit: int = 10) -> list:
    resp = requests.get(SEMANTIC_SCHOLAR_URL, params={
        "query": query, "limit": limit,
        "fields": "title,authors,year,venue,externalIds"
    }, timeout=10)
    resp.raise_for_status()
    papers = resp.json().get("data", [])
    results = []
    for p in papers:
        results.append({
            "title": p.get("title", ""),
            "authors": [a.get("name", "") for a in p.get("authors", [])],
            "journal": p.get("venue", ""),
            "year": str(p.get("year", "")),
            "doi": p.get("externalIds", {}).get("DOI", ""),
            "source": "semantic_scholar",
            "s2_id": p.get("paperId", ""),
        })
    return results


def search_openalex(query: str, limit: int = 10) -> list:
    resp = requests.get(OPENALEX_URL, params={
        "search": query, "per-page": limit,
        "select": "title,authorships,publication_year,primary_location,doi"
    }, timeout=10)
    resp.raise_for_status()
    works = resp.json().get("results", [])
    results = []
    for w in works:
        authors = [
            a.get("author", {}).get("display_name", "")
            for a in w.get("authorships", [])
        ]
        results.append({
            "title": w.get("title", ""),
            "authors": authors,
            "journal": (w.get("primary_location") or {}).get("source", {}).get("display_name", ""),
            "year": str(w.get("publication_year", "")),
            "doi": w.get("doi", ""),
            "source": "openalex",
        })
    return results


def discovery_search(query: str, sources: list[str], limit: int = 10) -> list:
    """Search across requested sources and merge results."""
    results = []
    for source in sources:
        try:
            if source == "pubmed":
                results.extend(search_pubmed(query, limit))
            elif source == "semantic_scholar":
                results.extend(search_semantic_scholar(query, limit))
            elif source == "openalex":
                results.extend(search_openalex(query, limit))
        except Exception as e:
            # Log but don't crash — partial results are better than none
            print(f"Discovery source {source} failed: {e}")
    return results
```

- [ ] **Step 4: Wire into plugin_routes.py**

```python
# Add to src/api/plugin_routes.py

from src.api.discovery import discovery_search


@plugin_bp.route("/discovery/search", methods=["GET"])
def discovery():
    q = request.args.get("q", "").strip()
    if not q:
        return jsonify({"error": "q parameter required"}), 400
    sources_param = request.args.get("sources", "pubmed,semantic_scholar")
    sources = [s.strip() for s in sources_param.split(",") if s.strip()]
    limit = min(int(request.args.get("limit", 10)), 25)
    results = discovery_search(q, sources, limit)
    return jsonify({"query": q, "sources": sources, "results": results})
```

- [ ] **Step 5: Run test to verify it passes**

```bash
pytest tests/test_plugin_routes.py::test_discovery_pubmed -v
```

Expected: PASSED

- [ ] **Step 6: Run full test suite**

```bash
pytest tests/test_plugin_routes.py -v
```

Expected: all PASSED

- [ ] **Step 7: Commit**

```bash
git add src/api/discovery.py src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add /api/plugin/discovery/search with PubMed, Semantic Scholar, OpenAlex"
```

---

## Task 11: Manual sync endpoint

**Files:**
- Modify: `src/api/plugin_routes.py`
- Modify: `tests/test_plugin_routes.py`

- [ ] **Step 1: Write the failing test**

```python
# Add to tests/test_plugin_routes.py

def test_sync_trigger(client):
    with patch("src.api.plugin_routes.trigger_sync", return_value={"queued": 43, "already_synced": 1204}):
        r = client.post("/api/plugin/sync")
    assert r.status_code == 200
    data = json.loads(r.data)
    assert "queued" in data
```

- [ ] **Step 2: Run test to verify it fails**

```bash
pytest tests/test_plugin_routes.py::test_sync_trigger -v
```

Expected: FAIL

- [ ] **Step 3: Implement the endpoint**

```python
# Add to src/api/plugin_routes.py

def trigger_sync() -> dict:
    """Queue all unindexed items for indexing."""
    from src.jobs_api.indexing import Batch_index_unindexed_items
    result = Batch_index_unindexed_items()
    return result if isinstance(result, dict) else {"queued": 0}


@plugin_bp.route("/sync", methods=["POST"])
def sync_trigger():
    result = trigger_sync()
    return jsonify(result)
```

- [ ] **Step 4: Run all tests**

```bash
pytest tests/test_plugin_routes.py -v
```

Expected: all PASSED

- [ ] **Step 5: Commit**

```bash
git add src/api/plugin_routes.py tests/test_plugin_routes.py
git commit -m "feat: add POST /api/plugin/sync endpoint"
```

---

## Verification

```bash
# Start server
cd /Users/danilodasilva/Documents/Programming/mcp-servers/mcp-zotero-qdrant
python main.py &

# Run all plugin route tests
pytest tests/test_plugin_routes.py -v

# Smoke test each endpoint manually
curl -s http://localhost:6500/api/plugin/health | python -m json.tool
curl -s "http://localhost:6500/api/plugin/search?q=PrEP+MSM" | python -m json.tool
curl -s "http://localhost:6500/api/plugin/health/library" | python -m json.tool
curl -s "http://localhost:6500/api/plugin/jobs" | python -m json.tool
curl -s "http://localhost:6500/api/plugin/graph/nodes?threshold=0.8" | python -m json.tool
curl -s "http://localhost:6500/api/plugin/discovery/search?q=PrEP+adherence&sources=pubmed" | python -m json.tool
```
