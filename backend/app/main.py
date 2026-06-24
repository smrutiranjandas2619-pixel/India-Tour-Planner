import os
import sys

# Ensure backend directory is in sys.path so app module is discoverable
base_dir = os.path.dirname(os.path.abspath(__file__))
backend_dir = os.path.abspath(os.path.join(base_dir, ".."))
if backend_dir not in sys.path:
    sys.path.insert(0, backend_dir)

# Auto-cleanup old redundant files from backend root folder
try:
    for filename in ["diagnose.py", "verify_key.py", "run_tunnel.js", "package.json", "package-lock.json", "localtunnel.log", "out.txt", "error_log.txt"]:
        file_to_del = os.path.join(backend_dir, filename)
        if os.path.exists(file_to_del):
            os.remove(file_to_del)
    
    node_modules_path = os.path.join(backend_dir, "node_modules")
    if os.path.exists(node_modules_path):
        import shutil
        shutil.rmtree(node_modules_path, ignore_errors=True)
except Exception:
    pass

# Custom lightweight .env parser to avoid extra dependency issues
def load_env():
    base_dir = os.path.dirname(os.path.abspath(__file__))
    env_path = os.path.abspath(os.path.join(base_dir, "../.env"))
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                stripped = line.strip()
                if stripped and "=" in stripped and not stripped.startswith("#"):
                    k, v = stripped.split("=", 1)
                    os.environ[k.strip()] = v.strip()

load_env()

from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse, FileResponse
from fastapi.staticfiles import StaticFiles
from starlette.middleware.sessions import SessionMiddleware
from starlette.middleware.cors import CORSMiddleware

from app.core.database import init_db
from app.api.auth_routes import router as auth_router
from app.api.trip_routes import router as trip_router
from app.api.budget_routes import router as budget_router
from app.api.rag_routes import router as rag_router
from app.api.food_routes import router as food_router
from app.api.vehicle_routes import router as vehicle_router
from app.api.hotel_routes import router as hotel_router

# Initialize tables safely (non-blocking on startup locks)
try:
    init_db()
except Exception as db_err:
    print(f"Database initialization warning (possibly locked): {db_err}")

app = FastAPI(title="India Tour Planner", version="2.0.0")

# Session management middleware (thread-safe secure cookie session storage)
app.add_middleware(
    SessionMiddleware,
    secret_key="india_tour_planner_super_secret_session_signing_key_2026",
    max_age=86400 * 7 # 7 Days
)

# CORS middleware for modular developments
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

import traceback
@app.middleware("http")
async def catch_exceptions_middleware(request: Request, call_next):
    try:
        return await call_next(request)
    except Exception as e:
        base_dir = os.path.dirname(os.path.abspath(__file__))
        log_dir = os.path.abspath(os.path.join(base_dir, "../logs"))
        os.makedirs(log_dir, exist_ok=True)
        log_path = os.path.join(log_dir, "error_log.txt")
        with open(log_path, "w", encoding="utf-8") as f:
            traceback.print_exc(file=f)
        raise e


# Register routers
app.include_router(auth_router)
app.include_router(trip_router)
app.include_router(budget_router)
app.include_router(rag_router)
app.include_router(food_router)
app.include_router(vehicle_router)
app.include_router(hotel_router)

# Mount frontend build static directory
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
FRONTEND_DIST_DIR = os.path.abspath(os.path.join(BASE_DIR, "../../frontend/dist"))

if os.path.exists(FRONTEND_DIST_DIR):
    # Mount assets folder specifically
    app.mount("/assets", StaticFiles(directory=os.path.join(FRONTEND_DIST_DIR, "assets")), name="assets")

