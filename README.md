# TechNexus Bot

This project provides a simple web interface to browse tech events (like hackathons) and interact with a Gemini LLM to ask questions about the events.

## Features

*   Displays a list of upcoming tech events fetched from a MongoDB database.
*   Allows searching events by keyword.
*   Integrates Google Gemini LLM (gemini-1.5-flash-latest) via a chat interface to answer questions based *only* on the displayed event data.
*   FastAPI backend serving a simple HTML/CSS/JS frontend.

## Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/atharvaawatade/TechNexus_Bot.git
    cd TechNexus_Bot
    ```

2.  **Install dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

3.  **Create `.env` file:**
    Create a file named `.env` in the project root directory (`mcp_server`) and add your credentials:
    ```dotenv
    GEMINI_API_KEY=YOUR_GOOGLE_GEMINI_API_KEY
    MONGO_URI=YOUR_MONGODB_CONNECTION_STRING
    ```

## Running the Server

```bash
python mcp_server.py
```

The server will start on `http://127.0.0.1:8000` by default.

## Deployment

A `vercel.json` file is included for potential deployment on Vercel.

## Project Structure

*   `mcp_server.py`: Main FastAPI application file.
*   `index.html`: Frontend HTML, CSS, and JavaScript.
*   `database.py`: Functions for interacting with MongoDB.
*   `models/event.py`: Pydantic model for event data.
*   `requirements.txt`: Python dependencies.
*   `.env`: (Not committed) Environment variables (API keys, DB URI).
*   `vercel.json`: Vercel deployment configuration.
*   `README.md`: This file.