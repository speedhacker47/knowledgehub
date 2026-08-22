export type Category = 'All' | 'Video' | 'PDF' | 'Message' | 'Web Link' | 'Task';

export interface HubItem {
  id: string;
  type: Category;
  title: string;
  content: string; // URL, WhatsApp text, or task details
  previewImage?: string; // Optional thumbnail
  dateAdded: string;
  isDeleted: boolean;
}
