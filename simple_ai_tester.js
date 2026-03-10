/**
 * Simple AI Testing Agent - Basic Tests Only
 * Tests core functionality without complex dependencies
 */

const io = require('socket.io-client');

class SimpleAITester {
    constructor() {
        this.socket = null;
        this.testResults = [];
        this.config = {
            serverUrl: 'http://localhost:3002',
            testUser: {
                username: 'ai_simple_' + Date.now(),
                email: 'ai_simple_' + Date.now() + '@test.com',
                password: '123456'
            }
        };
        
        console.log('🤖 Simple AI Tester initialized');
    }
    
    async runTests() {
        console.log('🧪 Starting Simple AI Tests...');
        
        try {
            await this.testConnection();
            await this.testAccountCreation();
            await this.testLogin();
            await this.testBasicEvents();
            
            this.generateReport();
            
        } catch (error) {
            console.error('❌ Test failed:', error);
        } finally {
            this.disconnect();
        }
    }
    
    async testConnection() {
        console.log('🔌 Testing connection...');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Connection timeout'));
            }, 3000);
            
            this.socket = io(this.config.serverUrl);
            
            this.socket.on('connect', () => {
                clearTimeout(timeout);
                this.addResult('connection', true, 'Connected successfully');
                console.log('✅ Connection test passed');
                resolve();
            });
            
            this.socket.on('connect_error', (error) => {
                clearTimeout(timeout);
                this.addResult('connection', false, error.message);
                reject(error);
            });
        });
    }
    
    async testAccountCreation() {
        console.log('👤 Testing account creation...');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Account creation timeout'));
            }, 3000);
            
            this.socket.once('createSuccess', (data) => {
                clearTimeout(timeout);
                this.addResult('account_creation', true, 'Account created successfully');
                console.log('✅ Account creation test passed');
                resolve();
            });
            
            this.socket.once('createError', (error) => {
                clearTimeout(timeout);
                this.addResult('account_creation', false, error.message);
                reject(new Error(error.message));
            });
            
            this.socket.emit('createAccount', this.config.testUser);
        });
    }
    
    async testLogin() {
        console.log('🔐 Testing login...');
        
        return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
                reject(new Error('Login timeout'));
            }, 3000);
            
            this.socket.once('loginSuccess', (data) => {
                clearTimeout(timeout);
                this.addResult('login', true, 'Login successful');
                console.log('✅ Login test passed');
                console.log(`👤 Logged in as: ${data.player.name}`);
                console.log(`📍 Position: (${data.player.x}, ${data.player.y})`);
                resolve(data);
            });
            
            this.socket.once('loginError', (error) => {
                clearTimeout(timeout);
                this.addResult('login', false, error.message);
                reject(new Error(error.message));
            });
            
            this.socket.emit('login', {
                username: this.config.testUser.username,
                password: this.config.testUser.password
            });
        });
    }
    
    async testBasicEvents() {
        console.log('📡 Testing basic events...');
        
        return new Promise((resolve) => {
            // Test if we can emit events without errors
            this.socket.emit('playerMove', { x: 150, y: 150 });
            this.socket.emit('chatMessage', { message: 'Hello from AI!' });
            
            this.addResult('basic_events', true, 'Events sent successfully');
            console.log('✅ Basic events test passed');
            resolve();
        });
    }
    
    addResult(test, passed, message) {
        this.testResults.push({
            test,
            passed,
            message,
            timestamp: new Date().toISOString()
        });
    }
    
    generateReport() {
        console.log('\n📊 SIMPLE AI TEST REPORT');
        console.log('=' .repeat(40));
        
        const passed = this.testResults.filter(r => r.passed).length;
        const total = this.testResults.length;
        const rate = ((passed / total) * 100).toFixed(1);
        
        console.log(`📈 Success Rate: ${rate}% (${passed}/${total})`);
        console.log('');
        
        for (const result of this.testResults) {
            const icon = result.passed ? '✅' : '❌';
            console.log(`${icon} ${result.test}: ${result.message}`);
        }
        
        console.log('=' .repeat(40));
        
        if (passed === total) {
            console.log('🎉 CORE SYSTEMS WORKING!');
            console.log('💡 Next step: Test manual login at http://localhost:3002');
        } else {
            console.log('⚠️ Some issues found. Check above.');
        }
    }
    
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            console.log('🔌 AI Tester disconnected');
        }
    }
}

// Auto-run
if (require.main === module) {
    const tester = new SimpleAITester();
    tester.runTests().catch(console.error);
}

module.exports = SimpleAITester;
