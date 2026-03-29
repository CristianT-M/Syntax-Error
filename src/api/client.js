// @ts-nocheck
const initialRooms = [
  {
    id: 'room-1',
    name: 'iTECify Live Room',
    description: 'A collaborative prototyping workspace for team and AI',
    language: 'javascript',
    createdAt: '2026-03-28T00:00:00.000Z',
  },
  {
    id: 'room-2',
    name: 'Backend Sandbox',
    description: 'A secure, isolated environment for backend route generation',
    language: 'python',
    createdAt: '2026-03-28T00:00:00.000Z',
  },
];

let rooms = [...initialRooms];
let nextRoomId = 3;

export const apiClient = {
  auth: {
    me: async () => ({ id: 'guest', name: 'Guest User', role: 'admin' }),
    logout: async () => {},
    redirectToLogin: async () => {},
  },
  entities: {
    Room: {
      list: async () => {
        return rooms;
      },
      create: async (data) => {
        const room = {
          id: `room-${nextRoomId++}`,
          createdAt: new Date().toISOString(),
          ...data,
        };
        rooms = [room, ...rooms];
        return room;
      },
      delete: async (id) => {
        rooms = rooms.filter((room) => room.id !== id);
        return { success: true };
      },
    },
  },
};
