import { HubItem } from '../types';

export const initialDummyData: HubItem[] = [
  {
    id: '1',
    type: 'Video',
    title: 'Next.js 15 Full Course 2024',
    content: 'https://youtube.com/watch?v=example1',
    previewImage: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=500&q=80',
    dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
    isDeleted: false,
  },
  {
    id: '2',
    type: 'Message',
    title: 'WhatsApp Forward',
    content: 'Hey, don\'t forget to check out the new design specifications for the upcoming sprint. They are saved in the team drive.',
    dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    isDeleted: false,
  },
  {
    id: '3',
    type: 'PDF',
    title: 'Q3 Financial Report.pdf',
    content: 'https://drive.google.com/file/d/example2/view',
    dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    isDeleted: false,
  },
  {
    id: '4',
    type: 'Web Link',
    title: 'Figma - Collaborative interface design',
    content: 'https://figma.com',
    previewImage: 'https://images.unsplash.com/photo-1611162617474-5b21e879e113?w=500&q=80',
    dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 72).toISOString(),
    isDeleted: false,
  },
  {
    id: '5',
    type: 'Task',
    title: 'Review PRs',
    content: 'Review the 5 pending pull requests in the frontend repo before the weekend.',
    dateAdded: new Date(Date.now() - 1000 * 60 * 60 * 1).toISOString(),
    isDeleted: false,
  },
];
