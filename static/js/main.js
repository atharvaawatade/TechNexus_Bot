// main.js - Main JavaScript functionality for TechNexus Bot

document.addEventListener('DOMContentLoaded', () => {
    // DOM elements
    const eventsListContainer = document.getElementById('events-list');
    const loadingIndicator = document.getElementById('loading');
    const errorMessage = document.getElementById('error-message');
    const searchInput = document.getElementById('search-input');
    const searchButton = document.getElementById('search-button');

    // Chat elements
    const chatHistory = document.getElementById('chat-history');
    const chatInput = document.getElementById('chat-input');
    const chatSendButton = document.getElementById('chat-send-button');
    const chatStatus = document.getElementById('chat-status');
    
    // Create floating bubbles
    const bubblesContainer = document.getElementById('bubbles');
    const createBubbles = () => {
        bubblesContainer.innerHTML = '';
        const bubbleCount = Math.floor(window.innerWidth / 30); // Responsive bubble count
        
        for (let i = 0; i < bubbleCount; i++) {
            const bubble = document.createElement('div');
            bubble.classList.add('bubble');
            
            // Random properties
            const size = Math.random() * 60 + 20; // 20-80px
            const left = Math.random() * 100; // 0-100%
            const delay = Math.random() * 5; // 0-5s delay
            const duration = Math.random() * 10 + 5; // 5-15s duration
            
            bubble.style.width = `${size}px`;
            bubble.style.height = `${size}px`;
            bubble.style.left = `${left}%`;
            bubble.style.animationDelay = `${delay}s`;
            bubble.style.animationDuration = `${duration}s`;
            
            bubblesContainer.appendChild(bubble);
        }
    };
    
    // Create bubbles on load and resize
    createBubbles();
    window.addEventListener('resize', createBubbles);
    
    // Add some random movement to bubbles for more dynamic effect
    const addRandomMovement = () => {
        const bubbles = document.querySelectorAll('.bubble');
        bubbles.forEach(bubble => {
            const randomX = (Math.random() - 0.5) * 20;
            bubble.style.transform = `translateX(${randomX}px) ${bubble.style.transform}`;
            
            // Reset after animation completes
            setTimeout(() => {
                if (bubble.parentNode) { // Check if bubble still exists
                    bubble.style.transform = bubble.style.transform.replace(`translateX(${randomX}px) `, '');
                }
            }, parseFloat(bubble.style.animationDuration) * 1000 * 0.8);
        });
        
        // Schedule next movement
        setTimeout(addRandomMovement, 3000 + Math.random() * 2000);
    };
    
    // Start random bubble movements
    setTimeout(addRandomMovement, 2000);

    // Function to format dates
    const formatDate = (isoString) => {
        if (!isoString) return 'N/A';
        const date = new Date(isoString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Function to display events
    const displayEvents = (events) => {
        eventsListContainer.innerHTML = '';
        
        if (!events || events.length === 0) {
            eventsListContainer.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 2rem;">No events found matching your search.</p>';
            return;
        }

        events.forEach(event => {
            const card = document.createElement('div');
            card.className = 'event-card';
            card.setAttribute('data-aos', 'fade-up'); // For animation

            const title = document.createElement('h3');
            title.textContent = event.name;

            const dates = document.createElement('p');
            dates.className = 'dates';
            dates.textContent = `${formatDate(event.start_date)} - ${formatDate(event.end_date)}`;

            const location = document.createElement('p');
            location.className = 'location';
            location.textContent = event.location || 'Online';

            const description = document.createElement('p');
            description.className = 'description';
            description.textContent = event.description || 'No description available.';

            const link = document.createElement('a');
            link.href = event.registration_link || '#';
            link.textContent = 'View Event / Register';
            link.target = '_blank'; // Open in new tab
            link.rel = 'noopener noreferrer';
            link.className = 'register-button'; // Add class for button styling

            card.appendChild(title);
            card.appendChild(dates);
            card.appendChild(location);
            card.appendChild(description);
            card.appendChild(link);

            // Add 3D tilt effect on mouse movement
            card.addEventListener('mousemove', (e) => {
                const rect = card.getBoundingClientRect();
                const x = e.clientX - rect.left; // x position within the element
                const y = e.clientY - rect.top; // y position within the element
                
                const centerX = rect.width / 2;
                const centerY = rect.height / 2;
                
                const rotateX = (y - centerY) / 20; // Adjust divisor for more/less tilt
                const rotateY = (centerX - x) / 20;
                
                card.style.transform = `perspective(1000px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) translateY(-10px)`;
            });
            
            // Reset transform on mouse leave
            card.addEventListener('mouseleave', () => {
                card.style.transform = '';
                setTimeout(() => {
                    card.style.transform = 'translateY(-10px) rotateX(5deg)';
                }, 300);
            });

            eventsListContainer.appendChild(card);
        });
    };

    // Fetch all events
    const fetchEvents = async () => {
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
        eventsListContainer.innerHTML = '';

        try {
            const response = await fetch('/api/events');
            if (!response.ok) {
                throw new Error(`HTTP error ${response.status}`);
            }
            const data = await response.json();
            if (data.error) {
                throw new Error(`API Error: ${data.error}`);
            }
            loadingIndicator.style.display = 'none';
            displayEvents(data);
        } catch (error) {
            console.error('Failed to fetch events:', error);
            loadingIndicator.style.display = 'none';
            errorMessage.textContent = `Failed to load events: ${error.message}`;
            errorMessage.style.display = 'block';
        }
    };

    // --- Chat Functions ---
    const addChatMessage = (message, sender) => {
        const messageDiv = document.createElement('div');
        messageDiv.classList.add('chat-message', `${sender}-message`);
        messageDiv.textContent = message;
        chatHistory.appendChild(messageDiv);
        // Scroll to bottom
        chatHistory.scrollTop = chatHistory.scrollHeight;
    };

    const showTypingIndicator = () => {
        const indicatorDiv = document.createElement('div');
        indicatorDiv.classList.add('chat-message', 'assistant-message', 'typing-indicator-container');
        
        const typingIndicator = document.createElement('div');
        typingIndicator.classList.add('typing-indicator');
        
        // Add the three dots
        for (let i = 0; i < 3; i++) {
            const dot = document.createElement('span');
            typingIndicator.appendChild(dot);
        }
        
        indicatorDiv.appendChild(typingIndicator);
        chatHistory.appendChild(indicatorDiv);
        chatHistory.scrollTop = chatHistory.scrollHeight;
        
        return indicatorDiv;
    };
    
    const removeTypingIndicator = () => {
        const indicator = chatHistory.querySelector('.typing-indicator-container');
        if (indicator) {
            indicator.remove();
        }
    };

    const sendChatMessage = async () => {
        const query = chatInput.value.trim();
        if (!query) return;

        addChatMessage(query, 'user');
        chatInput.value = ''; // Clear input
        chatSendButton.disabled = true;
        
        // Show typing indicator instead of text status
        const typingIndicator = showTypingIndicator();

        try {
            const response = await fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ query }),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle HTTP errors (like 503, 500, 400) from FastAPI
                throw new Error(data.detail || `HTTP error ${response.status}`);
            }

            // Remove typing indicator before adding the response
            removeTypingIndicator();
            
            if (data.response) {
                addChatMessage(data.response, 'assistant');
            } else {
                throw new Error('Received empty response from server.');
            }

        } catch (error) {
            console.error('Chat error:', error);
            // Remove typing indicator in case of error
            removeTypingIndicator();
            addChatMessage(`Error: ${error.message}`, 'assistant');
        } finally {
            chatSendButton.disabled = false;
            chatStatus.textContent = ''; // Clear status
        }
    };

    chatSendButton.addEventListener('click', sendChatMessage);
    chatInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendChatMessage();
        }
    });
    // --- End Chat Functions ---

    // Event listener for search
    const performSearch = () => {
        const keyword = searchInput.value.trim();
        if (!keyword) {
            fetchEvents(); // If empty, fetch all events
            return;
        }

        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
        eventsListContainer.innerHTML = '';

        fetch(`/api/search?keyword=${encodeURIComponent(keyword)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                loadingIndicator.style.display = 'none';
                displayEvents(data);
            })
            .catch(error => {
                console.error('Search error:', error);
                loadingIndicator.style.display = 'none';
                errorMessage.textContent = `Search failed: ${error.message}`;
                errorMessage.style.display = 'block';
            });
    };

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            performSearch();
        }
    });

    // Initial fetch of events
    fetchEvents();
});
