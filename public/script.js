document.addEventListener('DOMContentLoaded', () => {
    const chatBox = document.getElementById('chat-box');
    const userInput = document.getElementById('user-input');
    const sendBtn = document.getElementById('send-btn');
    const fileInput = document.getElementById('file-input');
    const fileNameSpan = document.getElementById('file-name');
    const removeFileBtn = document.getElementById('remove-file-btn');

    let attachedFile = null;

    // --- Event Listeners ---
    sendBtn.addEventListener('click', handleSendMessage);
    userInput.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    });
    fileInput.addEventListener('change', handleFileAttachment);
    removeFileBtn.addEventListener('click', handleRemoveFile);

    // --- Functions ---
    function handleFileAttachment(event) {
        if (event.target.files.length > 0) {
            attachedFile = event.target.files[0];
            fileNameSpan.textContent = `File: ${attachedFile.name}`;
            removeFileBtn.style.display = 'inline-block';
        }
    }

    function handleRemoveFile() {
        attachedFile = null;
        fileInput.value = ''; // Reset file input
        fileNameSpan.textContent = '';
        removeFileBtn.style.display = 'none';
    }

    async function handleSendMessage() {
        const prompt = userInput.value.trim();
        // PERBAIKAN: Simpan file ke variabel lokal SEBELUM dihapus dari UI
        const fileToSend = attachedFile;

        if (!prompt && !fileToSend) return;

        displayMessage(prompt, 'user-message');
        
        // Bersihkan UI untuk pesan berikutnya
        userInput.value = '';
        handleRemoveFile();

        showLoadingIndicator();

        try {
            // PERBAIKAN: Gunakan variabel lokal 'fileToSend' untuk menentukan semuanya
            const apiEndpoint = getApiEndpoint(fileToSend);
            const requestBody = createRequestBody(prompt, fileToSend);
            const requestHeaders = getRequestHeaders(fileToSend);
            
            const response = await fetch(`http://localhost:3000${apiEndpoint}`, {
                method: 'POST',
                headers: requestHeaders,
                body: requestBody,
            });

            if (!response.ok) {
                const errData = await response.json();
                throw new Error(errData.error || `HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            removeLoadingIndicator();
            displayMessage(data.result, 'bot-message');

        } catch (error) {
            console.error('Error:', error);
            removeLoadingIndicator();
            displayMessage(`Maaf, terjadi kesalahan: ${error.message}`, 'bot-message');
        }
    }

    // PERBAIKAN: Fungsi sekarang menerima file sebagai argumen
    function getApiEndpoint(file) {
        if (!file) {
            return '/generate-text';
        }
        const fileType = file.type;
        if (fileType.startsWith('image/')) return '/generate-from-image';
        if (fileType.startsWith('audio/')) return '/generate-from-audio';
        return '/generate-from-document';
    }

    // PERBAIKAN: Fungsi sekarang menerima file sebagai argumen
    function createRequestBody(prompt, file) {
        if (!file) {
            return JSON.stringify({ prompt });
        }
        const formData = new FormData();
        formData.append('prompt', prompt);
        
        const endpoint = getApiEndpoint(file);
        const fieldName = endpoint.split('-').pop(); // 'image', 'audio', or 'document'
        formData.append(fieldName, file);
        return formData;
    }

    // PERBAIKAN: Fungsi sekarang menerima file sebagai argumen
    function getRequestHeaders(file) {
        if (!file) {
            return { 'Content-Type': 'application/json' };
        }
        return {}; // Untuk FormData, browser akan mengatur header secara otomatis
    }

    function displayMessage(message, className) {
        if (!message) return;
        const messageDiv = document.createElement('div');
        messageDiv.className = className;
        messageDiv.innerHTML = `<p>${message.replace(/\n/g, '<br>')}</p>`;
        chatBox.appendChild(messageDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function showLoadingIndicator() {
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'bot-message loading';
        loadingDiv.id = 'loading-indicator';
        loadingDiv.innerHTML = `<p><span></span><span></span><span></span></p>`;
        chatBox.appendChild(loadingDiv);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    function removeLoadingIndicator() {
        const indicator = document.getElementById('loading-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
});