@app.get("/db-inspector", response_class=HTMLResponse)
async def db_inspector(request: Request):
    """
    Renders an interactive database structure and data viewer directly in Chrome.
    """
    import json
    from app.core.database import get_db_connection
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        
        # Get user tables
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
        tables = [row['name'] for row in cursor.fetchall()]
        
        db_data = {}
        for table in tables:
            # Columns metadata
            cursor.execute(f"PRAGMA table_info({table});")
            columns = [dict(col) for col in cursor.fetchall()]
            
            # Row count
            cursor.execute(f"SELECT COUNT(*) as count FROM {table};")
            count = cursor.fetchone()['count']
            
            # Retrieve rows
            cursor.execute(f"SELECT * FROM {table} LIMIT 25;")
            rows = [dict(row) for row in cursor.fetchall()]
            
            db_data[table] = {
                "columns": columns,
                "count": count,
                "rows": rows
            }
        conn.close()
    except Exception as e:
        return f"""
        <html>
            <head><title>Database Inspector Error</title></head>
            <body style="background-color: #0b0f19; color: #ef4444; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
                <div style="background: rgba(239, 68, 68, 0.05); border: 1px solid rgba(239, 68, 68, 0.2); padding: 2rem; border-radius: 1rem; text-align: center;">
                    <h2>Database Connection Error</h2>
                    <p style="color: #9ca3af; margin-top: 0.5rem;">{str(e)}</p>
                </div>
            </body>
        </html>
        """

    # Generate HTML
    html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Database Inspector - India Tour Planner</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
    <style>
        :root {{
            --bg-color: #080b11;
            --card-bg: rgba(15, 22, 36, 0.8);
            --border-color: rgba(255, 255, 255, 0.08);
            --primary: #8b5cf6;
            --primary-glow: rgba(139, 92, 246, 0.15);
            --accent: #06b6d4;
            --text-main: #f3f4f6;
            --text-muted: #94a3b8;
            --success: #10b981;
            --warning: #f59e0b;
        }}
        
        * {{
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }}
        
        body {{
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.12) 0px, transparent 45%),
                radial-gradient(at 100% 100%, rgba(6, 182, 212, 0.08) 0px, transparent 45%);
            color: var(--text-main);
            font-family: 'Outfit', sans-serif;
            min-height: 100vh;
            padding: 2.5rem;
            line-height: 1.5;
        }}

        .container {{
            max-width: 1400px;
            margin: 0 auto;
        }}

        header {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 2.5rem;
            border-bottom: 1px solid var(--border-color);
            padding-bottom: 1.5rem;
        }}

        .logo-section h1 {{
            font-size: 2.2rem;
            font-weight: 700;
            background: linear-gradient(135deg, #a78bfa 0%, #06b6d4 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            letter-spacing: -0.5px;
            display: flex;
            align-items: center;
            gap: 0.75rem;
        }}

        .logo-section p {{
            color: var(--text-muted);
            font-size: 0.95rem;
            margin-top: 0.25rem;
        }}

        .db-status {{
            display: flex;
            align-items: center;
            gap: 0.5rem;
            background: rgba(16, 185, 129, 0.1);
            border: 1px solid rgba(16, 185, 129, 0.2);
            padding: 0.5rem 1rem;
            border-radius: 9999px;
            color: var(--success);
            font-size: 0.875rem;
            font-weight: 500;
        }}

        .db-status .dot {{
            width: 8px;
            height: 8px;
            background-color: var(--success);
            border-radius: 50%;
            box-shadow: 0 0 8px var(--success);
        }}

        .grid {{
            display: grid;
            grid-template-columns: 1fr;
            gap: 2rem;
        }}

        @media (min-width: 1024px) {{
            .grid {{
                grid-template-columns: 320px 1fr;
            }}
        }}

        .sidebar {{
            display: flex;
            flex-direction: column;
            gap: 1.5rem;
        }}

        .card {{
            background: var(--card-bg);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            border: 1px solid var(--border-color);
            border-radius: 1.25rem;
            padding: 1.5rem;
            box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.3);
            transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }}

        .card:hover {{
            border-color: rgba(139, 92, 246, 0.3);
            box-shadow: 0 10px 30px -10px var(--primary-glow);
        }}

        .card-title {{
            font-size: 1.2rem;
            font-weight: 600;
            margin-bottom: 1.25rem;
            display: flex;
            align-items: center;
            justify-content: space-between;
            color: #fff;
        }}

        .badge {{
            background: var(--primary-glow);
            color: #c084fc;
            border: 1px solid rgba(192, 132, 252, 0.25);
            padding: 0.2rem 0.6rem;
            border-radius: 0.5rem;
            font-size: 0.75rem;
            font-weight: 600;
        }}

        .table-list {{
            list-style: none;
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }}

        .table-item-btn {{
            width: 100%;
            background: rgba(255, 255, 255, 0.02);
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            padding: 0.95rem 1.2rem;
            color: var(--text-main);
            font-family: inherit;
            font-size: 0.95rem;
            font-weight: 500;
            text-align: left;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: space-between;
            transition: all 0.2s ease;
        }}

        .table-item-btn:hover, .table-item-btn.active {{
            background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(6, 182, 212, 0.08) 100%);
            border-color: var(--primary);
            box-shadow: 0 0 15px var(--primary-glow);
            color: #fff;
        }}

        .table-item-btn .row-count {{
            font-size: 0.8rem;
            color: var(--text-muted);
            background: rgba(255, 255, 255, 0.05);
            padding: 0.15rem 0.5rem;
            border-radius: 6px;
            border: 1px solid rgba(255,255,255,0.05);
        }}

        .main-content {{
            display: flex;
            flex-direction: column;
            gap: 2rem;
        }}

        .table-details {{
            display: none;
        }}

        .table-details.active {{
            display: block;
            animation: fadeIn 0.4s cubic-bezier(0.16, 1, 0.3, 1);
        }}

        @keyframes fadeIn {{
            from {{ opacity: 0; transform: translateY(12px); }}
            to {{ opacity: 1; transform: translateY(0); }}
        }}

        .section-header {{
            font-size: 1.35rem;
            font-weight: 600;
            margin-bottom: 1.25rem;
            color: #fff;
            display: flex;
            align-items: center;
            gap: 0.5rem;
            border-left: 3px solid var(--primary);
            padding-left: 0.75rem;
        }}

        .schema-table {{
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 2rem;
            overflow: hidden;
            border-radius: 0.75rem;
            border: 1px solid var(--border-color);
            background: rgba(15, 22, 36, 0.3);
        }}

        .schema-table th, .schema-table td {{
            padding: 1rem 1.25rem;
            text-align: left;
        }}

        .schema-table th {{
            background: rgba(255, 255, 255, 0.03);
            color: #fff;
            font-weight: 600;
            font-size: 0.9rem;
            border-bottom: 1px solid var(--border-color);
        }}

        .schema-table td {{
            border-bottom: 1px solid var(--border-color);
            color: var(--text-main);
            font-size: 0.9rem;
        }}

        .schema-table tr:last-child td {{
            border-bottom: none;
        }}

        .type-badge {{
            font-family: 'JetBrains Mono', monospace;
            background: rgba(6, 182, 212, 0.08);
            color: #22d3ee;
            border: 1px solid rgba(6, 182, 212, 0.15);
            padding: 0.15rem 0.45rem;
            border-radius: 6px;
            font-size: 0.8rem;
        }}

        .pk-badge {{
            background: rgba(245, 158, 11, 0.1);
            color: #fbbf24;
            border: 1px solid rgba(245, 158, 11, 0.2);
            padding: 0.15rem 0.45rem;
            border-radius: 6px;
            font-size: 0.8rem;
            font-weight: 500;
        }}

        .nn-badge {{
            background: rgba(239, 68, 68, 0.08);
            color: #fca5a5;
            border: 1px solid rgba(239, 68, 68, 0.15);
            padding: 0.15rem 0.45rem;
            border-radius: 6px;
            font-size: 0.8rem;
        }}

        .data-table-container {{
            width: 100%;
            overflow-x: auto;
            border: 1px solid var(--border-color);
            border-radius: 0.75rem;
            background: rgba(15, 22, 36, 0.3);
            margin-bottom: 1rem;
        }}

        .data-table {{
            width: 100%;
            border-collapse: collapse;
            font-size: 0.875rem;
        }}

        .data-table th, .data-table td {{
            padding: 1rem 1.25rem;
            text-align: left;
        }}

        .data-table th {{
            background: rgba(255, 255, 255, 0.03);
            border-bottom: 1px solid var(--border-color);
            color: #fff;
            font-weight: 600;
            white-space: nowrap;
        }}

        .data-table td {{
            border-bottom: 1px solid var(--border-color);
            color: var(--text-main);
            max-width: 280px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }}

        .data-table tr:hover td {{
            background: rgba(255, 255, 255, 0.02);
        }}

        .json-cell {{
            font-family: 'JetBrains Mono', monospace;
            font-size: 0.8rem;
            color: #c084fc;
            background: rgba(192, 132, 252, 0.05);
            border: 1px solid rgba(192, 132, 252, 0.12);
            padding: 0.25rem 0.5rem;
            border-radius: 6px;
            cursor: pointer;
            display: inline-block;
            max-width: 240px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
        }}

        .json-cell:hover {{
            background: rgba(192, 132, 252, 0.1);
            border-color: rgba(192, 132, 252, 0.3);
        }}

        .no-data {{
            padding: 4rem;
            text-align: center;
            color: var(--text-muted);
            font-size: 0.95rem;
            border: 1px dashed var(--border-color);
            border-radius: 0.75rem;
            background: rgba(255,255,255,0.01);
        }}

        .no-data-icon {{
            font-size: 2.5rem;
            margin-bottom: 0.75rem;
            display: block;
        }}
    </style>
