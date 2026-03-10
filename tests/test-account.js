// Test script for account creation
const io = require('socket.io-client');

console.log('Testing account creation...');

const socket = io('http://localhost:3001');

socket.on('connect', () => {
    console.log('Connected to server!');
    
    // Test account creation
    console.log('Creating account: TestUser123');
    socket.emit('createAccount', {
        username: 'TestUser123',
        email: 'test@example.com',
        password: 'password123'
    });
});

socket.on('createSuccess', (data) => {
    console.log('✅ Account created successfully:', data);
    
    // Test character creation
    console.log('Creating character: Komodo131232153126312431212512');
    socket.emit('createCharacter', {
        name: 'Komodo131232153126312431212512',
        class: 'warrior'
    });
});

socket.on('createError', (data) => {
    console.log('❌ Error:', data);
    console.log('Code:', data.code);
    console.log('Message:', data.message);
    console.log('Short Explanation:', data.shortExplanation);
    console.log('Suggestion:', data.suggestion);
});

socket.on('disconnect', () => {
    console.log('Disconnected from server');
});

socket.on('connect_error', (error) => {
    console.log('Connection error:', error);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('Test timeout, disconnecting...');
    socket.disconnect();
    process.exit(0);
}, 10000);
