import express from 'express';
import bodyParser from 'body-parser';
import http from 'http';
import { Server } from 'socket.io';

const app = express();
const PORT = 3000;

app.use(bodyParser.json()); // Parse JSON payloads
const server = http.createServer(app);
const io = new Server(server);

// Create an HTTP server and integrate Socket.IO

// Sample data for notifications
let notifications = {
  '12345': [],
  // Add more users and their notifications here
};

// Send Notification API
app.post('/api/notifications/send', (req, res) => {
  const { target, userId, message, source, timestamp } = req.body;

  const notification = {
    message,
    status: 'unread',
    timestamp,
  };

  if (target === 'specific' && userId) {
    // Targeted notification to a specific user
    notifications[userId].push(notification);
    // Emit notification to the specific user
    io.to(userId).emit('notification', notification);
    return res.status(201).send('Notification sent to user.');
  } else if (target === 'all_users') {
    // Broadcast notification to all users
    for (let user in notifications) {
      notifications[user].push(notification);
      // Emit notification to all connected clients
      io.emit('notification', notification);
    }
    return res.status(201).send('Notification sent to all users.');
  } else {
    return res.status(400).send('Invalid notification target.');
  }
});

// Fetch Notifications API
app.get('/api/notifications/:userId', (req, res) => {
  const { userId } = req.params;

  if (notifications[userId]) {
    return res.json(notifications[userId]);
  } else {
    return res.status(404).send('No notifications found for this user.');
  }
});

// Mark Notifications as Read API
app.post('/api/notifications/read', (req, res) => {
  const { userId, notificationIds } = req.body;

  if (notifications[userId]) {
    notifications[userId] = notifications[userId].map(notification => {
      if (notificationIds.includes(notification.message)) {
        return { ...notification, status: 'read' };
      }
      return notification;
    });
    return res.send('Notifications marked as read.');
  } else {
    return res.status(404).send('No notifications found for this user.');
  }
});

// Socket.IO connection
io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  
  // Join a specific user room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined the room`);
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

// Start server
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