</head>
<body>
    <div class="container">
        <header>
            <div class="logo-section">
                <h1>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="color: #a78bfa;"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"></path><path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3"></path></svg>
                    Database Inspector
                </h1>
                <p>Interactive schema analyzer and data viewer for SQLite database</p>
            </div>
            <div class="db-status">
                <div class="dot"></div>
                SQLite Connected
            </div>
        </header>

        <div class="grid">
            <!-- Sidebar -->
            <div class="sidebar">
                <div class="card">
                    <div class="card-title">
                        Tables
                        <span class="badge">{len(tables)} active</span>
                    </div>
                    <ul class="table-list">
                        """
    
    # Render sidebar list
    for idx, table in enumerate(tables):
        active_class = "active" if idx == 0 else ""
        row_count = db_data[table]["count"]
        html_content += f"""
                        <li>
                            <button class="table-item-btn {active_class}" id="btn-{table}" onclick="showTable('{table}')">
                                <span>📊 &nbsp;{table}</span>
                                <span class="row-count">{row_count} rows</span>
                            </button>
                        </li>
        """

    html_content += """
                    </ul>
                </div>
            </div>

            <!-- Main Content Pane -->
            <div class="main-content">
    """

    # Render details page for each table
    for idx, table in enumerate(tables):
        active_class = "active" if idx == 0 else ""
        table_info = db_data[table]
        
        html_content += f"""
                <div class="table-details {active_class}" id="details-{table}">
                    <div class="card" style="margin-bottom: 2rem;">
                        <h2 class="section-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>
                            Table Schema: {table}
                        </h2>
                        <table class="schema-table">
                            <thead>
                                <tr>
                                    <th>Field / Column</th>
                                    <th>Data Type</th>
                                    <th>Primary Key</th>
                                    <th>Not Null</th>
                                    <th>Default Value</th>
                                </tr>
                            </thead>
                            <tbody>
        """

        # Populate schema rows
        for col in table_info["columns"]:
            pk_badge = '<span class="pk-badge">🔑 Primary Key</span>' if col["pk"] else '<span style="color: var(--text-muted)">-</span>'
            nn_badge = '<span class="nn-badge">⚠️ NOT NULL</span>' if col["notnull"] else '<span style="color: var(--text-muted)">Nullable</span>'
            def_val = f"<code>{col['dflt_value']}</code>" if col["dflt_value"] is not None else '<span style="color: var(--text-muted)">None</span>'
            
            html_content += f"""
                                <tr>
                                    <td style="font-weight: 600; color: #fff;">{col['name']}</td>
                                    <td><span class="type-badge">{col['type']}</span></td>
                                    <td>{pk_badge}</td>
                                    <td>{nn_badge}</td>
                                    <td>{def_val}</td>
                                </tr>
            """

        html_content += f"""
                            </tbody>
                        </table>
                    </div>

                    <div class="card">
                        <h2 class="section-header">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect><line x1="9" y1="3" x2="9" y2="21"></line><line x1="15" y1="3" x2="15" y2="21"></line><line x1="3" y1="9" x2="21" y2="9"></line><line x1="3" y1="15" x2="21" y2="15"></line></svg>
                            Data Preview (First 25 Rows)
                        </h2>
        """

        # Populate data rows
        if not table_info["rows"]:
            html_content += """
                        <div class="no-data">
                            <span class="no-data-icon">📁</span>
                            This table is currently empty or has no records to display.
                        </div>
            """
        else:
            html_content += """
                        <div class="data-table-container">
                            <table class="data-table">
                                <thead>
                                    <tr>
            """
            
            # Print table headers
            headers = [col["name"] for col in table_info["columns"]]
            for header in headers:
                html_content += f"<th>{header}</th>"
            
            html_content += """
                                    </tr>
                                </thead>
                                <tbody>
            """

            # Print data cell by cell
            for row in table_info["rows"]:
                html_content += "<tr>"
                for header in headers:
                    val = row[header]
                    if val is None:
                        display_val = '<span style="color: var(--text-muted); font-style: italic;">NULL</span>'
                    elif header in ['cost_breakdown'] or (isinstance(val, str) and (val.startswith('{') or val.startswith('['))):
                        # Clean JSON render preview
                        try:
                            json.loads(val)
                            escaped_val = val.replace('"', '&quot;').replace('\'', '&apos;')
                            display_val = f'<span class="json-cell" title="{escaped_val}">{val}</span>'
                        except Exception:
                            display_val = val
                    else:
                        display_val = str(val)
                    escaped_title = str(val).replace('\'', '&apos;').replace('\"', '&quot;')
                    html_content += f"<td title='{escaped_title}'>{display_val}</td>"
                html_content += "</tr>"

            html_content += """
                                </tbody>
                            </table>
                        </div>
            """

        html_content += """
                    </div>
                </div>
        """

    html_content += """
            </div>
        </div>
    </div>

    <script>
        function showTable(tableName) {
            document.querySelectorAll('.table-details').forEach(el => el.classList.remove('active'));
            document.querySelectorAll('.table-item-btn').forEach(el => el.classList.remove('active'));
            
            const details = document.getElementById('details-' + tableName);
            const btn = document.getElementById('btn-' + tableName);
            if (details) details.classList.add('active');
            if (btn) btn.classList.add('active');
        }
    </script>
