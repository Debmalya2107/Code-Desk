import { Server } from 'socket.io';

export const setupSocket = (io: Server) => {
  io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    
    // Join project room
    socket.on('join_project', (projectId) => {
      socket.join(`project_${projectId}`);
      console.log(`Client ${socket.id} joined project ${projectId}`);
    });

    // Handle chat messages
    socket.on('send_message', async (data: { 
      content: string; 
      userId: string; 
      projectId: string 
    }) => {
      try {
        // Save message to database
        const response = await fetch(`${process.env.NEXTAUTH_URL}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            content: data.content,
            userId: data.userId,
            projectId: data.projectId
          })
        });

        if (response.ok) {
          const messageData = await response.json();
          
          // Broadcast to project room
          io.to(`project_${data.projectId}`).emit('new_message', {
            message: messageData.chatMessage
          });
        }
      } catch (error) {
        console.error('Failed to send message:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Client disconnected:', socket.id);
    });
  });
};