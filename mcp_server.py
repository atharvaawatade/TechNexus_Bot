import os
import logging
from fastapi import FastAPI, Request, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from database import get_events, search_events
from models.event import Event
from datetime import datetime
import google.generativeai as genai
from dotenv import load_dotenv

# Load .env file early, especially for API keys needed at module level if any
load_dotenv()

app = FastAPI()

# --- CORS Configuration --- #
# Allow all origins for local development, restrict in production if needed
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"], # Allows all methods (GET, POST, etc.)
    allow_headers=["*"], # Allows all headers
)

# Mount static files directory
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Gemini Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
if not GEMINI_API_KEY:
    logger.warning("GEMINI_API_KEY environment variable not found. Chat functionality will be disabled.")
    genai.configure(api_key="DUMMY_KEY") 
else:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        logger.info("Gemini API Key loaded and configured.")
    except Exception as e:
        logger.error(f"Failed to configure Gemini API: {e}")
        GEMINI_API_KEY = None 

# Define the model name (Using a reliable identifier)
GEMINI_MODEL_NAME = "gemini-2.0-flash"

# --- Helper Function to Format Events for LLM --- #
def format_events_for_llm(events: list[Event]) -> str:
    if not events:
        return "No events found in the database."
    
    formatted_list = []
    for i, event in enumerate(events):
        formatted_list.append(
            f"Event {i+1}:\n"
            f"  Name: {event.name}\n"
            f"  Start Date: {event.start_date.strftime('%Y-%m-%d')}\n"
            f"  End Date: {event.end_date.strftime('%Y-%m-%d')}\n"
            f"  Location: {event.location}\n"
            f"  Description: {event.description}\n"
            f"  Registration Link: {event.registration_link}\n"
        )
    return "\n".join(formatted_list)

# --- API Endpoints --- #

# Serve index.html at the root URL
@app.get("/", response_class=HTMLResponse)
async def read_index():
    with open("index.html", "r") as f:
        html_content = f.read()
    return html_content

# Health check endpoint
@app.get("/health")
async def health():
    return {"status": "ok"}

# Chat endpoint to handle user queries using Gemini LLM
@app.post("/chat")
async def chat(request: Request):
    if not GEMINI_API_KEY:
        logger.error("Chat request received but GEMINI_API_KEY is not configured.")
        raise HTTPException(status_code=503, detail="Chat service is unavailable due to server configuration error.")

    try:
        data = await request.json()
        user_query = data.get("query")
        if not user_query:
            raise HTTPException(status_code=400, detail="'query' field is required.")
        
        logger.info(f"Received chat query: {user_query}")

        # 1. Fetch ALL events from the database
        logger.info("Fetching all events for LLM context...")
        all_events = get_events()
        event_context = format_events_for_llm(all_events)
        logger.info(f"Providing {len(all_events)} events as context to LLM.")

        # 2. Construct the prompt
        system_prompt = (f"""You are an assistant designed to answer questions about tech events. 
Use ONLY the event data provided below to answer the user's query. 
Do NOT use any external knowledge or information you were trained on. 
If the answer cannot be found in the provided data, say 'I cannot answer that based on the provided event data.'

When listing events, format them concisely. 
For example:
- Event Name (Start Date: YYYY-MM-DD, End Date: YYYY-MM-DD, Location)

**IMPORTANT**: Do NOT include conversational filler like 'Here are the events...' or 'Based on the data...'. Just provide the direct answer or list.""")

        full_prompt = f"{system_prompt}\n\n--- Event Data ---\n{event_context}\n\n--- User Query ---\n{user_query}"

        # 3. Initialize Gemini model and generate response
        logger.info(f"Sending request to Gemini model: {GEMINI_MODEL_NAME}")
        model = genai.GenerativeModel(GEMINI_MODEL_NAME)
        
        response = model.generate_content(full_prompt)

        llm_response_text = response.text
        logger.info(f"Received response from Gemini: {llm_response_text[:200]}...") 

        return {"response": llm_response_text}

    except Exception as e:
        logger.error(f"Error processing chat request: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process chat request: {str(e)}")

# API endpoint to get all events
@app.get("/api/events")
async def get_events_api():
    logger.info("Request received for /api/events")
    try:
        events = get_events()
        logger.info(f"Returning {len(events)} events.")
        return [
            {
                **event.__dict__,
                'start_date': event.start_date.isoformat(),
                'end_date': event.end_date.isoformat()
            }
            for event in events
        ]
    except Exception as e:
        logger.error(f"Error fetching events: {e}", exc_info=True)
        return {"error": "Failed to fetch events"}

# API endpoint to search events
@app.get("/api/search")
async def search_events_api(keyword: str):
    logger.info(f"Request received for /api/search with keyword: {keyword}")
    try:
        events = search_events(keyword)
        logger.info(f"Found {len(events)} events matching '{keyword}'.")
        return [
            {
                **event.__dict__,
                'start_date': event.start_date.isoformat(),
                'end_date': event.end_date.isoformat()
            }
            for event in events
        ]
    except Exception as e:
        logger.error(f"Error searching events for '{keyword}': {e}", exc_info=True)
        return {"error": f"Failed to search events for '{keyword}'"}

if __name__ == "__main__":
    import uvicorn

    host = os.getenv("HOST", "127.0.0.1")
    port = int(os.getenv("PORT", 8000))

    mongo_uri = os.getenv("MONGO_URI")
    if not mongo_uri:
        logger.warning("MONGO_URI environment variable not found. Database connection might fail.")
    else:
        logger.info(f"MONGO_URI loaded (partially masked): {mongo_uri[:15]}...{mongo_uri[-5:]}")
    
    if not GEMINI_API_KEY:
         logger.warning("Uvicorn starting, but GEMINI_API_KEY is missing or failed to configure. Chat endpoint will return errors.")
    else:
         logger.info("Uvicorn starting with Gemini API Key configured.")

    logger.info(f"Starting Uvicorn server on {host}:{port}")
    uvicorn.run("mcp_server:app", host=host, port=port, reload=True) 