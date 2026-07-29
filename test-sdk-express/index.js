const express = require('express');
const { SequentialAI } = require('@sequential-ai/sdk');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Sequential SDK Test Server is running');
});

// Example route testing the SDK to query the main server
app.post('/test', async (req, res) => {
  try {
    // Initialize the SDK client
    // Pass custom baseURL if the main sequential server is running locally
    // For example: { apiKey: '...', baseURL: 'http://localhost:8000/api/v1' }
    const client = new SequentialAI({ 
        apiKey: process.env.SEQUENTIAL_API_KEY || 'test-api-key',
        baseURL: 'http://localhost:5000/api/v1' // Change if your server is elsewhere
    });
  
    console.log(`Querying sequential server at ${client.baseURL}...`);

    // Let's query the main sequential server by listing tasks
    const tasks = await client.tasks.list();
    
    res.json({ 
      success: true, 
      message: "Successfully queried the main sequential server!",
      clientBaseUrl: client.baseURL,
      data: tasks
    });
  } catch (error) {
    console.error('Error querying SDK:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// You can also add a route to create a task
app.post('/create-task', async (req, res) => {
  try {
    const client = new SequentialAI({ 
        apiKey: process.env.SEQUENTIAL_API_KEY || 'test-api-key',
        baseURL: 'http://localhost:5000/api/v1'
    });
    
    const task = await client.tasks.create({
        query: req.body.query || "What is the meaning of life?",
        mode: req.body.mode || "FAST",
        taskSpec: req.body.taskSpec || { returnType: "json" } // Example of taskSpec
    });
    
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// You can also add a route to get a specific task by its ID
app.get('/task/:id', async (req, res) => {
  try {
    const client = new SequentialAI({ 
        apiKey: process.env.SEQUENTIAL_API_KEY || 'test-api-key',
        baseURL: 'http://localhost:8000/api/v1'
    });
    
    const task = await client.tasks.retrieve(req.params.id);
    
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.listen(3000, () => {
  console.log(`Test Express server running at http://localhost:3000`);
  console.log(`Use POST /test to list tasks from the main sequential server`);
  console.log(`Use POST /test/create-task to create a new task`);
  console.log(`Use GET /test/task/:id to get a specific task`);
});