</body>
</html>
    """

    return html_content

@app.get("/{full_path:path}", response_class=HTMLResponse)
async def serve_react_frontend(request: Request, full_path: str):
    """
    Serves static files in the React distribution folder.
    Falls back to index.html for client-side routing compatibility (React Router).
    """
    # Exclude API endpoints from routing fallback
    if full_path.startswith("api/"):
        return {"detail": "API Route Not Found"}
        
    # If a specific static file is requested (like favicon.ico or public assets) and exists, serve it
    if full_path:
        file_path = os.path.join(FRONTEND_DIST_DIR, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
            
    index_file = os.path.join(FRONTEND_DIST_DIR, "index.html")
    if os.path.exists(index_file):
        return FileResponse(index_file)
        
    return """
    <html>
        <head><title>India Tour Planner - Core Backend</title></head>
        <body style="background-color: #080b11; color: white; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center;">
            <div>
                <h1 style="color: #ff6b6b; font-size: 3rem; margin-bottom: 0.5rem;">Core API Server Active</h1>
                <p style="color: #94a3b8; font-size: 1rem;">FastAPI modular endpoints are operating correctly.</p>
                <div style="background-color: #0f1622; padding: 1.5rem; border-radius: 1rem; border: 1px solid rgba(255,255,255,0.06); font-family: monospace; display: inline-block; margin-top: 1rem;">
                    Vite frontend build is pending. Call npm run build inside /frontend to load UI views.
                </div>
            </div>
        </body>
    </html>
    """

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)

