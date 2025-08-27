const appContainer = document.getElementById('app-container');
const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt-input');
const conversationView = document.getElementById('conversation-view');

/**
 * Adds a message to the conversation view.
 * @param {string} text - The text content of the message.
 * @param {'user' | 'ai'} sender - The sender of the message.
 */
function addMessage(text, sender) {
  const messageElement = document.createElement('div');
  messageElement.classList.add('message', `${sender}-message`);
  messageElement.textContent = text;
  conversationView.appendChild(messageElement);
  // Scroll to the bottom to see the latest message
  conversationView.scrollTop = conversationView.scrollHeight;
}

// --- Event Listeners for window behavior ---
appContainer.addEventListener('mouseenter', () => {
  window.electronAPI.setIgnoreMouseEvents(false);
});

appContainer.addEventListener('mouseleave', () => {
  // When the mouse leaves, it becomes click-through again
  window.electronAPI.setIgnoreMouseEvents(true, { forward: true });
});

// --- Form submission handler ---
promptForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const prompt = promptInput.value;
    if (!prompt) return;

    // Display the user's prompt immediately
    addMessage(prompt, 'user');
    promptInput.value = '';

    // Show a "thinking" message while waiting for the AI
    const thinkingMessage = document.createElement('div');
    thinkingMessage.classList.add('message', 'ai-message');
    thinkingMessage.textContent = 'Thinking...';
    conversationView.appendChild(thinkingMessage);
    conversationView.scrollTop = conversationView.scrollHeight;

    try {
        const aiResponse = await window.electronAPI.captureScreen(prompt);
        // Replace "thinking" message with the actual response
        thinkingMessage.textContent = aiResponse;
    } catch (error) {
        console.error('Error getting AI response:', error);
        // Replace "thinking" message with an error
        thinkingMessage.textContent = 'Sorry, I encountered an error.';
    }
});
